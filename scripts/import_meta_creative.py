"""
import_meta_creative.py — Import ad creatives (image, copy, CTA) from the Meta Marketing API.

For each ad in Stoney's account, this script:
- fetches creative metadata via /act_<id>/ads with the nested creative field
- collects ALL text variants (headlines, bodies, descriptions) — Stoney uses
  dynamic-creative ads where Meta rotates between many variants per ad
- resolves every image_hash via /act_<id>/adimages to get the full-resolution
  URL (the image_url field on a creative is only a 64x64 preview thumbnail)
- downloads each image to images/<ad_id>_<index>.<ext>
- writes a creative atom to atoms/creative/<ad_id>.json

The vision-LLM description (architecture layer 3) is NOT populated here.
That's a separate step that reads images/<ad_id>_*.png and adds a "description"
field to the existing atom.

API:    Meta Graph API (version from .env)
Scope:  ads_read (read-only)
Auth:   System User Token from .env

Output schema (atoms/creative/<ad_id>.json):
    {
      "ad_id": "...",
      "ad_name": "...",
      "creative_id": "...",
      "creative_name": "...",
      "object_type": "SHARE" | "VIDEO" | ...,
      "instagram_permalink_url": "https://...",
      "headlines": ["...", "..."],          # all title variants (or [single])
      "bodies": ["...", "..."],             # all body variants
      "descriptions": ["..."],              # all description variants
      "ctas": ["SHOP_NOW", ...],            # all CTA variants
      "link_urls": ["https://..."],         # all link variants
      "images": [
        {
          "ref": "images/<ad_id>_1.png",
          "url": "https://scontent...",
          "hash": "65e6d2b0...",
          "width": 1080,
          "height": 1080
        }
      ],
      "date": "YYYY-MM-DD",
      "created_time": "YYYY-MM-DDTHH:MM:SS+ZZ:ZZ"
    }

Usage:
    # Default: fetch the newest --limit ads from the account.
    python scripts/import_meta_creative.py
    python scripts/import_meta_creative.py --limit 10 --dry-run
    python scripts/import_meta_creative.py --no-images   # skip downloads

    # Recommended for a joinable dataset: fetch only the ads that already
    # exist as performance atoms. Guarantees creative atoms join with
    # performance atoms on ad_id (no silent set-mismatch — see
    # docs/notes/2026-05-25-fix-ad-id-join.md).
    python scripts/import_meta_api.py --days 90 --limit 200
    python scripts/import_meta_creative.py --ad-ids-from atoms/performance/
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
    "id,name,created_time,effective_status,"
    "creative{"
    "id,name,object_type,effective_object_story_id,instagram_permalink_url,"
    "image_url,image_hash,thumbnail_url,"
    "object_story_spec,asset_feed_spec"
    "}"
)


def http_get(url: str, params: dict | None, what: str) -> dict:
    """GET with retry on 429/5xx."""
    for attempt in range(1, 4):
        r = requests.get(url, params=params, timeout=30)
        if r.status_code == 200:
            return r.json()
        if r.status_code in (429, 500, 502, 503, 504) and attempt < 3:
            wait = 2**attempt
            print(
                f"  [retry {attempt}] {what} HTTP {r.status_code}, waiting {wait}s..."
            )
            time.sleep(wait)
            continue
        print(f"\n[ERROR] {what} {r.status_code}: {r.text[:300]}")
        sys.exit(1)
    return {}


def fetch_ads(
    token: str, api_version: str, ad_account_id: str, limit: int
) -> list[dict]:
    """Paginate through /act_<id>/ads until we have `limit` ads or run out.

    Returns ads in Meta's default order (newest first). This is NOT joinable
    with a separately-pulled /insights set: the two endpoints can return
    disjoint ad sets when the account has more ads than `limit`. For a
    joinable result, prefer `fetch_ads_by_ids` driven by `--ad-ids-from`.
    """
    url = f"https://graph.facebook.com/{api_version}/{ad_account_id}/ads"
    params = {
        "fields": AD_FIELDS,
        "limit": min(50, limit),
        "access_token": token,
    }
    collected: list[dict] = []
    while url and len(collected) < limit:
        payload = http_get(url, params, "fetch_ads")
        collected.extend(payload.get("data", []))
        url = payload.get("paging", {}).get("next")
        params = None  # next URL has auth + cursor baked in
    return collected[:limit]


def read_ad_ids_from_dir(directory: Path) -> list[str]:
    """Read ad_ids from JSON filenames in a directory.

    Each `<ad_id>.json` in `directory` contributes its stem as an ad_id.
    Used by `--ad-ids-from` to align the creative pull with an existing
    set of atoms (typically `atoms/performance/`).
    """
    if not directory.exists() or not directory.is_dir():
        return []
    seen: set[str] = set()
    out: list[str] = []
    for p in sorted(directory.glob("*.json")):
        ad_id = p.stem
        if ad_id and ad_id not in seen:
            seen.add(ad_id)
            out.append(ad_id)
    return out


def fetch_ads_by_ids(
    token: str, api_version: str, ad_ids: list[str], batch_size: int = 50
) -> list[dict]:
    """Batch-fetch ads by explicit ad_id list using the `?ids=` endpoint.

    Returns ads in the SAME shape as `fetch_ads`. Order follows `ad_ids`.
    Missing ads (Meta returns no entry for an unknown id) are silently
    skipped — caller can compare lengths to detect drift.

    Why batch endpoint: per-ad GET would be N requests; `?ids=a,b,c` returns
    up to ~50 ads per request, which respects the rate-limit budget in ADR 0003.
    """
    collected: list[dict] = []
    if not ad_ids:
        return collected

    for i in range(0, len(ad_ids), batch_size):
        batch = ad_ids[i : i + batch_size]
        url = f"https://graph.facebook.com/{api_version}/"
        params = {
            "ids": ",".join(batch),
            "fields": AD_FIELDS,
            "access_token": token,
        }
        payload = http_get(url, params, f"fetch_ads_by_ids[{i}:{i + len(batch)}]")
        # payload shape: {"<ad_id>": {ad object}, ...}; preserve request order
        for ad_id in batch:
            ad_data = payload.get(ad_id)
            if isinstance(ad_data, dict):
                # Meta sometimes returns the id at the top level; sometimes not.
                ad_data.setdefault("id", ad_id)
                collected.append(ad_data)
    return collected


def collect_texts(items: list[dict] | None, key: str = "text") -> list[str]:
    """Extract `key` from each dict in `items` and dedupe while preserving order."""
    out: list[str] = []
    if not items or not isinstance(items, list):
        return out
    for it in items:
        if isinstance(it, dict):
            v = it.get(key)
            if isinstance(v, str) and v.strip() and v not in out:
                out.append(v.strip())
    return out


def collect_image_hashes(creative: dict) -> list[str]:
    """All image_hashes in the creative, deduped, in priority order."""
    hashes: list[str] = []

    feed = creative.get("asset_feed_spec") or {}
    for img in feed.get("images") or []:
        if isinstance(img, dict) and img.get("hash"):
            if img["hash"] not in hashes:
                hashes.append(img["hash"])

    spec = creative.get("object_story_spec") or {}
    link = spec.get("link_data") or {}
    if link.get("image_hash") and link["image_hash"] not in hashes:
        hashes.append(link["image_hash"])

    if creative.get("image_hash") and creative["image_hash"] not in hashes:
        hashes.append(creative["image_hash"])

    return hashes


def extract_fields(ad: dict) -> dict:
    """Pull all text variants and image hashes from the ad's creative."""
    creative = ad.get("creative") or {}
    spec = creative.get("object_story_spec") or {}
    link = spec.get("link_data") or {}
    feed = creative.get("asset_feed_spec") or {}

    # Headlines: feed.titles[*] + link.name
    headlines = collect_texts(feed.get("titles"))
    if link.get("name") and link["name"] not in headlines:
        headlines.append(link["name"].strip())

    # Bodies: feed.bodies[*] + link.message
    bodies = collect_texts(feed.get("bodies"))
    if link.get("message") and link["message"] not in bodies:
        bodies.append(link["message"].strip())

    # Descriptions: feed.descriptions[*] + link.description
    descriptions = collect_texts(feed.get("descriptions"))
    if link.get("description") and link["description"] not in descriptions:
        descriptions.append(link["description"].strip())

    # CTAs: feed.call_to_action_types[*] + link.call_to_action.type
    ctas: list[str] = []
    for c in feed.get("call_to_action_types") or []:
        if isinstance(c, str) and c not in ctas:
            ctas.append(c)
    cta_obj = link.get("call_to_action") or {}
    if (
        isinstance(cta_obj, dict)
        and cta_obj.get("type")
        and cta_obj["type"] not in ctas
    ):
        ctas.append(cta_obj["type"])

    # Link URLs: feed.link_urls[*].website_url + link.link
    link_urls: list[str] = []
    for lu in feed.get("link_urls") or []:
        if isinstance(lu, dict) and lu.get("website_url"):
            if lu["website_url"] not in link_urls:
                link_urls.append(lu["website_url"])
    if link.get("link") and link["link"] not in link_urls:
        link_urls.append(link["link"])

    return {
        "creative_id": creative.get("id", ""),
        "creative_name": creative.get("name", ""),
        "object_type": creative.get("object_type", ""),
        "instagram_permalink_url": creative.get("instagram_permalink_url", ""),
        "headlines": headlines,
        "bodies": bodies,
        "descriptions": descriptions,
        "ctas": ctas,
        "link_urls": link_urls,
        "image_hashes": collect_image_hashes(creative),
    }


