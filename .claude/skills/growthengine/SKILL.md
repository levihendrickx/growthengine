---
name: growthengine
description: Load Growth Engine project context — architecture, key files, conventions, API endpoints, and current state. Invoke at the start of any session working on this project to avoid re-scanning the codebase.
---

# Growth Engine — Project Context

A Node + Python webapp that generates Meta-feed ads using **real PeTTa/PLN reasoning** over historical Meta API data, then renders ad images with text composited in by `gpt-image-2`. The architectural intent is a **5-layer reasoning model** (Historical → Feature → Relationship → Decision → Generation), where the LLM only executes a strategy chosen by the PLN layer — it does not invent strategic direction.

The canonical, long-form plan lives at [plan.md](../../../plan.md) (root). Read it for any deeper question; this skill is the fast-load summary.

## Stack

- **Node Express server** — [webapp/server.js](../../../webapp/server.js) (port 8001). ESM (`import`/`export`).
- **Python subprocesses** — invoked via `runPython` helper (`execFile` to `OMEGACLAW_PYTHON`, default `C:\Windows\py.exe`). 300s timeout, 20MB stdout buffer.
- **PeTTa / PLN** — `python/petta.py` wraps swipl + janus_swi. Inference fires via `petta.process_metta_string(...)`. Rule definitions in [repos/OmegaClaw-Core/lib_pln.metta](../../../repos/OmegaClaw-Core/lib_pln.metta) (`|~` operator: Modus Ponens, Abduction, Deduction).
- **OpenAI Node SDK** — `gpt-4o-mini` (ad copy + vision verify), `gpt-image-2` (text-to-image + image-edit). Shared module-level client at [webapp/server.js](../../../webapp/server.js) (`openaiClient`).
- **Frontend** — vanilla JS, single page, no framework. State machine in [webapp/app.js](../../../webapp/app.js) (~3000 lines).
- **Data** — [sample_data/atoms/performance/](../../../sample_data/atoms/performance) (100 perf JSONs), [sample_data/atoms/creative/](../../../sample_data/atoms/creative) (100 creative JSONs), [sample_data/images/](../../../sample_data/images) (winner-ad source images, `<ad_id>_<i>.jpg`).

## API endpoints (all on `/api/*`)

| Endpoint | Calls | Purpose |
|---|---|---|
| `POST /api/pln-spec` | `webapp/pln_query.py` subprocess | Real PLN inference: outer-joins atoms, derives implications, returns `{patterns, strategy, matched_ads}`. |
| `POST /api/generate` | OpenAI `gpt-4o-mini` directly | Generates N ad copy variants consuming the `strategy` block as ground truth. |
| `POST /api/generate-image` | `webapp/gen_image.py` subprocess | Text-to-image via `gpt-image-2`. Renders headline/CTA/caption *into* the image. |
| `POST /api/generate-image-edit` | **Node SDK direct** (`openaiClient.images.edit`) | Image-to-image variation from a winner-ref or uploaded base64. Accepts `quality: 'low'\|'medium'\|'high'`, defaults `'low'`. **No Python subprocess** (ported for speed). |
| `POST /api/verify-image` | OpenAI `gpt-4o-mini` (vision) | Verifies generated image matches PLN spec elements; returns `matchPercent`. |
| `POST /api/feedback` | writes `feedback_log.jsonl` | Scaffold for write-back loop (thumbs up/down per ad). |
| `GET /sample-images/*` | `express.static(IMAGES_DIR)` | Serves winner-ad source images to the browser modal. |

## Key files (read first if a question touches them)

- [webapp/server.js](../../../webapp/server.js) — all routes, `buildEditPrompt`, `runPython` helper, OpenAI client at module scope.
- [webapp/app.js](../../../webapp/app.js) — pipeline orchestration in `startPipeline()`, `setStep(id, status, detail)` updates the 7-phase UI, `adCard()` renders output cards, `showReferenceModal()` is the winner picker. State in `state.*`.
- [webapp/pln_query.py](../../../webapp/pln_query.py) — atom synthesis, implication derivation, LearnedPattern emission, strategy formulation. Returns JSON on stdout.
- [webapp/gen_image.py](../../../webapp/gen_image.py) — text-to-image subprocess. Uses `quality="medium"`.
- [webapp/gen_image_edit.py](../../../webapp/gen_image_edit.py) — **DEPRECATED**. Logic ported to `buildEditPrompt` + direct Node SDK call in `server.js`. File still on disk; not invoked.
- [python/petta.py](../../../python/petta.py) — 3-method API (`process_metta_string`, `load_metta_file`, `__init__`).
- [plan.md](../../../plan.md) — canonical plan (5-layer architecture, phased rollout, open questions).

## Pipeline flow (frontend, `startPipeline`)

