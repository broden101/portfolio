import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API_BASE = "https://apiv2.tradersaham.com/api/market-insight";
const HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "User-Agent": "Mozilla/5.0 (compatible; RagaPlaybook/1.0)",
  "Origin": "https://www.tradersaham.com",
  "Referer": "https://www.tradersaham.com/foreign-flow",
};

interface DayData {
  net_value: number;
}

async function fetchTickerForDay(date: string, ticker: string): Promise<number | null> {
  try {
    const r = await fetch(`${API_BASE}/foreign-flow?date=${date}`, {
      headers: HEADERS,
      cache: "no-store",
    });
    if (!r.ok) return null;
    const d = await r.json();
    const all = [...(d.topBuy ?? d.accumulation ?? []), ...(d.topSell ?? d.distribution ?? [])];
    const found = all.find((s: any) => s.stock_code === ticker);
    return found ? Number(found.net_value) : 0;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get("ticker")?.toUpperCase();
  if (!ticker) return NextResponse.json({ error: "Missing ticker" }, { status: 400 });

  const today = new Date();
  const getDates = (n: number) => {
    const dates: string[] = [];
    const d = new Date(today);
    while (dates.length < n) {
      const dow = d.getDay();
      if (dow !== 0 && dow !== 6) dates.push(d.toISOString().slice(0, 10));
      d.setDate(d.getDate() - 1);
    }
    return dates;
  };

  const dates = getDates(130);
  const results = await Promise.all(dates.map((dt) => fetchTickerForDay(dt, ticker)));

  const periods = {
    "1d": results[0] ?? 0,
    "1w": results.slice(0, 5).reduce((a: number, b) => a + (b ?? 0), 0),
    "1m": results.slice(0, 20).reduce((a: number, b) => a + (b ?? 0), 0),
    "3m": results.slice(0, 60).reduce((a: number, b) => a + (b ?? 0), 0),
    "YTD": results.reduce((a: number, b) => a + (b ?? 0), 0),
  };

  return NextResponse.json({ ticker, periods });
}
