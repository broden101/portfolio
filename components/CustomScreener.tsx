"use client";

import { useState, useCallback } from "react";

const FIELD_MAP: Record<string, string> = {
  // Price
  close: "close", open: "open", high: "high", low: "low",
  price: "close", harga: "close",
  // Technical
  rsi: "rsi", sma20: "sma20", sma50: "sma50", sma200: "sma200",
  ma20: "sma20", ma50: "sma50", ma200: "sma200",
  vwap: "vwap", macd: "macd", macd_signal: "macd_signal",
  // Volume
  volume: "volume", vol: "volume",
  avg_vol_10d: "avg_vol_10d", avgvol10: "avg_vol_10d",
  avg_vol_30d: "avg_vol_30d", avgvol30: "avg_vol_30d",
  // Market cap
  mcap: "mcap", marketcap: "mcap",
  // Performance
  change: "change", perf1m: "perf1m", perf3m: "perf3m",
  // Range
  high_all: "high_all", low_all: "low_all",
  highall: "high_all", lowall: "low_all",
  // Sector
  sector: "sector",
};

const FIELD_DOCS: { field: string; label: string; example: string }[] = [
  { field: "close", label: "Harga penutupan", example: "close > 1000" },
  { field: "open", label: "Harga pembukaan", example: "open < close" },
  { field: "high", label: "Harga tertinggi", example: "high > 5000" },
  { field: "low", label: "Harga terendah", example: "low > 100" },
  { field: "rsi", label: "RSI (14)", example: "rsi < 30" },
  { field: "sma20", label: "SMA 20", example: "close > sma20" },
  { field: "sma50", label: "SMA 50", example: "close > sma50" },
  { field: "sma200", label: "SMA 200", example: "close > sma200" },
  { field: "vwap", label: "VWAP", example: "close > vwap" },
  { field: "macd", label: "MACD", example: "macd > 0" },
  { field: "macd_signal", label: "MACD Signal", example: "macd > macd_signal" },
  { field: "volume", label: "Volume", example: "volume > 1000000" },
  { field: "avg_vol_10d", label: "Rata-rata vol 10 hari", example: "volume > avg_vol_10d * 2" },
  { field: "avg_vol_30d", label: "Rata-rata vol 30 hari", example: "volume > avg_vol_30d * 1.5" },
  { field: "mcap", label: "Market cap", example: "mcap > 1000000000000" },
  { field: "change", label: "Perubahan % hari ini", example: "change > 3" },
  { field: "perf1m", label: "Perf 1 bulan", example: "perf1m > 10" },
  { field: "perf3m", label: "Perf 3 bulan", example: "perf3m > -5" },
  { field: "high_all", label: "All-time high", example: "close >= high_all * 0.95" },
  { field: "low_all", label: "All-time low", example: "close <= low_all * 1.1" },
];

const SCRIPT_EXAMPLES = [
  {
    name: "Golden Cross (MA20 > MA50)",
    script: "close > sma20 and sma20 > sma50 and volume > avg_vol_10d",
  },
  {
    name: "Oversold RSI",
    script: "rsi < 30 and change > -3 and volume > avg_vol_10d",
  },
  {
    name: "Near ATH (5%)",
    script: "close >= high_all * 0.95 and volume > avg_vol_10d * 1.5",
  },
  {
    name: "Bullish MACD Cross",
    script: "macd > macd_signal and rsi > 40 and rsi < 70",
  },
  {
    name: "Volume Breakout",
    script: "volume > avg_vol_10d * 3 and change > 2 and close > vwap",
  },
  {
    name: "Large Cap Value",
    script: "mcap > 50000000000000 and rsi < 45 and close > sma200",
  },
];

interface ScriptResult {
  ticker: string;
  desc: string;
  sector: string;
  close: number;
  change: number;
  rsi: number;
  volume: number;
  mcap: number;
  [key: string]: string | number;
}

