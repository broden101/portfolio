"use client";

import type { ScreenResult } from "@/lib/types";

interface Props {
  results: ScreenResult[];
  compact?: boolean;
}

function Badge({ action }: { action: ScreenResult["action"] }) {
  const colors: Record<string, string> = {
    BUY: "bg-[#b8922d]/15 text-[#8a6914] border border-[#b8922d]/30",
    WATCH: "bg-blue-500/10 text-blue-600 border border-blue-300/40",
    HOLD: "bg-[#1a1a1a]/5 text-[#6b6b6b] border border-[#1a1a1a]/10",
    AVOID: "bg-red-500/10 text-red-600 border border-red-300/40",
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-medium tracking-wider uppercase ${colors[action]}`}>
      {action}
    </span>
  );
}

function VolRatio({ vol, avg }: { vol: number; avg: number }) {
  if (!avg || avg <= 0) return <span className="text-[#cccccc]">—</span>;
  const ratio = vol / avg;
  const icon = ratio >= 1.5 ? "🔥" : ratio >= 1 ? "✅" : ratio >= 0.5 ? "⚠️" : "💤";
  return <span className="text-[#6b6b6b]">{icon} {ratio.toFixed(1)}×</span>;
}

export function StockTable({ results, compact }: Props) {
  if (results.length === 0) {
    return (
      <div className="text-center text-[#999999] py-12 text-sm">
        Belum ada hasil. Jalankan screener untuk scan saham.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#b8922d]/10 text-left text-xs tracking-[0.15em] uppercase text-[#999999]">
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
            <tr key={r.name} className="border-b border-[#e8e0d0] hover:bg-[#b8922d]/[0.03] transition-colors">
              <td className="py-3 pr-4">
                <span className="font-medium text-[#b8922d]">{r.name}</span>
                <div className="text-xs text-[#999999] truncate max-w-[120px]">{r.desc}</div>
              </td>
              <td className="py-3 pr-4">
                <Badge action={r.action} />
                <div className="text-xs text-[#bbbbbb] mt-1">{r.status}</div>
              </td>
              <td className="py-3 pr-4 text-right font-mono text-[#333333]">
                {(r.close || 0).toLocaleString("id-ID")}
              </td>
              <td className="py-3 pr-4 text-right">
                <span className={(r.change || 0) >= 0 ? "text-emerald-600" : "text-red-500"}>
                  {(r.change || 0) >= 0 ? "+" : ""}{(r.change || 0).toFixed(2)}%
                </span>
              </td>
              <td className="py-3 pr-4 text-right text-[#999999]">
                {r.mcap ? `${(r.mcap / 1e12).toFixed(0)}T` : "—"}
              </td>
              {!compact && (
                <>
                  <td className="py-3 pr-4 text-right"><VolRatio vol={r.volume || 0} avg={r.avg_vol_10d || 0} /></td>
                  <td className="py-3 pr-4 text-right text-[#999999] font-mono">{(r.vwap || 0).toLocaleString("id-ID")}</td>
                  <td className="py-3 pr-4 text-right">
                    <span className={(r.perf1m || 0) >= 0 ? "text-emerald-600" : "text-red-500"}>
                      {(r.perf1m || 0) >= 0 ? "+" : ""}{(r.perf1m || 0).toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <span className={(r.perf3m || 0) >= 0 ? "text-emerald-600" : "text-red-500"}>
                      {(r.perf3m || 0) >= 0 ? "+" : ""}{(r.perf3m || 0).toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      {[...Array(10)].map((_, i) => (
                        <div key={i} className={`w-1.5 h-3 rounded-sm ${i < r.trend_score ? "bg-[#b8922d]" : "bg-[#e0dbd0]"}`} />
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
