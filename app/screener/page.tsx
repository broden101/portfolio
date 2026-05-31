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
      const updated = prev.map((f) =>
        f.id === id ? { ...f, enabled: !f.enabled } : f
      );
      const settings = getSettings();
      saveSettings({ ...settings, defaultFilters: updated });
      return updated;
    });
  };

  const updateParam = (filterId: string, param: string, value: number) => {
    setFilters((prev) => {
      const updated = prev.map((f) =>
        f.id === filterId
          ? { ...f, params: { ...f.params, [param]: value } }
          : f
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
    const rescreened = screenAll(
      results as unknown as import("@/lib/types").StockData[],
      filters
    );
    setResults(rescreened);
  };

  const [filterMode, setFilterMode] = useState<"all" | ScreenResult["action"]>("all");
  const filtered =
    filterMode === "all" ? results : results.filter((r) => r.action === filterMode);

  const buys = results.filter((r) => r.action === "BUY").length;
  const watches = results.filter((r) => r.action === "WATCH").length;

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="w-8 h-px bg-[#c9a84c]/40" />
              <span className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase">
                IDX Screener
              </span>
            </div>
            <h1 className="font-serif text-3xl text-[#f5f0e8]">
              Stock <span className="text-gold-gradient">Screener</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {results.length > 0 && (
              <button
                onClick={rescreen}
                className="px-4 py-2 border border-[#c9a84c]/30 text-[#c9a84c] text-xs tracking-[0.15em] uppercase hover:border-[#c9a84c]/60 transition-colors"
              >
                Re-screen
              </button>
            )}
            <ScannerButton onResults={setResults} />
          </div>
        </div>

        {/* Universe Toggle */}
        <div className="flex items-center gap-3 mb-8">
          <span className="text-[#f5f0e8]/30 text-xs tracking-wider uppercase">Universe:</span>
          {(["IDX100", "LQ45"] as const).map((u) => (
            <button
              key={u}
              onClick={() => changeUniverse(u)}
              className={`px-4 py-1.5 text-xs tracking-[0.15em] uppercase transition-all ${
                universe === u
                  ? "bg-[#c9a84c]/15 text-[#c9a84c] border border-[#c9a84c]/30"
                  : "border border-[#f5f0e8]/10 text-[#f5f0e8]/30 hover:text-[#f5f0e8]/50"
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
              { label: "Total", value: results.length, color: "text-[#f5f0e8]" },
              { label: "Buy", value: buys, color: "text-[#c9a84c]" },
              { label: "Watch", value: watches, color: "text-blue-400" },
              {
                label: "Filters",
                value: filters.filter((f) => f.enabled).length,
                color: "text-[#f5f0e8]/50",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="border border-[#c9a84c]/8 bg-[#141414] p-4 text-center"
              >
                <div className={`font-serif text-2xl ${s.color}`}>{s.value}</div>
                <div className="text-[#f5f0e8]/25 text-xs tracking-[0.2em] uppercase mt-1">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Main Content */}
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="space-y-6">
            {/* Filter Toggles */}
            <div className="border border-[#c9a84c]/8 bg-[#141414] p-6">
              <h3 className="text-xs tracking-[0.2em] uppercase text-[#c9a84c]/60 mb-4">
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
                        <div className="w-4 h-4 border border-[#c9a84c]/30 peer-checked:bg-[#c9a84c] peer-checked:border-[#c9a84c] transition-all flex items-center justify-center">
                          {f.enabled && (
                            <svg className="w-2.5 h-2.5 text-[#0a0a0a]" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                              <path d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-[#f5f0e8]/60 group-hover:text-[#f5f0e8]/80 transition-colors">
                        {f.name}
                      </span>
                    </label>
                    <p className="text-xs text-[#f5f0e8]/20 ml-7">{f.description}</p>
                    {f.enabled && Object.keys(f.params).length > 0 && (
                      <div className="ml-7 space-y-2 mt-2">
                        {Object.entries(f.params).map(([key, val]) => (
                          <div key={key} className="flex items-center gap-2">
                            <label className="text-xs text-[#f5f0e8]/25 w-24">
                              {key.replace(/_/g, " ")}
                            </label>
                            <input
                              type="number"
                              value={val}
                              onChange={(e) =>
                                updateParam(f.id, key, parseFloat(e.target.value) || 0)
                              }
                              className="w-20 bg-[#0a0a0a] border border-[#c9a84c]/10 px-2 py-1 text-xs text-[#f5f0e8]/70 focus:border-[#c9a84c] outline-none transition-colors"
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

            {/* Quick Filter */}
            <div className="border border-[#c9a84c]/8 bg-[#141414] p-6">
              <h3 className="text-xs tracking-[0.2em] uppercase text-[#c9a84c]/60 mb-4">
                Signal
              </h3>
              <div className="space-y-1">
                {(["all", "BUY", "WATCH", "HOLD", "AVOID"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setFilterMode(mode)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      filterMode === mode
                        ? "bg-[#c9a84c]/10 text-[#c9a84c]"
                        : "text-[#f5f0e8]/30 hover:text-[#f5f0e8]/50"
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
            <div className="border border-[#c9a84c]/8 bg-[#141414] p-6">
              {!loaded ? (
                <div className="text-center text-[#f5f0e8]/30 py-12">Loading...</div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-serif text-lg text-[#f5f0e8]">
                      Results{" "}
                      <span className="text-[#f5f0e8]/30">({filtered.length})</span>
                    </h2>
                    {results.length > 0 && (
                      <span className="text-xs text-[#f5f0e8]/20">
                        {filters.filter((f) => f.enabled).length} filters aktif
                      </span>
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
