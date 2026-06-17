import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

/**
 * /api/market — Realtime IHSG dashboard data
 *
 * Auto sources:
 *   - TradingView scanner → IHSG, sectors, macro
 *   - Tradersaham API → Foreign flow (TOP 10 buy/sell + totals)
 *   - data/manual-market.json → BI Rate, trade balance (cron-updated)
 */

const INDONESIA_SCANNER = "https://scanner.tradingview.com/indonesia/scan";
const GLOBAL_SCANNER = "https://scanner.tradingview.com/global/scan";
const TRADERSAHAM_API = "https://apiv2.tradersaham.com/api";

const TV_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (compatible; RagaPlaybook/1.0)",
  "Content-Type": "application/json",
};

const TSAHAM_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Accept": "application/json",
  "Origin": "https://www.tradersaham.com",
  "Referer": "https://www.tradersaham.com/market-overview",
};

const SECTOR_INDICES: Record<string, string> = {
  IDXFINANCE: "Finance",
  IDXBASIC: "Basic Materials",
  IDXENERGY: "Energy",
  IDXINDUST: "Industrials",
  IDXHEALTH: "Healthcare",
  IDXPROPERT: "Properties & Real Estate",
};

const SECTOR_BASKETS: Record<string, { name: string; tickers: string[] }> = {
  IDXTECHNO: { name: "Technology", tickers: ["BUKA", "GOTO", "EMTK", "MCAS", "BELI"] },
  IDXINFRA: { name: "Infrastructure", tickers: ["JSMR", "PTPP", "ADHI", "WIKA", "TOWR"] },
  IDXCYCLIC: { name: "Consumer Cyclicals", tickers: ["ASII", "MAPI", "ACES", "AMRT", "RALS"] },
  IDXNONCYC: { name: "Consumer Non-Cyclicals", tickers: ["ICBP", "UNVR", "INDF", "MYOR", "SIDO"] },
  IDXTRANS: { name: "Transportation & Logistic", tickers: ["GIAA", "TPIA", "SMDR", "BBHI"] },
};

const MACRO_SYMBOLS: Record<string, { symbol: string; label: string }> = {
  USDIDR: { symbol: "FX_IDC:USDIDR", label: "USD/IDR" },
  GOLD: { symbol: "TVC:GOLD", label: "Gold" },
  UKOIL: { symbol: "TVC:UKOIL", label: "Brent Oil" },
  US10Y: { symbol: "TVC:US10Y", label: "US 10Y" },
  US02Y: { symbol: "TVC:US02Y", label: "US 2Y" },
};

const COLUMNS = [
  "name", "description", "close", "change", "change_abs",
  "Recommend.All", "RSI", "SMA50", "SMA200",
  "Perf.W", "Perf.1M", "Perf.3M", "Perf.YTD", "Perf.Y",
  "high", "low",
];

