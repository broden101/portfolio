// Agent learning & evolution — evolve sellTrigger and minProfitToSell from trade log

import { prisma } from "./db";

export interface StockRow {
  name: string;
  close: number;
  high: number;
  volume: number;
  avg_vol_10d: number;
  vwap: number;
  rsi: number;
  sma20: number;
  sma50: number;
  macd: number;
  macd_signal: number;
  mcap: number;
}

// ─── Strategy filters ──────────────────────────────────────────────

/** BSJP — Beli Sore Jual Pagi: momentum kuat jelang tutup */
export function bertotFilter(stock: StockRow): boolean {
  if (stock.close <= HARGA_MIN) return false;
  const closeNearHigh = stock.high > 0 && ((stock.high - stock.close) / stock.high) * 100 <= 3;
  const volRatio = stock.avg_vol_10d > 0 ? stock.volume / stock.avg_vol_10d : 0;
  return closeNearHigh && volRatio >= 1.2 && stock.close >= stock.vwap && stock.rsi >= 35 && stock.rsi <= 70;
}

/** Reversal — oversold + MACD golden cross */
export function dondonFilter(stock: StockRow): boolean {
  if (stock.close <= HARGA_MIN) return false;
  return stock.rsi < 35 && (stock.macd - stock.macd_signal) > 0;
}

/** Uptrend + VWAP — trending bullish */
export function ragaCCFilter(stock: StockRow): boolean {
  if (stock.close <= HARGA_MIN) return false;
  return stock.close > stock.sma20 && stock.sma20 > stock.sma50 && stock.close > stock.vwap;
}

/** AntekAsing — foreign accumulation. */
export function antekAsingFilter(accumulatedTickers: Set<string>): (s: StockRow) => boolean {
  return (stock: StockRow) =>
    stock.close > HARGA_MIN &&
    accumulatedTickers.has(stock.name) &&
    stock.rsi >= 30 &&
    stock.rsi <= 75;
}

/** Konglomerasi — conglomerate stocks with uptrend+VWAP filter. */
export function konglomerasiFilter(kongloTickers: Set<string>): (s: StockRow) => boolean {
  return (stock: StockRow) =>
    stock.close > HARGA_MIN &&
    kongloTickers.has(stock.name) &&
    stock.close > stock.vwap &&
    stock.rsi >= 30 &&
    stock.rsi <= 75;
}

// ─── WIB time helpers ──────────────────────────────────────────────

function wibDate(): Date {
  const now = new Date();
  return new Date(now.getTime() + 7 * 60 * 60 * 1000);
}

function wibHour(): number {
  return wibDate().getUTCHours();
}

function wibMinute(): number {
  return wibDate().getUTCMinutes();
}

export function isMarketHours(): boolean {
  const wib = wibDate();
  const day = wib.getUTCDay();
  const hour = wib.getUTCHours();
  if (day === 0 || day === 6) return false;
  return hour >= 9 && hour < 16;
}

export function isMorningWindow(): boolean {
  return wibHour() === 9 && wibMinute() >= 30;
}

export function isAfternoonWindow(): boolean {
  return wibHour() === 15 && wibMinute() >= 30 && wibMinute() < 45;
}

export function getWibTime(): string {
  return wibDate().toISOString().replace("T", " ").substring(0, 19) + " WIB";
}

// ─── Execution constants ───────────────────────────────────────────

const POSITION_SIZE = 25_000_000; // Rp 25jt per trade
const MAX_POSITIONS = 4;
const CL_PCT = -0.03; // PATEN
const HARGA_MIN = 400; // minimal harga saham

interface ExecuteResult {
  agentId: string;
  buys: number;
  sells: number;
  details: string[];
}

// ─── Core execution ────────────────────────────────────────────────

