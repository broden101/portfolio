#!/usr/bin/env python3
"""
Auto-update BI Rate from TradingEconomics.
Runs as cron job, updates data/manual-market.json in the portfolio repo.

Usage: python3 scripts/update-bi-rate.py
"""
import json
import os
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path

import requests

# Config
REPO_DIR = Path("/tmp/portfolio")
DATA_FILE = REPO_DIR / "data" / "manual-market.json"
TRADING_ECONOMICS_URL = "https://tradingeconomics.com/indonesia/interest-rate"

def fetch_bi_rate():
    """Scrape BI Rate from TradingEconomics."""
    try:
        resp = requests.get(
            TRADING_ECONOMICS_URL,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"},
            timeout=15
        )
        resp.raise_for_status()
        
        # Extract precise value
        match = re.search(r'id="p"[^>]*>(\d+\.\d+)', resp.text)
        if not match:
            match = re.search(r'(\d+\.\d{1,2})\s*(?:%|percent)', resp.text[:10000], re.IGNORECASE)
        
        if match:
            return float(match.group(1))
    except Exception as e:
        print(f"Error fetching BI Rate: {e}", file=sys.stderr)
    
    return None

def load_data():
    """Load existing manual data."""
    try:
        if DATA_FILE.exists():
            with open(DATA_FILE) as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading data: {e}", file=sys.stderr)
    return {}

def save_data(data):
    """Save updated data."""
    try:
        DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(DATA_FILE, "w") as f:
            json.dump(data, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving data: {e}", file=sys.stderr)
        return False

def main():
    print(f"📊 Fetching BI Rate from TradingEconomics...")
    
    # Fetch current rate
    rate = fetch_bi_rate()
    if rate is None:
        print("❌ Failed to fetch BI Rate", file=sys.stderr)
        return 1
    
    print(f"   Found: {rate}%")
    
    # Load existing data
    data = load_data()
    
    # Check if update needed
    current_rate = data.get("biRate", {}).get("value")
    if current_rate == rate:
        print(f"✅ BI Rate unchanged ({rate}%), no update needed")
        return 0
    
    # Update
    now = datetime.now().isoformat()
    data["biRate"] = {
        "value": rate,
        "note": f"Auto-updated from TradingEconomics",
        "lastUpdated": now,
        "source": "tradingeconomics.com",
    }
    
    if save_data(data):
        print(f"✅ BI Rate updated: {current_rate}% → {rate}%")
        
        # Git commit and push
        try:
            subprocess.run(["git", "add", "data/manual-market.json"], cwd=REPO_DIR, check=True)
            subprocess.run(
                ["git", "commit", "-m", f"auto: update BI Rate to {rate}%"],
                cwd=REPO_DIR, check=True
            )
            subprocess.run(["git", "push", "origin", "master"], cwd=REPO_DIR, check=True)
            print("✅ Pushed to GitHub (Vercel will auto-deploy)")
        except subprocess.CalledProcessError as e:
            print(f"⚠️ Git push failed: {e}", file=sys.stderr)
        
        return 0
    else:
        print("❌ Failed to save data", file=sys.stderr)
        return 1

if __name__ == "__main__":
    sys.exit(main())
