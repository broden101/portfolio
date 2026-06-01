"use client";

import { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface DividendStock {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  price: number;
  change: number;
  marketCap: number;
  dividendYield: number;
  dps: number;
  payoutRatio: number;
  frequency: string;
  exDividendDate: string | null;
  nextEstExDate: string | null;
  consecutiveYears: number;
  dividendHistory: { date: string; amount: number }[];
  rank: number;
}

interface DividendData {
  lastUpdated: string | null;
  source: string;
  index: string;
  totalStocks: number;
  stocks: DividendStock[];
  message?: string;
}

interface DividendEvent {
  ticker: string;
  name: string;
  type: "EX_DATE" | "PAY_DATE" | "CUM_DATE";
  date: string;
  dps: number;
  yield: number;
}

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
                <span className="ml-auto font-mono">Rp{ev.dps}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function generateCalendarEvents(stocks: DividendStock[], year: number, month: number): DividendEvent[] {
  const events: DividendEvent[] = [];
  const monthStr = String(month).padStart(2, "0");

  stocks.forEach((stock) => {
    if (!stock.nextEstExDate) return;
    const exDate = new Date(stock.nextEstExDate);
    const exMonth = exDate.getMonth() + 1;
    const exDay = exDate.getDate();

    if (exMonth === month) {
      // Ex-date
      events.push({
        ticker: stock.ticker,
        name: stock.name,
        type: "EX_DATE",
        date: `${year}-${monthStr}-${String(exDay).padStart(2, "0")}`,
        dps: stock.dps,
        yield: stock.dividendYield,
      });

      // Cum-date (2 days before)
      const cumDay = exDay - 2;
      if (cumDay > 0) {
        events.push({
          ticker: stock.ticker,
          name: stock.name,
          type: "CUM_DATE",
          date: `${year}-${monthStr}-${String(cumDay).padStart(2, "0")}`,
          dps: stock.dps,
          yield: stock.dividendYield,
        });
      }
    }
  });

  return events.sort((a, b) => a.date.localeCompare(b.date));
}

function DividendCalendar({ stocks }: { stocks: DividendStock[] }) {
  const [year] = useState(2026);
  const [month, setMonth] = useState(new Date().getMonth());

  const events = useMemo(() => generateCalendarEvents(stocks, year, month + 1), [stocks, year, month]);
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
          <h3 className="font-heading text-xl text-[#F4EFE6] font-medium">
            Dividend Calendar
          </h3>
          <p className="text-xs text-[#B8AA96]/50 mt-1">Estimated ex-dates based on historical data</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonth((m) => (m === 0 ? 11 : m - 1))}
            className="w-8 h-8 flex items-center justify-center border border-[#2C261E] text-[#B8AA96] hover:border-[#C6A15B] hover:text-[#C6A15B] transition-all"
          >
            ‹
          </button>
          <span className="text-sm text-[#F4EFE6] font-medium min-w-[140px] text-center">
            {MONTHS[month]} {year}
          </span>
          <button
            onClick={() => setMonth((m) => (m === 11 ? 0 : m + 1))}
            className="w-8 h-8 flex items-center justify-center border border-[#2C261E] text-[#B8AA96] hover:border-[#C6A15B] hover:text-[#C6A15B] transition-all"
          >
            ›
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs">
        {Object.entries(EVENT_COLORS).map(([type, c]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-sm ${c.bg} border ${c.border}`} />
            <span className="text-[#B8AA96]/60">{type.replace("_", " ")}</span>
          </div>
        ))}
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-[10px] text-[#B8AA96]/40 uppercase tracking-wider py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          return (
            <CalendarDay key={day} day={day} events={eventsByDay[day] || []} />
          );
        })}
      </div>

      {/* Events list */}
      {events.length > 0 && (
        <div className="mt-6 pt-4 border-t border-[#2C261E]">
          <h4 className="text-xs text-[#C6A15B] tracking-[0.2em] uppercase mb-3 font-medium">
            Events this month ({events.length})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {events.map((ev, i) => {
              const c = EVENT_COLORS[ev.type];
              return (
                <div key={i} className={`flex items-center justify-between px-3 py-2 rounded ${c.bg}`}>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-[#F4EFE6]">
                      {ev.ticker.replace(".JK", "")}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${c.text} ${c.bg} border ${c.border}`}>
                      {ev.type.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-[#B8AA96]">{ev.date}</span>
                    <span className="text-[#F4EFE6] font-mono">Rp{ev.dps.toLocaleString()}</span>
                    <span className="text-[#C6A15B]">{ev.yield}%</span>
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
  const [sortBy, setSortBy] = useState<keyof DividendStock>("dividendYield");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [sectorFilter, setSectorFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [freqFilter, setFreqFilter] = useState<string>("ALL");

  const sectors = useMemo(() => {
    const s = new Set(stocks.map((st) => st.sector).filter(Boolean));
    return Array.from(s).sort();
  }, [stocks]);

  const filtered = useMemo(() => {
    let result = [...stocks];

    if (sectorFilter !== "ALL") {
      result = result.filter((s) => s.sector === sectorFilter);
    }
    if (freqFilter !== "ALL") {
      result = result.filter((s) => s.frequency === freqFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.ticker.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const aVal = a[sortBy] ?? 0;
      const bVal = b[sortBy] ?? 0;
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortDir === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

    return result;
  }, [stocks, sectorFilter, freqFilter, search, sortBy, sortDir]);

  const handleSort = (col: keyof DividendStock) => {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ col }: { col: keyof DividendStock }) => {
    if (sortBy !== col) return <span className="text-[#B8AA96]/20 ml-1">↕</span>;
    return <span className="text-[#C6A15B] ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  return (
    <div className="card-luxury p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h3 className="font-heading text-xl text-[#F4EFE6] font-medium">
            Dividend Stock Picker
          </h3>
          <p className="text-xs text-[#B8AA96]/50 mt-1">IDX Kompas 100 dividend stocks ranked by yield</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search ticker..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-40 bg-[#0B0B0A] border border-[#2C261E] px-3 py-2 text-xs text-[#F4EFE6] placeholder-[#B8AA96]/30"
          />
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="bg-[#0B0B0A] border border-[#2C261E] px-3 py-2 text-xs text-[#F4EFE6] appearance-none cursor-pointer"
          >
            <option value="ALL">All Sectors</option>
            {sectors.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Stocks", value: filtered.length, color: "text-[#F4EFE6]" },
          { label: "Avg Yield", value: `${(filtered.reduce((a, s) => a + s.dividendYield, 0) / (filtered.length || 1)).toFixed(1)}%`, color: "text-[#C6A15B]" },
          { label: "Highest Yield", value: `${(Math.max(...filtered.map((s) => s.dividendYield), 0)).toFixed(1)}%`, color: "text-emerald-400" },
          { label: "Avg Payout", value: `${(filtered.reduce((a, s) => a + s.payoutRatio, 0) / (filtered.length || 1)).toFixed(0)}%`, color: "text-blue-400" },
        ].map((s) => (
          <div key={s.label} className="bg-[#0B0B0A] border border-[#2C261E] p-4 text-center">
            <div className={`font-heading text-2xl font-medium ${s.color}`}>{s.value}</div>
            <div className="text-[#B8AA96]/40 text-[10px] tracking-[0.2em] uppercase mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#2C261E]">
              <th className="text-left py-3 px-2 text-[#B8AA96]/50 font-medium">#</th>
              {([
                ["ticker", "Stock"],
                ["price", "Price"],
                ["change", "Chg"],
                ["dividendYield", "Yield %"],
                ["dps", "DPS (Rp)"],
                ["payoutRatio", "Payout %"],
                ["frequency", "Freq"],
                ["consecutiveYears", "Yrs"],
                ["marketCap", "MCap (T)"],
                ["nextEstExDate", "Est. Ex-Date"],
              ] as [keyof DividendStock, string][]).map(([key, label]) => (
                <th
                  key={key}
                  className="text-left py-3 px-2 text-[#B8AA96]/50 font-medium cursor-pointer hover:text-[#C6A15B] transition-colors select-none"
                  onClick={() => handleSort(key)}
                >
                  {label}
                  <SortIcon col={key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((stock, i) => (
              <tr
                key={stock.ticker}
                className="border-b border-[#2C261E]/50 hover:bg-[#C6A15B]/5 transition-colors group"
              >
                <td className="py-3 px-2 text-[#B8AA96]/30">{i + 1}</td>
                <td className="py-3 px-2">
                  <div>
                    <span className="font-mono font-semibold text-[#F4EFE6] group-hover:text-[#C6A15B] transition-colors">
                      {stock.ticker.replace(".JK", "")}
                    </span>
                    <div className="text-[10px] text-[#B8AA96]/40 mt-0.5 max-w-[120px] truncate">
                      {stock.name}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-2 font-mono text-[#F4EFE6]">
                  {stock.price ? stock.price.toLocaleString() : "-"}
                </td>
                <td className={`py-3 px-2 font-mono ${stock.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {stock.change ? `${stock.change >= 0 ? "+" : ""}${stock.change}` : "-"}
                </td>
                <td className="py-3 px-2">
                  <span className={`font-mono font-semibold px-2 py-0.5 rounded text-[11px] ${
                    stock.dividendYield >= 7
                      ? "bg-emerald-500/15 text-emerald-400"
                      : stock.dividendYield >= 5
                        ? "bg-[#C6A15B]/15 text-[#C6A15B]"
                        : stock.dividendYield > 0
                          ? "bg-[#B8AA96]/10 text-[#B8AA96]"
                          : "text-[#B8AA96]/30"
                  }`}>
                    {stock.dividendYield ? `${stock.dividendYield}%` : "-"}
                  </span>
                </td>
                <td className="py-3 px-2 font-mono text-[#F4EFE6]">
                  {stock.dps ? stock.dps.toLocaleString() : "-"}
                </td>
                <td className="py-3 px-2">
                  {stock.payoutRatio ? (
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 bg-[#2C261E] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#C6A15B]/60 rounded-full"
                          style={{ width: `${Math.min(stock.payoutRatio, 100)}%` }}
                        />
                      </div>
                      <span className="text-[#B8AA96]">{stock.payoutRatio}%</span>
                    </div>
                  ) : (
                    <span className="text-[#B8AA96]/30">-</span>
                  )}
                </td>
                <td className="py-3 px-2 text-[#B8AA96]">{stock.frequency || "-"}</td>
                <td className="py-3 px-2">
                  <span className={`font-mono ${stock.consecutiveYears >= 10 ? "text-[#C6A15B]" : "text-[#B8AA96]"}`}>
                    {stock.consecutiveYears || "-"}
                  </span>
                </td>
                <td className="py-3 px-2 font-mono text-[#F4EFE6]">
                  {stock.marketCap ? `${stock.marketCap.toFixed(0)}T` : "-"}
                </td>
                <td className="py-3 px-2 font-mono text-[#B8AA96]/70">
                  {stock.nextEstExDate || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function DividendPage() {
  const [data, setData] = useState<DividendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dividends")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load dividend data");
        setLoading(false);
      });
  }, []);

  const stocks = data?.stocks || [];

  return (
    <div className="min-h-screen bg-[#0B0B0A] pt-24 pb-20">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-10 h-px bg-[#C6A15B]/30" />
            <span className="text-[#C6A15B] text-xs tracking-[0.3em] uppercase font-medium">IDX Kompas 100</span>
          </div>
          <h1 className="font-heading text-4xl text-[#F4EFE6] font-light">
            Dividend <span className="text-gold-gradient font-medium">Tracker</span>
          </h1>
          <p className="text-[#B8AA96]/60 text-sm mt-2 max-w-xl">
            Track upcoming ex-dates, compare dividend yields, and identify high-quality income stocks on the Indonesia Stock Exchange.
          </p>
          {data?.lastUpdated && (
            <p className="text-[#B8AA96]/40 text-xs mt-2">
              Last updated: {new Date(data.lastUpdated).toLocaleString()} • Source: {data.source}
            </p>
          )}
        </div>

        {loading ? (
          <div className="card-luxury p-12 text-center">
            <div className="animate-pulse">
              <div className="w-8 h-8 border-2 border-[#C6A15B]/30 border-t-[#C6A15B] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[#B8AA96]/60 text-sm">Loading dividend data...</p>
            </div>
          </div>
        ) : error ? (
          <div className="card-luxury p-12 text-center">
            <p className="text-red-400 mb-2">{error}</p>
            <p className="text-[#B8AA96]/40 text-xs">Please try again later</p>
          </div>
        ) : stocks.length === 0 ? (
          <div className="card-luxury p-12 text-center">
            <p className="text-[#B8AA96] mb-2">No dividend data available</p>
            <p className="text-[#B8AA96]/40 text-xs">Run: python3 scripts/fetch-dividends.py</p>
          </div>
        ) : (
          <>
            {/* Calendar */}
            <div className="mb-8">
              <DividendCalendar stocks={stocks} />
            </div>

            {/* Stock Picker */}
            <StockPicker stocks={stocks} />
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
