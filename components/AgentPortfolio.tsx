"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  PortfolioState,
  AgentState,
  loadPortfolio,
  savePortfolio,
  resetPortfolio,
  processAgent,
  calcValuation,
  enrichHoldings,
  formatIDR,
  bertotFilter,
  dondonFilter,
  ragaCCFilter,
  type PortfolioVal,
  type HoldingPL,
} from "@/lib/agent-portfolio";
import {
  loadJournal,
  saveJournal,
  loadEvolutions,
  analyzePerformance,
  processClosedTrades,
  generateSummaryReport,
  type JournalEntry,
  type AgentPerformance,
  type StrategyEvolution,
} from "@/lib/agent-learning";

const IDX100 = [
  "ACES","ADMR","ADRO","AKRA","AMMN","AMRT","ANTM","ARTO","ASII","ASSA",
  "BBCA","BBNI","BBRI","BBTN","BBYB","BKSL","BMRI","BMTR","BREN","BRIS",
  "BRMS","BRPT","BSDE","BTPS","BUKA","BULL","BUMI","BUVA","CBDK","CMRY",
  "CPIN","CTRA","CUAN","DEWA","DSNG","DSSA","ELSA","EMTK","ENRG","ERAA",
  "ESSA","EXCL","FILM","GOTO","HEAL","HMSP","HRTA","HRUM","ICBP","IMPC",
  "INCO","INDF","INDY","INET","INKP","INTP","ISAT","ITMG","JPFA","JSMR",
  "KIJA","KLBF","KPIG","MAPA","MAPI","MBMA","MDKA","MEDC","MIKA","MTEL",
  "MYOR","NCKL","PANI","PGAS","PGEO","PNLF","PSAB","PTBA","PTRO","PWON",
  "RAJA","RATU","SCMA","SGER","SIDO","SMGR","SMIL","SMRA","SSIA","TAPG",
  "TCPI","TINS","TLKM","TOBA","TOWR","TPIA","UNTR","UNVR","WIFI","WIRG",
];

type TabAgent = "all" | "bertot" | "dondon" | "ragaCC";
type InnerTab = "summary" | "log" | "learning";

// ─── Agent Card ────────────────────────────────────────────────────

