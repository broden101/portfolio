"use client";

import { useState, useCallback } from "react";
import { STOCK_UNIVERSES } from "@/lib/types";
import { getSettings, cacheResults } from "@/lib/storage";
import { screenAll } from "@/lib/screener";
import type { StockData, ScreenResult } from "@/lib/types";

interface Props {
  onResults: (results: ScreenResult[]) => void;
  onLoading?: (loading: boolean) => void;
}

export function ScannerButton({ onResults, onLoading }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runScan = useCallback(async () => {
    setLoading(true);
    onLoading?.(true);
    setError(null);

    try {
      const settings = getSettings();
      let tickers: string[];

      if (settings.universe === "CUSTOM") {
        tickers = settings.customTickers;
      } else {
        tickers = STOCK_UNIVERSES[settings.universe] || STOCK_UNIVERSES.IDX100;
      }

      if (tickers.length === 0) {
        setError("Tidak ada ticker. Cek Settings.");
        return;
      }

      const res = await fetch("/api/scanner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tickers }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const { data } = await res.json();
      const results = screenAll(data as StockData[], settings.defaultFilters);
      cacheResults(results as unknown as Record<string, unknown>[]);
      onResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan gagal");
    } finally {
      setLoading(false);
      onLoading?.(false);
    }
  }, [onResults, onLoading]);

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={runScan}
        disabled={loading}
        className="px-6 py-2.5 bg-[#c9a84c] text-[#0a0a0a] text-xs tracking-[0.2em] uppercase font-medium hover:bg-[#dfc06e] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Scanning...
          </span>
        ) : (
          "Run Screener"
        )}
      </button>
      {error && <span className="text-sm text-red-400">{error}</span>}
    </div>
  );
}
