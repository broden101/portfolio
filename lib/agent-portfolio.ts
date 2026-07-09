// Agent Portfolio – Virtual trading simulator
// Each agent starts with Rp 100 juta, max 4 positions @ Rp 25 jt each.
// Rules: CL -3%, TP +4% (middle of 3-5% range).
// Agents use learned params from agent-learning when available.

export interface AgentHolding {
  ticker: string;
  buyPrice: number;
  lots: number;       // IDX lot = 100 shares
  buyDate: string;
  strategy: string;
}

export interface AgentTrade {
  ticker: string;
  type: "BUY" | "SELL";
  price: number;
  lots: number;
  date: string;
  reason: string;     // "BSJP signal", "CL -3.2%", "TP +4.1%"
  pnl?: number;       // realized P&L for sells (IDR)
}

export interface LearnedParams {
  clPct: number;
  tpPct: number;
  positionSizePct: number;
  maxPositions: number;
  minVolRatio: number;
  minRsi: number;
  maxRsi: number;
}

export interface AgentState {
  name: string;
  avatar: string;     // emoji
  strategy: string;
  capital: number;    // initial capital (fixed)
  cash: number;       // available cash
  holdings: AgentHolding[];
  trades: AgentTrade[];
  learnedParams?: LearnedParams;
  evolutionGeneration?: number;
}

export interface PortfolioState {
  bertot: AgentState;
  dondon: AgentState;
  ragaCC: AgentState;
  lastRun: string | null;
}

// ─── Constants ────────────────────────────────────────────────────
const STORAGE_KEY = "agent_portfolio";
const INITIAL_CAPITAL = 100_000_000;   // Rp 100 juta
const POSITION_SIZE = 25_000_000;      // Rp 25 juta per trade
const MAX_POSITIONS = 4;
const CL_PCT = -0.03;                  // -3%
const TP_PCT = 0.04;                   // +4%

// ─── Initial state ────────────────────────────────────────────────
function createInitial(): PortfolioState {
  return {
    bertot: {
      name: "Bertot",
      avatar: "🤖",
      strategy: "BSJP (Beli Sore Jual Pagi)",
      capital: INITIAL_CAPITAL,
      cash: INITIAL_CAPITAL,
      holdings: [],
      trades: [],
      evolutionGeneration: 0,
    },
    dondon: {
      name: "Dondon",
      avatar: "🔄",
      strategy: "Reversal (RSI < 35 + MACD ↑)",
      capital: INITIAL_CAPITAL,
      cash: INITIAL_CAPITAL,
      holdings: [],
      trades: [],
      evolutionGeneration: 0,
    },
    ragaCC: {
      name: "ragaCC",
      avatar: "📈",
      strategy: "Strong Uptrend + VWAP Cross",
      capital: INITIAL_CAPITAL,
      cash: INITIAL_CAPITAL,
      holdings: [],
      trades: [],
      evolutionGeneration: 0,
    },
    lastRun: null,
  };
}

// ─── Persistence ──────────────────────────────────────────────────
export function loadPortfolio(): PortfolioState {
  if (typeof window === "undefined") return createInitial();
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return createInitial();
  try {
    const parsed = JSON.parse(raw) as PortfolioState;
    if (!parsed.bertot || !parsed.dondon || !parsed.ragaCC) return createInitial();
    return parsed;
  } catch {
    return createInitial();
  }
}

