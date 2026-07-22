#!/usr/bin/env python3
import csv
import json
import shutil
from pathlib import Path

BANDARMOLY_OUT = Path("/home/ubuntu/handoff/output/orderbook")
PUBLIC_ROOT = Path("/home/ubuntu/ragaplaybook/public/data")
PUBLIC_LATEST = PUBLIC_ROOT / "trades"
PUBLIC_DEPTH = PUBLIC_ROOT / "depth"
PUBLIC_HISTORY = PUBLIC_ROOT / "trades-history"
PUBLIC_DEPTH_HISTORY = PUBLIC_ROOT / "depth-history"

def convert_ticker(ticker, date):
    csv_path = BANDARMOLY_OUT / date / ticker / "full" / "done_detail.csv"
    if not csv_path.exists():
        return None
    trades = []
    with open(csv_path, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            t_raw = row["TRX_TIME"].zfill(6)
            time = f"{t_raw[:2]}:{t_raw[2:4]}:{t_raw[4:]}"
            buyer = (row.get("BRK_COD1") or "").strip().upper()
            seller = (row.get("BRK_COD2") or "").strip().upper()
            side = "BUY" if row["HAKA_HAKI"] == "1" else "SELL"
            lot = int(row["STK_VOLM"]) // 100
            if lot < 1:
                lot = 1
            trades.append({
                "time": time,
                "code": row["STK_CODE"],
                "price": int(row["STK_PRIC"]),
                "lot": lot,
                "change": 0,
                "side": side,
                "broker": buyer if side == "BUY" else seller,
                "buyer": buyer,
                "seller": seller,
            })
    return trades

def convert_depth(ticker, date):
    """Generate orderbook depth from order_detail.csv (standing orders).
    
    Returns list of: {price, bidLots, bidFreq, bidBrokers[], offerLots, offerFreq, offerBrokers[]}
    sorted by price desc.
    """
    csv_path = BANDARMOLY_OUT / date / ticker / "full" / "order_detail.csv"
    if not csv_path.exists():
        return None

    bids = {}  # price -> {lots, freq, brokers}
    offers = {}

    with open(csv_path, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            price = int(row["price"])
            lots = int(float(row["opn"]))  # open/queued lots
            brk = (row.get("brk") or "").strip().upper()
            side = row.get("bs", "").strip().upper()

            if lots < 1:
                continue

            if side == "B":
                entry = bids.setdefault(price, {"lots": 0, "freq": 0, "brokers": []})
                entry["lots"] += lots
                entry["freq"] += 1
                if brk and brk not in entry["brokers"]:
                    entry["brokers"].append(brk)
            elif side == "S":
                entry = offers.setdefault(price, {"lots": 0, "freq": 0, "brokers": []})
                entry["lots"] += lots
                entry["freq"] += 1
                if brk and brk not in entry["brokers"]:
                    entry["brokers"].append(brk)

    # Merge bid/offer at same price
    all_prices = set(list(bids.keys()) + list(offers.keys()))
    levels = []
    for p in all_prices:
        b = bids.get(p, {"lots": 0, "freq": 0, "brokers": []})
        o = offers.get(p, {"lots": 0, "freq": 0, "brokers": []})
        levels.append({
            "price": p,
            "bidLots": b["lots"],
            "bidFreq": b["freq"],
            "bidBrokers": b["brokers"],
            "offerLots": o["lots"],
            "offerFreq": o["freq"],
            "offerBrokers": o["brokers"],
        })

    levels.sort(key=lambda x: -x["price"])
    return levels

def tickers_for_date(date):
    batch = BANDARMOLY_OUT / date / "batch_summary.json"
    if batch.exists():
        with open(batch) as f:
            bdata = json.load(f)
        return [r["ticker"] for r in bdata.get("results", [])]
    return sorted([p.name for p in (BANDARMOLY_OUT / date).iterdir() if p.is_dir()])

def convert_date(date):
    out_dir = PUBLIC_HISTORY / date
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    depth_dir = PUBLIC_DEPTH_HISTORY / date
    if depth_dir.exists():
        shutil.rmtree(depth_dir)
    depth_dir.mkdir(parents=True, exist_ok=True)

    tickers = tickers_for_date(date)
    converted = []
    depth_converted = []
    for ticker in tickers:
        trades = convert_ticker(ticker, date)
        if trades:
            with open(out_dir / f"{ticker}.json", "w") as f:
                json.dump(trades, f)
            converted.append(ticker)

        depth = convert_depth(ticker, date)
        if depth:
            with open(depth_dir / f"{ticker}.json", "w") as f:
                json.dump(depth, f)
            depth_converted.append(ticker)

    return converted, depth_converted

def run():
    dates = sorted([d.name for d in BANDARMOLY_OUT.iterdir() if d.is_dir()])
    if not dates:
        print("No date folders found")
        return

    PUBLIC_HISTORY.mkdir(parents=True, exist_ok=True)
    PUBLIC_DEPTH_HISTORY.mkdir(parents=True, exist_ok=True)
    converted_by_date = {}
    depth_converted_by_date = {}
    for date in dates:
        c, dc = convert_date(date)
        converted_by_date[date] = c
        depth_converted_by_date[date] = dc
        print(f"✓ {date}: {len(c)} trades + {len(dc)} depth")

    latest = dates[-1]
    latest_dir = PUBLIC_HISTORY / latest
    if PUBLIC_LATEST.exists():
        shutil.rmtree(PUBLIC_LATEST)
    shutil.copytree(latest_dir, PUBLIC_LATEST)

    latest_depth_dir = PUBLIC_DEPTH_HISTORY / latest
    if PUBLIC_DEPTH.exists():
        shutil.rmtree(PUBLIC_DEPTH)
    shutil.copytree(latest_depth_dir, PUBLIC_DEPTH)

    latest_tickers = converted_by_date[latest]
    index = {
        "date": latest,
        "dates": dates,
        "tickers": latest_tickers,
        "totalTickers": len(latest_tickers),
        "converted": len(latest_tickers),
    }
    with open(PUBLIC_ROOT / "trades-index.json", "w") as f:
        json.dump(index, f)

    print(f"✓ latest copied to {PUBLIC_LATEST} + depth to {PUBLIC_DEPTH}")
    print(f"  Latest date: {latest}")

if __name__ == "__main__":
    run()
