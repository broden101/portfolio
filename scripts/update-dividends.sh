#!/bin/bash
# Fetch IDX Kompas 100 dividend data
# Run: bash scripts/update-dividends.sh

cd /root/portfolio
python3 scripts/fetch-dividends.py
