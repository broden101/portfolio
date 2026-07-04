import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

/**
 * /api/market — Realtime IHSG dashboard data
 *
 * Auto sources:
 *   - TradingView scanner → IHSG, sectors, macro
 *   - data/manual-market.json → Foreign flow + BI Rate + trade balance
 *     (auto-updated by VPS cron every 30 min)
 */

const INDONESIA_SCANNER = "https://scanner.tradingview.com/indonesia/scan";
const GLOBAL_SCANNER = "https://scanner.tradingview.com/global/scan";

const TV_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (compatible; RagaPlaybook/1.0)",
  "Content-Type": "application/json",
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
  IDXTECHNO: { name: "Technology", tickers: ["DCII", "ASII", "GOTO", "MLPT", "WIFI", "CYBR", "MTDL", "MSTI", "ASGR", "IRSX", "PTSN", "ATIC", "NFCX", "CHIP", "AXIO"] },
  IDXINFRA: { name: "Infrastructure", tickers: ["BREN", "MORA", "TLKM", "DNET", "CDIA", "ISAT", "EXCL", "MTEL", "PGEO", "RAJA", "POWR", "INET", "LINK", "KEEN", "DATA"] },
  IDXCYCLIC: { name: "Consumer Cyclicals", tickers: ["AMRT", "BELI", "CMRY", "EMTK", "MSIN", "MAPI", "AKRA", "VKTR", "MDIY", "BUVA", "FILM", "MAPA", "MGLV", "SCMA", "CITA"] },
  IDXNONCYC: { name: "Consumer Non-Cyclicals", tickers: ["PANI", "ICBP", "HMSP", "UNVR", "INDF", "MYOR", "GGRM", "FAPA", "ADES", "MLBI", "STTP", "ULTJ", "GOOD", "YUPI", "POLU"] },
  IDXTRANS: { name: "Transportation & Logistic", tickers: ["TCPI", "GIAA", "JSMR", "ELPI", "RMKE", "CMNP", "TMAS", "GMFI", "BULL", "MBSS", "SHIP", "SMDR", "CASS", "BIRD", "HATM"] },
};

const MACRO_SYMBOLS: Record<string, { symbol: string; label: string }> = {
  USDIDR: { symbol: "FX_IDC:USDIDR", label: "USD/IDR" },
  GOLD: { symbol: "TVC:GOLD", label: "Gold" },
  UKOIL: { symbol: "FX:UKOIL", label: "Brent Oil" },
  US10Y: { symbol: "TVC:US10Y", label: "US 10Y" },
  US02Y: { symbol: "TVC:US02Y", label: "US 2Y" },
  AMEX_EIDO: { symbol: "AMEX:EIDO", label: "EIDO (iShares MSCI Indonesia)" },
  SPX: { symbol: "SP:SPX", label: "S&P 500" },
  IXIC: { symbol: "NASDAQ:IXIC", label: "Nasdaq" },
  DJI: { symbol: "DJ:DJI", label: "Dow Jones" },
  DXY: { symbol: "TVC:DXY", label: "DXY" },
  VIX: { symbol: "TVC:VIX", label: "VIX" },
  NI225: { symbol: "TVC:NI225", label: "Nikkei 225" },
  HSI: { symbol: "TVC:HSI", label: "Hang Seng" },
  KOSPI: { symbol: "KRX:KOSPI", label: "KOSPI" },
  STI: { symbol: "TVC:STI", label: "STI" },
  NIFTY: { symbol: "NSE:NIFTY", label: "NIFTY 50" },
  BTC: { symbol: "BITSTAMP:BTCUSD", label: "BTC/USD" },
};

const COLUMNS = [
  "name", "description", "open", "close", "change", "change_abs",
  "Recommend.All", "RSI", "SMA20", "SMA50", "SMA100", "SMA200",
  "Perf.W", "Perf.1M", "Perf.3M", "Perf.YTD", "Perf.Y",
  "high", "low",
  "High.6M", "Low.6M", "High.3M", "Low.3M", "High.1M", "Low.1M",
  "volume",
];

