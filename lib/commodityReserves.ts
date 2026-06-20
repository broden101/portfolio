/**
 * Commodity reserve data — manually maintained from annual reports.
 * Pattern follows MARKET_OVERRIDES in lib/market.ts.
 * Update yearly after AR publication (~April).
 */

export type CommodityType = "coal" | "nickel" | "cpo" | "oilgas" | "gold" | "copperGold";

interface BaseReserve {
  ticker: string;
  type: CommodityType;
  asOf: string;           // "YYYY-MM-DD" — reserve statement date
  sourceUrl: string;      // annual report PDF link
  sharesOutstandingBn?: number; // fallback when StockAnalysis shares unavailable
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

export interface CopperGoldReserves extends BaseReserve {
  type: "copperGold";
  oreReserveMt: number;          // million tonnes ore reserves
  containedCopperMlbs: number;   // contained copper in reserves
  containedGoldMoz: number;      // contained gold in reserves
  annualThroughputMt: number;    // Mt/yr processed ore
  annualCopperMlbs: number;      // copper in concentrate/cathode equivalent
  annualGoldKoz: number;         // gold in concentrate/refined equivalent
  cashCostUSDperLb: number;      // C1 cash cost, net by-product credits
}

export type CommodityReserve = CoalReserves | NickelReserves | CpoReserves | OilGasReserves | GoldReserves | CopperGoldReserves;

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
  AMMN: {
    ticker: "AMMN", type: "copperGold", asOf: "2025-12-31",
    sourceUrl: "data/reserves/AMMN_2025.pdf",
    sharesOutstandingBn: 72.518217656,
    oreReserveMt: 3231,             // Batu Hijau 705Mt + Elang 2,526Mt ore reserves (JORC, 31 Dec 2024)
    containedCopperMlbs: 23450,     // Batu Hijau 5.61B lbs + Elang 17.84B lbs
    containedGoldMoz: 32.82,        // Batu Hijau 6.32Moz + Elang 26.5Moz
    annualThroughputMt: 32,         // 2025 mill throughput; conservative vs future Elang ramp-up
    annualCopperMlbs: 208.9,        // 2025 copper production in concentrate
    annualGoldKoz: 102.8,           // 2025 gold production in concentrate
    cashCostUSDperLb: -0.54,        // 2025 adjusted C1 cash cost, net by-product credits
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
