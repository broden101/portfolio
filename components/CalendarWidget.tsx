"use client";

import { useState, useMemo } from "react";

type EventType = "us" | "id" | "pol" | "hol";

type EventItem = {
  t: EventType;
  n: string;
  w: string;
};

const EVENTS: Record<string, EventItem[]> = {
  "2026-08-31": [{ t: "pol", n: "Rebalancing: MSCI, FTSE, Kompas100 Minor", w: "Market Close" }],
  "2026-09-18": [{ t: "pol", n: "Rebalancing: IDX30, LQ45, IDX100, IDXHIDIV20, SRI-KEHATI", w: "Market Close" }],
  "2026-12-18": [{ t: "pol", n: "Rebalancing: MSCI, FTSE, GDX, COPX", w: "Market Close" }],
  "2026-08-05": [{ t: "id", n: "PDB Indo Q2", w: "Rilis 5,29%" }],
  "2026-08-07": [{ t: "us", n: "NFP US (Juli)", w: "19:30" }],
  "2026-08-12": [{ t: "us", n: "CPI US (Juli)", w: "19:30" }],
  "2026-08-13": [{ t: "us", n: "PPI US (Juli)", w: "19:30" }],
  "2026-08-17": [{ t: "hol", n: "LIBUR: Proklamasi Kemerdekaan", w: "Bursa Tutup" }],
  "2026-08-20": [{ t: "pol", n: "RDG BI — Suku Bunga", w: "14:00" }],
  "2026-08-25": [{ t: "hol", n: "LIBUR: Maulid Nabi", w: "Bursa Tutup" }],
  "2026-08-27": [{ t: "us", n: "GDP US Q2 Final", w: "19:30" }],
  "2026-09-04": [{ t: "us", n: "NFP US (Ags)", w: "19:30" }],
  "2026-09-11": [{ t: "us", n: "CPI US (Ags)", w: "19:30" }],
  "2026-09-12": [{ t: "us", n: "PPI US (Ags)", w: "19:30" }],
  "2026-09-17": [{ t: "pol", n: "FOMC — Suku Bunga", w: "01:00 (18/9)" }],
  "2026-09-23": [{ t: "pol", n: "RDG BI — Suku Bunga", w: "14:00" }],
  "2026-10-02": [{ t: "us", n: "NFP US (Sep)", w: "19:30" }],
  "2026-10-13": [{ t: "us", n: "CPI US (Sep)", w: "19:30" }],
  "2026-10-14": [{ t: "us", n: "PPI US (Sep)", w: "19:30" }],
  "2026-10-22": [{ t: "pol", n: "RDG BI — Suku Bunga", w: "14:00" }],
  "2026-10-29": [{ t: "us", n: "GDP US Q3 Advance", w: "19:30" }],
  "2026-11-05": [{ t: "id", n: "PDB Indo Q3", w: "Rilis Q3" }],
  "2026-11-06": [{ t: "us", n: "NFP US (Okt)", w: "19:30" }],
  "2026-11-12": [{ t: "us", n: "CPI US (Okt)", w: "19:30" }],
  "2026-11-13": [{ t: "us", n: "PPI US (Okt)", w: "19:30" }],
  "2026-11-19": [{ t: "pol", n: "RDG BI — Suku Bunga", w: "14:00" }],
  "2026-12-04": [{ t: "us", n: "NFP US (Nov)", w: "19:30" }],
  "2026-12-11": [{ t: "us", n: "CPI US (Nov)", w: "19:30" }],
  "2026-12-12": [{ t: "us", n: "PPI US (Nov)", w: "19:30" }],
  "2026-12-17": [{ t: "pol", n: "FOMC / RDG BI", w: "01:00 / 14:00" }],
  "2026-12-24": [{ t: "hol", n: "LIBUR: Cuti Bersama Natal", w: "Bursa Tutup" }],
  "2026-12-25": [{ t: "hol", n: "LIBUR: Natal", w: "Bursa Tutup" }],
  "2026-12-31": [{ t: "hol", n: "LIBUR: Tutup Tahun", w: "Bursa Tutup" }],
};

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const BURSA_DAYS: Record<number, number> = { 7: 19, 8: 22, 9: 22, 10: 21, 11: 20 }; // index 0=Jan

function getJakartaToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = Number(parts.find((p) => p.type === "year")?.value);
  const m = Number(parts.find((p) => p.type === "month")?.value) - 1;
  const d = Number(parts.find((p) => p.type === "day")?.value);
  return { y, m, d, str: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}` };
}

export default function CalendarWidget() {
  const jakartaToday = useMemo(() => getJakartaToday(), []);
  const [view, setView] = useState({ y: jakartaToday.y, m: jakartaToday.m });

  const pad = (n: number) => String(n).padStart(2, "0");

  const shiftMonth = (d: number) => {
    setView((prev) => {
      let nm = prev.m + d;
      let ny = prev.y;
      if (nm < 0) {
        nm = 11;
        ny--;
      } else if (nm > 11) {
        nm = 0;
        ny++;
      }
      return { y: ny, m: nm };
    });
  };

  const todayStr = jakartaToday.str;

  const daysInMonth = useMemo(
    () => new Date(view.y, view.m + 1, 0).getDate(),
    [view.y, view.m]
  );

  const startOffset = useMemo(
    () => new Date(view.y, view.m, 1).getDay(), // 0=Min
    [view.y, view.m]
  );

  const cells = useMemo(() => {
    const list = [];
    // empty cells
    for (let i = 0; i < startOffset; i++) {
      list.push({ type: "empty" as const, key: `empty-${i}` });
    }
    // day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${view.y}-${pad(view.m + 1)}-${pad(day)}`;
      const evs = EVENTS[dateStr] || [];
      const hasHoliday = evs.some((e) => e.t === "hol");
      const dow = new Date(view.y, view.m, day).getDay();
      const isWeekend = dow === 0 || dow === 6;
      const isToday = dateStr === todayStr;

      list.push({
        type: "day" as const,
        key: dateStr,
        day,
        dateStr,
        evs,
        hasHoliday,
        isWeekend,
        isToday,
      });
    }
    return list;
  }, [view.y, view.m, daysInMonth, startOffset, todayStr]);

  const bursaDays = BURSA_DAYS[view.m] || 0;

  return (
    <div className="card-luxury p-4 md:p-5 flex flex-col h-full justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => shiftMonth(-1)}
            className="w-7 h-7 rounded-md border border-[#2C261E] text-[#F4EFE6] hover:border-[#C6A15B] hover:text-[#C6A15B] transition-colors flex items-center justify-center text-sm"
            title="Bulan Sebelumnya"
          >
            ‹
          </button>
          <h2 className="text-sm font-semibold tracking-wider text-[#F4EFE6] uppercase">
            {MONTH_NAMES[view.m]} {view.y}
          </h2>
          <button
            onClick={() => shiftMonth(1)}
            className="w-7 h-7 rounded-md border border-[#2C261E] text-[#F4EFE6] hover:border-[#C6A15B] hover:text-[#C6A15B] transition-colors flex items-center justify-center text-sm"
            title="Bulan Berikutnya"
          >
            ›
          </button>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 gap-1 mb-1.5 text-center">
          {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((d) => (
            <span key={d} className="text-[9px] font-medium text-[#8A7F6D] uppercase tracking-wider">
              {d}
            </span>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell) => {
            if (cell.type === "empty") {
              return <div key={cell.key} className="min-h-[52px] bg-transparent" />;
            }

            const isOff = cell.hasHoliday || cell.isWeekend;

            return (
              <div
                key={cell.key}
                className={`min-h-[52px] border rounded-md p-1 flex flex-col gap-0.5 relative overflow-hidden transition-all ${
                  cell.isToday
                    ? "border-[#FFD700] bg-[#0E0C09] shadow-[inset_0_0_8px_rgba(255,215,0,0.15)]"
                    : isOff
                    ? "border-red-500/20"
                    : "border-[#2C261E] bg-[#0E0C09]"
                }`}
                style={
                  isOff
                    ? {
                        background:
                          "repeating-linear-gradient(45deg, #110c09, #110c09 8px, #1a1512 8px, #1a1512 16px)",
                      }
                    : undefined
                }
              >
                <div className="text-[10px] font-semibold text-[#8A7F6D] leading-none">
                  {cell.day}
                </div>
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  {cell.evs.map((e, idx) => {
                    const badgeClass =
                      e.t === "us"
                        ? "bg-blue-500/15 text-[#7FB2FF] border-l-2 border-blue-500"
                        : e.t === "id"
                        ? "bg-emerald-500/15 text-[#5EE0A8] border-l-2 border-emerald-500"
                        : e.t === "pol"
                        ? "bg-amber-500/15 text-[#FFC466] border-l-2 border-amber-500"
                        : "bg-red-500/15 text-[#FCA5A5] border-l-2 border-red-500";

                    return (
                      <div
                        key={idx}
                        className={`text-[7.5px] leading-tight px-1 py-0.5 rounded-[3px] truncate ${badgeClass}`}
                        title={`${e.n} (${e.w})`}
                      >
                        <span className="text-[#8A7F6D] text-[6.5px] block truncate">{e.w}</span>
                        <span className="truncate block font-medium">{e.n}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer & Legend */}
      <div className="mt-3 pt-2.5 border-t border-[#2C261E] space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-1.5 text-[9px] text-[#8A7F6D]">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" /> US
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> ID
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" /> Policy/Rebal
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" /> Libur
            </span>
          </div>
          <a
            href="/calendar.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#C6A15B] hover:underline text-[9px]"
          >
            Full Calendar ↗
          </a>
        </div>
        <div className="text-[9px] text-[#8A7F6D] text-center font-mono">
          {bursaDays} Hari Bursa • RagaPlaybook
        </div>
      </div>
    </div>
  );
}
