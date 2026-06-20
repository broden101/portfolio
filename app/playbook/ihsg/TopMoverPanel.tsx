"use client";

import React from "react";

/* ---------- types ---------- */

interface StockMover {
  stock_code: string;
  close_price: number;
  net_value: number;
  net_volume: number;
  total_buy_value: number;
  total_sell_value: number;
}

export interface TopMoverData {
  topBuy: StockMover[];
  topSell: StockMover[];
  topActive: StockMover[];
}

interface Props {
  data: TopMoverData | null;
  live: boolean;
}

/* ---------- helpers ---------- */

function autoScale(val: number): string {
  const abs = Math.abs(val);
  if (abs >= 1e12) return (val / 1e12).toFixed(1) + "T";
  if (abs >= 1e9) return (val / 1e9).toFixed(1) + "M"; // Indonesian: Miliar
  if (abs >= 1e6) return (val / 1e6).toFixed(0) + "jt"; // juta
  if (abs >= 1e3) return (val / 1e3).toFixed(0) + "rb";
  return val.toFixed(0);
}

/* ---------- sub-components ---------- */

interface ColumnDef {
  title: string;
  dotClass: string;
  titleClass: string;
  barClass: string;
  items: StockMover[];
  valueFn: (s: StockMover) => number; // value for density bar
  labelFn: (s: StockMover) => React.ReactNode; // right-side value label
}

function MoverColumn({ col }: { col: ColumnDef }) {
  const sliced = col.items.slice(0, 8);
  const maxVal = Math.max(...sliced.map((s) => Math.abs(col.valueFn(s))), 1);

  return (
    <div className="flex-1 min-w-0">
      {/* column header */}
      <h4
        className={`text-[10px] tracking-[0.15em] uppercase ${col.titleClass} font-medium mb-2 flex items-center gap-2`}
      >
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full ${col.dotClass}`}
        />
        {col.title}
      </h4>

      {/* rows */}
      {sliced.length === 0 ? (
        <div className="py-4 text-[#B8AA96]/40 text-[10px] text-center">
          —
        </div>
      ) : (
        <div className="space-y-0">
          {sliced.map((s, i) => {
            const raw = col.valueFn(s);
            const pct = Math.min((Math.abs(raw) / maxVal) * 100, 100);

            return (
              <div
                key={s.stock_code}
                className="flex items-center gap-2 py-1 border-b border-[#2C261E]/30"
              >
                {/* rank */}
                <span className="w-4 text-right text-[10px] text-[#B8AA96]/40 font-mono shrink-0">
                  {i + 1}
                </span>

                {/* ticker */}
                <span className="w-12 text-xs text-[#F4EFE6] font-sans font-medium shrink-0 truncate">
                  {s.stock_code}
                </span>

                {/* price */}
                <span className="w-14 text-right text-[10px] text-[#B8AA96]/60 font-mono shrink-0">
                  {s.close_price > 0
                    ? s.close_price.toLocaleString("id-ID")
                    : "—"}
                </span>

                {/* density bar + value label */}
                <div className="flex-1 min-w-0 flex items-center gap-1.5">
                  <div className="flex-1 h-1.5 rounded-full bg-[#1E1C18] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${col.barClass}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span
                    className={`text-[10px] font-mono shrink-0 w-12 text-right ${col.barClass.replace("bg-", "text-")}`}
                  >
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
  if (!data) {
    return (
      <div className="card-luxury p-6">
        <h3 className="text-xs tracking-[0.2em] uppercase text-[#C6A15B] font-medium mb-3">
          Top Mover Saham
        </h3>
        <div className="text-center py-8 text-[#B8AA96]/40 text-sm">
          Data top mover tidak tersedia.
        </div>
      </div>
    );
  }

  const columns: ColumnDef[] = [
    {
      title: "Beli Asing",
      dotClass: "bg-emerald-400/60",
      titleClass: "text-emerald-400/80",
      barClass: "bg-emerald-400",
      items: data.topBuy,
      valueFn: (s) => s.net_value,
      labelFn: (s) => (
        <>
          {s.net_value >= 0 ? "+" : ""}
          {autoScale(s.net_value)}
        </>
      ),
    },
    {
      title: "Jual Asing",
      dotClass: "bg-red-400/60",
      titleClass: "text-red-400/80",
      barClass: "bg-red-400",
      items: data.topSell,
      valueFn: (s) => s.net_value,
      labelFn: (s) => (
        <>
          {s.net_value >= 0 ? "+" : ""}
          {autoScale(s.net_value)}
        </>
      ),
    },
    {
      title: "Paling Aktif",
      dotClass: "bg-[#C6A15B]/60",
      titleClass: "text-[#C6A15B]/80",
      barClass: "bg-[#C6A15B]",
      items: data.topActive,
      valueFn: (s) => s.total_buy_value + s.total_sell_value,
      labelFn: (s) => autoScale(s.total_buy_value + s.total_sell_value),
    },
  ];

  return (
    <div className="card-luxury p-6 space-y-4">
      {/* header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs tracking-[0.2em] uppercase text-[#C6A15B] font-medium">
          Top Mover Saham
        </h3>
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
          {live ? "Live" : "Offline"}
        </span>
      </div>

      {/* 3-column grid: side-by-side md+, stacked mobile */}
      <div className="flex flex-col md:flex-row md:gap-6 gap-4">
        {columns.map((col) => (
          <MoverColumn key={col.title} col={col} />
        ))}
      </div>
    </div>
  );
}
