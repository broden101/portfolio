#!/bin/bash
# Fetch IDX Kompas 100 dividend data
# Run: bash scripts/update-dividends.sh

cd "$(dirname "$0")/.."
python3 scripts/fetch-dividends.py
