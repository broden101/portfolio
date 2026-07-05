import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface Commodity {
  symbol: string;
  name: string;
  price: number;
  change: number | null;
  unit: string;
}

// Yahoo Finance tickers for commodities
const YAHOO_TICKERS: Record<string, { name: string; yahoo: string; unit: string }> = {
  "BZ=F": { name: "Brent Crude Oil", yahoo: "BZ=F", unit: "$" },
  "GC=F": { name: "Gold", yahoo: "GC=F", unit: "$" },
  "HG=F": { name: "Copper", yahoo: "HG=F", unit: "$" },
  "NG=F": { name: "Natural Gas", yahoo: "NG=F", unit: "$" },
  "NI=F": { name: "Nickel", yahoo: "NI=F", unit: "$" },
};

// Static fallback for commodities not on Yahoo Finance
const STATIC_COMMODITIES: Commodity[] = [
  { symbol: "TIN", name: "Timah", price: 52276, change: 3.30, unit: "$" },
  { symbol: "NCF", name: "Newcastle Coal", price: 129.0, change: -0.19, unit: "$" },
  { symbol: "NH3", name: "Ammonia", price: 737.6, change: null, unit: "$" },
  { symbol: "CPO", name: "CPO", price: 1107.0, change: -0.94, unit: "$" },
];

const CACHE_TTL = 5 * 60 * 1000; // 5 min
let cache: { data: Commodity[]; expiry: number } | null = null;

async function fetchYahooChart(ticker: string): Promise<{ price: number; change: number } | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=5d`;
    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
      },
      cache: "no-store",
    });
    if (!r.ok) return null;
    const json = await r.json();
    const result = json?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const quotes = result.indicators?.quote?.[0];
    if (!meta || !quotes) return null;

    const closes: number[] = quotes.close?.filter((v: number | null) => v != null) ?? [];
    if (closes.length === 0) return null;

    const price = closes[closes.length - 1];
    const prevClose = closes.length >= 2 ? closes[closes.length - 2] : meta.previousClose ?? price;
    const change = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;

    return { price, change };
  } catch {
    return null;
  }
}

// Hardcoded fallbacks (user's provided values)
const FALLBACK_COMMODITIES: Commodity[] = [
  { symbol: "BZ=F", name: "Brent Crude Oil", price: 72.12, change: 0.45, unit: "$" },
  { symbol: "GC=F", name: "Gold", price: 4174.8, change: 1.25, unit: "$" },
  { symbol: "TIN", name: "Timah", price: 52276, change: 3.30, unit: "$" },
  { symbol: "NI=F", name: "Nickel", price: 16243.8, change: 1.06, unit: "$" },
  { symbol: "HG=F", name: "Copper", price: 6.22, change: 0.89, unit: "$" },
  { symbol: "NCF", name: "Newcastle Coal", price: 129.0, change: -0.19, unit: "$" },
  { symbol: "NG=F", name: "Natural Gas", price: 3.25, change: 1.53, unit: "$" },
  { symbol: "NH3", name: "Ammonia", price: 737.6, change: null, unit: "$" },
  { symbol: "CPO", name: "CPO", price: 1107.0, change: -0.94, unit: "$" },
];

export async function GET() {
  // Check cache
  if (cache && cache.expiry > Date.now()) {
    return NextResponse.json(cache.data, {
      headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" },
    });
  }

  try {
    // Try fetching live data from Yahoo Finance
    const yahooResults = await Promise.all(
      Object.values(YAHOO_TICKERS).map(async (t) => {
        const r = await fetchYahooChart(t.yahoo);
        if (r) {
          return { symbol: t.yahoo.split("=")[0] + "=F", ...t, price: r.price, change: r.change };
        }
        return null;
      })
    );

    const liveCommodities: Commodity[] = [];
    for (let i = 0; i < yahooResults.length; i++) {
      const r = yahooResults[i];
      const tickerKey = Object.keys(YAHOO_TICKERS)[i];
      if (r) {
        liveCommodities.push({
          symbol: tickerKey,
          name: r.name,
          price: r.price,
          change: r.change,
          unit: r.unit,
        });
      } else {
        // Fallback to static data
        const fb = FALLBACK_COMMODITIES.find((c) => c.symbol === tickerKey);
        if (fb) liveCommodities.push(fb);
      }
    }

    // Add static commodities (Timah, Newcastle Coal, Ammonia, CPO)
    const result = [...liveCommodities, ...STATIC_COMMODITIES];

    cache = { data: result, expiry: Date.now() + CACHE_TTL };

    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" },
    });
  } catch {
    // Complete fallback to hardcoded data
    return NextResponse.json(FALLBACK_COMMODITIES, {
      headers: { "Cache-Control": "public, s-maxage=300" },
    });
  }
}
