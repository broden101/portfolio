import { NextRequest, NextResponse } from "next/server";

const TV_URL = "https://scanner.tradingview.com/indonesia/scan";

// Year → priority-ordered performance columns (fallback cascade for null data)
const YEAR_FALLBACKS: Record<number, { cols: string[]; label: string; years: number }> = {
  2026: { cols: ["Perf.YTD", "Perf.Y"], label: "YTD", years: 1 },
  2025: { cols: ["Perf.Y", "Perf.YTD"], label: "1Y", years: 1 },
  2023: { cols: ["Perf.3Y", "Perf.5Y", "Perf.10Y"], label: "3Y", years: 3 },
  2021: { cols: ["Perf.5Y", "Perf.3Y", "Perf.10Y"], label: "5Y", years: 5 },
  2016: { cols: ["Perf.10Y", "Perf.5Y", "Perf.3Y"], label: "10Y", years: 10 },
  2011: { cols: ["Perf.15Y", "Perf.10Y", "Perf.5Y"], label: "15Y", years: 15 },
};

const YEAR_LABELS = Object.keys(YEAR_FALLBACKS).map(Number).sort((a, b) => b - a);

const PERF_COLUMNS = [
  "close",
  "name",
  "description",
  "Perf.YTD",
  "Perf.Y",
  "Perf.3Y",
  "Perf.5Y",
  "Perf.10Y",
  "Perf.15Y",
  "dividend_yield_recent",
  "Perf",
  "Perf.W",
  "Perf.1M",
  "Perf.3M",
  "Perf.6M",
];

type StockData = {
  ticker: string;
  name: string;
  close: number | null;
  dividendYield: number | null;
  perf: Record<string, number | null>;
};

function fmtReturn(val: number | null): string | null {
  if (val === null || val === undefined) return null;
  return `${val >= 0 ? "+" : ""}${val.toFixed(2)}%`;
}

