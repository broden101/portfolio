/**
 * lib/fundamentals.ts — Fetcher + math for FCFF (corporate) and RIM+DDM (bank) DCF models.
 *
 * Data sources:
 *   - stockanalysis.com → income, cashflow, balance sheet, ratios
 *   - TradingView scanner → price, beta
 *
 * Unit conventions (CRITICAL):
 *   - SA revenue/netDebt in MILLIONS → ÷ 1,000,000 = Triliun
 *   - SA shares in MILLIONS → ÷ 1,000 = Miliar
 *   - Bank per-share (BV, EPS, DPS) → already IDR, no conversion
 */

import { FALLBACK_MANUAL } from "@/lib/market";
import { getReserves, type CommodityReserve, type NickelReserves, type CoalReserves, type CpoReserves, type OilGasReserves, type GoldReserves, type CopperGoldReserves, type TinReserves, type AmmoniaReserves } from "./commodityReserves";

// ── Constants ──
const RF = FALLBACK_MANUAL.biRate?.value ?? 5.5; // Risk-free from BI Rate
const RM = 10; // Expected market return %
const TV_HEADER = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36";

// ── Bank ticker whitelist ──
export const BANK_TICKERS: Set<string> = new Set([
  // Mega banks
  "BBCA", "BBRI", "BMRI", "BBNI",
  // State / syariah
  "BBTN", "BRIS", "BTPS", "MBBT", "PNBS",
  // Regional
  "BBHI", "BBKP", "BBLD", "MAYA", "MEGA", "NISP", "BGTG", "AGRS",
  // Insurance
  "ABDA", "AMAG", "ASBI", "ASRM", "MREI", "TUGU", "LPGI", "PNLF",
  // Securities / finance
  "BFIN", "CFIN", "TRIM", "MGNA", "BTPN", "ARTO", "BBYB",
  // More banks
  "BNLI", "BSWD", "PNBN", "SMMA",
]);

export function isBankTicker(ticker: string): boolean {
  return BANK_TICKERS.has(ticker.toUpperCase());
}

// ── Types ──
export interface SAFinancials {
  ticker: string;
  income: Record<string, (number | null)[]>;
  cashflow: Record<string, (number | null)[]>;
  balance: Record<string, (number | null)[]>;
  ratios?: Record<string, (number | null)[]>;
  years: string[];
}

export interface DcfInputs {
  isBank: false;
  ticker: string;
  price: number;
  beta: number;
  baseRevenue: number;   // Triliun
  ebitMargin: number;    // %
  capexPct: number;      // %
  daPct: number;         // %
  wcPct: number;         // %
  shares: number;        // Miliar
  netDebt: number;       // Triliun
  taxRate: number;       // %
  growthRates: number[]; // Y1-Y5 %
  wacc: number;          // %
  terminalGrowth: number;// %
}

export interface BankInputs {
  isBank: true;
  ticker: string;
  price: number;
  beta: number;
  bvPerShare: number;    // IDR
  roe: number;           // %
  payout: number;        // %
  eps: number;           // IDR
  dps: number;           // IDR
  shares: number;        // Miliar
  ke: number;            // cost of equity %
  growthRates: number[]; // Y1-Y5 % (SGR-based, fade to 3%)
  terminalGrowth: number;// %
  roeFloor: number;      // max(Ke, 12%)
  roeTerminal: number;   // clamp(currentROE, 12%, 20%)
}

export interface BankValuation {
  rimValue: number;      // IDR/share
  ddmValue: number;      // IDR/share
  blended: number;       // average
  justifiedPB: number;   // (ROE - g) / (Ke - g)
  marketPB: number;      // price / BV0
  upside: number;        // %
  ke: number;
  roeSpread: number;     // ROE - Ke (%)
  roePath: number[];
  bvPath: number[];
  riPath: number[];
  dpsPath: number[];
}

// ── CAPM helper ──
function capm(beta: number): number {
  return RF + beta * (RM - RF);
}

// ── HTML table parser for StockAnalysis ──
// SA financial pages render a <table> with header row = years, data rows = metrics.
// Returns { headers: string[], rows: { label: string; values: (number|null)[] }[] }
function parseSATable(html: string): { headers: string[]; rows: { label: string; values: (number | null)[] }[] } | null {
  // Try to find table data embedded as JSON in __NEXT_DATA__ or script tags first
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (nextDataMatch) {
    try {
      const json = JSON.parse(nextDataMatch[1]);
      // SA sometimes embeds financial data in props
      const tableData = findTableInJson(json);
      if (tableData) return tableData;
    } catch { /* fall through to HTML parse */ }
  }

  // Also try: SA sometimes has financial data in script tags as window.__data or similar
  const scriptDataMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});?\s*<\/script>/);
  if (scriptDataMatch) {
    try {
      const json = JSON.parse(scriptDataMatch[1]);
      const tableData = findTableInJson(json);
      if (tableData) return tableData;
    } catch { /* fall through */ }
  }

  // Fallback: parse HTML table
  const tableMatch = html.match(/<table[^>]*>([\s\S]*?)<\/table>/i);
  if (!tableMatch) return null;

  const tableHtml = tableMatch[1];
  const rows: string[] = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
    rows.push(rowMatch[1]);
  }

  if (rows.length < 2) return null;

  // Parse header row
  const headerCells = parseCells(rows[0]);
  const headers = headerCells.map((c) => c.trim());

  // Parse data rows
  const dataRows: { label: string; values: (number | null)[] }[] = [];
  for (let i = 1; i < rows.length; i++) {
    const cells = parseCells(rows[i]);
    if (cells.length < 2) continue;
    const label = cells[0].trim();
    const values: (number | null)[] = [];
    for (let j = 1; j < cells.length; j++) {
      values.push(parseNumber(cells[j]));
    }
    dataRows.push({ label, values });
  }

  return { headers, rows: dataRows };
}

