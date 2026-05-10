# NEXT SESSION — Start Here

## First Commands

1. `git -C /workspaces/psoulc pull --ff-only`
2. `git -C /workspaces/psoulc status -sb`
3. `npm --prefix /workspaces/psoulc run build` (only if touching runtime code)

## Current Baseline

- Branch: main
- Clean: yes
- Latest commit on origin/main: b3890d5

## Immediate Priorities

- Confirm active UI still honors the no-space-language direction in live surfaces.
- Keep UploadModal SATURN/VENUS behavior untouched unless explicitly requested.
- Stage by exact path only; do not use `git add -A`.

## Guardrails

- Always read tasks/lessons.md and tasks/todo.md before new implementation work.
- If a build is run, restore dist before commit review.
- One concern per commit.
