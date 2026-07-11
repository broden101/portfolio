import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get("ticker")?.toUpperCase();
  if (!ticker) return NextResponse.json({ error: "Missing ticker" }, { status: 400 });

  try {
    const r = await fetch("https://scanner.tradingview.com/indonesia/scan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      body: JSON.stringify({
        columns: ["market_cap_basic"],
        filter: [{ left: "name", operation: "equal", right: ticker }],
        options: { lang: "en" },
        range: [0, 1],
      }),
    });

    if (!r.ok) return NextResponse.json({ mcap: 0 }, { status: 200 });

    const d = await r.json();
    const mcap = d.data?.[0]?.d?.[0] ?? 0;
    return NextResponse.json({ mcap });
  } catch {
    return NextResponse.json({ mcap: 0 }, { status: 200 });
  }
}
