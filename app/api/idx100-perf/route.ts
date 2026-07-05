import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TV_SCANNER = "https://scanner.tradingview.com/indonesia/scan";
const TV_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "User-Agent": "Mozilla/5.0 (compatible; RagaPlaybook/1.0)",
};

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

export async function GET() {
  try {
    const r = await fetch(TV_SCANNER, {
      method: "POST",
      headers: TV_HEADERS,
      body: JSON.stringify({
        columns: ["name", "Perf.W", "Perf.1M"],
        symbols: { tickers: IDX100.map((t) => `IDX:${t}`) },
        range: [0, IDX100.length],
      }),
      cache: "no-store",
    });

    if (!r.ok) {
      return NextResponse.json({ error: `TradingView ${r.status}` }, { status: 502 });
    }

    const data = await r.json();
    const rows = (data.data ?? []).map((row: { s: string; d: (string | number | null)[] }) => ({
      ticker: row.s.replace("IDX:", ""),
      name: row.d[0] ?? "",
      perfWeek: row.d[1] != null ? Number(row.d[1]) : null,
      perf1M: row.d[2] != null ? Number(row.d[2]) : null,
    }));

    return NextResponse.json(
      { data: rows, total: rows.length },
      { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=180" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
