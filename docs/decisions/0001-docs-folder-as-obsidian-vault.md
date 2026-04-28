# 0001 — `docs/` als Obsidian-vault in de repo

**Datum:** 2026-04-28
**Status:** Aanvaard
**Beslissers:** Robbin

## Context

Het Growth Engine team (Robbin + Levi) heeft een plek nodig voor productnotities, beslissingen, specs en overleggen. Drie opties stonden op tafel:

- A. Aparte map buiten de repo
- B. OneDrive-vault, alleen voor Robbin
- C. **`docs/` map in de growthengine repo**

## Beslissing

Optie C: notities leven als Markdown-bestanden in `docs/` binnen de repo. Diezelfde map is tegelijk een Obsidian-vault.

## Waarom

- **Eén bron van waarheid.** Code en context staan in dezelfde repo. Bij het lezen van een functie kun je de bijbehorende beslisnotitie ernaast vinden.
- **Versiebeheerd.** Beslissingen zijn over 6 maanden nog terug te zoeken inclusief context (commit message, datum, wie). Cruciaal nu de POC-fase loopt.
- **Gedeeld met Levi.** Hij ziet beslissingen op het moment dat ze gemaakt worden, niet pas in een vergadering.
- **Markdown is niet duur.** Werkt in Obsidian, GitHub, VS Code, en elk ander tekstprogramma. Geen lock-in.

## Gevolgen

- Persoonlijke krabbels (zonder context voor Levi) horen *niet* hier — die kunnen los, bv. in een aparte OneDrive-vault.
- `.obsidian/` (vault-instellingen) is via `.gitignore` uitgesloten — ieder z'n eigen voorkeuren.
- Bij grotere groei kunnen specs en meetings later naar eigen subfolders.
