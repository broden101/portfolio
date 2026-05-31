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
    <div className="min-h-screen bg-[#FDFAF5] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="w-10 h-px bg-[#8B7335]/40" />
              <span className="text-[#8B7335] text-xs tracking-[0.3em] uppercase font-semibold">IDX Screener</span>
            </div>
            <h1 className="font-serif text-4xl text-[#1C1917] font-bold">
              Stock <span className="text-gold-gradient">Screener</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {results.length > 0 && (
              <button onClick={rescreen} className="px-5 py-2.5 border-2 border-[#8B7335]/30 text-[#8B7335] text-xs tracking-[0.15em] uppercase font-semibold hover:border-[#8B7335] hover:bg-[#8B7335]/5 transition-all">
                Re-screen
              </button>
            )}
            <ScannerButton onResults={setResults} />
          </div>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <span className="text-[#78716C] text-xs tracking-wider uppercase font-medium">Universe:</span>
          {(["IDX100", "LQ45"] as const).map((u) => (
            <button key={u} onClick={() => changeUniverse(u)} className={`px-5 py-1.5 text-xs tracking-[0.15em] uppercase font-semibold transition-all ${universe === u ? "bg-[#8B7335]/10 text-[#8B7335] border border-[#8B7335]/30" : "border border-stone-200 text-[#A8A29E] hover:text-[#78716C]"}`}>
              {u}
            </button>
          ))}
        </div>

        {results.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total", value: results.length, color: "text-[#1C1917]" },
              { label: "Buy", value: buys, color: "text-[#8B7335]" },
              { label: "Watch", value: watches, color: "text-blue-700" },
              { label: "Filters", value: filters.filter((f) => f.enabled).length, color: "text-[#78716C]" },
            ].map((s) => (
              <div key={s.label} className="bg-white border border-[#8B7335]/10 p-5 text-center shadow-sm">
                <div className={`font-serif text-3xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-[#78716C] text-xs tracking-[0.2em] uppercase mt-1 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-8">
          <div className="space-y-6">
            <div className="bg-white border border-[#8B7335]/10 p-6 shadow-sm">
              <h3 className="text-xs tracking-[0.2em] uppercase text-[#8B7335] mb-5 font-semibold">Filters</h3>
              <div className="space-y-4">
                {filters.map((f) => (
                  <div key={f.id} className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input type="checkbox" checked={f.enabled} onChange={() => toggleFilter(f.id)} className="sr-only peer" />
                        <div className="w-4 h-4 border-2 border-stone-300 peer-checked:bg-[#8B7335] peer-checked:border-[#8B7335] transition-all flex items-center justify-center">
                          {f.enabled && (<svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>)}
                        </div>
                      </div>
                      <span className="text-sm text-[#44403C] font-medium group-hover:text-[#1C1917] transition-colors">{f.name}</span>
                    </label>
                    <p className="text-xs text-[#A8A29E] ml-7">{f.description}</p>
                    {f.enabled && Object.keys(f.params).length > 0 && (
                      <div className="ml-7 space-y-2 mt-2">
                        {Object.entries(f.params).map(([key, val]) => (
                          <div key={key} className="flex items-center gap-2">
                            <label className="text-xs text-[#78716C] w-24">{key.replace(/_/g, " ")}</label>
                            <input type="number" value={val} onChange={(e) => updateParam(f.id, key, parseFloat(e.target.value) || 0)} className="w-20 bg-[#F7F2EA] border border-stone-200 px-2 py-1 text-xs text-[#44403C] focus:border-[#8B7335] outline-none transition-colors" step="0.5" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-[#8B7335]/10 p-6 shadow-sm">
              <h3 className="text-xs tracking-[0.2em] uppercase text-[#8B7335] mb-5 font-semibold">Signal</h3>
              <div className="space-y-1">
                {(["all", "BUY", "WATCH", "HOLD", "AVOID"] as const).map((mode) => (
                  <button key={mode} onClick={() => setFilterMode(mode)} className={`w-full text-left px-3 py-2 text-sm font-medium transition-colors ${filterMode === mode ? "bg-[#8B7335]/10 text-[#8B7335]" : "text-[#78716C] hover:text-[#44403C]"}`}>
                    {mode === "all" ? `Semua (${results.length})` : mode}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white border border-[#8B7335]/10 p-6 shadow-sm">
              {!loaded ? (
                <div className="text-center text-[#A8A29E] py-12">Loading...</div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-serif text-xl text-[#1C1917] font-bold">
                      Results <span className="text-[#78716C] font-normal">({filtered.length})</span>
                    </h2>
                    {results.length > 0 && (<span className="text-xs text-[#A8A29E]">{filters.filter((f) => f.enabled).length} filters aktif</span>)}
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
