# 0003 — Import architecture (Meta API, Shopify, later TikTok / Google)

**Date:** 2026-04-28
**Status:** Accepted
**Decided by:** Robbin, Levi

## Context

We want to import ad performance and commerce data from various platforms into the Atomspace. Levi already has a first script (`parse_meta_csv.py`) that converts a Meta CSV export into atoms. Robbin will build this out further, starting with the Meta Marketing API and Shopify.

Eventually we also want TikTok, Google Ads and possibly Pinterest / Snapchat. The architecture must support that growth without abstracting everything up front.

## Decision

**One script per platform in `scripts/`, shared output to `atoms/`, secrets in `.env`.**

### Folder structure

```
scripts/
  parse_meta_csv.py        # existing (Levi)
  import_meta_api.py       # new — Robbin, first PR
  import_shopify.py        # new — Robbin, next
  import_tiktok.py         # later
  import_google_ads.py     # later
atoms/
  performance/<ad_id>.json   # ad performance (CTR, CPC, ROAS, ...)
  creative/<ad_id>.json      # ad content (image-url, headline, body, CTA)
  commerce/<order_id>.json   # Shopify orders
  days/<YYYY-MM-DD>.json     # weather + holiday + season (later)
  brand/<brand_id>.json      # brand profile (later, one-off)
.env                         # all tokens and API keys (gitignored)
.env.example                 # committable example without real values
```

### Per-script conventions

- **One Python file per source**, no shared base class for now.
- **Idempotent**: running the same script twice overwrites the same JSON files without harm.
- **Stdout = progress**, no need for a logging framework. One line per atom written.
- **Read from `.env`** via `python-dotenv`, never hardcode credentials.
- **Pin the API version** in code (e.g. Meta Graph API `v23.0`) — no "latest".

### Don't do (yet)

- No shared `Importer` base class. Add it once ≥3 imports work and the overlap is obvious.
- No async/concurrency until Meta or Shopify forces it via rate limits.
- No database. JSON files on disk are enough for the POC. Later possibly SQLite or the actual Atomspace.

## Meta safety — protect the production account

Stoney's Meta Business Manager is **production**. A mistake must NEVER lead to a blocked account or policy violation. Therefore:

1. **Separate Meta App** for Growth Engine (in the Developer portal). Not via an existing app.
2. **System User Token** instead of a personal User Token. System Users are separate technical accounts in Business Manager — the token can be revoked without affecting people.
3. **Read-only scope:** `ads_read` (and `ads_management` only if read-only is needed). No `pages_manage`, no `business_management` with write rights.
4. **Pin the API version** (`v23.0` at the time of writing). Prevents surprises when Meta updates.
5. **Conservative rate limits:** at most 200 requests per hour in this phase. Implement a `time.sleep()` between requests or retry with exponential backoff on `429 Too Many Requests`.
6. **Start with small batches** (`--limit 10`) before pulling full histories. First it works, then scale up.
7. **No "App Review" submission** as long as we only connect Stoney's own account — Standard Access is enough. App Review only happens when third parties start connecting (V1.5+).

## Shopify safety — also production

1. **Custom App** inside Stoney's Shopify Admin. Not via OAuth flow (that's for V1.5+ when third parties connect).
2. **Read-only scopes:** `read_orders`, `read_products`, `read_customers` (the latter only if needed). No write scopes.
3. **Token in `.env`**. Token is tied to the store; if anything looks suspicious revoke it directly in Shopify Admin.

## Consequences

- Robbin's first PR: `feature/meta-api-import` with only ad **performance** (no creative). Keeping PRs small keeps them reviewable for Levi.
- Add `.env.example` to the repo so it's clear which variables are expected, without real values.
- ADRs for later imports (TikTok, Google) reference this ADR for the architecture.
- For every new import: short section in the script's docstring with the API version, scopes and rate limits used.
