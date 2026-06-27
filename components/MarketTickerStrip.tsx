"use client";

import { useEffect, useMemo, useState } from "react";

type ScannerRow = {
  name?: string;
  close?: number;
  change?: number;
};

type TickerItem = {
  name: string;
  value: string;
  change: number | null;
};

const LQ45_TICKERS = [
  "BBCA", "BMRI", "BBRI", "TLKM", "ASII", "AMMN", "BRIS", "BBNI",
  "MDKA", "ADRO", "MEDC", "JPFA", "SIDO", "HRUM", "UNTR", "ICBP",
];

const BOND_CARDS: TickerItem[] = [
  { name: "INDO 5Y", value: "95,18", change: null },
  { name: "INDO 10Y", value: "95,65", change: null },
  { name: "INDO 15Y", value: "99,07", change: null },
  { name: "INDO 20Y", value: "99,03", change: null },
];

function fmtPrice(v: number) {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(v);
}

function fmtPct(v: number) {
  return `${Math.abs(v).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function formatTime(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${day}-${month}-${year} ${hour}:${minute} WIB`;
}

function TickerCard({ item }: { item: TickerItem }) {
  const isUp = item.change != null && item.change > 0;
  const isDown = item.change != null && item.change < 0;

  return (
    <div className="min-w-[112px] border border-[rgba(214,173,90,0.22)] bg-[#0a0a0a] px-3 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.35)] sm:min-w-[130px] sm:px-4 sm:py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#d6ad5a]">{item.name}</div>
      <div className="mt-1 font-mono text-[17px] font-semibold leading-tight text-[#f2eee6]">{item.value}</div>
      {item.change == null ? (
        <div className="mt-1 text-[10px] text-[#aaa295]/50">—</div>
      ) : (
        <div className={`mt-1 flex items-center gap-1 font-mono text-[11px] font-semibold ${isUp ? "text-emerald-400" : isDown ? "text-red-400" : "text-[#aaa295]/60"}`}>
          {isUp && <span>▲</span>}
          {isDown && <span>▼</span>}
          <span>{fmtPct(item.change)}</span>
        </div>
      )}
    </div>
  );
}

export default function MarketTickerStrip() {
  const [stocks, setStocks] = useState<TickerItem[]>([]);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/scanner", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tickers: LQ45_TICKERS }),
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = await res.json();
        const rows = (json?.data || []) as ScannerRow[];
        const next = rows
          .filter((row) => row.name && Number.isFinite(row.close))
          .map((row) => ({
            name: String(row.name),
            value: fmtPrice(Number(row.close)),
            change: Number.isFinite(row.change) ? Number(row.change) : 0,
          }));

        if (!cancelled && next.length > 0) {
          setStocks(next.slice(0, 12));
          setUpdatedAt(new Date());
        }
      } catch {
        // keep silent
      }
    }

    load();
    const timer = window.setInterval(load, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const visibleStocks = useMemo<TickerItem[]>(() => {
    if (stocks.length > 0) return stocks;
    return [
      { name: "MEDC", value: "1.060", change: -0.47 },
      { name: "JPFA", value: "1.965", change: -2.24 },
      { name: "SIDO", value: "374", change: 0 },
      { name: "HRUM", value: "740", change: -5.13 },
      { name: "BBCA", value: "9.250", change: 0.27 },
      { name: "BMRI", value: "5.900", change: 0.43 },
    ];
  }, [stocks]);

  return (
    <section className="border-y border-[rgba(214,173,90,0.28)] bg-[#070707] text-[#f2eee6]">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-12">
        <div className="mb-3 grid items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-[#aaa295]/50 md:grid-cols-3">
          <div>Terakhir diperbarui: {updatedAt ? formatTime(updatedAt) : "Memuat data pasar…"}</div>
          <div className="text-center text-[13px] font-semibold tracking-[0.22em] text-[#d6ad5a]">LQ 45</div>
          <div className="text-left md:text-right">Data pasar live dari TradingView</div>
        </div>

        <div className="flex gap-4 overflow-hidden">
          <div className="hidden shrink-0 gap-3 lg:flex">
            {BOND_CARDS.map((item) => <TickerCard key={item.name} item={item} />)}
          </div>

          <div className="relative min-w-0 flex-1 overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[#070707] to-transparent sm:w-10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[#070707] to-transparent sm:w-10" />
            <div className="flex w-max animate-[ticker-scroll_36s_linear_infinite] gap-2.5 hover:[animation-play-state:paused] sm:gap-3">
              {[...visibleStocks, ...visibleStocks].map((item, idx) => (
                <TickerCard key={`${item.name}-${idx}`} item={item} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
