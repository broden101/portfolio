#!/usr/bin/env python3
"""Auto-update APBN data for ragaplaybook dashboard.

Annual targets (Pagu APBN 2026) are hardcoded constants.
Realisasi updated via web search — most reliable source given govt sites are SPAs/WAF'd.

Run via Hermes cron (monthly, 12th day). Script outputs JSON context for the agent.
"""
import json
import os
import subprocess
import sys
from datetime import datetime, date
from pathlib import Path

REPO_DIR = Path("/home/ubuntu/ragaplaybook")
DATA_FILE = REPO_DIR / "data" / "manual-market.json"

# ── Annual targets (APBN 2026 UU, Triliun Rupiah) ──
PENDAPATAN_TARGET = 3153.6
BELANJA_TARGET = 3842.7
DEFISIT_TARGET = 689.0

MONTH_NAMES_ID = {
    1: "Januari", 2: "Februari", 3: "Maret", 4: "April", 5: "Mei", 6: "Juni",
    7: "Juli", 8: "Agustus", 9: "September", 10: "Oktober", 11: "November", 12: "Desember"
}


def load_data():
    if DATA_FILE.exists():
        try:
            return json.loads(DATA_FILE.read_text())
        except Exception:
            pass
    return {}


def main():
    today = date.today()
    current = load_data()
    apbn = current.get("apbn", {})

    # Output context for Hermes agent to use in web search
    context = {
        "task": "Find and extract latest APBN realisasi data for Indonesia",
        "current_data": {
            "pendapatan_realisasi": apbn.get("pendapatan", 1185.0),
            "pendapatan_target": PENDAPATAN_TARGET,
            "belanja_realisasi": apbn.get("belanja", 1365.4),
            "belanja_target": BELANJA_TARGET,
            "deficit_realisasi": apbn.get("deficit", 180.4),
            "deficit_target": DEFISIT_TARGET,
            "current_month": apbn.get("note", "Mei"),
        },
        "search_query": f"realisasi APBN {today.year} pendapatan belanja defisit terbaru",
        "data_file": str(DATA_FILE),
        "targets": {
            "pendapatan": PENDAPATAN_TARGET,
            "belanja": BELANJA_TARGET,
            "deficit": DEFISIT_TARGET,
        },
        "instructions": (
            "Search web for latest APBN realisasi data. Look for Pendapatan Negara, "
            "Belanja Negara, and surplus/defisit figures in Triliun Rupiah. "
            "If found newer data than current, update data/manual-market.json. "
            "Target values are annual and must NOT change. Only update realisasi values. "
            "After updating, git add/commit/push."
        ),
    }
    print(json.dumps(context, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
