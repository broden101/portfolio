"use client";

import type { ScreenResult } from "@/lib/types";

interface Props {
  results: ScreenResult[];
  compact?: boolean;
}

function Badge({ action }: { action: ScreenResult["action"] }) {
  const colors: Record<string, string> = {
    BUY: "bg-[#c9a84c]/15 text-[#c9a84c] border border-[#c9a84c]/30",
    WATCH: "bg-blue-500/15 text-blue-400 border border-blue-400/30",
    HOLD: "bg-[#f5f0e8]/10 text-[#f5f0e8]/50 border border-[#f5f0e8]/20",
    AVOID: "bg-red-500/15 text-red-400 border border-red-400/30",
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-medium tracking-wider uppercase ${colors[action]}`}>
      {action}
    </span>
  );
}

function VolRatio({ vol, avg }: { vol: number; avg: number }) {
  if (!avg || avg <= 0) return <span className="text-[#f5f0e8]/20">—</span>;
  const ratio = vol / avg;
  const icon = ratio >= 1.5 ? "🔥" : ratio >= 1 ? "✅" : ratio >= 0.5 ? "⚠️" : "💤";
  return (
    <span className="text-[#f5f0e8]/60">
      {icon} {ratio.toFixed(1)}×
    </span>
  );
}

export function StockTable({ results, compact }: Props) {
  if (results.length === 0) {
    return (
      <div className="text-center text-[#f5f0e8]/30 py-12 text-sm">
        Belum ada hasil. Jalankan screener untuk scan saham.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#c9a84c]/10 text-left text-xs tracking-[0.15em] uppercase text-[#f5f0e8]/30">
            <th className="pb-3 pr-4">Ticker</th>
            <th className="pb-3 pr-4">Signal</th>
            <th className="pb-3 pr-4 text-right">Harga</th>
            <th className="pb-3 pr-4 text-right">Chg</th>
            <th className="pb-3 pr-4 text-right">MCap</th>
            {!compact && (
              <>
                <th className="pb-3 pr-4 text-right">Vol Ratio</th>
                <th className="pb-3 pr-4 text-right">VWAP</th>
                <th className="pb-3 pr-4 text-right">1M</th>
                <th className="pb-3 pr-4 text-right">3M</th>
                <th className="pb-3 pr-4 text-right">Score</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr
              key={r.name}
              className="border-b border-[#c9a84c]/5 hover:bg-[#c9a84c]/[0.03] transition-colors"
            >
              <td className="py-3 pr-4">
                <span className="font-medium text-[#c9a84c]">{r.name}</span>
                <div className="text-xs text-[#f5f0e8]/25 truncate max-w-[120px]">
                  {r.desc}
                </div>
              </td>
              <td className="py-3 pr-4">
                <Badge action={r.action} />
                <div className="text-xs text-[#f5f0e8]/20 mt-1">{r.status}</div>
              </td>
              <td className="py-3 pr-4 text-right font-mono text-[#f5f0e8]/70">
                {(r.close || 0).toLocaleString("id-ID")}
              </td>
              <td className="py-3 pr-4 text-right">
                <span className={(r.change || 0) >= 0 ? "text-emerald-400" : "text-red-400"}>
                  {(r.change || 0) >= 0 ? "+" : ""}
                  {(r.change || 0).toFixed(2)}%
                </span>
              </td>
              <td className="py-3 pr-4 text-right text-[#f5f0e8]/40">
                {r.mcap ? `${(r.mcap / 1e12).toFixed(0)}T` : "—"}
              </td>
              {!compact && (
                <>
                  <td className="py-3 pr-4 text-right">
                    <VolRatio vol={r.volume || 0} avg={r.avg_vol_10d || 0} />
                  </td>
                  <td className="py-3 pr-4 text-right text-[#f5f0e8]/40 font-mono">
                    {(r.vwap || 0).toLocaleString("id-ID")}
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <span className={(r.perf1m || 0) >= 0 ? "text-emerald-400" : "text-red-400"}>
                      {(r.perf1m || 0) >= 0 ? "+" : ""}
                      {(r.perf1m || 0).toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <span className={(r.perf3m || 0) >= 0 ? "text-emerald-400" : "text-red-400"}>
                      {(r.perf3m || 0) >= 0 ? "+" : ""}
                      {(r.perf3m || 0).toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      {[...Array(10)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-3 rounded-sm ${
                            i < r.trend_score ? "bg-[#c9a84c]" : "bg-[#f5f0e8]/8"
                          }`}
                        />
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
