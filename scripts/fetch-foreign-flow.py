#!/usr/bin/env python3
"""Fetch foreign flow data from Tradersaham API and update ragaplaybook.com.

Runs as cron job after market close (host 19:00 = 18:00 WIB).
Data stored in data/manual-market.json + data/foreign-flow-history.json, pushed to GitHub.
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
HIST_FILE = REPO_DIR / "data" / "foreign-flow-history.json"


def calc_mtd_ytd(days, today_str):
    """Calculate MTD and YTD from daily history + today's data."""
    today = datetime.fromisoformat(today_str)
    curr_month = today.month
    curr_year = today.year

    mtd_sum = 0
    ytd_sum = 0
    for d in days:
        dt = datetime.fromisoformat(d["date"])
        if dt.year == curr_year:
            ytd_sum += d["dailyNet"]
            if dt.month == curr_month:
                mtd_sum += d["dailyNet"]
    return mtd_sum, ytd_sum


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

    api_date = data.get("date", datetime.now().strftime("%Y-%m-%d"))[:10]
    accumulation = data.get("accumulation", [])
    distribution = data.get("distribution", [])

    # Calculate all-stocks daily net
    all_stocks = accumulation + distribution
    daily_net = round(sum(s.get("net_value", 0) for s in all_stocks) / 1_000_000)

    # Top 10 for display
    top_buy = [(a['stock_code'], a['net_value']) for a in accumulation[:10]]
    top_sell = [(d['stock_code'], d['net_value']) for d in distribution[:10]]

    buy_str = ", ".join([b[0] for b in top_buy[:3]])
    sell_str = ", ".join([s[0] for s in top_sell[:3]])
    print(f"Foreign flow: {buy_str} (buy), {sell_str} (sell)")
    print(f"Daily net (all stocks): {daily_net:+,d}M")

    # --- Update history file ---
    existing_hist = {"lastUpdated": None, "days": []}
    if HIST_FILE.exists():
        try:
            existing_hist = json.loads(HIST_FILE.read_text())
        except:
            pass

    hist_dates = [d["date"] for d in existing_hist.get("days", [])]
    if api_date not in hist_dates:
        total_buy = sum(s.get("total_buy_value", 0) for s in all_stocks)
        total_sell = sum(s.get("total_sell_value", 0) for s in all_stocks)
        existing_hist["days"].append({
            "date": api_date,
            "dailyNet": daily_net,
            "totalForeignBuy": total_buy,
            "totalForeignSell": total_sell,
        })
        existing_hist["days"] = sorted(existing_hist["days"], key=lambda d: d["date"])[-60:]
        existing_hist["lastUpdated"] = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
        HIST_FILE.parent.mkdir(parents=True, exist_ok=True)
        HIST_FILE.write_text(json.dumps(existing_hist, indent=2))
        print(f"History: added {api_date} net={daily_net:+,d}M")

    # --- Calculate MTD/YTD ---
    mtd_net, ytd_net = calc_mtd_ytd(existing_hist["days"], f"{api_date}T00:00:00")
    print(f"MTD: {mtd_net:+,d}M, YTD: {ytd_net:+,d}M")

    # --- Build foreign flow object ---
    foreign_flow = {
        "date": api_date,
        "weekNet": daily_net,
        "mtdNet": mtd_net,
        "ytdNet": ytd_net,
        "topBuy": [{"ticker": t, "net": round(v / 1_000_000)} for t, v in top_buy],
        "topSell": [{"ticker": t, "net": round(v / 1_000_000)} for t, v in top_sell],
        "rawAccumulation": [
            {"stock_code": a["stock_code"], "net_value": a.get("net_value", 0), "net_volume": a.get("net_volume", 0),
             "total_buy_volume": a.get("total_buy_volume", 0), "total_sell_volume": a.get("total_sell_volume", 0),
             "total_buy_value": a.get("total_buy_value", 0), "total_sell_value": a.get("total_sell_value", 0),
             "close_price": a.get("close_price", 0)}
            for a in accumulation[:20]
        ],
        "rawDistribution": [
            {"stock_code": d["stock_code"], "net_value": d.get("net_value", 0), "net_volume": d.get("net_volume", 0),
             "total_buy_volume": d.get("total_buy_volume", 0), "total_sell_volume": d.get("total_sell_volume", 0),
             "total_buy_value": d.get("total_buy_value", 0), "total_sell_value": d.get("total_sell_value", 0),
             "close_price": d.get("close_price", 0)}
            for d in distribution[:20]
        ],
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
    }

    # --- Update manual-market.json ---
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

    # --- Push to GitHub ---
    os.chdir(str(REPO_DIR))

    def run(cmd):
        return subprocess.run(cmd, cwd=REPO_DIR, text=True, capture_output=True)

    for f in ["data/manual-market.json", "data/foreign-flow-history.json"]:
        add = run(["git", "add", f])
        if add.returncode != 0:
            print(add.stdout + add.stderr)
            print(f"ERROR: git add {f} failed")
            return add.returncode

    diff = run(["git", "diff", "--cached", "--quiet"])
    if diff.returncode == 0:
        print("No changes")
        return 0

    commit = run(["git", "commit", "-m", "data: update foreign flow + history from Tradersaham"])
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
