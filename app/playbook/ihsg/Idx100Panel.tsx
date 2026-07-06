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

function fmtPct(v: number | null): string {
  if (v == null) return "—";
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

export function Idx100Panel() {
  const [stocks, setStocks] = useState<StockRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFullDay, setShowFullDay] = useState(false);
  const [showFullWeek, setShowFullWeek] = useState(false);
  const [showFullMonth, setShowFullMonth] = useState(false);

  useEffect(() => {
    fetch("/api/idx100-perf")
      .then((r) => r.json())
      .then((d) => setStocks(d.data ?? []))
      .catch(() => setStocks([]))
      .finally(() => setLoading(false));
  }, []);

  const sum = useMemo(() => {
    if (!stocks || stocks.length === 0) return null;
    const d = stocks.filter((s) => s.perfDay != null);
    const w = stocks.filter((s) => s.perfWeek != null);
    const m = stocks.filter((s) => s.perf1M != null);
    const fn = (arr: StockRow[], key: "perfDay" | "perfWeek" | "perf1M") => {
      const up = arr.filter((s) => (s[key] ?? 0) >= 0).length;
      const down = arr.filter((s) => (s[key] ?? 0) < 0).length;
      const avg = arr.reduce((a, s) => a + (s[key] ?? 0), 0) / arr.length;
      const top = [...arr]
        .sort((a, b) => (b[key] ?? -999) - (a[key] ?? -999))
        .slice(0, 10);
      const bot = [...arr]
        .sort((a, b) => (a[key] ?? 999) - (b[key] ?? 999))
        .slice(0, 10);
      return { up, down, avg, top, bot };
    };
    return { day: fn(d, "perfDay"), week: fn(w, "perfWeek"), month: fn(m, "perf1M") };
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

  const renderSection = (
    label: string,
    data: { up: number; down: number; avg: number; top: StockRow[]; bot: StockRow[] },
    key: "perfDay" | "perfWeek" | "perf1M",
    showFull: boolean,
    setShowFull: (v: boolean) => void
  ) => (
    <div className="mb-4 last:mb-0">
      {/* Summary card */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        <div className="border border-[#2C261E] p-2 text-center">
          <div className="text-[#B8AA96]/40 text-[8px] tracking-[0.15em] uppercase">{label}</div>
          <div className={`text-xs font-mono font-medium ${data.avg >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {data.avg >= 0 ? "+" : ""}{data.avg.toFixed(2)}%
          </div>
        </div>
        <div className="border border-[#2C261E] p-2 text-center">
          <div className="text-[#B8AA96]/40 text-[8px] tracking-[0.15em] uppercase">Naik</div>
          <div className="text-xs font-mono text-emerald-400">{data.up}</div>
        </div>
        <div className="border border-[#2C261E] p-2 text-center">
          <div className="text-[#B8AA96]/40 text-[8px] tracking-[0.15em] uppercase">Turun</div>
          <div className="text-xs font-mono text-red-400">{data.down}</div>
        </div>
      </div>

      {/* Top / Bottom rows */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="text-[#B8AA96]/30 text-[8px] tracking-[0.15em] uppercase mb-1">Top Gainers</div>
          {data.top.map((s) => (
            <div key={s.ticker} className="flex justify-between text-[10px] font-mono py-0.5">
              <span className="text-[#F4EFE6]">{s.ticker}</span>
              <span className="text-emerald-400">{fmtPct(s[key])}</span>
            </div>
          ))}
        </div>
        <div className="flex-1">
          <div className="text-[#B8AA96]/30 text-[8px] tracking-[0.15em] uppercase mb-1">Top Losers</div>
          {data.bot.map((s) => (
            <div key={s.ticker} className="flex justify-between text-[10px] font-mono py-0.5">
              <span className="text-[#F4EFE6]">{s.ticker}</span>
              <span className="text-red-400">{fmtPct(s[key])}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => setShowFull(!showFull)}
        className="mt-2 w-full flex items-center justify-center gap-1 text-[9px] tracking-[0.12em] uppercase text-[#C6A15B]/60 hover:text-[#C6A15B] transition-colors py-1"
      >
        <span>{showFull ? "▲" : "▼"}</span>
        {showFull ? "Sembunyikan Semua" : "Lihat Semua"}
      </button>

      {showFull && (
        <div className="mt-2 border border-[#2C261E] p-2 max-h-[200px] overflow-y-auto">
          <div className="flex justify-between text-[8px] tracking-wide text-[#B8AA96]/30 uppercase mb-1 px-1">
            <span>Saham</span>
            <span>{label}</span>
          </div>
          {[...data.top, ...data.bot].map((s) => (
            <div key={s.ticker} className="flex justify-between py-1 px-1 border-t border-[#2C261E]/40 text-[10px] font-mono">
              <span className="text-[#B8AA96]/50">{s.ticker}</span>
              <span className={`${(s[key] ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>{fmtPct(s[key])}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="card-luxury p-6">
      <h3 className="text-xs tracking-[0.2em] uppercase text-[#C6A15B] mb-4 font-medium">
        Performa IDX 100
      </h3>

      {/* Day */}
      <details open className="group border-b border-[#2C261E]/30 pb-3 mb-3">
        <summary className="flex items-center justify-between cursor-pointer text-[11px] text-[#B8AA96]/70 hover:text-[#B8AA96] py-1.5">
          <span>1 Hari</span>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono ${sum.day.avg >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {sum.day.up} ▲ / {sum.day.down} ▼
            </span>
            <span className={`text-xs font-mono font-medium ${sum.day.avg >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {sum.day.avg >= 0 ? "+" : ""}{sum.day.avg.toFixed(2)}%
            </span>
          </div>
        </summary>
        <div className="flex gap-4 mt-2 mb-2">
          <div className="flex-1">
            <div className="text-[#B8AA96]/30 text-[8px] tracking-[0.15em] uppercase mb-1">Top Gainers</div>
            {sum.day.top.map((st) => (
              <div key={st.ticker} className="flex justify-between text-[10px] font-mono py-0.5">
                <span className="text-[#F4EFE6]">{st.ticker}</span>
                <span className="text-emerald-400">{fmtPct(st.perfDay)}</span>
              </div>
            ))}
          </div>
          <div className="flex-1">
            <div className="text-[#B8AA96]/30 text-[8px] tracking-[0.15em] uppercase mb-1">Top Losers</div>
            {sum.day.bot.map((st) => (
              <div key={st.ticker} className="flex justify-between text-[10px] font-mono py-0.5">
                <span className="text-[#F4EFE6]">{st.ticker}</span>
                <span className="text-red-400">{fmtPct(st.perfDay)}</span>
              </div>
            ))}
          </div>
        </div>
      </details>

      {/* Week + Month rows */}
      <div className="space-y-1">
        {[
          { label: "1 Minggu", data: sum.week, key: "perfWeek" as const, show: showFullWeek, set: setShowFullWeek },
          { label: "1 Bulan", data: sum.month, key: "perf1M" as const, show: showFullMonth, set: setShowFullMonth },
        ].map((s) => (
          <details key={s.label} className="group">
            <summary className="flex items-center justify-between cursor-pointer text-[11px] text-[#B8AA96]/70 hover:text-[#B8AA96] py-1.5">
              <span>{s.label}</span>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono ${s.data.avg >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {s.data.up} ▲ / {s.data.down} ▼
                </span>
                <span className={`text-xs font-mono font-medium ${s.data.avg >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {s.data.avg >= 0 ? "+" : ""}{s.data.avg.toFixed(2)}%
                </span>
              </div>
            </summary>
            <div className="flex gap-4 mt-2 mb-2">
              <div className="flex-1">
                <div className="text-[#B8AA96]/30 text-[8px] tracking-[0.15em] uppercase mb-1">Top Gainers</div>
                {s.data.top.map((st) => (
                  <div key={st.ticker} className="flex justify-between text-[10px] font-mono py-0.5">
                    <span className="text-[#F4EFE6]">{st.ticker}</span>
                    <span className="text-emerald-400">{fmtPct(st[s.key])}</span>
                  </div>
                ))}
              </div>
              <div className="flex-1">
                <div className="text-[#B8AA96]/30 text-[8px] tracking-[0.15em] uppercase mb-1">Top Losers</div>
                {s.data.bot.map((st) => (
                  <div key={st.ticker} className="flex justify-between text-[10px] font-mono py-0.5">
                    <span className="text-[#F4EFE6]">{st.ticker}</span>
                    <span className="text-red-400">{fmtPct(st[s.key])}</span>
                  </div>
                ))}
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