export async function executeAgent(
  agentId: string,
  stockData: StockRow[],
  strategyFilter: (s: StockRow) => boolean,
): Promise<ExecuteResult> {
  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) return { agentId, buys: 0, sells: 0, details: ["Agent not found"] };

  // Load evolved params
  const sellTrigger = agent.sellTrigger;    // "vwap" | "sma20" | "rsi"
  const minProfit = agent.minProfitToSell;  // minimal profit % before sell trigger aktif

  // ── BSJP — no evolution, fixed schedule ──────────────────────────
  if (agent.strategy === "bsjp") {
    if (isMorningWindow()) return sellAll(agentId, stockData, "BSJP force sell pagi");
    if (isAfternoonWindow()) return buySignals(agentId, agent.cash, stockData, strategyFilter);
    return { agentId, buys: 0, sells: 0, details: ["BSJP: tunggu jam buy (15:30) atau sell (09:00)"] };
  }

  // ── Normal execution ────────────────────────────────────────────
  let cash = agent.cash;
  let buys = 0;
  let sells = 0;
  const details: string[] = [];

  // Step 1: Check each position — CL or TP based on price action
  const positions = await prisma.position.findMany({ where: { agentId } });
  const heldTickers = new Set(positions.map((p) => p.ticker));

  for (const pos of positions) {
    const stock = stockData.find((s) => s.name === pos.ticker);
    if (!stock) continue;

    const pnlPct = (stock.close - pos.avgPrice) / pos.avgPrice;
    let sellReason = "";

    // Update peak P&L
    const newPeak = Math.max(pos.peakPnlPct, pnlPct);
    if (newPeak > pos.peakPnlPct) {
      await prisma.position.update({
        where: { agentId_ticker: { agentId, ticker: pos.ticker } },
        data: { peakPnlPct: newPeak },
      });
    }

    // ── Priority 1: CL -3% paten ──────────────────────────────────
    if (pnlPct <= CL_PCT) {
      sellReason = `CL ${(pnlPct * 100).toFixed(1)}%`;
    }
    // ── Priority 1.5: Harga di bawah 400 — jual ────────────────────
    else if (stock.close < HARGA_MIN) {
      sellReason = `Harga ${stock.close} < ${HARGA_MIN} — jual`;
    }
    // ── Priority 2: Price action TP ────────────────────────────────
    else if (pnlPct >= minProfit) {
      if (sellTrigger === "vwap" && stock.close < stock.vwap) {
        sellReason = `TP (vwap) — profit ${(pnlPct * 100).toFixed(1)}%, close < VWAP`;
      }
      else if (sellTrigger === "sma20" && stock.close < stock.sma20) {
        sellReason = `TP (sma20) — profit ${(pnlPct * 100).toFixed(1)}%, break SMA20`;
      }
      else if (sellTrigger === "rsi" && stock.rsi < 40) {
        sellReason = `TP (rsi) — profit ${(pnlPct * 100).toFixed(1)}%, RSI turun ke ${stock.rsi}`;
      }
      // Fallback: cek semua trigger kalo utama ga aktif
      else if (stock.close < stock.vwap) {
        sellReason = `TP (vwap fallback) — profit ${(pnlPct * 100).toFixed(1)}%, close < VWAP`;
      }
      else if (stock.close < stock.sma20) {
        sellReason = `TP (sma20 fallback) — profit ${(pnlPct * 100).toFixed(1)}%, break SMA20`;
      }
      else if (stock.rsi < 40) {
        sellReason = `TP (rsi fallback) — profit ${(pnlPct * 100).toFixed(1)}%, RSI ${stock.rsi}`;
      }
    }
    // ── Priority 3: Trailing safety ────────────────────────────────
    else if (pnlPct > 0.03 && pnlPct < newPeak - 0.02) {
      sellReason = `Trailing — profit ${(pnlPct * 100).toFixed(1)}% (peak +${(newPeak * 100).toFixed(1)}%)`;
    }
    else if (pnlPct > 0 && pnlPct < newPeak - 0.03) {
      sellReason = `Trailing — profit ${(pnlPct * 100).toFixed(1)}% (peak +${(newPeak * 100).toFixed(1)}%)`;
    }

    if (sellReason) {
      const totalValue = stock.close * pos.qty * 100;
      const buyValue = pos.avgPrice * pos.qty * 100;
      const pnl = totalValue - buyValue;
      cash += totalValue;

      await prisma.$transaction([
        prisma.position.delete({ where: { agentId_ticker: { agentId, ticker: pos.ticker } } }),
        prisma.transaction.create({
          data: { agentId, ticker: pos.ticker, side: "sell", qty: pos.qty, price: stock.close, reason: sellReason, pnl },
        }),
      ]);
      sells++;
      details.push(`SELL ${pos.ticker} @ ${stock.close} — ${sellReason}`);
    }
  }

  // Reload positions after sells
  const remaining = await prisma.position.findMany({ where: { agentId } });
  const currentSlots = MAX_POSITIONS - remaining.length;
  const currentHeld = new Set(remaining.map((p) => p.ticker));

  // Step 2: Buy new signals
  if (currentSlots > 0) {
    const signals = stockData
      .filter((s) => strategyFilter(s) && !currentHeld.has(s.name))
      .sort((a, b) => b.mcap - a.mcap);

    for (const stock of signals) {
      if (buys >= currentSlots) break;
      if (stock.close <= 0) continue;

      const lots = Math.floor(POSITION_SIZE / (stock.close * 10000)) * 100;
      if (lots <= 0) continue;

      const cost = stock.close * lots * 100;
      if (cost > cash) continue;

      cash -= cost;

      await prisma.$transaction([
        prisma.position.create({
          data: { agentId, ticker: stock.name, qty: lots, avgPrice: stock.close },
        }),
        prisma.transaction.create({
          data: { agentId, ticker: stock.name, side: "buy", qty: lots, price: stock.close, reason: agent.strategy },
        }),
      ]);
      buys++;
      currentHeld.add(stock.name);
      details.push(`BUY ${stock.name} ${lots} lot @ ${stock.close}`);
    }
  }

  await prisma.agent.update({ where: { id: agentId }, data: { cash } });

  // ── Learning: analisa trade → evolve trigger ────────────────────
  if (sells > 0) {
    const learnResults = await runLearning(agentId);
    for (const lr of learnResults) details.push(lr);
  }

  return { agentId, buys, sells, details };
}

