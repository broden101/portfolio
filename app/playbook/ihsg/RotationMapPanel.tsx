"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/DataState";

type Mode = "sectors" | "stocks";
type Interval = "daily" | "weekly";

type ApiItem = { ticker: string; name: string; perf: (number | null)[] };
type ApiResp = {
  benchmark: (number | null)[] | null;
  windows: string[];
  sectors: ApiItem[];
  stocks: ApiItem[];
};

// Deret window per interval (short → long). Daily pakai Day base, weekly skip Day.
const INTERVAL_WINDOWS: Record<Interval, number[]> = {
  daily: [0, 1, 2, 3],   // Day, 1W, 1M, 3M
  weekly: [1, 2, 3, 4],  // 1W, 1M, 3M, 6M
};
const WINDOW_LABEL: Record<number, string> = { 0: "Day", 1: "1W", 2: "1M", 3: "3M", 4: "6M" };

function quadInfo(rs: number, mom: number) {
  if (rs >= 0 && mom >= 0) return { label: "Leading", cls: "text-emerald-400", dot: "rgba(52,211,153,0.9)", bd: "rgba(52,211,153,0.6)" };
  if (rs < 0 && mom >= 0) return { label: "Improving", cls: "text-sky-400", dot: "rgba(56,189,248,0.9)", bd: "rgba(56,189,248,0.6)" };
  if (rs < 0 && mom < 0) return { label: "Lagging", cls: "text-red-400/80", dot: "rgba(248,113,113,0.75)", bd: "rgba(248,113,113,0.5)" };
  return { label: "Weakening", cls: "text-amber-400", dot: "rgba(251,191,36,0.85)", bd: "rgba(251,191,36,0.6)" };
}

