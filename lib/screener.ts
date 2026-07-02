import { FilterConfig, ScreenResult, StockData } from "./types";

// Apply a single filter to a stock, return score (0-1)
function applyFilter(stock: StockData, filter: FilterConfig): number {
  if (!filter.enabled) return 0;

  const p = stock.close || 0;
  const s20 = stock.sma20 || 0;
  const s50 = stock.sma50 || 0;
  const s200 = stock.sma200 || 0;
  const vwap = stock.vwap || 0;
  const avgVol = stock.avg_vol_10d || 0;
  const vol = stock.volume || 0;

  switch (filter.id) {
    case "uptrend": {
      let score = 0;
      if (p > s20 && s20 > 0) score += 0.33;
      if (s20 > s50 && s50 > 0) score += 0.33;
      if (s50 > s200 && s200 > 0) score += 0.34;
      return score;
    }
    case "momentum": {
      const threshold = filter.params.perf_threshold || 5;
      if (stock.perf1m >= threshold) return 1;
      if (stock.perf1m >= threshold / 2) return 0.5;
      return 0;
    }
    case "volume_surge": {
      const mult = filter.params.vol_multiplier || 1.5;
      if (avgVol <= 0) return 0;
      const ratio = vol / avgVol;
      if (ratio >= mult) return 1;
      if (ratio >= mult * 0.7) return 0.5;
      return 0;
    }
    case "vwap_cross": {
      if (vwap <= 0) return 0;
      const pct = ((p / vwap) - 1) * 100;
      if (pct >= 0) return 1;
      return 0;
    }
    case "breakout": {
      const highPct = filter.params.high_pct || 5;
      const highAll = stock.high_all || 0;
      if (highAll <= 0) return 0;
      const fromHigh = ((highAll - p) / highAll) * 100;
      if (fromHigh <= highPct) return 1;
      if (fromHigh <= highPct * 2) return 0.5;
      return 0;
    }
    case "mean_reversion": {
      const belowPct = filter.params.below_pct || 3;
      if (s20 <= 0) return 0;
      const diff = ((p - s20) / s20) * 100;
      if (diff < 0 && diff >= -belowPct * 2) return 1;
      if (diff < -belowPct * 2 && diff >= -belowPct * 3) return 0.5;
      return 0;
    }
    case "hammer": {
      const o = stock.open, h = stock.high, l = stock.low;
      if (o == null || h == null || l == null) return 0;
      const body = Math.abs(p - o);
      const lowerWick = Math.min(o, p) - l;
      const upperWick = h - Math.max(o, p);
      if (body <= 0) return 0;
      // Hammer: small body at top, long lower wick (>=2x body), short upper wick
      if (lowerWick >= 2 * body && upperWick <= body * 0.5) return 1;
      if (lowerWick >= 1.5 * body && upperWick <= body) return 0.5;
      return 0;
    }
    case "doji": {
      const o2 = stock.open;
      if (o2 == null) return 0;
      const bodyPct = filter.params.body_pct || 0.1;
      if (p <= 0) return 0;
      const bodyRatio = Math.abs(p - o2) / p;
      if (bodyRatio <= bodyPct) return 1;
      if (bodyRatio <= bodyPct * 2) return 0.5;
      return 0;
    }
    default:
      return 0;
  }
}

export function screenStock(
  stock: StockData,
  filters: FilterConfig[]
): ScreenResult {
  const enabledFilters = filters.filter((f) => f.enabled);

  // If no filters enabled, use basic uptrend
  if (enabledFilters.length === 0) {
    const p = stock.close || 0;
    const s20 = stock.sma20 || 0;
    const s50 = stock.sma50 || 0;
    const s200 = stock.sma200 || 0;
    let score = 0;
    if (p > s20 && s20 > 0) score += 1;
    if (s20 > s50 && s50 > 0) score += 1;
    if (s50 > s200 && s200 > 0) score += 1;

    return {
      ...stock,
      action: score === 3 ? "BUY" : score === 2 ? "WATCH" : score === 1 ? "HOLD" : "AVOID",
      status: score === 3 ? "STRONG UPTREND" : score === 2 ? "UPTREND" : score === 1 ? "SIDEWAYS" : "DOWNTREND",
      trend_score: score,
    };
  }

  // Calculate composite score from all enabled filters
  const totalScore = enabledFilters.reduce(
    (sum, f) => sum + applyFilter(stock, f),
    0
  );
  const maxScore = enabledFilters.length;
  const normalized = maxScore > 0 ? totalScore / maxScore : 0;

  let action: ScreenResult["action"];
  let status: string;

  if (normalized >= 0.8) {
    action = "BUY";
    status = "STRONG SIGNAL";
  } else if (normalized >= 0.5) {
    action = "WATCH";
    status = "MODERATE SIGNAL";
  } else if (normalized >= 0.3) {
    action = "HOLD";
    status = "WEAK SIGNAL";
  } else {
    action = "AVOID";
    status = "NO SIGNAL";
  }

  return {
    ...stock,
    action,
    status,
    trend_score: Math.round(normalized * 10),
  };
}

export function screenAll(
  stocks: StockData[],
  filters: FilterConfig[]
): ScreenResult[] {
  return stocks
    .map((s) => screenStock(s, filters))
    .sort((a, b) => b.trend_score - a.trend_score || (b.mcap || 0) - (a.mcap || 0));
}
