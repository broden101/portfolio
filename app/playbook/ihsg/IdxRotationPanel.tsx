"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/DataState";

type Row = { ticker: string; name: string; perfDay: number | null; perfWeek: number | null; perf1M: number | null };
type Tab = "Day" | "Week" | "1M";

const TAB_FIELD: Record<Tab, (r: Row) => number | null> = {
  Day: (r) => r.perfDay,
  Week: (r) => r.perfWeek,
  "1M": (r) => r.perf1M,
};
const TAB_PREV: Record<Tab, Tab | null> = { Day: null, Week: "Day", "1M": "Week" };
const TAB_LABEL: Record<Tab, string> = { Day: "Hari", Week: "1 Minggu", "1M": "1 Bulan" };

function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function quadInfo(rs: number, mom: number) {
  if (rs >= 0 && mom >= 0) return { label: "Leading", cls: "text-emerald-400" };
  if (rs < 0 && mom >= 0) return { label: "Improving", cls: "text-sky-400" };
  if (rs < 0 && mom < 0) return { label: "Lagging", cls: "text-red-400/80" };
  return { label: "Weakening", cls: "text-amber-400" };
}

const IDX_ROT_COLORS = ["#C6A15B", "#4E7AFF", "#34D399", "#F87171", "#FBBF24", "#A78BFA", "#22D3EE", "#FB7185"];

