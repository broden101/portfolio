import { NextRequest, NextResponse } from "next/server";
import { fetchStockAnalysis } from "@/lib/fundamentals";

export async function GET(
  _req: NextRequest,
  { params }: { params: { ticker: string } },
) {
  const ticker = params.ticker.toUpperCase();

  try {
    const data = await fetchStockAnalysis(ticker);

    if (!data) {
      return NextResponse.json(
        { error: `Data fundamental untuk ${ticker} tidak ditemukan` },
        { status: 404 },
      );
    }

    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600" },
    });
  } catch (err) {
    console.error(`[fundamentals/${ticker}]`, err);
    return NextResponse.json(
      { error: "Gagal mengambil data fundamental" },
      { status: 502 },
    );
  }
}