function parseCells(rowHtml: string): string[] {
  const cells: string[] = [];
  const cellRegex = /<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi;
  let m: RegExpExecArray | null;
  while ((m = cellRegex.exec(rowHtml)) !== null) {
    // Strip HTML tags
    cells.push(m[1].replace(/<[^>]+>/g, "").trim());
  }
  return cells;
}

function parseNumber(text: string): number | null {
  const cleaned = text.replace(/[,$\s]/g, "").replace(/\((.+)\)/, "-$1");
  if (!cleaned || cleaned === "-" || cleaned === "N/A" || cleaned === "—") return null;
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

// Try to find table-shaped data inside a nested JSON object
function findTableInJson(obj: unknown, depth = 0): { headers: string[]; rows: { label: string; values: (number | null)[] }[] } | null {
  if (depth > 8 || !obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;

  // Look for arrays of arrays that look like financial tables
  for (const key of Object.keys(o)) {
    const val = o[key];
    if (Array.isArray(val) && val.length > 2 && Array.isArray(val[0])) {
      const firstRow = val[0] as unknown[];
      if (firstRow.length > 2 && typeof firstRow[0] === "string") {
        // Looks like a table — first row headers, rest data
        const headers = (firstRow as string[]).map(String);
        const rows: { label: string; values: (number | null)[] }[] = [];
        for (let i = 1; i < val.length; i++) {
          const r = val[i] as unknown[];
          if (!Array.isArray(r) || r.length < 2) continue;
          rows.push({
            label: String(r[0]),
            values: r.slice(1).map((v) => (typeof v === "number" ? v : parseNumber(String(v)))),
          });
        }
        if (rows.length >= 3) return { headers, rows };
      }
    }
    const nested = findTableInJson(val, depth + 1);
    if (nested) return nested;
  }
  return null;
}

// Normalize a label for matching: lowercase, strip non-alphanumeric chars.
// Fixes mismatches caused by apostrophes (Shareholders' Equity), HTML entities (&amp;), etc.
function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Extract value from a row by label (case-insensitive partial match, punctuation-agnostic)
// Accepts both array-of-objects and Record<string, array> formats
function findRow(
  rows: { label: string; values: (number | null)[] }[] | Record<string, (number | null)[]> | undefined,
  ...patterns: string[]
): (number | null)[] | null {
  if (!rows) return null;

  const normPatterns = patterns.map(norm);

  // Record<string, (number|null)[]> — from SAFinancials income/cashflow/balance/ratios
  if (!Array.isArray(rows)) {
    const keys = Object.keys(rows);
    for (const key of keys) {
      const n = norm(key);
      for (const np of normPatterns) {
        if (n.includes(np)) return rows[key];
      }
    }
    return null;
  }

  // Array<{label, values}> — from parsed HTML tables
  for (const row of rows) {
    const n = norm(row.label);
    for (const np of normPatterns) {
      if (n.includes(np)) return row.values;
    }
  }
  return null;
}

// Get the first non-null value from an array (latest year first typically)
function latestValue(vals: (number | null)[] | null): number | null {
  if (!vals || vals.length === 0) return null;
  for (const v of vals) {
    if (v !== null && Number.isFinite(v)) return v;
  }
  return null;
}

// Get all non-null values (up to 5)
function allValues(vals: (number | null)[] | null, max = 5): number[] {
  if (!vals) return [];
  const result: number[] = [];
  for (const v of vals) {
    if (v !== null && Number.isFinite(v)) result.push(v);
    if (result.length >= max) break;
  }
  return result;
}

// ── Fetch StockAnalysis financials ──
const SA_HEADERS = {
  "User-Agent": TV_HEADER,
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
};

async function fetchSAPage(ticker: string, path: string): Promise<string | null> {
  try {
    const url = `https://stockanalysis.com/quote/idx/${ticker}/${path}`;
    const res = await fetch(url, { headers: SA_HEADERS } as RequestInit);
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}

export async function fetchStockAnalysis(ticker: string): Promise<SAFinancials | null> {
  const t = ticker.toUpperCase();

  const [incomeHtml, cashflowHtml, balanceHtml, ratiosHtml] = await Promise.all([
    fetchSAPage(t, "financials/"),
    fetchSAPage(t, "financials/cash-flow-statement/"),
    fetchSAPage(t, "financials/balance-sheet/"),
    fetchSAPage(t, "financials/?p=ratios"),
  ]);

  if (!incomeHtml && !cashflowHtml && !balanceHtml) return null;

  const incomeTable = incomeHtml ? parseSATable(incomeHtml) : null;
  const cashflowTable = cashflowHtml ? parseSATable(cashflowHtml) : null;
  const balanceTable = balanceHtml ? parseSATable(balanceHtml) : null;
  const ratiosTable = ratiosHtml ? parseSATable(ratiosHtml) : null;

  const years = incomeTable?.headers.slice(1).map((h) => h.trim()) ?? [];

  // Build income record
  const income: Record<string, (number | null)[]> = {};
  if (incomeTable) {
    for (const row of incomeTable.rows) {
      income[row.label] = row.values;
    }
  }

  // Build cashflow record
  const cashflow: Record<string, (number | null)[]> = {};
  if (cashflowTable) {
    for (const row of cashflowTable.rows) {
      cashflow[row.label] = row.values;
    }
  }

  // Build balance record
  const balance: Record<string, (number | null)[]> = {};
  if (balanceTable) {
    for (const row of balanceTable.rows) {
      balance[row.label] = row.values;
    }
  }

  // Build ratios record
  const ratios: Record<string, (number | null)[]> = {};
  if (ratiosTable) {
    for (const row of ratiosTable.rows) {
      ratios[row.label] = row.values;
    }
  }

  return {
    ticker: t,
    income,
    cashflow,
    balance,
    ratios: ratiosTable ? ratios : undefined,
    years,
  };
}

// ── Fetch TradingView price + beta ──
export async function fetchTvQuote(ticker: string): Promise<{ price: number; beta: number } | null> {
  const t = ticker.toUpperCase();
  try {
    const payload = {
      columns: ["close", "beta"],
      filter: [
        { left: "name", operation: "equal", right: t },
        { left: "is_primary", operation: "equal", right: true },
      ],
      range: [0, 1],
      sort: { sortBy: "market_cap_basic", sortOrder: "desc" },
      markets: ["id"],
    };

    const res = await fetch("https://scanner.tradingview.com/indonesia/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": TV_HEADER },
      body: JSON.stringify(payload),
    } as RequestInit);

    if (!res.ok) return null;
    const data = await res.json();
    const row = data?.data?.[0]?.d;
    if (!row || row.length < 2) return null;

    return { price: row[0] ?? 0, beta: row[1] ?? 1 };
  } catch {
    return null;
  }
}

// ── Compute DCF inputs from raw financials ──
export function computeDcfInputs(sa: SAFinancials, price: number, beta: number): DcfInputs {
  // Revenue — look for "Revenue", "Total Revenue", "Net Revenue"
  const revenueRow = findRow(sa.income, "revenue", "total revenue", "net revenue", "net sales") ??
    findRow(sa.income, "sales");
  const revenues = allValues(revenueRow);
  const latestRevenue = revenues[0] ?? 0; // MILLIONS

  // EBIT margin
  const ebitRow = findRow(sa.income, "operating income", "ebit", "income from operations");
  const ebitVals = allValues(ebitRow);
  const latestEbit = ebitVals[0] ?? 0;
  const ebitMargin = latestRevenue > 0 ? (latestEbit / latestRevenue) * 100 : 25;

  // Capex (negative in SA, take abs)
  const capexRow = findRow(sa.cashflow, "capital expenditure", "capex", "purchase of property");
  const capexVals = allValues(capexRow);
  const latestCapex = Math.abs(capexVals[0] ?? 0);
  const capexPct = latestRevenue > 0 ? (latestCapex / latestRevenue) * 100 : 5;

  // D&A
  const daRow = findRow(sa.cashflow, "depreciation", "depreciation & amortization", "depreciation and amortization") ??
    findRow(sa.income, "depreciation");
  const daVals = allValues(daRow);
  const latestDA = daVals[0] ?? 0;
  const daPct = latestRevenue > 0 ? (latestDA / latestRevenue) * 100 : 5;

  // Working capital change — use change in current assets minus current liabilities
  // Approximate: use "Change in Working Capital" from cashflow if available
  const wcRow = findRow(sa.cashflow, "change in working capital", "working capital");
  const wcVals = allValues(wcRow);
  const latestWC = wcVals[0] ?? 0;
  const wcPct = latestRevenue > 0 ? Math.abs(latestWC / latestRevenue) * 100 : 3;

  // Shares outstanding
  const sharesRow = findRow(sa.income, "shares outstanding", "weighted average shares", "diluted shares") ??
    findRow(sa.balance, "shares outstanding", "common stock");
  const sharesVal = latestValue(sharesRow) ?? 1000; // MILLIONS

  // Net debt = total debt - cash
  const totalDebtRow = findRow(sa.balance, "total debt", "long-term debt", "long term debt") ??
    findRow(sa.balance, "borrowings");
  const cashRow = findRow(sa.balance, "cash and cash equivalents", "cash & equivalents", "cash and equivalents", "cash");
  const totalDebt = latestValue(totalDebtRow) ?? 0;
  const cashAndEquivalents = latestValue(cashRow) ?? 0;
  const netDebt = totalDebt - cashAndEquivalents; // MILLIONS

  // Tax rate — effective
  const taxRow = findRow(sa.income, "income tax", "tax provision", "income tax expense");
  const pretaxRow = findRow(sa.income, "pretax income", "income before tax", "earnings before tax");
  const taxVal = latestValue(taxRow);
  const pretaxVal = latestValue(pretaxRow);
  let taxRate = 22;
  if (taxVal !== null && pretaxVal !== null && pretaxVal > 0) {
    taxRate = Math.min(Math.max((taxVal / pretaxVal) * 100, 10), 30);
  }

  // Revenue CAGR (5Y, geometric)
  let growthRate = 10;
  if (revenues.length >= 2) {
    const first = revenues[revenues.length - 1]; // oldest
    const last = revenues[0]; // newest
    const years = revenues.length - 1;
    if (first > 0 && last > 0 && years > 0) {
      growthRate = (Math.pow(last / first, 1 / years) - 1) * 100;
      growthRate = Math.min(Math.max(growthRate, -5), 25); // cap at 25%
    }
  }

  // Generate 5Y growth rates: fade from CAGR toward terminalGrowth
  const terminalGrowth = 5;
  const growthRates: number[] = [];
  for (let i = 0; i < 5; i++) {
    const g = growthRate - ((growthRate - terminalGrowth) * i) / 5;
    growthRates.push(Math.round(g * 10) / 10);
  }

  // WACC = CAPM
  const wacc = capm(beta);

  return {
    isBank: false,
    ticker: sa.ticker,
    price,
    beta,
    baseRevenue: latestRevenue / 1_000_000, // MILLIONS → Triliun
    ebitMargin: Math.round(ebitMargin * 10) / 10,
    capexPct: Math.round(capexPct * 10) / 10,
    daPct: Math.round(daPct * 10) / 10,
    wcPct: Math.round(wcPct * 10) / 10,
    shares: sharesVal / 1000, // MILLIONS → Miliar
    netDebt: netDebt / 1_000_000, // MILLIONS → Triliun
    taxRate: Math.round(taxRate * 10) / 10,
    growthRates,
    wacc: Math.round(wacc * 100) / 100,
    terminalGrowth,
  };
}

// ── Compute Bank inputs from raw financials ──
export function computeBankInputs(sa: SAFinancials, price: number, beta: number): BankInputs {
  const ke = capm(beta);

  // Book Value Per Share — look in balance sheet
  const bvpsRow = findRow(sa.ratios, "book value per share", "book value", "bv per share") ??
    findRow(sa.balance, "book value");
  let bvPerShare = latestValue(bvpsRow) ?? 0;

  // If BV not found as per-share, try total equity / shares
  if (bvPerShare === 0) {
    const equityRow = findRow(sa.balance, "total equity", "stockholders equity", "shareholders equity", "total stockholders");
    const sharesRow = findRow(sa.income, "shares outstanding", "weighted average shares", "diluted shares") ??
      findRow(sa.balance, "shares outstanding", "common stock");
    const equity = latestValue(equityRow) ?? 0; // MILLIONS
    const shares = latestValue(sharesRow) ?? 1; // MILLIONS
    bvPerShare = shares > 0 ? (equity / shares) * 1_000_000 / 1_000_000 : 0; // already per share in IDR
  }

  // EPS (needed for ROE fallback)
  const epsRow = findRow(sa.ratios, "earnings per share", "eps") ??
    findRow(sa.income, "earnings per share", "diluted eps");
  const eps = latestValue(epsRow) ?? 0;

  // DPS (needed for payout fallback)
  const dpsRow = findRow(sa.ratios, "dividends per share", "dps") ??
    findRow(sa.ratios, "dividend per share");
  const dps = latestValue(dpsRow) ?? 0;

  // ROE — try ratios page first, sanity-check, then fallback
  const roeRow = findRow(sa.ratios, "return on equity", "roe") ??
    findRow(sa.ratios, "return on equity");
  let roe = latestValue(roeRow) ?? 0;
  // Unreasonable ROE from ratios → recompute from EPS / BV
  if (roe > 50 || roe < 0 || roe === 0) {
    if (bvPerShare > 0 && eps > 0) {
      roe = (eps / bvPerShare) * 100;
    } else {
      const niRow = findRow(sa.income, "net income", "net income common");
      const equityRow = findRow(sa.balance, "total equity", "stockholders equity");
      const ni = latestValue(niRow) ?? 0;
      const eq = latestValue(equityRow) ?? 1;
      roe = eq > 0 ? (ni / eq) * 100 : 15;
    }
    roe = Math.min(Math.max(roe, 1), 50); // hard cap after fallback
  }

  // Payout ratio — try ratios page first, sanity-check, then fallback
  const payoutRow = findRow(sa.ratios, "payout ratio", "dividend payout", "payout") ??
    findRow(sa.ratios, "dividend payout ratio");
  let payout = latestValue(payoutRow) ?? 0;
  if (payout > 100 || payout < 0 || payout === 0) {
    if (eps > 0 && dps > 0) {
      payout = (dps / eps) * 100;
    } else {
      payout = 40;
    }
    payout = Math.min(Math.max(payout, 0), 100);
  }

  // Shares
  const sharesRow = findRow(sa.income, "shares outstanding", "weighted average shares", "diluted shares") ??
    findRow(sa.balance, "shares outstanding", "common stock");
  const sharesRaw = latestValue(sharesRow) ?? 1000; // MILLIONS

  // Bank growth: SGR = retention × ROE, capped at 25%
  const retention = payout > 0 ? 1 - payout / 100 : 0.6;
  const sgr = Math.min(retention * roe, 25);
  const terminalGrowth = 3;

  // Growth fades linearly from SGR to terminal
  const growthRates: number[] = [];
  for (let i = 0; i < 5; i++) {
    const g = sgr - ((sgr - terminalGrowth) * i) / 4;
    growthRates.push(Math.round(Math.max(g, 0) * 10) / 10);
  }

  const roeFloor = Math.max(ke, 12);
  const roeTerminal = Math.min(Math.max(roe, 12), 20);

  return {
    isBank: true,
    ticker: sa.ticker,
    price,
    beta,
    bvPerShare: Math.round(bvPerShare),
    roe: Math.round(roe * 100) / 100,
    payout: Math.round(payout * 100) / 100,
    eps: Math.round(eps),
    dps: Math.round(dps),
    shares: sharesRaw / 1000, // MILLIONS → Miliar
    ke: Math.round(ke * 100) / 100,
    growthRates,
    terminalGrowth,
    roeFloor: Math.round(roeFloor * 100) / 100,
    roeTerminal: Math.round(roeTerminal * 100) / 100,
  };
}

// ── Compute Bank Valuation (RIM + DDM) ──
export function computeBankValuation(inputs: BankInputs): BankValuation {
  const { bvPerShare, roe, ke, payout, growthRates, terminalGrowth, roeTerminal } = inputs;
  const keDec = ke / 100;
  const tgDec = terminalGrowth / 100;
  const payoutDec = payout / 100;

  const roePath: number[] = [];
  const bvPath: number[] = [];
  const riPath: number[] = [];
  const dpsPath: number[] = [];

  let bv = bvPerShare;
  const rimPVs: number[] = [];
  const ddmPVs: number[] = [];

  for (let i = 0; i < 5; i++) {
    // ROE fades from current toward roeTerminal linearly
    const roeY = roe - ((roe - roeTerminal) * i) / 4;
    const roeDec = Math.max(roeY, 0) / 100;
    const disc = Math.pow(1 + keDec, i + 1);

    // EPS = ROE × BV(beginning)
    const eps = roeDec * bv;
    // DPS = payout × EPS
    const dps = payoutDec * eps;
    // RI = EPS - DPS = (1 - payout) × EPS
    const ri = eps - dps;

    roePath.push(Math.round(roeY * 100) / 100);
    bvPath.push(Math.round(bv));
    riPath.push(Math.round(ri));
    dpsPath.push(Math.round(dps));

    rimPVs.push(ri / disc);
    ddmPVs.push(dps / disc);

    // BV grows: BV(next) = BV + RI (retained earnings)
    bv = bv + ri;
  }

  // Terminal RI & DPS (year 6 steady-state)
  const terminalROE = roeTerminal / 100;
  const terminalEPS = terminalROE * bv;
  const terminalDPS = payoutDec * terminalEPS;
  const terminalRI = terminalEPS - terminalDPS;

  // RIM: V0 = BV0 + Σ PV(RI_t) + TV_RIM
  const tvRI = (terminalRI * (1 + tgDec)) / (keDec - tgDec);
  const pvTVri = keDec > tgDec ? tvRI / Math.pow(1 + keDec, 5) : 0;
  const rimPV = rimPVs.reduce((a, b) => a + b, 0);
  const rimValue = bvPerShare + rimPV + pvTVri;

  // DDM: V0 = Σ PV(DPS_t) + TV_DDM
  const tvDPS = (terminalDPS * (1 + tgDec)) / (keDec - tgDec);
  const pvTVdps = keDec > tgDec ? tvDPS / Math.pow(1 + keDec, 5) : 0;
  const ddmPV = ddmPVs.reduce((a, b) => a + b, 0);
  const ddmValue = ddmPV + pvTVdps;

  // Blended = average of RIM and DDM
  const blended = (rimValue + ddmValue) / 2;

  // Justified P/B using terminal growth
  const justifiedPB = keDec > tgDec ? (roe / 100 - tgDec) / (keDec - tgDec) : 0;
  const marketPB = bvPerShare > 0 ? inputs.price / bvPerShare : 0;

  const upside = inputs.price > 0 ? ((blended / inputs.price) - 1) * 100 : 0;

  return {
    rimValue: Math.round(rimValue),
    ddmValue: Math.round(ddmValue),
    blended: Math.round(blended),
    justifiedPB: Math.round(justifiedPB * 100) / 100,
    marketPB: Math.round(marketPB * 100) / 100,
    upside: Math.round(upside * 100) / 100,
    ke,
    roeSpread: Math.round((inputs.roe - inputs.ke) * 100) / 100,
    roePath,
    bvPath,
    riPath,
    dpsPath,
  };
}

// ── Commodity NAV computation ──
export interface CommodityNavResult {
  ticker: string;
  commodityType: string;
  mineLifeYears: number;
  reserveSummary: string;
  scenarios: { label: string; fairValuePerShare: number; upside: number; priceAssumption: string }[];
  cashCost: string;
  annualProduction: string;
  asOf: string;
  sourceUrl: string;
}

// Live commodity prices — fetched from TradingView
const COMMODITY_TV_SYMBOLS: Record<string, string> = {
  coal: "TVC:COAL",
  nickel: "TVC:NICKEL",
  cpo: "TVC:PALMOIL",
  oilgas: "TVC:UKOIL",
  gold: "TVC:GOLD",
  copperGold: "TVC:COPPER",
  tin: "TVC:TIN",
  ammonia: "", // no reliable TradingView spot; use mid-cycle fallback
};

// Mid-cycle prices (USD or IDR per unit)
const MID_CYCLE_PRICES: Record<string, { mid: number; low: number; high: number; unit: string }> = {
  coal: { mid: 110, low: 80, high: 140, unit: "USD/ton" },
  nickel: { mid: 15000, low: 13000, high: 17000, unit: "USD/ton matte" },
  cpo: { mid: 14000, low: 11000, high: 17000, unit: "IDR/kg" },
  oilgas: { mid: 75, low: 60, high: 90, unit: "USD/boe" },
  gold: { mid: 2500, low: 2000, high: 3200, unit: "USD/oz" },
  copperGold: { mid: 4.25, low: 3.50, high: 5.25, unit: "USD/lb Cu" },
  tin: { mid: 28000, low: 22000, high: 34000, unit: "USD/ton" },
  ammonia: { mid: 450, low: 350, high: 600, unit: "USD/ton" },
};

async function fetchLiveCommodityPrice(type: string): Promise<number | null> {
  const symbol = COMMODITY_TV_SYMBOLS[type];
  if (!symbol) return null;
  try {
    const res = await fetch("https://scanner.tradingview.com/global/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ columns: ["close"], symbols: { tickers: [symbol] }, range: [0, 1] }),
    });
    const data = await res.json();
    const close = data?.data?.[0]?.d?.[0];
    return typeof close === "number" ? close : null;
  } catch {
    return null;
  }
}

