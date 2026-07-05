/**
 * lib/market.ts — Types + client helpers for the realtime IHSG dashboard.
 *
 * Auto-sources:
 *   - TradingView scanner → IHSG, sectors, macro
 *   - Tradersaham API → Foreign flow (auto, no auth)
 *   - manual-market.json → BI Rate, trade balance (cron)
 */

export interface Quote {
  open: number | null;
  close: number | null;
  change: number | null;
  changeAbs: number | null;
  recommend: number | null;
  rsi: number | null;
  sma20: number | null;
  sma50: number | null;
  sma100: number | null;
  sma200: number | null;
  perfWeek: number | null;
  perf1M: number | null;
  perf3M: number | null;
  perfYTD: number | null;
  perf1Y: number | null;
  high: number | null;
  low: number | null;
  high6M: number | null;
  low6M: number | null;
  high3M: number | null;
  low3M: number | null;
  high1M: number | null;
  low1M: number | null;
  volume: number | null;
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

export interface ForeignFlowStock {
  rank: number;
  stock_code: string;
  stock_name: string;
  close_price: number;
  net_value: number;
  net_volume: number;
  total_buy_volume: number;
  total_sell_volume: number;
  total_buy_value: number;
  total_sell_value: number;
}

export interface ForeignFlowData {
  date: string;
  weekNet: number;
  mtdNet: number | null;
  ytdNet: number | null;
  topBuy: { ticker: string; net: number }[];
  topSell: { ticker: string; net: number }[];
  rawAccumulation?: ForeignFlowStock[];
  rawDistribution?: ForeignFlowStock[];
  totalForeignBuy?: number;
  totalForeignSell?: number;
}

export interface ManualData {
  biRate?: { value: number; note: string; lastUpdated?: string };
  tradeBalance?: { value: number; note: string };
  inflation?: { value: number; note: string; month?: string };
  apbn?: { pendapatan: number; pendapatanTarget?: number; belanja: number; belanjaTarget?: number; deficit: number; deficitTarget?: number; unit: string; note?: string };
  gdp?: { growth: number; note: string; quarter?: string };
  bondYield10y?: { value: number; change?: number; note?: string };
}

export interface MarketData {
  timestamp: string;
  ok: boolean;
  ihsg: Quote | null;
  eido: Quote | null;
  kompas100: Quote | null;
  idx30: Quote | null;
  sectors: SectorQuote[];
  macro: Record<string, MacroQuote>;
  foreignFlow: ForeignFlowData | null;
  txnHistory: { date: string; value: number }[];
  manualData: ManualData;
  coverage?: {
    ihsg: boolean;
    sectorIndices: number;
    sectorBaskets: number;
    macro: number;
  };
}

/* ── Static structural data ── */
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
  IDXAGRI: { weight: 2.5, color: "#84CC16" },
};

export const KEY_LEVELS_FALLBACK = {
  support: [6631, 6305, 5408],
  resistance: [7528, 8099, 8996],
};

export const IHSG_FALLBACK: Quote = {
  open: 6192, close: 6127, change: -0.55, changeAbs: -34,
  recommend: -0.75, rsi: 23.4,
  sma20: 6400, sma50: 7071, sma100: 7400, sma200: 7950,
  perfWeek: 8.3, perf1M: -6.16, perf3M: -12.5,
  perfYTD: -29.4, perf1Y: -15.2,
  high: 9174, low: 5408,
  high6M: 9174, low6M: 5318, high3M: 7774, low3M: 5318, high1M: 6460, low1M: 5318,
  volume: 15000000000,
};

/* ── Fallback manual data ── */
export const FALLBACK_MANUAL: ManualData = {
  biRate: { value: 5.50, note: "BI RDG" },
  tradeBalance: { value: 4.03, note: "Surplus Jan-Mei 2026" },
  inflation: { value: 3.08, note: "yoy", month: "Mei" },
  apbn: { pendapatan: 1185.0, pendapatanTarget: 3153.6, belanja: 1365.4, belanjaTarget: 3842.7, deficit: 180.4, deficitTarget: 689.0, unit: "T", note: "Mei" },
  gdp: { growth: 5.6, note: "yoy", quarter: "Q1-2026" },
  bondYield10y: { value: 6.85, change: -0.02, note: "SBN FR" },
};

/* ── Formatting helpers ── */
export function fmtPct(v: number | null | undefined, withSign = true): string {
  if (v == null || !Number.isFinite(v)) return "—";
  const sign = withSign && v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}

export function fmtNum(v: number | null | undefined, digits = 0): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return v.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function recommendLabel(rec: number | null | undefined): { label: string; color: string } {
  if (rec == null || !Number.isFinite(rec)) return { label: "N/A", color: "text-[#B8AA96]/50" };
  if (rec <= -0.5) return { label: "Sell Kuat", color: "text-red-400" };
  if (rec < -0.1) return { label: "Sell", color: "text-red-400" };
  if (rec < 0.1) return { label: "Netral", color: "text-yellow-400" };
  if (rec < 0.5) return { label: "Buy", color: "text-emerald-400" };
  return { label: "Buy Kuat", color: "text-emerald-400" };
}

export function rsiLabel(rsi: number | null | undefined): { label: string; color: string } {
  if (rsi == null || !Number.isFinite(rsi)) return { label: "N/A", color: "text-[#B8AA96]/50" };
  if (rsi < 30) return { label: `Jenuh Jual (${rsi.toFixed(1)})`, color: "text-yellow-400" };
  if (rsi > 70) return { label: `Jenuh Beli (${rsi.toFixed(1)})`, color: "text-yellow-400" };
  return { label: rsi.toFixed(1), color: "text-[#B8AA96]" };
}

export function fmtMiliar(n: number): string {
  const abs = Math.abs(n);
  return `${n >= 0 ? "+" : "-"}Rp ${abs.toLocaleString("id-ID")}M`;
}

export function fmtTriliun(n: number): string {
  const abs = Math.abs(n);
  const t = abs / 1_000_000;
  return `${n >= 0 ? "+" : "-"}Rp ${t.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}T`;
}

export async function fetchMarketData(): Promise<MarketData> {
  const res = await fetch("/api/market", { cache: "no-store" });
  if (!res.ok) throw new Error("market fetch failed");
  return res.json();
}

export function isMarketOpen(date = new Date()): boolean {
  const wib = new Date(date.getTime() + (7 * 60 + date.getTimezoneOffset() * -1) * 60000);
  const day = wib.getDay();
  if (day === 0 || day === 6) return false;
  const mins = wib.getHours() * 60 + wib.getMinutes();
  return mins >= 9 * 60 && mins <= 15 * 60 + 50;
}
