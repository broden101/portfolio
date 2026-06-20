/**
 * Commodity reserve data — manually maintained from annual reports.
 * Pattern follows MARKET_OVERRIDES in lib/market.ts.
 * Update yearly after AR publication (~April).
 */

export type CommodityType = "coal" | "nickel" | "cpo" | "oilgas" | "gold";

interface BaseReserve {
  ticker: string;
  type: CommodityType;
  asOf: string;           // "YYYY-MM-DD" — reserve statement date
  sourceUrl: string;      // annual report PDF link
}

export interface CoalReserves extends BaseReserve {
  type: "coal";
  provenMt: number;           // million tonnes
  indicatedMt: number;
  gradeGAR: number;           // kcal/kg
  annualProductionMt: number; // Mt/yr
  cashCostPerTonUSD: number;  // US$/ton
  stripRatio: number;         // waste:ore
}

export interface NickelReserves extends BaseReserve {
  type: "nickel";
  measuredIndicatedDMT_M: number; // million DMT
  gradeNiPct: number;             // % Ni
  recovery: number;               // float, e.g. 0.85
  annualMatteT: number;           // tonnes matte/yr
  cashCostUSDperTonneMatte: number;
}

export interface CpoReserves extends BaseReserve {
  type: "cpo";
  plantedHectares: number;
  matureHectares: number;
  immatureHectares: number;
  ffbYieldPerHa: number;          // tonnes FFB/ha/yr
  cpoExtractionRate: number;      // e.g. 0.1922
  annualCpoT: number;             // tonnes CPO/yr
  cashCostIDRperKg: number;       // COGS-derived
}

export interface OilGasReserves extends BaseReserve {
  type: "oilgas";
  provedDevelopedMMboe: number;
  provedUndevelopedMMboe: number;
  probableMMboe: number;
  productionBoePerDay: number;
  cashCostPerBoeUSD: number;
}

export interface GoldReserves extends BaseReserve {
  type: "gold";
  provenProbableOz: number;     // contained gold ounces
  measuredIndicatedInferredOz: number;
  annualProductionOz: number;
  cashCostUSDperOz: number;     // or AISC if more conservative
  gradeGpt?: number;
}

export type CommodityReserve = CoalReserves | NickelReserves | CpoReserves | OilGasReserves | GoldReserves;

/**
 * Static reserve data cache. Updated yearly from annual reports.
 */
export const COMMODITY_RESERVES: Record<string, CommodityReserve> = {
  INCO: {
    ticker: "INCO",
    type: "nickel",
    asOf: "2025-12-31",
    sourceUrl: "https://vale.com/documents/d/guest/pt-vale-indonesia-tbk-laporan-tahunan-2025-1",
    measuredIndicatedDMT_M: 350.08,
    gradeNiPct: 1.14,
    recovery: 0.85,
    annualMatteT: 73093,
    cashCostUSDperTonneMatte: 9339,
  },
  PSAB: {
    ticker: "PSAB", type: "gold", asOf: "2025-12-31",
    sourceUrl: "data/reserves/PSAB_2025.pdf",
    provenProbableOz: 2174000,
    measuredIndicatedInferredOz: 5201000,
    annualProductionOz: 95000, // mid-point conservative from Bakan 70-120k; other projects not all producing
    cashCostUSDperOz: 1500,
  },
  ARCI: {
    ticker: "ARCI", type: "gold", asOf: "2025-12-31",
    sourceUrl: "data/reserves/ARCI_2025.pdf",
    provenProbableOz: 2500000,
    measuredIndicatedInferredOz: 2500000, // use same until full resource parsed
    annualProductionOz: 200000,
    cashCostUSDperOz: 1400,
  },
  // TODO: Seed after downloading annual reports via IR sites
  // ADRO: { ticker: "ADRO", type: "coal", ... } // alamtri.com
  // PTBA: { ticker: "PTBA", type: "coal", ... } // ptba.co.id
  // ITMG: { ticker: "ITMG", type: "coal", ... } // itmg.co.id
  // AALI: { ticker: "AALI", type: "cpo", ... }  // astra-agro.co.id
  // LSIP: { ticker: "LSIP", type: "cpo", ... }
  // MEDC: { ticker: "MEDC", type: "oilgas", ... } // medco.or.id
};

export function getReserves(ticker: string): CommodityReserve | null {
  return COMMODITY_RESERVES[ticker.toUpperCase()] ?? null;
}

export function hasReserves(ticker: string): boolean {
  return ticker.toUpperCase() in COMMODITY_RESERVES;
}

export const TICKERS_WITH_RESERVES = Object.keys(COMMODITY_RESERVES);