function fmtRupiah(val: number): string {
  return `Rp${Math.round(val).toLocaleString("id-ID")}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tickersParam = searchParams.get("tickers") || "BBCA,BBRI,BMRI,TLKM,ASII";
  const startYear = parseInt(searchParams.get("start") || "2023", 10);
  const modal = parseFloat(searchParams.get("modal") || "100000000");
  const forecastYears = parseInt(searchParams.get("forecast") || "3", 10);

  const tickers = tickersParam.split(",").map((t) => t.trim().toUpperCase());

  // Fetch from TradingView
  const tvResp = await fetch(TV_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      columns: PERF_COLUMNS,
      symbols: { tickers: tickers.map((t) => `IDX:${t}`) },
    }),
  });

  if (!tvResp.ok) {
    return NextResponse.json({ error: "Gagal ambil data pasar" }, { status: 502 });
  }

  const tvData = await tvResp.json();

  // Column index map
  const cmap: Record<string, number> = {};
  PERF_COLUMNS.forEach((c, i) => {
    cmap[c] = i;
  });

  // Parse stock data
  const stocks: Record<string, StockData> = {};
  for (const row of tvData.data) {
    const d = row.d;
    const ticker = d[cmap["name"]] as string;
    stocks[ticker] = {
      ticker,
      name: d[cmap["description"]] as string,
      close: d[cmap["close"]] as number | null,
      dividendYield: d[cmap["dividend_yield_recent"]] as number | null,
      perf: {} as Record<string, number | null>,
    };
    for (const col of [
      "Perf.YTD",
      "Perf.Y",
      "Perf.3Y",
      "Perf.5Y",
      "Perf.10Y",
      "Perf.15Y",
    ]) {
      stocks[ticker].perf[col] = d[cmap[col]] as number | null;
    }
  }

  // Find best year with fallback cascade for null data
  const lookupYear = startYear;
  const perfInfo = YEAR_FALLBACKS[startYear] || YEAR_FALLBACKS[2023];
  const yearLabel = perfInfo.label;
  const perfYears = perfInfo.years;

  const perStockData = tickers
    .filter((t) => stocks[t])
    .map((t) => {
      const s = stocks[t];
      // Try each performance column in priority order, use first non-null
      const useCol = perfInfo.cols.find((c) => s.perf[c] !== null) || perfInfo.cols[0];
      const totalReturnPct = s.perf[useCol];
      const capitalGainPct = totalReturnPct;
      const annualReturnPct =
        totalReturnPct !== null && perfYears
          ? (Math.pow(1 + totalReturnPct / 100, 1 / perfYears) - 1) * 100
          : null;

      const finalValue =
        totalReturnPct !== null
          ? modal * (1 + totalReturnPct / 100)
          : null;

      // Dividend approximation: yield × modal × years
      const divYield = (s.dividendYield ?? 0) / 100;
      const estDividend =
        divYield > 0 && modal > 0
          ? modal * divYield * ((perfYears || 1))
          : null;

      return {
        ticker: t,
        name: s.name,
        currentPrice: s.close,
        modalAwal: modal,
        finalValue: finalValue ? Math.round(finalValue) : null,
        totalReturnPct,
        annualReturnPct: annualReturnPct !== null ? annualReturnPct : null,
        capitalGainPct,
        capitalGainRp: finalValue ? Math.round(finalValue - modal) : null,
        estDividend,
        dividendYield: s.dividendYield,
        startYear: lookupYear,
        years: perfYears,
      };
    });

  // Forecast: use 3Y CAGR + dividend yield × years
  const forecastResults = tickers
    .filter((t) => stocks[t])
    .map((t) => {
      const s = stocks[t];
      const cagr3y = s.perf["Perf.3Y"];
      const cagr =
        cagr3y !== null
          ? (Math.pow(1 + cagr3y / 100, 1 / 3) - 1) * 100
          : null;

      const projectedValue =
        cagr !== null
          ? modal * Math.pow(1 + cagr / 100, forecastYears)
          : null;

      const capitalGainPct =
        cagr !== null
          ? (Math.pow(1 + cagr / 100, forecastYears) - 1) * 100
          : null;

      const divYield = (s.dividendYield ?? 0) / 100;
      const cumDividend =
        divYield > 0 && modal > 0
          ? modal * ((Math.pow(1 + divYield, forecastYears) - 1) / divYield) * divYield
          : 0;

      return {
        ticker: t,
        name: s.name,
        currentPrice: s.close,
        modalAwal: modal,
        projectedValue: projectedValue ? Math.round(projectedValue) : null,
        cagr,
        forecastYears,
        capitalGainPct,
        capitalGainRp: projectedValue ? Math.round(projectedValue - modal) : null,
        cumDividend: Math.round(cumDividend),
        dividendYield: s.dividendYield,
        annualDivReturn: divYield > 0 ? `${(divYield * 100).toFixed(2)}%` : null,
      };
    });

  // Aggregated portfolio (equal weight)
  const validB = perStockData.filter((r) => r.totalReturnPct !== null);
  const avgReturn =
    validB.length > 0
      ? validB.reduce((s, r) => s + (r.totalReturnPct ?? 0), 0) / validB.length
      : null;
  const avgFinal =
    avgReturn !== null ? modal * (1 + avgReturn / 100) : null;
  const portfolioBacktest = {
    stocks: validB.length,
    avgReturn,
    avgFinalValue: avgFinal ? Math.round(avgFinal) : null,
  };

  const validF = forecastResults.filter((r) => r.cagr !== null);
  const avgCagr =
    validF.length > 0
      ? validF.reduce((s, r) => s + (r.cagr ?? 0), 0) / validF.length
      : null;
  const avgProjected =
    avgCagr !== null
      ? Math.round(modal * Math.pow(1 + avgCagr / 100, forecastYears))
      : null;
  const portfolioForecast = {
    stocks: validF.length,
    avgCagr,
    avgProjectedValue: avgProjected,
  };

  return NextResponse.json({
    availableYears: Object.keys(YEAR_FALLBACKS).map(Number).sort((a, b) => b - a),
    backtest: {
      startYear: lookupYear,
      periodYears: perfYears,
      yearLabel,
      perStock: perStockData,
      portfolio: portfolioBacktest,
    },
    forecast: {
      forecastYears,
      perStock: forecastResults,
      portfolio: portfolioForecast,
    },
  });
}