export async function computeCommodityNav(
  ticker: string,
  currentPrice: number,
  sharesOutstanding: number,
  usdIdrRate: number = 16000,
  wacc: number = 10
): Promise<CommodityNavResult | null> {
  const reserve = getReserves(ticker);
  if (!reserve) return null;

  const livePrice = await fetchLiveCommodityPrice(reserve.type);
  const midCycle = MID_CYCLE_PRICES[reserve.type];
  const waccDec = wacc / 100;

  const scenarios: CommodityNavResult["scenarios"] = [];

  if (reserve.type === "nickel") {
    const r = reserve as NickelReserves;
    const recoverableNi = r.measuredIndicatedDMT_M * 1e6 * (r.gradeNiPct / 100) * r.recovery;
    const mineLife = Math.min(Math.round(recoverableNi / r.annualMatteT), 50);

    for (const [label, priceMultiplier] of [
      ["mid-cycle", midCycle.mid],
      ["optimistic", midCycle.high],
      ["pessimistic", midCycle.low],
    ] as const) {
      // Fade from live to mid-cycle over 5 years, then flat
      const liveP = livePrice ?? midCycle.mid;
      let navUSD = 0;
      for (let t = 1; t <= mineLife; t++) {
        const priceT = t <= 5
          ? liveP + (priceMultiplier - liveP) * (t / 5)
          : priceMultiplier;
        const fcfUSD = (priceT - r.cashCostUSDperTonneMatte) * r.annualMatteT;
        navUSD += fcfUSD / Math.pow(1 + waccDec, t);
      }
      const navPerShare = (navUSD * usdIdrRate) / (sharesOutstanding * 1e9);
      scenarios.push({
        label: `NAV ${label}`,
        fairValuePerShare: Math.round(navPerShare),
        upside: currentPrice > 0 ? Math.round((navPerShare / currentPrice - 1) * 100) : 0,
        priceAssumption: `${(livePrice ?? midCycle.mid).toLocaleString()} → ${priceMultiplier.toLocaleString()} USD/ton`,
      });
    }

    return {
      ticker, commodityType: "Nickel", mineLifeYears: mineLife,
      reserveSummary: `${r.measuredIndicatedDMT_M.toFixed(1)}M DMT @ ${r.gradeNiPct}% Ni, recovery ${(r.recovery * 100).toFixed(0)}%`,
      scenarios, cashCost: `US$${r.cashCostUSDperTonneMatte.toLocaleString()}/ton matte`,
      annualProduction: `${r.annualMatteT.toLocaleString()} ton matte/yr`,
      asOf: r.asOf, sourceUrl: r.sourceUrl,
    };
  }

  if (reserve.type === "gold") {
    const r = reserve as GoldReserves;
    const effectiveReserve = r.provenProbableOz + Math.max(0, r.measuredIndicatedInferredOz - r.provenProbableOz) * 0.3;
    const mineLife = Math.min(Math.round(effectiveReserve / r.annualProductionOz), 50);

    for (const [label, priceMultiplier] of [
      ["mid-cycle", midCycle.mid],
      ["optimistic", midCycle.high],
      ["pessimistic", midCycle.low],
    ] as const) {
      const liveP = livePrice ?? midCycle.mid;
      let navUSD = 0;
      for (let t = 1; t <= mineLife; t++) {
        const priceT = t <= 5
          ? liveP + (priceMultiplier - liveP) * (t / 5)
          : priceMultiplier;
        const fcfUSD = (priceT - r.cashCostUSDperOz) * r.annualProductionOz;
        navUSD += fcfUSD / Math.pow(1 + waccDec, t);
      }
      const navPerShare = (navUSD * usdIdrRate) / (sharesOutstanding * 1e9);
      scenarios.push({
        label: `NAV ${label}`,
        fairValuePerShare: Math.round(navPerShare),
        upside: currentPrice > 0 ? Math.round((navPerShare / currentPrice - 1) * 100) : 0,
        priceAssumption: `${(livePrice ?? midCycle.mid).toLocaleString()} → ${priceMultiplier.toLocaleString()} USD/oz`,
      });
    }

    return {
      ticker, commodityType: "Gold", mineLifeYears: mineLife,
      reserveSummary: `${(r.provenProbableOz / 1e6).toFixed(2)} Moz reserve, ${(r.measuredIndicatedInferredOz / 1e6).toFixed(2)} Moz resource`,
      scenarios, cashCost: `US$${r.cashCostUSDperOz.toLocaleString()}/oz`,
      annualProduction: `${r.annualProductionOz.toLocaleString()} oz/yr`,
      asOf: r.asOf, sourceUrl: r.sourceUrl,
    };
  }

  if (reserve.type === "copperGold") {
    const r = reserve as CopperGoldReserves;
    const copperLife = r.containedCopperMlbs / r.annualCopperMlbs;
    const goldLife = (r.containedGoldMoz * 1000) / r.annualGoldKoz;
    const throughputLife = r.oreReserveMt / r.annualThroughputMt;
    const mineLife = Math.min(Math.round(Math.max(copperLife, goldLife, throughputLife)), 50);

    for (const [label, priceMultiplier] of [
      ["mid-cycle", midCycle.mid],
      ["optimistic", midCycle.high],
      ["pessimistic", midCycle.low],
    ] as const) {
      const liveP = livePrice ?? midCycle.mid;
      let navUSD = 0;
      for (let t = 1; t <= mineLife; t++) {
        const priceT = t <= 5
          ? liveP + (priceMultiplier - liveP) * (t / 5)
          : priceMultiplier;
        const copperFcfUSD = (priceT - r.cashCostUSDperLb) * r.annualCopperMlbs * 1e6;
        const goldByproductUSD = r.annualGoldKoz * 1000 * MID_CYCLE_PRICES.gold.mid;
        const fcfUSD = copperFcfUSD + goldByproductUSD;
        navUSD += fcfUSD / Math.pow(1 + waccDec, t);
      }
      const navPerShare = (navUSD * usdIdrRate) / (sharesOutstanding * 1e9);
      scenarios.push({
        label: `NAV ${label}`,
        fairValuePerShare: Math.round(navPerShare),
        upside: currentPrice > 0 ? Math.round((navPerShare / currentPrice - 1) * 100) : 0,
        priceAssumption: `${(livePrice ?? midCycle.mid).toFixed(2)} → ${priceMultiplier.toFixed(2)} USD/lb Cu + gold US$${MID_CYCLE_PRICES.gold.mid.toLocaleString()}/oz`,
      });
    }

    return {
      ticker, commodityType: "Copper-Gold", mineLifeYears: mineLife,
      reserveSummary: `${r.oreReserveMt.toLocaleString()}Mt ore reserve, ${(r.containedCopperMlbs / 1000).toFixed(2)}B lbs Cu, ${r.containedGoldMoz.toFixed(2)}Moz Au`,
      scenarios, cashCost: `US$${r.cashCostUSDperLb}/lb C1 net by-product`,
      annualProduction: `${r.annualCopperMlbs.toLocaleString()} Mlbs Cu + ${r.annualGoldKoz.toLocaleString()} koz Au/yr`,
      asOf: r.asOf, sourceUrl: r.sourceUrl,
    };
  }

  if (reserve.type === "tin") {
    const r = reserve as TinReserves;
    const effectiveReserve = r.provenT + r.resourcesT * 0.5;
    const mineLife = Math.min(Math.round(effectiveReserve / r.annualProductionT), 50);

    for (const [label, priceMultiplier] of [
      ["mid-cycle", midCycle.mid],
      ["optimistic", midCycle.high],
      ["pessimistic", midCycle.low],
    ] as const) {
      const liveP = livePrice ?? midCycle.mid;
      let navUSD = 0;
      for (let t = 1; t <= mineLife; t++) {
        const priceT = t <= 5
          ? liveP + (priceMultiplier - liveP) * (t / 5)
          : priceMultiplier;
        const fcfUSD = (priceT - r.cashCostUSDperTonne) * r.annualProductionT;
        navUSD += fcfUSD / Math.pow(1 + waccDec, t);
      }
      const navPerShare = (navUSD * usdIdrRate) / (sharesOutstanding * 1e9);
      scenarios.push({
        label: `NAV ${label}`,
        fairValuePerShare: Math.round(navPerShare),
        upside: currentPrice > 0 ? Math.round((navPerShare / currentPrice - 1) * 100) : 0,
        priceAssumption: `${(livePrice ?? midCycle.mid).toLocaleString()} → ${priceMultiplier.toLocaleString()} USD/ton`,
      });
    }

    return {
      ticker, commodityType: "Tin", mineLifeYears: mineLife,
      reserveSummary: `${r.provenT.toLocaleString()}t proven, +${r.resourcesT.toLocaleString()}t resources @ 50% confidence`,
      scenarios, cashCost: `US$${r.cashCostUSDperTonne.toLocaleString()}/ton`,
      annualProduction: `${r.annualProductionT.toLocaleString()} ton/yr`,
      asOf: r.asOf, sourceUrl: r.sourceUrl,
    };
  }

  if (reserve.type === "ammonia") {
    const r = reserve as AmmoniaReserves;
    const mineLife = r.plantLifeYears;

    for (const [label, priceMultiplier] of [
      ["mid-cycle", midCycle.mid],
      ["optimistic", midCycle.high],
      ["pessimistic", midCycle.low],
    ] as const) {
      let navUSD = 0;
      for (let t = 1; t <= mineLife; t++) {
        const fcfUSD = (priceMultiplier - r.cashCostUSDperTonne) * r.annualProductionT;
        navUSD += fcfUSD / Math.pow(1 + waccDec, t);
      }
      const navPerShare = (navUSD * usdIdrRate) / (sharesOutstanding * 1e9);
      scenarios.push({
        label: `NAV ${label}`,
        fairValuePerShare: Math.round(navPerShare),
        upside: currentPrice > 0 ? Math.round((navPerShare / currentPrice - 1) * 100) : 0,
        priceAssumption: `${priceMultiplier.toLocaleString()} USD/ton ammonia`,
      });
    }

    return {
      ticker, commodityType: "Ammonia", mineLifeYears: mineLife,
      reserveSummary: `${r.capacityT.toLocaleString()}t capacity, ${(r.capacityUtilization * 100).toFixed(0)}% utilization`,
      scenarios, cashCost: `US$${r.cashCostUSDperTonne.toLocaleString()}/ton`,
      annualProduction: `${r.annualProductionT.toLocaleString()} ton ammonia/yr`,
      asOf: r.asOf, sourceUrl: r.sourceUrl,
    };
  }

  if (reserve.type === "coal") {
    const r = reserve as CoalReserves;
    const effectiveReserve = r.provenMt + r.indicatedMt * 0.7;
    const mineLife = Math.min(Math.round(effectiveReserve / r.annualProductionMt), 50);

    for (const [label, priceMultiplier] of [
      ["mid-cycle", midCycle.mid],
      ["optimistic", midCycle.high],
      ["pessimistic", midCycle.low],
    ] as const) {
      const liveP = livePrice ?? midCycle.mid;
      let navUSD = 0;
      for (let t = 1; t <= mineLife; t++) {
        const priceT = t <= 5
          ? liveP + (priceMultiplier - liveP) * (t / 5)
          : priceMultiplier;
        const fcfUSD = (priceT - r.cashCostPerTonUSD) * r.annualProductionMt * 1e6;
        navUSD += fcfUSD / Math.pow(1 + waccDec, t);
      }
      const navPerShare = (navUSD * usdIdrRate) / (sharesOutstanding * 1e9);
      scenarios.push({
        label: `NAV ${label}`,
        fairValuePerShare: Math.round(navPerShare),
        upside: currentPrice > 0 ? Math.round((navPerShare / currentPrice - 1) * 100) : 0,
        priceAssumption: `${(livePrice ?? midCycle.mid).toFixed(0)} → ${priceMultiplier} USD/ton`,
      });
    }

    return {
      ticker, commodityType: "Coal", mineLifeYears: mineLife,
      reserveSummary: `${(r.provenMt + r.indicatedMt).toFixed(0)}Mt reserve, GAR ${r.gradeGAR} kcal/kg`,
      scenarios, cashCost: `US$${r.cashCostPerTonUSD}/ton (strip ${r.stripRatio}:1)`,
      annualProduction: `${r.annualProductionMt} Mt/yr`,
      asOf: r.asOf, sourceUrl: r.sourceUrl,
    };
  }

  if (reserve.type === "cpo") {
    const r = reserve as CpoReserves;
    const mineLife = 25; // plantation, replanting cycle

    for (const [label, priceMultiplier] of [
      ["mid-cycle", midCycle.mid],
      ["optimistic", midCycle.high],
      ["pessimistic", midCycle.low],
    ] as const) {
      const liveP = livePrice ?? midCycle.mid;
      let navIDR = 0;
      for (let t = 1; t <= mineLife; t++) {
        const priceT = t <= 5
          ? liveP + (priceMultiplier - liveP) * (t / 5)
          : priceMultiplier;
        const fcfIDR = (priceT - r.cashCostIDRperKg) * r.annualCpoT * 1000; // ton→kg
        navIDR += fcfIDR / Math.pow(1 + waccDec, t);
      }
      const navPerShare = navIDR / (sharesOutstanding * 1e9);
      scenarios.push({
        label: `NAV ${label}`,
        fairValuePerShare: Math.round(navPerShare),
        upside: currentPrice > 0 ? Math.round((navPerShare / currentPrice - 1) * 100) : 0,
        priceAssumption: `${(livePrice ?? midCycle.mid).toLocaleString()} → ${priceMultiplier.toLocaleString()} IDR/kg`,
      });
    }

    return {
      ticker, commodityType: "CPO", mineLifeYears: mineLife,
      reserveSummary: `${r.matureHectares.toLocaleString()} Ha mature, yield ${r.ffbYieldPerHa} t/ha/yr`,
      scenarios, cashCost: `Rp${r.cashCostIDRperKg.toLocaleString()}/kg (COGS-derived)`,
      annualProduction: `${r.annualCpoT.toLocaleString()} ton CPO/yr`,
      asOf: r.asOf, sourceUrl: r.sourceUrl,
    };
  }

  if (reserve.type === "oilgas") {
    const r = reserve as OilGasReserves;
    const effectiveReserve = r.provedDevelopedMMboe + r.provedUndevelopedMMboe * 0.7 + r.probableMMboe * 0.3;
    const annualProduction = r.productionBoePerDay * 365;
    const mineLife = Math.min(Math.round((effectiveReserve * 1e6) / annualProduction), 50);

    for (const [label, priceMultiplier] of [
      ["mid-cycle", midCycle.mid],
      ["optimistic", midCycle.high],
      ["pessimistic", midCycle.low],
    ] as const) {
      const liveP = livePrice ?? midCycle.mid;
      let navUSD = 0;
      for (let t = 1; t <= mineLife; t++) {
        const priceT = t <= 5
          ? liveP + (priceMultiplier - liveP) * (t / 5)
          : priceMultiplier;
        const fcfUSD = (priceT - r.cashCostPerBoeUSD) * annualProduction;
        navUSD += fcfUSD / Math.pow(1 + waccDec, t);
      }
      const navPerShare = (navUSD * usdIdrRate) / (sharesOutstanding * 1e9);
      scenarios.push({
        label: `NAV ${label}`,
        fairValuePerShare: Math.round(navPerShare),
        upside: currentPrice > 0 ? Math.round((navPerShare / currentPrice - 1) * 100) : 0,
        priceAssumption: `${(livePrice ?? midCycle.mid).toFixed(0)} → ${priceMultiplier} USD/boe`,
      });
    }

    return {
      ticker, commodityType: "Oil & Gas", mineLifeYears: mineLife,
      reserveSummary: `${(r.provedDevelopedMMboe + r.provedUndevelopedMMboe).toFixed(0)}M boe proved, +${r.probableMMboe}M probable`,
      scenarios, cashCost: `US$${r.cashCostPerBoeUSD}/boe`,
      annualProduction: `${r.productionBoePerDay.toLocaleString()} boe/day`,
      asOf: r.asOf, sourceUrl: r.sourceUrl,
    };
  }

  return null;
}