def resolve_hashes(
    token: str, api_version: str, ad_account_id: str, hashes: list[str]
) -> dict[str, dict]:
    """Resolve image_hashes to full URLs via /act_<id>/adimages.
    Returns a mapping: {hash: {url, permalink_url, width, height, name}}.
    """
    if not hashes:
        return {}
    url = f"https://graph.facebook.com/{api_version}/{ad_account_id}/adimages"
    params = {
        "hashes": json.dumps(list(dict.fromkeys(hashes))),
        "fields": "hash,url,permalink_url,width,height,name",
        "access_token": token,
    }
    payload = http_get(url, params, "resolve_hashes")
    result: dict[str, dict] = {}
    for img in payload.get("data") or []:
        if isinstance(img, dict) and img.get("hash"):
            result[img["hash"]] = img
    return result


def _ext_from_content_type(content_type: str) -> str:
    ct = (content_type or "").lower()
    if "png" in ct:
        return ".png"
    if "webp" in ct:
        return ".webp"
    if "gif" in ct:
        return ".gif"
    return ".jpg"


def download_image(url: str, ad_id: str, index: int, dry_run: bool) -> str | None:
    """Download `url` to images/<ad_id>_<index>.<ext>. Returns the relative path or None.
    Extension is chosen from the response Content-Type so the file isn't lying
    about its format (Meta serves PNG even when the URL ends in `.jpg`).
    """
    if not url:
        return None
    if dry_run:
        return f"images/{ad_id}_{index}.png"  # placeholder; real ext at download

    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    for attempt in range(1, 4):
        try:
            r = requests.get(url, timeout=60, stream=True)
            if r.status_code == 200:
                ext = _ext_from_content_type(r.headers.get("Content-Type", ""))
                out_path = IMAGES_DIR / f"{ad_id}_{index}{ext}"
                with out_path.open("wb") as f:
                    for chunk in r.iter_content(chunk_size=64 * 1024):
                        f.write(chunk)
                return f"images/{ad_id}_{index}{ext}"
            if r.status_code in (429, 500, 502, 503, 504) and attempt < 3:
                time.sleep(2**attempt)
                continue
            print(f"  [WARN] image download {r.status_code} for {ad_id}_{index}")
            return None
        except requests.RequestException as e:
            if attempt < 3:
                time.sleep(2**attempt)
                continue
            print(f"  [WARN] image download failed for {ad_id}_{index}: {e}")
            return None
    return None


