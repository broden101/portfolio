"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  calcValuation,
  enrichHoldings,
  formatIDR,
  type AgentState,
  type AgentHolding,
} from "@/lib/agent-portfolio";

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

// ─── Map server agent to AgentState ────────────────────────────────
function serverToAgent(srv: any, stockData: Record<string, number | string>[]): AgentState {
  return {
    name: srv.name,
    avatar: srv.avatar,
    strategy: srv.strategy,
    capital: srv.capital,
    cash: srv.cash,
    holdings: (srv.holdings || []).map((h: any) => ({
      ticker: h.ticker,
      buyPrice: h.buyPrice,
      lots: h.lots,
      buyDate: h.buyDate,
      strategy: h.strategy || srv.strategy,
    })),
    trades: (srv.trades || []).map((t: any) => ({
      ticker: t.ticker,
      type: t.type,
      price: t.price,
      lots: t.lots,
      date: t.date,
      reason: t.reason,
      pnl: t.pnl,
    })),
    evolutionGeneration: srv.evolutionGeneration || 0,
  };
}

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

// ─── Main Component ────────────────────────────────────────────────

export default function AgentPortfolio() {
  const [agents, setAgents] = useState<AgentState[]>([]);
  const [stockData, setStockData] = useState<Record<string, number | string>[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [activeAgent, setActiveAgent] = useState<TabAgent>("all");
  const [lastAction, setLastAction] = useState("");

  // Auto-trade state
  const [autoTrade, setAutoTrade] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoInterval = 30 * 60;

  // Load portfolio + stock data from server
  const loadData = useCallback(async () => {
    try {
      const [portRes, scanRes] = await Promise.all([
        fetch("/api/agents/portfolio"),
        fetch("/api/scanner", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tickers: IDX100 }),
        }),
      ]);

      const portJson = await portRes.json();
      const scanJson = await scanRes.json();

      if (portJson.agents) {
        setAgents(portJson.agents.map((a: any) => serverToAgent(a, scanJson.data || [])));
      }
      if (scanJson.data) {
        setStockData(scanJson.data);
      }
    } catch (e) {
      setLastAction(`Gagal load data: ${e instanceof Error ? e.message : "Unknown"}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Scan & Trade — call server
  const handleScan = useCallback(async () => {
    setScanning(true);
    setLastAction("");
    try {
      const res = await fetch("/api/agents/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Run failed");

      // Reload data
      await loadData();

      const parts: string[] = [];
      if (json.total_buys > 0) parts.push(`${json.total_buys} buy`);
      if (json.total_sells > 0) parts.push(`${json.total_sells} sell`);
      if (json.agents) {
        for (const a of json.agents) {
          if (a.details?.length) parts.push(...a.details);
        }
      }
      setLastAction(parts.length > 0 ? parts.join(" | ") : "Tidak ada sinyal baru");
    } catch (e) {
      setLastAction(`Error: ${e instanceof Error ? e.message : "Gagal scan"}`);
    } finally {
      setScanning(false);
    }
  }, [loadData]);

  // Auto-trade timer
  useEffect(() => {
    if (autoTrade) {
      setCountdown(autoInterval);
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
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

  const formatCountdown = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Build trade list
  const allTrades = agents.flatMap((agent) =>
    agent.trades.map((t) => ({ ...t, agent: agent.name.toLowerCase().replace(/\s/g, "") }))
  ).sort((a, b) => (a.date > b.date ? -1 : b.date > a.date ? 1 : 0));

  const totalCapital = agents.reduce((sum, a) => sum + a.capital, 0);
  const totalPorto = agents.reduce((sum, a) => sum + calcValuation(a, stockData).totalValue, 0);
  const totalReturnPct = totalCapital > 0 ? ((totalPorto - totalCapital) / totalCapital) * 100 : 0;
  const totalTrades = allTrades.length;

  if (loading) {
    return (
      <div className="card-luxury p-12 text-center">
        <div className="text-[#B8AA96]/30 text-sm">Memuat data agent...</div>
      </div>
    );
  }

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
            onClick={handleScan}
            disabled={scanning}
            className={`px-6 py-2.5 border text-xs tracking-[0.15em] uppercase font-medium transition-all disabled:opacity-40 ${
              scanning
                ? "bg-[#C6A15B]/20 border-[#C6A15B]/60 text-[#C6A15B] cursor-not-allowed"
                : "bg-[#C6A15B]/10 border-[#C6A15B]/40 text-[#C6A15B] hover:bg-[#C6A15B]/20"
            }`}
          >
            {scanning ? "Scanning..." : "Scan & Trade"}
          </button>
        </div>
      </div>

      {/* Last action */}
      {lastAction && (
        <div className="text-xs text-[#B8AA96]/40 px-1">{lastAction}</div>
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

      {/* Agent cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {agents.map((agent) => {
          const key = agent.name.toLowerCase().replace(/\s/g, "");
          return (
            <AgentCard
              key={key}
              agent={agent}
              stockData={stockData}
              active={activeAgent === key}
              onSelect={() => setActiveAgent(key as TabAgent)}
            />
          );
        })}
      </div>

      {/* Trade log */}
      <div className="card-luxury p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-lg text-[#F4EFE6] font-medium">
            Log Transaksi <span className="text-[#B8AA96]/50 font-light">({allTrades.length})</span>
          </h3>
        </div>
        <TradeLog trades={allTrades as any} agentFilter={activeAgent} />
      </div>

      {/* Rules card */}
      <div className="card-luxury p-5 border border-[#2C261E]/50">
        <h4 className="text-xs text-[#C6A15B] font-medium mb-2">📋 Aturan Trading</h4>
        <div className="grid md:grid-cols-4 gap-3 text-[10px] text-[#B8AA96]/60 leading-relaxed">
          <div><span className="text-[#C6A15B]/80 font-medium">Umum:</span> Modal @Rp100jt · Max 4 posisi · 1 ticker/agent</div>
          <div><span className="text-emerald-400 font-medium">TP:</span> +4% (3-5%) · Eksekusi otomatis</div>
          <div><span className="text-red-400 font-medium">CL:</span> -3% · Eksekusi otomatis</div>
          <div><span className="text-blue-400 font-medium">Server:</span> Scan tiap 30 menit via cron · State di Supabase DB · Tetap jalan walau browser ditutup</div>
        </div>
      </div>
    </div>
  );
}
