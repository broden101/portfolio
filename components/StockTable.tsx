"use client";

import type { ScreenResult } from "@/lib/types";

interface Props { results: ScreenResult[]; compact?: boolean; }

function Badge({ action }: { action: ScreenResult["action"] }) {
  const colors: Record<string, string> = {
    BUY: "bg-[#C6A15B]/15 text-[#C6A15B] border border-[#C6A15B]/30",
    WATCH: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    HOLD: "bg-[#B8AA96]/10 text-[#B8AA96] border border-[#2C261E]",
    AVOID: "bg-red-500/10 text-red-400 border border-red-500/20",
  };
  return <span className={`px-2.5 py-0.5 text-xs font-semibold tracking-wider uppercase ${colors[action]}`}>{action}</span>;
}

function VolRatio({ vol, avg }: { vol: number; avg: number }) {
  if (!avg || avg <= 0) return <span className="text-[#2C261E]">—</span>;
  const ratio = vol / avg;
  const icon = ratio >= 1.5 ? "🔥" : ratio >= 1 ? "✅" : ratio >= 0.5 ? "⚠️" : "💤";
  return <span className="text-[#B8AA96]">{icon} {ratio.toFixed(1)}×</span>;
}

export function StockTable({ results, compact }: Props) {
  if (results.length === 0) {
    return <div className="text-center text-[#B8AA96]/40 py-12 text-sm">No results yet. Run the screener to scan stocks.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#2C261E] text-left text-xs tracking-[0.15em] uppercase text-[#B8AA96]/60">
            <th className="pb-3 pr-4 font-medium">Ticker</th>
            <th className="pb-3 pr-4 font-medium">Signal</th>
            <th className="pb-3 pr-4 text-right font-medium">Price</th>
            <th className="pb-3 pr-4 text-right font-medium">Chg</th>
            <th className="pb-3 pr-4 text-right font-medium">MCap</th>
            {!compact && (
              <>
                <th className="pb-3 pr-4 text-right font-medium">Vol Ratio</th>
                <th className="pb-3 pr-4 text-right font-medium">VWAP</th>
                <th className="pb-3 pr-4 text-right font-medium">1M</th>
                <th className="pb-3 pr-4 text-right font-medium">3M</th>
                <th className="pb-3 pr-4 text-right font-medium">Score</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.name} className="border-b border-[#2C261E]/50 hover:bg-[#C6A15B]/[0.03] transition-colors">
              <td className="py-3 pr-4">
                <span className="font-semibold text-[#C6A15B]">{r.name}</span>
                <div className="text-xs text-[#B8AA96]/40 truncate max-w-[120px]">{r.desc}</div>
              </td>
              <td className="py-3 pr-4">
                <Badge action={r.action} />
                <div className="text-xs text-[#B8AA96]/30 mt-1">{r.status}</div>
              </td>
              <td className="py-3 pr-4 text-right font-mono text-[#F4EFE6]">
                {(r.close || 0).toLocaleString("id-ID")}
              </td>
              <td className="py-3 pr-4 text-right">
                <span className={(r.change || 0) >= 0 ? "text-emerald-400" : "text-red-400"}>
                  {(r.change || 0) >= 0 ? "+" : ""}{(r.change || 0).toFixed(2)}%
                </span>
              </td>
              <td className="py-3 pr-4 text-right text-[#B8AA96]">
                {r.mcap ? `${(r.mcap / 1e12).toFixed(0)}T` : "—"}
              </td>
              {!compact && (
                <>
                  <td className="py-3 pr-4 text-right"><VolRatio vol={r.volume || 0} avg={r.avg_vol_10d || 0} /></td>
                  <td className="py-3 pr-4 text-right text-[#B8AA96] font-mono">{(r.vwap || 0).toLocaleString("id-ID")}</td>
                  <td className="py-3 pr-4 text-right">
                    <span className={(r.perf1m || 0) >= 0 ? "text-emerald-400" : "text-red-400"}>
                      {(r.perf1m || 0) >= 0 ? "+" : ""}{(r.perf1m || 0).toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <span className={(r.perf3m || 0) >= 0 ? "text-emerald-400" : "text-red-400"}>
                      {(r.perf3m || 0) >= 0 ? "+" : ""}{(r.perf3m || 0).toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      {[...Array(10)].map((_, i) => (
                        <div key={i} className={`w-1.5 h-3 rounded-sm ${i < r.trend_score ? "bg-[#C6A15B]" : "bg-[#2C261E]"}`} />
                      ))}
                    </div>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
