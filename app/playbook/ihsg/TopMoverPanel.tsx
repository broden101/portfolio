"use client";

import React, { useState, useEffect, useCallback } from "react";

/* ---------- types ---------- */

interface StockMover {
  stock_code: string;
  close_price: number;
  net_value: number;
  net_volume: number;
  total_buy_value: number;
  total_sell_value: number;
}

interface AggResult {
  topBuy: StockMover[];
  topSell: StockMover[];
  topActive: StockMover[];
  dateRange: string;
  days: number;
}

export interface TopMoverData {
  topBuy: StockMover[];
  topSell: StockMover[];
  topActive: StockMover[];
  date?: string;
}

interface Props {
  data: TopMoverData | null;
  live: boolean;
}

type Period = "1d" | "1w" | "1m" | "3m" | "YTD";

const PERIODS: { key: Period; label: string }[] = [
  { key: "1d", label: "1D" },
  { key: "1w", label: "1W" },
  { key: "1m", label: "1M" },
  { key: "3m", label: "3M" },
  { key: "YTD", label: "YTD" },
];

/* ---------- helpers ---------- */

function autoScale(val: number): string {
  const abs = Math.abs(val);
  if (abs >= 1e12) return (val / 1e12).toFixed(1) + "T";
  if (abs >= 1e9) return (val / 1e9).toFixed(1) + "M";
  if (abs >= 1e6) return (val / 1e6).toFixed(0) + "jt";
  if (abs >= 1e3) return (val / 1e3).toFixed(0) + "rb";
  return val.toFixed(0);
}

function fmtRupiah(val: number): string {
  if (val >= 0) return "+Rp" + autoScale(val);
  return "-Rp" + autoScale(Math.abs(val));
}

/* ---------- column sub-component ---------- */

interface ColumnDef {
  title: string;
  dotClass: string;
  titleClass: string;
  barClass: string;
  items: StockMover[];
  valueFn: (s: StockMover) => number;
  labelFn: (s: StockMover) => React.ReactNode;
}

