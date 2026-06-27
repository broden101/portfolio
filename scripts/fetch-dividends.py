#!/usr/bin/env python3
"""
Fetch IDX Kompas 100 dividend data from Yahoo Finance.
Run: python3 scripts/fetch-dividends.py
Output: data/dividends.json
"""
import json
import os
import time
from datetime import datetime, timedelta
from pathlib import Path

# IDX Kompas 100 constituents (as of 2025/2026)
KOMPAS_100 = [
    "ACES.JK", "ADMR.JK", "ADRO.JK", "AGII.JK", "AKRA.JK", "AMMN.JK",
    "AMRT.JK", "ANTM.JK", "ARTO.JK", "ASII.JK", "ASSA.JK", "BANK.JK",
    "BBNI.JK", "BBRI.JK", "BBTN.JK", "BBYB.JK", "BCAP.JK", "BFIN.JK",
    "BGTG.JK", "BIRD.JK", "BMRI.JK", "BMTR.JK", "BREN.JK", "BRMS.JK",
    "BRPT.JK", "BSDE.JK", "BUKA.JK", "CLEO.JK", "CPIN.JK", "DSSA.JK",
    "ELSA.JK", "EMTK.JK", "ERAA.JK", "ESSA.JK", "EXCL.JK", "FILM.JK",
    "GGRM.JK", "GOTO.JK", "GJTL.JK", "HRUM.JK", "ICBP.JK", "INCO.JK",
    "INDF.JK", "INKP.JK", "INTP.JK", "ISAT.JK", "ITMG.JK", "JPFA.JK",
    "KLBF.JK", "LPPF.JK", "MAPI.JK", "MAPI.JK", "MBMA.JK", "MDKA.JK",
    "MEDC.JK", "MIKA.JK", "MKPI.JK", "MNCN.JK", "MTEL.JK", "NISP.JK",
    "PANI.JK", "PGAS.JK", "PGEO.JK", "PTBA.JK", "PTPP.JK", "PWON.JK",
    "SCMA.JK", "SIDO.JK", "SMGR.JK", "SMRA.JK", "SRTG.JK", "TBIG.JK",
    "TINS.JK", "TKIM.JK", "TLKM.JK", "TOWR.JK", "TPIA.JK", "TSPC.JK", "UNTR.JK",
    "UNVR.JK", "WIKA.JK", "WMUU.JK", "WSKT.JK",
]

# Remove duplicates
KOMPAS_100 = list(dict.fromkeys(KOMPAS_100))

