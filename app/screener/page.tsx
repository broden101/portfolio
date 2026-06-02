"use client";

import { useState, useEffect } from "react";
import { ScannerButton } from "@/components/ScannerButton";
import { StockTable } from "@/components/StockTable";
import ReversalScreener from "@/components/ReversalScreener";
import { getSettings, saveSettings, getCachedResults } from "@/lib/storage";
import type { ScreenResult, FilterConfig } from "@/lib/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type ScreenerMode = "standard" | "reversal";

export default function ScreenerPage() {
  const [mode, setMode] = useState<ScreenerMode>("standard");
  const [results, setResults] = useState<ScreenResult[]>([]);
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [universe, setUniverse] = useState<"IDX100" | "LQ45">("IDX100");

  useEffect(() => {
    const settings = getSettings();
    setFilters(settings.defaultFilters);
    setUniverse(settings.universe === "CUSTOM" ? "IDX100" : settings.universe);
    const cached = getCachedResults();
    if (cached.length > 0) setResults(cached as unknown as ScreenResult[]);
    setLoaded(true);
  }, []);

  const toggleFilter = (id: string) => {
    setFilters((prev) => {
      const updated = prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f));
      saveSettings({ ...getSettings(), defaultFilters: updated });
      return updated;
    });
  };

  const updateParam = (filterId: string, param: string, value: number) => {
    setFilters((prev) => {
      const updated = prev.map((f) =>
        f.id === filterId ? { ...f, params: { ...f.params, [param]: value } } : f
      );
      saveSettings({ ...getSettings(), defaultFilters: updated });
      return updated;
    });
  };

  const changeUniverse = (u: "IDX100" | "LQ45") => {
    setUniverse(u);
    saveSettings({ ...getSettings(), universe: u });
  };

  const rescreen = async () => {
    if (results.length === 0) return;
    const { screenAll } = await import("@/lib/screener");
    setResults(screenAll(results as unknown as import("@/lib/types").StockData[], filters));
  };

  const [filterMode, setFilterMode] = useState<"all" | ScreenResult["action"]>("all");
  const filtered =
    filterMode === "all" ? results : results.filter((r) => r.action === filterMode);
  const buys = results.filter((r) => r.action === "BUY").length;
  const watches = results.filter((r) => r.action === "WATCH").length;

  return (
    <div className="min-h-screen bg-[#0B0B0A] pt-24 pb-20">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="w-10 h-px bg-[#C6A15B]/30" />
              <span className="text-[#C6A15B] text-xs tracking-[0.3em] uppercase font-medium">
                IDX Screener
              </span>
            </div>
            <h1 className="font-heading text-4xl text-[#F4EFE6] font-light">
              Stock <span className="text-gold-gradient font-medium">Screener</span>
            </h1>
          </div>
          {mode === "standard" && (
            <div className="flex items-center gap-3">
              {results.length > 0 && (
                <button
                  onClick={rescreen}
                  className="px-5 py-2.5 border border-[#8A6F3D] text-[#F4EFE6] text-xs tracking-[0.15em] uppercase font-medium hover:border-[#C6A15B] hover:text-[#C6A15B] transition-all"
                >
                  Re-screen
                </button>
              )}
              <ScannerButton onResults={setResults} />
            </div>
          )}
        </div>

        {/* Mode tabs */}
        <div className="flex items-center gap-1 mb-8 border-b border-[#2C261E]">
          {([
            { key: "standard" as ScreenerMode, label: "Standard Screener" },
            { key: "reversal" as ScreenerMode, label: "Reversal Watch" },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setMode(tab.key)}
              className={`px-6 py-3 text-xs tracking-[0.15em] uppercase font-medium transition-all border-b-2 -mb-px ${
                mode === tab.key
                  ? "border-[#C6A15B] text-[#C6A15B]"
                  : "border-transparent text-[#B8AA96]/40 hover:text-[#B8AA96]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Reversal mode */}
        {mode === "reversal" && <ReversalScreener />}

        {/* Standard mode */}
        {mode === "standard" && (
          <>
            <div className="flex items-center gap-3 mb-8">
              <span className="text-[#B8AA96]/60 text-xs tracking-wider uppercase">
                Universe:
              </span>
              {(["IDX100", "LQ45"] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => changeUniverse(u)}
                  className={`px-5 py-1.5 text-xs tracking-[0.15em] uppercase font-medium transition-all ${
                    universe === u
                      ? "bg-[#C6A15B]/15 text-[#C6A15B] border border-[#C6A15B]/30"
                      : "border border-[#2C261E] text-[#B8AA96]/50 hover:text-[#B8AA96]"
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>

            {results.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Total", value: results.length, color: "text-[#F4EFE6]" },
                  { label: "Buy", value: buys, color: "text-[#C6A15B]" },
                  { label: "Watch", value: watches, color: "text-blue-400" },
                  {
                    label: "Filters",
                    value: filters.filter((f) => f.enabled).length,
                    color: "text-[#B8AA96]",
                  },
                ].map((s) => (
                  <div key={s.label} className="card-luxury p-5 text-center">
                    <div className={`font-heading text-3xl font-medium ${s.color}`}>
                      {s.value}
                    </div>
                    <div className="text-[#B8AA96]/40 text-xs tracking-[0.2em] uppercase mt-1">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid lg:grid-cols-4 gap-8">
              <div className="space-y-6">
                <div className="card-luxury p-6">
                  <h3 className="text-xs tracking-[0.2em] uppercase text-[#C6A15B] mb-5 font-medium">
                    Filters
                  </h3>
                  <div className="space-y-4">
                    {filters.map((f) => (
                      <div key={f.id} className="space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={f.enabled}
                              onChange={() => toggleFilter(f.id)}
                              className="sr-only peer"
                            />
                            <div className="w-4 h-4 border border-[#2C261E] peer-checked:bg-[#C6A15B] peer-checked:border-[#C6A15B] transition-all flex items-center justify-center">
                              {f.enabled && (
                                <svg
                                  className="w-2.5 h-2.5 text-[#0B0B0A]"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <span className="text-sm text-[#F4EFE6] group-hover:text-[#C6A15B] transition-colors">
                            {f.name}
                          </span>
                        </label>
                        <p className="text-xs text-[#B8AA96]/40 ml-7">{f.description}</p>
                        {f.enabled && Object.keys(f.params).length > 0 && (
                          <div className="ml-7 space-y-2 mt-2">
                            {Object.entries(f.params).map(([key, val]) => (
                              <div key={key} className="flex items-center gap-2">
                                <label className="text-xs text-[#B8AA96]/60 w-24">
                                  {key.replace(/_/g, " ")}
                                </label>
                                <input
                                  type="number"
                                  value={val}
                                  onChange={(e) =>
                                    updateParam(f.id, key, parseFloat(e.target.value) || 0)
                                  }
                                  className="w-20 bg-[#0B0B0A] border border-[#2C261E] px-2 py-1 text-xs text-[#F4EFE6] focus:border-[#C6A15B] outline-none transition-colors"
                                  step="0.5"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-luxury p-6">
                  <h3 className="text-xs tracking-[0.2em] uppercase text-[#C6A15B] mb-5 font-medium">
                    Signal
                  </h3>
                  <div className="space-y-1">
                    {(["all", "BUY", "WATCH", "HOLD", "AVOID"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setFilterMode(m)}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                          filterMode === m
                            ? "bg-[#C6A15B]/10 text-[#C6A15B]"
                            : "text-[#B8AA96]/50 hover:text-[#B8AA96]"
                        }`}
                      >
                        {m === "all" ? `All (${results.length})` : m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3">
                <div className="card-luxury p-6">
                  {!loaded ? (
                    <div className="text-center text-[#B8AA96]/40 py-12">Loading...</div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="font-heading text-xl text-[#F4EFE6] font-medium">
                          Results{" "}
                          <span className="text-[#B8AA96]/50 font-light">
                            ({filtered.length})
                          </span>
                        </h2>
                        {results.length > 0 && (
                          <span className="text-xs text-[#B8AA96]/30">
                            {filters.filter((f) => f.enabled).length} active filters
                          </span>
                        )}
                      </div>
                      <StockTable results={filtered} />
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
