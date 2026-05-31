"use client";

import type { ScreenResult } from "@/lib/types";

interface Props { results: ScreenResult[]; compact?: boolean; }

function Badge({ action }: { action: ScreenResult["action"] }) {
  const colors: Record<string, string> = {
    BUY: "bg-[#9A7A3F]/15 text-[#3A2C1A] border border-[#9A7A3F]/30",
    WATCH: "bg-blue-50 text-blue-700 border border-blue-200",
    HOLD: "bg-[#E7DDCC] text-[#6F6252] border border-[#C8B89B]",
    AVOID: "bg-red-50 text-red-700 border border-red-200",
  };
  return <span className={`px-2.5 py-0.5 text-xs font-semibold tracking-wider uppercase ${colors[action]}`}>{action}</span>;
}

function VolRatio({ vol, avg }: { vol: number; avg: number }) {
  if (!avg || avg <= 0) return <span className="text-[#C8B89B]">—</span>;
  const ratio = vol / avg;
  const icon = ratio >= 1.5 ? "🔥" : ratio >= 1 ? "✅" : ratio >= 0.5 ? "⚠️" : "💤";
  return <span className="text-[#6F6252]">{icon} {ratio.toFixed(1)}×</span>;
}

export function StockTable({ results, compact }: Props) {
  if (results.length === 0) {
    return <div className="text-center text-[#9A7A3F] py-12 text-sm">No results yet. Run the screener to scan stocks.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-[#9A7A3F]/20 text-left text-xs tracking-[0.15em] uppercase text-[#6F6252]">
            <th className="pb-3 pr-4 font-semibold">Ticker</th>
            <th className="pb-3 pr-4 font-semibold">Signal</th>
            <th className="pb-3 pr-4 text-right font-semibold">Price</th>
            <th className="pb-3 pr-4 text-right font-semibold">Chg</th>
            <th className="pb-3 pr-4 text-right font-semibold">MCap</th>
            {!compact && (<>
              <th className="pb-3 pr-4 text-right font-semibold">Vol Ratio</th>
              <th className="pb-3 pr-4 text-right font-semibold">VWAP</th>
              <th className="pb-3 pr-4 text-right font-semibold">1M</th>
              <th className="pb-3 pr-4 text-right font-semibold">3M</th>
              <th className="pb-3 pr-4 text-right font-semibold">Score</th>
            </>)}
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.name} className="border-b border-[#C8B89B]/50 hover:bg-[#9A7A3F]/[0.05] transition-colors">
              <td className="py-3 pr-4">
                <span className="font-bold text-[#9A7A3F]">{r.name}</span>
                <div className="text-xs text-[#C8B89B] truncate max-w-[120px]">{r.desc}</div>
              </td>
              <td className="py-3 pr-4">
                <Badge action={r.action} />
                <div className="text-xs text-[#9A7A3F]/60 mt-1">{r.status}</div>
              </td>
              <td className="py-3 pr-4 text-right font-mono font-medium text-[#111111]">
                {(r.close || 0).toLocaleString("id-ID")}
              </td>
              <td className="py-3 pr-4 text-right">
                <span className={(r.change || 0) >= 0 ? "text-emerald-700 font-medium" : "text-red-600 font-medium"}>
                  {(r.change || 0) >= 0 ? "+" : ""}{(r.change || 0).toFixed(2)}%
                </span>
              </td>
              <td className="py-3 pr-4 text-right text-[#6F6252]">
                {r.mcap ? `${(r.mcap / 1e12).toFixed(0)}T` : "—"}
              </td>
              {!compact && (<>
                <td className="py-3 pr-4 text-right"><VolRatio vol={r.volume || 0} avg={r.avg_vol_10d || 0} /></td>
                <td className="py-3 pr-4 text-right text-[#6F6252] font-mono">{(r.vwap || 0).toLocaleString("id-ID")}</td>
                <td className="py-3 pr-4 text-right">
                  <span className={(r.perf1m || 0) >= 0 ? "text-emerald-700 font-medium" : "text-red-600 font-medium"}>
                    {(r.perf1m || 0) >= 0 ? "+" : ""}{(r.perf1m || 0).toFixed(1)}%
                  </span>
                </td>
                <td className="py-3 pr-4 text-right">
                  <span className={(r.perf3m || 0) >= 0 ? "text-emerald-700 font-medium" : "text-red-600 font-medium"}>
                    {(r.perf3m || 0) >= 0 ? "+" : ""}{(r.perf3m || 0).toFixed(1)}%
                  </span>
                </td>
                <td className="py-3 pr-4 text-right">
                  <div className="flex items-center justify-end gap-0.5">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className={`w-1.5 h-3 rounded-sm ${i < r.trend_score ? "bg-[#9A7A3F]" : "bg-[#C8B89B]/40"}`} />
                    ))}
                  </div>
                </td>
              </>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
