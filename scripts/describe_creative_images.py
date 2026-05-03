"""
describe_creative_images.py — Add vision-LLM descriptions to creative atoms (architecture layer 3).

For each creative atom in atoms/creative/, this script:
- iterates over the images[] array
- skips images that already have a description (idempotent; --force overrides)
- sends the image to Claude Sonnet (vision) with a strict factual-description prompt
- writes the description back into the same image dict as a "description" field
- saves the atom

This is layer 3 of the architecture: PLN later needs a textual representation of
what is IN the image, not just the copy next to it. Without this, patterns like
"lifestyle + beach + summer = winner" cannot exist.

Why a per-image field instead of a top-level descriptions[] array:
- the existing atom already has a "descriptions" field (Meta ad description text)
- pairing the description with its image (same dict) keeps order implicit and the
  link between image_ref ↔ description unambiguous.

Output mutation (atoms/creative/<ad_id>.json):
    "images": [
      {
        "ref": "images/<ad_id>_1.jpg",
        "url": "...",
        "hash": "...",
        "width": 1080,
        "height": 1080,
        "description": "A man's wrist on a wooden table, wearing a beaded ..."   ← ADDED
      }
    ]

API:    Anthropic Messages API (claude-sonnet-4-6)
Auth:   ANTHROPIC_API_KEY from .env
Cost:   ~$0.005 per image · 172 images ≈ $0.85 for a full pass

Usage:
    python scripts/describe_creative_images.py --limit 1 --dry-run
    python scripts/describe_creative_images.py --limit 5
    python scripts/describe_creative_images.py --ad-id 120242461191650070
    python scripts/describe_creative_images.py --force          # re-describe everything
"""

import argparse
import base64
import json
import os
import sys
import time
from pathlib import Path

from dotenv import load_dotenv
import anthropic

REPO_ROOT = Path(__file__).parent.parent
CREATIVE_DIR = REPO_ROOT / "atoms" / "creative"

MODEL = "claude-sonnet-4-6"
MAX_TOKENS = 400

SYSTEM_PROMPT = (
    "You describe advertising images factually for a knowledge graph. "
    "Output ONLY what is visually present: subjects, objects, setting, framing, "
    "colors, lighting, composition, visible text on the image. "
    "RULES:\n"
    "- No marketing interpretation. No claims about mood, emotion, or message.\n"
    "- No guessed identities, brand names, or product names unless they appear as visible text.\n"
    "- If a detail is unclear, say 'not visible' rather than guess.\n"
    "- One paragraph, 2-4 sentences, English, no bullet points, no preamble."
)

USER_PROMPT = "Describe this advertising image factually."


def media_type_for(path: Path) -> str:
    ext = path.suffix.lower()
    return {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".gif": "image/gif",
    }.get(ext, "image/jpeg")


def describe_image(client: anthropic.Anthropic, image_path: Path) -> str:
    """One vision call. Returns the description text. Retries on transient errors."""
    image_b64 = base64.standard_b64encode(image_path.read_bytes()).decode("ascii")
    media_type = media_type_for(image_path)

    for attempt in range(1, 4):
        try:
            msg = client.messages.create(
                model=MODEL,
                max_tokens=MAX_TOKENS,
                system=[
                    {
                        "type": "text",
                        "text": SYSTEM_PROMPT,
                        "cache_control": {"type": "ephemeral"},
                    }
                ],
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": media_type,
                                    "data": image_b64,
                                },
                            },
                            {"type": "text", "text": USER_PROMPT},
                        ],
                    }
                ],
            )
            return msg.content[0].text.strip()
        except (anthropic.RateLimitError, anthropic.APIStatusError, anthropic.APIConnectionError) as e:
            if attempt < 3:
                wait = 2 ** attempt
                print(f"    [retry {attempt}] {type(e).__name__}, waiting {wait}s...")
                time.sleep(wait)
                continue
            raise


def process_atom(
    client: anthropic.Anthropic,
    atom_path: Path,
    force: bool,
    dry_run: bool,
) -> tuple[int, int, int]:
    """Returns (described, skipped, missing) for one atom."""
    atom = json.loads(atom_path.read_text(encoding="utf-8"))
    ad_id = atom.get("ad_id", atom_path.stem)
    images = atom.get("images") or []

    described = skipped = missing = 0
    mutated = False

    for idx, img in enumerate(images, start=1):
        ref = img.get("ref")
        existing = img.get("description")

        if existing and not force:
            skipped += 1
            continue

        if not ref:
            missing += 1
            continue

        image_path = REPO_ROOT / ref
        if not image_path.exists():
            print(f"    [WARN] {ad_id} image {idx}: file not on disk — {ref}")
            missing += 1
            continue

        if dry_run:
            print(f"    (dry) {ad_id}_{idx}  ← would describe {ref}")
            described += 1
            continue

        try:
            desc = describe_image(client, image_path)
        except Exception as e:
            print(f"    [ERROR] {ad_id}_{idx}: {e}")
            continue

        img["description"] = desc
        mutated = True
        described += 1
        print(f"    ✓ {ad_id}_{idx}  {desc[:90]}{'...' if len(desc) > 90 else ''}")

    if mutated and not dry_run:
        atom_path.write_text(json.dumps(atom, indent=2, ensure_ascii=False), encoding="utf-8")

    return described, skipped, missing


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser(description="Add vision-LLM descriptions to creative atoms.")
    parser.add_argument("--limit", type=int, default=None, help="Max number of atoms to process")
    parser.add_argument("--ad-id", type=str, default=None, help="Process a single ad_id only")
    parser.add_argument("--force", action="store_true", help="Re-describe images that already have a description")
    parser.add_argument("--dry-run", action="store_true", help="Show what would happen, no API calls, no writes")
    args = parser.parse_args()

    load_dotenv(REPO_ROOT / ".env", override=True)
    if not args.dry_run and not os.environ.get("ANTHROPIC_API_KEY"):
        print("[ERROR] ANTHROPIC_API_KEY missing in .env")
        sys.exit(1)

    if args.ad_id:
        atom_paths = [CREATIVE_DIR / f"{args.ad_id}.json"]
        if not atom_paths[0].exists():
            print(f"[ERROR] no atom for ad_id {args.ad_id}")
            sys.exit(1)
    else:
        atom_paths = sorted(CREATIVE_DIR.glob("*.json"))

    if args.limit is not None:
        atom_paths = atom_paths[: args.limit]

    print(f"Model:    {MODEL}")
    print(f"Atoms:    {len(atom_paths)} to process")
    print(f"Force:    {'yes (re-describe)' if args.force else 'no (skip already-described)'}")
    print(f"Mode:     {'DRY-RUN (no API calls, no writes)' if args.dry_run else 'LIVE'}")
    print()

    client = anthropic.Anthropic() if not args.dry_run else None

    total_described = total_skipped = total_missing = 0
    for atom_path in atom_paths:
        ad_id = atom_path.stem
        print(f"  {ad_id}")
        d, s, m = process_atom(client, atom_path, args.force, args.dry_run)
        total_described += d
        total_skipped += s
        total_missing += m

    print()
    verb = "would describe" if args.dry_run else "described"
    print(f"Done: {verb} {total_described} images, skipped {total_skipped} (already done), {total_missing} missing/no-ref.")


if __name__ == "__main__":
    main()
