import { NextResponse } from "next/server";

const TV_SCANNER = "https://scanner.tradingview.com/indonesia/scan";
const TV_HEADERS = {
  "User-Agent": "Mozilla/5.0",
  "Content-Type": "application/json",
};

export async function GET() {
  try {
    // Read tickers from dividends.json
    const fs = await import("fs");
    const path = await import("path");
    const dataPath = path.join(process.cwd(), "data", "dividends.json");

    if (!fs.existsSync(dataPath)) {
      return NextResponse.json({ prices: {}, timestamp: new Date().toISOString() });
    }

    const stocks = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    const tickers = stocks.map((s: { ticker: string }) => s.ticker);

    // Batch fetch from TradingView scanner
    const symbols = tickers.map((t: string) => `IDX:${t}`);
    const payload = JSON.stringify({
      columns: ["name", "close", "change"],
      symbols: { tickers: symbols },
      range: [0, symbols.length],
    });

    const resp = await fetch(TV_SCANNER, {
      method: "POST",
      headers: TV_HEADERS,
      body: payload,
      next: { revalidate: 60 }, // cache 60s
    });

    if (!resp.ok) {
      return NextResponse.json({ prices: {}, timestamp: new Date().toISOString() });
    }

    const data = await resp.json();
    const prices: Record<string, { price: number; change: number }> = {};

    for (const row of data.data || []) {
      const d = row.d;
      if (d && d.length >= 3 && d[1] != null) {
        const ticker = d[0].replace("IDX:", "");
        prices[ticker] = {
          price: d[1],
          change: d[2] ?? 0,
        };
      }
    }

    return NextResponse.json({
      prices,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Live prices error:", error);
    return NextResponse.json(
      { prices: {}, timestamp: new Date().toISOString(), error: "Failed to fetch" },
      { status: 500 }
    );
  }
}