interface RawRow { s: string; d: (string | number | null)[]; }
function num(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

interface QuoteData {
  open: number | null; close: number | null; change: number | null; changeAbs: number | null;
  recommend: number | null; rsi: number | null;
  sma20: number | null; sma50: number | null; sma100: number | null; sma200: number | null;
  perfWeek: number | null; perf1M: number | null; perf3M: number | null;
  perfYTD: number | null; perf1Y: number | null;
  high: number | null; low: number | null;
  high6M: number | null; low6M: number | null; high3M: number | null; low3M: number | null; high1M: number | null; low1M: number | null;
  volume: number | null;
}

function buildQuote(row: RawRow): QuoteData {
  const d = row.d;
  return {
    open: num(d[2]), close: num(d[3]), change: num(d[4]), changeAbs: num(d[5]),
    recommend: num(d[6]), rsi: num(d[7]), sma20: num(d[8]), sma50: num(d[9]), sma100: num(d[10]), sma200: num(d[11]),
    perfWeek: num(d[12]), perf1M: num(d[13]), perf3M: num(d[14]),
    perfYTD: num(d[15]), perf1Y: num(d[16]),
    high: num(d[17]), low: num(d[18]),
    high6M: num(d[19]), low6M: num(d[20]), high3M: num(d[21]), low3M: num(d[22]), high1M: num(d[23]), low1M: num(d[24]),
    volume: num(d[25]),
  };
}

function aggregateBasket(rows: RawRow[]): QuoteData & { components: number } {
  const valid = rows.filter((r) => num(r.d[3]) != null && num(r.d[3])! > 0);
  const avg = (idx: number): number | null => {
    const vals = valid.map((r) => num(r.d[idx])).filter((v): v is number => v != null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };
  return {
    open: avg(2), close: avg(3), change: avg(4), changeAbs: avg(5),
    recommend: avg(6), rsi: avg(7), sma20: avg(8), sma50: avg(9), sma100: avg(10), sma200: avg(11),
    perfWeek: avg(12), perf1M: avg(13), perf3M: avg(14),
    perfYTD: avg(15), perf1Y: avg(16),
    high: avg(17), low: avg(18),
    high6M: avg(19), low6M: avg(20), high3M: avg(21), low3M: avg(22), high1M: avg(23), low1M: avg(24),
    volume: valid.reduce((s, r) => s + (num(r.d[25]) ?? 0), 0),
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

/** Read manual data file (foreign flow, BI Rate, trade balance from VPS cron) */
function readManualData() {
  const manualPath = join(process.cwd(), "data", "manual-market.json");
  if (!existsSync(manualPath)) return {};
  try {
    return JSON.parse(readFileSync(manualPath, "utf-8"));
  } catch { return {}; }
}

function readTxnHistory() {
  const txnPath = join(process.cwd(), "data", "txn-history.json");
  if (!existsSync(txnPath)) return [];
  try {
    const data = JSON.parse(readFileSync(txnPath, "utf-8"));
    return (data.history || []).slice(-5).reverse(); // last 5, newest first
  } catch { return []; }
}

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    const indexKeys = ["COMPOSITE", "KOMPAS100", "IDX30", ...Object.keys(SECTOR_INDICES)];
    const indexTickers = indexKeys.map((k) => `IDX:${k}`);
    const basketTickers = Object.values(SECTOR_BASKETS).flatMap((b) => b.tickers.map((t) => `IDX:${t}`));
    const macroTickers = Object.values(MACRO_SYMBOLS).map((m) => m.symbol);

    const [idRows, macroRows, manualData] = await Promise.all([
      scan(INDONESIA_SCANNER, [...indexTickers, ...basketTickers], COLUMNS),
      scan(GLOBAL_SCANNER, macroTickers, ["name", "close", "change", "change_abs"]),
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

    // Extract foreign flow and manual data from the file
    const foreignFlow = manualData?.foreignFlow ?? null;
    const manualDataClean = {
      biRate: manualData?.biRate ?? { value: 5.50, note: "BI RDG" },
      tradeBalance: manualData?.tradeBalance ?? { value: 3.32, note: "Surplus" },
    };

    // Fetch total market transaction value (sum volume * close for all stocks)
    let totalMarketValue: number | null = null;
    try {
      const volResp = await fetch(INDONESIA_SCANNER, {
        method: "POST", headers: TV_HEADERS,
        body: JSON.stringify({
          columns: ["name", "volume", "close"],
          range: [0, 2000],
          sort: { sortBy: "market_cap_basic", sortOrder: "desc" },
          filter: [
            { left: "is_primary", operation: "equal", right: true },
            { left: "market_cap_basic", operation: "greater", right: 0 },
          ],
          symbols: { query: { types: ["stock"] } },
          markets: ["id"],
        }),
        cache: "no-store",
      });
      if (volResp.ok) {
        const volData = await volResp.json();
        totalMarketValue = (volData?.data ?? []).reduce(
          (sum: number, row: RawRow) => {
            const vol = num(row.d[1]) ?? 0;
            const close = num(row.d[2]) ?? 0;
            return sum + (vol * close);
          }, 0
        );
      }
    } catch (e) { console.error("value fetch error:", e); }

    const indexCount = sectors.filter((s) => s.type === "index").length;
    const basketCount = sectors.filter((s) => s.type === "basket").length;

    const txnHistory = readTxnHistory();

    return NextResponse.json(
      {
        timestamp, ok: ihsgQuote != null,
        ihsg: ihsgQuote ? { ...ihsgQuote, volume: totalMarketValue || null } : null,
        eido: macro.AMEX_EIDO ?? null, kompas100: buildSub("IDX:KOMPAS100"), idx30: buildSub("IDX:IDX30"),
        sectors, macro,
        foreignFlow, // from VPS cron → manual-market.json
        txnHistory, // last 5 days transaction value
        manualData: manualDataClean, // BI Rate, trade balance
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
