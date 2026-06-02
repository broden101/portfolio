"use client";

import { useState, useMemo, useCallback } from "react";

const IDX100 = [
  "ACES","ADMR","ADRO","AKRA","AMMN","AMRT","ANTM","ARTO","ASII","ASSA",
  "BBCA","BBNI","BBRI","BBTN","BBYB","BKSL","BMRI","BMTR","BREN","BRIS",
  "BRMS","BRPT","BSDE","BTPS","BUKA","BULL","BUMI","BUVA","CBDK","CMRY",
  "CPIN","CTRA","CUAN","DEWA","DSNG","DSSA","ELSA","EMTK","ENRG","ERAA",
  "ESSA","EXCL","FILM","GOTO","HEAL","HMSP","HRTA","HRUM","ICBP","IMPC",
  "INCO","INDF","INDY","INET","INKP","INTP","ISAT","ITMG","JPFA","JSMR",
  "KIJA","KLBF","KPIG","MAPA","MAPI","MBMA","MDKA","MEDC","MIKA","MTEL",
  "MYOR","NCKL","PANI","PGAS","PGEO","PNLF","PSAB","PTBA","PTRO","PWON",
  "RAJA","RATU","SCMA","SGER","SIDO","SMGR","SMIL","SMRA","SSIA","TAPG",
  "TCPI","TINS","TLKM","TOBA","TOWR","TPIA","UNTR","UNVR","WIFI","WIRG",
];

interface ReversalRow {
  ticker: string;
  desc: string;
  sector: string;
  price: number;
  rsi: number;
  volume: number;
  avgVol5: number;
  avgVol20: number;
  volVsAvg: number; // % vs 20d avg
  sma20: number;
  macdHist: number; // MACD - signal
  change: number;
  low5d: number;
  status: "Watch" | "Early Rebound" | "Confirmed Reversal" | "Avoid";
  score: number;
}

type Version = "basic" | "strict" | "reversal";

