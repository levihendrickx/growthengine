# Growth Engine — architectuur

**Versie:** v0.1 (POC)
**Datum:** 2026-04-30
**Status:** Levend document — wijzigingen via PR

> **Visueel diagram:** [`assets/growth_engine_architecture.html`](assets/growth_engine_architecture.html)
> Open lokaal in browser voor de gekleurde, geanimeerde laag-voor-laag weergave.

## Overzicht

Growth Engine bestaat uit 13 lagen, gegroepeerd in drie fases:

1. **Input → Atomspace** (laag 1-5) — bronnen, verwerking, vision-LLM op input-ads, merge, ingest
2. **Reasoning** (laag 6-8) — MeTTa/PLN redeneert continu, agent praat met user, PLN levert ad-specs
3. **Generation + verificatie** (laag 9-13) — prompts, image-gen, twee verificatieloops, output + feedbackloop

## Eigenaarschap (per 2026-04-30)

| Lagen | Onderwerp | Eigenaar |
|---|---|---|
| 1-2 | Bronnen + verwerking per bron | **Robbin** (API's) |
| 3 | Vision-LLM op input-ads | nog te bepalen — zie open vraag onderaan |
| 4-5 | Merge + Atomspace ingest | **Mubashir** (backend) |
| 6 | MeTTa / PLN | **Mubashir** |
| 7 | Agent-laag | nog te bepalen |
| 8-13 | Ad-spec query → output | **Mubashir** + LLM-orchestratie |

## Lagen in detail

### 01 — Bronnen
Vijf input-bronnen voeden het systeem:

- **Meta CSV** (Levi's bestaand `parse_meta_csv.py`): ad-id, creative-id, CTR, CPC, ROAS, spend, impressions, campaign, adset
- **Meta API**: creative-id → image-url, headline, body, CTA. Inclusief downloaden van `.jpg` lokaal
- **Shopify API**: orders per product, `utm_ad` per order, revenue, AOV, conversion-rate, return-rate, datum
- **Weer + kalender**: Open-Meteo (gratis), Nager.Date feestdagen (historisch + live)
- **Branding-input** (eenmalig, statisch): Shopify-scrape **of** brandboek-upload — kleuren, fonts, tone, logo, producten, prijsrange

### 02 — Verwerking per bron
Eén Python-script per bron, geen gedeelde base-class (per [ADR 0003](decisions/0003-import-architectuur.md)):

- `parse_meta_csv.py` — CSV → gestructureerde data per ad-id
- `download_meta_creative.py` — image-url → `images/<ad_id>.jpg` (carousels: `<ad_id>_1.jpg` etc.)
- `import_shopify.py` — utm-ad, product-id, revenue, AOV
- `build_day_atom.py` — datum als sleutel, seizoen, dag-van-de-week, weer, feestdag (één atom per dag, gedeeld)
- `parse_branding.py` — scrape of PDF → atoms via LLM

### 03 — Vision-LLM (input-ads)
Elke input ad-afbeelding wordt eenmalig naar een vision-LLM gestuurd (GPT-4o Vision of Claude Sonnet) voor een **feitelijke beschrijving** — geen interpretatie, geen hooks, geen oordeel. Bij onduidelijke details: `"niet zichtbaar"` in plaats van raden. Output gaat in het creative-atom.

### 04 — Merge
Eén Python-script voegt alle bronnen samen tot één record per ad. Drie sleutels:

- `ad_id` — koppelt Meta CSV aan afbeelding en performance
- `utm_ad` — koppelt Meta-ad aan Shopify-orders
- `datum` — koppelt elke ad aan dag-atom voor temporele context

### 05 — Atomspace (Hyperon / MeTTa)
Vijf atom-types:

| Atom | Per | Inhoud |
|---|---|---|
| **Creative** | ad | ad-id, beschrijving (vision-LLM), headline, body, CTA, image-ref, datum |
| **Performance** | ad | ad-id, CTR, CPC, ROAS, spend, impressions, campaign, adset, datum |
| **Commerce** | ad → Shopify | ad-id, utm-ad, orders, revenue, conv-rate, AOV, product-id, datum |
| **Day** | datum (gedeeld) | datum, seizoen, weer, temperatuur, feestdag, dag-van-de-week |
| **Brand** | eenmalig, statisch | kleuren, fonts, tone, logo-ref, producten, prijsrange, doelgroep |

**Koppelingen:** `creative ↔ performance` via `ad_id` · `performance ↔ commerce` via `ad_id + utm_ad` · `alle atoms ↔ day` via `datum` · `commerce ↔ product` via `product_id`. Brand-atom staat **buiten PLN-analyse** — wordt pas actief bij output.

### 06 — MeTTa / PLN (redenering)
Hyperon's probabilistische logica redeneert continu over alle atoms. Detecteert patronen, berekent confidence-scores, signaleert kansen, leert van elke campagnecyclus.

Voorbeeldpatronen die PLN detecteert:
- `"lifestyle + weekend + winter"` → ROAS 3.8 · conf 0.79 · n=14
- `"urgency + feestdag -3 dagen"` → CTR hoog maar conv laag · conf 0.71
- `"Valentijn dag -10 starten"` → 40% hogere ROAS dan dag -3 · conf 0.84

### 07 — Agent (interface PLN ↔ user)
Twee modi:

- **Proactief** — PLN signaleert kans, agent stuurt notificatie (push/email/in-app) inclusief reden + confidence
- **Reactief** — user vraagt iets ("Genereer 10 ads voor zilveren armband"), agent antwoordt + suggereert relevante variaties

### 08 — PLN ad-specificaties
PLN doorzoekt Atomspace bij user-verzoek, sorteert op confidence. Mengsel van bewezen winners en onderbelichte variaties:

- Ads 1-4: bewezen combinaties (conf > 0.80)
- Ads 5-7: sterke variaties (conf 0.65-0.79)
- Ads 8-10: onderbelicht potentieel (conf 0.50-0.64)

Per spec: visual-style, setting, hook-type, emotional-angle, product-focus, dag/seizoen-context, brand kleuren/tone, image-ref, confidence, basis-atoms (traceerbaar).

### 09 — LLM prompt-generatie
LLM krijgt PLN-spec en zet die om naar een image-prompt + ad-copy. **Geen creatieve beslissingen** — die zijn al gemaakt. LLM vult alleen taal in.

### 10 — Verificatieloop 1 (prompt-check)
Geautomatiseerde check: volgt prompt de spec? Brand-kleuren correct? Geen toegevoegde elementen? Geen hallucinaties in copy? Variaties uniek en binnen PLN-kaders? Bij fout: max 2 retries, daarna flag voor user.

### 11 — Image generator
Goedgekeurde prompts + image-ref (stijl-referentie) → image-generator (DALL·E 3 / Midjourney API / Imagen). Output: 10 afbeeldingen.

### 12 — Verificatieloop 2 (afbeelding-check)
Vision-LLM scant gegenereerde afbeelding, PLN vergelijkt met spec. Alle vereiste elementen aanwezig? Stijl matched image-ref? Brand-kleuren correct? Bij afwijking: prompt aangescherpt en retry.

### 13 — Output
Vier outputs per gegenereerde ad:
- **Ad-copy** (headline, body, CTA, on-brand)
- **Afbeelding** (geverifieerd, in Meta-formaat)
- **Timing-advies** (startdag, looptijd, budget, doelgroep, verwachte ROAS)
- **Traceerbaarheid** (welke atoms eronder liggen, confidence per ad, verificatie-logs)

**Feedbackloop:** na elke campagnecyclus stromen nieuwe Meta-resultaten en Shopify-conversies terug als nieuwe atoms. Patronen worden scherper, confidence-scores groeien.

## Open vragen (te bespreken)

1. **Vision-LLM op input-ads (laag 3) — wie?** Technisch een input-stap, maar al LLM-werk. Robbin of Mubashir?
2. **Agent-laag (laag 7) — wie?** Notificatie-engine + chat-interface raakt zowel backend (PLN-trigger) als frontend.
3. **Wat ADR 0003 mist:** dit diagram voegt Weer/Kalender, Branding én Vision-LLM toe als bronnen. Update ADR 0003 of schrijf ADR 0004 met de uitgebreide scope.
4. **Live-pipeline (Robbin → Mubashir handover):** waar landen atoms zodat Mubashir ze kan ingesten? Bucket / DB / API. Dit is de hardste contract-grens. ADR 0004 (data-runtime) zou hier over gaan.

## Geschiedenis

- **2026-04-30** — eerste versie, op basis van Levi's HTML-mockup van dezelfde datum
