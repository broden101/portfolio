// Server-side agent execution logic
// Ported from lib/agent-portfolio.ts — runs in API routes, not browser

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
  const closeNearHigh = stock.high > 0 && ((stock.high - stock.close) / stock.high) * 100 <= 3;
  const volRatio = stock.avg_vol_10d > 0 ? stock.volume / stock.avg_vol_10d : 0;
  return closeNearHigh && volRatio >= 1.2 && stock.close >= stock.vwap && stock.rsi >= 35 && stock.rsi <= 70;
}

/** Reversal — oversold + MACD golden cross */
export function dondonFilter(stock: StockRow): boolean {
  return stock.rsi < 35 && (stock.macd - stock.macd_signal) > 0;
}

/** Uptrend + VWAP — trending bullish */
export function ragaCCFilter(stock: StockRow): boolean {
  return stock.close > stock.sma20 && stock.sma20 > stock.sma50 && stock.close > stock.vwap;
}

/** AntekAsing — foreign accumulation.
 *  Returns a filter function that checks if stock is in today's foreign accumulation list.
 *  Also adds minimum quality: harga > 50 (avoid penny), RSI wajar (30-75). */
export function antekAsingFilter(accumulatedTickers: Set<string>): (s: StockRow) => boolean {
  return (stock: StockRow) =>
    accumulatedTickers.has(stock.name) &&
    stock.close > 50 &&
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

/** Regular market hours: 09:00-15:45 WIB (covers pre-close) */
export function isMarketHours(): boolean {
  const wib = wibDate();
  const day = wib.getUTCDay();
  const hour = wib.getUTCHours();
  if (day === 0 || day === 6) return false;
  // 09:00-15:59 WIB — covers BSJP afternoon buy at 15:30
  return hour >= 9 && hour < 16;
}

/** BSJP morning sell window: 09:30-09:59 WIB */
export function isMorningWindow(): boolean {
  return wibHour() === 9 && wibMinute() >= 30;
}

/** BSJP afternoon buy window: 15:30-15:45 WIB */
export function isAfternoonWindow(): boolean {
  return wibHour() === 15 && wibMinute() >= 30 && wibMinute() < 45;
}

export function getWibTime(): string {
  return wibDate().toISOString().replace("T", " ").substring(0, 19) + " WIB";
}

// ─── Execution constants ───────────────────────────────────────────

const POSITION_SIZE = 25_000_000; // Rp 25jt per trade
const MAX_POSITIONS = 4;
const CL_PCT = -0.03; // PATEN — cut loss -3%

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

  // ── BSJP special handling ────────────────────────────────────────
  if (agent.strategy === "bsjp") {
    if (isMorningWindow()) {
      return sellAll(agentId, stockData, "BSJP force sell pagi");
    }
    if (isAfternoonWindow()) {
      return buySignals(agentId, agent.cash, stockData, strategyFilter);
    }
    return { agentId, buys: 0, sells: 0, details: ["BSJP: tunggu jam buy (15:30) atau sell (09:00)"] };
  }

  // ── Normal execution (Dondon/ragaCC/AntekAsing) ─────────────────
  let cash = agent.cash;
  let buys = 0;
  let sells = 0;
  const details: string[] = [];

  // Step 1: Check CL & price action tiap posisi
  const positions = await prisma.position.findMany({ where: { agentId } });
  const heldTickers = new Set(positions.map((p) => p.ticker));

  for (const pos of positions) {
    const stock = stockData.find((s) => s.name === pos.ticker);
    if (!stock) continue;

    const pnlPct = (stock.close - pos.avgPrice) / pos.avgPrice;
    let sellReason = "";

    // Update peak P&L (buat trailing TP nanti)
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
    // ── Priority 2: Price action TP ────────────────────────────────
    // Jual kalo harga turun di bawah level penting, meski masih profit
    else if (pnlPct > 0 && stock.close < stock.vwap) {
      sellReason = `TP — profit ${(pnlPct * 100).toFixed(1)}%, close < VWAP (${stock.vwap})`;
    }
    else if (pnlPct > 0 && stock.close < stock.sma20) {
      sellReason = `TP — profit ${(pnlPct * 100).toFixed(1)}%, break SMA20 (${stock.sma20})`;
    }
    else if (pnlPct > 0 && stock.rsi < 40) {
      sellReason = `TP — profit ${(pnlPct * 100).toFixed(1)}%, RSI turun ke ${stock.rsi}`;
    }
    // ── Priority 3: Trailing safety (kalo udah profit gede trus turun balik) ──
    else if (pnlPct > 0.03 && pnlPct < newPeak - 0.02) {
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

  // Update cash
  await prisma.agent.update({ where: { id: agentId }, data: { cash } });

  return { agentId, buys, sells, details };
}

// ─── BSJP helpers ──────────────────────────────────────────────────

/**
 * BSJP buy at 15:30 WIB — liquidate sisa, beli signal baru.
 */
async function buySignals(
  agentId: string,
  cash: number,
  stockData: StockRow[],
  filter: (s: StockRow) => boolean,
): Promise<ExecuteResult> {
  const details: string[] = ["BSJP: beli sore"];
  let buys = 0;

  // Liquidate leftover positions
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

  // Scan & buy signals
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
      prisma.position.create({
        data: { agentId, ticker: stock.name, qty: lots, avgPrice: stock.close },
      }),
      prisma.transaction.create({
        data: { agentId, ticker: stock.name, side: "buy", qty: lots, price: stock.close, reason: "bsjp" },
      }),
    ]);
    buys++;
    details.push(`BUY ${stock.name} ${lots} lot @ ${stock.close}`);
  }

  await prisma.agent.update({ where: { id: agentId }, data: { cash } });
  return { agentId, buys, sells: 0, details };
}

/**
 * BSJP sell all at 09:00-09:30 WIB — force sell.
 */
async function sellAll(
  agentId: string,
  stockData: StockRow[],
  reason: string,
): Promise<ExecuteResult> {
  const details: string[] = [];
  let sells = 0;
  let newCash = 0;

  const positions = await prisma.position.findMany({ where: { agentId } });
  if (positions.length === 0) {
    return { agentId, buys: 0, sells: 0, details: ["BSJP: no position to sell"] };
  }

  for (const pos of positions) {
    const stock = stockData.find((s) => s.name === pos.ticker);
    const price = stock?.close ?? pos.avgPrice;
    const value = price * pos.qty * 100;
    const pnl = (price - pos.avgPrice) * pos.qty * 100;
    newCash += value;

    await prisma.$transaction([
      prisma.position.delete({ where: { agentId_ticker: { agentId, ticker: pos.ticker } } }),
      prisma.transaction.create({
        data: { agentId, ticker: pos.ticker, side: "sell", qty: pos.qty, price, reason, pnl },
      }),
    ]);
    sells++;
    const sign = pnl >= 0 ? "+" : "";
    details.push(`SELL ${pos.ticker} ${pos.qty} lot @ ${price} — ${sign}${(pnl / 1_000_000).toFixed(1)}jt`);
  }

  await prisma.agent.update({ where: { id: agentId }, data: { cash: newCash } });
  return { agentId, buys: 0, sells, details };
}
