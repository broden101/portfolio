#!/usr/bin/env python3
"""
Fetch IDX Kompas 100 dividend data from panendividen.com (GitHub mirror)
and current prices from tradersaham API.

Output: data/dividends.json

Usage: python3 scripts/fetch-dividends-panendividen.py
"""
import csv
import io
import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path

import requests

# ── Kompas 100 constituents ──────────────────────────────────────────
KOMPAS_100 = [
    "AADI", "ABMM", "ACES", "ADMR", "ADRO", "AGII", "AKRA", "AMMN", "AMRT", "ANTM",
    "ARCI", "ARTO", "ASII", "ASSA", "BBCA", "BBNI", "BBRI", "BBTN", "BBYB",
    "BFIN", "BJBR", "BJTM", "BKSL", "BMRI", "BMTR", "BREN", "BRIS", "BRMS",
    "BRPT", "BSDE", "BSSR", "BTPS", "BUKA", "BULL", "BUMI", "BUVA", "CBDK", "CMRY",
    "CPIN", "CTRA", "CUAN", "DEWA", "DMAS", "DSNG", "DSSA", "ELSA", "EMTK",
    "ENRG", "ERAA", "ESSA", "EXCL", "FILM", "GOTO", "HEAL", "HMSP", "HRTA",
    "HRUM", "ICBP", "IMPC", "INCO", "INDF", "INDY", "INET", "INKP", "INTP",
    "ISAT", "ITMG", "IPCC", "JPFA", "JSMR", "KIJA", "KLBF", "KPIG", "LPPF", "MAPA", "MAPI",
    "MBMA", "MDKA", "MEDC", "MIKA", "MPMX", "MTEL", "MYOR", "NCKL", "PANI",
    "PGAS", "PGEO", "PNLF", "PSAB", "PTBA", "PTRO", "PWON", "RAJA", "RATU",
    "SCMA", "SGER", "SIDO", "SMGR", "SMIL", "SMRA", "SSIA", "TAPG", "TCPI",
    "TINS", "TLKM", "TOBA", "TOWR", "TPIA", "UNTR", "UNVR", "WIFI", "WIRG",
]

PANENDIVIDEN_BASE = "https://raw.githubusercontent.com/mitbal/daguerreo-data/main/jkse"
COMPANY_PROFILES_URL = f"{PANENDIVIDEN_BASE}/company_profiles/company_profiles.csv"

# Tradersaham API
TRADERSAHAM_API = "https://apiv2.tradersaham.com"
REFRESH_TOKEN_FILE = os.path.expanduser("~/.tradersaham_refresh_token")
API_KEY_FILE = ""


def load_api_key():
    """Load API key from file, env, or existing scripts."""
    if API_KEY_FILE and os.path.exists(API_KEY_FILE):
        return open(API_KEY_FILE).read().strip()
    env_key = os.environ.get("TRADERSAHAM_API_KEY", "")
    if env_key:
        return env_key
    # Extract from existing working script
    import re
    script_path = os.path.expanduser("~/scripts/tradersaham-macd-divergence.sh")
    if os.path.exists(script_path):
        with open(script_path) as f:
            m = re.search(r'API_KEY="([^"]+)"', f.read())
            if m:
                return m.group(1)
    return ""


def load_refresh_token():
    """Load refresh token from file."""
    if os.path.exists(REFRESH_TOKEN_FILE):
        return open(REFRESH_TOKEN_FILE).read().strip()
    return ""


def get_access_token(api_key, refresh_token):
    """Get fresh access token via Firebase Auth."""
    try:
        resp = requests.post(
            f"https://securetoken.googleapis.com/v1/token?key={api_key}",
            json={"grant_type": "refresh_token", "refresh_token": refresh_token},
            timeout=15,
        )
        if resp.status_code == 200:
            data = resp.json()
            # Save new refresh token if rotated
            new_rt = data.get("refresh_token", "")
            if new_rt and new_rt != refresh_token:
                with open(REFRESH_TOKEN_FILE, "w") as f:
                    f.write(new_rt)
            return data.get("access_token", "")
        else:
            print(f"  ⚠ Auth failed: {resp.status_code}", file=sys.stderr)
    except Exception as e:
        print(f"  ⚠ Auth error: {e}", file=sys.stderr)
    return ""