// ─── Learning / Evolution ──────────────────────────────────────────

/**
 * Analisa hasil jual → evolve sellTrigger & minProfitToSell.
 * Parameter belajar: trigger mana yg hasil paling bagus.
 */
async function runLearning(agentId: string): Promise<string[]> {
  const sells = await prisma.transaction.findMany({
    where: { agentId, side: "sell", pnl: { not: null } },
    orderBy: { executedAt: "desc" },
    take: 30,
  });

  if (sells.length < 5) return [];

  const results: string[] = [];
  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) return [];

  // ── Group sells by trigger type ─────────────────────────────────
  const triggerPnl: Record<string, number[]> = {};
  for (const s of sells) {
    const reason = s.reason || "";
    let trigger = "other";
    if (reason.startsWith("CL")) trigger = "cl";
    else if (reason.includes("vwap")) trigger = "vwap";
    else if (reason.includes("sma20") || reason.includes("SMA20")) trigger = "sma20";
    else if (reason.includes("RSI") || reason.includes("rsi")) trigger = "rsi";
    else if (reason.startsWith("Trailing")) trigger = "trailing";
    else if (reason.startsWith("TP (vwap")) trigger = "vwap";
    else if (reason.startsWith("TP (sma20")) trigger = "sma20";
    else if (reason.startsWith("TP (rsi")) trigger = "rsi";

    if (!triggerPnl[trigger]) triggerPnl[trigger] = [];
    triggerPnl[trigger].push(s.pnl ?? 0);
  }

  // ── Calc avg per trigger ────────────────────────────────────────
  const triggerStats: Record<string, { avg: number; count: number }> = {};
  for (const [trig, pnls] of Object.entries(triggerPnl)) {
    if (trig === "other") continue;
    triggerStats[trig] = {
      avg: pnls.reduce((s, v) => s + v, 0) / pnls.length,
      count: pnls.length,
    };
  }

  // ── Evolve: pilih trigger dgn avg pnl tertinggi ────────────────
  let bestTrigger = agent.sellTrigger;
  let bestAvg = -Infinity;
  for (const [trig, stats] of Object.entries(triggerStats)) {
    if (trig === "cl") continue; // CL paten, bukan pilihan
    if (stats.avg > bestAvg && stats.count >= 3) {
      bestAvg = stats.avg;
      bestTrigger = trig;
    }
  }

  if (bestTrigger !== agent.sellTrigger && sells.length >= 10) {
    await prisma.agent.update({
      where: { id: agentId },
      data: { sellTrigger: bestTrigger, evolutionGen: { increment: 1 } },
    });
    results.push(`🧬 Evolve #${agent.evolutionGen + 1}: trigger ${agent.sellTrigger} → ${bestTrigger}`);
  }

  // ── Evolve: adjust minProfitToSell ──────────────────────────────
  const wins = sells.filter((t) => (t.pnl ?? 0) > 0);
  const losses = sells.filter((t) => (t.pnl ?? 0) <= 0);
  const winRate = wins.length / sells.length;
  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + (t.pnl ?? 0), 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + (t.pnl ?? 0), 0) / losses.length) : 0;

  let newMinProfit = agent.minProfitToSell;
  // Banyak rugi → jual lebih awal (turunin minProfit)
  if (winRate < 0.35 && avgLoss > avgWin && sells.length >= 8) {
    newMinProfit = Math.max(-0.01, newMinProfit - 0.005);
    if (newMinProfit !== agent.minProfitToSell) {
      await prisma.agent.update({
        where: { id: agentId },
        data: { minProfitToSell: newMinProfit },
      });
      results.push(`🧬 Turun minProfit: ${(agent.minProfitToSell * 100).toFixed(1)}% → ${(newMinProfit * 100).toFixed(1)}%`);
    }
  }
  // Sering menang tp profit kecil → tahan lebih lama (naikin minProfit)
  else if (winRate > 0.65 && avgWin > 0 && avgWin < 500_000 && sells.length >= 8) {
    newMinProfit = Math.min(0.02, newMinProfit + 0.005);
    if (newMinProfit !== agent.minProfitToSell) {
      await prisma.agent.update({
        where: { id: agentId },
        data: { minProfitToSell: newMinProfit },
      });
      results.push(`🧬 Naik minProfit: ${(agent.minProfitToSell * 100).toFixed(1)}% → ${(newMinProfit * 100).toFixed(1)}%`);
    }
  }

  // ── Simpan log belajar ──────────────────────────────────────────
  const logEntry = {
    time: getWibTime(),
    totalSells: sells.length,
    winRate: +(winRate * 100).toFixed(1),
    winRateLabel: winRate > 0.6 ? "baik" : winRate < 0.4 ? "buruk" : "netral",
    triggerStats: Object.entries(triggerStats).map(([t, s]) => ({
      trigger: t,
      avgPnlRp: +s.avg.toFixed(0),
      count: s.count,
    })),
  };

  const existingLog = (agent.learningLog as any[]) || [];
  const updatedLog = [logEntry, ...existingLog].slice(0, 50);
  await prisma.agent.update({
    where: { id: agentId },
    data: { learningLog: updatedLog as any },
  });

  return results;
}

