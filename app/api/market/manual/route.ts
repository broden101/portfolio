import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

/**
 * /api/market/manual — Update manual market data (foreign flow, BI rate, trade balance)
 * 
 * GET: Read current manual data
 * POST: Update manual data (JSON body)
 * 
 * Data persisted to data/manual-market.json
 */

const DATA_FILE = join(process.cwd(), "data", "manual-market.json");

// Default values (fallback if file doesn't exist)
const DEFAULT_DATA = {
  biRate: { value: 5.50, note: "BI RDG", lastUpdated: null },
  tradeBalance: { value: 3.32, note: "Surplus", lastUpdated: null },
  foreignFlow: {
    weekNet: 0,
    mtdNet: 0,
    ytdNet: 0,
    topBuy: [
      { ticker: "BBCA", net: 0 },
      { ticker: "BMRI", net: 0 },
      { ticker: "TLKM", net: 0 },
      { ticker: "BBRI", net: 0 },
      { ticker: "BBNI", net: 0 },
    ],
    topSell: [
      { ticker: "ADRO", net: 0 },
      { ticker: "MDKA", net: 0 },
      { ticker: "INDF", net: 0 },
      { ticker: "ANTM", net: 0 },
      { ticker: "PTBA", net: 0 },
    ],
    lastUpdated: null,
  },
};

function loadData() {
  try {
    if (existsSync(DATA_FILE)) {
      const raw = readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to load manual data:", e);
  }
  return DEFAULT_DATA;
}

function saveData(data: any) {
  try {
    writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (e) {
    console.error("Failed to save manual data:", e);
    return false;
  }
}

export async function GET() {
  const data = loadData();
  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const current = loadData();
    
    // Merge updates
    const updated = { ...current };
    const now = new Date().toISOString();

    if (body.biRate !== undefined) {
      updated.biRate = {
        value: Number(body.biRate) || current.biRate.value,
        note: body.biRateNote || current.biRate.note,
        lastUpdated: now,
      };
    }

    if (body.tradeBalance !== undefined) {
      updated.tradeBalance = {
        value: Number(body.tradeBalance) || current.tradeBalance.value,
        note: body.tradeBalanceNote || current.tradeBalance.note,
        lastUpdated: now,
      };
    }

    if (body.foreignFlow) {
      const ff = body.foreignFlow;
      updated.foreignFlow = {
        weekNet: ff.weekNet !== undefined ? Number(ff.weekNet) : current.foreignFlow.weekNet,
        mtdNet: ff.mtdNet !== undefined ? Number(ff.mtdNet) : current.foreignFlow.mtdNet,
        ytdNet: ff.ytdNet !== undefined ? Number(ff.ytdNet) : current.foreignFlow.ytdNet,
        topBuy: ff.topBuy || current.foreignFlow.topBuy,
        topSell: ff.topSell || current.foreignFlow.topSell,
        lastUpdated: now,
      };
    }

    saveData(updated);

    return NextResponse.json({
      ok: true,
      message: "Data updated",
      data: updated,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }
}
