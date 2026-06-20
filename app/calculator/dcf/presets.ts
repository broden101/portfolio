/* ─── DCF Preset Data ─── */

export interface Preset {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  baseRevenue: number;  // T
  ebitMargin: number;   // %
  capexPct: number;     // %
  daPct: number;        // %
  wcPct: number;        // %
  shares: number;       // Miliar
  netDebt: number;      // T
  taxRate: number;
  growthRates: number[];// Y1-Y5 %
  wacc: number;
  terminalGrowth: number;
}

export interface BankPreset {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  bvPerShare: number;   // IDR
  roe: number;          // %
  payout: number;       // %
  eps: number;          // IDR
  dps: number;          // IDR
  shares: number;       // Miliar
  ke: number;           // %
  growthRates: number[];// Y1-Y5 %
  terminalGrowth: number;
}

import { hasReserves } from "@/lib/commodityReserves";

/* ── Check if preset is bank model (has bvPerShare field) ── */
export function isBank(idx: number, presets: (Preset | BankPreset)[]): boolean {
  const p = presets[idx];
  return p !== undefined && "bvPerShare" in p;
}

// Check if a ticker has commodity reserve data
export function isCommodity(ticker: string): boolean {
  return hasReserves(ticker);
}

/* ── Corporate (FCFF) Presets ── */
export const CORPORATE_PRESETS: Preset[] = [
  {
    ticker: "TLKM",
    name: "Telkom Indonesia",
    sector: "Telekomunikasi",
    price: 2650,
    baseRevenue: 148.0,
    ebitMargin: 32,
    capexPct: 18,
    daPct: 14,
    wcPct: 2,
    shares: 99000,
    netDebt: 65,
    taxRate: 22,
    growthRates: [8, 7, 7, 6, 6],
    wacc: 10.5,
    terminalGrowth: 5,
  },
  {
    ticker: "ASII",
    name: "Astra International",
    sector: "Konglomerat",
    price: 5400,
    baseRevenue: 310.0,
    ebitMargin: 14,
    capexPct: 5,
    daPct: 5,
    wcPct: 3,
    shares: 40500,
    netDebt: 35,
    taxRate: 22,
    growthRates: [10, 9, 8, 7, 6],
    wacc: 12,
    terminalGrowth: 5,
  },
  {
    ticker: "UNVR",
    name: "Unilever Indonesia",
    sector: "Consumer",
    price: 3800,
    baseRevenue: 46.0,
    ebitMargin: 22,
    capexPct: 3,
    daPct: 4,
    wcPct: 1,
    shares: 3800,
    netDebt: -8,
    taxRate: 22,
    growthRates: [6, 6, 5, 5, 5],
    wacc: 10.5,
    terminalGrowth: 4.5,
  },
  {
    ticker: "CUSTOM",
    name: "Custom",
    sector: "-",
    price: 0,
    baseRevenue: 0,
    ebitMargin: 25,
    capexPct: 5,
    daPct: 5,
    wcPct: 3,
    shares: 1000,
    netDebt: 0,
    taxRate: 22,
    growthRates: [10, 10, 8, 8, 6],
    wacc: 12,
    terminalGrowth: 5,
  },
];

/* ── Bank Presets (RIM + DDM) ── */
export const BANK_PRESETS: BankPreset[] = [
  {
    ticker: "BBCA",
    name: "Bank BCA",
    sector: "Banking",
    price: 9500,
    bvPerShare: 2500,
    roe: 23,
    payout: 45,
    eps: 575,
    dps: 259,
    shares: 12400,
    ke: 10.25,
    growthRates: [12.7, 10.5, 8.4, 6.3, 4.2],
    terminalGrowth: 3,
  },
  {
    ticker: "BMRI",
    name: "Bank Mandiri",
    sector: "Banking",
    price: 7100,
    bvPerShare: 4200,
    roe: 20,
    payout: 50,
    eps: 840,
    dps: 420,
    shares: 4650,
    ke: 10.5,
    growthRates: [10.0, 8.3, 6.5, 4.8, 3.0],
    terminalGrowth: 3,
  },
  {
    ticker: "BBRI",
    name: "Bank BRI",
    sector: "Banking",
    price: 4200,
    bvPerShare: 1800,
    roe: 19,
    payout: 48,
    eps: 342,
    dps: 164,
    shares: 15200,
    ke: 11.25,
    growthRates: [9.9, 8.3, 6.6, 4.9, 3.0],
    terminalGrowth: 3,
  },
  {
    ticker: "BBNI",
    name: "Bank Negara Indonesia",
    sector: "Banking",
    price: 3730,
    bvPerShare: 3500,
    roe: 16,
    payout: 45,
    eps: 560,
    dps: 252,
    shares: 4100,
    ke: 10.5,
    growthRates: [8.8, 7.4, 5.9, 4.5, 3.0],
    terminalGrowth: 3,
  },
];

/* ── Combined preset list: bank first, then corporate ── */
export const ALL_PRESETS: (Preset | BankPreset)[] = [
  ...BANK_PRESETS,
  ...CORPORATE_PRESETS,
];
