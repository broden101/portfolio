import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  executeAgent,
  bertotFilter,
  dondonFilter,
  ragaCCFilter,
  antekAsingFilter,
  isMarketHours,
  getWibTime,
} from "@/lib/agent-server";
import type { StockRow } from "@/lib/agent-server";
import fs from "fs";
import path from "path";

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

/** Fetch top foreign accumulation tickers — dual source: Stockbit file (manual) + Tradersaham API */
async function fetchForeignAccumulation(): Promise<Set<string>> {
  // Source 1: Stockbit data file (committed to repo — latest paste)
  try {
    const filePath = path.join(process.cwd(), "data", "foreign-stockbit.json");
    if (fs.existsSync(filePath)) {
      const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      const tickers = (raw.accumulation || [])
        .filter((a: { code: string }) => IDX100.includes(a.code))
        .map((a: { code: string }) => a.code);
      if (tickers.length > 0) {
        console.log(`[AntekAsing] Using Stockbit data: ${tickers.length} tickers`);
        return new Set(tickers);
      }
    }
  } catch { /* fall through to Tradersaham */ }

  // Source 2: Tradersaham API (fallback)
  const today = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const url = `https://apiv2.tradersaham.com/api/market-insight/foreign-flow?date=${today}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
        "Origin": "https://www.tradersaham.com",
        "Referer": "https://www.tradersaham.com/foreign-flow",
      },
    });
    if (!res.ok) return new Set();
    const data = await res.json();
    const accumulation = data.accumulation || [];
    // Only keep positive net_value stocks from IDX100
    return new Set(
      accumulation
        .filter((a: { net_value: number; stock_code: string }) => a.net_value > 0 && IDX100.includes(a.stock_code))
        .map((a: { stock_code: string }) => a.stock_code),
    );
  } catch {
    return new Set();
  }
}

export async function POST(req: NextRequest) {
  try {
    const { force } = await req.json().catch(() => ({}));

    if (!isMarketHours() && !force) {
      return NextResponse.json({
        skipped: true,
        message: "Outside market hours (WIB 09:00-15:45, Mon-Fri)",
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

    // Fetch foreign accumulation for AntekAsing
    const foreignAccum = await fetchForeignAccumulation();

    // Agent configs: filter
    const AGENTS: Array<{
      id: string;
      filter: (s: StockRow) => boolean;
      label: string;
    }> = [
      { id: "bertot",    filter: bertotFilter,                                    label: "BSJP" },
      { id: "dondon",    filter: dondonFilter,                                    label: "Reversal" },
      { id: "ragacc",    filter: ragaCCFilter,                                    label: "Uptrend+VWAP" },
      { id: "antekasing",filter: antekAsingFilter(foreignAccum),                  label: "AntekAsing" },
    ];

    // Execute all agents
    const results = await Promise.all(
      AGENTS.map(({ id, filter }) =>
        executeAgent(id, stockRows, filter),
      ),
    );

    const totalBuys = results.reduce((s, r) => s + r.buys, 0);
    const totalSells = results.reduce((s, r) => s + r.sells, 0);

    return NextResponse.json({
      ran_at: getWibTime(),
      stock_count: stockRows.length,
      foreign_accum: foreignAccum.size,
      total_buys: totalBuys,
      total_sells: totalSells,
      agents: results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
