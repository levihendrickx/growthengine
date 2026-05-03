# 2026-05-03 — Vision-LLM descriptions on creative atoms

Architecture layer 3: each ad image now has a factual description, so PLN later
has a textual representation of what is IN the image (not just the copy next
to it). Without this, patterns like "lifestyle + beach + summer = winner"
cannot exist.

## What's done

- New script `scripts/describe_creative_images.py` — sends each
  `images/<ad_id>_<n>.jpg` to Claude Sonnet (vision) and writes the description
  back into the corresponding image dict in `atoms/creative/<ad_id>.json`.
- One full pass over the 100 creative atoms / 172 images in Stoney's account.
- Idempotent: re-running skips images that already have a description
  (use `--force` to re-describe).

## Decisions

- **Description lives per image, not as a top-level array.** The atom already has
  a `descriptions[]` field for Meta-side ad description text. A second
  `descriptions[]` for image content would collide. Putting `description` inside
  each `images[]` entry keeps order implicit and the link image ↔ text
  unambiguous.
- **Strict factual prompt.** No marketing interpretation, no claims about mood,
  no guessed brand/product names unless they appear as visible text on the
  image. "Not visible" when a detail is unclear. Matches the architecture spec.
- **English descriptions** (repo language per ADR 0004), even though the ad
  copy itself is Dutch. PLN does not care about language, English is more
  reliable for the vision model.
- **Model:** `claude-sonnet-4-6` (latest Sonnet). The webapp pins
  `claude-sonnet-4-5` for ad-copy generation; new code uses the newer model.

## Cost

~$0.005 per image · 172 images ≈ $0.85 for the full pass.

## Next step

- Brand-anchors / brand atom (architecture layer 1) — Stoney's product catalog
  and house style as a one-off atom, scraped from Shopify.
