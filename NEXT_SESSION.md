# NEXT SESSION — Start Here

## First Commands

1. `git -C /workspaces/psoulc pull --ff-only`
2. `git -C /workspaces/psoulc status -sb`
3. `git -C /workspaces/psoulc log --oneline -3`

## Current Baseline

- Branch: main
- Clean: yes
- Latest commit on origin/main: `bd3ed12` (`chore: stop tracking dist artifacts`)
- Deploy situation: Cloudflare Pages appears to be in Direct Upload mode (UI asks for drag-and-drop), so Git auto-deploy is not active.

## What Was Done This Session

- Confirmed Phase 1-6 source changes exist on `main`.
- Removed mistaken GitHub Pages workflow commit by deleting `.github/workflows/deploy-pages.yml`.
- Untracked `dist/` artifacts from git (`dist` remains ignored in `.gitignore`).
- Cleaned local formatting-only drift in `src/listener/ListenerShell.jsx`.

## Validation Checklist After Deploy

- Listener header shows: `LISTENING ROOM / CURATED BY D`.
- Console hotcues are single row of 8 with A/B/C/D bank selector.
- Console top rail and utility/list headers have stronger Phase 6 hierarchy styling.
- Vault header shows curated library metadata band.

## Guardrails

- Read `tasks/lessons.md` before implementation work.
- One concern per commit.
- Stage explicit paths only (`git add <path>` / `git rm <path>`), never `git add -A`.
