# 0003 — Importarchitectuur (Meta API, Shopify, later TikTok / Google)

**Datum:** 2026-04-28
**Status:** Akkoord
**Beslissers:** Robbin, Levi

## Context

We willen ad-performance en commerce-data uit verschillende platforms importeren naar de Atomspace. Levi heeft al een eerste script (`parse_meta_csv.py`) dat een Meta CSV-export omzet naar atoms. Robbin gaat dit verder uitbouwen, te beginnen met de Meta Marketing API en Shopify.

Op termijn willen we ook TikTok, Google Ads en eventueel Pinterest / Snapchat. De architectuur moet die uitbreiding aankunnen zonder nu al alles te abstraheren.

## Beslissing

**Per-platform script in `scripts/`, gedeelde output naar `atoms/`, secrets in `.env`.**

### Mappenstructuur

```
scripts/
  parse_meta_csv.py        # bestaand (Levi)
  import_meta_api.py       # nieuw — Robbin, eerste PR
  import_shopify.py        # nieuw — Robbin, daarna
  import_tiktok.py         # later
  import_google_ads.py     # later
atoms/
  performance/<ad_id>.json   # ad-prestaties (CTR, CPC, ROAS, ...)
  creative/<ad_id>.json      # ad-content (image-URL, headline, body, CTA)
  commerce/<order_id>.json   # Shopify orders
  days/<YYYY-MM-DD>.json     # weer + feestdag + seizoen (later)
  brand/<brand_id>.json      # brand-profile (later, eenmalig)
.env                         # alle tokens en API keys (gitignored)
.env.example                 # commit-baar voorbeeld zonder echte waarden
```

### Conventies per script

- **Eén Python-bestand per bron**, geen gedeelde base-class voorlopig.
- **Idempotent**: hetzelfde script tweemaal draaien overschrijft dezelfde JSON-bestanden zonder schade.
- **Stdout = voortgang**, geen vereiste voor een logging-framework. Eén regel per geschreven atom.
- **Lees uit `.env`** via `python-dotenv`, nooit credentials hardcoded.
- **Pin de API-versie** in code (bv. Meta Graph API `v23.0`) — geen "latest".

### Niet doen (nog)

- Geen gedeelde `Importer`-base-class. Doen pas zodra er ≥3 imports werken en de overlap zichtbaar is.
- Geen async/concurrency tot Meta of Shopify dat afdwingt door rate limits.
- Geen database. JSON-files op disk volstaan voor de POC. Later eventueel SQLite of de echte Atomspace.

## Veiligheid Meta — productie-account beschermen

Stoney's Meta Business Manager is **productie**. Een fout mag NOOIT leiden tot een geblokkeerde account of beleidsovertreding. Daarom:

1. **Aparte Meta App** voor Growth Engine (in Developer-portal). Niet via een bestaande app.
2. **System User Token** in plaats van een persoonlijk User Token. System Users zijn aparte technische accounts in Business Manager — token kan ingetrokken worden zonder personen te raken.
3. **Alleen lees-scope:** `ads_read` (en `ads_management` alleen als read-only nodig is). Géén `pages_manage`, géén `business_management` met write-rechten.
4. **Pin API-versie** (`v23.0` op moment van schrijven). Voorkomt verrassingen bij Meta-updates.
5. **Conservatieve rate limits:** maximaal 200 requests per uur in deze fase. Implementeer een `time.sleep()` tussen requests of een retry-met-exponential-backoff bij `429 Too Many Requests`.
6. **Begin met kleine batches** (`--limit 10`) voordat je volledige histories trekt. Eerst werkt 't, dan opschalen.
7. **Geen "App Review"-aanvraag** zolang we alleen Stoney's eigen account aansluiten — Standard Access is voldoende. App Review komt pas wanneer derden zich gaan aansluiten (V1.5+).

## Veiligheid Shopify — eveneens productie

1. **Custom App** binnen Stoney's Shopify Admin. Niet via OAuth-flow (die is voor V1.5+ wanneer derden zich aansluiten).
2. **Read-only scopes:** `read_orders`, `read_products`, `read_customers` (laatste alleen indien nodig). Geen write-scopes.
3. **Token in `.env`**. Token is gekoppeld aan de winkel; bij verdacht gedrag direct intrekken in Shopify Admin.

## Gevolgen

- Robbin's eerste PR: `feature/meta-api-import` met alleen ad-**performance** (geen creative). Klein houdt PRs reviewbaar voor Levi.
- `.env.example` toevoegen aan repo zodat duidelijk is welke variabelen verwacht worden, zonder echte waarden.
- ADRs voor latere imports (TikTok, Google) verwijzen naar deze ADR voor de architectuur.
- Bij elke nieuwe import: korte sectie in het script-zelf (docstring) met de gebruikte API-versie, scopes en rate limits.
