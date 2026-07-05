"use client";

import { useState, useEffect, useMemo } from "react";
import { EmptyState, SourceNote } from "@/components/DataState";

interface StockRow {
  ticker: string;
  name: string;
  perfDay: number | null;
  perfWeek: number | null;
  perf1M: number | null;
}

type TabKey = "Day" | "Week" | "Month";

const TABS: { key: TabKey; label: string }[] = [
  { key: "Day", label: "1D" },
  { key: "Week", label: "1W" },
  { key: "Month", label: "1M" },
];

const TAB_COL: Record<TabKey, keyof Pick<StockRow, "perfDay" | "perfWeek" | "perf1M">> = {
  Day: "perfDay",
  Week: "perfWeek",
  Month: "perf1M",
};

const TAB_LABEL: Record<TabKey, string> = {
  Day: "1 Hari",
  Week: "1 Minggu",
  Month: "1 Bulan",
};

export function Idx100Panel() {
  const [stocks, setStocks] = useState<StockRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("Week");
  const [showFull, setShowFull] = useState(false);

  useEffect(() => {
    fetch("/api/idx100-perf")
      .then((r) => r.json())
      .then((d) => setStocks(d.data ?? []))
      .catch(() => setStocks([]))
      .finally(() => setLoading(false));
  }, []);

  const col = TAB_COL[tab];

  const summary = useMemo(() => {
    if (!stocks || stocks.length === 0) return null;
    const filtered = stocks.filter((s) => s[col] != null);
    if (filtered.length === 0) return null;
    const up = filtered.filter((s) => (s[col] ?? 0) >= 0).length;
    const down = filtered.filter((s) => (s[col] ?? 0) < 0).length;
    const avg = filtered.reduce((a, s) => a + (s[col] ?? 0), 0) / filtered.length;
    const sorted = [...filtered].sort((a, b) => (b[col] ?? -999) - (a[col] ?? -999));
    const top = sorted.slice(0, 5);
    const bot = sorted.slice(-5).reverse();
    return { up, down, avg, top, bot, all: sorted };
  }, [stocks, col]);

  if (loading)
    return (
      <div className="card-luxury p-6">
        <h3 className="text-xs tracking-[0.2em] uppercase text-[#C6A15B] mb-4 font-medium">
          Top Mover Saham
        </h3>
        <div className="text-[#B8AA96]/30 text-sm text-center py-8">Memuat data...</div>
      </div>
    );

  if (!stocks || stocks.length === 0 || !summary)
    return (
      <div className="card-luxury p-6">
        <h3 className="text-xs tracking-[0.2em] uppercase text-[#C6A15B] mb-4 font-medium">
          Top Mover Saham
        </h3>
        <EmptyState
          title="Data tidak tersedia"
          description="Data performa IDX 100 belum bisa dimuat dari TradingView."
        >
          <SourceNote source="TradingView Scanner" note="Mungkin sedang dalam pemeliharaan." />
        </EmptyState>
      </div>
    );

  return (
    <div className="card-luxury p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h3 className="text-xs tracking-[0.2em] uppercase text-[#C6A15B] font-medium">
          Top Mover Saham
        </h3>
        <span className="text-[#B8AA96]/20 text-[9px]">IDX 100</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setShowFull(false); }}
            className={`px-4 py-1.5 text-[10px] tracking-[0.12em] uppercase transition-all ${
              tab === t.key
                ? "text-[#F4EFE6] bg-[#C6A15B]/20 border border-[#C6A15B]/40"
                : "text-[#B8AA96]/40 border border-transparent hover:text-[#B8AA96]/70 hover:border-[#2C261E]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="border border-[#2C261E] p-3 text-center mb-4">
        <div className="text-[#B8AA96]/40 text-[9px] tracking-[0.15em] uppercase mb-1">{TAB_LABEL[tab]}</div>
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-emerald-400 text-xs font-mono">{summary.up}▲</span>
          <span className="text-[#B8AA96]/20 text-[9px]">/</span>
          <span className="text-red-400 text-xs font-mono">{summary.down}▼</span>
        </div>
        <div className={`text-xs font-mono font-medium ${summary.avg >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {summary.avg >= 0 ? "+" : ""}{summary.avg.toFixed(2)}%
        </div>
      </div>

      {/* Top Gainers */}
      <div className="text-[#B8AA96]/40 text-[9px] tracking-[0.1em] uppercase mb-2">Top Gainers</div>
      <div className="space-y-1">
        {summary.top.map((s) => (
          <div key={s.ticker} className="flex justify-between items-center">
            <span className="text-[#F4EFE6] text-[11px] font-mono">{s.ticker}</span>
            <span className="text-emerald-400 text-[10px] font-mono">+{(s[col] ?? 0).toFixed(2)}%</span>
          </div>
        ))}
      </div>

      <div className="text-[#B8AA96]/40 text-[9px] tracking-[0.1em] uppercase mb-2 mt-3">Top Losers</div>
      <div className="space-y-1">
        {summary.bot.map((s) => (
          <div key={s.ticker} className="flex justify-between items-center">
            <span className="text-[#F4EFE6] text-[11px] font-mono">{s.ticker}</span>
            <span className="text-red-400 text-[10px] font-mono">{(s[col] ?? 0).toFixed(2)}%</span>
          </div>
        ))}
      </div>

      {/* Lihat Semua */}
      <button
        onClick={() => setShowFull((v) => !v)}
        className="mt-2 w-full flex items-center justify-center gap-1.5 text-[9px] tracking-[0.1em] uppercase text-[#C6A15B]/50 hover:text-[#C6A15B] transition-colors py-1 border-t border-[#2C261E]/40"
      >
        {showFull ? "▲ Sembunyikan" : "▼ Lihat Semua"}
      </button>
      {showFull && (
        <div className="mt-2 max-h-[300px] overflow-y-auto">
          {summary.all.map((s, i) => {
            const v = s[col] ?? 0;
            return (
              <div key={s.ticker} className={`flex justify-between items-center py-1 px-1 ${i % 2 === 0 ? "bg-[#2C261E]/20" : ""}`}>
                <span className="text-[#B8AA96]/40 text-[9px] w-5 text-right mr-2">{i + 1}</span>
                <span className="text-[#F4EFE6] text-[11px] font-mono flex-1">{s.ticker}</span>
                <span className={`text-[10px] font-mono ${v >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {v >= 0 ? "+" : ""}{v.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
