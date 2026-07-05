"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Disclaimer } from "@/components/DataState";

// Full IDX100 (Kompas100) — canonical list
const IDX100 = [
  "ACES","ADMR","ADRO","AKRA","AMMN","AMRT","ANTM","ARTO","ASII","ASSA",
  "BBCA","BBNI","BBRI","BBTN","BBYB","BKSL","BMRI","BMTR","BREN","BRIS",
  "BRMS","BRPT","BSDE","BTPS","BUKA","BULL","BUMI","BUVA","CBDK","CMRY",
  "CPIN","CTRA","CUAN","DEWA","DSNG","DSSA","ELSA","EMTK","ENRG","ERAA",
  "ESSA","EXCL","FILM","GOTO","HEAL","HMSP","HRTA","HRUM","ICBP","IMPC",
  "INCO","INDF","INDY","INET","INKP","INTP","ISAT","ITMG","JPFA","JSMR",
  "KIJA","KLBF","KPIG","MAPA","MAPI","MBMA","MDKA","MEDC","MIKA","MTEL",
  "MYOR","NCKL","PANI","PGAS","PGEO","PNLF","PSAB","PTBA","PTRO","PWON",
  "RAJA","RATU","SCMA","SGER","SIDO","SMGR","SMIL","SMRA","SSIA","TAPG",
  "TCPI","TINS","TLKM","TOBA","TOWR","TPIA","UNTR","UNVR","WIFI","WIRG",
];

const START_YEARS = [2026, 2025, 2023, 2021, 2016, 2011];
const FORECAST_PERIODS = [1, 2, 3, 5, 10];

type BacktestResult = {
  ticker: string;
  name: string;
  currentPrice: number | null;
  finalValue: number | null;
  totalReturnPct: number | null;
  annualReturnPct: number | null;
  capitalGainRp: number | null;
  estDividend: number | null;
  dividendYield: number | null;
  years: number;
};

type ForecastResult = {
  ticker: string;
  name: string;
  currentPrice: number | null;
  projectedValue: number | null;
  cagr: number | null;
  capitalGainRp: number | null;
  cumDividend: number | null;
  dividendYield: number | null;
};

function fmtRp(n: number | null): string {
  if (n === null || n === undefined) return "—";
  if (n >= 1_000_000_000_000) return `Rp${(n / 1_000_000_000_000).toFixed(2)}T`;
  if (n >= 1_000_000_000) return `Rp${(n / 1_000_000_000).toFixed(2)}M`;
  if (n >= 1_000_000) return `Rp${(n / 1_000_000).toFixed(2)}JT`;
  return `Rp${n.toLocaleString("id-ID")}`;
}

