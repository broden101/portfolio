/**
 * Commodity reserve data — manually maintained from annual reports.
 * Pattern follows MARKET_OVERRIDES in lib/market.ts.
 * Update yearly after AR publication (~April).
 */

export type CommodityType = "coal" | "nickel" | "cpo" | "oilgas" | "gold" | "copperGold" | "tin";

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

export interface TinReserves extends BaseReserve {
  type: "tin";
  provenT: number;              // contained tin tonnes
  resourcesT: number;           // additional resources tonnes
  annualProductionT: number;    // tonnes tin/yr
  cashCostUSDperTonne: number;
}

export type CommodityReserve = CoalReserves | NickelReserves | CpoReserves | OilGasReserves | GoldReserves | CopperGoldReserves | TinReserves;

/**
 * Static reserve data cache. Updated yearly from annual reports.
 */
export const COMMODITY_RESERVES: Record<string, CommodityReserve> = {
  INCO: {
    ticker: "INCO",
    type: "nickel",
    asOf: "2025-12-31",
    sourceUrl: "https://vale.com/documents/d/guest/pt-vale-indonesia-tbk-laporan-tahunan-2025-1",
    sharesOutstandingBn: 10.54,
    measuredIndicatedDMT_M: 350.08,
    gradeNiPct: 1.14,
    recovery: 0.85,
    annualMatteT: 73093,
    cashCostUSDperTonneMatte: 9339,
  },
  PSAB: {
    ticker: "PSAB", type: "gold", asOf: "2025-12-31",
    sourceUrl: "data/reserves/PSAB_2025.pdf",
    sharesOutstandingBn: 26.46,
    provenProbableOz: 2174000,
    measuredIndicatedInferredOz: 5201000,
    annualProductionOz: 95000, // mid-point conservative from Bakan 70-120k; other projects not all producing
    cashCostUSDperOz: 1500,
  },
  ARCI: {
    ticker: "ARCI", type: "gold", asOf: "2025-12-31",
    sourceUrl: "data/reserves/ARCI_2025.pdf",
    sharesOutstandingBn: 31.1,
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
  ADRO: {
    ticker: "ADRO", type: "coal", asOf: "2025-12-31",
    sourceUrl: "data/reserves/ADRO_2025.pdf",
    sharesOutstandingBn: 30.76,
    provenMt: 178.1,
    indicatedMt: 996.9,
    gradeGAR: 7600,
    annualProductionMt: 7.41,
    cashCostPerTonUSD: 95,
    stripRatio: 3.55,
  },
  ADMR: {
    ticker: "ADMR", type: "coal", asOf: "2025-12-31",
    sourceUrl: "data/reserves/ADMR_2025.pdf",
    sharesOutstandingBn: 40.88,
    provenMt: 177.2,
    indicatedMt: 996.9,
    gradeGAR: 7600,
    annualProductionMt: 7.41,
    cashCostPerTonUSD: 95,
    stripRatio: 3.55,
  },
  PTBA: {
    ticker: "PTBA", type: "coal", asOf: "2025-12-31",
    sourceUrl: "data/reserves/PTBA_2025.pdf",
    sharesOutstandingBn: 11.52,
    provenMt: 2880,
    indicatedMt: 5710,
    gradeGAR: 4600,
    annualProductionMt: 47.19,
    cashCostPerTonUSD: 35,
    stripRatio: 6.06,
  },
  BUMI: {
    ticker: "BUMI", type: "coal", asOf: "2025-12-31",
    sourceUrl: "data/reserves/BUMI_2025.pdf",
    sharesOutstandingBn: 371.34,
    provenMt: 2400,
    indicatedMt: 0,
    gradeGAR: 5000,
    annualProductionMt: 78,
    cashCostPerTonUSD: 41.3,
    stripRatio: 8.0,
  },
  AALI: {
    ticker: "AALI", type: "cpo", asOf: "2025-12-31",
    sourceUrl: "data/reserves/AALI_2025.pdf",
    sharesOutstandingBn: 1.925,
    plantedHectares: 280325,
    matureHectares: 260927,
    immatureHectares: 19399,
    ffbYieldPerHa: 14.46,
    cpoExtractionRate: 0.1938,
    annualCpoT: 1200000,
    cashCostIDRperKg: 6500,
  },
  TAPG: {
    ticker: "TAPG", type: "cpo", asOf: "2025-12-31",
    sourceUrl: "data/reserves/TAPG_2025.pdf",
    sharesOutstandingBn: 19.85254,
    plantedHectares: 159700,
    matureHectares: 140900,          // derived from 3.425Mt FFB / 24.3t per ha yield
    immatureHectares: 18800,
    ffbYieldPerHa: 24.3,
    cpoExtractionRate: 0.233,
    annualCpoT: 953000,
    cashCostIDRperKg: 6500,          // conservative CPO-equivalent cost proxy
  },
  MEDC: {
    ticker: "MEDC", type: "oilgas", asOf: "2025-12-31",
    sourceUrl: "data/reserves/MEDC_2025.pdf",
    sharesOutstandingBn: 25.14,
    provedDevelopedMMboe: 250,
    provedUndevelopedMMboe: 100,
    probableMMboe: 214,
    productionBoePerDay: 156000,
    cashCostPerBoeUSD: 8.6,
  },
  NCKL: {
    ticker: "NCKL", type: "nickel", asOf: "2025-12-31",
    sourceUrl: "data/reserves/NCKL_2025.pdf",
    sharesOutstandingBn: 63.10,
    measuredIndicatedDMT_M: 310.8,
    gradeNiPct: 1.35,
    recovery: 0.90,
    annualMatteT: 188581,
    cashCostUSDperTonneMatte: 9000,
  },
  TINS: {
    ticker: "TINS",
    type: "tin",
    asOf: "2025-12-31",
    sourceUrl: "data/reserves/TINS_2025.pdf",
    sharesOutstandingBn: 7.448,
    provenT: 313000,
    resourcesT: 780000,
    annualProductionT: 17784,
    cashCostUSDperTonne: 18000,
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
