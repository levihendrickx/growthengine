# Growth Engine — Docs

Productdocumentatie, beslissingen en notities. Tegelijk ook de **Obsidian-vault** voor Robbin.

## Structuur

| Map | Wat hoort hier |
|---|---|
| `notes/` | Losse notities, dagboekjes, ideeën. Bestandsnaam `YYYY-MM-DD-onderwerp.md`. |
| `decisions/` | Architectural Decision Records (ADRs). Korte beslisnotities: *wat hebben we besloten en waarom*. Genummerd `0001-…`, `0002-…`. |
| `specs/` | Productspecs en uitgewerkte features (later toe te voegen). |
| `meetings/` | Verslagen van overleg met Levi en derden (later toe te voegen). |

## Werkwijze

- Schrijf in **Markdown** (`.md`). Werkt in Obsidian én is leesbaar op GitHub.
- Eén onderwerp per bestand.
- Wijzigingen volgen de normale Git-flow: `pull` → schrijven → `add` → `commit` → `push`.
- Persoonlijke krabbels die niet voor Levi bedoeld zijn → niet hier opslaan.

## Obsidian openen

1. Open Obsidian
2. **Open folder as vault** → wijs naar `growthengine/docs/`
3. Schrijven en linken werkt direct (`[[bestandsnaam]]`-syntax voor interne links)

Obsidian-instellingen worden lokaal bewaard in `.obsidian/` en zijn via `.gitignore` uitgesloten van de repo — iedereen kan z'n eigen voorkeuren hebben.