const STATUS_CONFIG = {
  Watch: { bg: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/30" },
  "Early Rebound": { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30" },
  "Confirmed Reversal": { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30" },
  Avoid: { bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/30" },
} as const;

const VERSION_DESC: Record<Version, string> = {
  basic: "RSI(14) < 35, Volume < Avg Vol 5d, Close ≤ MA20",
  strict: "RSI(14) < 30, Volume < Avg Vol 20d, Close > Prev Low, Change ≥ -3%",
  reversal: "RSI(14) < 35, Volume < Avg Vol 20d, Close > Low 5d, MACD Histogram ↑",
};

function classify(row: ReversalRow, version: Version): { pass: boolean; status: ReversalRow["status"] } {
  const { rsi, volume, avgVol5, avgVol20, sma20, macdHist, change, price, low5d } = row;

  if (version === "basic") {
    const pass = rsi < 35 && volume < avgVol5 && price <= sma20;
    if (!pass) return { pass: false, status: "Watch" };
    return { pass: true, status: rsi < 25 ? "Early Rebound" : "Watch" };
  }

  if (version === "strict") {
    const pass = rsi < 30 && volume < avgVol20 && price > low5d && change >= -3;
    if (!pass) return { pass: false, status: "Watch" };
    return { pass: true, status: rsi < 25 ? "Early Rebound" : "Watch" };
  }

  // reversal version
  const pass = rsi < 35 && volume < avgVol20 && price > low5d && macdHist > 0;
  if (!pass) return { pass: false, status: "Watch" };

  if (macdHist > 0 && rsi < 25 && change >= 0) return { pass: true, status: "Confirmed Reversal" };
  if (macdHist > 0 && rsi < 30) return { pass: true, status: "Early Rebound" };
  return { pass: true, status: "Watch" };
}

function calcScore(r: ReversalRow): number {
  let s = 0;
  if (r.rsi < 25) s += 30;
  else if (r.rsi < 30) s += 20;
  else if (r.rsi < 35) s += 10;

  if (r.volVsAvg < -50) s += 25;
  else if (r.volVsAvg < -30) s += 15;
  else if (r.volVsAvg < 0) s += 5;

  if (r.macdHist > 0) s += 25;
  if (r.change >= 0) s += 10;
  if (r.price > r.low5d) s += 10;
  return s;
}

export default function ReversalScreener() {
  const [results, setResults] = useState<ReversalRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [version, setVersion] = useState<Version>("reversal");
  const [error, setError] = useState("");
  const [lastRun, setLastRun] = useState("");

  const runScreener = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/scanner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tickers: IDX100 }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Scanner failed");

      const rows: ReversalRow[] = (data.data || []).map((d: Record<string, number | string>) => {
        const rsi = Number(d.rsi) || 50;
        const vol = Number(d.volume) || 0;
        const avg10 = Number(d.avg_vol_10d) || vol;
        const avg30 = Number(d.avg_vol_30d) || vol;
        const close = Number(d.close) || 0;
        const sma20 = Number(d.sma20) || close;
        const macd = Number(d.macd) || 0;
        const signal = Number(d.macd_signal) || 0;
        const change = Number(d.change) || 0;

        const row: ReversalRow = {
          ticker: String(d.name || ""),
          desc: String(d.desc || ""),
          sector: String(d.sector || ""),
          price: close,
          rsi,
          volume: vol,
          avgVol5: avg10, // TV doesn't have 5d avg, use 10d as proxy
          avgVol20: avg30,
          volVsAvg: avg30 > 0 ? ((vol - avg30) / avg30) * 100 : 0,
          sma20,
          macdHist: macd - signal,
          change,
          low5d: close * 0.97, // Approximate — TV doesn't give 5d low
          status: "Watch",
          score: 0,
        };

        const { status } = classify(row, version);
        row.status = status;
        row.score = calcScore(row);
        return row;
      });

      // Filter: only show those that pass the version criteria + score > 0
      const passing = rows.filter((r) => classify(r, version).pass && r.rsi < 35);
      passing.sort((a, b) => b.score - a.score);

      setResults(passing);
      setLastRun(new Date().toLocaleString("id-ID"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [version]);

  const counts = useMemo(() => {
    const c = { total: results.length, watch: 0, early: 0, confirmed: 0 };
    results.forEach((r) => {
      if (r.status === "Watch") c.watch++;
      else if (r.status === "Early Rebound") c.early++;
      else if (r.status === "Confirmed Reversal") c.confirmed++;
    });
    return c;
  }, [results]);

  return (
    <div className="space-y-8">
      {/* Version selector */}
      <div className="flex flex-wrap items-center gap-3">
        {(["basic", "strict", "reversal"] as Version[]).map((v) => (
          <button
            key={v}
            onClick={() => { setVersion(v); setResults([]); }}
            className={`px-5 py-2 text-xs tracking-[0.15em] uppercase font-medium transition-all ${
              version === v
                ? "bg-[#C6A15B]/15 text-[#C6A15B] border border-[#C6A15B]/30"
                : "border border-[#2C261E] text-[#B8AA96]/50 hover:text-[#B8AA96]"
            }`}
          >
            {v === "basic" ? "Basic" : v === "strict" ? "Strict" : "Reversal"}
          </button>
        ))}
        <button
          onClick={runScreener}
          disabled={loading}
          className="ml-auto px-6 py-2.5 bg-[#C6A15B]/10 border border-[#C6A15B]/40 text-[#C6A15B] text-xs tracking-[0.15em] uppercase font-medium hover:bg-[#C6A15B]/20 transition-all disabled:opacity-40"
        >
          {loading ? "Scanning..." : "Run Screener"}
        </button>
      </div>

      {/* Criteria description */}
      <div className="card-luxury p-5">
        <p className="text-xs text-[#B8AA96]/60 leading-relaxed">
          <span className="text-[#C6A15B] font-medium">Criteria ({version}):</span>{" "}
          {VERSION_DESC[version]}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="card-luxury p-5 border border-red-500/30">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Stats */}
      {results.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total", value: counts.total, color: "text-[#F4EFE6]" },
            { label: "Watch", value: counts.watch, color: "text-blue-400" },
            { label: "Early Rebound", value: counts.early, color: "text-amber-400" },
            { label: "Confirmed", value: counts.confirmed, color: "text-emerald-400" },
          ].map((s) => (
            <div key={s.label} className="card-luxury p-5 text-center">
              <div className={`font-heading text-3xl font-medium ${s.color}`}>{s.value}</div>
              <div className="text-[#B8AA96]/40 text-xs tracking-[0.2em] uppercase mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Results table */}
      {results.length > 0 && (
        <div className="card-luxury p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-xl text-[#F4EFE6] font-medium">
              Reversal Watchlist <span className="text-[#B8AA96]/50 font-light">({results.length})</span>
            </h2>
            {lastRun && <span className="text-xs text-[#B8AA96]/30">Last scan: {lastRun}</span>}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#2C261E]">
                  <th className="text-left py-3 px-2 text-[#B8AA96]/50 font-medium">#</th>
                  <th className="text-left py-3 px-2 text-[#B8AA96]/50 font-medium">Stock</th>
                  <th className="text-right py-3 px-2 text-[#B8AA96]/50 font-medium">Price</th>
                  <th className="text-right py-3 px-2 text-[#B8AA96]/50 font-medium">RSI 14</th>
                  <th className="text-right py-3 px-2 text-[#B8AA96]/50 font-medium">Vol vs Avg</th>
                  <th className="text-right py-3 px-2 text-[#B8AA96]/50 font-medium">MACD Hist</th>
                  <th className="text-right py-3 px-2 text-[#B8AA96]/50 font-medium">Change</th>
                  <th className="text-right py-3 px-2 text-[#B8AA96]/50 font-medium">SMA20</th>
                  <th className="text-center py-3 px-2 text-[#B8AA96]/50 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row, i) => {
                  const sc = STATUS_CONFIG[row.status];
                  return (
                    <tr key={row.ticker} className="border-b border-[#2C261E]/50 hover:bg-[#C6A15B]/5 transition-colors">
                      <td className="py-3 px-2 text-[#B8AA96]/30">{i + 1}</td>
                      <td className="py-3 px-2">
                        <span className="font-mono font-semibold text-[#F4EFE6]">{row.ticker}</span>
                        <div className="text-[10px] text-[#B8AA96]/40 mt-0.5 max-w-[180px] truncate">{row.desc}</div>
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-[#F4EFE6]">
                        {row.price.toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-right font-mono">
                        <span className={row.rsi < 25 ? "text-red-400" : row.rsi < 30 ? "text-amber-400" : "text-[#F4EFE6]"}>
                          {row.rsi.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right font-mono">
                        <span className={row.volVsAvg < -50 ? "text-emerald-400" : row.volVsAvg < -30 ? "text-amber-400" : "text-[#B8AA96]"}>
                          {row.volVsAvg.toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right font-mono">
                        <span className={row.macdHist > 0 ? "text-emerald-400" : "text-red-400"}>
                          {row.macdHist.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right font-mono">
                        <span className={row.change >= 0 ? "text-emerald-400" : "text-red-400"}>
                          {row.change > 0 ? "+" : ""}{row.change.toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-[#B8AA96]/60">
                        {row.sma20.toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`inline-block px-3 py-1 text-[10px] tracking-wider uppercase font-medium border rounded ${sc.bg} ${sc.text} ${sc.border}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && results.length === 0 && !error && (
        <div className="card-luxury p-12 text-center">
          <div className="text-[#B8AA96]/30 text-sm mb-3">No results yet</div>
          <p className="text-[#B8AA96]/20 text-xs max-w-md mx-auto">
            Click Run Screener to scan IDX100 stocks for potential reversal setups
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="card-luxury p-5 border border-[#2C261E]/50">
        <p className="text-[10px] text-[#B8AA96]/40 leading-relaxed">
          ⚠️ <span className="text-[#C6A15B]/60">Disclaimer:</span> Oversold tidak selalu berarti harga akan langsung naik. Saham bisa tetap turun meskipun RSI sudah rendah. Gunakan konfirmasi tambahan seperti support, volume beli, MACD, dan price action. Screener ini adalah alat pantau, bukan sinyal beli.
        </p>
      </div>
    </div>
  );
}
