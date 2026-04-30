# Growth Engine — Docs

Product documentation, decisions and notes.

## Key documents

- [`architecture.md`](architecture.md) — system architecture, 13 layers, ownership. **Start here.**
- [`assets/growth_engine_architecture.html`](assets/growth_engine_architecture.html) — visual diagram (open locally in browser)
- [`decisions/`](decisions) — Architectural Decision Records (ADRs)

## Structure

| Folder | Contents |
|---|---|
| `notes/` | Loose notes, journals, ideas. Filename: `YYYY-MM-DD-topic.md`. |
| `decisions/` | ADRs. Short decision records: *what we decided and why*. Numbered `0001-…`, `0002-…`. |
| `assets/` | Non-text resources: diagrams, mockups, images. |
| `specs/` | Product specs and feature designs (to be added later). |
| `meetings/` | Notes from syncs with Levi and others (to be added later). |

## Conventions

- Write in **Markdown** (`.md`). GitHub renders this nicely and it's readable in any editor.
- Use standard markdown links: `[label](path/to/file.md)`. No wiki-link syntax (`[[...]]`) — that doesn't render on GitHub.
- One topic per file.
- Changes follow the PR flow ([ADR 0002](decisions/0002-pr-flow.md)) for anything bigger than a few lines.
- **Language: English.** Both code, docs and commit messages — Mubashir is on the team and English is our shared language.
