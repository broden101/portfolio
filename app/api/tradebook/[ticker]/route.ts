import { NextResponse } from "next/server";
import { execSync } from "child_process";

export async function GET(request: Request, { params }: { params: { ticker: string } }) {
  const { ticker } = params;
  try {
    const output = execSync(`python3 /home/ubuntu/ragaplaybook/scripts/format-tradebook.py ${ticker.toUpperCase()}`).toString();
    const data = JSON.parse(output);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: "Failed to process data" }, { status: 500 });
  }
}
