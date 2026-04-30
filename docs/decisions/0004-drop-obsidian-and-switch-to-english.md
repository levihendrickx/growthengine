# 0004 — Drop Obsidian, switch repo language to English

**Date:** 2026-04-30
**Status:** Accepted
**Decided by:** Robbin
**Supersedes (in part):** [ADR 0001](0001-docs-folder-as-obsidian-vault.md) — the Obsidian-vault aspect

## Context

Two changes to how we work in the repo:

1. **Obsidian.** [ADR 0001](0001-docs-folder-as-obsidian-vault.md) made `docs/` double as an Obsidian vault. In practice we have ~5 notes total; Obsidian's value (backlinks, graph view) starts paying off around 50+ interlinked notes. Plus its `[[wiki-link]]` syntax doesn't render on GitHub, so PR-reviewers see raw text. Net: extra tool with no current benefit.
2. **Language.** Mubashir (developer, Pakistan) joined the repo as collaborator on 2026-04-29. With three contributors and English as the shared language, mixing Dutch and English in code, docs and commit messages creates friction.

## Decision

**1. Drop Obsidian as a working tool.** Notes and docs stay as plain Markdown in `docs/`, viewed on GitHub or in any text editor. The `docs/.obsidian/` gitignore line stays — anyone who *wants* to point Obsidian at the folder for personal use can, but the repo no longer assumes it.

**2. Switch the repo to English.** All of the following are English from now on:
- File contents in `docs/`, `scripts/`, `webapp/`, root markdown
- Commit messages
- PR titles and bodies
- Code comments, docstrings, variable names
- ADRs

Existing Dutch content gets translated as part of this ADR's rollout.

## Why

**Obsidian:**
- Cost > benefit at our current scale.
- Removing a tool removes a thing to learn for new contributors.
- GitHub markdown rendering covers everything we actually use.

**English:**
- Mubashir can read and contribute everywhere without translation.
- Future contributors (interns, freelancers) have a lower barrier.
- Aligns with the rest of the tech ecosystem we depend on (Hyperon, MeTTa docs, OpenAI/Gemini API, Meta API, Shopify API — all English).

## Consequences

- ADR 0001 is marked "Partially superseded" — its `docs/`-in-the-repo decision still stands.
- README files, ADRs and notes get a one-time translation pass.
- New rule in `docs/README.md`: write in English.
- Commit messages: short, imperative present tense, English ("Add X", not "I added X" or "Voeg X toe").
- PR template (informal for now): English title + 2-5 sentence body in English.
