import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const LIVE_URL = "https://terminal-live.chamdani49.workers.dev/live.json";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36";

export async function GET() {
  try {
    const res = await fetch(LIVE_URL, {
      headers: {
        "User-Agent": USER_AGENT,
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: `Upstream HTTP ${res.status}` },
        { status: 502, headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to fetch live prices" },
      { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }
}
