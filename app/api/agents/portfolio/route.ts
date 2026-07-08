import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const agents = await prisma.agent.findMany({
      include: {
        positions: { orderBy: { openedAt: "desc" } },
        transactions: { orderBy: { executedAt: "desc" }, take: 50 },
      },
      orderBy: { name: "asc" },
    });

    // Format for frontend consumption
    const formatted = agents.map((a) => ({
      id: a.id,
      name: a.name,
      strategy: a.strategy,
      avatar: a.avatar,
      capital: a.initialCapital,
      cash: a.cash,
      evolutionGeneration: a.evolutionGen,
      holdings: a.positions.map((p) => ({
        ticker: p.ticker,
        buyPrice: p.avgPrice,
        lots: p.qty,
        buyDate: p.openedAt.toISOString(),
        strategy: a.strategy,
      })),
      trades: a.transactions.map((t) => ({
        ticker: t.ticker,
        type: t.side.toUpperCase(),
        price: t.price,
        lots: t.qty,
        date: t.executedAt.toISOString(),
        reason: t.reason,
        pnl: t.pnl,
      })),
      lastRun: a.updatedAt.toISOString(),
    }));

    return NextResponse.json({ agents: formatted });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