1. **PLN spec** — POST `/api/pln-spec` with `{product, context}`. Spec returns `patterns[]`, `strategy`, `matched_ads[]`.
2. **Ad copy** — POST `/api/generate` with the strategy block. Returns `N` ads each with `{headline, sub, body, cta, caption, scene, justification, pln_atoms}`.
3. **Reference modal** — `showReferenceModal()` shows PLN winners + upload zone. User picks a winner OR uploads OR skips.
4. **Image generation** — fan-out `Promise.all` over ads. If a winner is selected → `/api/generate-image-edit` with `quality:'low'` per ad. Else → `/api/generate-image`. **Per-image counter** updates the step text live (`1/3 afbeeldingen klaar…`).
5. **Vision verify** — first image only, POST `/api/verify-image`, shows match %.
6. **Output** — navigates to output page; `adCard()` renders each. Cards have a **Regenereer HD** button that re-fires the edit endpoint with `quality:'high'` for a single ad.

## Conventions & gotchas

- **Windows-first** — paths use backslashes, Python is `C:\Windows\py.exe` by default. PowerShell is the default shell (use `$null`, `$env:VAR`, no `&&`).
- **UI strings are Dutch** (`afbeeldingen`, `bestel`, `genereer`). Match the existing copy when editing — do not silently switch to English.
- **PLN spec is real, not LLM-mocked.** Never add an OpenAI call inside `/api/pln-spec`. The reasoning layer is deterministic.
- **`quality` parameter on image-edit** — client always sends `'low'` for the initial batch; HD only on user-triggered regen. Don't change the default without flagging.
- **Reference image file may be missing** — `findWinnerImageRef` can return a path that doesn't exist on disk. The server returns `{success:false, code:'ref_not_found'}` (404) and the client (`fetchAdImage`) silently falls back to text-to-image. Don't remove this fallback.
- **Subprocess overhead matters** — Python cold-start on Windows is ~1-3s per call. The image-edit endpoint was ported to Node specifically to avoid this. `gen_image.py` and `pln_query.py` are still subprocess-based.
- **OpenAI `images.edit` MIME requirement** — `createReadStream` alone sends `application/octet-stream` and the API rejects it. Use `toFile(stream, name, { type: 'image/png' | 'image/jpeg' | 'image/webp' })` from the `openai` package.
- **gpt-image-2 model name** — both `gen_image.py` and the edit endpoint use `gpt-image-2` despite many comments saying "gpt-image-1". Don't "correct" these to match the comments — the model name is intentional.
- **No emojis in code/UI unless explicitly asked.** Existing Unicode glyphs (`✓ ✗ ↗ ↓ ⎘`) are functional, not decorative.
- **Don't commit secrets** — `.env` is gitignored; the most recent commit `7236f7b` removed previously committed API keys.

## State shape (frontend, `state` global)

- `state.plnSpec` — full response from `/api/pln-spec` (`{patterns, strategy, matched_ads, performanceAtoms}`)
- `state.generatedAds` — array of ad-copy objects from `/api/generate`
- `state.generatedImages` — array of base64 strings (or `null` for failed slots), index-aligned with `generatedAds`
- `state.selectedWinnerAdId` — `ad_id` of the PLN winner the user picked
- `state.uploadedWinnerBase64` — data URL if user uploaded their own reference
- `state.apiOnline` — health-check result
- `state.pipelineRunning` — guard against double-clicks

## Recent optimizations (context for "why is this code like this")

- **Image-edit endpoint ported from Python to Node SDK** ([server.js](../../../webapp/server.js)). Removed ~2-4s subprocess overhead per call; HTTP keep-alive shared across parallel calls.
- **Per-image progress counter** in `startPipeline` ([app.js](../../../webapp/app.js)). Replaced blocking `Promise.all` + final `setStep` with a counter that updates as each image resolves. First image now visible ~25s instead of waiting for all.
- **`quality:'low'` default for image-edit** with on-demand `Regenereer HD` button on output cards. ~2-3× faster previews.
- **`ref_not_found` fallback** — when PLN winner's image file is missing from disk, client transparently falls back to text-to-image for that ad.
- **Broken-image guard in reference modal** — cards whose `<img>` fails to load are greyed out and unselectable.

## Environment

- `OPENAI_API_KEY` — required.
- `OMEGACLAW_PYTHON` — Python exe path (default `C:\Windows\py.exe`).
- `PETTA_PATH` — repo root for PeTTa import (default `webapp/..`).
- `OMEGACLAW_SYNTHETIC_CONVERSIONS=1` — fabricate `actions[]` arrays for offline dev (planned; see plan.md Phase A).

## Open questions (from plan.md)

Q1 typo tolerance on AI-rendered text · Q2 brand asset bundle · Q3 no-winner fallback · Q4 per-ad cost cap · Q5 multi-round variation · Q6 real-vs-synthetic Meta data for the POC demo. Don't assume — ask if the work touches one of these.
