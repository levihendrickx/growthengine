# Growth Engine — architecture

**Version:** v0.1 (POC)
**Date:** 2026-04-30
**Status:** Living document — change via PR

> **Visual diagram:** [`assets/growth_engine_architecture.html`](assets/growth_engine_architecture.html)
> Open locally in a browser for the colored, animated layer-by-layer view.

## Overview

Growth Engine consists of 13 layers, grouped into three phases:

1. **Input → Atomspace** (layers 1-5) — sources, per-source processing, vision-LLM on input ads, merge, ingest
2. **Reasoning** (layers 6-8) — MeTTa/PLN reasons continuously, agent talks to user, PLN produces ad specs
3. **Generation + verification** (layers 9-13) — prompts, image generation, two verification loops, output + feedback loop

## Ownership (as of 2026-04-30)

| Layers | Topic | Owner |
|---|---|---|
| 1-2 | Sources + per-source processing | **Robbin** (APIs) |
| 3 | Vision-LLM on input ads | TBD — see open question below |
| 4-5 | Merge + Atomspace ingest | **Mubashir** (backend) |
| 6 | MeTTa / PLN | **Mubashir** |
| 7 | Agent layer | TBD |
| 8-13 | Ad-spec query → output | **Mubashir** + LLM orchestration |

## Layers in detail

### 01 — Sources
Five input sources feed the system:

- **Meta CSV** (Levi's existing `parse_meta_csv.py`): ad-id, creative-id, CTR, CPC, ROAS, spend, impressions, campaign, adset
- **Meta API**: creative-id → image-url, headline, body, CTA. Including downloading the `.jpg` locally
- **Shopify API**: orders per product, `utm_ad` per order, revenue, AOV, conversion-rate, return-rate, date
- **Weather + calendar**: Open-Meteo (free), Nager.Date holidays (historical + live)
- **Brand input** (one-off, static): Shopify scrape **or** brand-book upload — colors, fonts, tone, logo, products, price range

### 02 — Per-source processing
One Python script per source, no shared base class (per [ADR 0003](decisions/0003-import-architecture.md)):

- `parse_meta_csv.py` — CSV → structured data per ad-id
- `download_meta_creative.py` — image-url → `images/<ad_id>.jpg` (carousels: `<ad_id>_1.jpg` etc.)
- `import_shopify.py` — utm-ad, product-id, revenue, AOV
- `build_day_atom.py` — date as key, season, day-of-week, weather, holiday (one shared atom per day)
- `parse_branding.py` — scrape or PDF → atoms via LLM

### 03 — Vision-LLM (input ads)
Each input ad image is sent once to a vision-LLM (GPT-4o Vision or Claude Sonnet) for a **factual description** — no interpretation, no hooks, no judgment. For unclear details: `"not visible"` instead of guessing. Output goes into the creative atom.

### 04 — Merge
One Python script joins all sources into a single record per ad. Three keys:

- `ad_id` — links Meta CSV to image and performance
- `utm_ad` — links Meta ad to Shopify orders
- `date` — links each ad to the day-atom for temporal context

### 05 — Atomspace (Hyperon / MeTTa)
Five atom types:

| Atom | Per | Contents |
|---|---|---|
| **Creative** | ad | ad-id, description (vision-LLM), headline, body, CTA, image-ref, date |
| **Performance** | ad | ad-id, CTR, CPC, ROAS, spend, impressions, campaign, adset, date |
| **Commerce** | ad → Shopify | ad-id, utm-ad, orders, revenue, conv-rate, AOV, product-id, date |
| **Day** | date (shared) | date, season, weather, temperature, holiday, day-of-week |
| **Brand** | one-off, static | colors, fonts, tone, logo-ref, products, price range, target audience |

**Links:** `creative ↔ performance` via `ad_id` · `performance ↔ commerce` via `ad_id + utm_ad` · `all atoms ↔ day` via `date` · `commerce ↔ product` via `product_id`. The brand atom is **outside the PLN analysis** — it only becomes active at output time.

### 06 — MeTTa / PLN (reasoning)
Hyperon's probabilistic logic reasons continuously across all atoms. Detects patterns, computes confidence scores, surfaces opportunities, learns from each campaign cycle.

Example patterns PLN detects:
- `"lifestyle + weekend + winter"` → ROAS 3.8 · conf 0.79 · n=14
- `"urgency + holiday -3 days"` → CTR high but conv low · conf 0.71
- `"Valentine day -10 start"` → 40% higher ROAS than day -3 · conf 0.84

### 07 — Agent (interface PLN ↔ user)
Two modes:

- **Proactive** — PLN surfaces an opportunity, agent sends a notification (push/email/in-app) including reason + confidence
- **Reactive** — user asks something ("Generate 10 ads for the silver bracelet"), agent answers + suggests relevant variations

### 08 — PLN ad specifications
On a user request, PLN searches the Atomspace and sorts by confidence. Mix of proven winners and underexplored variations:

- Ads 1-4: proven combinations (conf > 0.80)
- Ads 5-7: strong variations (conf 0.65-0.79)
- Ads 8-10: underexplored potential (conf 0.50-0.64)

Per spec: visual-style, setting, hook-type, emotional-angle, product-focus, day/season-context, brand colors/tone, image-ref, confidence, base atoms (traceable).

### 09 — LLM prompt generation
The LLM receives a PLN spec and converts it into an image prompt + ad copy. **No creative decisions** — those are already made. The LLM only fills in the language.

### 10 — Verification loop 1 (prompt check)
Automated check: does the prompt follow the spec? Brand colors correct? No added elements? No hallucinations in copy? Variations unique and within PLN bounds? On failure: max 2 retries, then flag for the user.

### 11 — Image generator
Approved prompts + image-ref (style reference) → image generator (DALL·E 3 / Midjourney API / Imagen). Output: 10 images.

### 12 — Verification loop 2 (image check)
Vision-LLM scans the generated image, PLN compares to the spec. All required elements present? Style matches the image-ref? Brand colors correct? On mismatch: prompt sharpened and retry.

### 13 — Output
Four outputs per generated ad:
- **Ad copy** (headline, body, CTA, on-brand)
- **Image** (verified, in Meta format)
- **Timing advice** (start day, duration, budget, target audience, expected ROAS)
- **Traceability** (which atoms underpin it, confidence per ad, verification logs)

**Feedback loop:** after each campaign cycle, new Meta results and Shopify conversions flow back as new atoms. Patterns sharpen, confidence scores grow.

## Open questions (to discuss)

1. **Vision-LLM on input ads (layer 3) — who owns it?** Technically an input step, but already LLM work. Robbin or Mubashir?
2. **Agent layer (layer 7) — who owns it?** Notification engine + chat interface touches both backend (PLN trigger) and frontend.
3. **What ADR 0003 misses:** this diagram adds Weather/Calendar, Branding and Vision-LLM as sources. Update ADR 0003 or write a new ADR for the expanded scope.
4. **Live pipeline (Robbin → Mubashir handover):** where do atoms land so Mubashir can ingest them? Bucket / DB / API. This is the hardest contract boundary. The next ADR (data runtime) should cover this.

## History

- **2026-04-30** — first version, based on Levi's HTML mockup of the same date
