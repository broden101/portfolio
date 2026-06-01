"use client";

import { useState, useMemo, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  loadDividendData,
  getDividendEvents,
  getEventsForMonth,
  getSectors,
  sortStocks,
  type DividendStock,
  type DividendEvent,
} from "@/lib/dividend";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const EVENT_COLORS = {
  EX_DATE: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/40" },
  CUM_DATE: { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/40" },
  PAY_DATE: { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/40" },
};

function CalendarDay({ day, events }: { day: number; events: DividendEvent[] }) {
  const [open, setOpen] = useState(false);
  if (!events.length) {
    return (
      <div className="h-10 flex items-center justify-center text-xs text-[#B8AA96]/30">
        {day}
      </div>
    );
  }
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`h-10 w-full flex items-center justify-center text-xs font-medium rounded transition-all ${
          events.some((e) => e.type === "EX_DATE")
            ? "bg-[#C6A15B]/20 text-[#C6A15B] border border-[#C6A15B]/30"
            : events.some((e) => e.type === "CUM_DATE")
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
        }`}
      >
        {day}
        {events.length > 1 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#C6A15B] text-[#0B0B0A] text-[9px] font-bold rounded-full flex items-center justify-center">
            {events.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute z-20 top-full left-0 mt-1 w-56 card-luxury p-3 space-y-2">
          {events.map((ev, i) => {
            const c = EVENT_COLORS[ev.type];
            return (
              <div key={i} className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs ${c.bg} ${c.text}`}>
                <span className="font-mono font-semibold">{ev.ticker.replace(".JK", "")}</span>
                <span className="text-[#B8AA96]/50">•</span>
                <span>{ev.type.replace("_", " ")}</span>
                <span className="ml-auto font-mono">Rp{ev.dps.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DividendCalendar({ stocks }: { stocks: DividendStock[] }) {
  const [year] = useState(2026);
  const [month, setMonth] = useState(0);

  const allEvents = useMemo(() => getDividendEvents(stocks, year), [stocks, year]);
  const events = useMemo(() => getEventsForMonth(allEvents, year, month + 1), [allEvents, year, month]);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const eventsByDay: Record<number, DividendEvent[]> = {};
  events.forEach((ev) => {
    const d = parseInt(ev.date.split("-")[2], 10);
    if (!eventsByDay[d]) eventsByDay[d] = [];
    eventsByDay[d].push(ev);
  });

  return (
    <div className="card-luxury p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-heading text-xl text-[#F4EFE6] font-medium">Dividend Calendar</h3>
          <p className="text-xs text-[#B8AA96]/50 mt-1">Based on latest dividend history from panendividen.com</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMonth((m) => (m === 0 ? 11 : m - 1))} className="w-8 h-8 flex items-center justify-center border border-[#2C261E] text-[#B8AA96] hover:border-[#C6A15B] hover:text-[#C6A15B] transition-all">‹</button>
          <span className="text-sm text-[#F4EFE6] font-medium min-w-[140px] text-center">{MONTHS[month]} {year}</span>
          <button onClick={() => setMonth((m) => (m === 11 ? 0 : m + 1))} className="w-8 h-8 flex items-center justify-center border border-[#2C261E] text-[#B8AA96] hover:border-[#C6A15B] hover:text-[#C6A15B] transition-all">›</button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4 text-xs">
        {Object.entries(EVENT_COLORS).map(([type, c]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-sm ${c.bg} border ${c.border}`} />
            <span className="text-[#B8AA96]/60">{type.replace("_", " ")}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-[10px] text-[#B8AA96]/40 uppercase tracking-wider py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => (<div key={`empty-${i}`} />))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          return <CalendarDay key={day} day={day} events={eventsByDay[day] || []} />;
        })}
      </div>

      {events.length > 0 && (
        <div className="mt-6 pt-4 border-t border-[#2C261E]">
          <h4 className="text-xs text-[#C6A15B] tracking-[0.2em] uppercase mb-3 font-medium">Events this month ({events.length})</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {events.map((ev, i) => {
              const c = EVENT_COLORS[ev.type];
              return (
                <div key={i} className={`flex items-center justify-between px-3 py-2 rounded ${c.bg}`}>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-[#F4EFE6]">{ev.ticker.replace(".JK", "")}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${c.text} ${c.bg} border ${c.border}`}>{ev.type.replace("_", " ")}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-[#B8AA96]">{ev.date}</span>
                    <span className="text-[#F4EFE6] font-mono">Rp{ev.dps.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StockPicker({ stocks }: { stocks: DividendStock[] }) {
  const [sortBy, setSortBy] = useState<keyof DividendStock>("totalDividends");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [sectorFilter, setSectorFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [expandedStock, setExpandedStock] = useState<string | null>(null);

  const sectors = useMemo(() => getSectors(stocks), [stocks]);

  const filtered = useMemo(() => {
    let result = [...stocks];
    if (sectorFilter !== "ALL") result = result.filter((s) => s.sector === sectorFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((s) => s.ticker.toLowerCase().includes(q) || s.companyName.toLowerCase().includes(q));
    }
    return sortStocks(result, sortBy, sortDir);
  }, [stocks, sectorFilter, search, sortBy, sortDir]);

  const handleSort = (col: keyof DividendStock) => {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortDir("desc"); }
  };

  const SortIcon = ({ col }: { col: keyof DividendStock }) => {
    if (sortBy !== col) return <span className="text-[#B8AA96]/20 ml-1">↕</span>;
    return <span className="text-[#C6A15B] ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  const formatRp = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toFixed(0);
  };

  return (
    <div className="card-luxury p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h3 className="font-heading text-xl text-[#F4EFE6] font-medium">Kompas 100 Dividend Stocks</h3>
          <p className="text-xs text-[#B8AA96]/50 mt-1">Data sourced from panendividen.com — ranked by total historical dividends</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="text" placeholder="Search ticker/name..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-48 bg-[#0B0B0A] border border-[#2C261E] px-3 py-2 text-xs text-[#F4EFE6] placeholder-[#B8AA96]/30" />
          <select value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)} className="bg-[#0B0B0A] border border-[#2C261E] px-3 py-2 text-xs text-[#F4EFE6] appearance-none cursor-pointer">
            <option value="ALL">All Sectors</option>
            {sectors.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Stocks", value: filtered.length, color: "text-[#F4EFE6]" },
          { label: "Avg History", value: `${(filtered.reduce((a, s) => a + s.yearsOfHistory, 0) / filtered.length || 0).toFixed(0)} yrs`, color: "text-[#C6A15B]" },
          { label: "Top Total Div", value: `Rp ${formatRp(Math.max(...filtered.map((s) => s.totalDividends)))}`, color: "text-emerald-400" },
          { label: "Sectors", value: sectors.length, color: "text-blue-400" },
        ].map((s) => (
          <div key={s.label} className="bg-[#0B0B0A] border border-[#2C261E] p-4 text-center">
            <div className={`font-heading text-2xl font-medium ${s.color}`}>{s.value}</div>
            <div className="text-[#B8AA96]/40 text-[10px] tracking-[0.2em] uppercase mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#2C261E]">
              <th className="text-left py-3 px-2 text-[#B8AA96]/50 font-medium">#</th>
              {([
                ["ticker", "Stock"],
                ["sector", "Sector"],
                ["totalDividends", "Total Div (Rp)"],
                ["dividendCount", "Payments"],
                ["yearsOfHistory", "Years"],
                ["avgDividendPerYear", "Avg/Yr (Rp)"],
                ["latestDividend", "Latest Ex-Date"],
              ] as [keyof DividendStock, string][]).map(([key, label]) => (
                <th key={key} className="text-left py-3 px-2 text-[#B8AA96]/50 font-medium cursor-pointer hover:text-[#C6A15B] transition-colors select-none whitespace-nowrap" onClick={() => handleSort(key)}>
                  {label}<SortIcon col={key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((stock, i) => (
              <tr key={stock.ticker} className="border-b border-[#2C261E]/50 hover:bg-[#C6A15B]/5 transition-colors group cursor-pointer" onClick={() => setExpandedStock(expandedStock === stock.ticker ? null : stock.ticker)}>
                <td className="py-3 px-2 text-[#B8AA96]/30">{i + 1}</td>
                <td className="py-3 px-2">
                  <div>
                    <span className="font-mono font-semibold text-[#F4EFE6] group-hover:text-[#C6A15B] transition-colors">{stock.ticker}</span>
                    <div className="text-[10px] text-[#B8AA96]/40 mt-0.5 max-w-[180px] truncate">{stock.companyName}</div>
                  </div>
                </td>
                <td className="py-3 px-2 text-[#B8AA96]">{stock.sector}</td>
                <td className="py-3 px-2 font-mono font-semibold text-[#F4EFE6]">{stock.totalDividends.toLocaleString()}</td>
                <td className="py-3 px-2 font-mono text-[#B8AA96]">{stock.dividendCount}</td>
                <td className="py-3 px-2">
                  <span className={`font-mono ${stock.yearsOfHistory >= 15 ? "text-[#C6A15B]" : stock.yearsOfHistory >= 10 ? "text-emerald-400" : "text-[#B8AA96]"}`}>
                    {stock.yearsOfHistory}
                  </span>
                </td>
                <td className="py-3 px-2 font-mono text-[#F4EFE6]">{stock.avgDividendPerYear.toLocaleString()}</td>
                <td className="py-3 px-2">
                  {stock.latestDividend?.date ? (
                    <div>
                      <div className="font-mono text-[#B8AA96]/70">{stock.latestDividend.date}</div>
                      <div className="text-[10px] text-emerald-400 font-mono">Rp{stock.latestDividend.amount.toLocaleString()}</div>
                    </div>
                  ) : (
                    <span className="text-[#B8AA96]/30">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Expanded stock detail */}
      {expandedStock && (() => {
        const stock = stocks.find(s => s.ticker === expandedStock);
        if (!stock) return null;
        return (
          <div className="mt-6 pt-4 border-t border-[#2C261E]">
            <h4 className="text-sm text-[#F4EFE6] font-medium mb-3">
              <span className="font-mono text-[#C6A15B]">{stock.ticker}</span>
              <span className="text-[#B8AA96]/60 ml-2">— {stock.companyName}</span>
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-[#0B0B0A] border border-[#2C261E] p-3">
                <div className="text-[10px] text-[#B8AA96]/40 uppercase tracking-wider">Sector</div>
                <div className="text-xs text-[#F4EFE6] mt-1">{stock.sector}</div>
              </div>
              <div className="bg-[#0B0B0A] border border-[#2C261E] p-3">
                <div className="text-[10px] text-[#B8AA96]/40 uppercase tracking-wider">Industry</div>
                <div className="text-xs text-[#F4EFE6] mt-1">{stock.industry}</div>
              </div>
              <div className="bg-[#0B0B0A] border border-[#2C261E] p-3">
                <div className="text-[10px] text-[#B8AA96]/40 uppercase tracking-wider">Total Dividends</div>
                <div className="text-xs text-[#C6A15B] font-mono mt-1">Rp {stock.totalDividends.toLocaleString()}</div>
              </div>
              <div className="bg-[#0B0B0A] border border-[#2C261E] p-3">
                <div className="text-[10px] text-[#B8AA96]/40 uppercase tracking-wider">Avg/Year</div>
                <div className="text-xs text-emerald-400 font-mono mt-1">Rp {stock.avgDividendPerYear.toLocaleString()}</div>
              </div>
            </div>
            {stock.fiscalYears?.length > 0 && (
              <div className="bg-[#0B0B0A] border border-[#2C261E] p-3">
                <div className="text-[10px] text-[#B8AA96]/40 uppercase tracking-wider mb-2">Fiscal Years with Dividends</div>
                <div className="flex flex-wrap gap-2">
                  {stock.fiscalYears.map(fy => (
                    <span key={fy} className="px-2 py-1 text-[10px] font-mono bg-[#C6A15B]/10 text-[#C6A15B] border border-[#C6A15B]/20">{fy}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

export default function DividendPage() {
  const [stocks, setStocks] = useState<DividendStock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDividendData().then((data) => {
      setStocks(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0B0A] pt-24 pb-20">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-10 h-px bg-[#C6A15B]/30" />
            <span className="text-[#C6A15B] text-xs tracking-[0.3em] uppercase font-medium">IDX Kompas 100</span>
          </div>
          <h1 className="font-heading text-4xl text-[#F4EFE6] font-light">
            Dividend <span className="text-gold-gradient font-medium">Tracker</span>
          </h1>
          <p className="text-[#B8AA96]/60 text-sm mt-2 max-w-xl">
            Dividend history for Kompas 100 stocks, sourced from panendividen.com. Track ex-dates, compare total payouts, and identify consistent dividend payers.
          </p>
        </div>

        {loading ? (
          <div className="card-luxury p-12 text-center">
            <div className="text-[#B8AA96]/40 text-sm">Loading dividend data...</div>
          </div>
        ) : stocks.length === 0 ? (
          <div className="card-luxury p-12 text-center">
            <div className="text-[#B8AA96]/40 text-sm">No dividend data available.</div>
          </div>
        ) : (
          <>
            <div className="mb-8"><DividendCalendar stocks={stocks} /></div>
            <StockPicker stocks={stocks} />
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
