import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API_BASE = "https://apiv2.tradersaham.com/api/market-insight";
const HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "User-Agent": "Mozilla/5.0 (compatible; RagaPlaybook/1.0)",
  "Origin": "https://www.tradersaham.com",
  "Referer": "https://www.tradersaham.com/foreign-flow",
};

interface StockMover {
  stock_code: string;
  close_price: number;
  net_value: number;
  net_volume: number;
  total_buy_value: number;
  total_sell_value: number;
}

interface AggResult {
  topBuy: StockMover[];
  topSell: StockMover[];
  topActive: StockMover[];
  dateRange: string;
  days: number;
}

// Cache: period → { data, expiry }
const cache = new Map<string, { data: AggResult; expiry: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 min

function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function fetchForeignFlow(date: string): Promise<StockMover[]> {
  try {
    const r = await fetch(`${API_BASE}/foreign-flow?date=${date}`, {
      headers: HEADERS,
      cache: "no-store",
    });
    if (!r.ok) return [];
    const d = await r.json();
    const buy: StockMover[] = (d.topBuy ?? d.accumulation ?? []).map((s: Record<string, unknown>) => ({
      stock_code: s.stock_code,
      close_price: Number(s.close_price ?? 0),
      net_value: Number(s.net_value ?? 0),
      net_volume: Number(s.net_volume ?? 0),
      total_buy_value: Number(s.total_buy_value ?? 0),
      total_sell_value: Number(s.total_sell_value ?? 0),
    }));
    const sell: StockMover[] = (d.topSell ?? d.distribution ?? []).map((s: Record<string, unknown>) => ({
      stock_code: s.stock_code,
      close_price: Number(s.close_price ?? 0),
      net_value: Number(s.net_value ?? 0),
      net_volume: Number(s.net_volume ?? 0),
      total_buy_value: Number(s.total_buy_value ?? 0),
      total_sell_value: Number(s.total_sell_value ?? 0),
    }));
    return [...buy, ...sell];
  } catch {
    return [];
  }
}

function aggregateDays(allDays: StockMover[][]): AggResult {
  const map = new Map<string, StockMover>();

  for (const dayStocks of allDays) {
    for (const s of dayStocks) {
      const existing = map.get(s.stock_code);
      if (!existing) {
        map.set(s.stock_code, { ...s });
      } else {
        existing.net_value += s.net_value;
        existing.net_volume += s.net_volume;
        existing.total_buy_value += s.total_buy_value;
        existing.total_sell_value += s.total_sell_value;
        // Use latest close price
        if (s.close_price > 0) existing.close_price = s.close_price;
      }
    }
  }

  const all = Array.from(map.values());
  const topBuy = [...all].sort((a, b) => b.net_value - a.net_value).slice(0, 10);
  const topSell = [...all].sort((a, b) => a.net_value - b.net_value).slice(0, 10);
  const topActive = [...all]
    .sort((a, b) => (b.total_buy_value + b.total_sell_value) - (a.total_buy_value + a.total_sell_value))
    .slice(0, 10);

  return { topBuy, topSell, topActive, dateRange: "", days: 0 };
}

function getDaysForPeriod(period: string): number {
  switch (period) {
    case "1d": return 1;
    case "1w": return 5;   // trading days
    case "1m": return 20;  // trading days
    default: return 1;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "1d";
  const days = getDaysForPeriod(period);

  // Check cache
  const cached = cache.get(period);
  if (cached && cached.expiry > Date.now()) {
    return NextResponse.json(cached.data, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  }

  try {
    // For 1d, just fetch today
    // For 1w/1m, fetch last N trading days (skip weekends)
    const today = new Date();
    const dates: string[] = [];

    if (days === 1) {
      dates.push(toYMD(today));
    } else {
      // Walk backwards skipping weekends
      const d = new Date(today);
      while (dates.length < days) {
        const dow = d.getDay();
        if (dow !== 0 && dow !== 6) {
          dates.push(toYMD(d));
        }
        d.setDate(d.getDate() - 1);
      }
    }

    // Fetch all dates in parallel (max 20 requests)
    const results = await Promise.all(dates.map((dt) => fetchForeignFlow(dt)));
    const successful = results.filter((r) => r.length > 0);

    if (successful.length === 0) {
      return NextResponse.json(
        { error: "No data available" },
        { status: 502 }
      );
    }

    const agg = aggregateDays(successful);
    agg.dateRange = `${dates[dates.length - 1]} → ${dates[0]}`;
    agg.days = successful.length;

    // Cache
    cache.set(period, { data: agg, expiry: Date.now() + CACHE_TTL });

    return NextResponse.json(agg, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
