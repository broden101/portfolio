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

interface BsjpRow {
  ticker: string;
  desc: string;
  sector: string;
  price: number;
  open: number;
  high: number;
  low: number;
  change: number;
  rsi: number;
  volume: number;
  avgVol: number;
  volRatio: number;
  vwap: number;
  aboveVwap: boolean;
  closeNearHigh: boolean;
  score: number;
  risk: "AMAN" | "WASPADA" | "HATI-HATI";
}

const RISK_CONFIG = {
  AMAN: { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30" },
  WASPADA: { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30" },
  "HATI-HATI": { bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/30" },
} as const;

function calcScore(row: BsjpRow): number {
  let s = 0;
  // Close near high (max 25)
  if (row.high > 0) {
    const fromHigh = ((row.high - row.price) / row.high) * 100;
    if (fromHigh <= 1) s += 25;
    else if (fromHigh <= 2) s += 20;
    else if (fromHigh <= 3) s += 15;
    else if (fromHigh <= 5) s += 10;
  }
  // Volume spike (max 25)
  if (row.volRatio >= 3) s += 25;
  else if (row.volRatio >= 2) s += 20;
  else if (row.volRatio >= 1.5) s += 15;
  else if (row.volRatio >= 1.2) s += 10;
  // Above VWAP (max 20)
  if (row.aboveVwap) s += 20;
  // RSI healthy range (max 20)
  if (row.rsi >= 40 && row.rsi <= 60) s += 20;
  else if (row.rsi >= 35 && row.rsi <= 70) s += 15;
  else if (row.rsi >= 30 && row.rsi <= 75) s += 10;
  // Positive change (max 10)
  if (row.change >= 1) s += 10;
  else if (row.change >= 0) s += 7;
  else if (row.change >= -1) s += 3;
  return s;
}

function classifyRisk(row: BsjpRow): BsjpRow["risk"] {
  if (row.change > 10) return "HATI-HATI";
  if (row.change > 5) return "WASPADA";
  return "AMAN";
}

export default function BsjpScreener() {
  const [results, setResults] = useState<BsjpRow[]>([]);
  const [loading, setLoading] = useState(false);
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

      const rows: BsjpRow[] = (data.data || []).map((d: Record<string, number | string>) => {
        const close = Number(d.close) || 0;
        const o = Number(d.open) || close;
        const h = Number(d.high) || close;
        const l = Number(d.low) || close;
        const vol = Number(d.volume) || 0;
        const avg10 = Number(d.avg_vol_10d) || vol;
        const vwap = Number(d.vwap) || close;
        const rsi = Number(d.rsi) || 50;
        const change = Number(d.change) || 0;

        const row: BsjpRow = {
          ticker: String(d.name || ""),
          desc: String(d.desc || ""),
          sector: String(d.sector || ""),
          price: close,
          open: o,
          high: h,
          low: l,
          change,
          rsi,
          volume: vol,
          avgVol: avg10,
          volRatio: avg10 > 0 ? vol / avg10 : 0,
          vwap,
          aboveVwap: close >= vwap,
          closeNearHigh: h > 0 && ((h - close) / h) * 100 <= 3,
          score: 0,
          risk: "AMAN",
        };

        row.score = calcScore(row);
        row.risk = classifyRisk(row);
        return row;
      });

      // Filter: close near high + vol spike + above VWAP + RSI 35-70
      const passing = rows.filter(
        (r) => r.closeNearHigh && r.volRatio >= 1.2 && r.aboveVwap && r.rsi >= 35 && r.rsi <= 70
      );
      passing.sort((a, b) => b.score - a.score);

      setResults(passing);
      setLastRun(new Date().toLocaleString("id-ID"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const counts = useMemo(() => {
    const c = { total: results.length, aman: 0, waspada: 0, hati2: 0 };
    results.forEach((r) => {
      if (r.risk === "AMAN") c.aman++;
      else if (r.risk === "WASPADA") c.waspada++;
      else c.hati2++;
    });
    return c;
  }, [results]);

  return (
    <div className="space-y-8">
      {/* Run button */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-xs text-[#B8AA96]/40">
          Close near high · Volume spike 1.2x · Above VWAP · RSI 35-70
        </div>
        <button
          onClick={runScreener}
          disabled={loading}
          className="ml-auto px-6 py-2.5 bg-[#C6A15B]/10 border border-[#C6A15B]/40 text-[#C6A15B] text-xs tracking-[0.15em] uppercase font-medium hover:bg-[#C6A15B]/20 transition-all disabled:opacity-40"
        >
          {loading ? "Scanning..." : "Run BSJP"}
        </button>
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
            { label: "Aman", value: counts.aman, color: "text-emerald-400" },
            { label: "Waspada", value: counts.waspada, color: "text-amber-400" },
            { label: "Hati-hati", value: counts.hati2, color: "text-red-400" },
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
              BSJP Signal <span className="text-[#B8AA96]/50 font-light">({results.length})</span>
            </h2>
            {lastRun && <span className="text-xs text-[#B8AA96]/30">Last scan: {lastRun}</span>}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#2C261E]">
                  <th className="text-left py-3 px-2 text-[#B8AA96]/50 font-medium">#</th>
                  <th className="text-left py-3 px-2 text-[#B8AA96]/50 font-medium">Stock</th>
                  <th className="text-right py-3 px-2 text-[#B8AA96]/50 font-medium">Harga</th>
                  <th className="text-right py-3 px-2 text-[#B8AA96]/50 font-medium">Chg%</th>
                  <th className="text-right py-3 px-2 text-[#B8AA96]/50 font-medium">Vol/Avg</th>
                  <th className="text-right py-3 px-2 text-[#B8AA96]/50 font-medium">RSI</th>
                  <th className="text-right py-3 px-2 text-[#B8AA96]/50 font-medium">VWAP</th>
                  <th className="text-center py-3 px-2 text-[#B8AA96]/50 font-medium">Score</th>
                  <th className="text-center py-3 px-2 text-[#B8AA96]/50 font-medium">Risk</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row, i) => {
                  const rc = RISK_CONFIG[row.risk];
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
                        <span className={row.change >= 0 ? "text-emerald-400" : "text-red-400"}>
                          {row.change > 0 ? "+" : ""}{row.change.toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right font-mono">
                        <span className={row.volRatio >= 2 ? "text-emerald-400" : row.volRatio >= 1.5 ? "text-amber-400" : "text-[#B8AA96]"}>
                          {row.volRatio.toFixed(1)}x
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right font-mono">
                        <span className={row.rsi >= 40 && row.rsi <= 60 ? "text-emerald-400" : row.rsi >= 35 && row.rsi <= 70 ? "text-amber-400" : "text-red-400"}>
                          {row.rsi.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right font-mono">
                        <span className={row.aboveVwap ? "text-emerald-400" : "text-red-400"}>
                          {row.vwap.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`font-heading text-lg font-medium ${row.score >= 70 ? "text-emerald-400" : row.score >= 50 ? "text-amber-400" : "text-[#B8AA96]"}`}>
                          {row.score}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`inline-block px-3 py-1 text-[10px] tracking-wider uppercase font-medium border rounded ${rc.bg} ${rc.text} ${rc.border}`}>
                          {row.risk}
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
          <div className="text-[#B8AA96]/30 text-sm mb-3">Belum ada hasil</div>
          <p className="text-[#B8AA96]/20 text-xs max-w-md mx-auto">
            Klik "Run BSJP" untuk scan IDX100 saham dengan sinyal beli sore jual pagi
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="card-luxury p-5 border border-[#2C261E]/50">
        <p className="text-[10px] text-[#B8AA96]/40 leading-relaxed">
          ⚠️ <span className="text-[#C6A15B]/60">Disclaimer:</span> BSJP (Beli Sore Jual Pagi) adalah sinyal teknikal berbasis close near high, volume spike, dan posisi vs VWAP. Bukan rekomendasi final. Selalu konfirmasi dengan analisis fundamental dan kondisi pasar.
        </p>
      </div>
    </div>
  );
}
