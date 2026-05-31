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
    if (cached.length > 0) {
      setResults(cached as unknown as ScreenResult[]);
    }
    setLoaded(true);
  }, []);

  const toggleFilter = (id: string) => {
    setFilters((prev) => {
      const updated = prev.map((f) => f.id === id ? { ...f, enabled: !f.enabled } : f);
      const settings = getSettings();
      saveSettings({ ...settings, defaultFilters: updated });
      return updated;
    });
  };

  const updateParam = (filterId: string, param: string, value: number) => {
    setFilters((prev) => {
      const updated = prev.map((f) =>
        f.id === filterId ? { ...f, params: { ...f.params, [param]: value } } : f
      );
      const settings = getSettings();
      saveSettings({ ...settings, defaultFilters: updated });
      return updated;
    });
  };

  const changeUniverse = (u: "IDX100" | "LQ45") => {
    setUniverse(u);
    const settings = getSettings();
    saveSettings({ ...settings, universe: u });
  };

  const rescreen = async () => {
    if (results.length === 0) return;
    const { screenAll } = await import("@/lib/screener");
    const rescreened = screenAll(results as unknown as import("@/lib/types").StockData[], filters);
    setResults(rescreened);
  };

  const [filterMode, setFilterMode] = useState<"all" | ScreenResult["action"]>("all");
  const filtered = filterMode === "all" ? results : results.filter((r) => r.action === filterMode);

  const buys = results.filter((r) => r.action === "BUY").length;
  const watches = results.filter((r) => r.action === "WATCH").length;

  return (
    <div className="min-h-screen bg-[#faf7f2] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="w-8 h-px bg-[#b8922d]/40" />
              <span className="text-[#b8922d] text-xs tracking-[0.3em] uppercase">IDX Screener</span>
            </div>
            <h1 className="font-serif text-3xl text-[#1a1a1a]">
              Stock <span className="text-gold-gradient">Screener</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {results.length > 0 && (
              <button onClick={rescreen} className="px-4 py-2 border border-[#b8922d]/30 text-[#b8922d] text-xs tracking-[0.15em] uppercase hover:border-[#b8922d]/60 transition-colors">
                Re-screen
              </button>
            )}
            <ScannerButton onResults={setResults} />
          </div>
        </div>

        {/* Universe Toggle */}
        <div className="flex items-center gap-3 mb-8">
          <span className="text-[#999999] text-xs tracking-wider uppercase">Universe:</span>
          {(["IDX100", "LQ45"] as const).map((u) => (
            <button
              key={u}
              onClick={() => changeUniverse(u)}
              className={`px-4 py-1.5 text-xs tracking-[0.15em] uppercase transition-all ${
                universe === u
                  ? "bg-[#b8922d]/10 text-[#b8922d] border border-[#b8922d]/30"
                  : "border border-[#d0c8b8] text-[#999999] hover:text-[#6b6b6b]"
              }`}
            >
              {u}
            </button>
          ))}
        </div>

        {/* Stats Bar */}
        {results.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total", value: results.length, color: "text-[#1a1a1a]" },
              { label: "Buy", value: buys, color: "text-[#b8922d]" },
              { label: "Watch", value: watches, color: "text-blue-600" },
              { label: "Filters", value: filters.filter((f) => f.enabled).length, color: "text-[#6b6b6b]" },
            ].map((s) => (
              <div key={s.label} className="bg-white border border-[#b8922d]/10 p-4 text-center">
                <div className={`font-serif text-2xl ${s.color}`}>{s.value}</div>
                <div className="text-[#999999] text-xs tracking-[0.2em] uppercase mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Main Content */}
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="space-y-6">
            <div className="bg-white border border-[#b8922d]/10 p-6">
              <h3 className="text-xs tracking-[0.2em] uppercase text-[#b8922d] mb-4">Filters</h3>
              <div className="space-y-4">
                {filters.map((f) => (
                  <div key={f.id} className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input type="checkbox" checked={f.enabled} onChange={() => toggleFilter(f.id)} className="sr-only peer" />
                        <div className="w-4 h-4 border border-[#d0c8b8] peer-checked:bg-[#b8922d] peer-checked:border-[#b8922d] transition-all flex items-center justify-center">
                          {f.enabled && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                              <path d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-[#555555] group-hover:text-[#1a1a1a] transition-colors">{f.name}</span>
                    </label>
                    <p className="text-xs text-[#bbbbbb] ml-7">{f.description}</p>
                    {f.enabled && Object.keys(f.params).length > 0 && (
                      <div className="ml-7 space-y-2 mt-2">
                        {Object.entries(f.params).map(([key, val]) => (
                          <div key={key} className="flex items-center gap-2">
                            <label className="text-xs text-[#999999] w-24">{key.replace(/_/g, " ")}</label>
                            <input
                              type="number"
                              value={val}
                              onChange={(e) => updateParam(f.id, key, parseFloat(e.target.value) || 0)}
                              className="w-20 bg-[#f5f0e8] border border-[#d0c8b8] px-2 py-1 text-xs text-[#333333] focus:border-[#b8922d] outline-none transition-colors"
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

            <div className="bg-white border border-[#b8922d]/10 p-6">
              <h3 className="text-xs tracking-[0.2em] uppercase text-[#b8922d] mb-4">Signal</h3>
              <div className="space-y-1">
                {(["all", "BUY", "WATCH", "HOLD", "AVOID"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setFilterMode(mode)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      filterMode === mode
                        ? "bg-[#b8922d]/10 text-[#b8922d]"
                        : "text-[#999999] hover:text-[#555555]"
                    }`}
                  >
                    {mode === "all" ? `Semua (${results.length})` : mode}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="lg:col-span-3">
            <div className="bg-white border border-[#b8922d]/10 p-6">
              {!loaded ? (
                <div className="text-center text-[#999999] py-12">Loading...</div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-serif text-lg text-[#1a1a1a]">
                      Results <span className="text-[#999999]">({filtered.length})</span>
                    </h2>
                    {results.length > 0 && (
                      <span className="text-xs text-[#bbbbbb]">{filters.filter((f) => f.enabled).length} filters aktif</span>
                    )}
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
