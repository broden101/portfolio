import { NextRequest, NextResponse } from "next/server";

const TV_SCANNER_URL = "https://scanner.tradingview.com/indonesia/scan";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tickers } = body;

    if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
      return NextResponse.json({ error: "tickers array required" }, { status: 400 });
    }

    // Deduplicate and uppercase
    const unique = [...new Set(tickers.map((t: string) => t.toUpperCase()))];

    const payload = {
      columns: [
        "name", "description", "close", "market_cap_basic", "volume",
        "SMA20", "SMA50", "SMA200",
        "change", "Perf.1M", "Perf.3M", "sector",
        "VWAP", "average_volume_10d_calc", "average_volume_30d_calc",
        "High.All", "Low.All", "RSI", "MACD.macd", "MACD.signal",
      ],
      filter: [
        { left: "name", operation: "in_range", right: unique },
        { left: "is_primary", operation: "equal", right: true },
      ],
      range: [0, 200],
      sort: { sortBy: "market_cap_basic", sortOrder: "desc" },
      symbols: { query: { types: ["stock"] } },
      markets: ["id"],
    };

    const r = await fetch(TV_SCANNER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      return NextResponse.json({ error: `TradingView ${r.status}` }, { status: 502 });
    }

    const data = await r.json();
    const keys = [
      "name", "desc", "close", "mcap", "volume",
      "sma20", "sma50", "sma200", "change", "perf1m", "perf3m", "sector",
      "vwap", "avg_vol_10d", "avg_vol_30d",
      "high_all", "low_all", "rsi", "macd", "macd_signal",
    ];

    const results = (data.data || []).map((row: { d: number[] }) => {
      const obj: Record<string, number | string> = {};
      keys.forEach((k, i) => { obj[k] = row.d[i]; });
      return obj;
    });

    return NextResponse.json({ data: results, total: results.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
