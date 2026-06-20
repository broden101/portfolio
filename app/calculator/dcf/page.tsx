"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { isBankTicker } from "@/lib/fundamentals";
import {
  ALL_PRESETS,
  CORPORATE_PRESETS,
  BANK_PRESETS,
  isBank,
  type Preset,
  type BankPreset,
} from "./presets";

/* ─── Helpers ─── */
const fmt = (n: number, d = 2) => n.toLocaleString("id-ID", { maximumFractionDigits: d });
const fmtIDR = (n: number) => `Rp ${fmt(n, 0)}`;
const fmtPct = (n: number) => `${fmt(n, 1)}%`;
const fmtT = (n: number) => `${fmt(n, 1)} T`;

/* ─── Auto-fill API response types ─── */
interface DcfInputsResponse {
  model: "fcff";
  inputs: {
    ticker: string;
    price: number;
    beta: number;
    baseRevenue: number;
    ebitMargin: number;
    capexPct: number;
    daPct: number;
    wcPct: number;
    shares: number;
    netDebt: number;
    taxRate: number;
    growthRates: number[];
    wacc: number;
    terminalGrowth: number;
  };
}

interface BankInputsResponse {
  model: "bank";
  inputs: {
    ticker: string;
    price: number;
    beta: number;
    bvPerShare: number;
    roe: number;
    payout: number;
    eps: number;
    dps: number;
    shares: number;
    ke: number;
    growthRates: number[];
    terminalGrowth: number;
    roeFloor: number;
    roeTerminal: number;
  };
  valuation: {
    rimValue: number;
    ddmValue: number;
    blended: number;
    justifiedPB: number;
    marketPB: number;
    upside: number;
    ke: number;
    roePath: number[];
    bvPath: number[];
    riPath: number[];
    dpsPath: number[];
  };
}

