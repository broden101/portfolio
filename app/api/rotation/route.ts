import { NextResponse } from "next/server";
import {
  INDONESIA_SCANNER, TV_HEADERS, SECTOR_INDICES, SECTOR_BASKETS,
  ALL_SECTOR_CODES, sectorName,
} from "@/lib/idxsectors";

export const dynamic = "force-dynamic";

// window indeks → perf field (change=Day, Perf.W=1W, 1M, 3M, 6M)
const COLS = ["name", "change", "Perf.W", "Perf.1M", "Perf.3M", "Perf.6M"];

// 100 IDX likuid (sama universe screener / Kompas100 subset)
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

interface RawRow { s: string; d: (string | number | null)[]; }

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function scan(endpoint: string, tickers: string[]): Promise<Map<string, RawRow>> {
  const out = new Map<string, RawRow>();
  if (tickers.length === 0) return out;
  const CHUNK = 60; // TradingView caps symbols/request; serial biar ga kena rate-limit blok
  for (let i = 0; i < tickers.length; i += CHUNK) {
    const chunk = tickers.slice(i, i + CHUNK);
    try {
      const resp = await fetch(endpoint, {
        method: "POST", headers: TV_HEADERS,
        body: JSON.stringify({ columns: COLS, symbols: { tickers: chunk }, range: [0, chunk.length] }),
        cache: "no-store",
        signal: AbortSignal.timeout(25000),
      });
      if (!resp.ok) continue;
      const data = await resp.json();
      for (const row of data?.data ?? []) out.set(row.s, row);
    } catch (e) { /* transient */ }
  }
  return out;
}

// extract windows [change, 1W, 1M, 3M, 6M] from raw row d[]
function windowsOf(row: RawRow): (number | null)[] {
  const d = row.d;
  return d.slice(1, 1 + 5).map((v, i) => {
    const n = num(v);
    if (n == null) return null;
    // Day (i=0) glitch guard ±35%
    if (i === 0 && (n > 35 || n < -35)) return null;
    return n;
  });
}

export async function GET() {
  try {
    const indexTickers = ["IDX:COMPOSITE", ...Object.keys(SECTOR_INDICES).map((k) => `IDX:${k}`)];
    const basketTickers = Object.values(SECTOR_BASKETS).flatMap((b) => b.tickers.map((t) => `IDX:${t}`));
    const stockTickers = IDX100.map((t) => `IDX:${t}`);

    const rows = await scan(INDONESIA_SCANNER, [...indexTickers, ...basketTickers]);
    // scan stocks SEKUNDER (sequential): gabung 100 stock + definisi ad widget lain tetap cepat. Stock chart Vercel sekali per build.

    const benchmark = rows.get("IDX:COMPOSITE") ? windowsOf(rows.get("IDX:COMPOSITE")!) : null;

    // sektor: indeks langsung + basket agregat
    const sectors: { ticker: string; name: string; perf: (number | null)[] }[] = [];
    for (const code of Object.keys(SECTOR_INDICES)) {
      const row = rows.get(`IDX:${code}`);
      if (row) sectors.push({ ticker: code, name: sectorName(code), perf: windowsOf(row) });
    }
    for (const [code, def] of Object.entries(SECTOR_BASKETS)) {
      const memberRows = def.tickers
        .map((t) => rows.get(`IDX:${t}`))
        .filter((r): r is RawRow => !!r)
        .map((r) => windowsOf(r));
      if (memberRows.length === 0) continue;
      const n = memberRows.length;
      const avg = (i: number) => {
        let s = 0, c = 0;
        for (const w of memberRows) { const v = w[i]; if (v != null) { s += v; c++; } }
        return c ? s / c : null;
      };
      const perf = ["Day","1W","1M","3M","6M"].map((_, i) => avg(i));
      if (perf.every((v) => v == null)) continue;
      sectors.push({ ticker: code, name: def.name, perf });
    }

    // stocks (sequential — hindari parallel ke scanner)
    const stockRows = await scan(INDONESIA_SCANNER, stockTickers);
    const stocks = IDX100
      .filter((t) => stockRows.has(`IDX:${t}`))
      .map((t) => {
        const row = stockRows.get(`IDX:${t}`)!;
        return { ticker: t, name: String(row.d[0] ?? t), perf: windowsOf(row) };
      });

    return NextResponse.json(
      { benchmark, windows: ["Day", "1W", "1M", "3M", "6M"], sectors, stocks },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}