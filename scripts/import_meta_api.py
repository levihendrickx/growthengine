"""
import_meta_api.py — Import ad performance from the Meta Marketing API.

Writes one performance atom per ad to atoms/performance/<ad_id>.json.

API:    Meta Graph API (version from .env)
Scope:  ads_read (read-only)
Auth:   System User Token from .env

Usage:
    python scripts/import_meta_api.py
    python scripts/import_meta_api.py --days 30 --limit 50
    python scripts/import_meta_api.py --dry-run
"""

import argparse
import json
import os
import sys
import time
from datetime import date, timedelta
from pathlib import Path

import requests
from dotenv import load_dotenv

REPO_ROOT = Path(__file__).parent.parent
PERFORMANCE_DIR = REPO_ROOT / "atoms" / "performance"

INSIGHTS_FIELDS = [
    "ad_id", "ad_name",
    "campaign_id", "campaign_name",
    "adset_id", "adset_name",
    "impressions", "clicks", "ctr", "cpc", "cpm",
    "spend", "reach", "frequency",
    "date_start", "date_stop",
]
NUMERIC_FIELDS = {"impressions", "clicks", "ctr", "cpc", "cpm", "spend", "reach", "frequency"}


def fetch_insights(token: str, api_version: str, ad_account_id: str, days: int, limit: int) -> list[dict]:
    since = (date.today() - timedelta(days=days)).isoformat()
    until = date.today().isoformat()

    url = f"https://graph.facebook.com/{api_version}/{ad_account_id}/insights"
    params = {
        "level": "ad",
        "fields": ",".join(INSIGHTS_FIELDS),
        "time_range": json.dumps({"since": since, "until": until}),
        "limit": min(limit, 100),
        "access_token": token,
    }

    for attempt in range(1, 4):
        r = requests.get(url, params=params, timeout=30)
        if r.status_code == 200:
            return r.json().get("data", [])[:limit]
        if r.status_code in (429, 500, 502, 503, 504) and attempt < 3:
            wait = 2 ** attempt
            print(f"  [retry {attempt}] HTTP {r.status_code}, waiting {wait}s...")
            time.sleep(wait)
            continue
        print(f"\n[ERROR] Meta API {r.status_code}: {r.text[:300]}")
        sys.exit(1)
    return []


def to_atom(row: dict) -> dict:
    atom = {}
    for k, v in row.items():
        if k in NUMERIC_FIELDS:
            try:
                atom[k] = float(v)
            except (ValueError, TypeError):
                atom[k] = v
        else:
            atom[k] = v
    return atom


def write_atom(atom: dict, dry_run: bool) -> bool:
    ad_id = atom.get("ad_id")
    if not ad_id:
        return False
    if dry_run:
        return True
    PERFORMANCE_DIR.mkdir(parents=True, exist_ok=True)
    out_path = PERFORMANCE_DIR / f"{ad_id}.json"
    out_path.write_text(json.dumps(atom, indent=2, ensure_ascii=False), encoding="utf-8")
    return True


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser(description="Import ad performance from the Meta Marketing API.")
    parser.add_argument("--days", type=int, default=90, help="Days of history (default 90)")
    parser.add_argument("--limit", type=int, default=100, help="Max number of ads (safety, default 100)")
    parser.add_argument("--dry-run", action="store_true", help="Show what would happen, write nothing")
    args = parser.parse_args()

    load_dotenv(REPO_ROOT / ".env")
    token = os.environ.get("META_ACCESS_TOKEN")
    api_version = os.environ.get("META_API_VERSION", "v23.0")
    ad_account_id = os.environ.get("META_AD_ACCOUNT_ID")

    if not token or not ad_account_id:
        print("[ERROR] META_ACCESS_TOKEN and/or META_AD_ACCOUNT_ID missing in .env")
        sys.exit(1)

    print(f"Account:  {ad_account_id}")
    print(f"API:      {api_version}")
    print(f"Period:   last {args.days} days")
    print(f"Limit:    {args.limit} ads")
    print(f"Mode:     {'DRY-RUN (writing nothing)' if args.dry_run else 'LIVE (writing to atoms/performance/)'}")
    print()

    rows = fetch_insights(token, api_version, ad_account_id, args.days, args.limit)

    if not rows:
        print("No data received for this period.")
        return

    written = 0
    for row in rows:
        atom = to_atom(row)
        if write_atom(atom, args.dry_run):
            marker = "(dry)" if args.dry_run else "✓"
            print(f"  {marker} {atom.get('ad_id')} — {(atom.get('ad_name') or '')[:60]}")
            written += 1

    print()
    print(f"Done: {written} atoms {'simulated' if args.dry_run else 'written'}.")
    if not args.dry_run:
        print(f"Output: {PERFORMANCE_DIR.resolve()}")


if __name__ == "__main__":
    main()
