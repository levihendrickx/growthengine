# Sample atoms — fixture data voor backend-development

Dit zijn **echte performance-atoms** uit Stoney's Meta ad-account, gegenereerd door
`scripts/import_meta_api.py` op 2026-04-30. Bedoeld als snapshot waar Mubashir en de
backend tegen kunnen ontwikkelen zonder Meta-credentials nodig te hebben.

## Inhoud

- `performance/<ad_id>.json` — 100 ad-performance atoms (90 dagen historie)

## Schema (per atom)

Velden zoals geleverd door de Meta Insights API, level=`ad`:

```
ad_id, ad_name, campaign_id, campaign_name, adset_id, adset_name,
impressions, clicks, ctr, cpc, cpm,
spend, reach, frequency,
date_start, date_stop
```

Numerieke velden (`impressions`, `clicks`, `ctr`, `cpc`, `cpm`, `spend`, `reach`,
`frequency`) zijn als `float` opgeslagen; de rest als string.

## Belangrijk

- **Niet refreshable.** Dit is een snapshot. De live-pipeline (productie-runtime) komt
  later — zie ADR 0004 (nog te schrijven, samen met Mubashir).
- **Niet gegenereerd door tests.** Niet gebruiken als test-fixtures voor unit-tests die
  exacte waardes asserten — getallen verouderen en wijzigen niet mee.
- **Niet productiedata.** Gebruik dit alleen voor lokaal ontwikkelen. De echte pipeline
  schrijft naar `atoms/` (gitignored).