// ─── BSJP helpers ──────────────────────────────────────────────────

async function buySignals(
  agentId: string,
  cash: number,
  stockData: StockRow[],
  filter: (s: StockRow) => boolean,
): Promise<ExecuteResult> {
  const details: string[] = ["BSJP: beli sore"];
  let buys = 0;

  const existing = await prisma.position.findMany({ where: { agentId } });
  for (const pos of existing) {
    const stock = stockData.find((s) => s.name === pos.ticker);
    const price = stock?.close ?? pos.avgPrice;
    const pnl = stock ? (stock.close - pos.avgPrice) * pos.qty * 100 : 0;
    cash += price * pos.qty * 100;
    await prisma.$transaction([
      prisma.position.delete({ where: { agentId_ticker: { agentId, ticker: pos.ticker } } }),
      prisma.transaction.create({
        data: { agentId, ticker: pos.ticker, side: "sell", qty: pos.qty, price, reason: "BSJP liquidate", pnl },
      }),
    ]);
    details.push(`LIQUIDATE ${pos.ticker} ${pos.qty} lot @ ${price}`);
  }

  const signals = stockData.filter((s) => filter(s)).sort((a, b) => b.mcap - a.mcap);
  for (const stock of signals) {
    if (buys >= MAX_POSITIONS) break;
    if (stock.close <= 0) continue;
    const lots = Math.floor(POSITION_SIZE / (stock.close * 10000)) * 100;
    if (lots <= 0) continue;
    const cost = stock.close * lots * 100;
    if (cost > cash) continue;
    cash -= cost;
    await prisma.$transaction([
      prisma.position.create({ data: { agentId, ticker: stock.name, qty: lots, avgPrice: stock.close } }),
      prisma.transaction.create({ data: { agentId, ticker: stock.name, side: "buy", qty: lots, price: stock.close, reason: "bsjp" } }),
    ]);
    buys++;
    details.push(`BUY ${stock.name} ${lots} lot @ ${stock.close}`);
  }

  await prisma.agent.update({ where: { id: agentId }, data: { cash } });
  return { agentId, buys, sells: 0, details };
}

async function sellAll(agentId: string, stockData: StockRow[], reason: string): Promise<ExecuteResult> {
  const details: string[] = [];
  let sells = 0;
  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  let newCash = agent?.cash ?? 0;

  const positions = await prisma.position.findMany({ where: { agentId } });
  if (positions.length === 0) return { agentId, buys: 0, sells: 0, details: ["BSJP: no position to sell"] };

  for (const pos of positions) {
    const stock = stockData.find((s) => s.name === pos.ticker);
    const price = stock?.close ?? pos.avgPrice;
    const value = price * pos.qty * 100;
    const pnl = (price - pos.avgPrice) * pos.qty * 100;
    newCash += value;
    await prisma.$transaction([
      prisma.position.delete({ where: { agentId_ticker: { agentId, ticker: pos.ticker } } }),
      prisma.transaction.create({ data: { agentId, ticker: pos.ticker, side: "sell", qty: pos.qty, price, reason, pnl } }),
    ]);
    sells++;
    const sign = pnl >= 0 ? "+" : "";
    details.push(`SELL ${pos.ticker} ${pos.qty} lot @ ${price} — ${sign}${(pnl / 1_000_000).toFixed(1)}jt`);
  }

  await prisma.agent.update({ where: { id: agentId }, data: { cash: newCash } });
  return { agentId, buys: 0, sells, details };
}
