"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
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

// Satu sumber kebenaran buat kuadran — dipakai chips, tabel, plot, capture.
type QuadKey = "++" | "-+" | "--" | "+-";
type QuadMeta = { k: QuadKey; label: string; desc: string; cls: string; dot: string; bd: string };

const QUAD_META: QuadMeta[] = [
  { k: "++", label: "Leading",   desc: "Unggul + akselerasi",          cls: "text-emerald-400", dot: "rgba(52,211,153,0.9)",  bd: "rgba(52,211,153,0.6)" },
  { k: "-+", label: "Improving", desc: "Tertekuk tapi membaik",        cls: "text-sky-400",     dot: "rgba(56,189,248,0.9)",  bd: "rgba(56,189,248,0.6)" },
  { k: "--", label: "Lagging",   desc: "Lemah + makin turun",          cls: "text-red-400/80",  dot: "rgba(248,113,113,0.75)", bd: "rgba(248,113,113,0.5)" },
  { k: "+-", label: "Weakening", desc: "Masih unggul, momentum turun", cls: "text-amber-400",   dot: "rgba(251,191,36,0.85)", bd: "rgba(251,191,36,0.6)" },
];

const quadKey = (rs: number, mom: number): QuadKey =>
  ((rs >= 0 ? "+" : "-") + (mom >= 0 ? "+" : "-")) as QuadKey;
const quadOf = (rs: number, mom: number): QuadMeta => QUAD_META.find((q) => q.k === quadKey(rs, mom))!;

// Label pendek biar plot gak penuh — "IDXFINANCE" → "FINANCE".
const shortLabel = (ticker: string, m: Mode) => (m === "sectors" ? ticker.replace(/^IDX/, "") : ticker);

/* ── small UI atoms ─────────────────────────────────────────────── */

