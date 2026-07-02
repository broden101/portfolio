#!/usr/bin/env python3
"""Wrapper that calls fetch_foreign_flow.py"""
import sys, os
script = os.path.expanduser("~/.hermes/scripts/fetch_foreign_flow.py")
sys.exit(os.system(f"python3 {script}"))
