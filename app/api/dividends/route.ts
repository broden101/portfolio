import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), "data", "dividends.json");

    if (!fs.existsSync(dataPath)) {
      // Return sample data if no real data exists
      return NextResponse.json({
        lastUpdated: null,
        source: "Sample Data",
        index: "IDX Kompas 100",
        totalStocks: 0,
        stocks: [],
        message: "No dividend data available. Run: python3 scripts/fetch-dividends.py",
      });
    }

    const rawData = fs.readFileSync(dataPath, "utf-8");
    const data = JSON.parse(rawData);

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load dividend data" },
      { status: 500 }
    );
  }
}
