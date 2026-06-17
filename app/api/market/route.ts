import { NextResponse } from "next/server";

/**
 * /api/market — Realtime IHSG dashboard data
 *
 * Sources (all free, no API key needed):
 *   - TradingView indonesia scanner  → IHSG composite + IDX sector indices + bellwether stocks
 *   - TradingView global scanner     → USD/IDR, Gold, Brent Oil, US 10Y/2Y yields
 *
 * Cache: 60s server-side (s-maxage), 120s stale-while-revalidate.
 * The client polls every 60s (see lib/market.ts) so data stays fresh during market hours.
 *
 * NOTE for future agent (Hermes): foreign-flow (net buy/sell per stock), BI Rate, and
 * trade balance are NOT available from TradingView's free scanner. They are kept as a
 * separate manual config (MARKET_OVERRIDES in lib/market.ts). Plug in a specialized
 * source (e.g. IDX RTI / Refinitiv) there when available.
 */

const INDONESIA_SCANNER = "https://scanner.tradingview.com/indonesia/scan";
const GLOBAL_SCANNER = "https://scanner.tradingview.com/global/scan";
const TV_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (compatible; RagaPlaybook/1.0)",
  "Content-Type": "application/json",
};

/* ── IDX sector indices that resolve directly in the scanner ── */
const SECTOR_INDICES: Record<string, string> = {
  IDXFINANCE: "Finance",
  IDXBASIC: "Basic Materials",
  IDXENERGY: "Energy",
  IDXINDUST: "Industrials",
  IDXHEALTH: "Healthcare",
  IDXPROPERT: "Properties & Real Estate",
};

/* ── Sectors with no direct scanner index → proxy from bellwether basket ── */
const SECTOR_BASKETS: Record<string, { name: string; tickers: string[] }> = {
  IDXTECHNO: { name: "Technology", tickers: ["BUKA", "GOTO", "EMTK", "MCAS", "BELI"] },
  IDXINFRA: { name: "Infrastructure", tickers: ["JSMR", "PTPP", "ADHI", "WIKA", "TOWR"] },
  IDXCYCLIC: {
    name: "Consumer Cyclicals",
    tickers: ["ASII", "MAPI", "ACES", "AMRT", "RALS"],
  },
  IDXNONCYC: {
    name: "Consumer Non-Cyclicals",
    tickers: ["ICBP", "UNVR", "INDF", "MYOR", "SIDO"],
  },
  IDXTRANS: { name: "Transportation & Logistic", tickers: ["GIAA", "TPIA", "SMDR", "BBHI"] },
};

/* ── Macro indicators from the global scanner ── */
const MACRO_SYMBOLS: Record<string, { symbol: string; label: string }> = {
  USDIDR: { symbol: "FX_IDC:USDIDR", label: "USD/IDR" },
  GOLD: { symbol: "TVC:GOLD", label: "Gold" },
  UKOIL: { symbol: "TVC:UKOIL", label: "Brent Oil" },
  US10Y: { symbol: "TVC:US10Y", label: "US 10Y" },
  US02Y: { symbol: "TVC:US02Y", label: "US 2Y" },
};

/* Columns requested from the indonesia scanner (index = position in d[]) */
const COLUMNS = [
  "name", // 0
  "description", // 1
  "close", // 2
  "change", // 3
  "change_abs", // 4
  "Recommend.All", // 5
  "RSI", // 6
  "SMA50", // 7
  "SMA200", // 8
  "Perf.W", // 9
  "Perf.1M", // 10
  "Perf.3M", // 11
  "Perf.YTD", // 12
  "Perf.Y", // 13
  "high", // 14
  "low", // 15
];

interface RawRow {
  s: string;
  d: (string | number | null)[];
}

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Shared shape for any index/stock/basket we normalise. */
interface QuoteData {
  close: number | null;
  change: number | null;
  changeAbs: number | null;
  recommend: number | null;
  rsi: number | null;
  sma50: number | null;
  sma200: number | null;
  perfWeek: number | null;
  perf1M: number | null;
  perf3M: number | null;
  perfYTD: number | null;
  perf1Y: number | null;
  high: number | null;
  low: number | null;
}

function buildQuote(row: RawRow): QuoteData {
  const d = row.d;
  return {
    close: num(d[2]),
    change: num(d[3]),
    changeAbs: num(d[4]),
    recommend: num(d[5]),
    rsi: num(d[6]),
    sma50: num(d[7]),
    sma200: num(d[8]),
    perfWeek: num(d[9]),
    perf1M: num(d[10]),
    perf3M: num(d[11]),
    perfYTD: num(d[12]),
    perf1Y: num(d[13]),
    high: num(d[14]),
    low: num(d[15]),
  };
}