function AgentCard({
  agent,
  stockData,
  active,
  onSelect,
}: {
  agent: AgentState;
  stockData: Record<string, number | string>[];
  active: boolean;
  onSelect: () => void;
}) {
  const v = calcValuation(agent, stockData);
  const holdings = enrichHoldings(agent.holdings, stockData);
  const openPositions = agent.holdings.length;
  const totalTrades = agent.trades.length;
  const gen = agent.evolutionGeneration || 0;

  return (
    <div
      className={`card-luxury p-6 cursor-pointer transition-all ${
        active ? "border-[#C6A15B]/60" : "border-[#2C261E] hover:border-[#C6A15B]/30"
      }`}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{agent.avatar}</span>
          <div>
            <div className="text-[#F4EFE6] font-heading font-medium">{agent.name}</div>
            <div className="text-[10px] text-[#B8AA96]/50">
              {agent.strategy}
              {gen > 0 && <span className="ml-1 text-[#C6A15B]/60">v{gen}</span>}
            </div>
          </div>
        </div>
        <span className={`font-heading text-lg font-medium ${
          v.returnPct >= 0 ? "text-emerald-400" : "text-red-400"
        }`}>
          {v.returnPct >= 0 ? "+" : ""}{v.returnPct.toFixed(1)}%
        </span>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <div className="text-[#B8AA96]/40">Portofolio</div>
          <div className="text-[#F4EFE6] font-mono mt-0.5">{formatIDR(v.totalValue)}</div>
        </div>
        <div>
          <div className="text-[#B8AA96]/40">Modal</div>
          <div className="text-[#F4EFE6] font-mono mt-0.5">{formatIDR(agent.capital)}</div>
        </div>
        <div>
          <div className="text-[#B8AA96]/40">Kas</div>
          <div className="text-[#F4EFE6] font-mono mt-0.5">{formatIDR(agent.cash)}</div>
        </div>
        <div>
          <div className="text-[#B8AA96]/40">Posisi</div>
          <div className="font-mono mt-0.5">
            <span className={v.unrealizedPnl >= 0 ? "text-emerald-400" : "text-red-400"}>
              {openPositions}/{4} | {v.unrealizedPnl >= 0 ? "+" : ""}{formatIDR(v.unrealizedPnl)}
            </span>
          </div>
        </div>
      </div>

      {/* Holdings */}
      {holdings.length > 0 && (
        <div className="mt-4 space-y-1.5">
          {holdings.map((h) => (
            <div key={h.ticker} className="flex items-center justify-between px-3 py-2 bg-[#0B0B0A] border border-[#2C261E]/50 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-[#F4EFE6]">{h.ticker}</span>
                <span className="text-[#B8AA96]/40">{h.lots} lot</span>
              </div>
              <div className="text-right">
                <div className="font-mono">
                  <span className={h.pnlPct >= 0 ? "text-emerald-400" : "text-red-400"}>
                    {h.pnlPct >= 0 ? "+" : ""}{(h.pnlPct * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-[10px] text-[#B8AA96]/40">{h.currentPrice.toLocaleString("id-ID")}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 text-[10px] text-[#B8AA96]/30">{totalTrades} transaksi</div>
    </div>
  );
}

// ─── Trade Log ──────────────────────────────────────────────────────

function TradeLog({
  trades,
  agentFilter,
}: {
  trades: { ticker: string; type: string; price: number; lots: number; date: string; reason: string; pnl?: number; agent: string }[];
  agentFilter: string;
}) {
  const filtered = agentFilter === "all" ? trades : trades.filter((t) => t.agent === agentFilter);

  if (filtered.length === 0) {
    return <div className="text-center text-[#B8AA96]/30 py-8 text-xs">Belum ada transaksi</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#2C261E]">
            <th className="text-left py-2 px-2 text-[#B8AA96]/50 font-medium">Tgl</th>
            <th className="text-left py-2 px-2 text-[#B8AA96]/50 font-medium">Agent</th>
            <th className="text-left py-2 px-2 text-[#B8AA96]/50 font-medium">Ticker</th>
            <th className="text-center py-2 px-2 text-[#B8AA96]/50 font-medium">Type</th>
            <th className="text-right py-2 px-2 text-[#B8AA96]/50 font-medium">Price</th>
            <th className="text-right py-2 px-2 text-[#B8AA96]/50 font-medium">Lot</th>
            <th className="text-right py-2 px-2 text-[#B8AA96]/50 font-medium">P&L</th>
            <th className="text-left py-2 px-2 text-[#B8AA96]/50 font-medium">Alasan</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((t, i) => (
            <tr key={i} className="border-b border-[#2C261E]/30 hover:bg-[#C6A15B]/5">
              <td className="py-2 px-2 text-[#B8AA96]/50 whitespace-nowrap">{t.date}</td>
              <td className="py-2 px-2">
                <span className={
                  t.agent === "bertot" ? "text-amber-400" :
                  t.agent === "dondon" ? "text-blue-400" : "text-emerald-400"
                }>{t.agent === "bertot" ? "Bertot" : t.agent === "dondon" ? "Dondon" : "ragaCC"}</span>
              </td>
              <td className="py-2 px-2 font-mono text-[#F4EFE6]">{t.ticker}</td>
              <td className="py-2 px-2 text-center">
                <span className={`px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase ${
                  t.type === "BUY"
                    ? "text-emerald-400 bg-emerald-500/10"
                    : "text-red-400 bg-red-500/10"
                }`}>{t.type}</span>
              </td>
              <td className="py-2 px-2 text-right font-mono text-[#F4EFE6]">{t.price.toLocaleString("id-ID")}</td>
              <td className="py-2 px-2 text-right font-mono text-[#B8AA96]">{t.lots}</td>
              <td className="py-2 px-2 text-right font-mono">
                {t.pnl !== undefined ? (
                  <span className={t.pnl >= 0 ? "text-emerald-400" : "text-red-400"}>
                    {t.pnl >= 0 ? "+" : ""}{formatIDR(t.pnl)}
                  </span>
                ) : <span className="text-[#2C261E]">—</span>}
              </td>
              <td className="py-2 px-2 text-[#B8AA96]/60">{t.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Learning Panel ────────────────────────────────────────────────

function LearningPanel({ journal, evolutions }: { journal: JournalEntry[]; evolutions: StrategyEvolution[] }) {
  const [agentFilter, setAgentFilter] = useState<"bertot" | "dondon" | "ragaCC">("bertot");

  const filteredJournal = journal.filter((j) => j.agentId === agentFilter);
  const perf = analyzePerformance(journal, agentFilter);
  const agentEvolutions = evolutions.filter((e) => e.agentId === agentFilter);
  const summary = generateSummaryReport(perf, journal);

  const gradeColors: Record<string, string> = {
    S: "text-emerald-400",
    A: "text-emerald-400",
    B: "text-blue-400",
    C: "text-amber-400",
    D: "text-orange-400",
    F: "text-red-400",
  };

  return (
    <div className="space-y-5">
      {/* Agent selector */}
      <div className="flex gap-1">
        {(["bertot", "dondon", "ragaCC"] as const).map((a) => (
          <button
            key={a}
            onClick={() => setAgentFilter(a)}
            className={`px-4 py-1.5 text-xs uppercase font-medium tracking-wider border transition-all ${
              agentFilter === a
                ? "bg-[#C6A15B]/15 text-[#C6A15B] border-[#C6A15B]/40"
                : "text-[#B8AA96]/50 border-[#2C261E] hover:text-[#B8AA96]"
            }`}
          >
            {a === "bertot" ? "🤖 Bertot" : a === "dondon" ? "🔄 Dondon" : "📈 ragaCC"}
          </button>
        ))}
      </div>

      {/* Performance card */}
      <div className="card-luxury p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm text-[#C6A15B] font-medium">📊 Ringkasan Performa</h3>
          <span className={`font-heading text-2xl font-bold ${gradeColors[perf.grade] || "text-[#B8AA96]"}`}>
            {perf.totalTrades >= 5 ? perf.grade : "—"}
          </span>
        </div>

        {perf.totalTrades === 0 ? (
          <div className="text-center text-[#B8AA96]/30 py-4 text-xs">
            Agent belum punya trade selesai. Jalankan Scan & Trade dulu.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="text-[#B8AA96]/40">Total Trade</div>
              <div className="text-[#F4EFE6] font-mono mt-0.5">{perf.totalTrades}</div>
            </div>
            <div>
              <div className="text-[#B8AA96]/40">Win Rate</div>
              <div className={`font-mono mt-0.5 ${perf.winRate >= 50 ? "text-emerald-400" : "text-red-400"}`}>
                {perf.winRate.toFixed(0)}%
              </div>
            </div>
            <div>
              <div className="text-[#B8AA96]/40">Profit Factor</div>
              <div className={`font-mono mt-0.5 ${perf.profitFactor >= 1.0 ? "text-emerald-400" : "text-red-400"}`}>
                {perf.profitFactor.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-[#B8AA96]/40">Avg R:R</div>
              <div className="font-mono mt-0.5 text-[#F4EFE6]">{perf.avgRR.toFixed(1)}</div>
            </div>
            <div>
              <div className="text-[#B8AA96]/40">Win / Loss / BE</div>
              <div className="font-mono mt-0.5">
                <span className="text-emerald-400">{perf.wins}</span>
                <span className="text-[#B8AA96]/30"> / </span>
                <span className="text-red-400">{perf.losses}</span>
                <span className="text-[#B8AA96]/30"> / </span>
                <span className="text-[#B8AA96]/50">{perf.breakeven}</span>
              </div>
            </div>
            <div>
              <div className="text-[#B8AA96]/40">Avg Win / Loss</div>
              <div className="font-mono mt-0.5">
                <span className="text-emerald-400">+{perf.avgWin.toFixed(1)}%</span>
                <span className="text-[#B8AA96]/30"> / </span>
                <span className="text-red-400">{perf.avgLoss.toFixed(1)}%</span>
              </div>
            </div>
            <div>
              <div className="text-[#B8AA96]/40">Rata-rata Hold</div>
              <div className="font-mono mt-0.5 text-[#F4EFE6]">{perf.avgHoldDays.toFixed(0)} hari</div>
            </div>
            <div>
              <div className="text-[#B8AA96]/40">Streak</div>
              <div className="font-mono mt-0.5">
                <span className={perf.streak.current === "WIN" ? "text-emerald-400" : "text-red-400"}>
                  {perf.streak.count}× {perf.streak.current === "WIN" ? "menang" : perf.streak.current === "LOSS" ? "kalah" : "—"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Journal entries */}
      {filteredJournal.length > 0 && (
        <div className="card-luxury p-6">
          <h3 className="text-sm text-[#C6A15B] font-medium mb-4">📝 Jurnal Trading</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {[...filteredJournal].reverse().slice(0, 20).map((entry) => (
              <div key={entry.id} className="p-3 bg-[#0B0B0A] border border-[#2C261E] text-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase rounded ${
                      entry.result === "WIN" ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"
                    }`}>{entry.result}</span>
                    <span className="font-mono font-semibold text-[#F4EFE6]">{entry.ticker}</span>
                    <span className="text-[#B8AA96]/50">{entry.signalType}</span>
                  </div>
                  <span className={entry.pnlPct >= 0 ? "text-emerald-400" : "text-red-400"}>
                    {entry.pnlPct >= 0 ? "+" : ""}{(entry.pnlPct * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[#B8AA96]/50 mb-1">
                  <span>Entry: {entry.entryPrice.toLocaleString("id-ID")}</span>
                  <span>Exit: {entry.exitPrice.toLocaleString("id-ID")}</span>
                  <span>R:R {entry.rrRatio.toFixed(1)}</span>
                  <span>{entry.holdingDays}h</span>
                </div>
                <div className="text-[#B8AA96]/70 italic">&ldquo;{entry.insight}&rdquo;</div>
                <div className="text-[#B8AA96]/30 text-[10px] mt-1">
                  {entry.entryDate} → {entry.exitDate} | {entry.exitReason}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strategy evolution */}
      {agentEvolutions.length > 0 && (
        <div className="card-luxury p-6">
          <h3 className="text-sm text-[#C6A15B] font-medium mb-4">🧬 Evolusi Strategi</h3>
          <div className="space-y-2">
            {[...agentEvolutions].reverse().map((evo, i) => (
              <div key={i} className="p-3 bg-[#0B0B0A] border border-[#2C261E] text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[#C6A15B]/80 font-medium">Generasi {evo.generation}</span>
                  <span className="text-[#B8AA96]/40">{evo.timestamp}</span>
                </div>
                <div className="space-y-1">
                  {evo.changes.map((c, j) => (
                    <div key={j} className="text-[#B8AA96]/70">→ {c}</div>
                  ))}
                </div>
                <div className="text-[#B8AA96]/50 mt-1 italic text-[10px]">Alasan: {evo.reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary report */}
      <div className="card-luxury p-6">
        <h3 className="text-sm text-[#C6A15B] font-medium mb-3">📋 Laporan Ringkas</h3>
        <pre className="text-xs text-[#B8AA96]/70 whitespace-pre-wrap font-sans leading-relaxed">{summary}</pre>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────

export default function AgentPortfolio() {
  const [portfolio, setPortfolio] = useState<PortfolioState>(loadPortfolio);
  const [stockData, setStockData] = useState<Record<string, number | string>[]>([]);
  const [scanning, setScanning] = useState(false);
  const [activeAgent, setActiveAgent] = useState<TabAgent>("all");
  const [innerTab, setInnerTab] = useState<InnerTab>("summary");
  const [lastAction, setLastAction] = useState("");

  // Auto-trade state
  const [autoTrade, setAutoTrade] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoInterval = 30 * 60; // 30 minutes in seconds

  // Journal & evolution state
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [evolutions, setEvolutions] = useState<StrategyEvolution[]>([]);

  // Load portfolio on mount
  useEffect(() => {
    setPortfolio(loadPortfolio());
    setJournal(loadJournal());
    setEvolutions(loadEvolutions());
  }, []);

  // Auto-trade timer
  useEffect(() => {
    if (autoTrade) {
      setCountdown(autoInterval);
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            // Trigger scan
            handleScan();
            return autoInterval;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setCountdown(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoTrade]);

  const handleScan = useCallback(async () => {
    setScanning(true);
    setLastAction("");
    try {
      const res = await fetch("/api/scanner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tickers: IDX100 }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Scanner failed");
      const data: Record<string, number | string>[] = json.data || [];
      setStockData(data);

      const p = loadPortfolio();

      const r1 = processAgent(p.bertot, data, bertotFilter, "BSJP");
      const r2 = processAgent(p.dondon, data, dondonFilter, "Reversal");
      const r3 = processAgent(p.ragaCC, data, ragaCCFilter, "Uptrend+VWAP");

      p.bertot = r1.agent;
      p.dondon = r2.agent;
      p.ragaCC = r3.agent;
      p.lastRun = new Date().toLocaleString("id-ID", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });

      savePortfolio(p);
      setPortfolio(p);

      // ── Process closed trades → journal → evolution ──
      const bResult = processClosedTrades(p.bertot, "BSJP");
      const dResult = processClosedTrades(p.dondon, "Reversal");
      const rResult = processClosedTrades(p.ragaCC, "Uptrend+VWAP");

      const allNewEntries = [...bResult.newEntries, ...dResult.newEntries, ...rResult.newEntries];
      const allEvolutions = [bResult.evolved, dResult.evolved, rResult.evolved].filter(Boolean) as StrategyEvolution[];

      if (allNewEntries.length > 0 || allEvolutions.length > 0) {
        setJournal(loadJournal());
        setEvolutions(loadEvolutions());
      }

      // Summary
      const totalBuy = r1.buys + r2.buys + r3.buys;
      const totalSell = r1.sells + r2.sells + r3.sells;
      const totalCL = r1.clTriggers.length + r2.clTriggers.length + r3.clTriggers.length;
      const totalTP = r1.tpTriggers.length + r2.tpTriggers.length + r3.tpTriggers.length;
      const parts: string[] = [];
      if (totalBuy > 0) parts.push(`${totalBuy} buy`);
      if (totalSell > 0) parts.push(`${totalSell} sell`);
      if (totalCL > 0) parts.push(`${totalCL} CL`);
      if (totalTP > 0) parts.push(`${totalTP} TP`);
      if (allNewEntries.length > 0) parts.push(`${allNewEntries.length} jurnal`);
      if (allEvolutions.length > 0) parts.push(`${allEvolutions.length} evolusi strategi`);
      setLastAction(parts.length > 0 ? parts.join(" | ") : "Tidak ada sinyal baru");
    } catch (e) {
      setLastAction(`Error: ${e instanceof Error ? e.message : "Gagal scan"}`);
    } finally {
      setScanning(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    const fresh = resetPortfolio();
    setPortfolio(fresh);
    setStockData([]);
    setLastAction("Portfolio di-reset");
    setJournal([]);
    setEvolutions([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("agent_journal");
      localStorage.removeItem("agent_evolution");
    }
  }, []);

  const allTrades = [
    ...portfolio.bertot.trades.map((t) => ({ ...t, agent: "bertot" as const })),
    ...portfolio.dondon.trades.map((t) => ({ ...t, agent: "dondon" as const })),
    ...portfolio.ragaCC.trades.map((t) => ({ ...t, agent: "ragaCC" as const })),
  ].sort((a, b) => (a.date > b.date ? -1 : b.date > a.date ? 1 : 0));

  const agents: AgentState[] = [portfolio.bertot, portfolio.dondon, portfolio.ragaCC];
  const totalPorto = agents.reduce((sum, a) => sum + calcValuation(a, stockData).totalValue, 0);
  const totalCapital = agents.reduce((sum, a) => sum + a.capital, 0);
  const totalReturnPct = ((totalPorto - totalCapital) / totalCapital) * 100;
  const totalTrades = allTrades.length;

  const formatCountdown = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <h2 className="text-sm text-[#C6A15B] font-medium">🤖 Agent Portfolio</h2>
          <div className="text-xs text-[#B8AA96]/40">
            {totalTrades} transaksi | {totalCapital.toLocaleString("id-ID")} modal
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Auto-trade toggle */}
          <button
            onClick={() => setAutoTrade(!autoTrade)}
            className={`px-4 py-2 text-[10px] tracking-wider uppercase font-medium border transition-all ${
              autoTrade
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                : "border-[#2C261E] text-[#B8AA96]/50 hover:text-[#B8AA96]"
            }`}
          >
            {autoTrade ? `⏱ ${formatCountdown(countdown)}` : "⏸ Auto"}
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 text-[10px] tracking-wider uppercase font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all"
          >
            Reset
          </button>
          <button
            onClick={handleScan}
            disabled={scanning}
            className="px-6 py-2.5 bg-[#C6A15B]/10 border border-[#C6A15B]/40 text-[#C6A15B] text-xs tracking-[0.15em] uppercase font-medium hover:bg-[#C6A15B]/20 transition-all disabled:opacity-40"
          >
            {scanning ? "Scanning..." : "Scan & Trade"}
          </button>
        </div>
      </div>

      {/* Last action */}
      {lastAction && (
        <div className="text-xs text-[#B8AA96]/40 px-1">
          {lastAction}
          {portfolio.lastRun && <span className="ml-2 text-[#B8AA96]/20">• {portfolio.lastRun}</span>}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-luxury p-5 text-center">
          <div className={`font-heading text-3xl font-medium ${totalReturnPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {totalReturnPct >= 0 ? "+" : ""}{totalReturnPct.toFixed(1)}%
          </div>
          <div className="text-[#B8AA96]/40 text-xs tracking-[0.2em] uppercase mt-1">Total Return</div>
        </div>
        <div className="card-luxury p-5 text-center">
          <div className="font-heading text-3xl font-medium text-[#F4EFE6]">{formatIDR(totalPorto)}</div>
          <div className="text-[#B8AA96]/40 text-xs tracking-[0.2em] uppercase mt-1">Portofolio</div>
        </div>
        <div className="card-luxury p-5 text-center">
          <div className="font-heading text-3xl font-medium text-[#F4EFE6]">{totalTrades}</div>
          <div className="text-[#B8AA96]/40 text-xs tracking-[0.2em] uppercase mt-1">Transaksi</div>
        </div>
        <div className="card-luxury p-5 text-center">
          <div className="font-heading text-3xl font-medium text-[#F4EFE6]">{formatIDR(totalCapital)}</div>
          <div className="text-[#B8AA96]/40 text-xs tracking-[0.2em] uppercase mt-1">Modal</div>
        </div>
      </div>

      {/* Inner tabs */}
      <div className="flex items-center gap-1 border-b border-[#2C261E]">
        {(["summary", "log", "learning"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setInnerTab(tab)}
            className={`px-5 py-2.5 text-xs tracking-wider uppercase font-medium border-b-2 -mb-px transition-all ${
              innerTab === tab
                ? "border-[#C6A15B] text-[#C6A15B]"
                : "border-transparent text-[#B8AA96]/40 hover:text-[#B8AA96]"
            }`}
          >
            {tab === "summary" ? "Ringkasan Agent" : tab === "log" ? "Log Transaksi" : "🧠 Pembelajaran"}
          </button>
        ))}
        {/* Journal notification dot */}
        {innerTab !== "learning" && journal.length > 0 && (
          <span className="text-[10px] text-emerald-500/60 ml-1">{journal.length} jurnal</span>
        )}
      </div>

      {/* Summary view */}
      {innerTab === "summary" && (
        <div className="grid md:grid-cols-3 gap-4">
          <AgentCard agent={portfolio.bertot} stockData={stockData} active={activeAgent === "bertot"} onSelect={() => setActiveAgent("bertot")} />
          <AgentCard agent={portfolio.dondon} stockData={stockData} active={activeAgent === "dondon"} onSelect={() => setActiveAgent("dondon")} />
          <AgentCard agent={portfolio.ragaCC} stockData={stockData} active={activeAgent === "ragaCC"} onSelect={() => setActiveAgent("ragaCC")} />
        </div>
      )}

      {/* Trade log */}
      {innerTab === "log" && (
        <div className="card-luxury p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-lg text-[#F4EFE6] font-medium">
              Log Transaksi <span className="text-[#B8AA96]/50 font-light">({allTrades.length})</span>
            </h3>
            <div className="flex gap-1">
              {(["all", "bertot", "dondon", "ragaCC"] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => setActiveAgent(a)}
                  className={`px-3 py-1 text-[10px] uppercase font-medium tracking-wider border transition-all ${
                    activeAgent === a
                      ? "bg-[#C6A15B]/15 text-[#C6A15B] border-[#C6A15B]/40"
                      : "text-[#B8AA96]/50 border-[#2C261E] hover:text-[#B8AA96]"
                  }`}
                >
                  {a === "all" ? "All" : a === "bertot" ? "Bertot" : a === "dondon" ? "Dondon" : "ragaCC"}
                </button>
              ))}
            </div>
          </div>
          <TradeLog trades={allTrades as any} agentFilter={activeAgent} />
        </div>
      )}

      {/* Learning panel */}
      {innerTab === "learning" && <LearningPanel journal={journal} evolutions={evolutions} />}

      {/* Empty state */}
      {!scanning && allTrades.length === 0 && !lastAction && innerTab !== "learning" && (
        <div className="card-luxury p-12 text-center">
          <div className="text-4xl mb-4">🤖</div>
          <div className="text-[#B8AA96]/30 text-sm mb-2">Belum ada agent aktif</div>
          <p className="text-[#B8AA96]/20 text-xs max-w-md mx-auto">
            3 agent virtual dengan modal @Rp100jt.
            Klik "Scan & Trade" atau aktifkan Auto Trading.
          </p>
          <p className="text-[#B8AA96]/15 text-[10px] mt-4 max-w-md mx-auto leading-relaxed">
            Bertot 🤖 → BSJP · Dondon 🔄 → Reversal · ragaCC 📈 → Uptrend+VWAP
          </p>
        </div>
      )}

      {/* Rules card */}
      <div className="card-luxury p-5 border border-[#2C261E]/50">
        <h4 className="text-xs text-[#C6A15B] font-medium mb-2">📋 Aturan Trading</h4>
        <div className="grid md:grid-cols-4 gap-3 text-[10px] text-[#B8AA96]/60 leading-relaxed">
          <div><span className="text-[#C6A15B]/80 font-medium">Umum:</span> Modal @Rp100jt · Max 4 posisi · 1 ticker/agent</div>
          <div><span className="text-emerald-400 font-medium">TP:</span> +4% (3-5%) · Eksekusi otomatis<br/></div>
          <div><span className="text-red-400 font-medium">CL:</span> -3% · Eksekusi otomatis</div>
          <div><span className="text-blue-400 font-medium">Auto:</span> Scan tiap 30 menit · Agent belajar dari hasil trade · Evolusi strategi otomatis</div>
        </div>
      </div>
    </div>
  );
}
