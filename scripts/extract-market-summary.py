#!/usr/bin/env python3
"""Extract lightweight market summary from Bandarmolony output for ragaplaybook."""
import json
import os
from pathlib import Path

ROOT = Path("/home/ubuntu/ragaplaybook")
PUBLIC_DATA = ROOT / "public" / "data"
BANDARMOLO_OUT = Path("/home/ubuntu/handoff/output/orderbook")

def extract_summary():
    # Find latest date folder
    dates = sorted([d for d in BANDARMOLO_OUT.iterdir() if d.is_dir()], reverse=True)
    if not dates:
        print("No output data found")
        return
    latest = dates[0]
    batch_file = latest / "batch_summary.json"
    if not batch_file.exists():
        print(f"No batch_summary at {batch_file}")
        return
    
    data = json.loads(batch_file.read_text())
    PUBLIC_DATA.mkdir(parents=True, exist_ok=True)
    
    # Build market summary
    summary = []
    for r in data["results"]:
        meta = r.get("metadata") or {}
        summary.append({
            "ticker": r["ticker"],
            "open": meta.get("open"),
            "high": meta.get("high"),
            "low": meta.get("low"),
            "close": meta.get("close"),
            "prevClose": meta.get("prevClose"),
            "change": round((meta.get("close", 0) - meta.get("prevClose", 0)) / meta.get("prevClose", 1) * 100, 2) if meta.get("prevClose") else 0,
            "orderRows": r["order_rows"],
            "doneRows": r["done_rows"],
        })
    
    output = {
        "date": data["date"],
        "totalTickers": len(summary),
        "okCount": data["ok_count"],
        "errorCount": data["error_count"],
        "stocks": summary,
    }
    
    dest = PUBLIC_DATA / "market-summary.json"
    dest.write_text(json.dumps(output, indent=2))
    print(f"✓ Written {dest} ({len(summary)} stocks, {os.path.getsize(dest):,} bytes)")

if __name__ == "__main__":
    extract_summary()
