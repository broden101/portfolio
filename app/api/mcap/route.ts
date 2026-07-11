import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get("ticker");
  if (!ticker) return NextResponse.json({ error: "Missing ticker" }, { status: 400 });

  const r = await fetch("https://scanner.tradingview.com/indonesia/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      columns: ["market_cap_basic"],
      filter: [{ left: "name", operation: "equal", right: ticker.toUpperCase() }],
      options: { lang: "en" },
      range: [0, 1]
    })
  });
  const d = await r.json();
  const mcap = d.data?.[0]?.d?.[0] || 0;
  return NextResponse.json({ mcap });
}
