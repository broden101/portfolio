"use client";

import React from "react";
import { EmptyState, SourceNote } from "@/components/DataState";

/* ---------- types ---------- */

interface Commodity {
  symbol: string;
  name: string;
  price: number;
  change: number | null;   // percent change
  unit: string;
}

interface Props {
  data: Commodity[] | null;
  live: boolean;
}

/* ---------- helpers ---------- */

function fmtPrice(p: number): string {
  if (p >= 1000) return p.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  if (p >= 10) return p.toFixed(2);
  return p.toFixed(2);
}

/* ---------- component ---------- */

export function CommodityPricesPanel({ data, live }: Props) {
  if (!data) {
    return (
      <div className="card-luxury p-6">
        <h2 className="text-xs tracking-[0.2em] uppercase text-[#C6A15B] mb-3 font-medium">
          Harga Komoditas
        </h2>
        <EmptyState title="Data komoditas tidak tersedia" description="Data bisa muncul saat sumber aktif.">
          <SourceNote source="Yahoo Finance / Investing.com" note="Data bersifat indikatif." />
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="card-luxury p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xs tracking-[0.2em] uppercase text-[#C6A15B] font-medium">
          Harga Komoditas
        </h2>
        <span
          className={`flex items-center gap-1.5 text-[9px] tracking-[0.1em] uppercase ${
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

      <div className="space-y-1.5">
        {data.map((c, i) => (
          <div
            key={c.symbol}
            className={`flex items-center justify-between py-1.5 ${
              i < data.length - 1 ? "border-b border-[#2C261E]/30" : ""
            }`}
          >
            <span className="text-[#F4EFE6] text-xs font-sans">{c.name}</span>
            <div className="flex items-center gap-2.5">
              <span className="text-[#B8AA96]/80 text-xs font-mono text-right min-w-[72px]">
                {c.unit === "$" ? "$" : ""}{fmtPrice(c.price)}{c.unit === "Rp" ? "Rp" : ""}
              </span>
              {c.change != null ? (
                <span
                  className={`text-[10px] font-mono min-w-[52px] text-right ${
                    c.change >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {c.change >= 0 ? "▲" : "▼"} {c.change >= 0 ? "+" : ""}{c.change.toFixed(2)}%
                </span>
              ) : (
                <span className="text-[#B8AA96]/30 text-[10px] font-mono min-w-[52px] text-right">—</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