function Segmented<T extends string>({
  value, onChange, options,
}: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="flex items-center rounded-full border border-[#242929] bg-[#121414] p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-wider transition-colors ${
            value === o.value
              ? "bg-[#3f9e74]/20 text-[#3f9e74]"
              : "text-[#9ba3a6]/55 hover:text-[#edf1f2]"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function QuadChip({
  meta, count, active, onClick,
}: { meta: QuadMeta | null; count: number; active: boolean; onClick: () => void }) {
  const base =
    "group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-wider transition-all";
  if (!meta) {
    return (
      <button
        onClick={onClick}
        className={`${base} ${
          active ? "border-[#3f9e74]/50 bg-[#3f9e74]/15 text-[#3f9e74]" : "border-[#242929] text-[#9ba3a6]/55 hover:text-[#edf1f2]"
        }`}
      >
        Semua
        <span className="font-mono text-[9px] opacity-60">{count}</span>
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      title={meta.desc}
      className={`${base} ${active ? "bg-[#121414]" : "hover:border-[#9ba3a6]/30"}`}
      style={{ borderColor: active ? meta.bd : undefined }}
    >
      <span className="text-[8px] leading-none" style={{ color: meta.dot }}>
        ●
      </span>
      <span className={meta.cls}>{meta.label}</span>
      <span className="font-mono text-[9px] text-[#9ba3a6]/50">{count}</span>
    </button>
  );
}

/* ── panel ──────────────────────────────────────────────────────── */

export function RotationMapPanel() {
  const [data, setData] = useState<ApiResp | null>(null);
  const [mode, setMode] = useState<Mode>("sectors");
  const [interval, setInterval] = useState<Interval>("daily");
  const [tail, setTail] = useState(3);
  const [err, setErr] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const [filterQuad, setFilterQuad] = useState<QuadKey | null>(null); // null = semua

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
  const maxTail = winIdx.length;

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

  // kelompokkan per kuadran (posisi head) — dipakai chips + tabel
  const buckets = useMemo(() => {
    const map: Record<QuadKey, typeof series> = { "++": [], "-+": [], "--": [], "+-": [] };
    for (const s of series) {
      const h = s.pts[0];
      map[quadKey(h.rs, h.mom)].push(s);
    }
    return map;
  }, [series]);

  const visibleCount = filterQuad === null ? series.length : buckets[filterQuad].length;

  // ukuran plot (buat penempatan label anti-tumpuk)
  const plotRef = useRef<HTMLDivElement | null>(null);
  const [plot, setPlot] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = plotRef.current;
    if (!el) return;
    const measure = () => setPlot({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [data, mode, interval, err]);

  // greedy label placement: hindari label lain DAN titik lain (ladder vertikal panjang)
  const labelLayout = useMemo(() => {
    const out: Record<string, { dy: number; text: string }> = {};
    if (mode !== "sectors" || plot.w === 0) return out;
    const placed: { x0: number; x1: number; y0: number; y1: number }[] = [];
    const visible = series.filter(
      (s) => filterQuad === null || quadKey(s.pts[0].rs, s.pts[0].mom) === filterQuad,
    );
    // titik dulu — label gak boleh nimpa dot mana pun
    for (const s of visible) {
      const h = s.pts[0];
      const dx = (ns(h.rs) / 100) * plot.w;
      const dy = ((100 - ns(h.mom)) / 100) * plot.h;
      placed.push({ x0: dx - 6, x1: dx + 6, y0: dy - 6, y1: dy + 6 });
    }
    const LH = 10, PAD = 2;
    const CANDS: number[] = [];
    for (let k = 1; k <= 8; k++) { CANDS.push(-10 * k); CANDS.push(10 * k); }
    for (const s of [...visible].sort((a, b) => b.pts[0].rs - a.pts[0].rs)) {
      const h = s.pts[0];
      const x = (ns(h.rs) / 100) * plot.w;
      const y = ((100 - ns(h.mom)) / 100) * plot.h;
      const text = shortLabel(s.it.ticker, mode);
      const w = text.length * 4.8 + 6;
      let chosen = CANDS[0];
      for (const dy of CANDS) {
        const cy = Math.min(plot.h - LH / 2, Math.max(LH / 2, y + dy));
        const box = { x0: x - w / 2 - PAD, x1: x + w / 2 + PAD, y0: cy - LH / 2 - PAD, y1: cy + LH / 2 + PAD };
        if (!placed.some((p) => box.x0 < p.x1 && box.x1 > p.x0 && box.y0 < p.y1 && box.y1 > p.y0)) {
          chosen = dy;
          placed.push(box);
          break;
        }
        chosen = dy;
      }
      out[s.it.ticker] = { dy: chosen, text };
    }
    return out;
  }, [series, plot, mode, filterQuad, scale]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCapture = useCallback(() => {
    // Re-draw the plot onto an offscreen canvas (deterministic, no DOM capture),
    // then trigger a PNG download.
    const W = 1000, H = 620;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const g = c.getContext("2d");
    if (!g) return;
    g.fillStyle = "#0a0b0b";
    g.fillRect(0, 0, W, H);

    const mx = W / 2, my = H / 2;
    const tint = (x: number, y: number, w: number, h: number, rgb: string) => {
      g.fillStyle = rgb;
      g.fillRect(x, y, w, h);
    };
    // quadrant tints (matching the on-screen grid)
    tint(0, 0, mx, my, "rgba(56,189,248,0.035)");        // Improving
    tint(mx, 0, mx, my, "rgba(52,211,153,0.035)");       // Leading
    tint(0, my, mx, my, "rgba(248,113,113,0.03)");       // Lagging
    tint(mx, my, mx, my, "rgba(251,191,36,0.03)");       // Weakening
    // crosshair
    g.strokeStyle = "#242929";
    g.lineWidth = 1;
    g.beginPath(); g.moveTo(0, my); g.lineTo(W, my); g.moveTo(mx, 0); g.lineTo(mx, H); g.stroke();
    // title
    g.textAlign = "left";
    g.fillStyle = "#edf1f2";
    g.font = "600 20px system-ui, sans-serif";
    g.fillText(`IDX Rotation · ${mode === "sectors" ? "Sectors" : "Stocks"}`, 28, 40);
    g.fillStyle = "rgba(155,163,166,0.75)";
    g.font = "400 13px system-ui, sans-serif";
    g.fillText(`${interval === "daily" ? "Daily" : "Weekly"} · tail ${tail} · benchmark IHSG`, 28, 62);
    g.fillStyle = "rgba(155,163,166,0.5)";
    g.font = "400 11px ui-monospace, monospace";
    g.textAlign = "right";
    g.fillText(
      new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" }) + " WIB",
      W - 28, 40,
    );
    g.textAlign = "left";
    // axis captions
    g.fillStyle = "rgba(155,163,166,0.5)";
    g.font = "500 11px system-ui, sans-serif";
    g.textAlign = "center";
    g.fillText("RELATIVE MOMENTUM", mx, H - 18);
    g.save();
    g.translate(18, my);
    g.rotate(-Math.PI / 2);
    g.fillText("RELATIVE STRENGTH", 0, 0);
    g.restore();
    // quadrant labels
    g.font = "600 13px system-ui, sans-serif";
    g.textAlign = "left";  g.fillStyle = "rgba(56,189,248,0.85)";  g.fillText("IMPROVING", 20, 90);
    g.textAlign = "right"; g.fillStyle = "rgba(52,211,153,0.85)";  g.fillText("LEADING", W - 20, 90);
    g.textAlign = "left";  g.fillStyle = "rgba(248,113,113,0.7)";  g.fillText("LAGGING", 20, H - 60);
    g.textAlign = "right"; g.fillStyle = "rgba(251,191,36,0.85)";  g.fillText("WEAKENING", W - 20, H - 60);
    // IHSG origin
    g.fillStyle = "rgba(63,158,116,0.75)";
    g.beginPath(); g.arc(mx, my, 4, 0, Math.PI * 2); g.fill();
    g.textAlign = "center"; g.font = "500 10px system-ui, sans-serif";
    g.fillStyle = "rgba(155,163,166,0.6)";
    g.fillText("IHSG", mx, my + 20);
    // pixel mapper (same 50% ± 40% as on-screen)
    const px = (v: number) => mx + (v / scale) * (W * 0.40);
    const py = (v: number) => my - (v / scale) * (H * 0.40);
    // tails (active filter only)
    g.lineWidth = 2;
    g.lineJoin = "round"; g.lineCap = "round";
    for (const { pts } of series) {
      const head = pts[0];
      if (filterQuad !== null && quadKey(head.rs, head.mom) !== filterQuad) continue;
      const trail = pts.slice(0, tail);
      if (trail.length < 2) continue;
      g.strokeStyle = quadOf(head.rs, head.mom).dot;
      g.globalAlpha = 0.5;
      g.beginPath();
      trail.forEach((p, i) => i === 0 ? g.moveTo(px(p.rs), py(p.mom)) : g.lineTo(px(p.rs), py(p.mom)));
      g.stroke();
    }
    g.globalAlpha = 1;
    // head dots — label mengikuti layout anti-tumpuk yang sama dengan layar
    const showLabel = mode === "sectors";
    const yScale = plot.h > 0 ? H / plot.h : 1;
    g.font = "600 11px ui-monospace, monospace";
    for (const { it, pts } of series) {
      const head = pts[0];
      if (filterQuad !== null && quadKey(head.rs, head.mom) !== filterQuad) continue;
      const q = quadOf(head.rs, head.mom);
      const x = px(head.rs), y = py(head.mom);
      g.fillStyle = q.dot;
      g.strokeStyle = q.bd;
      g.lineWidth = 1.5;
      g.beginPath(); g.arc(x, y, 5, 0, Math.PI * 2); g.fill(); g.stroke();
      if (showLabel) {
        const lay = labelLayout[it.ticker];
        const ly = y + (lay ? lay.dy * yScale : 20);
        g.textAlign = "center";
        g.fillStyle = "rgba(10,11,11,0.75)";
        g.fillText(lay ? lay.text : it.ticker, x, ly + 1);
        g.fillStyle = "rgba(237,241,242,0.85)";
        g.fillText(lay ? lay.text : it.ticker, x, ly);
      }
    }
    c.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `idx-rotation-${mode}-${interval}.png`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    }, "image/png");
  }, [series, scale, tail, mode, interval, filterQuad, labelLayout, plot.h]);

  const fmt = (v: number | null | undefined) => {
    if (v == null || !Number.isFinite(v)) return <span className="text-[#9ba3a6]/25">—</span>;
    return (
      <span className={v >= 0 ? "text-emerald-400/90" : "text-red-400/80"}>
        {v >= 0 ? "+" : ""}{Math.abs(v) < 10 ? v.toFixed(1) : v.toFixed(0)}%
      </span>
    );
  };

  return (
    <section className="card-luxury p-5 sm:p-7">
      {/* ── header + toolbar ── */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <h2 className="font-heading text-xl font-medium text-[#edf1f2]">
            IDX <span className="text-gold-gradient font-medium">Rotation</span>
          </h2>
          <p className="mt-1 text-[11px] leading-relaxed text-[#9ba3a6]/50">
            Rotasi uang antar sektor — relatif terhadap IHSG.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            value={mode}
            onChange={(m) => { setMode(m); setHover(null); }}
            options={[
              { value: "sectors" as Mode, label: "Sector" },
              { value: "stocks" as Mode, label: "Saham" },
            ]}
          />
          <Segmented
            value={interval}
            onChange={(iv) => { setInterval(iv); setTail((t) => Math.min(t, INTERVAL_WINDOWS[iv].length)); }}
            options={[
              { value: "daily" as Interval, label: "Harian" },
              { value: "weekly" as Interval, label: "Mingguan" },
            ]}
          />

          {/* tail slider */}
          <div className="flex items-center gap-2 rounded-full border border-[#242929] bg-[#121414] px-3 py-1">
            <span className="text-[10px] uppercase tracking-wider text-[#9ba3a6]/45">Tail</span>
            <input
              type="range" min={1} max={maxTail} value={tail}
              onChange={(e) => setTail(Number(e.target.value))}
              className="h-1 w-20 cursor-pointer accent-[#3f9e74]"
            />
            <span className="w-3 font-mono text-[10px] text-[#9ba3a6]/70">{tail}</span>
          </div>

          <button
            onClick={handleCapture}
            title="Unduh plot sebagai PNG"
            className="rounded-full border border-[#3f9e74]/40 bg-[#3f9e74]/15 px-3.5 py-1.5 text-[10px] uppercase tracking-wider text-[#3f9e74] transition-colors hover:bg-[#3f9e74]/25"
          >
            PNG
          </button>
        </div>
      </div>

      {/* ── filter chips (sekalian legend) ── */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <QuadChip meta={null} count={series.length} active={filterQuad === null} onClick={() => setFilterQuad(null)} />
        {QUAD_META.map((q) => (
          <QuadChip
            key={q.k}
            meta={q}
            count={buckets[q.k].length}
            active={filterQuad === q.k}
            onClick={() => setFilterQuad(filterQuad === q.k ? null : q.k)}
          />
        ))}
        {filterQuad !== null && (
          <span className="ml-1 font-mono text-[10px] text-[#9ba3a6]/45">
            {visibleCount}/{series.length} tampil
          </span>
        )}
      </div>

      {err ? (
        <EmptyState title="Gagal memuat" description="Tidak dapat mengambil data TradingView EOD. Coba lagi." />
      ) : !data ? (
        <div className="py-12 text-center text-xs text-[#9ba3a6]/40">Memuat data…</div>
      ) : series.length === 0 ? (
        <EmptyState title="Tidak ada data" description="Belum ada data performa." />
      ) : (
        <>
          {/* ── plot ── */}
          <div ref={plotRef} className="relative mt-4 h-[420px] overflow-hidden rounded-sm border border-[#242929] bg-[#0a0b0b] select-none sm:h-[500px]">
            {/* quadrant tints */}
            <div className="pointer-events-none absolute inset-0 grid grid-cols-2 grid-rows-2">
              <div className="bg-sky-400/[0.035]" />
              <div className="bg-emerald-400/[0.035]" />
              <div className="bg-red-400/[0.03]" />
              <div className="bg-amber-400/[0.03]" />
            </div>
            {/* crosshair */}
            <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-px bg-[#242929]" />
            <div className="pointer-events-none absolute bottom-0 top-0 left-1/2 w-px bg-[#242929]" />
            {/* corner labels */}
            <div className="pointer-events-none absolute left-3 top-2 text-[9px] font-medium uppercase tracking-[0.18em] text-sky-400/50">Improving</div>
            <div className="pointer-events-none absolute right-3 top-2 text-[9px] font-medium uppercase tracking-[0.18em] text-emerald-400/50">Leading</div>
            <div className="pointer-events-none absolute bottom-2 left-3 text-[9px] font-medium uppercase tracking-[0.18em] text-red-400/40">Lagging</div>
            <div className="pointer-events-none absolute bottom-2 right-3 text-[9px] font-medium uppercase tracking-[0.18em] text-amber-400/50">Weakening</div>
            {/* axis captions */}
            <div className="pointer-events-none absolute left-1/2 top-1 -translate-x-1/2 text-[8px] uppercase tracking-[0.2em] text-[#9ba3a6]/30">
              momentum ↑
            </div>
            <div className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] uppercase tracking-[0.2em] text-[#9ba3a6]/30 [writing-mode:vertical-rl]">
              kekuatan relatif →
            </div>
            {/* IHSG origin */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#3f9e74]/60" />
            <div className="pointer-events-none absolute left-1/2 top-[calc(50%+7px)] -translate-x-1/2 font-mono text-[8px] uppercase tracking-wider text-[#9ba3a6]/35">
              IHSG
            </div>

            {/* tails */}
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {series.map(({ it, pts }) => {
                const head = pts[0];
                if (filterQuad !== null && quadKey(head.rs, head.mom) !== filterQuad) return null;
                const trail = pts.slice(0, tail);
                if (trail.length < 2) return null;
                const d = trail.map((p, i) => `${i === 0 ? "M" : "L"}${ns(p.rs).toFixed(2)},${(100 - ns(p.mom)).toFixed(2)}`).join(" ");
                return (
                  <path
                    key={it.ticker} d={d} fill="none"
                    stroke={quadOf(head.rs, head.mom).dot}
                    strokeOpacity={hover === null || hover === it.ticker ? 0.55 : 0.15}
                    strokeWidth="0.5" strokeLinejoin="round" strokeLinecap="round"
                  />
                );
              })}
            </svg>

            {/* dots */}
            {series.map(({ it, pts }) => {
              const head = pts[0];
              if (filterQuad !== null && quadKey(head.rs, head.mom) !== filterQuad) return null;
              const q = quadOf(head.rs, head.mom);
              const isHover = hover === it.ticker;
              return (
                <button
                  key={it.ticker}
                  onMouseEnter={() => setHover(it.ticker)}
                  onMouseLeave={() => setHover(null)}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${ns(head.rs)}%`, top: `${100 - ns(head.mom)}%`, zIndex: isHover ? 30 : 10 }}
                  title={`${it.ticker} — RS ${head.rs >= 0 ? "+" : ""}${head.rs.toFixed(2)} · Mom ${head.mom >= 0 ? "+" : ""}${head.mom.toFixed(2)}`}
                >
                  <span
                    className={`block rounded-full border transition-transform ${isHover ? "h-3 w-3" : "h-2 w-2"}`}
                    style={{ backgroundColor: q.dot, borderColor: q.bd }}
                  />
                </button>
              );
            })}

            {/* label layer — posisi dihitung anti-tumpuk, gak nangkep klik */}
            <div className="pointer-events-none absolute inset-0">
              {series.map(({ it, pts }) => {
                const head = pts[0];
                if (filterQuad !== null && quadKey(head.rs, head.mom) !== filterQuad) return null;
                const isHover = hover === it.ticker;
                if (mode === "stocks" && !isHover) return null;
                const lay = labelLayout[it.ticker];
                if (mode === "sectors" && !lay) return null;
                const q = quadOf(head.rs, head.mom);
                return (
                  <span
                    key={it.ticker}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-mono leading-none ${
                      isHover ? `z-20 ${q.cls}` : "text-[#9ba3a6]/55"
                    } ${mode === "stocks" ? "rounded-sm bg-[#0a0b0b]/80 px-1 text-[9px]" : "text-[8px]"}`}
                    style={{
                      left: `${ns(head.rs)}%`,
                      top: `calc(${100 - ns(head.mom)}% + ${lay ? lay.dy : -10}px)`,
                    }}
                  >
                    {lay ? lay.text : it.ticker}
                  </span>
                );
              })}
            </div>

            {/* scale readout */}
            <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 font-mono text-[9px] text-[#9ba3a6]/30">
              skala ±{scale.toFixed(1)}%
            </div>

            {/* hover tooltip */}
            {hover && (() => {
              const hit = series.find((s) => s.it.ticker === hover);
              if (!hit) return null;
              const head = hit.pts[0];
              const q = quadOf(head.rs, head.mom);
              return (
                <div className="pointer-events-none absolute left-1/2 top-8 z-40 min-w-[170px] -translate-x-1/2 rounded-sm border border-[#242929] bg-[#121414]/95 px-3 py-2 font-mono text-[10px] backdrop-blur">
                  <div className={`font-sans text-[11px] font-medium ${q.cls}`}>
                    {hit.it.ticker} <span className="text-[#9ba3a6]/40">· {hit.it.name}</span>
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5">
                    <span className="text-[#9ba3a6]/50">RS</span>
                    <span className="text-right text-[#edf1f2]">{head.rs >= 0 ? "+" : ""}{head.rs.toFixed(2)}%</span>
                    <span className="text-[#9ba3a6]/50">Momentum</span>
                    <span className="text-right text-[#edf1f2]">{head.mom >= 0 ? "+" : ""}{head.mom.toFixed(2)}%</span>
                    <span className="text-[#9ba3a6]/50">Fase</span>
                    <span className={`text-right ${q.cls}`}>{q.label}</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* ── tabel detail, dikelompokkan per kuadran ── */}
          <div className="mt-4 overflow-x-auto rounded-sm border border-[#242929]">
            <table className="w-full min-w-[540px] border-collapse font-mono text-[11px]">
              <thead>
                <tr className="border-b border-[#242929] bg-[#121414] text-[9px] uppercase tracking-wider text-[#9ba3a6]/45">
                  <th className="py-2 pl-3 pr-4 text-left font-normal">Sektor</th>
                  <th className="px-3 py-2 text-right font-normal" title={`Excess return vs IHSG · ${WINDOW_LABEL[winIdx[0]]}`}>{WINDOW_LABEL[winIdx[0]]}</th>
                  <th className="px-3 py-2 text-right font-normal" title={`Excess return vs IHSG · ${WINDOW_LABEL[winIdx[1]]}`}>{WINDOW_LABEL[winIdx[1]]}</th>
                  <th className="px-3 py-2 text-right font-normal" title={`Excess return vs IHSG · ${WINDOW_LABEL[winIdx[2]]}`}>{WINDOW_LABEL[winIdx[2]]}</th>
                  <th className="px-3 py-2 text-right font-normal">RS</th>
                  <th className="py-2 pl-3 pr-3 text-right font-normal">Mom</th>
                </tr>
              </thead>
              <tbody>
                {QUAD_META.map((qu) => {
                  const list = buckets[qu.k].slice().sort((a, b) => b.pts[0].rs - a.pts[0].rs);
                  if (list.length === 0) return null;
                  const isDim = filterQuad !== null && filterQuad !== qu.k;
                  const excess = (s: { it: ApiItem }, wi: number): number | null => {
                    const v = s.it.perf?.[wi];
                    const b = bench?.[wi];
                    if (v == null || b == null || !Number.isFinite(v) || !Number.isFinite(b)) return null;
                    return v - b;
                  };
                  return (
                    <Fragment key={qu.k}>
                      {/* header grup kuadran */}
                      <tr className={`border-b border-[#242929]/70 ${isDim ? "opacity-35" : ""}`}>
                        <td colSpan={6} className="bg-[#121414]/60 py-1.5 pl-3 pr-3">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="text-[8px] leading-none" style={{ color: qu.dot }}>●</span>
                            <span className={`text-[9px] uppercase tracking-[0.15em] ${qu.cls}`}>{qu.label}</span>
                            <span className="ml-1 font-mono text-[9px] text-[#9ba3a6]/40">{list.length}</span>
                            <span className="ml-2 hidden text-[9px] text-[#9ba3a6]/30 sm:inline">{qu.desc}</span>
                          </span>
                        </td>
                      </tr>
                      {list.map((s) => {
                        const h = s.pts[0];
                        const isHover = hover === s.it.ticker;
                        return (
                          <tr
                            key={s.it.ticker}
                            onMouseEnter={() => setHover(s.it.ticker)}
                            onMouseLeave={() => setHover(null)}
                            className={`border-b border-[#242929]/40 border-l-2 transition-colors ${
                              isDim ? "opacity-35" : ""
                            } ${isHover ? "bg-[#121414]" : "hover:bg-[#121414]/60"}`}
                            style={{ borderLeftColor: qu.bd }}
                          >
                            <td className="py-1.5 pl-3 pr-4">
                              <span className={`font-sans text-[12px] font-medium ${isHover ? "text-[#edf1f2]" : "text-[#edf1f2]/90"}`}>
                                {s.it.ticker}
                              </span>
                              {s.it.name && s.it.name !== s.it.ticker && (
                                <span className="ml-2 font-sans text-[10px] text-[#9ba3a6]/40">{s.it.name}</span>
                              )}
                            </td>
                            <td className="px-3 py-1.5 text-right">{fmt(excess(s, winIdx[0]))}</td>
                            <td className="px-3 py-1.5 text-right">{fmt(excess(s, winIdx[1]))}</td>
                            <td className="px-3 py-1.5 text-right">{fmt(excess(s, winIdx[2]))}</td>
                            <td className={`px-3 py-1.5 text-right ${isHover ? "text-[#edf1f2]" : ""}`}>{fmt(h.rs)}</td>
                            <td className={`py-1.5 pl-3 pr-3 text-right ${isHover ? "text-[#edf1f2]" : ""}`}>{fmt(h.mom)}</td>
                          </tr>
                        );
                      })}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-[10px] leading-relaxed text-[#9ba3a6]/35">
            RS = return {mode === "sectors" ? "sektor" : "saham"} − return IHSG pada window terbaru. Mom = perubahan RS vs window sebelumnya.
            Kolom {WINDOW_LABEL[winIdx[0]]}/{WINDOW_LABEL[winIdx[1]]}/{WINDOW_LABEL[winIdx[2]]} = excess return vs IHSG. Kuadran & tabel saling tersinkron — hover untuk menyorot.
          </p>
        </>
      )}
    </section>
  );
}
