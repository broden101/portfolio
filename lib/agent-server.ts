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

export function bertotFilter(stock: StockRow): boolean {
  const closeNearHigh = stock.high > 0 && ((stock.high - stock.close) / stock.high) * 100 <= 3;
  const volRatio = stock.avg_vol_10d > 0 ? stock.volume / stock.avg_vol_10d : 0;
  return closeNearHigh && volRatio >= 1.2 && stock.close >= stock.vwap && stock.rsi >= 35 && stock.rsi <= 70;
}

export function dondonFilter(stock: StockRow): boolean {
  return stock.rsi < 35 && (stock.macd - stock.macd_signal) > 0;
}

export function ragaCCFilter(stock: StockRow): boolean {
  return stock.close > stock.sma20 && stock.sma20 > stock.sma50 && stock.close > stock.vwap;
}

// ─── Market hours guard ────────────────────────────────────────────

export function isMarketHours(): boolean {
  const now = new Date();
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const day = wib.getUTCDay(); // 0=Sun, 6=Sat
  const hour = wib.getUTCHours();
  if (day === 0 || day === 6) return false;
  return hour >= 9 && hour < 15;
}

export function getWibTime(): string {
  const now = new Date();
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return wib.toISOString().replace("T", " ").substring(0, 19) + " WIB";
}

// ─── Execute one agent ─────────────────────────────────────────────

const POSITION_SIZE = 25_000_000; // Rp 25jt per trade
const MAX_POSITIONS = 4;
const CL_PCT = -0.03;
const TP_PCT = 0.04;

interface ExecuteResult {
  agentId: string;
  buys: number;
  sells: number;
  details: string[];
}

export async function executeAgent(
  agentId: string,
  stockData: StockRow[],
  strategyFilter: (s: StockRow) => boolean,
): Promise<ExecuteResult> {
  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) return { agentId, buys: 0, sells: 0, details: ["Agent not found"] };

  let cash = agent.cash;
  let buys = 0;
  let sells = 0;
  const details: string[] = [];

  // Step 1: Check CL/TP on existing holdings
  const positions = await prisma.position.findMany({ where: { agentId } });
  const heldTickers = new Set(positions.map((p) => p.ticker));
  const openSlots = MAX_POSITIONS - positions.length;

  for (const pos of positions) {
    const stock = stockData.find((s) => s.name === pos.ticker);
    if (!stock) continue;

    const pnlPct = (stock.close - pos.avgPrice) / pos.avgPrice;
    let sellReason = "";
    if (pnlPct <= CL_PCT) sellReason = `CL ${(pnlPct * 100).toFixed(1)}%`;
    else if (pnlPct >= TP_PCT) sellReason = `TP +${(pnlPct * 100).toFixed(1)}%`;

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

  // Step 2: Try to buy new signals
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
      heldTickers.add(stock.name);
      details.push(`BUY ${stock.name} ${lots} lot @ ${stock.close}`);
    }
  }

  // Update cash
  await prisma.agent.update({ where: { id: agentId }, data: { cash } });

  return { agentId, buys, sells, details };
}
