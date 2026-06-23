import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const BASE_URL = process.env.RAGAPLAYBOOK_BASE_URL || 'https://ragaplaybook.com';
const TIMEOUT_MS = Number(process.env.RAGAPLAYBOOK_TEST_TIMEOUT_MS || 15000);

async function fetchJson(path, init = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'User-Agent': 'ragaplaybook-regression-test/1.0',
        ...(init.headers || {}),
      },
    });
    assert.equal(res.ok, true, `${path} returned HTTP ${res.status}`);
    const text = await res.text();
    assert.doesNotMatch(text, /<!doctype html|<html/i, `${path} returned HTML, expected JSON`);
    return JSON.parse(text);
  } finally {
    clearTimeout(timeout);
  }
}

function assertFiniteNumber(value, label) {
  assert.equal(Number.isFinite(value), true, `${label} must be finite number, got ${value}`);
}

async function testMarketApiShape() {
  const data = await fetchJson('/api/market?_test=' + Date.now());
  assert.ok(data.ihsg, 'market API must include ihsg');
  assertFiniteNumber(data.ihsg.close, 'ihsg.close');
  assertFiniteNumber(data.ihsg.open, 'ihsg.open');
  assertFiniteNumber(data.ihsg.high, 'ihsg.high');
  assertFiniteNumber(data.ihsg.low, 'ihsg.low');
  assert.ok(data.ihsg.close > 1000 && data.ihsg.close < 20000, 'ihsg.close out of sane IDX range');
  assert.ok(Array.isArray(data.sectors), 'sectors must be array');
  assert.ok(data.sectors.length >= 8, `expected >=8 sectors, got ${data.sectors.length}`);
  assert.ok(data.macro, 'macro must exist');
  assertFiniteNumber(data.macro.USDIDR?.close, 'macro.USDIDR.close');
}

async function testMarketForeignFlowRawData() {
  const data = await fetchJson('/api/market?_test=' + Date.now());
  const ff = data.foreignFlow;
  assert.ok(ff, 'foreignFlow must exist');
  assert.ok(Array.isArray(ff.rawAccumulation), 'rawAccumulation must be array');
  assert.ok(Array.isArray(ff.rawDistribution), 'rawDistribution must be array');
  assert.ok(ff.rawAccumulation.length >= 10, `rawAccumulation too short: ${ff.rawAccumulation.length}`);
  assert.ok(ff.rawDistribution.length >= 10, `rawDistribution too short: ${ff.rawDistribution.length}`);
  for (const [idx, row] of [...ff.rawAccumulation.slice(0, 3), ...ff.rawDistribution.slice(0, 3)].entries()) {
    assert.match(row.stock_code || row.ticker || '', /^[A-Z]{2,5}$/, `foreignFlow row ${idx} missing ticker`);
    assertFiniteNumber(Number(row.close_price), `foreignFlow row ${idx}.close_price`);
    assert.ok(
      Number.isFinite(Number(row.net_value)) || Number.isFinite(Number(row.netValue)),
      `foreignFlow row ${idx} missing net value`
    );
  }
}

async function testDcfMedcSotpRegression() {
  const data = await fetchJson('/api/dcf-inputs/MEDC?_test=' + Date.now());
  assert.equal(data.model, 'commodity', 'MEDC must stay commodity/SOTP model');
  assert.match(data.nav?.commodityType || '', /SOTP/i, 'MEDC commodityType must mention SOTP');
  assert.match(data.nav?.valuationMethod || '', /SOTP/i, 'MEDC valuationMethod must mention SOTP');
  const base = data.nav?.scenarios?.find((s) => /base/i.test(s.label));
  assert.ok(base, 'MEDC base scenario missing');
  assert.equal(base.fairValuePerShare, 1800, 'MEDC base TP must remain Rp1.800');
  assert.equal(JSON.stringify(data).includes('11715'), false, 'MEDC old gross reserve NAV 11715 leaked back');
}

async function testDcfBankSanity() {
  const data = await fetchJson('/api/dcf-inputs/BRIS?_test=' + Date.now());
  assert.equal(data.model, 'bank', 'BRIS must route to bank model');
  const roe = data.inputs?.roe;
  const payout = data.inputs?.payout;
  assertFiniteNumber(roe, 'BRIS roe');
  assertFiniteNumber(payout, 'BRIS payoutRatio');
  assert.ok(roe >= 1 && roe <= 50, `BRIS ROE sanity clamp failed: ${roe}`);
  assert.ok(payout >= 0 && payout <= 100, `BRIS payout sanity clamp failed: ${payout}`);
}

async function testScannerInputValidation() {
  const res = await fetch(`${BASE_URL}/api/scanner`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'ragaplaybook-regression-test/1.0' },
    body: JSON.stringify({ tickers: ['BBCA', 'BMRI', 'THIS_IS_TOO_LONG', '../../etc/passwd', 'A'.repeat(5000)] }),
  });
  assert.ok(res.status < 500, `/api/scanner must not 5xx on hostile ticker input, got ${res.status}`);
  const text = await res.text();
  assert.doesNotMatch(text, /Traceback|Unhandled|TypeError|SyntaxError/i, 'scanner leaked runtime error');
}

async function testSourceHasNoKnownUiRegression() {
  const ihsgPage = await readFile(new URL('../app/playbook/ihsg/page.tsx', import.meta.url), 'utf8');
  const marketRoute = await readFile(new URL('../app/api/market/route.ts', import.meta.url), 'utf8');
  assert.match(marketRoute, /High\.6M/, 'market API must request 6M swing columns for fib levels');
  assert.doesNotMatch(ihsgPage, /hidden sm:inline/, 'mobile fib labels must not be hidden');

  const topMover = await readFile(new URL('../app/playbook/ihsg/TopMoverPanel.tsx', import.meta.url), 'utf8');
  assert.match(topMover, /close_price|closePrice/, 'TopMover must display latest price');
  assert.match(topMover, /total_buy_value|totalBuyValue/, 'TopMover must include buy value for active-value calculation');
  assert.match(topMover, /total_sell_value|totalSellValue/, 'TopMover must include sell value for active-value calculation');
}

const tests = [
  testMarketApiShape,
  testMarketForeignFlowRawData,
  testDcfMedcSotpRegression,
  testDcfBankSanity,
  testScannerInputValidation,
  testSourceHasNoKnownUiRegression,
];

let failed = 0;
for (const test of tests) {
  try {
    await test();
    console.log(`✓ ${test.name}`);
  } catch (error) {
    failed += 1;
    console.error(`✗ ${test.name}`);
    console.error(error?.stack || error);
  }
}

if (failed > 0) {
  console.error(`\n${failed}/${tests.length} tests failed`);
  process.exit(1);
}

console.log(`\n${tests.length}/${tests.length} tests passed`);
