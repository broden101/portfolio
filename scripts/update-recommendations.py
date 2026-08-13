#!/usr/bin/env python3
"""
Scrape daily stock recommendations from public media sources (CNBC Indonesia & Kontan).
Outputs JSON to public/data/tracker/latest.json
"""

import os
import re
import json
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime, date
import html as hmod

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"

def fetch_url(url, timeout=25, headers=None):
    req_headers = {"User-Agent": USER_AGENT}
    if headers:
        req_headers.update(headers)
    req = urllib.request.Request(url, headers=req_headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read().decode("utf-8", errors="replace")
    except Exception as e:
        print(f"[WARN] Fetch failed for {url}: {e}")
        return None

def fetch_live_prices():
    url = "https://terminal-live.chamdani49.workers.dev/live.json"
    html = fetch_url(url)
    if not html:
        return {}
    try:
        data = json.loads(html)
        return data.get("live", {})
    except Exception as e:
        print(f"[WARN] Failed to parse live.json: {e}")
        return {}

def parse_cnbc_article(url, title, pub_date_str):
    html = fetch_url(url)
    if not html:
        return []

    # Extract date from pubDate (RFC 822), fallback to today
    pub_date = str(date.today())
    if pub_date_str:
        try:
            from email.utils import parsedate_to_datetime
            pub_date = parsedate_to_datetime(pub_date_str).date().isoformat()
        except Exception:
            pass

    # Split article into sections by <h2>/<h3> headings; each section may belong to a broker
    # e.g. <h2 ...>Rekomendasi Saham Hari Ini dari Mega Capital Sekuritas</h2>
    # fallback broker if none found
    broker_default = None

    # Find all heading blocks with their following content
    sections = re.split(r'(<h[23][^>]*>.*?</h[23]>)', html, flags=re.DOTALL)
    rec_blocks = []  # list of (broker, text_block)

    current_broker = None
    for chunk in sections:
        if re.match(r'<h[23]', chunk):
            heading_text = re.sub(r'<[^>]+>', '', chunk)
            heading_text = hmod.unescape(heading_text).strip()
            m = re.search(r'dari\s+([A-Za-z0-9&\s\.]+)', heading_text, re.IGNORECASE)
            if m:
                current_broker = m.group(1).strip()
            else:
                current_broker = None
        else:
            rec_blocks.append((current_broker, chunk))

    # Fallback: if no broker sections, search whole doc for "dari <Broker>"
    if not any(b for b, _ in rec_blocks if b):
        m = re.search(r'dari\s+([A-Za-z0-9&\s\.]+Sekuritas)', hmod.unescape(re.sub(r'<[^>]+>', ' ', html)), re.IGNORECASE)
        if m:
            broker_default = m.group(1).strip()

    ACTION_RE = r'(?:Trading\s+Buy|Speculative\s+Buy|Accumulate|Buy|Trading\s+Sell|Sell|Hold|Neutral|Reduce)'
    # Pattern: TICKER - ACTION [ENTRY] | TP X | SL Y
    pattern = re.compile(
        r'\b([A-Z]{3,5})\s*-\s*(' + ACTION_RE + r')(?:\s+([0-9][0-9.,\-]*))?\s*\|\s*TP\s*([0-9.,\-]+)\s*\|\s*SL\s*([0-9.,\-]+)',
        re.IGNORECASE
    )

    items = []
    seen = set()

    for broker, block in rec_blocks:
        # strip tags inside block
        text = re.sub(r'<[^>]+>', ' ', block)
        text = hmod.unescape(text)
        text = re.sub(r'\s+', ' ', text)

        bname = broker or broker_default or "Analis Sekuritas"
        for m in pattern.finditer(text):
            ticker = m.group(1).upper()
            action = m.group(2).title()
            entry = m.group(3) or "-"
            tp = m.group(4)
            sl = m.group(5)

            key = (ticker, bname, tp)
            if key in seen:
                continue
            seen.add(key)

            items.append({
                "ticker": ticker,
                "broker": bname,
                "action": action,
                "entry": entry,
                "target_price": tp,
                "stop_loss": sl,
                "title": title,
                "source": "CNBC Indonesia",
                "url": url,
                "date": pub_date,
            })

    return items

def scrape_cnbc_rss():
    xml_str = fetch_url("https://www.cnbcindonesia.com/market/rss")
    if not xml_str:
        return []

    items = []
    try:
        root = ET.fromstring(xml_str)
        for item in root.findall(".//item"):
            title = item.findtext("title", "")
            link = item.findtext("link", "")
            pubDate = item.findtext("pubDate", "")

            # Filter for recommendation articles
            if any(k in title.lower() for k in ["rekomendasi", "intip", "saham pilihan", "cermati"]):
                print(f"[CNBC] Parsing: {title[:70]}")
                recs = parse_cnbc_article(link, title, pubDate)
                items.extend(recs)
    except Exception as e:
        print(f"[ERR] Failed to parse CNBC RSS: {e}")

    return items

def scrape_kontan_tags():
    html = fetch_url("https://www.kontan.co.id/tag/rekomendasi-saham")
    if not html:
        return []

    # Parse article titles from tag page
    # Example titles: "Cermati Rekomendasi Teknikal MBMA, BRPT, dan ANTM untuk Perdagangan..."
    links = re.findall(r'href=["\'](https?://[a-zA-Z0-9.-]*kontan\.co\.id/news/[^"\']+)["\'][^>]*>(.*?)</a>', html, re.DOTALL)
    items = []
    seen = set()

    for url, raw_title in links:
        title = re.sub(r'<[^>]+>', '', raw_title).strip()
        title = re.sub(r'\s+', ' ', title)
        if len(title) < 15 or url in seen:
            continue
        seen.add(url)

        # Extract broker from title if present
        broker_m = re.search(r'dari ([A-Za-z0-9\s]+Sekuritas)', title, re.IGNORECASE)
        broker = broker_m.group(1).strip() if broker_m else "Kontan Market"

        # Extract 4-letter tickers (capitalized)
        # Exclude common non-ticker Indonesian words
        stopwords = {"IHSG", "SEKUTU", "KONTAN", "NEWS", "ASING", "EMAS", "SAHAM", "BERIKUT", "CEK", "MOHON", "SISI", "SEMENTARA"}
        tickers = [w for w in re.findall(r'\b[A-Z]{4}\b', title) if w not in stopwords]

        for ticker in tickers:
            items.append({
                "ticker": ticker,
                "broker": broker,
                "action": "Trading Recommendation",
                "entry": "-",
                "target_price": "-",
                "stop_loss": "-",
                "title": title,
                "source": "Kontan",
                "url": url,
                "date": str(date.today()),
            })

    return items

def main():
    print("=== Scraping Stock Recommendations ===")
    live_prices = fetch_live_prices()
    print(f"Loaded live price data for {len(live_prices)} tickers.")

    cnbc_recs = scrape_cnbc_rss()
    print(f"Scraped {len(cnbc_recs)} recs from CNBC Indonesia.")

    kontan_recs = scrape_kontan_tags()
    print(f"Scraped {len(kontan_recs)} recs from Kontan Tag page.")

    all_recs = cnbc_recs + kontan_recs

    # Enrich with live price
    for r in all_recs:
        tick = r["ticker"]
        if tick in live_prices:
            pinfo = live_prices[tick]
            r["last_price"] = pinfo.get("price")
            r["change_pct"] = round(pinfo.get("change_pct", 0) * 100, 2)
            # Calculate % to Target if target is a number
            try:
                # Target price can be range e.g. "5600-5700", take first or average
                tp_val = float(r["target_price"].split("-")[0].replace(",", ""))
                last_val = pinfo.get("price", 0)
                if last_val > 0:
                    r["upside_pct"] = round(((tp_val - last_val) / last_val) * 100, 1)
            except Exception:
                r["upside_pct"] = None
        else:
            r["last_price"] = None
            r["change_pct"] = None
            r["upside_pct"] = None

    # Save output
    out_dir = "/home/ubuntu/ragaplaybook/public/data/tracker"
    os.makedirs(out_dir, exist_ok=True)

    out_file = os.path.join(out_dir, "latest.json")
    payload = {
        "updated_at": datetime.now().isoformat(),
        "total": len(all_recs),
        "data": all_recs
    }

    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

    print(f"Successfully saved {len(all_recs)} recommendations to {out_file}")

if __name__ == "__main__":
    main()
