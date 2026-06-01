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
  rank: number;
}

export interface DividendEvent {
  ticker: string;
  name: string;
  type: "EX_DATE" | "PAY_DATE" | "CUM_DATE";
  date: string;
  dps: number;
  yield: number;
}

// Data will be loaded from JSON
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

export function getDividendEvents(stocks: DividendStock[], year: number): DividendEvent[] {
  const events: DividendEvent[] = [];

  stocks.forEach((stock) => {
    if (!stock.latestDividend?.date) return;

    const exDate = new Date(stock.latestDividend.date);
    // Project to requested year
    const exDateAdj = `${year}-${String(exDate.getMonth() + 1).padStart(2, "0")}-${String(exDate.getDate()).padStart(2, "0")}`;

    events.push({
      ticker: stock.ticker + ".JK",
      name: stock.companyName,
      type: "EX_DATE",
      date: exDateAdj,
      dps: stock.latestDividend.amount,
      yield: 0,
    });

    // Cum-date (2 days before)
    const cumDate = new Date(exDate);
    cumDate.setDate(cumDate.getDate() - 2);
    events.push({
      ticker: stock.ticker + ".JK",
      name: stock.companyName,
      type: "CUM_DATE",
      date: `${year}-${String(cumDate.getMonth() + 1).padStart(2, "0")}-${String(cumDate.getDate()).padStart(2, "0")}`,
      dps: stock.latestDividend.amount,
      yield: 0,
    });

    // Payment date
    if (stock.latestDividend.paymentDate) {
      const payDate = new Date(stock.latestDividend.paymentDate);
      events.push({
        ticker: stock.ticker + ".JK",
        name: stock.companyName,
        type: "PAY_DATE",
        date: `${year}-${String(payDate.getMonth() + 1).padStart(2, "0")}-${String(payDate.getDate()).padStart(2, "0")}`,
        dps: stock.latestDividend.amount,
        yield: 0,
      });
    }
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
