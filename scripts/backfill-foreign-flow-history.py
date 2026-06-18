#!/usr/bin/env python3
"""Backfill foreign flow history from Tradersaham API (last 30 trading days).

Fetches available-dates, picks last 30, queries each day's foreign-flow data,
computes dailyNet (sum net_value in Miliar IDR) and total buy/sell values.
Saves to data/foreign-flow-history.json.
"""
import json, os, sys, time
from urllib.request import Request, urlopen

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(REPO, "data", "foreign-flow-history.json")
API = "https://apiv2.tradersaham.com/api/market-insight"
HEADERS = {"Origin": "https://www.tradersaham.com", "User-Agent": "Mozilla/5.0", "Accept": "application/json"}

def fetch_json(url):
    req = Request(url, headers=HEADERS)
    with urlopen(req, timeout=15) as r:
        return json.loads(r.read())

def main():
    # 1. Get available dates
    dates = fetch_json(f"{API}/available-dates")
    if not isinstance(dates, list) or len(dates) == 0:
        print("ERROR: no available dates")
        sys.exit(1)

    # Sort descending (should already be), take last 30 trading days
    dates_sorted = sorted(dates, reverse=True)[:30]
    print(f"Backfilling {len(dates_sorted)} days: {dates_sorted[-1]} to {dates_sorted[0]}")

    # 2. Load existing history if any
    existing = {}
    if os.path.exists(OUT):
        with open(OUT) as f:
            hist = json.load(f)
            for d in hist.get("days", []):
                existing[d["date"]] = d

    # 3. Fetch each day
    days = []
    for i, date in enumerate(dates_sorted):
        if date in existing:
            print(f"  [{i+1}/30] {date} — cached")
            days.append(existing[date])
            continue
        try:
            data = fetch_json(f"{API}/foreign-flow?date={date}")
            acc = data.get("accumulation", [])
            dist = data.get("distribution", [])
            all_stocks = acc + dist
            daily_net = sum(s.get("net_value", 0) for s in all_stocks) / 1e6
            total_buy = sum(s.get("total_buy_value", 0) for s in all_stocks)
            total_sell = sum(s.get("total_sell_value", 0) for s in all_stocks)
            day = {
                "date": date,
                "dailyNet": round(daily_net),
                "totalForeignBuy": total_buy,
                "totalForeignSell": total_sell,
            }
            days.append(day)
            print(f"  [{i+1}/30] {date} — net: {daily_net:+.0f}M")
            time.sleep(0.3)  # rate limit
        except Exception as e:
            print(f"  [{i+1}/30] {date} — ERROR: {e}")

    # 4. Sort by date ascending and save
    days.sort(key=lambda d: d["date"])
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as f:
        json.dump({"lastUpdated": time.strftime("%Y-%m-%dT%H:%M:%S"), "days": days}, f, indent=2)
    print(f"\nSaved {len(days)} days to {OUT}")

if __name__ == "__main__":
    main()
