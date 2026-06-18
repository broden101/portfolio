"use client";

import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/* ─── IHSG Preset Templates ─── */
interface Preset {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  baseRevenue: number; // T
  ebitMargin: number; // %
  capexPct: number; // % of revenue
  daPct: number; // % of revenue
  wcPct: number; // % of revenue change
  shares: number; // Miliar lembar
  netDebt: number; // T (negative = net cash)
  taxRate: number;
  growthRates: number[]; // Y1-Y5 %
  wacc: number;
  terminalGrowth: number;
}

const PRESETS: Preset[] = [
  {
    ticker: "BBCA", name: "Bank BCA", sector: "Banking",
    price: 9500, baseRevenue: 96.0, ebitMargin: 65, capexPct: 1.5,
    daPct: 3, wcPct: 5, shares: 12400, netDebt: -120, taxRate: 22,
    growthRates: [12, 11, 10, 9, 8], wacc: 11, terminalGrowth: 5,
  },
  {
    ticker: "BMRI", name: "Bank Mandiri", sector: "Banking",
    price: 7100, baseRevenue: 120.0, ebitMargin: 62, capexPct: 2,
    daPct: 3.5, wcPct: 5, shares: 4650, netDebt: -95, taxRate: 22,
    growthRates: [13, 12, 11, 10, 9], wacc: 11.5, terminalGrowth: 5,
  },
  {
    ticker: "BBRI", name: "Bank BRI", sector: "Banking",
    price: 4200, baseRevenue: 170.0, ebitMargin: 58, capexPct: 2.5,
    daPct: 4, wcPct: 6, shares: 15200, netDebt: -80, taxRate: 22,
    growthRates: [14, 13, 12, 11, 10], wacc: 12, terminalGrowth: 5,
  },
  {
    ticker: "TLKM", name: "Telkom Indonesia", sector: "Telecom",
    price: 2650, baseRevenue: 148.0, ebitMargin: 32, capexPct: 18,
    daPct: 14, wcPct: 2, shares: 99000, netDebt: 65, taxRate: 22,
    growthRates: [8, 7, 7, 6, 6], wacc: 10.5, terminalGrowth: 5,
  },
  {
    ticker: "ASII", name: "Astra International", sector: "Conglomerate",
    price: 5400, baseRevenue: 310.0, ebitMargin: 14, capexPct: 5,
    daPct: 5, wcPct: 3, shares: 40500, netDebt: 35, taxRate: 22,
    growthRates: [10, 9, 8, 7, 6], wacc: 12, terminalGrowth: 5,
  },
  {
    ticker: "UNVR", name: "Unilever Indonesia", sector: "Consumer",
    price: 3800, baseRevenue: 46.0, ebitMargin: 22, capexPct: 3,
    daPct: 4, wcPct: 1, shares: 3800, netDebt: -8, taxRate: 22,
    growthRates: [6, 6, 5, 5, 5], wacc: 10.5, terminalGrowth: 4.5,
  },
  {
    ticker: "CUSTOM", name: "Custom", sector: "-",
    price: 0, baseRevenue: 0, ebitMargin: 25, capexPct: 5,
    daPct: 5, wcPct: 3, shares: 1000, netDebt: 0, taxRate: 22,
    growthRates: [10, 10, 8, 8, 6], wacc: 12, terminalGrowth: 5,
  },
];

/* ─── Helpers ─── */
const fmt = (n: number, d = 2) => n.toLocaleString("id-ID", { maximumFractionDigits: d });
const fmtIDR = (n: number) => `Rp ${fmt(n, 0)}`;
const fmtPct = (n: number) => `${fmt(n, 1)}%`;
const fmtT = (n: number) => `${fmt(n, 1)} T`;

