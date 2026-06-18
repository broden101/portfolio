import { NextRequest, NextResponse } from "next/server";
import {
  fetchStockAnalysis,
  fetchTvQuote,
  isBankTicker,
  computeDcfInputs,
  computeBankInputs,
  computeBankValuation,
} from "@/lib/fundamentals";

export async function GET(
  _req: NextRequest,
  { params }: { params: { ticker: string } },
) {
  const ticker = params.ticker.toUpperCase();

  try {
    const [sa, tv] = await Promise.all([
      fetchStockAnalysis(ticker),
      fetchTvQuote(ticker),
    ]);

    if (!sa) {
      return NextResponse.json(
        { error: `Data fundamental untuk ${ticker} tidak ditemukan` },
        { status: 404 },
      );
    }

    const price = tv?.price ?? 0;
    const beta = tv?.beta ?? 1;

    if (isBankTicker(ticker)) {
      const inputs = computeBankInputs(sa, price, beta);
      const valuation = computeBankValuation(inputs);
      return NextResponse.json(
        { model: "bank", inputs, valuation },
        { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600" } },
      );
    }

    const inputs = computeDcfInputs(sa, price, beta);
    return NextResponse.json(
      { model: "fcff", inputs },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600" } },
    );
  } catch (err) {
    console.error(`[dcf-inputs/${ticker}]`, err);
    return NextResponse.json(
      { error: "Gagal menghitung input DCF" },
      { status: 502 },
    );
  }
}
