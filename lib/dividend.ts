export interface DividendEntry {
  exDate: string;
  amount: number;
  paymentDate: string;
  fiscalYear: string;
  type: string; // "final", "interim"
}

export interface DividendStock {
  ticker: string;
  companyName: string;
  sector: string;
  industry: string;
  totalDividends: number;
  dividendCount: number;
  yearsOfHistory: number;
  avgDividendPerYear: number;
  latestDividend: {
    date: string;
    amount: number;
    type: string;
    paymentDate: string;
  };
  fiscalYears: string[];
  allDividends: DividendEntry[];
  rank: number;
}

export interface DividendEvent {
  ticker: string;
  name: string;
  type: "EX_DATE" | "PAY_DATE" | "CUM_DATE";
  date: string;
  dps: number;
  divType: string; // "final" or "interim"
}

let dividendStocksData: DividendStock[] = [];

export async function loadDividendData(): Promise<DividendStock[]> {
  if (dividendStocksData.length > 0) return dividendStocksData;
  try {
    const res = await fetch("/api/dividends");
    if (!res.ok) throw new Error("Failed to fetch");
    const data = await res.json();
    dividendStocksData = data;
    return data;
  } catch {
    return [];
  }
}

export function getDividendEvents(stocks: DividendStock[]): DividendEvent[] {
  const events: DividendEvent[] = [];

  stocks.forEach((stock) => {
    if (!stock.allDividends?.length) return;

    stock.allDividends.forEach((div) => {
      if (!div.exDate) return;

      // EX_DATE
      events.push({
        ticker: stock.ticker,
        name: stock.companyName,
        type: "EX_DATE",
        date: div.exDate,
        dps: div.amount,
        divType: div.type,
      });

      // CUM_DATE (2 business days before ex-date, simplified as -2 calendar days)
      const exDate = new Date(div.exDate);
      const cumDate = new Date(exDate);
      cumDate.setDate(cumDate.getDate() - 2);
      const cumStr = cumDate.toISOString().split("T")[0];
      events.push({
        ticker: stock.ticker,
        name: stock.companyName,
        type: "CUM_DATE",
        date: cumStr,
        dps: div.amount,
        divType: div.type,
      });

      // PAY_DATE
      if (div.paymentDate) {
        events.push({
          ticker: stock.ticker,
          name: stock.companyName,
          type: "PAY_DATE",
          date: div.paymentDate,
          dps: div.amount,
          divType: div.type,
        });
      }
    });
  });

  return events.sort((a, b) => a.date.localeCompare(b.date));
}

export function getEventsForMonth(events: DividendEvent[], year: number, month: number): DividendEvent[] {
  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  return events.filter((e) => e.date.startsWith(monthStr));
}

export function getSectors(stocks: DividendStock[]): string[] {
  const sectors = new Set(stocks.map((s) => s.sector));
  return Array.from(sectors).sort();
}

export function sortStocks(
  stocks: DividendStock[],
  sortBy: keyof DividendStock,
  dir: "asc" | "desc",
): DividendStock[] {
  return [...stocks].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    if (typeof aVal === "number" && typeof bVal === "number") {
      return dir === "asc" ? aVal - bVal : bVal - aVal;
    }
    return dir === "asc"
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });
}
