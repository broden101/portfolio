"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/* ──────────────────────────────────────
   MACRO INDICATORS
   Update these values weekly/monthly
   ────────────────────────────────────── */
const macroIndicators = [
  { label: "IHSG", value: "6,127.38", change: "-33.2%", up: false, note: "vs 52wk high 9,174" },
  { label: "USD/IDR", value: "16,703", change: "", up: false, note: "BI, Nov 2025" },
  { label: "BI Rate", value: "5.25%", change: "Cut 25bps", up: true, note: "Mei 2026" },
  { label: "US 10Y", value: "4.475%", change: "+2bps", up: true, note: "Treasury yield" },
  { label: "EIDO", value: "$12.85", change: "+1.02%", up: true, note: "Near 52wk low $12.71" },
  { label: "Gold", value: "$4,350", change: "Elevated", up: true, note: "Safe haven — Iran crisis" },
  { label: "Brent Oil", value: "$95.34", change: "+4.63%", up: true, note: "Strait of Hormuz block" },
  { label: "Trade Bal", value: "$3.32B", change: "Surplus", up: true, note: "Mar 2026" },
];

/* ──────────────────────────────────────
   SECTOR PERFORMANCE (IDX sectors)
   ────────────────────────────────────── */
const sectors = [
  { name: "Finance", code: "FINANCE", day: -2.08, mtd: -7.1, ytd: -28.4, weight: 38.5, color: "#C6A15B" },
  { name: "Mining", code: "MINING", day: 6.28, mtd: -5.2, ytd: -18.5, weight: 15.0, color: "#D97706" },
  { name: "Energy", code: "ENERGY", day: 0.16, mtd: -8.2, ytd: -22.5, weight: 13.0, color: "#F97316" },
  { name: "Infrastructure", code: "INFRA", day: 0.35, mtd: -9.3, ytd: -30.2, weight: 12.0, color: "#3B82F6" },
  { name: "Technology", code: "TECH", day: 0.05, mtd: -4.8, ytd: -18.3, weight: 10.0, color: "#14B8A6" },
  { name: "Consumer", code: "CONSUMER", day: -1.01, mtd: -6.5, ytd: -25.8, weight: 8.5, color: "#22C55E" },
  { name: "Process Ind", code: "PROCESS", day: -2.62, mtd: -10.1, ytd: -35.6, weight: 7.5, color: "#A855F7" },
  { name: "Transport", code: "TRANSPORT", day: 0.35, mtd: -8.7, ytd: -32.1, weight: 3.0, color: "#6366F1" },
  { name: "Utilities", code: "UTILS", day: 20.44, mtd: 12.0, ytd: 8.5, weight: 2.5, color: "#3B82F6" },
  { name: "Healthcare", code: "HEALTH", day: -0.32, mtd: -7.6, ytd: -28.9, weight: 2.0, color: "#8B5CF6" },
];

/* ──────────────────────────────────────
   FOREIGN FLOW
   ────────────────────────────────────── */
const foreignFlow = {
  weekNet: 1240, // Miliar IDR — tradersaham: +Rp1.24T net foreign buy
  mtdNet: -3800,
  ytdNet: -52400,
  topBuy: [
    { ticker: "BBCA", net: 450 },
    { ticker: "BMRI", net: 312 },
    { ticker: "TLKM", net: 185 },
    { ticker: "BBRI", net: 142 },
    { ticker: "BBNI", net: 98 },
  ],
  topSell: [
    { ticker: "ADRO", net: -285 },
    { ticker: "MDKA", net: -198 },
    { ticker: "INDF", net: -156 },
    { ticker: "ANTM", net: -132 },
    { ticker: "PTBA", net: -108 },
  ],
};

/* ──────────────────────────────────────
   MARKET REGIME
   ────────────────────────────────────── */
const regime = {
  trend: "Strong Sell",
  trendColor: "text-red-400",
  breadth: "Bearish",
  breadthColor: "text-red-400",
  momentum: "Oversold (RSI 23.4)",
  momentumColor: "text-yellow-400",
  risk: "Risk-Off",
  riskColor: "text-red-400",
  volatility: "Tinggi (VIX elevated)",
  volatilityColor: "text-red-400",
  advancers: 142,
  decliners: 312,
  unchanged: 131,
};

/* ──────────────────────────────────────
   KEY LEVELS
   ────────────────────────────────────── */
const keyLevels = {
  support: [6631, 6305, 5408],
  resistance: [7528, 8099, 8996],
  current: 6127,
  ma50: 7071,
  ma200: 7950,
};