/** Average a basket of stocks into a sector proxy (mean of %-change fields). */
function aggregateBasket(rows: RawRow[]): QuoteData & { components: number } {
  const valid = rows.filter((r) => num(r.d[2]) != null && num(r.d[2])! > 0);
  const avg = (idx: number): number | null => {
    const vals = valid
      .map((r) => num(r.d[idx]))
      .filter((v): v is number => v != null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };
  return {
    close: avg(2),
    change: avg(3),
    changeAbs: avg(4),
    recommend: avg(5),
    rsi: avg(6),
    sma50: avg(7),
    sma200: avg(8),
    perfWeek: avg(9),
    perf1M: avg(10),
    perf3M: avg(11),
    perfYTD: avg(12),
    perf1Y: avg(13),
    high: avg(14),
    low: avg(15),
    components: valid.length,
  };
}

async function scan(endpoint: string, tickers: string[], columns: string[]): Promise<Map<string, RawRow>> {
  const out = new Map<string, RawRow>();
  if (tickers.length === 0) return out;
  try {
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: TV_HEADERS,
      body: JSON.stringify({ columns, symbols: { tickers }, range: [0, tickers.length] }),
      cache: "no-store",
    });
    if (!resp.ok) return out;
    const data = await resp.json();
    for (const row of data?.data ?? []) out.set(row.s, row);
  } catch (e) {
    console.error(`scan ${endpoint} error:`, e);
  }
  return out;
}

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    // ── Build the full ticker list for the indonesia scanner (one round-trip) ──
    const indexKeys = ["COMPOSITE", "LQ45", "KOMPAS100", "IDX30", ...Object.keys(SECTOR_INDICES)];
    const indexTickers = indexKeys.map((k) => `IDX:${k}`);
    const basketTickers = Object.values(SECTOR_BASKETS).flatMap((b) => b.tickers.map((t) => `IDX:${t}`));
    const macroTickers = Object.values(MACRO_SYMBOLS).map((m) => m.symbol);

    const [idRows, macroRows] = await Promise.all([
      scan(INDONESIA_SCANNER, [...indexTickers, ...basketTickers], COLUMNS),
      scan(GLOBAL_SCANNER, macroTickers, ["name", "close", "change", "change_abs"]),
    ]);

    // ── IHSG composite ──
    const ihsg = idRows.get("IDX:COMPOSITE") ?? null;
    const ihsgQuote = ihsg ? buildQuote(ihsg) : null;

    // ── Sub-indices ──
    const buildSub = (sym: string) => {
      const row = idRows.get(sym);
      return row ? buildQuote(row) : null;
    };

    // ── Sectors ──
    const sectors: Array<QuoteData & { code: string; name: string; type: "index" | "basket"; components?: number }> = [];
    for (const [code, name] of Object.entries(SECTOR_INDICES)) {
      const row = idRows.get(`IDX:${code}`);
      if (row && num(row.d[2]) != null) sectors.push({ code, name, type: "index", ...buildQuote(row) });
    }
    for (const [code, def] of Object.entries(SECTOR_BASKETS)) {
      const rows = def.tickers.map((t) => idRows.get(`IDX:${t}`)).filter((r): r is RawRow => !!r);
      const agg = aggregateBasket(rows);
      if (agg.close != null) sectors.push({ code, name: def.name, type: "basket", ...agg });
    }

    // ── Macro ──
    const macro: Record<string, { label: string; close: number | null; change: number | null }> = {};
    for (const [key, def] of Object.entries(MACRO_SYMBOLS)) {
      const row = macroRows.get(def.symbol);
      if (row) macro[key] = { label: def.label, close: num(row.d[1]), change: num(row.d[2]) };
    }

    const indexCount = sectors.filter((s) => s.type === "index").length;
    const basketCount = sectors.filter((s) => s.type === "basket").length;

    return NextResponse.json(
      {
        timestamp,
        ok: ihsgQuote != null,
        ihsg: ihsgQuote,
        lq45: buildSub("IDX:LQ45"),
        kompas100: buildSub("IDX:KOMPAS100"),
        idx30: buildSub("IDX:IDX30"),
        sectors,
        macro,
        coverage: { ihsg: !!ihsgQuote, sectorIndices: indexCount, sectorBaskets: basketCount, macro: Object.keys(macro).length },
      },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
    );
  } catch (error) {
    console.error("market route error:", error);
    return NextResponse.json(
      { timestamp, ok: false, error: "Failed to fetch market data" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
