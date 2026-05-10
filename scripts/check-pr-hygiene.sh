#!/usr/bin/env bash
set -euo pipefail

BASE_REF="${1:-origin/main}"

if ! git rev-parse --verify "$BASE_REF" >/dev/null 2>&1; then
  echo "Base ref '$BASE_REF' not found locally."
  echo "Try: git fetch origin main"
  exit 2
fi

# Only flag additions/modifications — deletions of generated files are intentional cleanup.
# dist/index.html is manually maintained (font links, meta tags) — allowed.
# dist/assets/ contains hashed build chunks — never commit these.
CHANGED_FILES="$(git diff --name-only --diff-filter=AM "$BASE_REF"...HEAD || true)"
if [[ -z "$CHANGED_FILES" ]]; then
  echo "No changed files detected against $BASE_REF."
  exit 0
fi

BAD_FILES="$(printf '%s\n' "$CHANGED_FILES" | grep -E '^(\.venv/|dist/assets/|node_modules/)' || true)"

if [[ -n "$BAD_FILES" ]]; then
  echo "PR hygiene check failed. Generated paths added/modified against $BASE_REF:"
  printf '%s\n' "$BAD_FILES"
  echo ""
  echo "Remove generated-file diffs before merge."
  echo "Never commit: .venv/, dist/assets/, node_modules/"
  exit 1
fi

echo "PR hygiene check passed. No generated-path diffs detected against $BASE_REF."
