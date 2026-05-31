"use client";

import { useState, useEffect } from "react";
import { ScannerButton } from "@/components/ScannerButton";
import { StockTable } from "@/components/StockTable";
import { getSettings, saveSettings, getCachedResults } from "@/lib/storage";
import type { ScreenResult, FilterConfig } from "@/lib/types";

export default function ScreenerPage() {
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
      const updated = prev.map((f) => f.id === id ? { ...f, enabled: !f.enabled } : f);
      saveSettings({ ...getSettings(), defaultFilters: updated });
      return updated;
    });
  };

  const updateParam = (filterId: string, param: string, value: number) => {
    setFilters((prev) => {
      const updated = prev.map((f) => f.id === filterId ? { ...f, params: { ...f.params, [param]: value } } : f);
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
  const filtered = filterMode === "all" ? results : results.filter((r) => r.action === filterMode);
  const buys = results.filter((r) => r.action === "BUY").length;
  const watches = results.filter((r) => r.action === "WATCH").length;

  return (
    <div className="min-h-screen bg-[#DDBFA2] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="w-10 h-px bg-[#A39276]/40" />
              <span className="text-[#6E6151] text-xs tracking-[0.3em] uppercase font-semibold">IDX Screener</span>
            </div>
            <h1 className="font-serif text-4xl text-[#281F17] font-bold">
              Stock <span className="text-gold-gradient">Screener</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {results.length > 0 && (
              <button onClick={rescreen} className="px-5 py-2.5 border-2 border-[#111111]/30 text-[#111111] text-xs tracking-[0.15em] uppercase font-semibold hover:border-[#111111] hover:bg-[#111111]/5 transition-all">
                Re-screen
              </button>
            )}
            <ScannerButton onResults={setResults} />
          </div>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <span className="text-[#726556] text-xs tracking-wider uppercase font-medium">Universe:</span>
          {(["IDX100", "LQ45"] as const).map((u) => (
            <button key={u} onClick={() => changeUniverse(u)} className={`px-5 py-1.5 text-xs tracking-[0.15em] uppercase font-semibold transition-all ${universe === u ? "bg-[#6E6151]/15 text-[#6E6151] border border-[#6E6151]/30" : "border border-[#A39276]/30 text-[#A39276] hover:text-[#726556]"}`}>
              {u}
            </button>
          ))}
        </div>

        {results.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total", value: results.length, color: "text-[#111111]" },
              { label: "Buy", value: buys, color: "text-[#6E6151]" },
              { label: "Watch", value: watches, color: "text-blue-700" },
              { label: "Filters", value: filters.filter((f) => f.enabled).length, color: "text-[#726556]" },
            ].map((s) => (
              <div key={s.label} className="card-luxury p-5 text-center">
                <div className={`font-serif text-3xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-[#A39276] text-xs tracking-[0.2em] uppercase mt-1 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-8">
          <div className="space-y-6">
            <div className="card-luxury p-6">
              <h3 className="text-xs tracking-[0.2em] uppercase text-[#6E6151] mb-5 font-semibold">Filters</h3>
              <div className="space-y-4">
                {filters.map((f) => (
                  <div key={f.id} className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input type="checkbox" checked={f.enabled} onChange={() => toggleFilter(f.id)} className="sr-only peer" />
                        <div className="w-4 h-4 border-2 border-[#A39276]/40 peer-checked:bg-[#6E6151] peer-checked:border-[#6E6151] transition-all flex items-center justify-center">
                          {f.enabled && (<svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>)}
                        </div>
                      </div>
                      <span className="text-sm text-[#111111] font-medium group-hover:text-[#6E6151] transition-colors">{f.name}</span>
                    </label>
                    <p className="text-xs text-[#A39276] ml-7">{f.description}</p>
                    {f.enabled && Object.keys(f.params).length > 0 && (
                      <div className="ml-7 space-y-2 mt-2">
                        {Object.entries(f.params).map(([key, val]) => (
                          <div key={key} className="flex items-center gap-2">
                            <label className="text-xs text-[#726556] w-24">{key.replace(/_/g, " ")}</label>
                            <input type="number" value={val} onChange={(e) => updateParam(f.id, key, parseFloat(e.target.value) || 0)} className="w-20 bg-[#DDBFA2] border border-[#A39276]/20 px-2 py-1 text-xs text-[#070301] focus:border-[#6E6151] outline-none transition-colors" step="0.5" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="card-luxury p-6">
              <h3 className="text-xs tracking-[0.2em] uppercase text-[#6E6151] mb-5 font-semibold">Signal</h3>
              <div className="space-y-1">
                {(["all", "BUY", "WATCH", "HOLD", "AVOID"] as const).map((mode) => (
                  <button key={mode} onClick={() => setFilterMode(mode)} className={`w-full text-left px-3 py-2 text-sm font-medium transition-colors ${filterMode === mode ? "bg-[#6E6151]/15 text-[#6E6151]" : "text-[#726556] hover:text-[#281F17]"}`}>
                    {mode === "all" ? `Semua (${results.length})` : mode}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="card-luxury p-6">
              {!loaded ? (
                <div className="text-center text-[#A39276] py-12">Loading...</div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-serif text-xl text-[#111111] font-bold">
                      Results <span className="text-[#726556] font-normal">({filtered.length})</span>
                    </h2>
                    {results.length > 0 && (<span className="text-xs text-[#A39276]">{filters.filter((f) => f.enabled).length} filters aktif</span>)}
                  </div>
                  <StockTable results={filtered} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
