"use client";

import { useState, useMemo, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { fetchTvQuote } from "@/lib/fundamentals";

interface BankData {
  ticker: string;
  name: string;
  price: number;
  bvps: number;
  netProfit: number; // triliun
  equity: number; // triliun
  color: string;
}

const INITIAL_BANKS: BankData[] = [
  { ticker: "BMRI", name: "Bank Mandiri", price: 7100, bvps: 2950, netProfit: 56.0, equity: 255.0, color: "#3B82F6" },
  { ticker: "BBRI", name: "Bank BRI", price: 4200, bvps: 1600, netProfit: 62.0, equity: 310.0, color: "#F97316" },
  { ticker: "BBCA", name: "Bank BCA", price: 9500, bvps: 2250, netProfit: 52.0, equity: 220.0, color: "#22C55E" },
];

const DEFAULT_COE = 12; // %
const DEFAULT_G = 8; // %

export default function PBVROEPage() {
  const [banks, setBanks] = useState(INITIAL_BANKS);
  const [coe, setCoe] = useState(DEFAULT_COE);
  const [g, setGrowth] = useState(DEFAULT_G);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next = [...banks];
      for (let i = 0; i < next.length; i++) {
        try {
          const q = await fetchTvQuote(next[i].ticker);
          if (!cancelled && q?.price) next[i] = { ...next[i], price: Math.round(q.price) };
        } catch {}
      }
      if (!cancelled) setBanks(next);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateBank = (idx: number, field: keyof BankData, value: number) => {
    setBanks((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const results = useMemo(() => {
    return banks.map((b) => {
      const pbv = b.price / b.bvps;
      const roe = (b.netProfit / b.equity) * 100;
      const spread = coe - g;
      const theoPBV = spread > 0 ? roe / spread : 0;
      const premiumDiscount = theoPBV > 0 ? ((pbv / theoPBV) - 1) * 100 : 0;
      const fairPrice = theoPBV * b.bvps;
      const upside = ((fairPrice / b.price) - 1) * 100;

      return {
        ...b,
        pbv,
        roe,
        theoPBV,
        premiumDiscount,
        fairPrice,
        upside,
      };
    });
  }, [banks, coe, g]);

  // PBV-ROE regression line points for chart
  const chartData = useMemo(() => {
    const roeMin = 5;
    const roeMax = 35;
    const spread = coe - g;
    const points = [];
    for (let r = roeMin; r <= roeMax; r += 1) {
      points.push({ roe: r, pbv: spread > 0 ? r / spread : 0 });
    }
    return points;
  }, [coe, g]);

  const maxPBV = Math.max(...results.map((r) => Math.max(r.pbv, r.theoPBV)), 5);
  const maxROE = 35;

  const fmt = (n: number, d = 2) => n.toLocaleString("id-ID", { maximumFractionDigits: d });
  const fmtIDR = (n: number) => `Rp ${fmt(n, 0)}`;

  return (
    <div className="min-h-screen bg-[#0B0B0A] pt-24 pb-20">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-10 h-px bg-[#C6A15B]/30" />
            <span className="text-[#C6A15B] text-xs tracking-[0.3em] uppercase font-medium">Valuation Lab</span>
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-[#F4EFE6] font-light mb-2">
            PBV-ROE <span className="text-gold-gradient font-medium">Banking Valuation</span>
          </h1>
          <p className="text-[#B8AA96]/60 text-sm font-light">
            Fair value framework — BMRI vs BBRI vs BBCA. PBV = ROE / (COE − g).
          </p>
        </div>

        {/* Assumptions */}
        <div className="card-luxury p-6 mb-8">
          <h3 className="text-xs tracking-[0.2em] uppercase text-[#C6A15B] mb-4 font-medium">Key Assumptions</h3>
          <div className="flex flex-wrap gap-6">
            <div>
              <label className="block text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase mb-1.5">COE (%)</label>
              <input
                type="number"
                value={coe}
                onChange={(e) => setCoe(parseFloat(e.target.value) || 0)}
                className="w-24 bg-[#0B0B0A] border border-[#2C261E] px-3 py-2 text-[#F4EFE6] text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase mb-1.5">Terminal Growth (%)</label>
              <input
                type="number"
                value={g}
                onChange={(e) => setGrowth(parseFloat(e.target.value) || 0)}
                className="w-24 bg-[#0B0B0A] border border-[#2C261E] px-3 py-2 text-[#F4EFE6] text-sm font-mono"
              />
            </div>
            <div className="flex items-end">
              <span className="text-[#B8AA96]/30 text-[10px] tracking-[0.1em] uppercase">
                Spread = {coe - g}% → Theoretical PBV = ROE / {coe - g}
              </span>
            </div>
          </div>
        </div>

        {/* Bank Input Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {banks.map((bank, i) => (
            <div key={bank.ticker} className="card-luxury p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: bank.color }} />
                <div>
                  <div className="font-heading text-lg text-[#F4EFE6] font-medium">{bank.ticker}</div>
                  <div className="text-[#B8AA96]/40 text-[10px] tracking-[0.1em] uppercase">{bank.name}</div>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Harga (Rp)", field: "price" as const, val: bank.price },
                  { label: "BVPS (Rp)", field: "bvps" as const, val: bank.bvps },
                  { label: "Laba Bersih (T)", field: "netProfit" as const, val: bank.netProfit },
                  { label: "Ekuitas (T)", field: "equity" as const, val: bank.equity },
                ].map((inp) => (
                  <div key={inp.field}>
                    <label className="block text-[#B8AA96]/40 text-[10px] tracking-[0.1em] uppercase mb-1">{inp.label}</label>
                    <input
                      type="number"
                      value={inp.val}
                      onChange={(e) => updateBank(i, inp.field, parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#0B0B0A] border border-[#2C261E] px-3 py-2 text-[#F4EFE6] text-sm font-mono"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Results Table */}
        <div className="card-luxury p-8 mb-8">
          <h2 className="font-heading text-xl text-[#F4EFE6] mb-6 font-medium">Hasil Valuasi</h2>

          {/* Summary Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {results.map((r) => (
              <div key={r.ticker} className="border border-[#2C261E] p-5 text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                  <span className="font-heading text-base text-[#F4EFE6] font-medium">{r.ticker}</span>
                </div>
                <div className="text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase mb-1">Fair Value</div>
                <div className="font-heading text-2xl text-[#C6A15B] font-medium mb-1">{fmtIDR(r.fairPrice)}</div>
                <div className={`text-xs font-mono ${r.upside >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {r.upside >= 0 ? "↑" : "↓"} {fmt(Math.abs(r.upside))}% {r.upside >= 0 ? "upside" : "downside"}
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Metrics */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2C261E]">
                  <th className="text-left text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase py-3 font-medium">Metric</th>
                  {results.map((r) => (
                    <th key={r.ticker} className="text-right text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase py-3 font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: r.color }} />
                        {r.ticker}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-mono text-xs">
                {[
                  { label: "Harga", values: results.map((r) => fmtIDR(r.price)) },
                  { label: "BVPS", values: results.map((r) => fmtIDR(r.bvps)) },
                  { label: "PBV (Actual)", values: results.map((r) => `${fmt(r.pbv)}x`) },
                  { label: "ROE", values: results.map((r) => `${fmt(r.roe)}%`) },
                  { label: "Theo PBV (ROE / Spread)", values: results.map((r) => `${fmt(r.theoPBV)}x`) },
                  { label: "Premium / Discount", values: results.map((r) => (
                    <span key={r.ticker} className={r.premiumDiscount > 0 ? "text-red-400" : "text-emerald-400"}>
                      {r.premiumDiscount > 0 ? "+" : ""}{fmt(r.premiumDiscount)}%
                    </span>
                  ))},
                  { label: "Fair Value (Theo PBV × BVPS)", values: results.map((r) => fmtIDR(r.fairPrice)) },
                  { label: "Upside / Downside", values: results.map((r) => (
                    <span key={r.ticker} className={r.upside >= 0 ? "text-emerald-400" : "text-red-400"}>
                      {r.upside >= 0 ? "+" : ""}{fmt(r.upside)}%
                    </span>
                  ))},
                ].map((row) => (
                  <tr key={row.label} className="border-b border-[#2C261E]/50">
                    <td className="py-3 text-[#B8AA96]/60 text-[11px] font-sans">{row.label}</td>
                    {row.values.map((v, i) => (
                      <td key={i} className="py-3 text-right text-[#F4EFE6]">{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PBV vs ROE Visual Chart */}
        <div className="card-luxury p-8 mb-8">
          <h2 className="font-heading text-xl text-[#F4EFE6] mb-2 font-medium">PBV vs ROE Scatter</h2>
          <p className="text-[#B8AA96]/40 text-xs mb-6">Garis diagonal = theoretical fair value line (PBV = ROE / {coe - g}%)</p>

          <div className="relative" style={{ height: 360 }}>
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-right pr-2">
              {[...Array(6)].map((_, i) => {
                const val = maxPBV - (i * maxPBV) / 5;
                return (
                  <span key={i} className="text-[#B8AA96]/30 text-[9px] font-mono">{fmt(val, 1)}x</span>
                );
              })}
            </div>

            {/* Chart area */}
            <div className="absolute left-14 right-0 top-0 bottom-8 border-l border-b border-[#2C261E]">
              {/* Grid lines */}
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 border-t border-[#2C261E]/30"
                  style={{ top: `${(i + 1) * 20}%` }}
                />
              ))}

              {/* Fair value line (diagonal) */}
              {coe - g > 0 && (
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                  <line
                    x1="0%"
                    y1="100%"
                    x2={`${(maxROE / maxPBV) * ((maxPBV / (coe - g)) * 100 / maxROE)}%`}
                    y2="0%"
                    stroke="#C6A15B"
                    strokeWidth="1"
                    strokeDasharray="6 4"
                    opacity="0.4"
                  />
                  {/* Simplified: draw line from bottom-left to where roe=max maps to pbv=roe/spread */}
                  <line
                    x1="0%"
                    y1="100%"
                    x2={`${Math.min(100, (maxROE / maxROE) * 100)}%`}
                    y2={`${Math.max(0, 100 - ((maxROE / (coe - g)) / maxPBV) * 100)}%`}
                    stroke="#C6A15B"
                    strokeWidth="1"
                    strokeDasharray="6 4"
                    opacity="0.4"
                  />
                </svg>
              )}

              {/* Bank dots */}
              {results.map((r) => {
                const x = (r.roe / maxROE) * 100;
                const y = 100 - (r.pbv / maxPBV) * 100;
                return (
                  <div
                    key={r.ticker}
                    className="absolute group"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-full border-2 transition-transform group-hover:scale-150"
                      style={{ borderColor: r.color, backgroundColor: `${r.color}33` }}
                    />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <span className="text-[10px] font-mono font-medium" style={{ color: r.color }}>
                        {r.ticker}
                      </span>
                      <span className="text-[#B8AA96]/40 text-[9px] ml-1">
                        PBV {fmt(r.pbv)}x / ROE {fmt(r.roe)}%
                      </span>
                    </div>
                    {/* Fair value dot */}
                    <div
                      className="absolute w-3 h-3 rounded-full border opacity-40"
                      style={{
                        borderColor: r.color,
                        left: 0,
                        top: `${(r.pbv - r.theoPBV) / maxPBV * -100}%`,
                        transform: "translate(-25%, -25%)",
                      }}
                      title={`Fair PBV: ${fmt(r.theoPBV)}x`}
                    />
                  </div>
                );
              })}
            </div>

            {/* X-axis labels */}
            <div className="absolute left-14 right-0 bottom-0 flex justify-between">
              {[0, 10, 20, 30].map((v) => (
                <span key={v} className="text-[#B8AA96]/30 text-[9px] font-mono">{v}%</span>
              ))}
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-[-20px] text-[#B8AA96]/30 text-[9px] tracking-[0.15em] uppercase">
              ROE
            </div>
          </div>
        </div>

        {/* Conclusion */}
        <div className="card-luxury p-8">
          <h2 className="font-heading text-xl text-[#F4EFE6] mb-4 font-medium">Kesimpulan</h2>
          <div className="space-y-3 text-sm text-[#B8AA96] font-light leading-relaxed">
            {results.map((r) => {
              const status =
                r.premiumDiscount > 20
                  ? "overvalued signifikan"
                  : r.premiumDiscount > 0
                  ? "sedikit premium"
                  : r.premiumDiscount > -10
                  ? "sekitar fair value"
                  : "undervalued";
              return (
                <div key={r.ticker} className="flex items-start gap-3 border-b border-[#2C261E]/50 pb-3">
                  <div className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: r.color }} />
                  <div>
                    <span className="text-[#F4EFE6] font-medium">{r.ticker}</span>{" "}
                    <span className={r.premiumDiscount > 0 ? "text-red-400" : "text-emerald-400"}>
                      {r.premiumDiscount > 0 ? "+" : ""}{fmt(r.premiumDiscount)}% premium
                    </span>{" "}
                    ke Theo PBV → {status}.{" "}
                    {r.upside >= 0 ? (
                      <span className="text-emerald-400">Upside {fmt(r.upside)}% ke fair value {fmtIDR(r.fairPrice)}</span>
                    ) : (
                      <span className="text-red-400">Downside {fmt(Math.abs(r.upside))}% dari fair value {fmtIDR(r.fairPrice)}</span>
                    )}
                    .
                  </div>
                </div>
              );
            })}
            <p className="text-[#B8AA96]/40 text-xs pt-2">
              * Model PBV = ROE / (COE − g). Asumsi COE {coe}% dan growth {g}% bisa disesuaikan di atas. Data default bersifat estimasi — gunakan data real-time untuk analisis aktual.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