def to_atom(ad: dict, fields: dict, images: list[dict]) -> dict:
    created = ad.get("created_time", "")
    return {
        "ad_id": ad.get("id", ""),
        "ad_name": ad.get("name", ""),
        "created_time": created,
        "date": created[:10] if created else "",
        "creative_id": fields["creative_id"],
        "creative_name": fields["creative_name"],
        "object_type": fields["object_type"],
        "instagram_permalink_url": fields["instagram_permalink_url"],
        "headlines": fields["headlines"],
        "bodies": fields["bodies"],
        "descriptions": fields["descriptions"],
        "ctas": fields["ctas"],
        "link_urls": fields["link_urls"],
        "images": images,
    }


def write_atom(atom: dict, dry_run: bool) -> bool:
    ad_id = atom.get("ad_id")
    if not ad_id:
        return False
    if dry_run:
        return True
    CREATIVE_DIR.mkdir(parents=True, exist_ok=True)
    out_path = CREATIVE_DIR / f"{ad_id}.json"
    out_path.write_text(
        json.dumps(atom, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    return True


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser(
        description="Import ad creatives from the Meta Marketing API."
    )
    parser.add_argument(
        "--limit", type=int, default=100, help="Max number of ads (safety, default 100)"
    )
    parser.add_argument(
        "--dry-run", action="store_true", help="Show what would happen, write nothing"
    )
    parser.add_argument("--no-images", action="store_true", help="Skip image downloads")
    parser.add_argument(
        "--ad-ids-from",
        type=str,
        metavar="DIR",
        default=None,
        help=(
            "Fetch only the ad_ids that appear as <ad_id>.json filenames in DIR "
            "(e.g. atoms/performance/). Guarantees the creative atoms join with "
            "the existing performance atoms. Without this flag, fetches the newest "
            "--limit ads via /act_<id>/ads, which may not overlap with /insights."
        ),
    )
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
    print(
        f"Images:   {'SKIP' if args.no_images else 'resolve hashes + download to images/'}"
    )
    print(
        f"Mode:     {'DRY-RUN (writing nothing)' if args.dry_run else 'LIVE (writing to atoms/creative/)'}"
    )

    if args.ad_ids_from:
        src = Path(args.ad_ids_from)
        if not src.is_absolute():
            src = REPO_ROOT / src
        ad_ids = read_ad_ids_from_dir(src)
        if not ad_ids:
            print(f"\n[ERROR] No <ad_id>.json files found in {src}")
            sys.exit(1)
        ad_ids = ad_ids[: args.limit]
        print(f"Source:   --ad-ids-from {src}")
        print(f"IDs:      {len(ad_ids)} ad_ids (capped by --limit)")
        print()
        ads = fetch_ads_by_ids(token, api_version, ad_ids)
        # Drift check: warn if Meta didn't return some of the requested ads
        returned_ids = {a.get("id") for a in ads if a.get("id")}
        missing = [aid for aid in ad_ids if aid not in returned_ids]
        if missing:
            print(
                f"[WARN] {len(missing)} ad_ids did not return data from Meta "
                f"(deleted, archived, or different account). First few: {missing[:5]}"
            )
    else:
        print()
        ads = fetch_ads(token, api_version, ad_account_id, args.limit)

    if not ads:
        print("No ads returned.")
        return

    written = 0
    total_images = 0
    for ad in ads:
        ad_id = ad.get("id")
        if not ad_id:
            continue

        fields = extract_fields(ad)

        # Resolve image_hashes → full URLs (one /adimages call per ad).
        images: list[dict] = []
        if fields["image_hashes"] and not args.no_images:
            resolved = resolve_hashes(
                token, api_version, ad_account_id, fields["image_hashes"]
            )
            for idx, h in enumerate(fields["image_hashes"], start=1):
                meta = resolved.get(h, {})
                full_url = meta.get("url", "")
                ref = (
                    download_image(full_url, ad_id, idx, args.dry_run)
                    if full_url
                    else None
                )
                images.append(
                    {
                        "ref": ref or "",
                        "url": full_url,
                        "hash": h,
                        "width": meta.get("width"),
                        "height": meta.get("height"),
                    }
                )
                if ref:
                    total_images += 1
        elif fields["image_hashes"]:
            # --no-images: still record what's there, but don't download
            for idx, h in enumerate(fields["image_hashes"], start=1):
                images.append(
                    {"ref": "", "url": "", "hash": h, "width": None, "height": None}
                )

        atom = to_atom(ad, fields, images)
        if write_atom(atom, args.dry_run):
            marker = "(dry)" if args.dry_run else "✓"
            n_h = len(fields["headlines"])
            n_b = len(fields["bodies"])
            n_i = len(images)
            print(
                f"  {marker} {ad_id} — {(atom['ad_name'] or '')[:40]}  · {n_h}h/{n_b}b/{n_i}img"
            )
            written += 1

    print()
    print(
        f"Done: {written} atoms {'simulated' if args.dry_run else 'written'}, {total_images} images downloaded."
    )
    if not args.dry_run:
        print(f"Atoms:  {CREATIVE_DIR.resolve()}")
        if not args.no_images:
            print(f"Images: {IMAGES_DIR.resolve()}")


if __name__ == "__main__":
    main()
