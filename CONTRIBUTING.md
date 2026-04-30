# Contributing to Growth Engine

Short version: read [ADR 0002](docs/decisions/0002-pr-flow.md) (PR flow) and [ADR 0004](docs/decisions/0004-drop-obsidian-and-switch-to-english.md) (language). Then work via feature branches, in English.

## Language: English everywhere

All of the following must be in English:

- File contents in `docs/`, `scripts/`, `webapp/`, root markdown
- Code comments, docstrings, variable names, log lines, error messages
- Commit messages
- PR titles and bodies
- ADRs and notes

A GitHub Action (`.github/workflows/language-check.yml`) runs on every PR and flags Dutch content. If it complains, translate the flagged lines and push again.

If you spot existing Dutch content somewhere we missed, just open a small PR fixing it.

## Branch flow ([ADR 0002](docs/decisions/0002-pr-flow.md))

```
git checkout main
git pull
git checkout -b feature/<short-name>
# ... work, commit ...
git push -u origin feature/<short-name>
gh pr create
```

Branch naming:
- `feature/<short-description>` for new features
- `fix/<short-description>` for bug fixes

## Commit messages

- English, imperative present tense ("Add X", not "Added X" or "Adds X")
- Short subject line (≤72 chars), then a blank line and a body if needed
- Body explains the *why*, not the *what* — the diff already shows what

## What may go directly on `main`

- Typos, small documentation tweaks (≤5 lines in 1 file)
- ADRs and notes in `docs/` if they're self-contained

Anything bigger goes via PR.

## Secrets

- Never commit `.env` files, API keys, tokens, or anything resembling credentials
- Use `.env.example` for documentation of expected variables, with empty values
- If you accidentally commit a secret: rotate it immediately, then ask in chat for help cleaning up the history
