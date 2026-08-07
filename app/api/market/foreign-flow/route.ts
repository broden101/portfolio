import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch("https://apiv2.tradersaham.com/api/market-insight/foreign-flow", {
      headers: {
        "Accept": "application/json",
        "Origin": "https://www.tradersaham.com",
        "Referer": "https://www.tradersaham.com/market-overview",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