export default function IHSGDashboard() {
  const [activeTab, setActiveTab] = useState<"Day" | "MTD" | "YTD">("MTD");

  const fmtMiliar = (n: number) => {
    const abs = Math.abs(n);
    return `${n >= 0 ? "+" : "-"}Rp ${abs.toLocaleString("id-ID")}M`;
  };

  const getPerf = (s: (typeof sectors)[0]) => {
    if (activeTab === "Day") return s.day;
    if (activeTab === "MTD") return s.mtd;
    return s.ytd;
  };

  const sortedSectors = [...sectors].sort((a, b) => getPerf(b) - getPerf(a));

  return (
    <div className="min-h-screen bg-[#0B0B0A] pt-24 pb-20">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="w-10 h-px bg-[#C6A15B]/30" />
              <span className="text-[#C6A15B] text-xs tracking-[0.3em] uppercase font-medium">Market Playbook</span>
            </div>
            <h1 className="font-heading text-4xl md:text-5xl text-[#F4EFE6] font-light mb-2">
              IHSG <span className="text-gold-gradient font-medium">Macro Dashboard</span>
            </h1>
            <p className="text-[#B8AA96]/50 text-xs tracking-wider uppercase">
              Macro · Foreign Flow · Sector Rotation · Market Regime
            </p>
          </div>
          <div className="text-right">
            <div className="text-[#B8AA96]/30 text-[10px] tracking-[0.15em] uppercase mb-1">Last Updated</div>
            <div className="text-[#B8AA96]/60 text-sm font-mono">29 May 2026</div>
          </div>
        </div>

        {/* ─── MACRO INDICATORS BAR ─── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {macroIndicators.map((m) => (
            <div key={m.label} className="card-luxury p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase">{m.label}</span>
                <span className={`text-[10px] font-mono ${m.up ? "text-emerald-400" : "text-red-400"}`}>
                  {m.change}
                </span>
              </div>
              <div className="font-heading text-xl text-[#F4EFE6] font-medium">{m.value}</div>
              <div className="text-[#B8AA96]/30 text-[9px] mt-0.5">{m.note}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* ─── MARKET REGIME ─── */}
          <div className="card-luxury p-6">
            <h2 className="text-xs tracking-[0.2em] uppercase text-[#C6A15B] mb-5 font-medium">Market Regime</h2>
            <div className="space-y-4">
              {[
                { label: "Trend", value: regime.trend, color: regime.trendColor },
                { label: "Breadth", value: regime.breadth, color: regime.breadthColor },
                { label: "Momentum", value: regime.momentum, color: regime.momentumColor },
                { label: "Risk Appetite", value: regime.risk, color: regime.riskColor },
                { label: "Volatility", value: regime.volatility, color: regime.volatilityColor },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between border-b border-[#2C261E]/50 pb-3">
                  <span className="text-[#B8AA96]/50 text-[11px] tracking-wider uppercase">{r.label}</span>
                  <span className={`text-sm font-medium ${r.color}`}>{r.value}</span>
                </div>
              ))}
            </div>

            {/* Breadth bar */}
            <div className="mt-5 pt-4 border-t border-[#2C261E]">
              <div className="text-[#B8AA96]/40 text-[10px] tracking-[0.1em] uppercase mb-2">Market Breadth</div>
              <div className="flex items-center gap-1 h-5">
                <div className="h-full bg-emerald-400/60 rounded-l" style={{ width: `${(regime.advancers / (regime.advancers + regime.decliners + regime.unchanged)) * 100}%` }} />
                <div className="h-full bg-[#B8AA96]/20" style={{ width: `${(regime.unchanged / (regime.advancers + regime.decliners + regime.unchanged)) * 100}%` }} />
                <div className="h-full bg-red-400/60 rounded-r" style={{ width: `${(regime.decliners / (regime.advancers + regime.decliners + regime.unchanged)) * 100}%` }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-emerald-400 text-[9px] font-mono">{regime.advancers} ADV</span>
                <span className="text-[#B8AA96]/30 text-[9px] font-mono">{regime.unchanged} UNC</span>
                <span className="text-red-400 text-[9px] font-mono">{regime.decliners} DEC</span>
              </div>
            </div>
          </div>

          {/* ─── FOREIGN FLOW ─── */}
          <div className="card-luxury p-6">
            <h2 className="text-xs tracking-[0.2em] uppercase text-[#C6A15B] mb-5 font-medium">Foreign Flow</h2>

            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: "Week", value: foreignFlow.weekNet, color: foreignFlow.weekNet >= 0 ? "text-emerald-400" : "text-red-400" },
                { label: "MTD", value: foreignFlow.mtdNet, color: foreignFlow.mtdNet >= 0 ? "text-emerald-400" : "text-red-400" },
                { label: "YTD", value: foreignFlow.ytdNet, color: foreignFlow.ytdNet >= 0 ? "text-emerald-400" : "text-red-400" },
              ].map((f) => (
                <div key={f.label} className="border border-[#2C261E] p-3 text-center">
                  <div className="text-[#B8AA96]/40 text-[9px] tracking-[0.15em] uppercase mb-1">{f.label}</div>
                  <div className={`text-xs font-mono font-medium ${f.color}`}>{fmtMiliar(f.value)}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-emerald-400/70 text-[10px] tracking-[0.1em] uppercase mb-2">Top Net Buy</div>
                <div className="space-y-1.5">
                  {foreignFlow.topBuy.map((b) => (
                    <div key={b.ticker} className="flex justify-between items-center">
                      <span className="text-[#F4EFE6] text-xs font-mono">{b.ticker}</span>
                      <span className="text-emerald-400 text-[10px] font-mono">+{b.net}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-red-400/70 text-[10px] tracking-[0.1em] uppercase mb-2">Top Net Sell</div>
                <div className="space-y-1.5">
                  {foreignFlow.topSell.map((s) => (
                    <div key={s.ticker} className="flex justify-between items-center">
                      <span className="text-[#F4EFE6] text-xs font-mono">{s.ticker}</span>
                      <span className="text-red-400 text-[10px] font-mono">{s.net}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ─── KEY LEVELS ─── */}
          <div className="card-luxury p-6">
            <h2 className="text-xs tracking-[0.2em] uppercase text-[#C6A15B] mb-5 font-medium">IHSG Key Levels</h2>

            <div className="text-center py-4 mb-5 border border-[#2C261E] bg-[#0B0B0A]">
              <div className="text-[#B8AA96]/40 text-[10px] tracking-[0.15em] uppercase mb-1">IHSG Current</div>
              <div className="font-heading text-3xl text-[#C6A15B] font-medium">{keyLevels.current.toLocaleString()}</div>
            </div>

            {/* Price level ladder */}
            <div className="space-y-1.5">
              {keyLevels.resistance.map((r, i) => (
                <div key={`r-${i}`} className="flex items-center gap-3">
                  <span className="text-red-400/60 text-[10px] tracking-wider uppercase w-16">R{i + 1}</span>
                  <div className="flex-1 h-px bg-red-400/20" />
                  <span className="text-red-400 text-xs font-mono">{r.toLocaleString()}</span>
                </div>
              ))}

              {/* Current price marker */}
              <div className="flex items-center gap-3 py-1">
                <span className="text-[#C6A15B] text-[10px] tracking-wider uppercase w-16">NOW</span>
                <div className="flex-1 h-0.5 bg-[#C6A15B]/40" />
                <span className="text-[#C6A15B] text-xs font-mono font-medium">{keyLevels.current.toLocaleString()}</span>
              </div>

              {/* MA lines */}
              <div className="flex items-center gap-3">
                <span className="text-blue-400/60 text-[10px] tracking-wider uppercase w-16">MA50</span>
                <div className="flex-1 h-px bg-blue-400/20 border-dashed" />
                <span className="text-blue-400 text-xs font-mono">{keyLevels.ma50.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-purple-400/60 text-[10px] tracking-wider uppercase w-16">MA200</span>
                <div className="flex-1 h-px bg-purple-400/20" />
                <span className="text-purple-400 text-xs font-mono">{keyLevels.ma200.toLocaleString()}</span>
              </div>

              {keyLevels.support.map((s, i) => (
                <div key={`s-${i}`} className="flex items-center gap-3">
                  <span className="text-emerald-400/60 text-[10px] tracking-wider uppercase w-16">S{i + 1}</span>
                  <div className="flex-1 h-px bg-emerald-400/20" />
                  <span className="text-emerald-400 text-xs font-mono">{s.toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-[#2C261E]">
              <p className="text-[#B8AA96]/30 text-[9px] leading-relaxed">
                TradingView: MA Strong Sell (MA50 7,071, MA200 7,950). RSI 23.4 oversold. Pivot classic: S1 6,631, S2 6,305, R1 7,528. MACD -318 (sell). YTD -29.4%.
              </p>
            </div>
          </div>
        </div>

        {/* ─── SECTOR ROTATION HEATMAP ─── */}
        <div className="card-luxury p-8">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <h2 className="font-heading text-xl text-[#F4EFE6] font-medium">
              Sector <span className="text-gold-gradient font-medium">Rotation</span>
            </h2>
            <div className="flex items-center gap-1">
              {(["Day", "MTD", "YTD"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 text-xs tracking-[0.15em] uppercase font-medium transition-all ${
                    activeTab === tab
                      ? "bg-[#C6A15B]/15 text-[#C6A15B] border border-[#C6A15B]/30"
                      : "border border-[#2C261E] text-[#B8AA96]/50 hover:text-[#B8AA96]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Heatmap grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-6">
            {sortedSectors.map((s) => {
              const perf = getPerf(s);
              const intensity = Math.min(Math.abs(perf) / 15, 1);
              const bg =
                perf >= 0
                  ? `rgba(34, 197, 94, ${0.08 + intensity * 0.25})`
                  : `rgba(239, 68, 68, ${0.08 + intensity * 0.25})`;
              const borderColor =
                perf >= 0
                  ? `rgba(34, 197, 94, ${0.15 + intensity * 0.3})`
                  : `rgba(239, 68, 68, ${0.15 + intensity * 0.3})`;

              return (
                <div
                  key={s.code}
                  className="p-4 border transition-all hover:scale-[1.03]"
                  style={{ backgroundColor: bg, borderColor }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#F4EFE6] text-xs font-medium">{s.name}</span>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  </div>
                  <div className={`font-heading text-lg font-medium ${perf >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {perf >= 0 ? "+" : ""}{perf.toFixed(1)}%
                  </div>
                  <div className="text-[#B8AA96]/30 text-[9px] mt-0.5">Weight: {s.weight}%</div>
                </div>
              );
            })}
          </div>

          {/* Sector table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#2C261E]">
                  <th className="text-left text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase py-2 font-medium">Sektor</th>
                  <th className="text-right text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase py-2 font-medium">Day</th>
                  <th className="text-right text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase py-2 font-medium">MTD</th>
                  <th className="text-right text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase py-2 font-medium">YTD</th>
                  <th className="text-right text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase py-2 font-medium">Weight</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {sectors.map((s) => (
                  <tr key={s.code} className="border-b border-[#2C261E]/30">
                    <td className="py-2 text-[#F4EFE6] font-sans flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.name}
                    </td>
                    <td className={`py-2 text-right ${s.day >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {s.day >= 0 ? "+" : ""}{s.day.toFixed(2)}%
                    </td>
                    <td className={`py-2 text-right ${s.mtd >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {s.mtd >= 0 ? "+" : ""}{s.mtd.toFixed(1)}%
                    </td>
                    <td className={`py-2 text-right ${s.ytd >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {s.ytd >= 0 ? "+" : ""}{s.ytd.toFixed(1)}%
                    </td>
                    <td className="py-2 text-right text-[#B8AA96]/60">{s.weight}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── MARKET SUMMARY ─── */}
        <div className="card-luxury p-8 mt-8">
          <h2 className="font-heading text-xl text-[#F4EFE6] mb-4 font-medium">Market Summary</h2>
          <div className="space-y-3 text-sm text-[#B8AA96] font-light leading-relaxed">
            <p>
              <span className="text-[#F4EFE6] font-medium">Trend:</span> IHSG Strong Sell (TradingView). Diperdagangkan jauh di bawah MA50 (7,071) dan MA200 (7,950). RSI 23.4 = oversold territory. MACD -318 sell signal. YTD return -29.4%, 1Y return -15.2%.
            </p>
            <p>
              <span className="text-[#F4EFE6] font-medium">Foreign Flow:</span> Minggu ini asing net buy ({fmtMiliar(foreignFlow.weekNet)}), tapi YTD masih negatif besar ({fmtMiliar(foreignFlow.ytdNet)}). Akumulasi di big caps bank (BBCA, BMRI), distribusi di komoditas (ADRO, MDKA, ANTM).
            </p>
            <p>
              <span className="text-[#F4EFE6] font-medium">Sectors:</span> Mining melonjak +6.28% (Non-Energy Minerals), Utilities +20.44%. Finance -2.08%, Process Industries -2.62%. Konflik Iran mendongkrak komoditas dan energy.
            </p>
            <p>
              <span className="text-[#F4EFE6] font-medium">Risk:</span> Risk-off global. Brent oil $95 (Strait of Hormuz blockade), gold $4,350 (safe haven). BI Rate cut ke 5.25% (Mei 2026) — dovish. P/E IHSG 14.69x — murah secara historis tapi risiko downside masih besar.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
