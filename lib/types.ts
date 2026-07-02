// Stock data from TradingView
export interface StockData {
  name: string;
  desc: string;
  close: number;
  open?: number;
  high?: number;
  low?: number;
  mcap: number;
  volume: number;
  sma20: number;
  sma50: number;
  sma200: number;
  change: number;
  perf1m: number;
  perf3m: number;
  sector: string;
  vwap: number;
  avg_vol_10d: number;
  avg_vol_30d: number;
  high_all: number;
  low_all: number;
  rsi: number;
  macd: number;
  macd_signal: number;
}

export interface ScreenResult extends StockData {
  action: "BUY" | "WATCH" | "HOLD" | "AVOID";
  status: string;
  trend_score: number;
}

// Filter configuration
export interface FilterConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  params: Record<string, number>;
}

export interface ScreenerPreset {
  id: string;
  name: string;
  description: string;
  filters: FilterConfig[];
  universe: "IDX100" | "LQ45" | "CUSTOM";
  customTickers: string[];
  createdAt: string;
}

// Watchlist
export interface WatchlistItem {
  ticker: string;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  notes: string;
  addedAt: string;
  alerts: AlertRule[];
}

export interface AlertRule {
  id: string;
  condition: "above" | "below";
  price: number;
  triggered: boolean;
}

// App settings
export interface AppSettings {
  universe: "IDX100" | "LQ45" | "CUSTOM";
  customTickers: string[];
  activePresetId: string | null;
  presets: ScreenerPreset[];
  defaultFilters: FilterConfig[];
  telegramChatId: string;
}

// Default filter definitions
export const DEFAULT_FILTERS: FilterConfig[] = [
  {
    id: "uptrend",
    name: "Strong Uptrend",
    description: "Price > SMA20 > SMA50 > SMA200",
    enabled: true,
    params: { sma_short: 20, sma_mid: 50, sma_long: 200 },
  },
  {
    id: "momentum",
    name: "Momentum",
    description: "1M performance above threshold",
    enabled: false,
    params: { perf_threshold: 5 },
  },
  {
    id: "volume_surge",
    name: "Volume Surge",
    description: "Volume > N× average",
    enabled: false,
    params: { vol_multiplier: 1.5 },
  },
  {
    id: "vwap_cross",
    name: "VWAP Cross",
    description: "Price above VWAP",
    enabled: false,
    params: { vwap_pct_threshold: 0 },
  },
  {
    id: "breakout",
    name: "Breakout",
    description: "Price near 52-week high",
    enabled: false,
    params: { high_pct: 5 },
  },
  {
    id: "mean_reversion",
    name: "Mean Reversion",
    description: "Price below SMA20 (oversold bounce)",
    enabled: false,
    params: { below_pct: 3 },
  },
  {
    id: "hammer",
    name: "Hammer",
    description: "Candle dg body kecil & lower wick panjang (≥2× body)",
    enabled: false,
    params: {},
  },
  {
    id: "doji",
    name: "Doji",
    description: "Candle dg body sangat kecil (open≈close)",
    enabled: false,
    params: { body_pct: 0.1 },
  },
];

export const STOCK_UNIVERSES: Record<string, string[]> = {
  IDX100: [
    "BBCA", "BBRI", "BMRI", "BBNI", "BNGA", "BRIS", "BTPN", "BDMN",
    "NISP", "BGTG", "ARTO", "BBYB", "TLKM", "ISAT", "EXCL",
    "ASII", "UNVR", "ICBP", "INDF", "MYOR", "ADRO", "ITMG", "PTBA",
    "MEDC", "PGAS", "ELSA", "ANTM", "INCO", "MDKA", "AMMN", "BRMS",
    "TINS", "NCKL", "KLBF", "SIDO", "MIKA", "CPIN", "GGRM", "HMSP",
    "JPFA", "RALS", "JSMR", "PTPP", "ADHI", "BRPT", "TPIA", "SMGR",
    "INTP", "SMSM", "AKRA", "UNTR", "MAPI", "LPPF", "GOTO", "BUKA",
    "EMTK", "TOWR", "TBIG", "MTEL", "AALI", "LSIP", "DSNG", "MNCN",
    "SCMA", "BSDE", "CTRA", "SMRA", "PWON", "LPKR", "DILD", "AUTO",
    "BREN", "CUAN", "DSSA", "MBMA", "ESSA", "PTRO", "ARNA", "INDY", "HRUM",
  ],
  LQ45: [
    "ACES", "ADRO", "AMRT", "ANTM", "ASII", "BBCA", "BBNI", "BBRI",
    "BBTN", "BMRI", "BRPT", "BUKA", "CPIN", "EMTK", "ESSA", "EXCL",
    "GGRM", "GOTO", "HRUM", "ICBP", "INCO", "INDF", "INDY", "INKP",
    "INTP", "ISAT", "ITMG", "JPFA", "KLBF", "MDKA", "MEDC", "MIKA",
    "PGAS", "PGEO", "PTBA", "SIDO", "SMGR", "TBIG", "TINS", "TLKM",
    "TOWR", "TPIA", "UNTR", "UNVR",
  ],
};
