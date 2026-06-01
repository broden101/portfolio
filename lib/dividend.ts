export interface DividendStock {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  price: number;
  change: number;
  marketCap: number; // in trillion IDR
  dividendYield: number; // percentage
  dps: number; // dividend per share
  payoutRatio: number;
  frequency: string; // "Annual", "Semi-Annual", "Quarterly"
  lastExDate: string;
  lastPayDate: string;
  nextEstExDate: string;
  consecutiveYears: number; // years of consecutive dividends
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

// Sample IDX dividend stocks data (based on real market data patterns)
export const dividendStocks: DividendStock[] = [
  {
    ticker: "BBRI.JK",
    name: "Bank Rakyat Indonesia",
    sector: "Financial Services",
    industry: "Banks",
    price: 4250,
    change: -50,
    marketCap: 530,
    dividendYield: 4.2,
    dps: 179,
    payoutRatio: 85,
    frequency: "Annual",
    lastExDate: "2025-03-12",
    lastPayDate: "2025-03-28",
    nextEstExDate: "2026-03-11",
    consecutiveYears: 12,
    rank: 1,
  },
  {
    ticker: "BMRI.JK",
    name: "Bank Mandiri",
    sector: "Financial Services",
    industry: "Banks",
    price: 6800,
    change: -75,
    marketCap: 420,
    dividendYield: 5.1,
    dps: 347,
    payoutRatio: 78,
    frequency: "Annual",
    lastExDate: "2025-03-19",
    lastPayDate: "2025-04-04",
    nextEstExDate: "2026-03-18",
    consecutiveYears: 10,
    rank: 2,
  },
  {
    ticker: "TLKM.JK",
    name: "Telkom Indonesia",
    sector: "Communication Services",
    industry: "Telecom",
    price: 2680,
    change: -20,
    marketCap: 265,
    dividendYield: 6.8,
    dps: 182,
    payoutRatio: 92,
    frequency: "Annual",
    lastExDate: "2025-06-18",
    lastPayDate: "2025-07-04",
    nextEstExDate: "2026-06-17",
    consecutiveYears: 15,
    rank: 3,
  },
  {
    ticker: "BBCA.JK",
    name: "Bank Central Asia",
    sector: "Financial Services",
    industry: "Banks",
    price: 9175,
    change: -125,
    marketCap: 1130,
    dividendYield: 2.1,
    dps: 193,
    payoutRatio: 45,
    frequency: "Annual",
    lastExDate: "2025-03-26",
    lastPayDate: "2025-04-11",
    nextEstExDate: "2026-03-25",
    consecutiveYears: 20,
    rank: 4,
  },
  {
    ticker: "ASII.JK",
    name: "Astra International",
    sector: "Consumer Cyclical",
    industry: "Auto",
    price: 5850,
    change: -100,
    marketCap: 235,
    dividendYield: 5.5,
    dps: 322,
    payoutRatio: 65,
    frequency: "Annual",
    lastExDate: "2025-05-14",
    lastPayDate: "2025-06-02",
    nextEstExDate: "2026-05-13",
    consecutiveYears: 8,
    rank: 5,
  },
  {
    ticker: "UNVR.JK",
    name: "Unilever Indonesia",
    sector: "Consumer Defensive",
    industry: "Household Products",
    price: 2460,
    change: -15,
    marketCap: 95,
    dividendYield: 7.2,
    dps: 177,
    payoutRatio: 95,
    frequency: "Semi-Annual",
    lastExDate: "2025-07-09",
    lastPayDate: "2025-07-25",
    nextEstExDate: "2026-07-08",
    consecutiveYears: 25,
    rank: 6,
  },
  {
    ticker: "INDF.JK",
    name: "Indofood Sukses Makmur",
    sector: "Consumer Defensive",
    industry: "Food Processing",
    price: 6475,
    change: 25,
    marketCap: 57,
    dividendYield: 4.8,
    dps: 311,
    payoutRatio: 55,
    frequency: "Annual",
    lastExDate: "2025-06-25",
    lastPayDate: "2025-07-15",
    nextEstExDate: "2026-06-24",
    consecutiveYears: 12,
    rank: 7,
  },
  {
    ticker: "ICBP.JK",
    name: "Indofood CBP Sukses",
    sector: "Consumer Defensive",
    industry: "Food Processing",
    price: 11200,
    change: -50,
    marketCap: 130,
    dividendYield: 3.5,
    dps: 392,
    payoutRatio: 70,
    frequency: "Annual",
    lastExDate: "2025-06-11",
    lastPayDate: "2025-07-01",
    nextEstExDate: "2026-06-10",
    consecutiveYears: 10,
    rank: 8,
  },
  {
    ticker: "ADRO.JK",
    name: "Adaro Energy Indonesia",
    sector: "Basic Materials",
    industry: "Coal Mining",
    price: 2870,
    change: -30,
    marketCap: 92,
    dividendYield: 8.5,
    dps: 244,
    payoutRatio: 50,
    frequency: "Annual",
    lastExDate: "2025-05-07",
    lastPayDate: "2025-05-23",
    nextEstExDate: "2026-05-06",
    consecutiveYears: 6,
    rank: 9,
  },
  {
    ticker: "PGAS.JK",
    name: "Perusahaan Gas Negara",
    sector: "Energy",
    industry: "Oil & Gas",
    price: 1580,
    change: 10,
    marketCap: 39,
    dividendYield: 7.8,
    dps: 123,
    payoutRatio: 80,
    frequency: "Annual",
    lastExDate: "2025-05-21",
    lastPayDate: "2025-06-10",
    nextEstExDate: "2026-05-20",
    consecutiveYears: 5,
    rank: 10,
  },
  {
    ticker: "MDKA.JK",
    name: "Merdeka Copper Gold",
    sector: "Basic Materials",
    industry: "Gold Mining",
    price: 1870,
    change: -40,
    marketCap: 60,
    dividendYield: 3.2,
    dps: 60,
    payoutRatio: 35,
    frequency: "Annual",
    lastExDate: "2025-06-04",
    lastPayDate: "2025-06-20",
    nextEstExDate: "2026-06-03",
    consecutiveYears: 3,
    rank: 11,
  },
  {
    ticker: "TBIG.JK",
    name: "Tower Bersama Infra",
    sector: "Real Estate",
    industry: "REITs",
    price: 1250,
    change: -25,
    marketCap: 33,
    dividendYield: 5.9,
    dps: 74,
    payoutRatio: 88,
    frequency: "Semi-Annual",
    lastExDate: "2025-04-16",
    lastPayDate: "2025-05-06",
    nextEstExDate: "2026-04-15",
    consecutiveYears: 7,
    rank: 12,
  },
  {
    ticker: "EXCL.JK",
    name: "XL Axiata",
    sector: "Communication Services",
    industry: "Telecom",
    price: 2150,
    change: -50,
    marketCap: 30,
    dividendYield: 4.5,
    dps: 97,
    payoutRatio: 60,
    frequency: "Annual",
    lastExDate: "2025-05-28",
    lastPayDate: "2025-06-15",
    nextEstExDate: "2026-05-27",
    consecutiveYears: 4,
    rank: 13,
  },
  {
    ticker: "KLBF.JK",
    name: "Kalbe Farma",
    sector: "Healthcare",
    industry: "Pharmaceuticals",
    price: 1455,
    change: -10,
    marketCap: 69,
    dividendYield: 3.8,
    dps: 55,
    payoutRatio: 50,
    frequency: "Semi-Annual",
    lastExDate: "2025-07-02",
    lastPayDate: "2025-07-20",
    nextEstExDate: "2026-07-01",
    consecutiveYears: 18,
    rank: 14,
  },
  {
    ticker: "CPIN.JK",
    name: "Charoen Pokphand",
    sector: "Consumer Defensive",
    industry: "Food Processing",
    price: 4780,
    change: -40,
    marketCap: 63,
    dividendYield: 2.8,
    dps: 134,
    payoutRatio: 40,
    frequency: "Annual",
    lastExDate: "2025-06-18",
    lastPayDate: "2025-07-08",
    nextEstExDate: "2026-06-17",
    consecutiveYears: 8,
    rank: 15,
  },
];

// Generate dividend calendar events for a year
export function getDividendEvents(year: number): DividendEvent[] {
  const events: DividendEvent[] = [];

  dividendStocks.forEach((stock) => {
    // Use the stock's estimated next ex-date month/day, adjust for requested year
    const exDate = new Date(stock.nextEstExDate);
    const payDate = new Date(stock.lastPayDate);

    // Ex-date event
    events.push({
      ticker: stock.ticker,
      name: stock.name,
      type: "EX_DATE",
      date: `${year}-${String(exDate.getMonth() + 1).padStart(2, "0")}-${String(exDate.getDate()).padStart(2, "0")}`,
      dps: stock.dps,
      yield: stock.dividendYield,
    });

    // Cum-date (2 days before ex-date for regular, 1 day for irregular)
    const cumDate = new Date(exDate);
    cumDate.setDate(cumDate.getDate() - 2);
    events.push({
      ticker: stock.ticker,
      name: stock.name,
      type: "CUM_DATE",
      date: `${year}-${String(cumDate.getMonth() + 1).padStart(2, "0")}-${String(cumDate.getDate()).padStart(2, "0")}`,
      dps: stock.dps,
      yield: stock.dividendYield,
    });

    // Payment date
    const payDateAdj = new Date(payDate);
    payDateAdj.setFullYear(year);
    events.push({
      ticker: stock.ticker,
      name: stock.name,
      type: "PAY_DATE",
      date: `${year}-${String(payDateAdj.getMonth() + 1).padStart(2, "0")}-${String(payDateAdj.getDate()).padStart(2, "0")}`,
      dps: stock.dps,
      yield: stock.dividendYield,
    });
  });

  return events.sort((a, b) => a.date.localeCompare(b.date));
}

// Get events for a specific month
export function getEventsForMonth(
  year: number,
  month: number,
): DividendEvent[] {
  const all = getDividendEvents(year);
  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  return all.filter((e) => e.date.startsWith(monthStr));
}

// Filter stocks by sector
export function getSectors(): string[] {
  const sectors = new Set(dividendStocks.map((s) => s.sector));
  return Array.from(sectors).sort();
}

// Sort stocks by various criteria
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