export function savePortfolio(state: PortfolioState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetPortfolio(): PortfolioState {
  const fresh = createInitial();
  savePortfolio(fresh);
  return fresh;
}

// ─── Helpers ──────────────────────────────────────────────────────
function formatIDR(val: number): string {
  if (Math.abs(val) >= 1e12) return `Rp${(val / 1e12).toFixed(2)}T`;
  if (Math.abs(val) >= 1e9) return `Rp${(val / 1e9).toFixed(2)}M`;
  if (Math.abs(val) >= 1e6) return `Rp${(val / 1e6).toFixed(1)}jt`;
  return `Rp${val.toLocaleString("id-ID")}`;
}

export { formatIDR };

// ─── Strategy filters ─────────────────────────────────────────────
type StockRow = Record<string, number | string>;

export function bertotFilter(stock: StockRow): boolean {
  const close = Number(stock.close);
  const high = Number(stock.high);
  const vol = Number(stock.volume);
  const avgVol = Number(stock.avg_vol_10d);
  const vwap = Number(stock.vwap);
  const rsi = Number(stock.rsi);
  const closeNearHigh = high > 0 && ((high - close) / high) * 100 <= 3;
  const volRatio = avgVol > 0 ? vol / avgVol : 0;
  return closeNearHigh && volRatio >= 1.2 && close >= vwap && rsi >= 35 && rsi <= 70;
}

export function dondonFilter(stock: StockRow): boolean {
  const rsi = Number(stock.rsi);
  const macd = Number(stock.macd);
  const signal = Number(stock.macd_signal);
  return rsi < 35 && (macd - signal) > 0;
}

export function ragaCCFilter(stock: StockRow): boolean {
  const close = Number(stock.close);
  const sma20 = Number(stock.sma20);
  const sma50 = Number(stock.sma50);
  const vwap = Number(stock.vwap);
  return close > sma20 && sma20 > sma50 && close > vwap;
}

// ─── Core agent processing ────────────────────────────────────────
export interface ProcessResult {
  agent: AgentState;
  buys: number;
  sells: number;
  clTriggers: string[];
  tpTriggers: string[];
}

export function processAgent(
  agent: AgentState,
  stockData: StockRow[],
  strategyFilter: (stock: StockRow) => boolean,
  strategyName: string,
): ProcessResult {
  // Use learned params from agent if available, else defaults
  const lp = agent.learnedParams;
  const clPct = (lp ? lp.clPct : -3) / 100;         // -3 → -0.03
  const tpPct = (lp ? lp.tpPct : 4) / 100;           // 4 → 0.04
  const maxPos = lp ? lp.maxPositions : MAX_POSITIONS;
  const sizePct = lp ? lp.positionSizePct : 25;      // % of capital per position
  const positionSize = Math.round(agent.capital * (sizePct / 100));

  const calcLotsForAgent = (price: number): number => {
    if (price <= 0) return 0;
    const shares = Math.floor(positionSize / (price * 100)) * 100;
    return shares / 100;
  };

  let buys = 0;
  let sells = 0;
  const clTriggers: string[] = [];
  const tpTriggers: string[] = [];
  const now = new Date().toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  // ── Step 1: Evaluate CL/TP on existing holdings ──
  const remaining: AgentHolding[] = [];
  for (const holding of agent.holdings) {
    const stock = stockData.find((s) => String(s.name) === holding.ticker);
    if (!stock) {
      remaining.push(holding);
      continue;
    }

    const currentPrice = Number(stock.close);
    const pnlPct = (currentPrice - holding.buyPrice) / holding.buyPrice;

    let sellReason = "";
    if (pnlPct <= clPct) {
      sellReason = `CL ${(pnlPct * 100).toFixed(1)}%`;
      clTriggers.push(holding.ticker);
    } else if (pnlPct >= tpPct) {
      sellReason = `TP +${(pnlPct * 100).toFixed(1)}%`;
      tpTriggers.push(holding.ticker);
    }

    if (sellReason) {
      const totalValue = currentPrice * holding.lots * 100;
      const buyValue = holding.buyPrice * holding.lots * 100;
      const pnl = totalValue - buyValue;
      agent.cash += totalValue;
      agent.trades.unshift({
        ticker: holding.ticker,
        type: "SELL",
        price: currentPrice,
        lots: holding.lots,
        date: now,
        reason: sellReason,
        pnl,
      });
      sells++;
    } else {
      remaining.push(holding);
    }
  }
  agent.holdings = remaining;

  // ── Step 2: Try to buy new signals ──
  const openSlots = maxPos - agent.holdings.length;
  if (openSlots <= 0) return { agent, buys, sells, clTriggers, tpTriggers };

  const signals = stockData.filter((s) => strategyFilter(s));
  signals.sort((a, b) => Number(b.mcap || 0) - Number(a.mcap || 0));

  const heldTickers = new Set(agent.holdings.map((h) => h.ticker));

  for (const stock of signals) {
    if (buys >= openSlots) break;
    const ticker = String(stock.name);
    if (heldTickers.has(ticker)) continue;

    const price = Number(stock.close);
    if (price <= 0) continue;

    const lots = calcLotsForAgent(price);
    if (lots <= 0) continue;

    const cost = price * lots * 100;
    if (cost > agent.cash) continue;

    agent.cash -= cost;
    agent.holdings.push({
      ticker,
      buyPrice: price,
      lots,
      buyDate: now,
      strategy: strategyName,
    });
    agent.trades.unshift({
      ticker,
      type: "BUY",
      price,
      lots,
      date: now,
      reason: strategyName,
    });
    buys++;
    heldTickers.add(ticker);
  }

  return { agent, buys, sells, clTriggers, tpTriggers };
}

// ─── Portfolio valuation ──────────────────────────────────────────
export interface PortfolioVal {
  totalValue: number;
  holdingsValue: number;
  unrealizedPnl: number;
  realizedPnl: number;
  returnPct: number;
}

export function calcValuation(
  agent: AgentState,
  stockData: StockRow[],
): PortfolioVal {
  let holdingsValue = 0;
  let costBasis = 0;

  for (const h of agent.holdings) {
    const stock = stockData.find((s) => String(s.name) === h.ticker);
    const currentPrice = stock ? Number(stock.close) : h.buyPrice;
    holdingsValue += currentPrice * h.lots * 100;
    costBasis += h.buyPrice * h.lots * 100;
  }

  const unrealizedPnl = holdingsValue - costBasis;
  const realizedPnl = agent.trades
    .filter((t) => t.type === "SELL")
    .reduce((sum, t) => sum + (t.pnl || 0), 0);

  const totalValue = agent.cash + holdingsValue;
  const returnPct = ((totalValue - agent.capital) / agent.capital) * 100;

  return { totalValue, holdingsValue, unrealizedPnl, realizedPnl, returnPct };
}

// ─── Holding P&L helper ───────────────────────────────────────────
export interface HoldingPL extends AgentHolding {
  currentPrice: number;
  pnlPct: number;
  pnlIDR: number;
  marketValue: number;
}

export function enrichHoldings(
  holdings: AgentHolding[],
  stockData: StockRow[],
): HoldingPL[] {
  return holdings.map((h) => {
    const stock = stockData.find((s) => String(s.name) === h.ticker);
    const currentPrice = (stock ? Number(stock.close) : null) ?? h.buyPrice ?? 0;
    const pnlPct = h.buyPrice > 0 ? (currentPrice - h.buyPrice) / h.buyPrice : 0;
    const pnlIDR = (currentPrice - (h.buyPrice ?? 0)) * h.lots * 100;
    const marketValue = currentPrice * h.lots * 100;
    return { ...h, currentPrice: currentPrice || 0, pnlPct, pnlIDR, marketValue };
  });
}