def fetch_company_profiles():
    """Fetch company profiles from panendividen GitHub."""
    print("📊 Fetching company profiles...")
    resp = requests.get(COMPANY_PROFILES_URL, timeout=30)
    if resp.status_code != 200:
        print(f"  ⚠ Failed to fetch profiles: {resp.status_code}", file=sys.stderr)
        return {}

    reader = csv.DictReader(io.StringIO(resp.text))
    profiles = {}
    for row in reader:
        ticker = row["symbol"].replace(".JK", "")
        profiles[ticker] = {
            "companyName": row.get("companyName", ""),
            "sector": row.get("sector", ""),
            "industry": row.get("industry", ""),
            "ipoDate": row.get("ipoDate", ""),
        }
    print(f"  ✓ Loaded {len(profiles)} profiles")
    return profiles


def fetch_dividend_csv(ticker):
    """Fetch dividend CSV for a single ticker from panendividen GitHub."""
    url = f"{PANENDIVIDEN_BASE}/dividends/{ticker}.csv"
    resp = requests.get(url, timeout=15)
    if resp.status_code != 200:
        return []

    reader = csv.DictReader(io.StringIO(resp.text))
    dividends = []
    for row in reader:
        try:
            dividends.append({
                "exDate": row.get("ex_date", ""),
                "amount": float(row.get("dividend", 0)),
                "paymentDate": row.get("payment_date", ""),
                "fiscalYear": row.get("fiscal_year", ""),
                "type": row.get("dividend_type", ""),
            })
        except (ValueError, KeyError):
            continue
    return dividends


def fetch_prices_tradersaham(tickers):
    """Fetch current prices from TradingView scanner (batch, no auth needed)."""
    import urllib.request

    TV_SCANNER = "https://scanner.tradingview.com/indonesia/scan"
    symbols = [f"IDX:{t}" for t in tickers]

    print(f"💰 Fetching prices for {len(tickers)} stocks from TradingView...")

    payload = json.dumps({
        "columns": ["name", "close"],
        "symbols": {"tickers": symbols},
        "range": [0, len(symbols)],
    }).encode()

    req = urllib.request.Request(TV_SCANNER, data=payload, headers={
        "User-Agent": "Mozilla/5.0",
        "Content-Type": "application/json",
    })

    prices = {}
    try:
        resp = urllib.request.urlopen(req, timeout=30)
        data = json.loads(resp.read())
        for row in data.get("data", []):
            d = row.get("d", [])
            if len(d) >= 2 and d[1] is not None:
                ticker = d[0].replace("IDX:", "")
                prices[ticker] = float(d[1])
    except Exception as e:
        print(f"  ❌ TradingView error: {e}", file=sys.stderr)

    print(f"  ✓ Got {len(prices)} prices")
    return prices


def compute_stock_data(ticker, dividends, price, profile):
    """Compute aggregated dividend data for a stock."""
    now = datetime.now()

    if not dividends:
        return {
            "ticker": ticker,
            "companyName": profile.get("companyName", ticker),
            "sector": profile.get("sector", "Unknown"),
            "industry": profile.get("industry", "Unknown"),
            "ipoDate": profile.get("ipoDate", ""),
            "totalDividends": 0,
            "dividendCount": 0,
            "latestDividend": None,
            "yearsOfHistory": 0,
            "avgDividendPerYear": 0,
            "fiscalYears": [],
            "allDividends": [],
            "price": price,
            "latestFYDPS": 0,
            "latestFYDate": None,
            "dividendYield": None,
        }

    # Sort by exDate descending
    dividends.sort(key=lambda d: d["exDate"], reverse=True)

    # Fiscal year stats
    fiscal_years = sorted(set(d["fiscalYear"] for d in dividends if d["fiscalYear"]), reverse=True)
    total_amount = sum(d["amount"] for d in dividends)
    years_of_history = len(fiscal_years)
    avg_per_year = total_amount / max(years_of_history, 1)

    # Latest dividend (any type)
    latest = dividends[0]

    # Latest fiscal year DPS — sum ALL dividends (final + interim) in the latest FY
    latest_fy = fiscal_years[0] if fiscal_years else None
    latest_fy_divs = [d for d in dividends if d["fiscalYear"] == latest_fy] if latest_fy else []
    latest_fy_dps = sum(d["amount"] for d in latest_fy_divs)
    # Get the most recent ex-date in the latest FY
    latest_fy_date = max((d["exDate"] for d in latest_fy_divs), default=None)

    # Calculate yield
    div_yield = None
    if price and price > 0 and latest_fy_dps > 0:
        div_yield = round((latest_fy_dps / price) * 100, 2)

    return {
        "ticker": ticker,
        "companyName": profile.get("companyName", ticker),
        "sector": profile.get("sector", "Unknown"),
        "industry": profile.get("industry", "Unknown"),
        "ipoDate": profile.get("ipoDate", ""),
        "totalDividends": round(total_amount, 2),
        "dividendCount": len(dividends),
        "latestDividend": {
            "date": latest["exDate"],
            "amount": latest["amount"],
            "type": latest["type"],
            "paymentDate": latest["paymentDate"],
        } if latest else None,
        "yearsOfHistory": years_of_history,
        "avgDividendPerYear": round(avg_per_year, 2),
        "fiscalYears": fiscal_years[:5],
        "allDividends": dividends,
        "price": price,
        "latestFYDPS": round(latest_fy_dps, 2),
        "latestFYDate": latest_fy_date,
        "dividendYield": div_yield,
    }


