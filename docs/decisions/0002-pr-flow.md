# 0002 — Pull Request flow voor features

**Datum:** 2026-04-28
**Status:** Akkoord
**Beslissers:** Robbin, Levi

## Context

Tot nu toe pushen Robbin en Levi beiden direct naar `main`. Dat werkt zolang we aan andere bestanden werken, maar gaat fout zodra we elkaars wijzigingen overschrijven of conflicten krijgen. Met groeiende complexiteit (imports, MeTTa, frontend) wordt dit risico groter.

## Beslissing

Vanaf nu werken we met **feature branches en Pull Requests** voor alles wat groter is dan een paar regels.

**Concrete werkstroom:**

```
git checkout -b feature/<korte-naam>     # nieuwe branch
... werken, committen ...
git push -u origin feature/<korte-naam>  # naar GitHub
gh pr create                             # PR aan de andere openen
```

De andere reviewt, geeft feedback, en als het oké is mergt diegene de PR via GitHub. Daarna lokaal:

```
git checkout main
git pull
git branch -d feature/<korte-naam>       # branch lokaal opruimen
```

**Wat mag wél direct op main:**
- Tikfouten, kleine documentatie-tweaks (≤5 regels in 1 bestand)
- ADRs en notities in `docs/`

**Wat niet:**
- Code in `webapp/`, `scripts/`, of nieuwe top-level mappen
- Iets dat je zelf nog twijfels over hebt

## Waarom

- **Bescherming:** main blijft altijd in werkende staat. Een halve refactor leeft op een branch, niet op main.
- **Reviewmomenten:** Levi ziet wat Robbin maakt voordat het in main staat (en andersom). Catches fouten vroeg.
- **Vrijheid om te experimenteren:** Robbin kan halverwege spullen pushen op zijn branch zonder zorgen — niemand draait op die branch.
- **Geschiedenis is leesbaar:** elke feature hoort bij één PR met één conversatie.

## Gevolgen

- Branchnaam-conventie: `feature/<korte-omschrijving>` (bv. `feature/meta-api-import`). Voor bug-fixes: `fix/<korte-omschrijving>`.
- PR-titel = wat de PR doet (gebiedende wijs, kort). PR-beschrijving = wat & waarom in 2-5 zinnen.
- `main` blijft technisch onbeschermd in GitHub-instellingen voor nu — discipline lost het op. Als het toch fout gaat, kan Levi later "branch protection" aanzetten in repo settings.
- Robbin moet wennen aan `git checkout -b ...` en `gh pr create`. Eerste keer doen we samen.