function fmtPct(n: number | null): string {
  if (n === null || n === undefined) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function fmtPrice(n: number | null): string {
  if (n === null || n === undefined) return "—";
  return `Rp${n.toLocaleString("id-ID")}`;
}

export default function SimulationPage() {
  const [modal, setModal] = useState("100000000");
  const [selectedTickers, setSelectedTickers] = useState<string[]>(["BBCA", "BBRI", "BMRI"]);
  const [searchTerm, setSearchTerm] = useState("");
  const [startYear, setStartYear] = useState(2023);
  const [forecastPeriod, setForecastPeriod] = useState(3);
  const [backtestData, setBacktestData] = useState<BacktestResult[] | null>(null);
  const [forecastData, setForecastData] = useState<ForecastResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredStocks = useMemo(() => {
    if (!searchTerm) return IDX100.slice(0, 50);
    const q = searchTerm.toUpperCase();
    return IDX100.filter((t) => t.includes(q)).slice(0, 50);
  }, [searchTerm]);

  const toggleTicker = useCallback((t: string) => {
    setSelectedTickers((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }, []);

  const handleRemoveTicker = useCallback((t: string) => {
    setSelectedTickers((prev) => prev.filter((x) => x !== t));
  }, []);

  const handleHitung = useCallback(async () => {
    if (!modal || selectedTickers.length === 0) return;
    setLoading(true);
    try {
      const tickers = selectedTickers.join(",");
      const res = await fetch(
        `/api/simulation?tickers=${tickers}&start=${startYear}&modal=${parseFloat(modal)}&forecast=${forecastPeriod}`
      );
      const data = await res.json();
      setBacktestData(data.backtest.perStock);
      setForecastData(data.forecast.perStock);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [modal, selectedTickers, startYear, forecastPeriod]);

  // Auto-run on mount with defaults
  useEffect(() => {
    handleHitung();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-[#0B0B0A] pt-24 pb-20">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-10 h-px bg-[#C6A15B]/30" />
            <span className="text-[#C6A15B] text-xs tracking-[0.3em] uppercase font-medium">Simulation</span>
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-[#F4EFE6] font-light mb-3">
            Simulasi <span className="text-gold-gradient font-medium">Investasi</span>
          </h1>
          <p className="text-[#B8AA96]/60 text-sm font-light max-w-xl">
            Backtest historis & forecast investasi saham IDX — modal bebas, pilih sendiri sahamnya.
          </p>
        </div>

        {/* Input Form */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {/* Modal Awal */}
          <div>
            <label className="block text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase mb-2">Modal Awal (Rp)</label>
            <input
              type="number"
              value={modal}
              onChange={(e) => setModal(e.target.value)}
              className="w-full bg-[#1A1A18] border border-[#2C261E] text-[#F4EFE6] px-4 py-3 text-sm font-mono focus:outline-none focus:border-[#C6A15B]/50 transition-colors"
              placeholder="100.000.000"
            />
          </div>

          {/* Start Year */}
          <div>
            <label className="block text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase mb-2">Backtest Start Year</label>
            <select
              value={startYear}
              onChange={(e) => setStartYear(parseInt(e.target.value))}
              className="w-full bg-[#1A1A18] border border-[#2C261E] text-[#F4EFE6] px-4 py-3 text-sm font-mono focus:outline-none focus:border-[#C6A15B]/50 transition-colors cursor-pointer appearance-none"
            >
              {START_YEARS.map((y) => (
                <option key={y} value={y}>
                  {y} {y === 2026 ? "(YTD)" : y === 2025 ? "(1Y)" : y === 2023 ? "(3Y)" : y === 2021 ? "(5Y)" : y === 2016 ? "(10Y)" : "(15Y)"}
                </option>
              ))}
            </select>
          </div>

          {/* Forecast Period */}
          <div>
            <label className="block text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase mb-2">Forecast Period</label>
            <select
              value={forecastPeriod}
              onChange={(e) => setForecastPeriod(parseInt(e.target.value))}
              className="w-full bg-[#1A1A18] border border-[#2C261E] text-[#F4EFE6] px-4 py-3 text-sm font-mono focus:outline-none focus:border-[#C6A15B]/50 transition-colors cursor-pointer appearance-none"
            >
              {FORECAST_PERIODS.map((p) => (
                <option key={p} value={p}>
                  {p} Tahun
                </option>
              ))}
            </select>
          </div>

          {/* Hitung button */}
          <div className="flex items-end">
            <button
              onClick={handleHitung}
              disabled={loading}
              className="w-full bg-[#C6A15B] text-[#0B0B0A] px-6 py-3 text-sm tracking-[0.15em] uppercase font-semibold hover:bg-[#d6ad5a] transition-colors disabled:opacity-50"
            >
              {loading ? "Memproses..." : "Hitung"}
            </button>
          </div>
        </div>

        {/* Stock Picker (multi-select) */}
        <div className="mb-10">
          <label className="block text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase mb-2">Pilih Saham</label>

          {/* Selected pills */}
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedTickers.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#C6A15B]/10 border border-[#C6A15B]/30 text-[#C6A15B] text-[11px] font-mono cursor-pointer hover:bg-[#C6A15B]/20 transition-colors"
                onClick={() => handleRemoveTicker(t)}
              >
                {t}
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 2l6 6M8 2l-6 6" />
                </svg>
              </span>
            ))}
          </div>

          {/* Search + dropdown */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Cari kode saham..."
              className="w-full bg-[#1A1A18] border border-[#2C261E] text-[#B8AA96]/70 px-4 py-2.5 text-sm focus:outline-none focus:border-[#C6A15B]/50 transition-colors"
            />
            {showDropdown && (
              <div
                className="absolute top-full left-0 right-0 z-50 bg-[#1A1A18] border border-[#2C261E] max-h-[240px] overflow-y-auto"
                onMouseLeave={() => setShowDropdown(false)}
              >
                <div className="p-1.5 text-[#B8AA96]/30 text-[9px] tracking-[0.1em] uppercase px-2">IDX100</div>
                {filteredStocks.map((t) => {
                  const selected = selectedTickers.includes(t);
                  return (
                    <button
                      key={t}
                      onClick={() => toggleTicker(t)}
                      className={`w-full text-left px-3 py-2 text-sm font-mono transition-colors flex items-center gap-3 ${
                        selected
                          ? "text-[#C6A15B] bg-[#C6A15B]/10"
                          : "text-[#B8AA96]/60 hover:text-[#B8AA96] hover:bg-[#2C261E]/50"
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 border flex items-center justify-center ${
                        selected ? "border-[#C6A15B] bg-[#C6A15B]" : "border-[#2C261E]"
                      }`}>
                        {selected && (
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="#0B0B0A" strokeWidth="2">
                            <path d="M1.5 4l2 2 3-4" />
                          </svg>
                        )}
                      </span>
                      {t}
                    </button>
                  );
                })}
              </div>
            )}
            {showDropdown && (
              <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
            )}
          </div>
        </div>

        {/* ─── BACKTEST RESULTS ─── */}
        {backtestData && (
          <div className="mb-14">
            <h2 className="font-heading text-xl text-[#F4EFE6] font-medium mb-6 flex items-center gap-3">
              <span className="text-[#C6A15B]">⬅</span>
              Backtest — Simulasi Histori
            </h2>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {(() => {
                const avgRet = backtestData
                  .filter((r) => r.totalReturnPct !== null)
                  .reduce((s, r) => s + (r.totalReturnPct ?? 0), 0) /
                  Math.max(backtestData.filter((r) => r.totalReturnPct !== null).length, 1);
                const totalInvest = parseFloat(modal) * backtestData.length;
                const totalFinal = backtestData
                  .filter((r) => r.finalValue !== null)
                  .reduce((s, r) => s + (r.finalValue ?? 0), 0);
                return (
                  <>
                    <div className="card-luxury p-5">
                      <div className="text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase mb-1">Total Investasi</div>
                      <div className="font-heading text-2xl text-[#F4EFE6] font-medium">{fmtRp(totalInvest)}</div>
                    </div>
                    <div className="card-luxury p-5">
                      <div className="text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase mb-1">Nilai Akhir</div>
                      <div className={`font-heading text-2xl font-medium ${totalFinal >= totalInvest ? "text-emerald-400" : "text-red-400"}`}>
                        {fmtRp(totalFinal)}
                      </div>
                    </div>
                    <div className="card-luxury p-5">
                      <div className="text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase mb-1">Rata-Rata Return</div>
                      <div className={`font-heading text-2xl font-medium ${avgRet >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {fmtPct(avgRet)}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#2C261E]">
                    <th className="text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase font-normal pb-3 pr-4">Saham</th>
                    <th className="text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase font-normal pb-3 pr-4">Harga</th>
                    <th className="text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase font-normal pb-3 pr-4">Modal</th>
                    <th className="text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase font-normal pb-3 pr-4">Final</th>
                    <th className="text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase font-normal pb-3 pr-4">Return %</th>
                    <th className="text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase font-normal pb-3 pr-4">CAGR</th>
                    <th className="text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase font-normal pb-3 pr-4">Capital Gain</th>
                    <th className="text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase font-normal pb-3">Dividen</th>
                  </tr>
                </thead>
                <tbody>
                  {backtestData.map((r) => (
                    <tr key={r.ticker} className="border-b border-[#1A1A18] hover:bg-[#1A1A18]/50 transition-colors">
                      <td className="py-3 pr-4">
                        <span className="text-[#F4EFE6] font-mono text-sm font-medium">{r.ticker}</span>
                        <span className="text-[#B8AA96]/40 text-[10px] block">{r.name?.slice(0, 35)}</span>
                      </td>
                      <td className="py-3 pr-4 text-[#F4EFE6] font-mono text-sm">{fmtPrice(r.currentPrice)}</td>
                      <td className="py-3 pr-4 text-[#F4EFE6] font-mono text-sm">{fmtRp(parseFloat(modal))}</td>
                      <td className={`py-3 pr-4 font-mono text-sm ${(r.finalValue ?? 0) >= parseFloat(modal) ? "text-emerald-400" : "text-red-400"}`}>
                        {fmtRp(r.finalValue)}
                      </td>
                      <td className={`py-3 pr-4 font-mono text-sm ${(r.totalReturnPct ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {fmtPct(r.totalReturnPct)}
                      </td>
                      <td className={`py-3 pr-4 font-mono text-sm ${(r.annualReturnPct ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {fmtPct(r.annualReturnPct)}
                      </td>
                      <td className={`py-3 pr-4 font-mono text-sm ${(r.capitalGainRp ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {fmtRp(r.capitalGainRp)}
                      </td>
                      <td className="py-3 font-mono text-sm text-[#B8AA96]/70">
                        {r.estDividend ? fmtRp(r.estDividend) : (r.dividendYield ? `${r.dividendYield.toFixed(2)}%` : "—")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── FORECAST RESULTS ─── */}
        {forecastData && (
          <div className="mb-14">
            <h2 className="font-heading text-xl text-[#F4EFE6] font-medium mb-6 flex items-center gap-3">
              <span className="text-[#C6A15B]">➡</span>
              Forecast — Proyeksi {forecastPeriod} Tahun ke Depan
            </h2>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {(() => {
                const totalInvest = parseFloat(modal) * forecastData.length;
                const totalProj = forecastData
                  .filter((r) => r.projectedValue !== null)
                  .reduce((s, r) => s + (r.projectedValue ?? 0), 0);
                return (
                  <>
                    <div className="card-luxury p-5">
                      <div className="text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase mb-1">Total Investasi</div>
                      <div className="font-heading text-2xl text-[#F4EFE6] font-medium">{fmtRp(totalInvest)}</div>
                    </div>
                    <div className="card-luxury p-5">
                      <div className="text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase mb-1">Proyeksi Nilai</div>
                      <div className={`font-heading text-2xl font-medium ${totalProj >= totalInvest ? "text-emerald-400" : "text-red-400"}`}>
                        {fmtRp(totalProj)}
                      </div>
                    </div>
                    <div className="card-luxury p-5">
                      <div className="text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase mb-1">Modal + Dividen</div>
                      <div className="font-heading text-2xl text-[#B8AA96]/70 font-medium">
                        {fmtRp(totalProj)}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#2C261E]">
                    <th className="text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase font-normal pb-3 pr-4">Saham</th>
                    <th className="text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase font-normal pb-3 pr-4">Harga</th>
                    <th className="text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase font-normal pb-3 pr-4">Modal</th>
                    <th className="text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase font-normal pb-3 pr-4">Proyeksi</th>
                    <th className="text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase font-normal pb-3 pr-4">Capital Gain</th>
                    <th className="text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase font-normal pb-3 pr-4">Dividen Kumulatif</th>
                    <th className="text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase font-normal pb-3">Div.Yield/th</th>
                  </tr>
                </thead>
                <tbody>
                  {forecastData.map((r) => (
                    <tr key={r.ticker} className="border-b border-[#1A1A18] hover:bg-[#1A1A18]/50 transition-colors">
                      <td className="py-3 pr-4">
                        <span className="text-[#F4EFE6] font-mono text-sm font-medium">{r.ticker}</span>
                        <span className="text-[#B8AA96]/40 text-[10px] block">{r.name?.slice(0, 35)}</span>
                      </td>
                      <td className="py-3 pr-4 text-[#F4EFE6] font-mono text-sm">{fmtPrice(r.currentPrice)}</td>
                      <td className="py-3 pr-4 text-[#F4EFE6] font-mono text-sm">{fmtRp(parseFloat(modal))}</td>
                      <td className={`py-3 pr-4 font-mono text-sm ${(r.projectedValue ?? 0) >= parseFloat(modal) ? "text-emerald-400" : "text-red-400"}`}>
                        {fmtRp(r.projectedValue)}
                      </td>
                      <td className={`py-3 pr-4 font-mono text-sm ${(r.capitalGainRp ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {fmtRp(r.capitalGainRp)}
                      </td>
                      <td className="py-3 pr-4 font-mono text-sm text-[#B8AA96]/70">
                        {r.cumDividend ? fmtRp(r.cumDividend) : "—"}
                      </td>
                      <td className="py-3 font-mono text-sm text-[#B8AA96]/70">
                        {r.dividendYield ? `${r.dividendYield.toFixed(2)}%` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-4 border border-[#2C261E] bg-[#1A1A18]/30">
              <p className="text-[#B8AA96]/50 text-[10px] tracking-[0.1em] leading-relaxed">
                ⚠️ Forecast menggunakan CAGR 3 tahun terakhir sebagai asumsi pertumbuhan harga + dividend yield saat ini.
                Return masa lalu bukan jaminan hasil di masa depan.
              </p>
            </div>
          </div>
        )}

        <Disclaimer />
      </div>
      <Footer />
    </div>
  );
}