def main():
    output_path = Path(__file__).parent.parent / "data" / "dividends.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Load existing data for fallback prices
    existing = {}
    if output_path.exists():
        with open(output_path) as f:
            for s in json.load(f):
                existing[s["ticker"]] = s

    # 1. Fetch company profiles
    profiles = fetch_company_profiles()

    # 2. Fetch dividend data for all tickers
    print(f"\n📥 Fetching dividend data for {len(KOMPAS_100)} stocks...")
    all_tickers = set(KOMPAS_100)
    dividend_data = {}
    has_data = 0
    no_data = 0

    for i, ticker in enumerate(KOMPAS_100):
        divs = fetch_dividend_csv(ticker)
        dividend_data[ticker] = divs
        if divs:
            has_data += 1
        else:
            no_data += 1
        if (i + 1) % 20 == 0:
            print(f"  ... {i+1}/{len(KOMPAS_100)}")
            time.sleep(0.3)

    print(f"  ✓ Has data: {has_data}, No data: {no_data}")

    # 3. Fetch prices
    prices = fetch_prices_tradersaham(all_tickers)

    # Merge with existing prices as fallback
    for ticker in KOMPAS_100:
        if ticker not in prices and ticker in existing:
            old_price = existing[ticker].get("price")
            if old_price:
                prices[ticker] = old_price

    # 4. Build final data
    print(f"\n🔧 Computing yield for all stocks...")
    results = []
    for ticker in KOMPAS_100:
        profile = profiles.get(ticker, {})
        # Fallback to existing profile data
        if not profile.get("companyName") and ticker in existing:
            profile["companyName"] = existing[ticker].get("companyName", ticker)
            profile["sector"] = existing[ticker].get("sector", "Unknown")
            profile["industry"] = existing[ticker].get("industry", "Unknown")
            profile["ipoDate"] = existing[ticker].get("ipoDate", "")

        stock = compute_stock_data(
            ticker,
            dividend_data.get(ticker, []),
            prices.get(ticker, 0),
            profile,
        )
        results.append(stock)

    # Sort by totalDividends descending
    results.sort(key=lambda s: s["totalDividends"], reverse=True)

    # Assign ranks
    for i, s in enumerate(results):
        s["rank"] = i + 1

    # Stats
    with_yield = sum(1 for s in results if s["dividendYield"] is not None)
    with_price = sum(1 for s in results if s["price"] and s["price"] > 0)
    with_divs = sum(1 for s in results if s["dividendCount"] > 0)

    # 5. Save
    with open(output_path, "w") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Done! Saved to {output_path}")
    print(f"   Total stocks: {len(results)}")
    print(f"   With dividend data: {with_divs}")
    print(f"   With price: {with_price}")
    print(f"   With yield: {with_yield}")
    print(f"   Without yield (no data): {len(results) - with_yield}")

    # Show stocks still without yield
    no_yield = [s for s in results if s["dividendYield"] is None]
    if no_yield:
        print(f"\n⚠ Stocks without yield:")
        for s in no_yield:
            reason = "no dividends" if s["dividendCount"] == 0 else "no price"
            print(f"   {s['ticker']}: {reason}")


if __name__ == "__main__":
    main()
