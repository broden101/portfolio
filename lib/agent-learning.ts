// Agent Learning & Journal System
// Track outcomes, generate insights, evolve strategy naturally.

import type { AgentState, AgentTrade, AgentHolding } from "./agent-portfolio";

// ─── Types ────────────────────────────────────────────────────────

export interface JournalEntry {
  id: string;                    // unique id
  agentId: string;               // bertot | dondon | ragaCC
  ticker: string;
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  lots: number;
  pnl: number;                   // realized IDR
  pnlPct: number;                // percentage
  holdingDays: number;
  exitReason: "CL" | "TP";
  signalType: string;            // BSJP / Reversal / Uptrend+VWAP
  rrRatio: number;               // Risk:Reward achieved
  result: "WIN" | "LOSS" | "BREAKEVEN";
  insight: string;               // auto-generated lesson
  sector: string;                // stock sector if available
  volatility: number;            // price range during hold (approx)
}

export interface AgentPerformance {
  agentId: string;
  totalTrades: number;
  wins: number;
  losses: number;
  breakeven: number;
  winRate: number;
  avgWin: number;                 // avg P&L % on wins
  avgLoss: number;                // avg P&L % on losses
  profitFactor: number;           // total gross win / total gross loss
  avgRR: number;                  // avg R:R ratio
  avgHoldDays: number;
  totalPnl: number;
  maxWin: number;
  maxLoss: number;
  streak: { current: string; count: number }; // current win/loss streak
  grade: "S" | "A" | "B" | "C" | "D" | "F";
}

export interface StrategyEvolution {
  agentId: string;
  generation: number;             // how many times evolved
  timestamp: string;
  changes: string[];              // readable list of what changed
  params: StrategyParams;
  reason: string;                 // why these changes
}

export interface StrategyParams {
  clPct: number;                  // cut loss % (negative)
  tpPct: number;                  // take profit %
  positionSizePct: number;        // % of capital per position (0-100)
  maxPositions: number;
  minVolRatio: number;            // minimum volume ratio to signal
  minRsi: number;                 // min RSI for signals
  maxRsi: number;                 // max RSI for signals
}

// ─── Storage keys ─────────────────────────────────────────────────
const JOURNAL_KEY = "agent_journal";
const EVOLUTION_KEY = "agent_evolution";

// ─── Default strategy params ──────────────────────────────────────
export const DEFAULT_STRATEGY: StrategyParams = {
  clPct: -3,
  tpPct: 4,
  positionSizePct: 25,
  maxPositions: 4,
  minVolRatio: 0.8,
  minRsi: 15,
  maxRsi: 80,
};

// ─── Persistence ──────────────────────────────────────────────────