export function RotationMapPanel() {
  const [data, setData] = useState<ApiResp | null>(null);
  const [mode, setMode] = useState<Mode>("sectors");
  const [interval, setInterval] = useState<Interval>("daily");
  const [tail, setTail] = useState(3);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/rotation")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { if (alive) setData(d); })
      .catch(() => { if (alive) setErr(true); });
    return () => { alive = false; };
  }, []);

  const items = mode === "sectors" ? (data?.sectors ?? []) : (data?.stocks ?? []);
  const bench = data?.benchmark ?? null;
  const winIdx = INTERVAL_WINDOWS[interval];
  const maxTail = winIdx.length; // max 4

  // Hitung deret posisi (rs, mom) per item atas window trail
  const series = useMemo(() => {
    if (!bench) return [];
    return items.map((it) => {
      const pts: { rs: number; mom: number }[] = [];
      winIdx.forEach((wi, i) => {
        const v = it.perf[wi];
        const b = bench[wi];
        if (v == null || b == null || !Number.isFinite(v) || !Number.isFinite(b)) return;
        const rs = v - b;
        // momentum = perubahan RS vs window sebelumnya
        let mom = rs;
        if (i > 0) {
          const pv = it.perf[winIdx[i - 1]];
          const pb = bench[winIdx[i - 1]];
          if (pv != null && pb != null) mom = rs - (pv - pb);
        }
        pts.push({ rs, mom });
      });
      return { it, pts };
    }).filter((x) => x.pts.length > 0);
  }, [items, bench, interval]); // eslint-disable-line react-hooks/exhaustive-deps

  // normalisasi skala pakai semua titik trail + semua item
  const scale = useMemo(() => {
    let m = 1e-9;
    for (const s of series) for (const p of s.pts) m = Math.max(m, Math.abs(p.rs), Math.abs(p.mom));
    return m;
  }, [series]);
  const ns = (v: number) => 50 + (v / scale) * 40; // 50% ± 40%

  const [hover, setHover] = useState<string | null>(null);
  const [filterQuad, setFilterQuad] = useState<string | null>(null); // null = all; "++" dst
  const QUAD_GUIDE: { k: string; label: string; desc: string; cls: string; activeCls: string }[] = [
    { k: "++", label: "Leading", desc: "Unggul + akselerasi", cls: "text-emerald-400", activeCls: "bg-emerald-400/15 border-emerald-400/50" },
    { k: "-+", label: "Improving", desc: "Tertekuk tapi membaik", cls: "text-sky-400", activeCls: "bg-sky-400/15 border-sky-400/50" },
    { k: "--", label: "Lagging", desc: "Lemah + makin turun", cls: "text-red-400/80", activeCls: "bg-red-400/15 border-red-400/40" },
    { k: "+-", label: "Weakening", desc: "Masih unggul, momentum turun", cls: "text-amber-400", activeCls: "bg-amber-400/15 border-amber-400/50" },
  ];

  const handleCapture = useCallback(() => {
    // Re-draw the plot onto an offscreen canvas (deterministic, no DOM capture),
    // then trigger a PNG download.
    const W = 1000, H = 600;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const g = c.getContext("2d");
    if (!g) return;
    // background
    g.fillStyle = "#0a0b0b";
    g.fillRect(0, 0, W, H);
    // axis lines
    const mx = W / 2, my = H / 2;
    g.strokeStyle = "#242929";
    g.lineWidth = 1;
    g.beginPath(); g.moveTo(0, my); g.lineTo(W, my); g.moveTo(mx, 0); g.lineTo(mx, H); g.stroke();
    // axis captions
    g.fillStyle = "rgba(184,170,150,0.55)";
    g.font = "500 12px sans-serif";
    g.textAlign = "center";
    g.fillText("↑ RELATIVE MOMENTUM", mx, 22);
    g.textAlign = "right";
    g.fillText("RELATIVE STRENGTH →", W - 14, my - 10);
    // quadrant labels
    g.font = "600 13px sans-serif";
    g.textAlign = "left";
    g.fillStyle = "rgba(56,189,248,0.8)"; g.fillText("Improving", 14, 24);
    g.textAlign = "right";
    g.fillStyle = "rgba(52,211,153,0.8)"; g.fillText("Leading", W - 14, 24);
    g.textAlign = "left";
    g.fillStyle = "rgba(248,113,113,0.7)"; g.fillText("Lagging", 14, H - 14);
    g.textAlign = "right";
    g.fillStyle = "rgba(251,191,36,0.8)"; g.fillText("Weakening", W - 14, H - 14);
    // center + IHSG label
    g.fillStyle = "rgba(198,161,91,0.6)";
    g.beginPath(); g.arc(mx, my, 5, 0, Math.PI * 2); g.fill();
    g.textAlign = "center"; g.font = "500 11px sans-serif";
    g.fillText("IHSG", mx, my + 22);
    // pixel mapper (keep 50% ± 40%, like ns above)
    const px = (v: number) => mx + (v / scale) * (W * 0.40);
    const py = (v: number) => my - (v / scale) * (H * 0.40);
    // tails
    g.lineWidth = 2;
    g.lineJoin = "round"; g.lineCap = "round";
    for (const { pts } of series) {
      const trail = pts.slice(Math.max(0, pts.length - tail));
      if (trail.length < 2) continue;
      const head = trail[trail.length - 1];
      const q = quadInfo(head.rs, head.mom);
      g.strokeStyle = q.dot;
      g.globalAlpha = 0.5;
      g.beginPath();
      trail.forEach((p, i) => i === 0 ? g.moveTo(px(p.rs), py(p.mom)) : g.lineTo(px(p.rs), py(p.mom)));
      g.stroke();
    }
    g.globalAlpha = 1;
    // dots (head position only in capture — labels only in sectors mode for legibility)
    const showLabel = mode === "sectors";
    g.font = "600 10px mono";
    for (const { it, pts } of series) {
      const head = pts[pts.length - 1];
      const q = quadInfo(head.rs, head.mom);
      const x = px(head.rs), y = py(head.mom);
      g.fillStyle = q.dot;
      g.beginPath(); g.arc(x, y, 5, 0, Math.PI * 2); g.fill();
      if (showLabel) {
        g.globalAlpha = 0.9;
        g.fillStyle = "#9ba3a6";
        g.textAlign = "center";
        g.fillText(it.ticker, x, y + 18);
        g.globalAlpha = 1;
      }
    }
    // download
    c.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `idx-rotation-${mode}-${interval}.png`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    }, "image/png");
  }, [series, scale, tail, mode, interval]);

  // kelompokkan item per kuadran (head position) untuk tabel kanan
  const QUAD_ORDER: { k: string; label: string; cls: string }[] = [
    { k: "++", label: "Leading", cls: "text-emerald-400" },
    { k: "-+", label: "Improving", cls: "text-sky-400" },
    { k: "--", label: "Lagging", cls: "text-red-400/80" },
    { k: "+-", label: "Weakening", cls: "text-amber-400" },
  ];
  const quadBuckets = useMemo(() => {
    const map: Record<string, typeof series> = { "++": [], "-+": [], "--": [], "+-": [] };
    for (const s of series) {
      const h = s.pts[s.pts.length - 1];
      const k = (h.rs >= 0 ? "+" : "-") + (h.mom >= 0 ? "+" : "-");
      if (map[k]) map[k].push(s);
    }
    return map;
  }, [series]);

  return (
    <div className="card-luxury p-8">
      {/* header + toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="font-heading text-xl text-[#edf1f2] font-medium">
            IDX <span className="text-gold-gradient font-medium">Rotation</span>
          </h2>
          <p className="text-[10px] text-[#9ba3a6]/40 mt-1">
            Where money is rotating — relative strength (x) vs momentum (y). Benchmark = IHSG di crosshair.
          </p>
        </div>

        {/* toolbar */}
        <div className="flex flex-wrap items-center gap-4 text-[10px]">
          {/* mode toggle */}
          <div className="flex items-center gap-2">
            <span className="text-[#9ba3a6]/40 uppercase tracking-wider">Mode</span>
            <div className="flex border border-[#242929]">
              {(["sectors", "stocks"] as Mode[]).map((m) => (
                <button key={m} onClick={() => setMode(m)}
                  className={`px-3 py-1.5 uppercase tracking-wider transition-all ${
                    mode === m ? "bg-[#3f9e74]/20 text-[#3f9e74]" : "text-[#9ba3a6]/50 hover:text-[#9ba3a6]"
                  }`}>{m === "sectors" ? "Sectors" : "Stocks"}</button>
              ))}
            </div>
          </div>

          {/* interval toggle */}
          <div className="flex items-center gap-2">
            <span className="text-[#9ba3a6]/40 uppercase tracking-wider">Interval</span>
            <div className="flex border border-[#242929]">
              {(["daily", "weekly"] as Interval[]).map((iv) => (
                <button key={iv} onClick={() => setInterval(iv)}
                  className={`px-3 py-1.5 uppercase tracking-wider transition-all ${
                    interval === iv ? "bg-[#3f9e74]/20 text-[#3f9e74]" : "text-[#9ba3a6]/50 hover:text-[#9ba3a6]"
                  }`}>{iv === "daily" ? "Daily" : "Weekly"}</button>
              ))}
            </div>
          </div>

          {/* tail slider */}
          <div className="flex items-center gap-2">
            <span className="text-[#9ba3a6]/40 uppercase tracking-wider">Tail</span>
            <input type="range" min={1} max={maxTail} value={tail}
              onChange={(e) => setTail(Number(e.target.value))}
              className="w-24 accent-[#3f9e74]" />
            <span className="text-[#9ba3a6]/60 font-mono">{tail} period{tail > 1 ? "s" : ""}</span>
          </div>

          {/* capture button */}
          <button onClick={handleCapture}
            className="px-3 py-1.5 uppercase tracking-wider bg-[#3f9e74]/15 text-[#3f9e74] border border-[#3f9e74]/40 hover:bg-[#3f9e74]/25 transition-all">
            Capture
          </button>
        </div>
      </div>

      {/* legend / filter kuadran */}
      <div className="flex flex-wrap items-center gap-2 mb-3 text-[10px]">
        <span className="text-[#9ba3a6]/40 uppercase tracking-wider mr-1">Filter</span>
        <button onClick={() => setFilterQuad(null)}
          className={`px-2.5 py-1 border rounded-sm uppercase tracking-wider transition-all ${
            filterQuad === null ? "bg-[#3f9e74]/15 border-[#3f9e74]/50 text-[#3f9e74]" : "border-[#242929] text-[#9ba3a6]/50 hover:text-[#9ba3a6]"
          }`}>Semua</button>
        {QUAD_GUIDE.map((q) => (
          <button key={q.k} onClick={() => setFilterQuad(filterQuad === q.k ? null : q.k)}
            className={`px-2.5 py-1 border rounded-sm transition-all ${
              filterQuad === q.k ? q.activeCls : "border-[#242929] hover:border-[#9ba3a6]/30"
            }`}>
            <span className={q.cls}>{q.label}</span>
            <span className="text-[#9ba3a6]/40 ml-1">· {q.desc}</span>
          </button>
        ))}
      </div>

      {err ? (
        <EmptyState title="Gagal memuat" description="Tidak dapat mengambil data TradingView EOD. Coba lagi." />
      ) : !data ? (
        <div className="py-10 text-center text-[#9ba3a6]/40 text-xs">Memuat data…</div>
      ) : series.length === 0 ? (
        <EmptyState title="Tidak ada data" description="Belum ada data performa." />
      ) : (
        <div className="flex flex-col lg:flex-row gap-4">
          {/* plot kiri */}
          <div id="rotation-map-plot" className="flex-1 min-w-0">
          {/* chart */}
          <div className="relative aspect-[16/9] border border-[#242929] bg-[#0a0b0b]/70 overflow-hidden select-none" style={{ minHeight: 420 }}>
            {/* axis labels */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-[0.2em] text-[#9ba3a6]/40">↑ Relative Momentum</div>
            <div className="absolute top-1/2 right-2 -translate-y-1/2 text-[9px] uppercase tracking-[0.2em] text-[#9ba3a6]/40">Relative Strength →</div>
            {/* quadrant labels */}
            <div className="absolute top-2 left-3 text-[9px] uppercase tracking-[0.2em] text-sky-400/60">Improving</div>
            <div className="absolute top-2 right-3 text-[9px] uppercase tracking-[0.2em] text-emerald-400/60">Leading</div>
            <div className="absolute bottom-2 left-3 text-[9px] uppercase tracking-[0.2em] text-red-400/50">Lagging</div>
            <div className="absolute bottom-2 right-3 text-[9px] uppercase tracking-[0.2em] text-amber-400/60">Weakening</div>
            {/* crosshair */}
            <div className="absolute left-0 right-0 top-1/2 h-px bg-[#242929]" />
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-[#242929]" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#3f9e74]/60" />
            <div className="absolute left-1/2 top-[calc(50%+6px)] -translate-x-1/2 text-[8px] uppercase tracking-wider text-[#9ba3a6]/40 font-mono">IHSG</div>

            {/* tails SVG (under dots) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              {series.map(({ it, pts }) => {
                // ambil N titik terakhir (head + tail)
                const trail = pts.slice(Math.max(0, pts.length - tail));
                if (trail.length < 2) return null;
                const color = quadInfo(trail[trail.length - 1].rs, trail[trail.length - 1].mom).dot;
                const path = trail.map((p, i) => `${i === 0 ? "M" : "L"}${ns(p.rs).toFixed(2)},${(100 - ns(p.mom)).toFixed(2)}`).join(" ");
                return <path key={it.ticker} d={path} fill="none" stroke={color} strokeOpacity={0.5} strokeWidth="0.5" strokeLinejoin="round" strokeLinecap="round" />;
              })}
            </svg>

            {/* dots */}
            {series.map(({ it, pts }) => {
              const head = pts[pts.length - 1];
              const q = quadInfo(head.rs, head.mom);
              const x = ns(head.rs);
              const y = 100 - ns(head.mom);
              const isHover = hover === it.ticker;
              return (
                <button key={it.ticker}
                  onMouseEnter={() => setHover(it.ticker)}
                  onMouseLeave={() => setHover(null)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group z-10"
                  style={{ left: `${x}%`, top: `${y}%`, zIndex: isHover ? 20 : 10 }}
                  title={`${it.ticker} — RS ${head.rs >= 0 ? "+" : ""}${head.rs.toFixed(2)} · Mom ${head.mom >= 0 ? "+" : ""}${head.mom.toFixed(2)}`}>
                  <span className={`block w-2 h-2 rounded-full border ${isHover ? "scale-150 transition-transform" : ""}`}
                    style={{ backgroundColor: q.dot, borderColor: q.bd }} />
                  <span className={`absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] font-mono whitespace-nowrap ${isHover ? q.cls : "text-[#9ba3a6]/60"}`}>
                    {it.ticker}
                  </span>
                </button>
              );
            })}

            {/* hover tooltip */}
            {hover && (() => {
              const hit = series.find((s) => s.it.ticker === hover);
              if (!hit) return null;
              const head = hit.pts[hit.pts.length - 1];
              const q = quadInfo(head.rs, head.mom);
              return (
                <div className="absolute pointer-events-none z-30 bg-[#16130E]/95 border border-[#242929] px-3 py-2 text-[10px] font-mono" style={{ left: "50%", top: 8, transform: "translateX(-50%)" }}>
                  <div className={`font-sans font-medium ${q.cls}`}>{hit.it.ticker} <span className="text-[#9ba3a6]/40">· {hit.it.name}</span></div>
                  <div className="text-[#9ba3a6]/60">RS <span className="text-[#edf1f2]">{head.rs >= 0 ? "+" : ""}{head.rs.toFixed(2)}%</span></div>
                  <div className="text-[#9ba3a6]/60">Momentum <span className="text-[#edf1f2]">{head.mom >= 0 ? "+" : ""}{head.mom.toFixed(2)}%</span></div>
                  <div className="text-[#9ba3a6]/60">Fase <span className={q.cls}>{q.label}</span></div>
                </div>
              );
            })()}
          </div>
          {/* close plot flex-1 */}
          </div>

          {/* tabel detail — Fase | Sektor | Day | Week | Monthly | RS | Mom */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-[11px] font-mono">
              <thead>
                <tr className="text-[9px] uppercase tracking-wider text-[#9ba3a6]/40 border-b border-[#242929]">
                  <th className="text-left font-normal py-1.5 pl-1 pr-4 w-[12%]">Fase</th>
                  <th className="text-left font-normal py-1.5 pr-4 w-[30%]">Sektor</th>
                  <th className="text-right font-normal py-1.5 px-3">Day</th>
                  <th className="text-right font-normal py-1.5 px-3">Week</th>
                  <th className="text-right font-normal py-1.5 px-3">Monthly</th>
                  <th className="text-right font-normal py-1.5 px-3">RS</th>
                  <th className="text-right font-normal py-1.5 pr-1 pl-3">Mom</th>
                </tr>
              </thead>
              <tbody>
                {QUAD_ORDER.flatMap((qu) => {
                  const list = quadBuckets[qu.k]
                    .slice()
                    .sort((a, b) => { const ha = a.pts[a.pts.length - 1], hb = b.pts[b.pts.length - 1]; return hb.rs - ha.rs; });
                  if (list.length === 0) return null;
                  return list.map((s) => {
                    const h = s.pts[s.pts.length - 1];
                    const isDim = filterQuad !== null && filterQuad !== qu.k;
                    const isHover = hover === s.it.ticker;
                    // perf windows: 0=Day, 1=1W, 2=1M — throw of "Monthly" dari perf[index]
                    const txt = (v: number | null | undefined, bold = false) =>
                      v == null || !Number.isFinite(v as number)
                        ? <span className="text-[#9ba3a6]/20">—</span>
                        : (
                          <span className={`${bold && isHover ? "text-[#edf1f2]" : ""} ${(v as number) >= 0 ? "text-emerald-400/90" : "text-red-400/80"}`}>
                            {(v as number) >= 0 ? "+" : ""}{(v as number).toFixed((v as number) >= 0 && (v as number) < 10 ? 1 : 0)}%
                          </span>
                        );
                    return (
                      <tr key={s.it.ticker}
                        onMouseEnter={() => setHover(s.it.ticker)}
                        onMouseLeave={() => setHover(null)}
                        onClick={() => setFilterQuad(filterQuad === qu.k ? null : qu.k)}
                        className={`border-b border-[#242929]/60 cursor-pointer transition-colors ${
                          isDim ? "opacity-30" : "hover:bg-[#121414]"
                        }`}>
                        <td className="py-1.5 pl-1 pr-4 whitespace-nowrap">
                          <span className={`uppercase text-[9px] tracking-wider ${qu.cls}`}>● {qu.label}</span>
                        </td>
                        <td className="py-1.5 pr-4 whitespace-nowrap">
                          <span className={`font-sans font-medium text-[12px] ${isHover ? "text-[#edf1f2]" : "text-[#edf1f2]/90"}`}>{s.it.ticker}</span>
                          <span className="text-[#9ba3a6]/45 ml-2 font-sans">{s.it.name}</span>
                        </td>
                        <td className="py-1.5 px-3 text-right whitespace-nowrap">{txt(s.it.perf[0])}</td>
                        <td className="py-1.5 px-3 text-right whitespace-nowrap">{txt(s.it.perf[1])}</td>
                        <td className="py-1.5 px-3 text-right whitespace-nowrap">{txt(s.it.perf[2])}</td>
                        <td className="py-1.5 px-3 text-right whitespace-nowrap">{txt(h.rs, true)}</td>
                        <td className="py-1.5 pr-1 pl-3 text-right whitespace-nowrap">{txt(h.mom, true)}</td>
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}