function parseScript(script: string, stock: Record<string, unknown>): boolean {
  // Normalize script: lowercase, trim, collapse whitespace
  const norm = script.toLowerCase().trim().replace(/\s+/g, " ");

  // Split by 'and' (top-level)
  const clauses = norm.split(/\s+and\s+/);

  for (const clause of clauses) {
    const trimmed = clause.trim();
    if (!trimmed) continue;

    // Handle OR within a clause
    const orParts = trimmed.split(/\s+or\s+/);
    let anyOrTrue = false;

    for (const part of orParts) {
      const p = part.trim();
      if (!p) continue;

      const result = evalClause(p, stock);
      if (result) {
        anyOrTrue = true;
        break;
      }
    }

    if (!anyOrTrue) return false;
  }

  return true;
}

function evalClause(clause: string, stock: Record<string, unknown>): boolean {
  // Try comparison operators: >=, <=, !=, ==, >, <
  const ops = [">=", "<=", "!=", "==", ">", "<"];
  for (const op of ops) {
    const idx = clause.indexOf(op);
    if (idx === -1) continue;

    const left = clause.substring(0, idx).trim();
    const right = clause.substring(idx + op.length).trim();

    const leftVal = evalExpr(left, stock);
    const rightVal = evalExpr(right, stock);

    if (leftVal === null || rightVal === null) continue;

    switch (op) {
      case ">=": return leftVal >= rightVal;
      case "<=": return leftVal <= rightVal;
      case "!=": return leftVal !== rightVal;
      case "==": return leftVal === rightVal;
      case ">": return leftVal > rightVal;
      case "<": return leftVal < rightVal;
    }
  }
  return false;
}

function evalExpr(expr: string, stock: Record<string, unknown>): number | null {
  expr = expr.trim();

  // Handle multiplication: field * number
  const mulMatch = expr.match(/^(.+?)\s*\*\s*(.+)$/);
  if (mulMatch) {
    const left = evalExpr(mulMatch[1].trim(), stock);
    const right = evalExpr(mulMatch[2].trim(), stock);
    if (left !== null && right !== null) return left * right;
  }

  // Handle division: field / number
  const divMatch = expr.match(/^(.+?)\s*\/\s*(.+)$/);
  if (divMatch) {
    const left = evalExpr(divMatch[1].trim(), stock);
    const right = evalExpr(divMatch[2].trim(), stock);
    if (left !== null && right !== null && right !== 0) return left / right;
  }

  // Handle addition: field + number
  const addMatch = expr.match(/^(.+?)\s*\+\s*(.+)$/);
  if (addMatch) {
    const left = evalExpr(addMatch[1].trim(), stock);
    const right = evalExpr(addMatch[2].trim(), stock);
    if (left !== null && right !== null) return left + right;
  }

  // Handle subtraction: field - number
  const subMatch = expr.match(/^(.+?)\s*-\s*(.+)$/);
  if (subMatch) {
    const left = evalExpr(subMatch[1].trim(), stock);
    const right = evalExpr(subMatch[2].trim(), stock);
    if (left !== null && right !== null) return left - right;
  }

  // Numeric literal
  const num = Number(expr);
  if (!isNaN(num)) return num;

  // Field reference
  const fieldName = FIELD_MAP[expr];
  if (fieldName && stock[fieldName] != null) {
    const val = Number(stock[fieldName]);
    return isNaN(val) ? null : val;
  }

  return null;
}

const SAMPLE_SCRIPTS = [
  "close > sma20 and rsi < 70",
  "volume > avg_vol_10d * 2 and change > 0",
  "macd > macd_signal and close > vwap",
];

