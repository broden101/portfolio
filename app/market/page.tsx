"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";

interface StockSummary {
  ticker: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  prevClose: number | null;
  change: number;
  orderRows: number;
  doneRows: number;
}

interface MarketSummary {
  date: string;
  totalTickers: number;
  okCount: number;
  errorCount: number;
  stocks: StockSummary[];
}

export default function MarketPage() {
  const [data, setData] = useState<MarketSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<keyof StockSummary>("ticker");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    fetch("/data/market-summary.json")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#050505] text-[#F4EFE6] font-['Inter']">
      <Navbar />
      <div className="pt-24 flex justify-center"><div className="text-[#B8AA96]/60 text-xs animate-pulse">Loading market data...</div></div>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-[#050505] text-[#F4EFE6] font-['Inter']">
      <Navbar />
      <div className="pt-24 text-center text-[#B8AA96]/60 text-xs">No market data available</div>
    </div>
  );

  let filtered = data.stocks;
  if (search) {
    const q = search.toUpperCase();
    filtered = filtered.filter((s) => s.ticker.includes(q));
  }

  filtered = [...filtered].sort((a, b) => {
    const va = a[sortKey] ?? 0;
    const vb = b[sortKey] ?? 0;
    if (typeof va === "string" && typeof vb === "string") {
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    }
    return sortDir === "asc" ? (va as number) - (vb as number) : (vb as number) - (va as number);
  });

  const totalOrder = data.stocks.reduce((s, x) => s + x.orderRows, 0);
  const totalDone = data.stocks.reduce((s, x) => s + x.doneRows, 0);
  const advances = data.stocks.filter((s) => s.change > 0).length;
  const decliners = data.stocks.filter((s) => s.change < 0).length;

  const toggleSort = (key: keyof StockSummary) => {
    if (key === sortKey) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir(key === "ticker" ? "asc" : "desc"); }
  };

  const SortIcon = ({ k }: { k: keyof StockSummary }) =>
    sortKey === k ? <span className="ml-0.5">{sortDir === "asc" ? "▲" : "▼"}</span> : null;

  const fmtNum = (n: number) => n.toLocaleString("id-ID");
  const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
  const priceClass = (n: number) => n > 0 ? "text-emerald-400" : n < 0 ? "text-red-400" : "text-[#B8AA96]";

  return (
    <div className="min-h-screen bg-[#050505] text-[#F4EFE6] font-['Inter']">
      <Navbar />

      {/* Header Stats */}
      <div className="pt-20 pb-0 px-4 lg:px-12 max-w-7xl mx-auto">
        <div className="bg-[#0A0A0A] border border-[#1A1A1A] p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h1 className="text-[#C6A15B] text-sm font-bold tracking-[0.15em] uppercase">Orderflow Market</h1>
              <span className="text-[10px] text-[#B8AA96]/40 bg-[#141210] border border-[#2C261E] px-2 py-0.5 rounded font-mono">{data.date}</span>
            </div>
            <a href="/tradebook" className="text-[10px] text-[#C6A15B] hover:text-[#d6ad5a] border border-[#C6A15B]/30 px-3 py-1 rounded transition-colors">Full Orderbook →</a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-[11px] font-mono">
            <div className="bg-[#141210] border border-[#2C261E] rounded p-2">
              <div className="text-[#B8AA96]/40 text-[9px] uppercase tracking-wider mb-0.5">Tickers</div>
              <div className="text-white font-bold">{data.okCount}</div>
            </div>
            <div className="bg-[#141210] border border-[#2C261E] rounded p-2">
              <div className="text-[#B8AA96]/40 text-[9px] uppercase tracking-wider mb-0.5">Order Rows</div>
              <div className="text-white font-bold">{fmtNum(totalOrder)}</div>
            </div>
            <div className="bg-[#141210] border border-[#2C261E] rounded p-2">
              <div className="text-[#B8AA96]/40 text-[9px] uppercase tracking-wider mb-0.5">Done Rows</div>
              <div className="text-white font-bold">{fmtNum(totalDone)}</div>
            </div>
            <div className="bg-[#141210] border border-[#2C261E] rounded p-2">
              <div className="text-[#B8AA96]/40 text-[9px] uppercase tracking-wider mb-0.5">Advances</div>
              <div className="text-emerald-400 font-bold">{advances}</div>
            </div>
            <div className="bg-[#141210] border border-[#2C261E] rounded p-2">
              <div className="text-[#B8AA96]/40 text-[9px] uppercase tracking-wider mb-0.5">Decliners</div>
              <div className="text-red-400 font-bold">{decliners}</div>
            </div>
            <div className="bg-[#141210] border border-[#2C261E] rounded p-2">
              <div className="text-[#B8AA96]/40 text-[9px] uppercase tracking-wider mb-0.5">Size</div>
              <div className="text-[#C6A15B] font-bold">212 MB</div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-3">
          <input
            type="text"
            placeholder="Cari ticker..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#141210] border border-[#2C261E] rounded px-3 py-1.5 text-xs text-[#F4EFE6] placeholder-[#B8AA96]/30 focus:outline-none focus:border-[#C6A15B]/50 font-mono"
          />
        </div>

        {/* Table */}
        <div className="bg-[#0A0A0A] border border-[#1A1A1A] overflow-x-auto">
          <table className="w-full text-[11px] font-mono" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr className="bg-[#0D0D0D] border-b border-[#1A1A1A]">
                <Th onClick={() => toggleSort("ticker")}>Ticker<SortIcon k="ticker" /></Th>
                <Th onClick={() => toggleSort("close")}>Close<SortIcon k="close" /></Th>
                <Th onClick={() => toggleSort("change")}>Change<SortIcon k="change" /></Th>
                <Th onClick={() => toggleSort("open")}>Open<SortIcon k="open" /></Th>
                <Th onClick={() => toggleSort("high")}>High<SortIcon k="high" /></Th>
                <Th onClick={() => toggleSort("low")}>Low<SortIcon k="low" /></Th>
                <Th onClick={() => toggleSort("orderRows")}>Orders<SortIcon k="orderRows" /></Th>
                <Th onClick={() => toggleSort("doneRows")}>Done<SortIcon k="doneRows" /></Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.ticker} className="border-b border-[#1A1A1A]/50 hover:bg-[#141210]/50 transition-colors">
                  <td className="px-3 py-1.5 text-[#C6A15B] font-bold whitespace-nowrap">{s.ticker}</td>
                  <td className="px-3 py-1.5 text-white text-right whitespace-nowrap">{s.close != null ? fmtNum(s.close) : "—"}</td>
                  <td className={`px-3 py-1.5 text-right font-bold whitespace-nowrap ${priceClass(s.change)}`}>{fmtPct(s.change)}</td>
                  <td className="px-3 py-1.5 text-[#B8AA96]/60 text-right whitespace-nowrap">{s.open != null ? fmtNum(s.open) : "—"}</td>
                  <td className="px-3 py-1.5 text-[#B8AA96]/60 text-right whitespace-nowrap">{s.high != null ? fmtNum(s.high) : "—"}</td>
                  <td className="px-3 py-1.5 text-[#B8AA96]/60 text-right whitespace-nowrap">{s.low != null ? fmtNum(s.low) : "—"}</td>
                  <td className="px-3 py-1.5 text-[#B8AA96] text-right whitespace-nowrap">{fmtNum(s.orderRows)}</td>
                  <td className="px-3 py-1.5 text-[#B8AA96] text-right whitespace-nowrap">{fmtNum(s.doneRows)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-8 text-[#B8AA96]/40 text-xs">No matching tickers</div>
          )}
        </div>
        <div className="text-[9px] text-[#B8AA96]/30 text-center py-3">
          {filtered.length} of {data.totalTickers} tickers • Data: Bandarmolony • Updated daily via cron
        </div>
      </div>
    </div>
  );
}

function Th({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <th
      onClick={onClick}
      className="px-3 py-1.5 text-[9px] text-[#B8AA96]/40 uppercase font-bold tracking-wider text-right cursor-pointer hover:text-[#C6A15B]/60 select-none whitespace-nowrap"
    >
      {children}
    </th>
  );
}