function MoverColumn({ col, limit }: { col: ColumnDef; limit: number }) {
  const sliced = col.items.slice(0, limit);
  const maxVal = Math.max(...sliced.map((s) => Math.abs(col.valueFn(s))), 1);

  return (
    <div className="flex-1 min-w-0">
      <h4
        className={`text-[10px] tracking-[0.15em] uppercase ${col.titleClass} font-medium mb-2 flex items-center gap-2`}
      >
        <span className={`inline-block w-1.5 h-1.5 rounded-full ${col.dotClass}`} />
        {col.title}
      </h4>

      {sliced.length === 0 ? (
        <div className="py-4 text-[#B8AA96]/40 text-[10px] text-center">—</div>
      ) : (
        <div className="space-y-0">
          {sliced.map((s, i) => {
            const raw = col.valueFn(s);
            const pct = Math.min((Math.abs(raw) / maxVal) * 100, 100);
            return (
              <div key={s.stock_code} className="flex items-center gap-2 py-1 border-b border-[#2C261E]/30">
                <span className="w-4 text-right text-[10px] text-[#B8AA96]/40 font-mono shrink-0">{i + 1}</span>
                <span className="w-12 text-xs text-[#F4EFE6] font-sans font-medium shrink-0 truncate">{s.stock_code}</span>
                <span className="w-14 text-right text-[10px] text-[#B8AA96]/60 font-mono shrink-0">
                  {s.close_price > 0 ? s.close_price.toLocaleString("id-ID") : "—"}
                </span>
                <div className="flex-1 min-w-0 flex items-center gap-1.5">
                  <div className="flex-1 h-1.5 rounded-full bg-[#1E1C18] overflow-hidden">
                    <div className={`h-full rounded-full ${col.barClass}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={`text-[10px] font-mono shrink-0 w-14 text-right ${col.barClass.replace("bg-", "text-")}`}>
                    {col.labelFn(s)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- main panel ---------- */

export function TopMoverPanel({ data, live }: Props) {
  const [period, setPeriod] = useState<Period>("1d");
  const [aggData, setAggData] = useState<AggResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [limit, setLimit] = useState(8);

  const fetchPeriod = useCallback(async (p: Period) => {
    setLoading(true);
    setLimit(8);
    try {
      const r = await fetch(`/api/top-movers?period=${p}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const json: AggResult = await r.json();
      setAggData(json);
    } catch {
      setAggData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (period === "1d") {
      setAggData(null);
    } else {
      fetchPeriod(period);
    }
  }, [period, fetchPeriod]);

  const displayData = period === "1d" && data
    ? { topBuy: data.topBuy, topSell: data.topSell, topActive: data.topActive }
    : aggData;

  const columns: ColumnDef[] = displayData
    ? [
        {
          title: "Beli Asing",
          dotClass: "bg-emerald-400/60",
          titleClass: "text-emerald-400/80",
          barClass: "bg-emerald-400",
          items: displayData.topBuy,
          valueFn: (s) => s.net_value,
          labelFn: (s) => <>{fmtRupiah(s.net_value)}</>,
        },
        {
          title: "Jual Asing",
          dotClass: "bg-red-400/60",
          titleClass: "text-red-400/80",
          barClass: "bg-red-400",
          items: displayData.topSell,
          valueFn: (s) => s.net_value,
          labelFn: (s) => <>{fmtRupiah(s.net_value)}</>,
        },
        {
          title: "Paling Aktif",
          dotClass: "bg-[#C6A15B]/60",
          titleClass: "text-[#C6A15B]/80",
          barClass: "bg-[#C6A15B]",
          items: displayData.topActive,
          valueFn: (s) => s.total_buy_value + s.total_sell_value,
          labelFn: (s) => autoScale(s.total_buy_value + s.total_sell_value),
        },
      ]
    : [];

  return (
    <div className="card-luxury p-6 space-y-4">
      {/* header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-xs tracking-[0.2em] uppercase text-[#C6A15B] font-medium">
            Top Mover Saham
          </h3>
          {aggData?.days && aggData.days > 1 && (
            <span className="text-[9px] text-[#B8AA96]/40">
              {aggData.days} hari
            </span>
          )}
        </div>

        {/* period tabs */}
        <div className="flex items-center gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1 text-[10px] tracking-[0.15em] uppercase font-medium transition-all ${
                period === p.key
                  ? "bg-[#C6A15B]/15 text-[#C6A15B] border border-[#C6A15B]/30"
                  : "border border-[#2C261E] text-[#B8AA96]/50 hover:text-[#B8AA96]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {aggData?.dateRange && period !== "1d" && (
            <span className="text-[9px] text-[#B8AA96]/40">{aggData.dateRange}</span>
          )}
          {data?.date && period === "1d" && (
            <span className="text-[10px] tracking-[0.1em] text-[#B8AA96]/60">{data.date}</span>
          )}
          <span
            className={`flex items-center gap-1.5 text-[10px] tracking-[0.1em] uppercase ${
              live ? "text-emerald-400/70" : "text-[#B8AA96]/40"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                live ? "bg-emerald-400 animate-pulse" : "bg-[#B8AA96]/30"
              }`}
            />
            {loading ? "Loading" : live ? "Live" : "Offline"}
          </span>
        </div>
      </div>

      {/* 3-column content */}
      {displayData ? (
        <div className="flex flex-col md:flex-row md:gap-6 gap-4">
          {columns.map((col) => (
            <MoverColumn key={col.title} col={col} limit={limit} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-[#B8AA96]/40 text-sm">
          {loading ? "Memuat..." : "Data top mover tidak tersedia."}
        </div>
      )}

      {/* more/less toggle */}
      {displayData && (
        <div className="text-center pt-1">
          <button
            onClick={() => setLimit((prev) => (prev === 8 ? 20 : 8))}
            className="text-[9px] uppercase tracking-[0.1em] text-[#C6A15B]/60 hover:text-[#C6A15B] transition-colors"
          >
            {limit === 8 ? "Tampilkan Semua (20)" : "Tampilkan Sedikit"}
          </button>
        </div>
      )}
    </div>
  );
}