export function IdxRotationPanel() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [tab, setTab] = useState<Tab>("1M");
  const [err, setErr] = useState(false);
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/idx100-perf")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { if (alive) setRows(d.data ?? null); })
      .catch(() => { if (alive) setErr(true); });
    return () => { alive = false; };
  }, []);

  // compute RS & momentum per ticker
  const pts = (() => {
    if (!rows || rows.length === 0) return [];
    const field = TAB_FIELD[tab];
    const prevTab = TAB_PREV[tab];
    const valid = rows.filter((r) => field(r) != null && Number.isFinite(field(r) as number));
    if (valid.length === 0) return [];
    const bench = median(valid.map((r) => field(r) as number));
    const benchPrev = prevTab ? median(valid.filter((r) => TAB_FIELD[prevTab](r) != null).map((r) => TAB_FIELD[prevTab](r) as number)) : null;
    const out = valid.map((r) => {
      const rs = (field(r) as number) - bench;
      let mom: number;
      if (!prevTab) {
        mom = rs;
      } else {
        const pv = TAB_FIELD[prevTab](r);
        mom = pv != null ? rs - (pv - (benchPrev ?? 0)) : rs;
      }
      return { r, rs, mom };
    });
    return out;
  })();

  const maxAbs = pts.length ? Math.max(1e-9, ...pts.map((p) => Math.max(Math.abs(p.rs), Math.abs(p.mom)))) : 1;
  const hovered = hover ? pts.find((p) => p.r.ticker === hover) : null;

  return (
    <div className="card-luxury p-8">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-4">
        <div>
          <h2 className="font-heading text-xl text-[#F4EFE6] font-medium">
            IDX <span className="text-gold-gradient font-medium">Rotation</span>
          </h2>
          <p className="text-[10px] text-[#B8AA96]/40 mt-1">
            Relative Rotation per-ticker · 100 likuid · vs median {TAB_LABEL[tab]}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {(["Day", "Week", "1M"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 text-xs tracking-[0.15em] uppercase font-medium transition-all ${
                tab === t ? "bg-[#C6A15B]/15 text-[#C6A15B] border border-[#C6A15B]/30" : "border border-[#2C261E] text-[#B8AA96]/50 hover:text-[#B8AA96]"
              }`}>{t}</button>
          ))}
        </div>
      </div>

      {err ? (
        <EmptyState title="Data IDX tidak tersedia" description="Gagal memuat data IDX100. Coba muat ulang halaman." />
      ) : !rows ? (
        <div className="py-10 text-center text-[#B8AA96]/40 text-xs">Memuat IDX100…</div>
      ) : pts.length === 0 ? (
        <EmptyState title="Tidak ada data" description="Belum ada data performa untuk digambar." />
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* PLOT */}
          <div className="lg:col-span-2">
            <div className="relative aspect-[4/3] border border-[#2C261E] bg-[#0B0B0A]/60 overflow-hidden select-none" style={{ minHeight: 380 }}>
              <div className="absolute top-2 left-3 text-[9px] uppercase tracking-[0.2em] text-sky-400/70">Improving</div>
              <div className="absolute top-2 right-3 text-[9px] uppercase tracking-[0.2em] text-emerald-400/70">Leading</div>
              <div className="absolute bottom-2 left-3 text-[9px] uppercase tracking-[0.2em] text-red-400/60">Lagging</div>
              <div className="absolute bottom-2 right-3 text-[9px] uppercase tracking-[0.2em] text-amber-400/70">Weakening</div>
              <div className="absolute left-0 right-0 top-1/2 h-px bg-[#2C261E]" />
              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-[#2C261E]" />
              {/* benchmark median center */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#C6A15B]/60" />

              {/* tail arrows */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <marker id="idxRotArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(184,170,150,0.25)" />
                  </marker>
                </defs>
                {pts.map(({ r, rs, mom }) => {
                  const cx = 50 + (rs / maxAbs) * 41;
                  const cy = 50 - (mom / maxAbs) * 41;
                  return (
                    <line key={r.ticker} x1={cx} y1={cy} x2={cx + 4} y2={cy} stroke="transparent" strokeWidth="0" />
                  );
                })}
              </svg>

              {/* dots */}
              {pts.map(({ r, rs, mom }) => {
                const x = 50 + (rs / maxAbs) * 41;
                const y = 50 - (mom / maxAbs) * 41;
                const q = quadInfo(rs, mom);
                // label hanya untuk rata-rata ekstrem (kuadran luar) biar tidak penuh sesak
                const isExtreme = Math.hypot(rs / maxAbs, mom / maxAbs) > 0.55;
                const isHover = hover === r.ticker;
                return (
                  <button key={r.ticker}
                    onMouseEnter={() => setHover(r.ticker)}
                    onMouseLeave={() => setHover(null)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group"
                    style={{ left: `${x}%`, top: `${y}%` }}
                    title={`${r.ticker} — RS ${rs >= 0 ? "+" : ""}${rs.toFixed(2)} · Mom ${mom >= 0 ? "+" : ""}${mom.toFixed(2)} · ${TAB_LABEL[tab]} ${(TAB_FIELD[tab](r) ?? 0) >= 0 ? "+" : ""}${(TAB_FIELD[tab](r) ?? 0).toFixed(2)}%`}>
                    <span className={`block w-1.5 h-1.5 rounded-full border ${isHover ? "ring-2 ring-[#C6A15B]/60" : ""}`}
                      style={{ backgroundColor: `rgba(198,161,91,0.7)`, borderColor: q.cls.includes("emerald") ? "rgba(52,211,153,0.6)" : q.cls.includes("sky") ? "rgba(56,189,248,0.6)" : q.cls.includes("red") ? "rgba(248,113,113,0.5)" : "rgba(251,191,36,0.6)" }} />
                    {(isExtreme || isHover) && (
                      <span className={`absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] font-mono whitespace-nowrap ${q.cls}`}>
                        {r.ticker}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* hover tooltip */}
              {hovered && (
                <div className="absolute pointer-events-none z-10 bg-[#16130E]/95 border border-[#2C261E] px-3 py-2 text-[10px] font-mono"
                  style={{ left: "50%", top: 0, transform: "translateX(-50%)" }}>
                  <div className={`font-sans font-medium ${quadInfo(hovered.rs, hovered.mom).cls}`}>{hovered.r.ticker}</div>
                  <div className="text-[#B8AA96]/60">RS <span className="text-[#F4EFE6]">{hovered.rs >= 0 ? "+" : ""}{hovered.rs.toFixed(2)}%</span></div>
                  <div className="text-[#B8AA96]/60">Mom <span className="text-[#F4EFE6]">{hovered.mom >= 0 ? "+" : ""}{hovered.mom.toFixed(2)}%</span></div>
                  <div className="text-[#B8AA96]/60">{TAB_LABEL[tab]}: <span className="text-[#F4EFE6]">{(TAB_FIELD[tab](hovered.r) ?? 0) >= 0 ? "+" : ""}{(TAB_FIELD[tab](hovered.r) ?? 0).toFixed(2)}%</span></div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between mt-2 text-[9px] text-[#B8AA96]/40 tracking-wider uppercase">
              <span>← Underperform median</span>
              <span className="text-[#B8AA96]/60">RS vs momentum · {TAB_LABEL[tab]}</span>
              <span>Outperform median →</span>
            </div>
          </div>

          {/* RANKED TABLE — top/bottom */}
          <div className="flex flex-col gap-3 overflow-hidden">
            {(["Leading", "Lagging"] as const).map((which) => (
              <div key={which}>
                <div className={`text-[10px] uppercase tracking-[0.15em] font-medium mb-1 ${which === "Leading" ? "text-emerald-400" : "text-red-400/80"}`}>
                  {which} · by RS
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#2C261E]">
                      <th className="text-left text-[#B8AA96]/50 text-[9px] tracking-[0.15em] uppercase py-1 font-medium">Tkr</th>
                      <th className="text-right text-[#B8AA96]/50 text-[9px] tracking-[0.15em] uppercase py-1 font-medium">RS</th>
                      <th className="text-right text-[#B8AA96]/50 text-[9px] tracking-[0.15em] uppercase py-1 font-medium">{TAB_LABEL[tab]}</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {pts
                      .filter((p) => quadInfo(p.rs, p.mom).label === which)
                      .sort((a, b) => which === "Leading" ? b.rs - a.rs : a.rs - b.rs)
                      .slice(0, 5)
                      .map(({ r, rs }) => (
                        <tr key={r.ticker} className="border-b border-[#2C261E]/20">
                          <td className="py-1 text-[#F4EFE6] font-sans" style={{ color: IDX_ROT_COLORS[0] }}>{r.ticker}</td>
                          <td className={`py-1 text-right ${rs >= 0 ? "text-emerald-400" : "text-red-400"}`}>{rs >= 0 ? "+" : ""}{rs.toFixed(2)}</td>
                          <td className="py-1 text-right text-[#B8AA96]/70">{(TAB_FIELD[tab](r) ?? 0) >= 0 ? "+" : ""}{(TAB_FIELD[tab](r) ?? 0).toFixed(1)}%</td>
                        </tr>
                      ))}
                    {pts.filter((p) => quadInfo(p.rs, p.mom).label === which).length === 0 && (
                      <tr><td className="py-1 text-[#B8AA96]/40 text-[10px]" colSpan={3}>Tidak ada di {which}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}