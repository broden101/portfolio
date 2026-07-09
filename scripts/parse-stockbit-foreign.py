#!/usr/bin/env python3
"""Parse Stockbit foreign flow post text → JSON for AntekAsing agent.

Usage:
  cat stockbit_foreign.txt | python3 parse-stockbit-foreign.py
  # or pass a file:
  python3 parse-stockbit-foreign.py stockbit_foreign.txt
  
Output: JSON to stdout. Saves to data/foreign-stockbit.json if output file specified.
"""
import re, sys, json
from pathlib import Path

def parse(text: str) -> dict:
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    
    accum = []
    distrib = []
    current = None  # 'accum' or 'distrib'
    
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Detect section headers
        if 'TOP 20 ACCUMULATION' in line.upper():
            current = 'accum'
            i += 1
            continue
        if 'TOP 20 DISTRIBUTION' in line.upper() or 'DISTRIBUTION' in line.upper():
            current = 'distrib'
            i += 1
            continue
        
        # Skip header separator lines (Code | Price | Score...)
        if re.match(r'^Code\s*\|', line, re.I):
            i += 1
            continue
        if re.match(r'^[-|+\s]+$', line):
            i += 1
            continue
        
        # Skip non-data lines
        if 'PDF Analysis' in line or 'Read more' in line or 'Stockbit' in line:
            i += 1
            continue
            
        # Parse data row: CODE | PRICE | SCORE | EST.VAL
        # Formats seen:
        # MBMA  |    486 |   84% |   262.9B
        # BBRI  |   2760 |  -56% |  -138.4B
        m = re.match(r'(\w{2,5})\s*\|\s*([\d,.]+)\s*\|\s*([-\d]+)%?\s*\|\s*([-\d.]+[BTMbtm]?)', line)
        if m and current:
            code = m.group(1).upper()
            price_str = m.group(2).replace(',', '')
            score = int(m.group(3))
            val_str = m.group(4).upper()
            
            try:
                price = int(float(price_str))
            except ValueError:
                price = 0
            
            # Parse estimated value
            val_multiplier = 1
            if 'T' in val_str:
                val_multiplier = 1_000_000_000_000  # Triliun
                val_str = val_str.replace('T', '')
            elif 'B' in val_str:
                val_multiplier = 1_000_000_000  # Miliar
                val_str = val_str.replace('B', '')
            elif 'M' in val_str:
                val_multiplier = 1_000_000  # Juta
                val_str = val_str.replace('M', '')
            
            try:
                est_val = float(val_str.replace(',', '')) * val_multiplier
            except ValueError:
                est_val = 0
            
            entry = {
                'code': code,
                'price': price,
                'score': score,
                'estVal': est_val,
                'estValHuman': f"Rp{abs(est_val)/1e9:.1f}B" if abs(est_val) >= 1e9 else f"Rp{abs(est_val)/1e6:.0f}jt",
            }
            
            if current == 'accum':
                accum.append(entry)
            else:
                distrib.append(entry)
        
        i += 1
    
    return {
        'accumulation': accum,
        'distribution': distrib,
        'accumCount': len(accum),
        'distribCount': len(distrib),
    }


if __name__ == '__main__':
    if len(sys.argv) > 1:
        with open(sys.argv[1]) as f:
            text = f.read()
    else:
        text = sys.stdin.read()
    
    result = parse(text)
    print(json.dumps(result, indent=2))
    
    # Also save to data dir
    out_path = Path(__file__).parent.parent / 'data' / 'foreign-stockbit.json'
    out_path.write_text(json.dumps(result, indent=2))
    print(f"\nSaved to {out_path}", file=sys.stderr)