def fetch_dividend_data():
    """Fetch dividend data from Yahoo Finance for all Kompas 100 stocks."""
    try:
        import yfinance as yf
    except ImportError:
        print("ERROR: yfinance not installed. Run: pip install yfinance")
        return None

    results = []
    total = len(KOMPAS_100)
    
    for i, ticker in enumerate(KOMPAS_100):
        print(f"[{i+1}/{total}] Fetching {ticker}...", end=" ", flush=True)
        try:
            stock = yf.Ticker(ticker)
            info = stock.info
            divs = stock.dividends
            
            # Get dividend history
            div_history = []
            if len(divs) > 0:
                for date, amount in divs.tail(10).items():
                    div_history.append({
                        "date": date.strftime("%Y-%m-%d"),
                        "amount": float(amount),
                    })
            
            # Calculate consecutive dividend years
            consecutive_years = 0
            if len(divs) > 0:
                years = sorted(set(d.year for d in divs.index), reverse=True)
                current_year = datetime.now().year
                for j, year in enumerate(years):
                    if j == 0 and year == current_year:
                        consecutive_years = 1
                    elif j == 0 and year == current_year - 1:
                        consecutive_years = 1
                    elif j > 0 and year == years[j-1] - 1:
                        consecutive_years += 1
                    else:
                        break
            
            # Get price data
            price = info.get("currentPrice") or info.get("regularMarketPrice") or info.get("previousClose", 0)
            change = info.get("regularMarketChange", 0) or 0
            market_cap = info.get("marketCap", 0)
            if market_cap:
                market_cap = market_cap / 1e12  # Convert to trillion
            
            # Get dividend info
            div_yield = info.get("dividendYield", 0) or 0
            div_yield = round(div_yield * 100, 2) if div_yield else 0
            div_rate = info.get("dividendRate", 0) or 0
            payout_ratio = info.get("payoutRatio", 0) or 0
            payout_ratio = round(payout_ratio * 100, 2) if payout_ratio else 0
            
            # Get ex-dividend date
            ex_div_date = info.get("exDividendDate", None)
            if ex_div_date:
                ex_div_date = datetime.fromtimestamp(ex_div_date).strftime("%Y-%m-%d")
            
            # Estimate next ex-date (1 year after last)
            next_est_ex = None
            if div_history:
                last_ex = datetime.strptime(div_history[-1]["date"], "%Y-%m-%d")
                next_est_ex = (last_ex + timedelta(days=365)).strftime("%Y-%m-%d")
            
            result = {
                "ticker": ticker,
                "name": info.get("shortName", info.get("longName", ticker.replace(".JK", ""))),
                "sector": info.get("sector", "Unknown"),
                "industry": info.get("industry", "Unknown"),
                "price": round(float(price), 2) if price else 0,
                "change": round(float(change), 2) if change else 0,
                "marketCap": round(float(market_cap), 2) if market_cap else 0,
                "dividendYield": div_yield,
                "dps": round(float(div_rate), 2) if div_rate else 0,
                "payoutRatio": payout_ratio,
                "frequency": "Annual",  # Default, can be improved
                "exDividendDate": ex_div_date,
                "nextEstExDate": next_est_ex,
                "consecutiveYears": consecutive_years,
                "dividendHistory": div_history,
            }
            
            results.append(result)
            print(f"✓ Yield: {div_yield}%")
            
            # Rate limiting - sleep between requests
            time.sleep(1)
            
        except Exception as e:
            print(f"✗ Error: {e}")
            results.append({
                "ticker": ticker,
                "name": ticker.replace(".JK", ""),
                "sector": "Unknown",
                "industry": "Unknown",
                "price": 0,
                "change": 0,
                "marketCap": 0,
                "dividendYield": 0,
                "dps": 0,
                "payoutRatio": 0,
                "frequency": "Unknown",
                "exDividendDate": None,
                "nextEstExDate": None,
                "consecutiveYears": 0,
                "dividendHistory": [],
                "error": str(e),
            })
            time.sleep(2)  # Extra sleep on error
    
    # Sort by dividend yield (descending)
    results.sort(key=lambda x: x.get("dividendYield", 0), reverse=True)
    
    # Add rank
    for i, r in enumerate(results):
        r["rank"] = i + 1
    
    return results

def save_data(data, output_dir="data"):
    """Save dividend data to JSON file."""
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    output = {
        "lastUpdated": datetime.now().isoformat(),
        "source": "Yahoo Finance (yfinance)",
        "index": "IDX Kompas 100",
        "totalStocks": len(data),
        "stocks": data,
    }
    
    filepath = os.path.join(output_dir, "dividends.json")
    with open(filepath, "w") as f:
        json.dump(output, f, indent=2)
    
    print(f"\n✓ Data saved to {filepath}")
    print(f"  Total stocks: {len(data)}")
    print(f"  Stocks with dividend: {len([d for d in data if d.get('dividendYield', 0) > 0])}")
    print(f"  Last updated: {output['lastUpdated']}")
    
    return filepath

if __name__ == "__main__":
    print("=" * 60)
    print("IDX Kompas 100 Dividend Data Fetcher")
    print("=" * 60)
    print(f"\nFetching data for {len(KOMPAS_100)} stocks...\n")
    
    data = fetch_dividend_data()
    if data:
        save_data(data)
    else:
        print("ERROR: Failed to fetch data")
