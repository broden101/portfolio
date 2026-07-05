"use client";

import { useState, useEffect, useMemo } from "react";
import { EmptyState, SourceNote } from "@/components/DataState";

interface StockRow {
  ticker: string;
  name: string;
  perfWeek: number | null;
  perf1M: number | null;
}

export function Idx100Panel() {
  const [stocks, setStocks] = useState<StockRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/idx100-perf")
      .then((r) => r.json())
      .then((d) => setStocks(d.data ?? []))
      .catch(() => setStocks([]))
      .finally(() => setLoading(false));
  }, []);

  const sum = useMemo(() => {
    if (!stocks || stocks.length === 0) return null;
    const w = stocks.filter((s) => s.perfWeek != null);
    const m = stocks.filter((s) => s.perf1M != null);
    const fn = (arr: StockRow[], key: "perfWeek" | "perf1M") => {
      const up = arr.filter((s) => (s[key] ?? 0) >= 0).length;
      const down = arr.filter((s) => (s[key] ?? 0) < 0).length;
      const avg = arr.reduce((a, s) => a + (s[key] ?? 0), 0) / arr.length;
      const top = [...arr]
        .sort((a, b) => (b[key] ?? -999) - (a[key] ?? -999))
        .slice(0, 5);
      const bot = [...arr]
        .sort((a, b) => (a[key] ?? 999) - (b[key] ?? 999))
        .slice(0, 5);
      return { up, down, avg, top, bot };
    };
    return { week: fn(w, "perfWeek"), month: fn(m, "perf1M") };
  }, [stocks]);

  if (loading)
    return (
      <div className="card-luxury p-6">
        <h3 className="text-xs tracking-[0.2em] uppercase text-[#C6A15B] mb-4 font-medium">
          Performa IDX 100
        </h3>
        <div className="text-[#B8AA96]/30 text-sm text-center py-8">Memuat data...</div>
      </div>
    );

  if (!stocks || stocks.length === 0 || !sum)
    return (
      <div className="card-luxury p-6">
        <h3 className="text-xs tracking-[0.2em] uppercase text-[#C6A15B] mb-4 font-medium">
          Performa IDX 100
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
      <h3 className="text-xs tracking-[0.2em] uppercase text-[#C6A15B] mb-4 font-medium">
        Performa IDX 100
      </h3>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: "1 Minggu", data: sum.week },
          { label: "1 Bulan", data: sum.month },
        ].map((s) => (
          <div key={s.label} className="border border-[#2C261E] p-3 text-center">
            <div className="text-[#B8AA96]/40 text-[9px] tracking-[0.15em] uppercase mb-1">{s.label}</div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-emerald-400 text-[11px] font-mono">{s.data.up}▲</span>
              <span className="text-[#B8AA96]/20 text-[9px]">/</span>
              <span className="text-red-400 text-[11px] font-mono">{s.data.down}▼</span>
            </div>
            <div className={`text-xs font-mono font-medium ${s.data.avg >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {s.data.avg >= 0 ? "+" : ""}{s.data.avg.toFixed(2)}%
            </div>
          </div>
        ))}
      </div>

      {/* Top movers */}
      <div className="grid grid-cols-2 gap-4">
        {/* 1 Minggu */}
        <div>
          <div className="text-[#B8AA96]/40 text-[9px] tracking-[0.1em] uppercase mb-2">Top Gainers (1Mgg)</div>
          <div className="space-y-1">
            {sum.week.top.map((s) => (
              <div key={s.ticker} className="flex justify-between items-center">
                <span className="text-[#F4EFE6] text-[11px] font-mono">{s.ticker}</span>
                <span className="text-emerald-400 text-[10px] font-mono">+{s.perfWeek!.toFixed(2)}%</span>
              </div>
            ))}
          </div>
          <div className="text-[#B8AA96]/40 text-[9px] tracking-[0.1em] uppercase mb-2 mt-3">Top Losers (1Mgg)</div>
          <div className="space-y-1">
            {sum.week.bot.map((s) => (
              <div key={s.ticker} className="flex justify-between items-center">
                <span className="text-[#F4EFE6] text-[11px] font-mono">{s.ticker}</span>
                <span className="text-red-400 text-[10px] font-mono">{s.perfWeek!.toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* 1 Bulan */}
        <div>
          <div className="text-[#B8AA96]/40 text-[9px] tracking-[0.1em] uppercase mb-2">Top Gainers (1Bln)</div>
          <div className="space-y-1">
            {sum.month.top.map((s) => (
              <div key={s.ticker} className="flex justify-between items-center">
                <span className="text-[#F4EFE6] text-[11px] font-mono">{s.ticker}</span>
                <span className="text-emerald-400 text-[10px] font-mono">+{s.perf1M!.toFixed(2)}%</span>
              </div>
            ))}
          </div>
          <div className="text-[#B8AA96]/40 text-[9px] tracking-[0.1em] uppercase mb-2 mt-3">Top Losers (1Bln)</div>
          <div className="space-y-1">
            {sum.month.bot.map((s) => (
              <div key={s.ticker} className="flex justify-between items-center">
                <span className="text-[#F4EFE6] text-[11px] font-mono">{s.ticker}</span>
                <span className="text-red-400 text-[10px] font-mono">{s.perf1M!.toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
