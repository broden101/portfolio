import csv
import json
import sys,os
from pathlib import Path
import shutil

BANDARMOLY_OUT = Path("/home/ubuntu/handoff/output/orderbook")
PUBLIC_DATA = Path("/home/ubuntu/ragaplaybook/public/data") / "trades"

def convert_ticker(ticker, date):
    csv_path = BANDARMOLY_OUT / date / ticker / "full" / "done_detail.csv"
    if not csv_path.exists():
        return None
    trades = []
    with open(csv_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            t_raw = row['TRX_TIME'].zfill(6)
            time = f"{t_raw[:2]}:{t_raw[2:4]}:{t_raw[4:]}"
            side = "BUY" if row['HAKA_HAKI'] == '1' else "SELL"
            lot = int(row['STK_VOLM']) // 100
            if lot < 1: lot = 1
            trades.append({
                "time": time,
                "code": row['STK_CODE'],
                "price": int(row['STK_PRIC']),
                "lot": lot,
                "change": 0,
                "side": side,
                "broker": row['BRK_COD1']
            })
    return trades

def run():
    # find latest date
    dates = sorted([d for d in BANDARMOLY_OUT.iterdir() if d.is_dir()], reverse=True)
    if not dates: return
    date = dates[0].name
    
    trades_dir = PUBLIC_DATA
    if trades_dir.exists():
        shutil.rmtree(trades_dir)
    trades_dir.mkdir(parents=True, exist_ok=True)
    
    # also load batch_summary for ticker list
    batch = BANDARMOLY_OUT / date / "batch_summary.json"
    tickers = []
    if batch.exists():
        with open(batch) as f:
            bdata = json.load(f)
            tickers = [r['ticker'] for r in bdata['results']]
    
    count = 0
    for ticker in tickers:
        trades = convert_ticker(ticker, date)
        if trades:
            out_path = trades_dir / f"{ticker}.json"
            with open(out_path, 'w') as f:
                json.dump(trades, f)
            count += 1
    
    # write index
    index = {"date": date, "tickers": tickers, "totalTickers": len(tickers), "converted": count}
    with open(trades_dir.parent / "trades-index.json", 'w') as f:
        json.dump(index, f)
    
    print(f"✓ {count}/{len(tickers)} ticker trades converted to {trades_dir}")
    print(f"  Date: {date}")

if __name__ == "__main__":
    run()
