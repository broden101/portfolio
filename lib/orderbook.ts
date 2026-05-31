// Order book types and data processing

export interface RunningTrade {
  time: string;
  code: string;
  price: number;
  lot: number;
  change: number;
  side: "BUY" | "SELL";
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

    const [time, code, priceStr, lotStr, changeStr, side] = parts;
    const price = parseFloat(priceStr);
    const lot = parseInt(lotStr);
    const change = parseFloat(changeStr);

    if (!time || !code || isNaN(price) || isNaN(lot)) continue;
    if (side !== "BUY" && side !== "SELL") continue;

    trades.push({ time, code: code.toUpperCase(), price, lot, change, side });
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

    trades.push({ time: timeStr, code: "BUMI", price, lot, change, side });
    time += Math.floor(Math.random() * 15) + 1;
  }

  return trades;
}
