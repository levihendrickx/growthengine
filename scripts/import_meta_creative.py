"""
import_meta_creative.py — Import ad creatives (image, copy, CTA) from the Meta Marketing API.

For each ad in Stoney's account, this script:
- fetches creative metadata (headline, body, CTA, image URL) via the /ads endpoint with the creative field
- downloads the image to images/<ad_id>.jpg
- writes a creative atom to atoms/creative/<ad_id>.json

The vision-LLM description field (architecture layer 3) is NOT populated here.
That's a separate step that reads images/<ad_id>.jpg and adds a "description"
field to the existing atom.

API:    Meta Graph API (version from .env)
Scope:  ads_read (read-only)
Auth:   System User Token from .env

Output schema (atoms/creative/<ad_id>.json):
    {
      "ad_id": "...",
      "ad_name": "...",
      "creative_id": "...",
      "headline": "...",
      "body": "...",
      "cta": "...",
      "image_ref": "images/<ad_id>.jpg",
      "image_url": "https://...",
      "date": "YYYY-MM-DD"
    }

Usage:
    python scripts/import_meta_creative.py
    python scripts/import_meta_creative.py --limit 10 --dry-run
    python scripts/import_meta_creative.py --no-images   # skip downloads
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

import requests
from dotenv import load_dotenv

REPO_ROOT = Path(__file__).parent.parent
CREATIVE_DIR = REPO_ROOT / "atoms" / "creative"
IMAGES_DIR = REPO_ROOT / "images"

# Fields requested per ad. The nested {creative{...}} pulls one level deep.
AD_FIELDS = (
    "id,name,created_time,"
    "creative{"
    "id,name,image_url,image_hash,thumbnail_url,"
    "object_story_spec,asset_feed_spec,effective_object_story_id"
    "}"
)


def fetch_ads(token: str, api_version: str, ad_account_id: str, limit: int) -> list[dict]:
    """Paginate through /act_<id>/ads until we have `limit` ads or run out."""
    url = f"https://graph.facebook.com/{api_version}/{ad_account_id}/ads"
    params = {
        "fields": AD_FIELDS,
        "limit": min(50, limit),
        "access_token": token,
    }

    collected: list[dict] = []
    while url and len(collected) < limit:
        for attempt in range(1, 4):
            r = requests.get(url, params=params, timeout=30)
            if r.status_code == 200:
                break
            if r.status_code in (429, 500, 502, 503, 504) and attempt < 3:
                wait = 2 ** attempt
                print(f"  [retry {attempt}] HTTP {r.status_code}, waiting {wait}s...")
                time.sleep(wait)
                continue
            print(f"\n[ERROR] Meta API {r.status_code}: {r.text[:300]}")
            sys.exit(1)

        payload = r.json()
        collected.extend(payload.get("data", []))

        next_url = payload.get("paging", {}).get("next")
        url = next_url
        params = None  # next URL already has the auth + cursor baked in

    return collected[:limit]


def first_text(items: list[dict] | None, key: str = "text") -> str:
    """Return the `key` from the first dict in `items`, or empty string."""
    if items and isinstance(items, list):
        first = items[0]
        if isinstance(first, dict):
            return first.get(key, "") or ""
    return ""


def extract_fields(ad: dict) -> dict:
    """Pull headline / body / cta / image_url from the nested creative.

    Tries link_data first (most common), falls back to asset_feed_spec for
    dynamic-creative ads, then to top-level creative fields.
    """
    creative = ad.get("creative") or {}
    spec = creative.get("object_story_spec") or {}
    link = spec.get("link_data") or {}
    feed = creative.get("asset_feed_spec") or {}

    # Headline: link_data.name → asset_feed_spec.titles[0].text → creative.name
    headline = (
        link.get("name")
        or first_text(feed.get("titles"))
        or creative.get("name", "")
    )

    # Body: link_data.message → asset_feed_spec.bodies[0].text
    body = link.get("message") or first_text(feed.get("bodies"))

    # CTA: link_data.call_to_action.type → asset_feed_spec.call_to_action_types[0]
    cta = ""
    cta_obj = link.get("call_to_action") or {}
    if isinstance(cta_obj, dict):
        cta = cta_obj.get("type", "") or ""
    if not cta:
        cta_types = feed.get("call_to_action_types")
        if cta_types and isinstance(cta_types, list):
            cta = cta_types[0] if isinstance(cta_types[0], str) else ""

    # Image URL: link_data.picture → creative.image_url → creative.thumbnail_url
    image_url = (
        link.get("picture")
        or creative.get("image_url")
        or creative.get("thumbnail_url", "")
    )

    return {
        "headline": headline.strip() if isinstance(headline, str) else "",
        "body": body.strip() if isinstance(body, str) else "",
        "cta": cta,
        "image_url": image_url,
        "creative_id": creative.get("id", ""),
    }


def download_image(url: str, ad_id: str, dry_run: bool) -> str | None:
    """Download `url` to images/<ad_id>.jpg. Returns the relative path or None."""
    if not url:
        return None
    rel_path = f"images/{ad_id}.jpg"
    if dry_run:
        return rel_path

    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    out_path = IMAGES_DIR / f"{ad_id}.jpg"

    for attempt in range(1, 4):
        try:
            r = requests.get(url, timeout=30, stream=True)
            if r.status_code == 200:
                with out_path.open("wb") as f:
                    for chunk in r.iter_content(chunk_size=64 * 1024):
                        f.write(chunk)
                return rel_path
            if r.status_code in (429, 500, 502, 503, 504) and attempt < 3:
                time.sleep(2 ** attempt)
                continue
            print(f"  [WARN] image download {r.status_code} for {ad_id}")
            return None
        except requests.RequestException as e:
            if attempt < 3:
                time.sleep(2 ** attempt)
                continue
            print(f"  [WARN] image download failed for {ad_id}: {e}")
            return None
    return None


def to_atom(ad: dict, fields: dict, image_ref: str | None) -> dict:
    created = ad.get("created_time", "")
    date = created[:10] if created else ""
    return {
        "ad_id": ad.get("id", ""),
        "ad_name": ad.get("name", ""),
        "creative_id": fields["creative_id"],
        "headline": fields["headline"],
        "body": fields["body"],
        "cta": fields["cta"],
        "image_ref": image_ref or "",
        "image_url": fields["image_url"],
        "date": date,
    }


def write_atom(atom: dict, dry_run: bool) -> bool:
    ad_id = atom.get("ad_id")
    if not ad_id:
        return False
    if dry_run:
        return True
    CREATIVE_DIR.mkdir(parents=True, exist_ok=True)
    out_path = CREATIVE_DIR / f"{ad_id}.json"
    out_path.write_text(json.dumps(atom, indent=2, ensure_ascii=False), encoding="utf-8")
    return True


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser(description="Import ad creatives from the Meta Marketing API.")
    parser.add_argument("--limit", type=int, default=100, help="Max number of ads (safety, default 100)")
    parser.add_argument("--dry-run", action="store_true", help="Show what would happen, write nothing")
    parser.add_argument("--no-images", action="store_true", help="Skip image downloads")
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
    print(f"Limit:    {args.limit} ads")
    print(f"Images:   {'SKIP' if args.no_images else 'download to images/'}")
    print(f"Mode:     {'DRY-RUN (writing nothing)' if args.dry_run else 'LIVE (writing to atoms/creative/)'}")
    print()

    ads = fetch_ads(token, api_version, ad_account_id, args.limit)
    if not ads:
        print("No ads returned.")
        return

    written = 0
    skipped_no_id = 0
    skipped_no_image = 0
    for ad in ads:
        ad_id = ad.get("id")
        if not ad_id:
            skipped_no_id += 1
            continue

        fields = extract_fields(ad)
        image_ref = None
        if not args.no_images and fields["image_url"]:
            image_ref = download_image(fields["image_url"], ad_id, args.dry_run)
        elif not fields["image_url"]:
            skipped_no_image += 1

        atom = to_atom(ad, fields, image_ref)
        if write_atom(atom, args.dry_run):
            marker = "(dry)" if args.dry_run else "✓"
            img_marker = "🖼" if image_ref else "—"
            print(f"  {marker} {img_marker} {ad_id} — {(atom['ad_name'] or '')[:50]}")
            written += 1

    print()
    print(f"Done: {written} atoms {'simulated' if args.dry_run else 'written'}.")
    if skipped_no_image:
        print(f"      {skipped_no_image} ads had no image URL")
    if skipped_no_id:
        print(f"      {skipped_no_id} ads had no id")
    if not args.dry_run:
        print(f"Atoms:  {CREATIVE_DIR.resolve()}")
        if not args.no_images:
            print(f"Images: {IMAGES_DIR.resolve()}")


if __name__ == "__main__":
    main()
