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

    const price = tv?.price ?? 0;
    const beta = tv?.beta ?? 1;

    if (!sa && !hasReserves(ticker)) {
      return NextResponse.json(
        { error: `Data fundamental untuk ${ticker} tidak ditemukan` },
        { status: 404 },
      );
    }

    const saTicker = ticker;
    const saIncomeRows: Set<string> = sa ? new Set(Object.keys(sa.income).map((k) => k.toLowerCase())) : new Set<string>();
    const isBank = isBankTicker(saTicker) || saIncomeRows.has("net interest income") || Array.from(saIncomeRows).some((k) => k.includes("interest income on loans"));
    if (sa && isBank) {
      const inputs = computeBankInputs(sa, price, beta);
      const valuation = computeBankValuation(inputs);
      const warnings = [
        ...(inputs.roe <= inputs.ke ? ["ROE below Cost of Equity"] : []),
        ...(inputs.ke - inputs.terminalGrowth < 2 ? ["Terminal growth too close to Cost of Equity"] : []),
      ];
      return NextResponse.json(
        {
          model: "bank",
          inputs: { ticker: inputs.ticker, price: inputs.price, beta: inputs.beta },
          bankInputs: inputs,
          valuation,
          warnings,
        },
        { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600" } },
      );
    }

    if (hasReserves(ticker)) {
      const reserve = getReserves(ticker);

      if (ticker === "MEDC") {
        const shares = reserve?.sharesOutstandingBn ?? 25.14;
        const targetPrice = 1800;
        const sensitivity = 100;
        const scenarios = [
          {
            label: "SOTP bear case",
            fairValuePerShare: targetPrice - sensitivity,
            upside: price > 0 ? Math.round(((targetPrice - sensitivity) / price - 1) * 100) : 0,
            priceAssumption: "Oil -US$5/bbl sensitivity",
          },
          {
            label: "SOTP base case",
            fairValuePerShare: targetPrice,
            upside: price > 0 ? Math.round((targetPrice / price - 1) * 100) : 0,
            priceAssumption: "O&G 2.8x EV/EBITDA · Power 2.4x · AMMN 1.0x PBV",
          },
          {
            label: "SOTP bull case",
            fairValuePerShare: targetPrice + sensitivity,
            upside: price > 0 ? Math.round(((targetPrice + sensitivity) / price - 1) * 100) : 0,
            priceAssumption: "Oil +US$5/bbl sensitivity",
          },
        ];

        return NextResponse.json(
          {
            model: "commodity",
            inputs: { ticker, price, shares, type: reserve?.type },
            nav: {
              ticker,
              commodityType: "Oil & Gas · SOTP",
              valuationMethod: "SOTP / broker-style target price",
              mineLifeYears: null,
              reserveSummary: "SOTP: O&G + Power + AMMN stake, bukan gross reserve NAV",
              scenarios,
              cashCost: "<US$10/boe",
              annualProduction: "FY26 EBITDA est. US$1.53bn",
              asOf: "2026-06-23",
              sourceUrl: "Fundamental Research_20260623_MEDC Initiating Coverage.pdf",
            },
          },
          { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600" } },
        );
      }

      // Get shares from SA data when available; fallback keeps NAV endpoint usable for manual reserve names.
      const sharesRow = (() => {
        if (!sa) return null;
        for (const key of Object.keys(sa.income)) {
          const n = key.toLowerCase().replace(/[^a-z0-9]/g, "");
          if (n.includes("sharesoutstanding") || n.includes("weightedaverageshares") || n.includes("dilutedshares")) {
            return sa.income[key];
          }
        }
        return null;
      })();
      const sharesVal = sharesRow ? (sharesRow[0] ?? null) : null; // MILLIONS
      const shares = reserve?.sharesOutstandingBn ?? (sharesVal ? sharesVal / 1000 : 1); // Miliar

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

    if (!sa) {
      return NextResponse.json(
        { error: `Data fundamental untuk ${ticker} tidak ditemukan` },
        { status: 404 },
      );
    }

    const inputs = computeDcfInputs(sa, price, beta);
    const warnings: string[] = [];
    if (inputs.wacc - inputs.terminalGrowth < 2) warnings.push("WACC spread too narrow");
    return NextResponse.json(
      { model: "fcff", inputs, warnings },
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
