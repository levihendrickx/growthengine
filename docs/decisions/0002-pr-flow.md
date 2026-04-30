# 0002 — Pull Request flow for features

**Date:** 2026-04-28
**Status:** Accepted
**Decided by:** Robbin, Levi

## Context

Until now Robbin and Levi both push directly to `main`. That works as long as we touch different files, but breaks the moment we overwrite each other's changes or hit conflicts. As complexity grows (imports, MeTTa, frontend) that risk grows with it.

## Decision

From now on we work with **feature branches and Pull Requests** for anything bigger than a few lines.

**Concrete workflow:**

```
git checkout -b feature/<short-name>     # new branch
... work, commit ...
git push -u origin feature/<short-name>  # to GitHub
gh pr create                             # open a PR for the other person
```

The other person reviews, gives feedback, and if it's good they merge the PR via GitHub. After that, locally:

```
git checkout main
git pull
git branch -d feature/<short-name>       # clean up the branch locally
```

**What may go directly on main:**
- Typos, small documentation tweaks (≤5 lines in 1 file)
- ADRs and notes in `docs/`

**What may not:**
- Code in `webapp/`, `scripts/`, or new top-level folders
- Anything you still have doubts about yourself

## Why

- **Protection:** main always stays in working state. A half-done refactor lives on a branch, not on main.
- **Review moments:** Levi sees what Robbin builds before it lands on main (and vice versa). Catches mistakes early.
- **Freedom to experiment:** Robbin can push half-finished work to his branch without worrying — nobody else runs that branch.
- **History stays readable:** every feature corresponds to one PR with one conversation.

## Consequences

- Branch naming convention: `feature/<short-description>` (e.g. `feature/meta-api-import`). For bug fixes: `fix/<short-description>`.
- PR title = what the PR does (imperative, short). PR body = what & why in 2-5 sentences.
- `main` stays technically unprotected in GitHub settings for now — discipline solves it. If something does go wrong, Levi can flip on "branch protection" later in repo settings.
- Robbin needs to get used to `git checkout -b ...` and `gh pr create`. First time we do it together.