/* ─── Component ─── */
export default function DCFPage() {
  // Preset
  const [presetIdx, setPresetIdx] = useState(0);
  const preset = PRESETS[presetIdx];

  // Core inputs
  const [ticker, setTicker] = useState(preset.ticker);
  const [currentPrice, setCurrentPrice] = useState(preset.price);
  const [baseRevenue, setBaseRevenue] = useState(preset.baseRevenue);
  const [ebitMargin, setEbitMargin] = useState(preset.ebitMargin);
  const [capexPct, setCapexPct] = useState(capexPct_default(preset));
  const [daPct, setDaPct] = useState(preset.daPct);
  const [wcPct, setWcPct] = useState(preset.wcPct);
  const [shares, setShares] = useState(preset.shares);
  const [netDebt, setNetDebt] = useState(preset.netDebt);
  const [taxRate, setTaxRate] = useState(preset.taxRate);
  const [wacc, setWacc] = useState(preset.wacc);
  const [terminalGrowth, setTerminalGrowth] = useState(preset.terminalGrowth);
  const [g1, setG1] = useState(preset.growthRates[0]);
  const [g2, setG2] = useState(preset.growthRates[1]);
  const [g3, setG3] = useState(preset.growthRates[2]);
  const [g4, setG4] = useState(preset.growthRates[3]);
  const [g5, setG5] = useState(preset.growthRates[4]);

  const applyPreset = (idx: number) => {
    const p = PRESETS[idx];
    setPresetIdx(idx);
    setTicker(p.ticker);
    setCurrentPrice(p.price);
    setBaseRevenue(p.baseRevenue);
    setEbitMargin(p.ebitMargin);
    setCapexPct(p.capexPct);
    setDaPct(p.daPct);
    setWcPct(p.wcPct);
    setShares(p.shares);
    setNetDebt(p.netDebt);
    setTaxRate(p.taxRate);
    setWacc(p.wacc);
    setTerminalGrowth(p.terminalGrowth);
    setG1(p.growthRates[0]); setG2(p.growthRates[1]); setG3(p.growthRates[2]);
    setG4(p.growthRates[3]); setG5(p.growthRates[4]);
  };

  // ─── DCF Calculation ───
  const dcf = useMemo(() => {
    const rates = [g1, g2, g3, g4, g5];
    const years: {
      year: number; revenue: number; growth: number;
      ebit: number; nopat: number; da: number; capex: number; wc: number;
      fcff: number; pv: number;
    }[] = [];

    let prevRev = baseRevenue;
    let prevWC = baseRevenue * (wcPct / 100);
    let sumPV = 0;

    for (let i = 0; i < 5; i++) {
      const growth = rates[i] / 100;
      const revenue = prevRev * (1 + growth);
      const ebit = revenue * (ebitMargin / 100);
      const nopat = ebit * (1 - taxRate / 100);
      const da = revenue * (daPct / 100);
      const capex = revenue * (capexPct / 100);
      const wc = revenue * (wcPct / 100);
      const deltaWC = wc - prevWC;
      const fcff = nopat + da - capex - deltaWC;
      const discFactor = Math.pow(1 + wacc / 100, i + 1);
      const pv = fcff / discFactor;
      sumPV += pv;

      years.push({ year: i + 1, revenue, growth: rates[i], ebit, nopat, da, capex, wc: deltaWC, fcff, pv });
      prevRev = revenue;
      prevWC = wc;
    }

    // Terminal Value (Gordon Growth)
    const lastFCFF = years[4].fcff;
    const terminalFCFF = lastFCFF * (1 + terminalGrowth / 100);
    const waccDecimal = wacc / 100;
    const tgDecimal = terminalGrowth / 100;
    const spread = waccDecimal - tgDecimal;
    const terminalValue = spread > 0 ? terminalFCFF / spread : 0;
    const pvTerminal = terminalValue / Math.pow(1 + waccDecimal, 5);

    // Enterprise & Equity Value
    const enterpriseValue = sumPV + pvTerminal;
    const equityValue = enterpriseValue - netDebt;
    const fairValuePerShare = shares > 0 ? (equityValue * 1e12) / (shares * 1e9) : 0; // T to Rp, Miliar shares
    const upside = currentPrice > 0 ? ((fairValuePerShare / currentPrice) - 1) * 100 : 0;
    const tvPct = enterpriseValue > 0 ? (pvTerminal / enterpriseValue) * 100 : 0;

    return { years, sumPV, terminalValue, pvTerminal, enterpriseValue, equityValue, fairValuePerShare, upside, tvPct, spread };
  }, [baseRevenue, ebitMargin, capexPct, daPct, wcPct, shares, netDebt, taxRate, wacc, terminalGrowth, g1, g2, g3, g4, g5, currentPrice]);

  // ─── Sensitivity Matrix ───
  const sensitivity = useMemo(() => {
    const waccRange = [wacc - 2, wacc - 1, wacc, wacc + 1, wacc + 2];
    const tgRange = [terminalGrowth - 1.5, terminalGrowth - 0.5, terminalGrowth, terminalGrowth + 0.5, terminalGrowth + 1.5];
    const matrix: number[][] = [];

    const rates = [g1, g2, g3, g4, g5];

    for (const w of waccRange) {
      const row: number[] = [];
      for (const tg of tgRange) {
        let prevRev = baseRevenue;
        let prevWC = baseRevenue * (wcPct / 100);
        let sumPV = 0;
        for (let i = 0; i < 5; i++) {
          const rev = prevRev * (1 + rates[i] / 100);
          const ebit = rev * (ebitMargin / 100);
          const nopat = ebit * (1 - taxRate / 100);
          const da = rev * (daPct / 100);
          const capex = rev * (capexPct / 100);
          const wc = rev * (wcPct / 100);
          const fcff = nopat + da - capex - (wc - prevWC);
          sumPV += fcff / Math.pow(1 + w / 100, i + 1);
          prevRev = rev;
          prevWC = wc;
        }
        const lastFCFF = prevRev * (1 + rates[4] / 100) * (ebitMargin / 100) * (1 - taxRate / 100) + prevRev * (1 + rates[4] / 100) * (daPct / 100 - capexPct / 100 - wcPct / 100);
        const tvSpread = w / 100 - tg / 100;
        const tv = tvSpread > 0 ? (lastFCFF * (1 + tg / 100)) / tvSpread : 0;
        const pvTV = tv / Math.pow(1 + w / 100, 5);
        const ev = sumPV + pvTV;
        const eq = ev - netDebt;
        const fv = shares > 0 ? (eq * 1e12) / (shares * 1e9) : 0;
        row.push(fv);
      }
      matrix.push(row);
    }
    return { waccRange, tgRange, matrix };
  }, [baseRevenue, ebitMargin, capexPct, daPct, wcPct, shares, netDebt, taxRate, wacc, terminalGrowth, g1, g2, g3, g4, g5]);

  // ─── Bar chart scaling ───
  const maxFCFF = Math.max(...dcf.years.map((y) => Math.abs(y.fcff)), Math.abs(dcf.pvTerminal), 1);

  const verdict = dcf.upside > 20 ? "UNDERVALUED" : dcf.upside < -20 ? "OVERVALUED" : "FAIR VALUE";
  const verdictColor = dcf.upside > 20 ? "#22C55E" : dcf.upside < -20 ? "#EF4444" : "#FACC15";

  return (
    <div className="min-h-screen bg-[#0B0B0A] pt-24 pb-20">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-10 h-px bg-[#C6A15B]/30" />
            <span className="text-[#C6A15B] text-xs tracking-[0.3em] uppercase font-medium">DCF Model</span>
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-[#F4EFE6] font-light mb-3">
            Discounted <span className="text-gold-gradient font-medium">Cash Flow</span>
          </h1>
          <p className="text-[#B8AA96]/60 text-sm font-light max-w-xl">
            FCFF-based intrinsic value estimation with editable 5-year projections, terminal value, and WACC sensitivity analysis for IDX stocks.
          </p>
        </div>

        {/* Preset Selector */}
        <div className="card-luxury p-6 mb-8">
          <p className="text-[#B8AA96]/60 text-xs tracking-[0.15em] uppercase mb-4">Quick Start — IHSG Presets</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p, i) => (
              <button
                key={p.ticker}
                onClick={() => applyPreset(i)}
                className={`px-4 py-2 text-sm border transition-all ${
                  presetIdx === i
                    ? "border-[#C6A15B] text-[#C6A15B] bg-[#C6A15B]/10"
                    : "border-[#2C261E] text-[#B8AA96]/50 hover:border-[#C6A15B]/30 hover:text-[#B8AA96]"
                }`}
              >
                {p.ticker === "CUSTOM" ? "✦ Custom" : p.ticker}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* ─── Left: Inputs ─── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Info */}
            <div className="card-luxury p-6">
              <h3 className="font-heading text-lg text-[#F4EFE6] mb-5 font-medium">Company & Market Data</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <InputField label="Ticker" value={ticker} onChange={setTicker} suffix="IDX" type="text" />
                <InputField label="Harga Saham" value={currentPrice} onChange={setCurrentPrice} prefix="Rp" />
                <InputField label="Shares Outstanding" value={shares} onChange={setShares} suffix="Miliar" />
              </div>
            </div>

            {/* Revenue & Margins */}
            <div className="card-luxury p-6">
              <h3 className="font-heading text-lg text-[#F4EFE6] mb-5 font-medium">Revenue & Profitability</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <InputField label="Base Revenue (FY Latest)" value={baseRevenue} onChange={setBaseRevenue} suffix="T" />
                <InputField label="EBIT Margin" value={ebitMargin} onChange={setEbitMargin} suffix="%" />
                <InputField label="Capex / Revenue" value={capexPct} onChange={setCapexPct} suffix="%" />
                <InputField label="D&A / Revenue" value={daPct} onChange={setDaPct} suffix="%" />
                <InputField label="Δ Working Capital / Revenue" value={wcPct} onChange={setWcPct} suffix="%" />
                <InputField label="Effective Tax Rate" value={taxRate} onChange={setTaxRate} suffix="%" />
              </div>
            </div>

            {/* Growth Rates */}
            <div className="card-luxury p-6">
              <h3 className="font-heading text-lg text-[#F4EFE6] mb-5 font-medium">Revenue Growth Projections</h3>
              <div className="grid grid-cols-5 gap-3">
                <InputField label="Year 1" value={g1} onChange={setG1} suffix="%" />
                <InputField label="Year 2" value={g2} onChange={setG2} suffix="%" />
                <InputField label="Year 3" value={g3} onChange={setG3} suffix="%" />
                <InputField label="Year 4" value={g4} onChange={setG4} suffix="%" />
                <InputField label="Year 5" value={g5} onChange={setG5} suffix="%" />
              </div>
            </div>

            {/* WACC & Terminal */}
            <div className="card-luxury p-6">
              <h3 className="font-heading text-lg text-[#F4EFE6] mb-5 font-medium">Discount Rate & Terminal Value</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <InputField label="WACC" value={wacc} onChange={setWacc} suffix="%" />
                <InputField label="Terminal Growth Rate" value={terminalGrowth} onChange={setTerminalGrowth} suffix="%" />
                <InputField label="Net Debt (neg = net cash)" value={netDebt} onChange={setNetDebt} suffix="T" />
              </div>
              <p className="text-[#B8AA96]/30 text-[10px] mt-3">WACC spread: {fmtPct(wacc - terminalGrowth)}. Terminal growth harus &lt; WACC.</p>
            </div>
          </div>

          {/* ─── Right: Results Summary ─── */}
          <div className="space-y-6">
            {/* Verdict */}
            <div className="card-luxury p-6 text-center">
              <p className="text-[#B8AA96]/40 text-[10px] tracking-[0.2em] uppercase mb-2">{ticker === "CUSTOM" ? "Custom" : `IDX:${ticker}`}</p>
              <div className="text-4xl font-heading font-medium mb-1" style={{ color: verdictColor }}>
                {fmtIDR(Math.round(dcf.fairValuePerShare))}
              </div>
              <p className="text-[#B8AA96]/50 text-xs mb-4">Fair Value / Share</p>
              <div className="flex justify-center gap-6 text-sm">
                <div>
                  <p className="text-[#B8AA96]/40 text-[10px] uppercase">Current</p>
                  <p className="text-[#F4EFE6] font-medium">{fmtIDR(currentPrice)}</p>
                </div>
                <div>
                  <p className="text-[#B8AA96]/40 text-[10px] uppercase">Upside</p>
                  <p className="font-medium" style={{ color: verdictColor }}>{fmtPct(dcf.upside)}</p>
                </div>
              </div>
              <div className="mt-4 py-2 px-4 border text-xs tracking-[0.15em] uppercase font-medium inline-block" style={{ borderColor: verdictColor, color: verdictColor }}>
                {verdict}
              </div>
            </div>

            {/* Value Breakdown */}
            <div className="card-luxury p-6">
              <h3 className="font-heading text-lg text-[#F4EFE6] mb-4 font-medium">Value Breakdown</h3>
              <div className="space-y-3 text-sm">
                <BreakdownRow label="PV of FCFF (Y1–Y5)" value={fmtT(dcf.sumPV)} />
                <BreakdownRow label="Terminal Value" value={fmtT(dcf.terminalValue)} />
                <BreakdownRow label="PV of Terminal" value={fmtT(dcf.pvTerminal)} />
                <div className="border-t border-[#2C261E] my-2" />
                <BreakdownRow label="Enterprise Value" value={fmtT(dcf.enterpriseValue)} highlight />
                <BreakdownRow label="− Net Debt" value={fmtT(netDebt)} />
                <div className="border-t border-[#2C261E] my-2" />
                <BreakdownRow label="Equity Value" value={fmtT(dcf.equityValue)} highlight />
                <BreakdownRow label="Terminal % of EV" value={fmtPct(dcf.tvPct)} />
                <BreakdownRow label="Shares Outstanding" value={`${fmt(shares, 0)} Miliar`} />
              </div>
            </div>

            {/* Methodology note */}
            <div className="card-luxury p-5">
              <p className="text-[#B8AA96]/30 text-[10px] leading-relaxed">
                <strong className="text-[#B8AA96]/50">Methodology:</strong> FCFF = NOPAT + D&A − Capex − ΔWC.
                Terminal Value via Gordon Growth Model. Enterprise Value = Σ PV(FCFF) + PV(TV). Equity Value = EV − Net Debt.
                All figures in IDR Triliun unless noted.
              </p>
            </div>
          </div>
        </div>

        {/* ─── FCFF Projection Chart ─── */}
        <div className="card-luxury p-8 mt-8">
          <h3 className="font-heading text-lg text-[#F4EFE6] mb-6 font-medium">5-Year FCFF Projection</h3>
          <div className="flex items-end gap-4 h-48">
            {dcf.years.map((y) => {
              const heightPct = maxFCFF > 0 ? (Math.abs(y.fcff) / maxFCFF) * 100 : 0;
              const isNeg = y.fcff < 0;
              return (
                <div key={y.year} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[10px] text-[#B8AA96]/50">{fmtT(y.fcff)}</span>
                  <div className="w-full flex justify-center" style={{ height: "140px", alignItems: "flex-end" }}>
                    <div
                      className="w-full max-w-[80px] transition-all duration-500"
                      style={{
                        height: `${Math.max(heightPct, 4)}%`,
                        background: isNeg
                          ? "linear-gradient(to top, #EF4444, #FCA5A5)"
                          : "linear-gradient(to top, #C6A15B, #D4B76A)",
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-[#B8AA96]/40">Y{y.year}</span>
                  <span className="text-[9px] text-[#B8AA96]/25">{fmtPct(y.growth)} rev growth</span>
                </div>
              );
            })}
            {/* Terminal bar */}
            <div className="flex-1 flex flex-col items-center gap-2">
              <span className="text-[10px] text-[#B8AA96]/50">{fmtT(dcf.pvTerminal)}</span>
              <div className="w-full flex justify-center" style={{ height: "140px", alignItems: "flex-end" }}>
                <div
                  className="w-full max-w-[80px] transition-all duration-500 opacity-70"
                  style={{
                    height: `${Math.max((dcf.pvTerminal / maxFCFF) * 100, 4)}%`,
                    background: "linear-gradient(to top, #8B5CF6, #A78BFA)",
                  }}
                />
              </div>
              <span className="text-[10px] text-[#B8AA96]/40">TV</span>
              <span className="text-[9px] text-[#B8AA96]/25">terminal</span>
            </div>
          </div>
        </div>

        {/* ─── Detailed Projections Table ─── */}
        <div className="card-luxury p-8 mt-8 overflow-x-auto">
          <h3 className="font-heading text-lg text-[#F4EFE6] mb-6 font-medium">Detailed Year-by-Year Projections</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2C261E]">
                <th className="text-left text-[#B8AA96]/40 text-[10px] tracking-[0.1em] uppercase py-2 pr-4">Metric</th>
                {dcf.years.map((y) => (
                  <th key={y.year} className="text-right text-[#B8AA96]/40 text-[10px] tracking-[0.1em] uppercase py-2 px-2">Y{y.year}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-[#B8AA96]/70">
              <TableRow label="Revenue" values={dcf.years.map((y) => fmtT(y.revenue))} />
              <TableRow label="Growth %" values={dcf.years.map((y) => fmtPct(y.growth))} />
              <TableRow label="EBIT" values={dcf.years.map((y) => fmtT(y.ebit))} />
              <TableRow label="NOPAT" values={dcf.years.map((y) => fmtT(y.nopat))} />
              <TableRow label="(+) D&A" values={dcf.years.map((y) => fmtT(y.da))} />
              <TableRow label="(−) Capex" values={dcf.years.map((y) => fmtT(y.capex))} />
              <TableRow label="(−) ΔWC" values={dcf.years.map((y) => fmtT(y.wc))} />
              <tr className="border-t border-[#2C261E]">
                <td className="py-2 pr-4 text-[#C6A15B] font-medium">FCFF</td>
                {dcf.years.map((y) => (
                  <td key={y.year} className="text-right py-2 px-2 text-[#C6A15B] font-medium">{fmtT(y.fcff)}</td>
                ))}
              </tr>
              <TableRow label="PV(FCFF)" values={dcf.years.map((y) => fmtT(y.pv))} />
            </tbody>
          </table>
        </div>

        {/* ─── Sensitivity Matrix ─── */}
        <div className="card-luxury p-8 mt-8 overflow-x-auto">
          <h3 className="font-heading text-lg text-[#F4EFE6] mb-2 font-medium">Sensitivity Analysis</h3>
          <p className="text-[#B8AA96]/40 text-xs mb-6">Fair value per share (Rp) at varying WACC and terminal growth rates</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2C261E]">
                <th className="text-left text-[#B8AA96]/40 text-[10px] tracking-[0.1em] uppercase py-2 pr-4">WACC ↓ / TG →</th>
                {sensitivity.tgRange.map((tg) => (
                  <th key={tg} className="text-right text-[#B8AA96]/40 text-[10px] tracking-[0.1em] uppercase py-2 px-2">
                    {fmtPct(tg)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sensitivity.matrix.map((row, wi) => (
                <tr key={wi} className="border-b border-[#2C261E]/50">
                  <td className="py-2 pr-4 text-[#B8AA96]/60 font-medium text-xs">{fmtPct(sensitivity.waccRange[wi])}</td>
                  {row.map((fv, ti) => {
                    const isBase = sensitivity.waccRange[wi] === wacc && sensitivity.tgRange[ti] === terminalGrowth;
                    const color = fv > currentPrice * 1.1 ? "text-[#22C55E]" : fv < currentPrice * 0.9 ? "text-[#EF4444]" : "text-[#FACC15]";
                    return (
                      <td key={ti} className={`text-right py-2 px-2 font-mono text-xs ${isBase ? "text-[#C6A15B] font-bold bg-[#C6A15B]/5" : color}`}>
                        {fmt(Math.round(fv), 0)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[#B8AA96]/25 text-[10px] mt-3">Highlighted cell = base case WACC/TG. Green &gt; 10% upside, Red &gt; 10% overvalued.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

/* ─── Sub-components ─── */
function capexPct_default(p: Preset) { return p.capexPct; }

function InputField({ label, value, onChange, prefix, suffix, type = "number" }: {
  label: string; value: string | number; onChange: (v: any) => void;
  prefix?: string; suffix?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-[#B8AA96]/40 text-[10px] tracking-[0.1em] uppercase mb-1.5">{label}</label>
      <div className="flex items-center border border-[#2C261E] bg-[#0B0B0A] focus-within:border-[#C6A15B]/40 transition-colors">
        {prefix && <span className="text-[#B8AA96]/30 text-xs pl-3 pr-1">{prefix}</span>}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
          className="w-full bg-transparent text-[#F4EFE6] text-sm py-2.5 px-3 outline-none font-mono"
        />
        {suffix && <span className="text-[#B8AA96]/30 text-xs pr-3 pl-1">{suffix}</span>}
      </div>
    </div>
  );
}

function BreakdownRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className={highlight ? "text-[#F4EFE6] text-sm font-medium" : "text-[#B8AA96]/60 text-sm"}>{label}</span>
      <span className={highlight ? "text-[#C6A15B] font-mono text-sm font-medium" : "text-[#B8AA96]/80 font-mono text-sm"}>{value}</span>
    </div>
  );
}

function TableRow({ label, values }: { label: string; values: string[] }) {
  return (
    <tr className="border-b border-[#2C261E]/30">
      <td className="py-2 pr-4 text-[#B8AA96]/50">{label}</td>
      {values.map((v, i) => (
        <td key={i} className="text-right py-2 px-2 font-mono">{v}</td>
      ))}
    </tr>
  );
}
