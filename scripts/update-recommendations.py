#!/usr/bin/env python3
"""
Fetch rekomendasi saham dari data publik terminal.economstock.com
(reverse-engineered: jsDelivr CDN repo chamdani49-boop/terminal).

Sumber: https://cdn.jsdelivr.net/gh/chamdani49-boop/terminal@main/public/tracker.json
Output: public/data/tracker/latest.json (schema kompatibel page /tracker).
"""
import json
import os
import sys
import urllib.request
from datetime import datetime, timezone

TRACKER_URL = "https://raw.githubusercontent.com/chamdani49-boop/terminal/main/public/tracker.json"
LIVE_URL = "https://terminal-live.chamdani49.workers.dev/live.json"
OUT_PATH = os.path.join(os.path.dirname(__file__), "..", "public", "data", "tracker", "latest.json")

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36"


def fetch_json(url: str, timeout: int = 45):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def fmt_price(v):
    if v is None:
        return None
    return round(float(v), 2)


def main():
    tracker = fetch_json(TRACKER_URL)
    live = {}
    try:
        live = fetch_json(LIVE_URL).get("live", {})
    except Exception as e:
        print(f"WARN: live.json gagal ({e}), pakai lastPrice dari tracker", file=sys.stderr)

    open_list = tracker.get("openList") or []
    pending_list = tracker.get("pendingList") or []

    # Gabung open (TRIGGERED) + pending (belum kena entry) biar rekomendasi
    # hari ini langsung muncul meski belum trigger.
    recs = open_list + pending_list
    # Dedup by id (satu rekomen bisa muncul di dua list)
    seen_ids = set()
    unique_recs = []
    for rec in recs:
        rid = rec.get("id")
        if rid in seen_ids:
            continue
        seen_ids.add(rid)
        unique_recs.append(rec)

    data = []
    for rec in unique_recs:
        ticker = rec.get("ticker", "")
        if not ticker:
            continue
        entry = fmt_price(rec.get("entry"))
        tp1 = fmt_price(rec.get("tp1"))
        tp2 = fmt_price(rec.get("tp2"))
        sl = fmt_price(rec.get("sl"))
        # Harga live selalu menang. lastPrice dari tracker bisa stale karena tracker
        # hanya berubah saat update rekomendasi harian.
        live_price = fmt_price((live.get(ticker) or {}).get("price"))
        last = live_price if live_price is not None else fmt_price(rec.get("lastPrice"))

        upside = None
        if last and tp1:
            upside = round((tp1 / last - 1) * 100, 2)

        downside = None
        if last and sl:
            downside = round((sl / last - 1) * 100, 2)

        note = (rec.get("note") or "")[:120]
        title = note or f"Rekomendasi {rec.get('type', 'BUY')} {ticker}"

        data.append({
            "ticker": ticker,
            "ticker_name": rec.get("tickerName"),
            "sector": rec.get("sector"),
            "broker": rec.get("firm") or "—",
            "analyst": rec.get("analyst") or "",
            "action": rec.get("type") or "BUY",
            "entry": entry,
            "target_price": tp1,
            "tp2": tp2,
            "stop_loss": sl,
            "last_price": last,
            "upside_pct": upside,
            "downside_pct": downside,
            "floating_pct": rec.get("floatingPct"),
            "score": rec.get("score"),
            "validity": rec.get("validity"),
            "state": rec.get("state"),
            "status": rec.get("status"),
            "date": rec.get("openDate"),
            "source": "Konsensus Sekuritas",
            "url": "",
            "title": title,
        })

    # Urut: tanggal terbaru dulu, lalu upside tertinggi
    data.sort(key=lambda x: (x["date"] or "", x["upside_pct"] or -999), reverse=True)

    out = {
        "updated_at": datetime.now(timezone.utc).astimezone().isoformat(),
        "source": "Agregator Rekomendasi Sekuritas",
        "tracker_updated_at": tracker.get("updatedAt"),
        "since": tracker.get("since"),
        "total": len(data),
        "open_count": len(open_list),
        "pending_count": len(pending_list),
        "winrate": tracker.get("winrate"),
        "net_return": tracker.get("netReturn"),
        "data": data,
    }

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    print(f"OK: {len(data)} rekomendasi open -> {OUT_PATH}")
    print(f"Tracker updatedAt: {tracker.get('updatedAt')} | winrate: {tracker.get('winrate')}%")


if __name__ == "__main__":
    main()
