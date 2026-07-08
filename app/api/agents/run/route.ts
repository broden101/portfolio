import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  executeAgent,
  bertotFilter,
  dondonFilter,
  ragaCCFilter,
  isMarketHours,
  getWibTime,
} from "@/lib/agent-server";
import type { StockRow } from "@/lib/agent-server";

const AGENT_STRATEGIES: Record<string, { filter: (s: StockRow) => boolean; label: string }> = {
  bertot: { filter: bertotFilter, label: "BSJP" },
  dondon: { filter: dondonFilter, label: "Reversal" },
  ragacc: { filter: ragaCCFilter, label: "Uptrend+VWAP" },
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

export async function POST(req: NextRequest) {
  try {
    const { force } = await req.json().catch(() => ({}));

    if (!isMarketHours() && !force) {
      return NextResponse.json({
        skipped: true,
        message: "Outside market hours (WIB 09:00-15:00, Mon-Fri)",
        time: getWibTime(),
      });
    }

    // Fetch stock data via TradingView scanner
    const tvRes = await fetch("https://scanner.tradingview.com/indonesia/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0" },
      body: JSON.stringify({
        columns: [
          "name","close","high","volume","average_volume_10d_calc",
          "VWAP","RSI","SMA20","SMA50","MACD.macd","MACD.signal","market_cap_basic",
        ],
        filter: [
          { left: "name", operation: "in_range", right: IDX100 },
          { left: "is_primary", operation: "equal", right: true },
        ],
        range: [0, 200],
        sort: { sortBy: "market_cap_basic", sortOrder: "desc" },
      }),
    });

    if (!tvRes.ok) {
      return NextResponse.json({ error: `TradingView ${tvRes.status}` }, { status: 502 });
    }

    const tvData = await tvRes.json();
    const rawKeys = ["name","close","high","volume","average_volume_10d_calc","VWAP","RSI","SMA20","SMA50","MACD.macd","MACD.signal","market_cap_basic"];

    const rawData: Record<string, unknown>[] = (tvData.data || []).map((row: { s: string; d: unknown[] }) => {
      const obj: Record<string, unknown> = { name: row.s.replace("IDX:", "") };
      rawKeys.forEach((k, i) => { obj[k] = row.d[i]; });
      return obj;
    });

    // Build StockRow array
    const stockRows: StockRow[] = rawData.map((r) => ({
      name: String(r.name),
      close: Number(r.close) || 0,
      high: Number(r.high) || 0,
      volume: Number(r.volume) || 0,
      avg_vol_10d: Number(r.average_volume_10d_calc) || 0,
      vwap: Number(r.VWAP) || 0,
      rsi: Number(r.RSI) || 0,
      sma20: Number(r.SMA20) || 0,
      sma50: Number(r.SMA50) || 0,
      macd: Number(r["MACD.macd"]) || 0,
      macd_signal: Number(r["MACD.signal"]) || 0,
      mcap: Number(r.market_cap_basic) || 0,
    }));

    // Execute all agents
    const results = await Promise.all(
      Object.entries(AGENT_STRATEGIES).map(([id, { filter }]) =>
        executeAgent(id, stockRows, filter),
      ),
    );

    const totalBuys = results.reduce((s, r) => s + r.buys, 0);
    const totalSells = results.reduce((s, r) => s + r.sells, 0);

    return NextResponse.json({
      ran_at: getWibTime(),
      stock_count: stockRows.length,
      total_buys: totalBuys,
      total_sells: totalSells,
      agents: results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
