# 0001 — `docs/` folder in the repo

**Date:** 2026-04-28
**Status:** Partially superseded by [ADR 0004](0004-drop-obsidian-and-switch-to-english.md) (2026-04-30) — the *Obsidian-vault* part is dropped, the *`docs/` in the repo* part still stands.
**Decided by:** Robbin

## Context

The Growth Engine team (Robbin + Levi) needs a place for product notes, decisions, specs and meeting notes. Three options were on the table:

- A. Separate folder outside the repo
- B. OneDrive-vault, only for Robbin
- C. **`docs/` folder inside the growthengine repo**

## Decision

Option C: notes live as Markdown files in `docs/` inside the repo. Initially that folder doubled as an Obsidian vault — that part has been dropped (see ADR 0004).

## Why

- **Single source of truth.** Code and context live in the same repo. When reading a function you can find the matching decision note next to it.
- **Versioned.** Decisions are still findable 6 months from now, including context (commit message, date, author). Crucial during the POC phase.
- **Shared with Levi.** He sees decisions the moment they are made, not in some meeting later.
- **Markdown is cheap.** Works in GitHub, VS Code, and any other text editor. No lock-in.

## Consequences

- Personal scribbles (without context for the team) do *not* belong here — those can live elsewhere, e.g. in a separate OneDrive folder.
- For larger scale, specs and meeting notes can later move to their own subfolders.