export function loadJournal(): JournalEntry[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(JOURNAL_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

export function saveJournal(entries: JournalEntry[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(entries));
}

export function loadEvolutions(): StrategyEvolution[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(EVOLUTION_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

export function saveEvolutions(evo: StrategyEvolution[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(EVOLUTION_KEY, JSON.stringify(evo));
}

// ─── Journal generation ───────────────────────────────────────────

function generateInsight(
  result: "WIN" | "LOSS" | "BREAKEVEN",
  pnlPct: number,
  exitReason: "CL" | "TP",
  signalType: string,
  holdingDays: number,
  rrRatio: number,
): string {
  const insights: string[] = [];

  if (result === "WIN") {
    if (pnlPct >= 5) insights.push("Profit besar! Setup ini punya momentum kuat.");
    if (rrRatio >= 3) insights.push(`R:R ${rrRatio.toFixed(1)} sangat bagus — pertahankan disiplin seperti ini.`);
    if (holdingDays <= 2) insights.push("Fast win — timing entry tepat.");
    if (holdingDays >= 7) insights.push("Butuh waktu lama sampai TP, pertimbangkan exit lebih awal di setup serupa.");
    insights.push(`Setup ${signalType} terbukti profit. Lanjutkan konsisten.`);
  } else if (result === "LOSS") {
    if (pnlPct <= -2.5) insights.push("CL hampir menyentuh batas — posisi bergerak cepat melawan. Cek apakah ada konfirmasi volume yang terlewat.");
    if (holdingDays <= 1) insights.push("Rugi cepat = entry mungkin terlalu terburu-buru.");
    if (holdingDays >= 5) insights.push("Rugi lambat = mungkin sebaiknya exit lebih awal saat tanda-tanda melemah.");
    insights.push(`Setup ${signalType} rugi kali ini. Evaluasi apakah market sedang tidak mendukung.`);
  } else {
    insights.push("Breakeven — netral. Tidak ada pelajaran khusus.");
  }

  // Pick first 2 insights max
  return insights.slice(0, 2).join(" ");
}

export function createJournalEntry(
  agentId: string,
  signalType: string,
  buyTrade: AgentTrade,
  sellTrade: AgentTrade,
  sector: string = "",
): JournalEntry {
  const pnlPct = (sellTrade.price - buyTrade.price) / buyTrade.price;
  const pnl = (sellTrade.price - buyTrade.price) * sellTrade.lots * 100;
  const holdingMs = new Date(sellTrade.date).getTime() - new Date(buyTrade.date).getTime();
  const holdingDays = Math.max(1, Math.round(holdingMs / (1000 * 60 * 60 * 24)));
  const rrRatio = Math.abs(pnlPct / 0.03); // reward vs 3% risk
  const exitReason = sellTrade.reason.startsWith("CL") ? "CL" as const : "TP" as const;
  const result: "WIN" | "LOSS" | "BREAKEVEN" = pnlPct > 0.1 ? "WIN" : pnlPct < -0.1 ? "LOSS" : "BREAKEVEN";
  const volatility = Math.abs(pnlPct) * 100; // simplified

  return {
    id: `${agentId}-${buyTrade.ticker}-${Date.now()}`,
    agentId,
    ticker: buyTrade.ticker,
    entryDate: buyTrade.date,
    exitDate: sellTrade.date,
    entryPrice: buyTrade.price,
    exitPrice: sellTrade.price,
    lots: buyTrade.lots,
    pnl,
    pnlPct,
    holdingDays,
    exitReason,
    signalType,
    rrRatio,
    result,
    insight: generateInsight(result, pnlPct, exitReason, signalType, holdingDays, rrRatio),
    sector,
    volatility,
  };
}

// ─── Performance analysis ─────────────────────────────────────────

function gradeAgent(winRate: number, profitFactor: number, totalTrades: number): AgentPerformance["grade"] {
  if (totalTrades < 5) return "C"; // not enough data
  if (winRate >= 65 && profitFactor >= 2.0) return "S";
  if (winRate >= 55 && profitFactor >= 1.5) return "A";
  if (winRate >= 45 && profitFactor >= 1.0) return "B";
  if (winRate >= 35 && profitFactor >= 0.7) return "C";
  if (winRate >= 25) return "D";
  return "F";
}

export function analyzePerformance(journal: JournalEntry[], agentId: string): AgentPerformance {
  const trades = journal.filter((j) => j.agentId === agentId);
  const wins = trades.filter((t) => t.result === "WIN");
  const losses = trades.filter((t) => t.result === "LOSS");
  const breakeven = trades.filter((t) => t.result === "BREAKEVEN");

  const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.pnlPct, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((s, t) => s + t.pnlPct, 0) / losses.length : 0;
  const totalGrossWin = wins.reduce((s, t) => s + t.pnlPct, 0);
  const totalGrossLoss = Math.abs(losses.reduce((s, t) => s + t.pnlPct, 0));
  const profitFactor = totalGrossLoss > 0 ? totalGrossWin / totalGrossLoss : totalGrossWin > 0 ? 99 : 0;
  const avgRR = trades.length > 0 ? trades.reduce((s, t) => s + t.rrRatio, 0) / trades.length : 0;
  const avgHoldDays = trades.length > 0 ? trades.reduce((s, t) => s + t.holdingDays, 0) / trades.length : 0;
  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const maxWin = wins.length > 0 ? Math.max(...wins.map((t) => t.pnlPct)) : 0;
  const maxLoss = losses.length > 0 ? Math.min(...losses.map((t) => t.pnlPct)) : 0;

  // Current streak
  let streakType = "none";
  let streakCount = 0;
  for (const t of [...trades].reverse()) {
    if (streakType === "none") { streakType = t.result; streakCount = 1; }
    else if (t.result === streakType) { streakCount++; }
    else break;
  }

  return {
    agentId,
    totalTrades: trades.length,
    wins: wins.length,
    losses: losses.length,
    breakeven: breakeven.length,
    winRate,
    avgWin: avgWin * 100,
    avgLoss: avgLoss * 100,
    profitFactor,
    avgRR,
    avgHoldDays,
    totalPnl,
    maxWin: maxWin * 100,
    maxLoss: maxLoss * 100,
    streak: { current: streakType, count: streakCount },
    grade: gradeAgent(winRate, profitFactor, trades.length),
  };
}

// ─── Strategy evolution engine ────────────────────────────────────

export function evolveStrategy(
  perf: AgentPerformance,
  currentParams: StrategyParams,
  agentId: string,
  evolutionCount: number,
): StrategyEvolution | null {
  // Only evolve after minimum trades
  if (perf.totalTrades < 5) return null;

  const newParams = { ...currentParams };
  const changes: string[] = [];
  const reasons: string[] = [];

  // ── Rule 1: Adjust CL based on avg loss ──
  if (perf.losses >= 3 && perf.avgLoss < -2) {
    // Frequent big losses → tighten CL
    const newCL = Math.max(-5, Math.round((perf.avgLoss * 0.7) * 10) / 10);
    if (newCL !== currentParams.clPct) {
      newParams.clPct = newCL;
      changes.push(`CL: ${currentParams.clPct}% → ${newCL}%`);
      reasons.push("Rata-rata rugi besar, CL diperketat");
    }
  } else if (perf.winRate > 60 && perf.avgLoss > -1.5) {
    // Doing well, give slightly more room
    const newCL = Math.min(-2, Math.round((currentParams.clPct * 1.1) * 10) / 10);
    if (newCL !== currentParams.clPct) {
      newParams.clPct = newCL;
      changes.push(`CL: ${currentParams.clPct}% → ${newCL}%`);
      reasons.push("Win rate bagus, CL dilonggarkan sedikit untuk ruang bernapas");
    }
  }

  // ── Rule 2: Adjust TP based on win pattern ──
  if (perf.winRate > 55 && perf.avgHoldDays > 5) {
    // Wins take too long → lower TP
    const newTP = Math.max(2.5, Math.round((currentParams.tpPct * 0.85) * 10) / 10);
    if (newTP !== currentParams.tpPct) {
      newParams.tpPct = newTP;
      changes.push(`TP: ${currentParams.tpPct}% → ${newTP}%`);
      reasons.push("TP sering butuh waktu lama, ambil profit lebih cepat");
    }
  } else if (perf.winRate > 50 && perf.avgHoldDays <= 2) {
    // Wins come fast → raise TP to capture more
    const newTP = Math.min(6, Math.round((currentParams.tpPct * 1.15) * 10) / 10);
    if (newTP !== currentParams.tpPct) {
      newParams.tpPct = newTP;
      changes.push(`TP: ${currentParams.tpPct}% → ${newTP}%`);
      reasons.push("Win cepat, TP dinaikkan untuk tangkap profit lebih besar");
    }
  }

  // ── Rule 3: Adjust position sizing ──
  if (perf.profitFactor < 1.0 && perf.totalTrades >= 8) {
    // Losing money → reduce position
    const newPct = Math.max(10, currentParams.positionSizePct - 5);
    if (newPct !== currentParams.positionSizePct) {
      newParams.positionSizePct = newPct;
      changes.push(`Posisi: ${currentParams.positionSizePct}% → ${newPct}%`);
      reasons.push("Profit factor negatif, kurangi risiko per posisi");
    }
  } else if (perf.profitFactor > 1.5 && perf.totalTrades >= 10) {
    // Consistently profitable → increase position slightly
    const newPct = Math.min(40, currentParams.positionSizePct + 3);
    if (newPct !== currentParams.positionSizePct) {
      newParams.positionSizePct = newPct;
      changes.push(`Posisi: ${currentParams.positionSizePct}% → ${newPct}%`);
      reasons.push("Profit factor bagus, naikkan sizing perlahan");
    }
  }

  // ── Rule 4: Adjust RSI filters ──
  if (perf.losses > perf.wins && perf.totalTrades >= 6) {
    // Tighten entry filters
    const newMinRsi = Math.min(25, currentParams.minRsi + 5);
    const newMaxRsi = Math.max(65, currentParams.maxRsi - 5);
    if (newMinRsi !== currentParams.minRsi || newMaxRsi !== currentParams.maxRsi) {
      newParams.minRsi = newMinRsi;
      newParams.maxRsi = newMaxRsi;
      changes.push(`RSI range: ${currentParams.minRsi}-${currentParams.maxRsi} → ${newMinRsi}-${newMaxRsi}`);
      reasons.push("Win rate rendah, filter RSI diperketat");
    }
  }

  // ── Rule 5: Adjust volume ratio ──
  if (perf.winRate < 40 && perf.totalTrades >= 5) {
    const newVol = Math.min(2.0, Math.round((currentParams.minVolRatio + 0.2) * 10) / 10);
    if (newVol !== currentParams.minVolRatio) {
      newParams.minVolRatio = newVol;
      changes.push(`Min Vol Ratio: ${currentParams.minVolRatio}x → ${newVol}x`);
      reasons.push("Volume terlalu lemah, filter volume diperketat");
    }
  }

  if (changes.length === 0) return null;

  return {
    agentId,
    generation: evolutionCount + 1,
    timestamp: new Date().toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    changes,
    params: newParams,
    reason: reasons.join("; "),
  };
}

// ─── Apply evolved params back to agent ───────────────────────────

export function applyEvolution(agent: AgentState, params: StrategyParams): void {
  // Store params in agent's metadata (we'll add this field)
  (agent as any).learnedParams = params;
}

export function getAgentParams(agent: AgentState): StrategyParams {
  return (agent as any).learnedParams || DEFAULT_STRATEGY;
}

// ─── Summary report (human-readable) ──────────────────────────────

export function generateSummaryReport(
  perf: AgentPerformance,
  journal: JournalEntry[],
): string {
  const agentNames: Record<string, string> = {
    bertot: "Bertot",
    dondon: "Dondon",
    ragaCC: "ragaCC",
  };
  const name = agentNames[perf.agentId] || perf.agentId;

  if (perf.totalTrades === 0) {
    return `${name} belum punya transaksi selesai.`;
  }

  const lines = [
    `📊 Laporan ${name} — Grade: ${perf.grade}`,
    ``,
    `Total: ${perf.totalTrades} trade | Win: ${perf.wins} | Loss: ${perf.losses} | BE: ${perf.breakeven}`,
    `Win Rate: ${perf.winRate.toFixed(0)}% | Profit Factor: ${perf.profitFactor.toFixed(2)}`,
    `Avg Win: +${perf.avgWin.toFixed(1)}% | Avg Loss: ${perf.avgLoss.toFixed(1)}%`,
    `Avg R:R: ${perf.avgRR.toFixed(1)} | Avg Hold: ${perf.avgHoldDays.toFixed(0)} hari`,
    `Max Win: +${perf.maxWin.toFixed(1)}% | Max Loss: ${perf.maxLoss.toFixed(1)}%`,
    `Total P&L: ${perf.totalPnl >= 0 ? "+" : ""}${formatIDRCompact(perf.totalPnl)}`,
    `Streak: ${perf.streak.count}× ${perf.streak.current}`,
  ];

  // Recent insights
  const recentInsights = journal
    .filter((j) => j.agentId === perf.agentId)
    .slice(-3)
    .reverse();
  if (recentInsights.length > 0) {
    lines.push("");
    lines.push("📝 Insight Terakhir:");
    recentInsights.forEach((j) => {
      lines.push(`  ${j.ticker} ${j.result} ${j.pnlPct >= 0 ? "+" : ""}${j.pnlPct.toFixed(1)}% — ${j.insight}`);
    });
  }

  return lines.join("\n");
}

function formatIDRCompact(val: number): string {
  const abs = Math.abs(val);
  const prefix = val < 0 ? "-" : "";
  if (abs >= 1e9) return `${prefix}Rp${(abs / 1e9).toFixed(2)}M`;
  if (abs >= 1e6) return `${prefix}Rp${(abs / 1e6).toFixed(1)}jt`;
  return `${prefix}Rp${abs.toLocaleString("id-ID")}`;
}

// ─── Process closed trades into journal ───────────────────────────

export function processClosedTrades(
  agent: AgentState,
  signalType: string,
): { newEntries: JournalEntry[]; evolved: StrategyEvolution | null } {
  const journal = loadJournal();
  const evolutions = loadEvolutions();

  // Find sell trades that don't have journal entries yet
  const sellTrades = agent.trades.filter((t) => t.type === "SELL");
  const existingIds = new Set(journal.map((j) => `${j.ticker}-${j.exitDate}`));

  const newEntries: JournalEntry[] = [];

  for (const sell of sellTrades) {
    const key = `${sell.ticker}-${sell.date}`;
    if (existingIds.has(key)) continue;

    // Find matching buy trade
    const buyTrade = agent.trades
      .filter((t) => t.type === "BUY" && t.ticker === sell.ticker)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .find((b) => new Date(b.date).getTime() <= new Date(sell.date).getTime());

    if (!buyTrade) continue;

    const entry = createJournalEntry(agent.name.toLowerCase(), signalType, buyTrade, sell);
    newEntries.push(entry);
    existingIds.add(key);
  }

  if (newEntries.length > 0) {
    const updatedJournal = [...journal, ...newEntries];
    saveJournal(updatedJournal);

    // Check if evolution should happen
    const agentEvolutions = evolutions.filter((e) => e.agentId === agent.name.toLowerCase());
    const perf = analyzePerformance(updatedJournal, agent.name.toLowerCase());
    const currentParams = getAgentParams(agent);

    const evolved = evolveStrategy(perf, currentParams, agent.name.toLowerCase(), agentEvolutions.length);
    if (evolved) {
      const updatedEvolutions = [...evolutions, evolved];
      saveEvolutions(updatedEvolutions);
    }

    return { newEntries, evolved };
  }

  return { newEntries: [], evolved: null };
}