export default function CustomScreener() {
  const [script, setScript] = useState("");
  const [results, setResults] = useState<ScriptResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastRun, setLastRun] = useState("");
  const [universe, setUniverse] = useState<"IDX100" | "ALL">("IDX100");
  const [showRef, setShowRef] = useState(false);

  const runScreener = useCallback(async () => {
    if (!script.trim()) {
      setError("Masukkan script terlebih dahulu");
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const body: Record<string, unknown> = {};
      if (universe === "IDX100") {
        body.tickers = [
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
      }

      const res = await fetch("/api/scanner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scanner failed");

      const passing: ScriptResult[] = [];

      for (const stock of data.data || []) {
        try {
          if (parseScript(script, stock as Record<string, unknown>)) {
            passing.push({
              ticker: String(stock.name || ""),
              desc: String(stock.desc || ""),
              sector: String(stock.sector || ""),
              close: Number(stock.close) || 0,
              change: Number(stock.change) || 0,
              rsi: Number(stock.rsi) || 0,
              volume: Number(stock.volume) || 0,
              mcap: Number(stock.mcap) || 0,
              ...stock,
            });
          }
        } catch {
          // Skip stocks that cause eval errors
        }
      }

      passing.sort((a, b) => b.mcap - a.mcap);
      setResults(passing);
      setLastRun(new Date().toLocaleString("id-ID"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [script, universe]);

  return (
    <div className="space-y-6">
      {/* Universe selector + Run */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[#B8AA96]/60 text-xs tracking-wider uppercase">Universe:</span>
        {(["IDX100", "ALL"] as const).map((u) => (
          <button
            key={u}
            onClick={() => setUniverse(u)}
            className={`px-4 py-1.5 text-xs font-medium transition-all ${
              universe === u
                ? "bg-[#C6A15B]/15 text-[#C6A15B] border border-[#C6A15B]/30"
                : "border border-[#2C261E] text-[#B8AA96]/50 hover:text-[#B8AA96]"
            }`}
          >
            {u}
          </button>
        ))}
        <button
          onClick={() => setShowRef(!showRef)}
          className="px-4 py-1.5 text-xs font-medium border border-[#2C261E] text-[#B8AA96]/50 hover:text-[#C6A15B] hover:border-[#C6A15B] transition-all"
        >
          {showRef ? "Tutup Ref" : "📖 Field Reference"}
        </button>
        <button
          onClick={runScreener}
          disabled={loading}
          className="ml-auto px-6 py-2.5 bg-[#C6A15B]/10 border border-[#C6A15B]/40 text-[#C6A15B] text-xs tracking-[0.15em] uppercase font-medium hover:bg-[#C6A15B]/20 transition-all disabled:opacity-40"
        >
          {loading ? "Scanning..." : "Run Script"}
        </button>
      </div>

      {/* Field Reference */}
      {showRef && (
        <div className="card-luxury p-5">
          <h3 className="text-sm text-[#C6A15B] mb-4 font-medium">Field Reference</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
            {FIELD_DOCS.map((f) => (
              <div key={f.field} className="flex items-start gap-2 p-2 bg-[#0B0B0A] border border-[#2C261E]">
                <code className="text-emerald-400 font-mono shrink-0">{f.field}</code>
                <div>
                  <div className="text-[#B8AA96]/70">{f.label}</div>
                  <code className="text-[#B8AA96]/40 text-[10px]">{f.example}</code>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-[#0B0B0A] border border-[#2C261E] text-xs">
            <div className="text-[#C6A15B] mb-2 font-medium">Operator:</div>
            <div className="text-[#B8AA96]/70 space-y-1">
              <div><code className="text-emerald-400">and</code> — semua kondisi harus benar</div>
              <div><code className="text-emerald-400">or</code> — salah satu kondisi benar</div>
              <div><code className="text-emerald-400">{">"} {">="} {"<"} {"<="} {"=="} {"!="}</code> — operator perbandingan</div>
              <div><code className="text-emerald-400">{"*"} / + -</code> — operasi aritmatika</div>
            </div>
          </div>
        </div>
      )}

      {/* Script input */}
      <div className="card-luxury p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm text-[#C6A15B] font-medium">Script Editor</h3>
          <div className="flex gap-2">
            {SCRIPT_EXAMPLES.map((ex) => (
              <button
                key={ex.name}
                onClick={() => setScript(ex.script)}
                className="px-2 py-1 text-[10px] bg-[#C6A15B]/10 text-[#C6A15B] border border-[#C6A15B]/20 hover:bg-[#C6A15B]/20 transition-all"
                title={ex.script}
              >
                {ex.name}
              </button>
            ))}
          </div>
        </div>
        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          placeholder={`Contoh:\nclose > sma20 and sma20 > sma50\nand volume > avg_vol_10d * 2\nand rsi < 70`}
          rows={5}
          className="w-full bg-[#0B0B0A] border border-[#2C261E] p-4 text-sm text-[#F4EFE6] font-mono placeholder-[#B8AA96]/30 focus:border-[#C6A15B] outline-none resize-y transition-colors"
          spellCheck={false}
        />
        <div className="flex items-center justify-between mt-2">
          <div className="text-[10px] text-[#B8AA96]/40">
            Pisahkan kondisi dengan <code className="text-[#C6A15B]/60">and</code> / <code className="text-[#C6A15B]/60">or</code>
          </div>
          <button
            onClick={() => setScript("")}
            className="text-[10px] text-[#B8AA96]/40 hover:text-red-400 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="card-luxury p-5 border border-red-500/30">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="card-luxury p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-xl text-[#F4EFE6] font-medium">
              Hasil Script <span className="text-[#B8AA96]/50 font-light">({results.length})</span>
            </h2>
            {lastRun && <span className="text-xs text-[#B8AA96]/30">{lastRun}</span>}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#2C261E]">
                  <th className="text-left py-3 px-2 text-[#B8AA96]/50 font-medium">#</th>
                  <th className="text-left py-3 px-2 text-[#B8AA96]/50 font-medium">Stock</th>
                  <th className="text-right py-3 px-2 text-[#B8AA96]/50 font-medium">Harga</th>
                  <th className="text-right py-3 px-2 text-[#B8AA96]/50 font-medium">Chg%</th>
                  <th className="text-right py-3 px-2 text-[#B8AA96]/50 font-medium">RSI</th>
                  <th className="text-right py-3 px-2 text-[#B8AA96]/50 font-medium">Volume</th>
                  <th className="text-right py-3 px-2 text-[#B8AA96]/50 font-medium">MCap</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row, i) => (
                  <tr key={row.ticker} className="border-b border-[#2C261E]/50 hover:bg-[#C6A15B]/5 transition-colors">
                    <td className="py-3 px-2 text-[#B8AA96]/30">{i + 1}</td>
                    <td className="py-3 px-2">
                      <span className="font-mono font-semibold text-[#F4EFE6]">{row.ticker}</span>
                      <div className="text-[10px] text-[#B8AA96]/40 mt-0.5 max-w-[180px] truncate">{row.desc}</div>
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-[#F4EFE6]">
                      {row.close.toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-right font-mono">
                      <span className={row.change >= 0 ? "text-emerald-400" : "text-red-400"}>
                        {row.change > 0 ? "+" : ""}{row.change.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right font-mono">
                      <span className={row.rsi >= 40 && row.rsi <= 60 ? "text-emerald-400" : row.rsi >= 30 && row.rsi <= 70 ? "text-amber-400" : "text-red-400"}>
                        {row.rsi.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-[#B8AA96]">
                      {row.volume >= 1e9 ? `${(row.volume / 1e9).toFixed(1)}B` : row.volume >= 1e6 ? `${(row.volume / 1e6).toFixed(1)}M` : row.volume.toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-[#B8AA96]">
                      {row.mcap >= 1e12 ? `${(row.mcap / 1e12).toFixed(1)}T` : row.mcap >= 1e9 ? `${(row.mcap / 1e9).toFixed(1)}B` : row.mcap.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && results.length === 0 && !error && (
        <div className="card-luxury p-12 text-center">
          <div className="text-[#B8AA96]/30 text-sm mb-3">Masukkan script dan klik "Run Script"</div>
          <p className="text-[#B8AA96]/20 text-xs max-w-md mx-auto">
            Tulis kriteria screening dalam format boolean expression. Contoh: <code className="text-[#C6A15B]/40">close &gt; sma20 and rsi &lt; 70</code>
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="card-luxury p-5 border border-[#2C261E]/50">
        <p className="text-[10px] text-[#B8AA96]/40 leading-relaxed">
          ⚠️ <span className="text-[#C6A15B]/60">Disclaimer:</span> Custom Script Screener memfilter saham berdasarkan ekspresi boolean yang kamu tulis. Hasil bukan rekomendasi beli/jual. Selalu konfirmasi dengan analisis tambahan.
        </p>
      </div>
    </div>
  );
}
