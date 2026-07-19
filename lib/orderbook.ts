// Order book types and data processing

export interface RunningTrade {
  time: string;
  code: string;
  price: number;
  lot: number;
  change: number;
  side: "BUY" | "SELL";
  broker?: string; // optional broker code
}

export interface OrderLevel {
  price: number;
  bidVol: number;
  offerVol: number;
  freq: number;
}

export interface TickerInfo {
  code: string;
  last: number;
  change: number;
  high: number;
  low: number;
  open: number;
  volume: number;
}

export function parseCSV(text: string): RunningTrade[] {
  const lines = text.trim().split("\n");
  const trades: RunningTrade[] = [];

  for (const line of lines) {
    const parts = line.split(",").map((s) => s.trim());
    if (parts.length < 6) continue;
    // Skip header
    if (parts[0].toLowerCase() === "time" || parts[0].toLowerCase() === "timestamp") continue;

    const [time, code, priceStr, lotStr, changeStr, side, broker] = parts;
    const price = parseFloat(priceStr);
    const lot = parseInt(lotStr);
    const change = parseFloat(changeStr);

    if (!time || !code || isNaN(price) || isNaN(lot)) continue;
    if (side !== "BUY" && side !== "SELL") continue;

    trades.push({
      time,
      code: code.toUpperCase(),
      price,
      lot,
      change,
      side,
      broker: broker ? broker.toUpperCase() : undefined,
    });
  }

  return trades;
}

export function buildOrderBook(trades: RunningTrade[], currentIdx: number): { levels: OrderLevel[]; ticker: TickerInfo } {
  const levels: Record<number, OrderLevel> = {};
  const code = trades[0]?.code || "—";
  let high = 0, low = Infinity, open = 0, volume = 0;
  let lastPrice = 0, lastChange = 0;

  for (let i = 0; i <= currentIdx && i < trades.length; i++) {
    const t = trades[i];
    if (!levels[t.price]) {
      levels[t.price] = { price: t.price, bidVol: 0, offerVol: 0, freq: 0 };
    }

    if (t.side === "BUY") {
      levels[t.price].bidVol += t.lot;
    } else {
      levels[t.price].offerVol += t.lot;
    }
    levels[t.price].freq++;

    volume += t.lot;
    if (i === 0) open = t.price;
    if (t.price > high) high = t.price;
    if (t.price < low) low = t.price;
    lastPrice = t.price;
    lastChange = t.change;
  }

  if (low === Infinity) low = 0;

  const sorted = Object.values(levels).sort((a, b) => b.price - a.price);

  return {
    levels: sorted,
    ticker: { code, last: lastPrice, change: lastChange, high, low, open, volume },
  };
}

export function generateSampleData(): RunningTrade[] {
  const trades: RunningTrade[] = [];
  const basePrice = 170;
  let price = basePrice;
  let time = 9 * 3600 + 30 * 60; // 09:30:00
  const brokers = ["YU", "AK", "BD", "MG", "RG", "DH", "KK", "BK", "PD", "OS"];

  for (let i = 0; i < 200; i++) {
    const hour = Math.floor(time / 3600);
    const min = Math.floor((time % 3600) / 60);
    const sec = time % 60;
    const timeStr = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;

    const delta = Math.random() > 0.5 ? 1 : -1;
    if (Math.random() > 0.6) price = Math.max(basePrice - 10, Math.min(basePrice + 10, price + delta));

    const lot = Math.floor(Math.random() * 50) + 1;
    const side: "BUY" | "SELL" = Math.random() > 0.5 ? "BUY" : "SELL";
    const change = ((price - basePrice) / basePrice) * 100;
    const broker = brokers[Math.floor(Math.random() * brokers.length)];

    trades.push({ time: timeStr, code: "BUMI", price, lot, change, side, broker });
    time += Math.floor(Math.random() * 15) + 1;
  }

  return trades;
}

/** Calculate VWAP for trades up to currentIdx */
export function calcVWAP(trades: RunningTrade[], currentIdx: number): number {
  let totalVol = 0;
  let totalVal = 0;
  for (let i = 0; i <= currentIdx && i < trades.length; i++) {
    const t = trades[i];
    totalVol += t.lot;
    totalVal += t.lot * t.price;
  }
  return totalVol > 0 ? totalVal / totalVol : 0;
}

/** Calculate cumulative net flow (buy - sell in lots) up to each trade */
export function calcCumFlow(trades: RunningTrade[], currentIdx: number): { time: string; cumBuy: number; cumSell: number; net: number }[] {
  const result: { time: string; cumBuy: number; cumSell: number; net: number }[] = [];
  let cumBuy = 0;
  let cumSell = 0;
  for (let i = 0; i <= currentIdx && i < trades.length; i++) {
    const t = trades[i];
    if (t.side === "BUY") cumBuy += t.lot;
    else cumSell += t.lot;
    result.push({ time: t.time, cumBuy, cumSell, net: cumBuy - cumSell });
  }
  return result;
}

/** Detect big trades (above threshold) */
export function detectBigTrades(trades: RunningTrade[], currentIdx: number, threshold: number = 10): RunningTrade[] {
  const big: RunningTrade[] = [];
  for (let i = 0; i <= currentIdx && i < trades.length; i++) {
    if (trades[i].lot >= threshold) big.push(trades[i]);
  }
  return big;
}

/** Broker summary: net buy/sell per broker */
export function brokerSummary(trades: RunningTrade[], currentIdx: number): Map<string, { buy: number; sell: number; net: number }> {
  const map = new Map<string, { buy: number; sell: number; net: number }>();
  for (let i = 0; i <= currentIdx && i < trades.length; i++) {
    const t = trades[i];
    const b = t.broker || "N/A";
    if (!map.has(b)) map.set(b, { buy: 0, sell: 0, net: 0 });
    const entry = map.get(b)!;
    if (t.side === "BUY") entry.buy += t.lot;
    else entry.sell += t.lot;
    entry.net = entry.buy - entry.sell;
  }
  return map;
}
