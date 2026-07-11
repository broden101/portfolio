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

type Period = "1d" | "1w" | "1m" | "3m" | "YTD";

const PERIODS: { key: Period; label: string }[] = [
  { key: "1d", label: "1D" },
  { key: "1w", label: "1W" },
  { key: "1m", label: "1M" },
  { key: "3m", label: "3M" },
  { key: "YTD", label: "YTD" },
];

/* ---------- helpers ---------- */

function formatRp(val: number): string {
  if (Math.abs(val) >= 1e12) return (val / 1e12).toFixed(1).replace(".", ",") + "T";
  if (Math.abs(val) >= 1e9) return (val / 1e9).toFixed(1).replace(".", ",") + "M";
  if (Math.abs(val) >= 1e6) return (val / 1e6).toFixed(1).replace(".", ",") + "jt";
  return val.toLocaleString("id-ID");
}

/* ---------- sub-components ---------- */

function MoverItem({ stock, index }: { stock: StockMover; index: number }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[#2C261E]/30">
      <div className="flex items-center gap-2">
        <span className="text-[8px] text-[#B8AA96]/30 w-4">{index + 1}</span>
        <span className="text-[11px] font-mono text-[#F4EFE6] font-medium">{stock.stock_code}</span>
        <span className="text-[9px] text-[#B8AA96]/50">{stock.close_price.toLocaleString("id-ID")}</span>
      </div>
      <div className={`text-[10px] font-mono ${stock.net_value >= 0 ? "text-emerald-400/80" : "text-red-400/80"}`}>
        {stock.net_value >= 0 ? "+" : ""}{formatRp(stock.net_value)}
      </div>
    </div>
  );
}

function MoverColumn({ col, limit }: { col: { title: string; data: StockMover[]; color: string }; limit: number }) {
  const sliced = col.data.slice(0, limit);
  return (
    <div className="flex-1">
      <div className={`text-[10px] tracking-[0.15em] uppercase mb-2 ${col.color}`}>
        {col.title}
      </div>
      <div className="space-y-0.5">
        {sliced.map((stock, i) => (
          <MoverItem key={stock.stock_code} stock={stock} index={i} />
        ))}
      </div>
    </div>
  );
}

/* ---------- main component ---------- */

export function TopMoverPanel({
  data,
  live,
}: {
  data?: { topBuy: StockMover[]; topSell: StockMover[]; topActive: StockMover[]; date?: string } | null;
  live: boolean;
}) {
  const [period, setPeriod] = useState<Period>("1d");
  const [aggData, setAggData] = useState<AggResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [searchData, setSearchData] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  const findTicker = async () => {
    if (!search.trim()) return;
    setSearching(true);
    try {
      const [flowR, mcapR] = await Promise.all([
        fetch(`/api/stock-foreign-flow?ticker=${search.trim()}`),
        fetch(`/api/mcap?ticker=${search.trim()}`),
      ]);
      const d = await flowR.json();
      const { mcap } = await mcapR.json();
      setSearchData({ ...d, mcap: mcap || 0 });
    } catch {
      setSearchData(null);
    } finally {
      setSearching(false);
    }
  };

  const fetchPeriod = useCallback(async (p: Period) => {
    setLoading(true);
    setLimit(10);
    try {
      const r = await fetch(`/api/top-movers?period=${p}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      setAggData(d);
    } catch {
      setAggData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (period !== "1d") fetchPeriod(period);
  }, [period, fetchPeriod]);

  const displayData = period === "1d" && data
    ? { topBuy: data.topBuy, topSell: data.topSell, topActive: data.topActive, dateRange: "", days: 0 }
    : aggData;

  const columns = displayData
    ? [
        { title: "Accumulation", data: displayData.topBuy, color: "text-emerald-400/70" },
        { title: "Distribution", data: displayData.topSell, color: "text-red-400/70" },
        { title: "Most Active", data: displayData.topActive, color: "text-[#C6A15B]/70" },
      ]
    : [];

  return (
    <div className="card-luxury p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-[#F4EFE6] font-heading font-medium tracking-wide text-sm">
            Top Mover Saham
          </h3>
          {aggData?.days && aggData.days > 1 && (
            <span className="text-[9px] text-[#B8AA96]/40">
              {aggData.days} hari
            </span>
          )}
        </div>

        {/* search bar */}
        <div className="flex items-center space-x-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && findTicker()}
            placeholder="Ticker..."
            className="bg-[#0B0B0A] border border-[#2C261E] rounded px-2 py-1 text-[11px] text-[#F4EFE6] w-20 focus:border-[#C6A15B]/40 outline-none"
          />
          <button
            onClick={findTicker}
            disabled={searching}
            className="text-[10px] uppercase tracking-[0.1em] text-[#C6A15B]/80 hover:text-[#C6A15B] transition-colors disabled:opacity-40"
          >
            {searching ? "..." : "Find"}
          </button>
        </div>
      </div>

      {/* search result */}
      {searchData && (
        <div className="mb-4 p-3 bg-[#0B0B0A] border border-[#C6A15B]/20 rounded">
          <div className="text-[11px] font-bold text-[#C6A15B] mb-2 flex justify-between">
            <span>
              {searchData.ticker}
              <span className="text-[9px] text-[#B8AA96]/50 ml-2">Foreign Net Flow</span>
            </span>
            <span className="text-[9px] text-[#B8AA96]/50">
              MCAP = {formatRp(searchData.mcap)}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2 text-center">
            {Object.entries(searchData.periods as Record<string, number>).map(([k, v]) => (
              <div key={k}>
                <div className="text-[9px] text-[#B8AA96]/40 uppercase tracking-wider">{k}</div>
                <div className={`text-[11px] font-mono font-medium ${v >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {v >= 0 ? "+" : ""}{formatRp(v)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* period tabs + status */}
      <div className="flex items-center justify-between mb-4">
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
            onClick={() => setLimit((prev) => (prev === 10 ? 20 : 10))}
            className="text-[9px] uppercase tracking-[0.1em] text-[#C6A15B]/60 hover:text-[#C6A15B] transition-colors"
          >
            {limit === 10 ? "Tampilkan Semua (20)" : "Tampilkan Sedikit"}
          </button>
        </div>
      )}
    </div>
  );
}
