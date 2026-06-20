import { NextRequest, NextResponse } from "next/server";
import {
  fetchStockAnalysis,
  fetchTvQuote,
  isBankTicker,
  computeDcfInputs,
  computeBankInputs,
  computeBankValuation,
  computeCommodityNav,
} from "@/lib/fundamentals";
import { hasReserves, getReserves } from "@/lib/commodityReserves";

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

    if (hasReserves(ticker)) {
      const reserve = getReserves(ticker);
      const sharesRaw = sa ? sa.years.length : 0; // placeholder, we compute below
      // Get shares from SA data
      const sharesRow = (() => {
        for (const key of Object.keys(sa.income)) {
          const n = key.toLowerCase().replace(/[^a-z0-9]/g, "");
          if (n.includes("sharesoutstanding") || n.includes("weightedaverageshares") || n.includes("dilutedshares")) {
            return sa.income[key];
          }
        }
        return null;
      })();
      const sharesVal = sharesRow ? (sharesRow[0] ?? 1000) : 1000; // MILLIONS
      const shares = sharesVal / 1000; // MILLIONS → Miliar

      const nav = await computeCommodityNav(ticker, price, shares, 16000, 10);
      return NextResponse.json(
        {
          model: "commodity",
          inputs: { ticker, price, shares, type: reserve?.type },
          nav,
        },
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
