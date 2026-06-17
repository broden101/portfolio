#!/usr/bin/env python3
"""
Fetch foreign flow data from Tradersaham API and update ragaplaybook.com.
Runs as cron job to keep foreign flow data fresh.

Schedule: every 30 min during market hours (Mon-Fri 09:00-15:50 WIB)
Store data in repo data/manual-market.json, then push to GitHub.
"""
import json
import os
import sys
import requests
from datetime import datetime, timezone
from pathlib import Path

TSAHAM_API = "https://apiv2.tradersaham.com/api/market-insight/foreign-flow"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json",
    "Origin": "https://www.tradersaham.com",
    "Referer": "https://www.tradersaham.com/market-overview",
}

REPO_DIR = Path(os.path.expanduser("~/ragaplaybook_data"))
DATA_FILE = REPO_DIR / "data" / "manual-market.json"

def main():
    print(f"[{datetime.now(timezone.utc).isoformat()}] Fetching foreign flow...")
    
    # Fetch from Tradersaham
    try:
        resp = requests.get(TSAHAM_API, headers=HEADERS, timeout=10)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f"ERROR: Failed to fetch foreign flow: {e}")
        return 1
    
    # Calculate weekly net
    top_buy = [(a['stock_code'], a['net_value']) for a in data.get('accumulation', [])[:10]]
    top_sell = [(d['stock_code'], d['net_value']) for d in data.get('distribution', [])[:10]]
    
    week_net = sum(v for _, v in top_buy) + sum(v for _, v in top_sell)
    week_net_m = round(week_net / 1_000_000)
    
    foreign_flow_data = {
        "date": data.get('date'),
        "weekNet": week_net_m,
        "mtdNet": None,
        "ytdNet": None,
        "topBuy": [{"ticker": t, "net": round(v / 1_000_000)} for t, v in top_buy],
        "topSell": [{"ticker": t, "net": round(v / 1_000_000)} for t, v in top_sell],
    }
    
    print(f"Foreign flow: {', '.join([b['ticker'] for b in foreign_flow_data['topBuy'][:3]])} (buy), "
          f"{', '.join([s['ticker'] for s in foreign_flow_data['topSell'][:3]])} (sell)")
    
    # Ensure repo directory exists
    REPO_DIR.mkdir(parents=True, exist_ok=True)
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    
    # Read existing data if any
    existing = {}
    if DATA_FILE.exists():
        try:
            existing = json.loads(DATA_FILE.read_text())
        except:
            existing = {}
    
    # Update with new foreign flow data and timestamp
    existing['foreignFlow'] = foreign_flow_data
    existing['foreignFlow']['fetchedAt'] = datetime.now(timezone.utc).isoformat()
    
    # Keep BI Rate and trade balance from existing or set defaults
    if 'biRate' not in existing:
        existing['biRate'] = {"value": 5.50, "note": "BI RDG - auto"}
    if 'tradeBalance' not in existing:
        existing['tradeBalance'] = {"value": 3.32, "note": "Surplus"}
    
    DATA_FILE.write_text(json.dumps(existing, indent=2))
    print(f"Saved to {DATA_FILE}")
    
    # Check if repo exists, if not clone it
    if not (REPO_DIR / ".git").exists():
        print("Cloning repo...")
        os.chdir(str(REPO_DIR.parent))
        os.system(f"git clone https://github.com/broden101/portfolio.git ragaplaybook_data")
        os.chdir(str(REPO_DIR))
    else:
        os.chdir(str(REPO_DIR))
        os.system("git pull origin master --rebase 2>/dev/null")
    
    # Commit and push
    os.chdir(str(REPO_DIR))
    os.system("git add data/manual-market.json")
    result = os.system("git diff --cached --quiet || git commit -m 'data: update foreign flow from Tradersaham'")
    if result != 0:
        os.system("git push origin master 2>&1")
        print("Pushed to GitHub ✓")
    else:
        print("No changes to push")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
