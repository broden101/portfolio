// Tradebook types and localStorage persistence

export interface Trade {
  id: string;
  ticker: string;
  side: "BUY" | "SELL";
  price: number;
  quantity: number;
  date: string; // YYYY-MM-DD
  notes?: string;
  createdAt: number;
}

export interface Position {
  ticker: string;
  avgPrice: number;
  quantity: number;
  totalCost: number;
  trades: Trade[];
}

export interface PortfolioSnapshot {
  initialCapital: number;
  cash: number;
  positions: Position[];
  trades: Trade[];
  equity: number; // cash + market value of positions
}

const STORAGE_KEY = "raga-tradebook";

function getDefaultPortfolio(): PortfolioSnapshot {
  return {
    initialCapital: 100_000_000, // IDR 100 juta
    cash: 100_000_000,
    positions: [],
    trades: [],
    equity: 100_000_000,
  };
}

export function getPortfolio(): PortfolioSnapshot {
  if (typeof window === "undefined") return getDefaultPortfolio();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultPortfolio();
    return JSON.parse(raw);
  } catch {
    return getDefaultPortfolio();
  }
}

export function savePortfolio(p: PortfolioSnapshot): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

export function resetPortfolio(initialCapital?: number): PortfolioSnapshot {
  const cap = initialCapital || 100_000_000;
  const p: PortfolioSnapshot = {
    initialCapital: cap,
    cash: cap,
    positions: [],
    trades: [],
    equity: cap,
  };
  savePortfolio(p);
  return p;
}

export function addTrade(trade: Omit<Trade, "id" | "createdAt">): PortfolioSnapshot {
  const p = getPortfolio();
  const newTrade: Trade = {
    ...trade,
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2),
    createdAt: Date.now(),
  };

  const lotSize = 100; // IDX lot = 100 shares
  const totalShares = newTrade.quantity * lotSize;
  const totalCost = totalShares * newTrade.price;

  if (newTrade.side === "BUY") {
    if (totalCost > p.cash) {
      throw new Error(`Insufficient cash. Need IDR ${totalCost.toLocaleString("id-ID")}, have IDR ${p.cash.toLocaleString("id-ID")}`);
    }
    p.cash -= totalCost;

    // Update or create position
    const existing = p.positions.find((pos) => pos.ticker === newTrade.ticker);
    if (existing) {
      const newTotalCost = existing.totalCost + totalCost;
      const newQuantity = existing.quantity + totalShares;
      existing.avgPrice = newTotalCost / newQuantity;
      existing.quantity = newQuantity;
      existing.totalCost = newTotalCost;
      existing.trades.push(newTrade);
    } else {
      p.positions.push({
        ticker: newTrade.ticker,
        avgPrice: newTrade.price,
        quantity: totalShares,
        totalCost,
        trades: [newTrade],
      });
    }
  } else {
    // SELL
    const existing = p.positions.find((pos) => pos.ticker === newTrade.ticker);
    if (!existing) {
      throw new Error(`No position in ${newTrade.ticker} to sell`);
    }
    if (totalShares > existing.quantity) {
      throw new Error(`Trying to sell ${totalShares} shares but only hold ${existing.quantity}`);
    }

    p.cash += totalCost;
    existing.quantity -= totalShares;
    existing.totalCost = existing.quantity * existing.avgPrice;
    existing.trades.push(newTrade);

    // Remove position if fully sold
    if (existing.quantity <= 0) {
      p.positions = p.positions.filter((pos) => pos.ticker !== newTrade.ticker);
    }
  }

  p.trades.unshift(newTrade);

  // Recalculate equity (cash + cost basis of positions — no live price feed)
  p.equity = p.cash + p.positions.reduce((sum, pos) => sum + pos.totalCost, 0);

  savePortfolio(p);
  return p;
}

export function deleteTrade(tradeId: string): PortfolioSnapshot {
  // Simple approach: rebuild portfolio from scratch without this trade
  const p = getPortfolio();
  const tradeToRemove = p.trades.find((t) => t.id === tradeId);
  if (!tradeToRemove) return p;

  const remainingTrades = p.trades.filter((t) => t.id !== tradeId).reverse(); // chronological

  // Rebuild
  const fresh = resetPortfolio(p.initialCapital);
  for (const t of remainingTrades) {
    try {
      addTrade({ ticker: t.ticker, side: t.side, price: t.price, quantity: t.quantity, date: t.date, notes: t.notes });
    } catch {
      // skip invalid trades during rebuild
    }
  }
  return getPortfolio();
}

export function getPortfolioStats(p: PortfolioSnapshot) {
  const totalTrades = p.trades.length;
  const buyTrades = p.trades.filter((t) => t.side === "BUY").length;
  const sellTrades = p.trades.filter((t) => t.side === "SELL").length;
  const uniqueTickers = new Set(p.trades.map((t) => t.ticker)).size;
  const totalInvested = p.positions.reduce((sum, pos) => sum + pos.totalCost, 0);
  const cashPct = p.equity > 0 ? (p.cash / p.equity) * 100 : 100;
  const investedPct = p.equity > 0 ? (totalInvested / p.equity) * 100 : 0;
  const pnl = p.equity - p.initialCapital;
  const pnlPct = p.initialCapital > 0 ? (pnl / p.initialCapital) * 100 : 0;

  return {
    totalTrades,
    buyTrades,
    sellTrades,
    uniqueTickers,
    totalInvested,
    cashPct,
    investedPct,
    pnl,
    pnlPct,
  };
}
