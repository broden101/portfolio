#!/usr/bin/env python3
"""Daily foreign flow history updater. Run after market close (18:00 WIB).

Fetches today's foreign flow from Tradersaham API and appends to
data/foreign-flow-history.json. Keeps last 60 days.
"""
import json, os, sys, time
from urllib.request import Request, urlopen
from datetime import datetime

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(REPO, "data", "foreign-flow-history.json")
API = "https://apiv2.tradersaham.com/api/market-insight"
HEADERS = {"Origin": "https://www.tradersaham.com", "User-Agent": "Mozilla/5.0", "Accept": "application/json"}

def fetch_json(url):
    req = Request(url, headers=HEADERS)
    with urlopen(req, timeout=15) as r:
        return json.loads(r.read())

def main():
    today = datetime.now().strftime("%Y-%m-%d")
    
    # Load existing history
    existing = {"lastUpdated": None, "days": []}
    if os.path.exists(OUT):
        with open(OUT) as f:
            existing = json.load(f)
    
    # Check if today already exists
    dates = [d["date"] for d in existing.get("days", [])]
    if today in dates:
        print(f"Today ({today}) already in history, skipping.")
        return
    
    # Fetch today's data
    try:
        data = fetch_json(f"{API}/foreign-flow")
        api_date = data.get("date", today)[:10]
        acc = data.get("accumulation", [])
        dist = data.get("distribution", [])
        all_stocks = acc + dist
        daily_net = sum(s.get("net_value", 0) for s in all_stocks) / 1e6
        total_buy = sum(s.get("total_buy_value", 0) for s in all_stocks)
        total_sell = sum(s.get("total_sell_value", 0) for s in all_stocks)
        
        day = {
            "date": api_date,
            "dailyNet": round(daily_net),
            "totalForeignBuy": total_buy,
            "totalForeignSell": total_sell,
        }
        existing["days"].append(day)
        existing["lastUpdated"] = time.strftime("%Y-%m-%dT%H:%M:%S")
        
        # Keep last 60 days
        existing["days"] = sorted(existing["days"], key=lambda d: d["date"])[-60:]
        
        os.makedirs(os.path.dirname(OUT), exist_ok=True)
        with open(OUT, "w") as f:
            json.dump(existing, f, indent=2)
        
        print(f"Added {api_date}: net={daily_net:+.0f}M, buy={total_buy/1e9:.1f}T, sell={total_sell/1e9:.1f}T")
    except Exception as e:
        print(f"ERROR fetching today's data: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
