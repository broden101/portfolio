import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function fmtWIB(d: Date): string {
  const wib = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  const parts = wib.toISOString().split("T");
  const [Y, M, D] = parts[0].split("-");
  const [H, Min] = parts[1].split(":");
  return `${D}-${M}-${Y.slice(2)} ${H}:${Min} WIB`;
}

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
      sellTrigger: a.sellTrigger,
      minProfitToSell: a.minProfitToSell,
      holdings: a.positions.map((p) => ({
        ticker: p.ticker,
        buyPrice: p.avgPrice,
        lots: p.qty,
        buyDate: fmtWIB(p.openedAt),
        strategy: a.strategy,
      })),
      trades: a.transactions.map((t) => ({
        ticker: t.ticker,
        type: t.side.toUpperCase(),
        price: t.price,
        lots: t.qty,
        date: fmtWIB(t.executedAt),
        reason: t.reason,
        pnl: t.pnl,
      })),
      lastRun: fmtWIB(a.updatedAt),
    }));

    return NextResponse.json({ agents: formatted });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
