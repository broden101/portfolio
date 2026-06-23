#!/usr/bin/env python3
"""Fetch foreign flow data from Tradersaham API and update ragaplaybook.com.

Runs as cron job after market close (host 19:00 = 18:00 WIB).
Data stored in data/manual-market.json, pushed to GitHub.
"""
import json
import os
import sys
import requests
from datetime import datetime, timezone
from pathlib import Path
import subprocess

TSAHAM_API = "https://apiv2.tradersaham.com/api/market-insight/foreign-flow"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json",
    "Origin": "https://www.tradersaham.com",
    "Referer": "https://www.tradersaham.com/market-overview",
}

REPO_DIR = Path("/home/ubuntu/ragaplaybook")
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

    # Parse
    top_buy = [(a['stock_code'], a['net_value']) for a in data.get('accumulation', [])[:10]]
    top_sell = [(d['stock_code'], d['net_value']) for d in data.get('distribution', [])[:10]]

    week_net = sum(v for _, v in top_buy) + sum(v for _, v in top_sell)
    week_net_m = round(week_net / 1_000_000)

    foreign_flow = {
        "date": data.get('date'),
        "weekNet": week_net_m,
        "mtdNet": None,
        "ytdNet": None,
        "topBuy": [{"ticker": t, "net": round(v / 1_000_000)} for t, v in top_buy],
        "topSell": [{"ticker": t, "net": round(v / 1_000_000)} for t, v in top_sell],
        "rawAccumulation": [
            {"stock_code": a["stock_code"], "net_value": a.get("net_value", 0), "net_volume": a.get("net_volume", 0),
             "total_buy_volume": a.get("total_buy_volume", 0), "total_sell_volume": a.get("total_sell_volume", 0),
             "total_buy_value": a.get("total_buy_value", 0), "total_sell_value": a.get("total_sell_value", 0),
             "close_price": a.get("close_price", 0)}
            for a in data.get('accumulation', [])[:20]
        ],
        "rawDistribution": [
            {"stock_code": d["stock_code"], "net_value": d.get("net_value", 0), "net_volume": d.get("net_volume", 0),
             "total_buy_volume": d.get("total_buy_volume", 0), "total_sell_volume": d.get("total_sell_volume", 0),
             "total_buy_value": d.get("total_buy_value", 0), "total_sell_value": d.get("total_sell_value", 0),
             "close_price": d.get("close_price", 0)}
            for d in data.get('distribution', [])[:20]
        ],
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
    }

    buy_str = ", ".join([b[0] for b in top_buy[:3]])
    sell_str = ", ".join([s[0] for s in top_sell[:3]])
    print(f"Foreign flow: {buy_str} (buy), {sell_str} (sell)")

    # Read existing data
    existing = {}
    if DATA_FILE.exists():
        try:
            existing = json.loads(DATA_FILE.read_text())
        except:
            pass

    existing['foreignFlow'] = foreign_flow
    if 'biRate' not in existing:
        existing['biRate'] = {"value": 5.50, "note": "BI RDG - auto"}
    if 'tradeBalance' not in existing:
        existing['tradeBalance'] = {"value": 3.32, "note": "Surplus"}

    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    DATA_FILE.write_text(json.dumps(existing, indent=2))
    print(f"Saved to {DATA_FILE}")

    # Push to GitHub
    os.chdir(str(REPO_DIR))

    def run(cmd):
        return subprocess.run(cmd, cwd=REPO_DIR, text=True, capture_output=True)

    pull = run(["git", "pull", "origin", "master", "--rebase"])
    if pull.returncode != 0:
        print(pull.stdout + pull.stderr)
        print("ERROR: git pull failed")
        return pull.returncode

    add = run(["git", "add", "data/manual-market.json"])
    if add.returncode != 0:
        print(add.stdout + add.stderr)
        print("ERROR: git add failed")
        return add.returncode

    diff = run(["git", "diff", "--cached", "--quiet"])
    if diff.returncode == 0:
        print("No changes")
        return 0

    commit = run(["git", "commit", "-m", "data: update foreign flow from Tradersaham"])
    print(commit.stdout + commit.stderr)
    if commit.returncode != 0:
        print("ERROR: git commit failed")
        return commit.returncode

    push = run(["git", "push", "origin", "master"])
    print(push.stdout + push.stderr)
    if push.returncode != 0:
        print("ERROR: git push failed")
        return push.returncode

    print("Pushed to GitHub")
    return 0

if __name__ == "__main__":
    sys.exit(main())
