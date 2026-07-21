import csv
import json
import sys
from pathlib import Path

def convert(ticker, date="2026-07-17"):
    csv_path = Path(f"/home/ubuntu/handoff/output/orderbook/{date}/{ticker}/full/done_detail.csv")
    if not csv_path.exists():
        return None
        
    trades = []
    with open(csv_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Format: time,code,price,lot,change,side,broker
            # Source: TRX_TIME(HHMMSS), STK_CODE, STK_PRIC, STK_VOLM, HAKA_HAKI(1=BUY/SELL?), BRK_COD1
            
            # Simple heuristic: TRX_TIME 85800 -> 08:58:00
            t_raw = row['TRX_TIME'].zfill(6)
            time = f"{t_raw[:2]}:{t_raw[2:4]}:{t_raw[4:]}"
            
            # HAKA_HAKI: 0=HAKI (Seller hit bid/Buy?) 1=HAKA (Buyer hit offer/Sell?)
            # Actually standard: HAKI (Hit Bid = Sell), HAKA (Hit Ask = Buy). 
            # If 0 (HAKI) -> side = SELL, If 1 (HAKA) -> side = BUY
            side = "BUY" if row['HAKA_HAKI'] == '1' else "SELL"
            
            trades.append({
                "time": time,
                "code": row['STK_CODE'],
                "price": int(row['STK_PRIC']),
                "lot": int(row['STK_VOLM']) // 100, # Assuming lots
                "change": 0,
                "side": side,
                "broker": row['BRK_COD1']
            })
    return trades

if __name__ == "__main__":
    ticker = sys.argv[1]
    data = convert(ticker)
    print(json.dumps(data))