/* ─── Component ─── */
export default function DCFPage() {
  // Mode
  const [mode, setMode] = useState<"fcff" | "bank">("fcff");

  // Shared
  const [ticker, setTicker] = useState("BBCA");
  const [customInput, setCustomInput] = useState<string>("");
  const [currentPrice, setCurrentPrice] = useState(2650);

  // FCFF inputs
  const [baseRevenue, setBaseRevenue] = useState(148.0);
  const [ebitMargin, setEbitMargin] = useState(32);
  const [capexPct, setCapexPct] = useState(18);
  const [daPct, setDaPct] = useState(14);
  const [wcPct, setWcPct] = useState(2);
  const [shares, setShares] = useState(99000);
  const [netDebt, setNetDebt] = useState(65);
  const [taxRate, setTaxRate] = useState(22);
  const [wacc, setWacc] = useState(10.5);
  const [terminalGrowth, setTerminalGrowth] = useState(5);
  const [g1, setG1] = useState(8);
  const [g2, setG2] = useState(7);
  const [g3, setG3] = useState(7);
  const [g4, setG4] = useState(6);
  const [g5, setG5] = useState(6);

  // Bank inputs
  const [bvPerShare, setBvPerShare] = useState(2500);
  const [roe, setRoe] = useState(23);
  const [payout, setPayout] = useState(45);
  const [eps, setEps] = useState(575);
  const [dps, setDps] = useState(259);
  const [bankShares, setBankShares] = useState(12400);
  const [ke, setKe] = useState(10.25);
  const [bankTG, setBankTG] = useState(3);
  const [bankG1, setBankG1] = useState(12.7);
  const [bankG2, setBankG2] = useState(10.5);
  const [bankG3, setBankG3] = useState(8.4);
  const [bankG4, setBankG4] = useState(6.3);
  const [bankG5, setBankG5] = useState(4.2);
  const [roeFloor, setRoeFloor] = useState(12);
  const [roeTerminal, setRoeTerminal] = useState(20);

  // ── Autofill status ──
  type AutofillStatus = { status: "idle" } | { status: "loading" } | { status: "error"; message: string };
  const [autofill, setAutofill] = useState<AutofillStatus>({ status: "idle" });

  // runAutofill: receives target ticker, no closure deps on form state
  const runAutofill = useCallback(async (target: string) => {
    if (!target || target === "CUSTOM") return;
    setAutofill({ status: "loading" });
    try {
      const res = await fetch(`/api/dcf-inputs/${target.toUpperCase()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = await res.json();

      if (data.model === "bank") {
        const inp = data.inputs as BankInputsResponse["inputs"];
        setMode("bank");
        setTicker(inp.ticker);
        setCurrentPrice(inp.price);
        setBvPerShare(inp.bvPerShare);
        setRoe(inp.roe);
        setPayout(inp.payout);
        setEps(inp.eps);
        setDps(inp.dps);
        setBankShares(inp.shares);
        setKe(inp.ke);
        setBankTG(inp.terminalGrowth);
        setBankG1(inp.growthRates[0] ?? 3); setBankG2(inp.growthRates[1] ?? 3);
        setBankG3(inp.growthRates[2] ?? 3); setBankG4(inp.growthRates[3] ?? 3);
        setBankG5(inp.growthRates[4] ?? 3);
        setRoeFloor(inp.roeFloor ?? 12);
        setRoeTerminal(inp.roeTerminal ?? 20);
      } else {
        const inp = data.inputs as DcfInputsResponse["inputs"];
        setMode("fcff");
        setTicker(inp.ticker);
        setCurrentPrice(inp.price);
        setBaseRevenue(inp.baseRevenue);
        setEbitMargin(inp.ebitMargin);
        setCapexPct(inp.capexPct);
        setDaPct(inp.daPct);
        setWcPct(inp.wcPct);
        setShares(inp.shares);
        setNetDebt(inp.netDebt);
        setTaxRate(inp.taxRate);
        setWacc(inp.wacc);
        setTerminalGrowth(inp.terminalGrowth);
        setG1(inp.growthRates[0] ?? 10); setG2(inp.growthRates[1] ?? 10);
        setG3(inp.growthRates[2] ?? 8); setG4(inp.growthRates[3] ?? 8);
        setG5(inp.growthRates[4] ?? 6);
      }
      setAutofill({ status: "idle" });
    } catch (err: unknown) {
      setAutofill({ status: "error", message: err instanceof Error ? err.message : "Gagal mengambil data" });
    }
  }, []);

  // ── Auto-run on page load AND when ticker changes ──
  useEffect(() => {
    if (ticker === "CUSTOM") {
      setAutofill({ status: "idle" });
      return;
    }
    runAutofill(ticker);
  }, [ticker, runAutofill]);

  // ── Free-text ticker submit (Enter / blur) ──
  const submitCustomTicker = useCallback(() => {
    const t = customInput.trim().toUpperCase().replace(/\.JK$/, "");
    if (!t || !/^[A-Z]{1,5}$/.test(t)) return;
    setTicker(t);
    setCustomInput(t);
  }, [customInput]);

  // ── Preset apply ──
  const selectPreset = (tickerStr: string) => {
    const bankP = BANK_PRESETS.find((p) => p.ticker === tickerStr);
    const corpP = CORPORATE_PRESETS.find((p) => p.ticker === tickerStr);
    const p = bankP ?? corpP;
    if (!p) return;
    if (bankP) {
      setMode("bank");
    } else {
      setMode("fcff");
    }
    setTicker(p.ticker);
    setCustomInput("");
    setCurrentPrice(p.price);
    // Apply form fields immediately (preset values as starting point)
    if ("bvPerShare" in p) {
      const bp = p as BankPreset;
      setBvPerShare(bp.bvPerShare);
      setRoe(bp.roe);
      setPayout(bp.payout);
      setEps(bp.eps);
      setDps(bp.dps);
      setBankShares(bp.shares);
      setKe(bp.ke);
      setBankTG(bp.terminalGrowth);
      setBankG1(bp.growthRates[0]); setBankG2(bp.growthRates[1]); setBankG3(bp.growthRates[2]);
      setBankG4(bp.growthRates[3]); setBankG5(bp.growthRates[4]);
      setRoeFloor(Math.max(bp.ke, 12));
      setRoeTerminal(Math.min(Math.max(bp.roe, 12), 20));
    } else {
      const cp = p as Preset;
      setBaseRevenue(cp.baseRevenue);
      setEbitMargin(cp.ebitMargin);
      setCapexPct(cp.capexPct);
      setDaPct(cp.daPct);
      setWcPct(cp.wcPct);
      setShares(cp.shares);
      setNetDebt(cp.netDebt);
      setTaxRate(cp.taxRate);
      setWacc(cp.wacc);
      setTerminalGrowth(cp.terminalGrowth);
      setG1(cp.growthRates[0]); setG2(cp.growthRates[1]); setG3(cp.growthRates[2]);
      setG4(cp.growthRates[3]); setG5(cp.growthRates[4]);
    }
  };

  // ─── FCFF Calculation ───
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

    const lastFCFF = years[4].fcff;
    const terminalFCFF = lastFCFF * (1 + terminalGrowth / 100);
    const waccDecimal = wacc / 100;
    const tgDecimal = terminalGrowth / 100;
    const spread = waccDecimal - tgDecimal;
    const terminalValue = spread > 0 ? terminalFCFF / spread : 0;
    const pvTerminal = terminalValue / Math.pow(1 + waccDecimal, 5);

    const enterpriseValue = sumPV + pvTerminal;
    const equityValue = enterpriseValue - netDebt;
    const fairValuePerShare = shares > 0 ? (equityValue * 1e12) / (shares * 1e9) : 0;
    const upside = currentPrice > 0 ? ((fairValuePerShare / currentPrice) - 1) * 100 : 0;
    const tvPct = enterpriseValue > 0 ? (pvTerminal / enterpriseValue) * 100 : 0;

    return { years, sumPV, terminalValue, pvTerminal, enterpriseValue, equityValue, fairValuePerShare, upside, tvPct, spread };
  }, [baseRevenue, ebitMargin, capexPct, daPct, wcPct, shares, netDebt, taxRate, wacc, terminalGrowth, g1, g2, g3, g4, g5, currentPrice]);

  // ─── Bank Calculation (RIM + DDM) ───
  const bankResult = useMemo(() => {
    const rates = [bankG1, bankG2, bankG3, bankG4, bankG5];
    const keDec = ke / 100;
    const tgDec = bankTG / 100;
    const payoutDec = payout / 100;

    const roePath: number[] = [];
    const bvPath: number[] = [];
    const riPath: number[] = [];
    const dpsPath: number[] = [];

    let bv = bvPerShare;
    const rimPVs: number[] = [];
    const ddmPVs: number[] = [];

    for (let i = 0; i < 5; i++) {
      const roeY = roe - ((roe - roeTerminal) * i) / 4;
      const roeDec = Math.max(roeY, 0) / 100;
      const disc = Math.pow(1 + keDec, i + 1);

      const epsY = roeDec * bv;
      const dpsY = payoutDec * epsY;
      const riY = epsY - dpsY;

      roePath.push(Math.round(roeY * 100) / 100);
      bvPath.push(Math.round(bv));
      riPath.push(Math.round(riY));
      dpsPath.push(Math.round(dpsY));

      rimPVs.push(riY / disc);
      ddmPVs.push(dpsY / disc);

      bv = bv + riY;
    }

    const terminalROE = roeTerminal / 100;
    const terminalEPS = terminalROE * bv;
    const terminalDPS = payoutDec * terminalEPS;
    const terminalRI = terminalEPS - terminalDPS;

    const tvRI = (terminalRI * (1 + tgDec)) / (keDec - tgDec);
    const pvTVri = keDec > tgDec ? tvRI / Math.pow(1 + keDec, 5) : 0;
    const rimPV = rimPVs.reduce((a, b) => a + b, 0);
    const rimValue = bvPerShare + rimPV + pvTVri;

    const tvDPS = (terminalDPS * (1 + tgDec)) / (keDec - tgDec);
    const pvTVdps = keDec > tgDec ? tvDPS / Math.pow(1 + keDec, 5) : 0;
    const ddmPV = ddmPVs.reduce((a, b) => a + b, 0);
    const ddmValue = ddmPV + pvTVdps;

    const blended = (rimValue + ddmValue) / 2;
    const justifiedPB = keDec > tgDec ? (roe / 100 - tgDec) / (keDec - tgDec) : 0;
    const marketPB = bvPerShare > 0 ? currentPrice / bvPerShare : 0;
    const upside = currentPrice > 0 ? ((blended / currentPrice) - 1) * 100 : 0;

    const sgr = Math.min((1 - payoutDec) * roe, 25);

    return {
      rimValue: Math.round(rimValue),
      ddmValue: Math.round(ddmValue),
      blended: Math.round(blended),
      justifiedPB: Math.round(justifiedPB * 100) / 100,
      marketPB: Math.round(marketPB * 100) / 100,
      upside: Math.round(upside * 100) / 100,
      roePath, bvPath, riPath, dpsPath,
      sgr: Math.round(sgr * 100) / 100,
      growthRates: rates,
    };
  }, [bvPerShare, roe, payout, ke, bankTG, bankG1, bankG2, bankG3, bankG4, bankG5, roeTerminal, currentPrice]);

  // ─── FCFF Sensitivity Matrix ───
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
  const maxBV = Math.max(...bankResult.bvPath.map(Math.abs), bvPerShare, 1);

  // Verdict
  const activeUpside = mode === "fcff" ? dcf.upside : bankResult.upside;
  const verdict = activeUpside > 20 ? "UNDERVALUED" : activeUpside < -20 ? "OVERVALUED" : "FAIR VALUE";
  const verdictColor = activeUpside > 20 ? "#22C55E" : activeUpside < -20 ? "#EF4444" : "#FACC15";

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
            {mode === "bank"
              ? "Model bank: RIM + DDM + Justified P/B. Auto-switch untuk saham perbankan IDX."
              : "FCFF-based intrinsic value estimation with editable 5-year projections, terminal value, and WACC sensitivity analysis for IDX stocks."}
          </p>
        </div>

        {/* Ticker Selector */}
        <div className="card-luxury p-6 mb-8">
          <p className="text-[#B8AA96]/60 text-xs tracking-[0.15em] uppercase mb-4">Pilih Saham</p>
          <div className="flex flex-wrap items-center gap-2">
            {BANK_PRESETS.map((p) => (
              <button
                key={`bank-${p.ticker}`}
                onClick={() => selectPreset(p.ticker)}
                className={`px-4 py-2 text-sm border transition-all ${
                  ticker === p.ticker
                    ? "border-[#C6A15B] text-[#C6A15B] bg-[#C6A15B]/10"
                    : "border-[#2C261E] text-[#B8AA96]/50 hover:border-[#C6A15B]/30 hover:text-[#B8AA96]"
                }`}
              >
                🏦 {p.ticker}
              </button>
            ))}
            <div className="w-px bg-[#2C261E] mx-1" />
            {CORPORATE_PRESETS.filter((p) => p.ticker !== "CUSTOM").map((p) => (
              <button
                key={`corp-${p.ticker}`}
                onClick={() => selectPreset(p.ticker)}
                className={`px-4 py-2 text-sm border transition-all ${
                  ticker === p.ticker
                    ? "border-[#C6A15B] text-[#C6A15B] bg-[#C6A15B]/10"
                    : "border-[#2C261E] text-[#B8AA96]/50 hover:border-[#C6A15B]/30 hover:text-[#B8AA96]"
                }`}
              >
                {p.ticker}
              </button>
            ))}
            {/* Free-text ticker input */}
            <div className="flex items-center border border-[#2C261E] bg-[#0B0B0A] focus-within:border-[#C6A15B]/40">
              <span className="text-[#C6A15B]/60 text-xs pl-3">✦</span>
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5))}
                onKeyDown={(e) => { if (e.key === "Enter") submitCustomTicker(); }}
                onBlur={() => { if (customInput && customInput !== ticker) submitCustomTicker(); }}
                placeholder="Ticker (mis. GOTO)"
                className="w-36 bg-transparent text-[#F4EFE6] text-sm py-2 px-2 outline-none font-mono uppercase"
              />
            </div>
            {/* Refresh button */}
            <button
              onClick={() => runAutofill(ticker)}
              disabled={autofill.status === "loading" || !ticker || ticker === "CUSTOM"}
              className="px-4 py-2 text-sm border border-[#2C261E] text-[#B8AA96]/50 hover:border-[#C6A15B]/30 hover:text-[#B8AA96] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {autofill.status === "loading" ? "Fetching…" : "↻ Refresh"}
            </button>
          </div>
          {autofill.status === "error" && (
            <div className="flex items-center gap-2 p-2 mt-2 border border-red-400/20 bg-red-400/5 text-xs text-red-400">
              ⚠ {autofill.message}
            </div>
          )}
        </div>

        {/* ─── FCFF Mode ─── */}
        {mode === "fcff" && (
          <>
            {autofill.status === "loading" && <LoadingBanner ticker={ticker} />}
            <div className={`transition-opacity ${autofill.status === "loading" ? "opacity-60" : "opacity-100"}`}>
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left: Inputs */}
              <div className="lg:col-span-2 space-y-6">
                <div className="card-luxury p-6">
                  <h3 className="font-heading text-lg text-[#F4EFE6] mb-5 font-medium">Data Perusahaan & Pasar</h3>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <InputField label="Harga Saham" value={currentPrice} onChange={setCurrentPrice} prefix="Rp" />
                    <InputField label="Shares Outstanding" value={shares} onChange={setShares} suffix="Miliar" />
                    <InputField label="WACC" value={wacc} onChange={setWacc} suffix="%" />
                  </div>
                </div>

                <div className="card-luxury p-6">
                  <h3 className="font-heading text-lg text-[#F4EFE6] mb-5 font-medium">Revenue & Profitabilitas</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <InputField label="Base Revenue (FY Terakhir)" value={baseRevenue} onChange={setBaseRevenue} suffix="T" />
                    <InputField label="EBIT Margin" value={ebitMargin} onChange={setEbitMargin} suffix="%" />
                    <InputField label="Capex / Revenue" value={capexPct} onChange={setCapexPct} suffix="%" />
                    <InputField label="D&A / Revenue" value={daPct} onChange={setDaPct} suffix="%" />
                    <InputField label="Δ Working Capital / Revenue" value={wcPct} onChange={setWcPct} suffix="%" />
                    <InputField label="Effective Tax Rate" value={taxRate} onChange={setTaxRate} suffix="%" />
                  </div>
                </div>

                <div className="card-luxury p-6">
                  <h3 className="font-heading text-lg text-[#F4EFE6] mb-5 font-medium">Proyeksi Pertumbuhan Revenue</h3>
                  <div className="grid grid-cols-5 gap-3">
                    <InputField label="Tahun 1" value={g1} onChange={setG1} suffix="%" />
                    <InputField label="Tahun 2" value={g2} onChange={setG2} suffix="%" />
                    <InputField label="Tahun 3" value={g3} onChange={setG3} suffix="%" />
                    <InputField label="Tahun 4" value={g4} onChange={setG4} suffix="%" />
                    <InputField label="Tahun 5" value={g5} onChange={setG5} suffix="%" />
                  </div>
                </div>

                <div className="card-luxury p-6">
                  <h3 className="font-heading text-lg text-[#F4EFE6] mb-5 font-medium">Discount Rate & Terminal Value</h3>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <InputField label="Terminal Growth Rate" value={terminalGrowth} onChange={setTerminalGrowth} suffix="%" />
                    <InputField label="Net Debt (neg = net cash)" value={netDebt} onChange={setNetDebt} suffix="T" />
                  </div>
                  <p className="text-[#B8AA96]/30 text-[10px] mt-3">WACC spread: {fmtPct(wacc - terminalGrowth)}. Terminal growth harus &lt; WACC.</p>
                </div>
              </div>

              {/* Right: Results */}
              <div className="space-y-6">
                <div className="card-luxury p-6 text-center">
                  <p className="text-[#B8AA96]/40 text-[10px] tracking-[0.2em] uppercase mb-2">{ticker === "CUSTOM" ? "Custom" : `IDX:${ticker}`}</p>
                  <div className="text-4xl font-heading font-medium mb-1" style={{ color: verdictColor }}>
                    {fmtIDR(Math.round(dcf.fairValuePerShare))}
                  </div>
                  <p className="text-[#B8AA96]/50 text-xs mb-4">Fair Value / Share</p>
                  <div className="flex justify-center gap-6 text-sm">
                    <div>
                      <p className="text-[#B8AA96]/40 text-[10px] uppercase">Harga Saat Ini</p>
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

                <div className="card-luxury p-5">
                  <p className="text-[#B8AA96]/30 text-[10px] leading-relaxed">
                    <strong className="text-[#B8AA96]/50">Metodologi:</strong> FCFF = NOPAT + D&A − Capex − ΔWC.
                    Terminal Value via Gordon Growth Model. EV = Σ PV(FCFF) + PV(TV). Equity Value = EV − Net Debt.
                    Semua angka dalam IDR Triliun.
                  </p>
                </div>
              </div>
            </div>

            {/* FCFF Chart */}
            <div className="card-luxury p-8 mt-8">
              <h3 className="font-heading text-lg text-[#F4EFE6] mb-6 font-medium">Proyeksi FCFF 5 Tahun</h3>
              <div className="flex items-end gap-4">
                {dcf.years.map((y) => {
                  const heightPct = maxFCFF > 0 ? Math.min((Math.abs(y.fcff) / maxFCFF) * 100, 100) : 0;
                  const isNeg = y.fcff < 0;
                  return (
                    <div key={y.year} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-[10px] text-[#B8AA96]/50">{fmtT(y.fcff)}</span>
                      <div className="w-full flex justify-center overflow-hidden" style={{ height: "140px", alignItems: "flex-end" }}>
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
                      <span className="text-[9px] text-[#B8AA96]/25">{fmtPct(y.growth)} growth</span>
                    </div>
                  );
                })}
                <div className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[10px] text-[#B8AA96]/50">{fmtT(dcf.pvTerminal)}</span>
                  <div className="w-full flex justify-center overflow-hidden" style={{ height: "140px", alignItems: "flex-end" }}>
                    <div
                      className="w-full max-w-[80px] transition-all duration-500 opacity-70"
                      style={{
                        height: `${Math.min(Math.max((dcf.pvTerminal / maxFCFF) * 100, 4), 100)}%`,
                        background: "linear-gradient(to top, #8B5CF6, #A78BFA)",
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-[#B8AA96]/40">TV</span>
                  <span className="text-[9px] text-[#B8AA96]/25">terminal</span>
                </div>
              </div>
            </div>

            {/* Detailed Projections Table */}
            <div className="card-luxury p-8 mt-8 overflow-x-auto">
              <h3 className="font-heading text-lg text-[#F4EFE6] mb-6 font-medium">Proyeksi Detail Per Tahun</h3>
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

            {/* Sensitivity Matrix */}
            <div className="card-luxury p-8 mt-8 overflow-x-auto">
              <h3 className="font-heading text-lg text-[#F4EFE6] mb-2 font-medium">Sensitivity Analysis</h3>
              <p className="text-[#B8AA96]/40 text-xs mb-6">Fair value per share (Rp) pada variasi WACC dan terminal growth</p>
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
              <p className="text-[#B8AA96]/25 text-[10px] mt-3">Sel highlight = base case WACC/TG. Hijau &gt; 10% upside, Merah &gt; 10% overvalued.</p>
            </div>
            </div>
          </>
        )}

        {/* ─── Bank Mode ─── */}
        {mode === "bank" && (
          <>
            {autofill.status === "loading" && <LoadingBanner ticker={ticker} />}
            <div className={`transition-opacity ${autofill.status === "loading" ? "opacity-60" : "opacity-100"}`}>
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left: Bank Inputs */}
              <div className="lg:col-span-2 space-y-6">
                <div className="card-luxury p-6">
                  <h3 className="font-heading text-lg text-[#F4EFE6] mb-5 font-medium">Data Bank & Pasar</h3>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <InputField label="Harga Saham" value={currentPrice} onChange={setCurrentPrice} prefix="Rp" />
                    <InputField label="Shares Outstanding" value={bankShares} onChange={setBankShares} suffix="Miliar" />
                    <InputField label="Cost of Equity (Ke)" value={ke} onChange={setKe} suffix="%" />
                  </div>
                </div>

                <div className="card-luxury p-6">
                  <h3 className="font-heading text-lg text-[#F4EFE6] mb-5 font-medium">Fundamental Bank</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <InputField label="Book Value / Share" value={bvPerShare} onChange={setBvPerShare} prefix="Rp" />
                    <InputField label="ROE" value={roe} onChange={setRoe} suffix="%" />
                    <InputField label="Payout Ratio" value={payout} onChange={setPayout} suffix="%" />
                    <InputField label="EPS" value={eps} onChange={setEps} prefix="Rp" />
                    <InputField label="DPS" value={dps} onChange={setDps} prefix="Rp" />
                    <InputField label="Terminal Growth" value={bankTG} onChange={setBankTG} suffix="%" />
                  </div>
                </div>

                <div className="card-luxury p-6">
                  <h3 className="font-heading text-lg text-[#F4EFE6] mb-5 font-medium">Proyeksi Pertumbuhan (SGR-based)</h3>
                  <p className="text-[#B8AA96]/40 text-[10px] mb-3">SGR = Retention × ROE = {fmtPct(bankResult.sgr)}. Growth fade dari SGR → {fmtPct(bankTG)} (terminal).</p>
                  <div className="grid grid-cols-5 gap-3">
                    <InputField label="Tahun 1" value={bankG1} onChange={setBankG1} suffix="%" />
                    <InputField label="Tahun 2" value={bankG2} onChange={setBankG2} suffix="%" />
                    <InputField label="Tahun 3" value={bankG3} onChange={setBankG3} suffix="%" />
                    <InputField label="Tahun 4" value={bankG4} onChange={setBankG4} suffix="%" />
                    <InputField label="Tahun 5" value={bankG5} onChange={setBankG5} suffix="%" />
                  </div>
                </div>

                <div className="card-luxury p-6">
                  <h3 className="font-heading text-lg text-[#F4EFE6] mb-5 font-medium">ROE & Floor Parameter</h3>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <InputField label="ROE Floor" value={roeFloor} onChange={setRoeFloor} suffix="%" />
                    <InputField label="ROE Terminal" value={roeTerminal} onChange={setRoeTerminal} suffix="%" />
                  </div>
                  <p className="text-[#B8AA96]/30 text-[10px] mt-3">ROE fade: {fmtPct(roe)} → {fmtPct(roeTerminal)} (clamped 12-20%). Ke: {fmtPct(ke)}.</p>
                </div>
              </div>

              {/* Right: Bank Results */}
              <div className="space-y-6">
                {/* RIM Card */}
                <div className="card-luxury p-6 text-center">
                  <p className="text-[#B8AA96]/40 text-[10px] tracking-[0.2em] uppercase mb-2">IDX:{ticker} — RIM Model</p>
                  <div className="text-4xl font-heading font-medium mb-1 text-[#C6A15B]">
                    {fmtIDR(bankResult.rimValue)}
                  </div>
                  <p className="text-[#B8AA96]/50 text-xs">Residual Income Model</p>
                </div>

                {/* DDM Card */}
                <div className="card-luxury p-6 text-center">
                  <p className="text-[#B8AA96]/40 text-[10px] tracking-[0.2em] uppercase mb-2">IDX:{ticker} — DDM Model</p>
                  <div className="text-4xl font-heading font-medium mb-1 text-[#3B82F6]">
                    {fmtIDR(bankResult.ddmValue)}
                  </div>
                  <p className="text-[#B8AA96]/50 text-xs">Dividend Discount Model</p>
                </div>

                {/* Blended Verdict */}
                <div className="card-luxury p-6 text-center">
                  <p className="text-[#B8AA96]/40 text-[10px] tracking-[0.2em] uppercase mb-2">Blended (RIM + DDM) / 2</p>
                  <div className="text-4xl font-heading font-medium mb-1" style={{ color: verdictColor }}>
                    {fmtIDR(bankResult.blended)}
                  </div>
                  <p className="text-[#B8AA96]/50 text-xs mb-4">Fair Value / Share</p>
                  <div className="flex justify-center gap-6 text-sm">
                    <div>
                      <p className="text-[#B8AA96]/40 text-[10px] uppercase">Harga</p>
                      <p className="text-[#F4EFE6] font-medium">{fmtIDR(currentPrice)}</p>
                    </div>
                    <div>
                      <p className="text-[#B8AA96]/40 text-[10px] uppercase">Upside</p>
                      <p className="font-medium" style={{ color: verdictColor }}>{fmtPct(bankResult.upside)}</p>
                    </div>
                  </div>
                  <div className="mt-4 py-2 px-4 border text-xs tracking-[0.15em] uppercase font-medium inline-block" style={{ borderColor: verdictColor, color: verdictColor }}>
                    {verdict}
                  </div>
                </div>

                {/* P/B Comparison */}
                <div className="card-luxury p-6">
                  <h3 className="font-heading text-lg text-[#F4EFE6] mb-4 font-medium">P/B Comparison</h3>
                  <div className="space-y-3 text-sm">
                    <BreakdownRow label="Justified P/B" value={`${fmt(bankResult.justifiedPB)}x`} highlight />
                    <BreakdownRow label="Market P/B" value={`${fmt(bankResult.marketPB)}x`} />
                    <BreakdownRow label="BV / Share" value={fmtIDR(bvPerShare)} />
                    <BreakdownRow label="ROE" value={fmtPct(roe)} />
                    <BreakdownRow label="Cost of Equity" value={fmtPct(ke)} />
                    <BreakdownRow label="Terminal Growth" value={fmtPct(bankTG)} />
                  </div>
                </div>

                <div className="card-luxury p-5">
                  <p className="text-[#B8AA96]/30 text-[10px] leading-relaxed">
                    <strong className="text-[#B8AA96]/50">Metodologi Bank:</strong> RIM = BV₀ + Σ PV(RI) + PV(TV).
                    DDM = Σ PV(DPS) + PV(TV). Justified P/B = (ROE − g) / (Ke − g).
                    ROE fade: {fmtPct(roe)} → {fmtPct(roeTerminal)}. SGR: {fmtPct(bankResult.sgr)}.
                  </p>
                </div>
              </div>
            </div>

            {/* BV Growth Chart */}
            <div className="card-luxury p-8 mt-8">
              <h3 className="font-heading text-lg text-[#F4EFE6] mb-6 font-medium">Proyeksi Book Value 5 Tahun</h3>
              <div className="flex items-end gap-4">
                {/* Year 0 */}
                <div className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[10px] text-[#B8AA96]/50">{fmtIDR(bvPerShare)}</span>
                  <div className="w-full flex justify-center overflow-hidden" style={{ height: "140px", alignItems: "flex-end" }}>
                    <div
                      className="w-full max-w-[80px] transition-all duration-500"
                      style={{
                        height: `${Math.max((bvPerShare / maxBV) * 100, 4)}%`,
                        background: "linear-gradient(to top, #C6A15B, #D4B76A)",
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-[#B8AA96]/40">Y0</span>
                  <span className="text-[9px] text-[#B8AA96]/25">BV saat ini</span>
                </div>
                {bankResult.bvPath.map((bv, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-[10px] text-[#B8AA96]/50">{fmtIDR(bv)}</span>
                    <div className="w-full flex justify-center overflow-hidden" style={{ height: "140px", alignItems: "flex-end" }}>
                      <div
                        className="w-full max-w-[80px] transition-all duration-500"
                        style={{
                          height: `${Math.max((bv / maxBV) * 100, 4)}%`,
                          background: "linear-gradient(to top, #C6A15B, #D4B76A)",
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-[#B8AA96]/40">Y{i + 1}</span>
                    <span className="text-[9px] text-[#B8AA96]/25">ROE {fmtPct(bankResult.roePath[i])}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Growth Path Table */}
            <div className="card-luxury p-8 mt-8 overflow-x-auto">
              <h3 className="font-heading text-lg text-[#F4EFE6] mb-6 font-medium">Tabel Jalur Pertumbuhan (RIM & DDM)</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2C261E]">
                    <th className="text-left text-[#B8AA96]/40 text-[10px] tracking-[0.1em] uppercase py-2 pr-4">Metrik</th>
                    {["Y1", "Y2", "Y3", "Y4", "Y5"].map((y) => (
                      <th key={y} className="text-right text-[#B8AA96]/40 text-[10px] tracking-[0.1em] uppercase py-2 px-2">{y}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-[#B8AA96]/70">
                  <TableRow label="Growth Rate" values={bankResult.growthRates.map(fmtPct)} />
                  <TableRow label="ROE (%)" values={bankResult.roePath.map(fmtPct)} />
                  <TableRow label="BV (Rp)" values={bankResult.bvPath.map(fmtIDR)} />
                  <TableRow label="Residual Income (Rp)" values={bankResult.riPath.map(fmtIDR)} />
                  <TableRow label="DPS (Rp)" values={bankResult.dpsPath.map(fmtIDR)} />
                </tbody>
              </table>
            </div>
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}

/* ─── Sub-components ─── */

function LoadingBanner({ ticker: tk }: { ticker: string }) {
  return (
    <div className="flex items-center gap-3 p-3 mb-6 border border-[#C6A15B]/20 bg-[#C6A15B]/5 text-xs">
      <span className="inline-block w-3 h-3 border border-[#C6A15B] border-t-transparent rounded-full animate-spin" />
      <span className="text-[#B8AA96]">
        Mengambil data <strong className="text-[#C6A15B]">{tk}</strong> dari Stock Analysis &amp; TradingView…
      </span>
      <span className="ml-auto text-[#B8AA96]/40 uppercase tracking-wider">menampilkan preset sementara</span>
    </div>
  );
}

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