interface RawRow { s: string; d: (string | number | null)[]; }
function num(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

interface QuoteData {
  close: number | null; change: number | null; changeAbs: number | null;
  recommend: number | null; rsi: number | null;
  sma50: number | null; sma200: number | null;
  perfWeek: number | null; perf1M: number | null; perf3M: number | null;
  perfYTD: number | null; perf1Y: number | null;
  high: number | null; low: number | null;
}

function buildQuote(row: RawRow): QuoteData {
  const d = row.d;
  return {
    close: num(d[2]), change: num(d[3]), changeAbs: num(d[4]),
    recommend: num(d[5]), rsi: num(d[6]), sma50: num(d[7]), sma200: num(d[8]),
    perfWeek: num(d[9]), perf1M: num(d[10]), perf3M: num(d[11]),
    perfYTD: num(d[12]), perf1Y: num(d[13]),
    high: num(d[14]), low: num(d[15]),
  };
}

function aggregateBasket(rows: RawRow[]): QuoteData & { components: number } {
  const valid = rows.filter((r) => num(r.d[2]) != null && num(r.d[2])! > 0);
  const avg = (idx: number): number | null => {
    const vals = valid.map((r) => num(r.d[idx])).filter((v): v is number => v != null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };
  return {
    close: avg(2), change: avg(3), changeAbs: avg(4),
    recommend: avg(5), rsi: avg(6), sma50: avg(7), sma200: avg(8),
    perfWeek: avg(9), perf1M: avg(10), perf3M: avg(11),
    perfYTD: avg(12), perf1Y: avg(13),
    high: avg(14), low: avg(15),
    components: valid.length,
  };
}

async function scan(endpoint: string, tickers: string[], columns: string[]): Promise<Map<string, RawRow>> {
  const out = new Map<string, RawRow>();
  if (tickers.length === 0) return out;
  try {
    const resp = await fetch(endpoint, {
      method: "POST", headers: TV_HEADERS,
      body: JSON.stringify({ columns, symbols: { tickers }, range: [0, tickers.length] }),
      cache: "no-store",
    });
    if (!resp.ok) return out;
    const data = await resp.json();
    for (const row of data?.data ?? []) out.set(row.s, row);
  } catch (e) { console.error(`scan ${endpoint} error:`, e); }
  return out;
}

/** Fetch foreign flow from Tradersaham API (no auth needed) */
async function fetchForeignFlow() {
  try {
    const resp = await fetch(`${TRADERSAHAM_API}/market-insight/foreign-flow`, {
      headers: TSAHAM_HEADERS, cache: "no-store",
    });
    if (!resp.ok) return null;
    const data = await resp.json();

    const topBuy = (data.accumulation ?? []).slice(0, 10).map((a: Record<string, unknown>) => ({
      ticker: a.stock_code, net: Math.round(Number(a.net_value ?? 0) / 1e6), // dalam Miliar
    }));
    const topSell = (data.distribution ?? []).slice(0, 10).map((d: Record<string, unknown>) => ({
      ticker: d.stock_code, net: Math.round(Number(d.net_value ?? 0) / 1e6),
    }));
    const weekNet = topBuy.reduce((s: number, b: { net: number }) => s + b.net, 0) +
                    topSell.reduce((s: number, d: { net: number }) => s + d.net, 0);

    return { date: data.date, weekNet, mtdNet: null, ytdNet: null, topBuy, topSell };
  } catch (e) {
    console.error("foreign flow error:", e);
    return null;
  }
}

/** Read manual overrides (BI Rate, trade balance, etc.) */
function readManualData() {
  const manualPath = join(process.cwd(), "data", "manual-market.json");
  if (!existsSync(manualPath)) return {};
  try {
    return JSON.parse(readFileSync(manualPath, "utf-8"));
  } catch { return {}; }
}

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    const indexKeys = ["COMPOSITE", "LQ45", "KOMPAS100", "IDX30", ...Object.keys(SECTOR_INDICES)];
    const indexTickers = indexKeys.map((k) => `IDX:${k}`);
    const basketTickers = Object.values(SECTOR_BASKETS).flatMap((b) => b.tickers.map((t) => `IDX:${t}`));
    const macroTickers = Object.values(MACRO_SYMBOLS).map((m) => m.symbol);

    const [idRows, macroRows, foreignFlow, manualData] = await Promise.all([
      scan(INDONESIA_SCANNER, [...indexTickers, ...basketTickers], COLUMNS),
      scan(GLOBAL_SCANNER, macroTickers, ["name", "close", "change", "change_abs"]),
      fetchForeignFlow(),
      readManualData(),
    ]);

    const ihsg = idRows.get("IDX:COMPOSITE") ?? null;
    const ihsgQuote = ihsg ? buildQuote(ihsg) : null;
    const buildSub = (sym: string) => { const row = idRows.get(sym); return row ? buildQuote(row) : null; };

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

    const macro: Record<string, { label: string; close: number | null; change: number | null }> = {};
    for (const [key, def] of Object.entries(MACRO_SYMBOLS)) {
      const row = macroRows.get(def.symbol);
      if (row) macro[key] = { label: def.label, close: num(row.d[1]), change: num(row.d[2]) };
    }

    const indexCount = sectors.filter((s) => s.type === "index").length;
    const basketCount = sectors.filter((s) => s.type === "basket").length;

    return NextResponse.json(
      {
        timestamp, ok: ihsgQuote != null,
        ihsg: ihsgQuote,
        lq45: buildSub("IDX:LQ45"), kompas100: buildSub("IDX:KOMPAS100"), idx30: buildSub("IDX:IDX30"),
        sectors, macro,
        foreignFlow, // auto from Tradersaham!
        manualData,  // BI Rate, trade balance (cron-updated)
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
