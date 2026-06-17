/**
 * lib/market.ts — Types + client helpers for the realtime IHSG dashboard.
 *
 * Companion to app/api/market/route.ts (the server-side fetcher).
 *
 * REFRESH MODEL:
 *   - Client polls /api/market every 60s while the tab is visible (see useMarketData).
 *   - The server route caches for 60s (s-maxage) so concurrent clients share one TradingView hit.
 *   - Falls back gracefully to FALLBACK constants when the network/scanner is down, so the
 *     dashboard never renders empty.
 *
 * MANUAL DATA:
 *   - BI Rate, Trade Balance, Foreign Flow are stored in data/manual-market.json
 *   - Auto-updated via cron (scripts/update-bi-rate.py) for BI Rate
 *   - Manual update via POST /api/market/manual endpoint
 */

export interface Quote {
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

export interface SectorQuote extends Quote {
  code: string;
  name: string;
  type: "index" | "basket";
  components?: number;
}

export interface MacroQuote {
  label: string;
  close: number | null;
  change: number | null;
}

export interface ForeignFlowData {
  weekNet: number;
  mtdNet: number;
  ytdNet: number;
  topBuy: Array<{ ticker: string; net: number }>;
  topSell: Array<{ ticker: string; net: number }>;
  lastUpdated: string | null;
}

export interface ManualData {
  biRate: { value: number; note: string; lastUpdated: string | null };
  tradeBalance: { value: number; note: string; lastUpdated: string | null };
  foreignFlow: ForeignFlowData;
}

export interface MarketData {
  timestamp: string;
  ok: boolean;
  ihsg: Quote | null;
  lq45: Quote | null;
  kompas100: Quote | null;
  idx30: Quote | null;
  sectors: SectorQuote[];
  macro: Record<string, MacroQuote>;
  manualData?: ManualData;
  coverage?: {
    ihsg: boolean;
    sectorIndices: number;
    sectorBaskets: number;
    macro: number;
    manualDataSources: number;
  };
}

/* ──────────────────────────────────────────────────────────────────────────
   FALLBACK DATA — used when API is unreachable or manual data not available
   ────────────────────────────────────────────────────────────────────────── */

export const FALLBACK_MANUAL_DATA: ManualData = {
  biRate: { value: 5.50, note: "BI RDG", lastUpdated: null },
  tradeBalance: { value: 3.32, note: "Surplus", lastUpdated: null },
  foreignFlow: {
    weekNet: 0,
    mtdNet: 0,
    ytdNet: 0,
    topBuy: [
      { ticker: "BBCA", net: 0 }, { ticker: "BMRI", net: 0 },
      { ticker: "TLKM", net: 0 }, { ticker: "BBRI", net: 0 },
      { ticker: "BBNI", net: 0 },
    ],
    topSell: [
      { ticker: "ADRO", net: 0 }, { ticker: "MDKA", net: 0 },
      { ticker: "INDF", net: 0 }, { ticker: "ANTM", net: 0 },
      { ticker: "PTBA", net: 0 },
    ],
    lastUpdated: null,
  },
};

/* ── Static structural data (sector weights are fixed by IDX methodology) ── */
export const SECTOR_META: Record<string, { weight: number; color: string }> = {
  IDXFINANCE: { weight: 38.5, color: "#C6A15B" },
  IDXBASIC: { weight: 15.0, color: "#D97706" },
  IDXENERGY: { weight: 13.0, color: "#F97316" },
  IDXINFRA: { weight: 12.0, color: "#3B82F6" },
  IDXTECHNO: { weight: 10.0, color: "#14B8A6" },
  IDXNONCYC: { weight: 8.5, color: "#22C55E" },
  IDXINDUST: { weight: 7.5, color: "#A855F7" },
  IDXTRANS: { weight: 3.0, color: "#6366F1" },
  IDXCYCLIC: { weight: 5.5, color: "#06B6D4" },
  IDXPROPERT: { weight: 4.0, color: "#EC4899" },
  IDXHEALTH: { weight: 2.0, color: "#8B5CF6" },
};

/* ── IHSG chart structure — static technical levels, manually curated ── */
export const KEY_LEVELS_FALLBACK = {
  support: [6631, 6305, 5408],
  resistance: [7528, 8099, 8996],
};

/* ── Last-resort values so the page never renders empty (matches the
     original hardcoded page). Overwritten by live data when available. ── */
export const IHSG_FALLBACK: Quote = {
  close: 6127,
  change: -0.55,
  changeAbs: -34,
  recommend: -0.75,
  rsi: 23.4,
  sma50: 7071,
  sma200: 7950,
  perfWeek: 8.3,
  perf1M: -6.16,
  perf3M: -12.5,
  perfYTD: -29.4,
  perf1Y: -15.2,
  high: 9174,
  low: 5408,
};

/* ──────────────────────────────────────────────────────────────────────────
   Formatting helpers
   ────────────────────────────────────────────────────────────────────────── */

export function fmtPct(v: number | null | undefined, withSign = true): string {
  if (v == null || !Number.isFinite(v)) return "—";
  const sign = withSign && v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}

export function fmtNum(v: number | null | undefined, digits = 0): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return v.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/** Translate TradingView Recommend.All (-1..+1) to a label + colour class. */
export function recommendLabel(rec: number | null | undefined): { label: string; color: string } {
  if (rec == null || !Number.isFinite(rec)) return { label: "N/A", color: "text-[#B8AA96]/50" };
  if (rec <= -0.5) return { label: "Strong Sell", color: "text-red-400" };
  if (rec < -0.1) return { label: "Sell", color: "text-red-400" };
  if (rec < 0.1) return { label: "Neutral", color: "text-yellow-400" };
  if (rec < 0.5) return { label: "Buy", color: "text-emerald-400" };
  return { label: "Strong Buy", color: "text-emerald-400" };
}

export function rsiLabel(rsi: number | null | undefined): { label: string; color: string } {
  if (rsi == null || !Number.isFinite(rsi)) return { label: "N/A", color: "text-[#B8AA96]/50" };
  if (rsi < 30) return { label: `Oversold (${rsi.toFixed(1)})`, color: "text-yellow-400" };
  if (rsi > 70) return { label: `Overbought (${rsi.toFixed(1)})`, color: "text-yellow-400" };
  return { label: rsi.toFixed(1), color: "text-[#B8AA96]" };
}

export function fmtMiliar(n: number): string {
  const abs = Math.abs(n);
  return `${n >= 0 ? "+" : "-"}Rp ${abs.toLocaleString("id-ID")}M`;
}

/* ──────────────────────────────────────────────────────────────────────────
   Client data hook
   ────────────────────────────────────────────────────────────────────────── */

export async function fetchMarketData(): Promise<MarketData> {
  const res = await fetch("/api/market", { cache: "no-store" });
  if (!res.ok) throw new Error("market fetch failed");
  return res.json();
}

/** Helper to get manual data with fallback */
export function getManualData(data: MarketData | null): ManualData {
  return data?.manualData ?? FALLBACK_MANUAL_DATA;
}

/** Is the IDX currently in trading hours (Mon–Fri 09:00–15:50 WIB / UTC+7)? */
export function isMarketOpen(date = new Date()): boolean {
  // WIB = UTC+7
  const wib = new Date(date.getTime() + (7 * 60 + date.getTimezoneOffset() * -1) * 60000);
  const day = wib.getDay(); // 0 Sun … 6 Sat
  if (day === 0 || day === 6) return false;
  const mins = wib.getHours() * 60 + wib.getMinutes();
  return mins >= 9 * 60 && mins <= 15 * 60 + 50;
}
