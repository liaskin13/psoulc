#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-src}"

SEARCH_TOOL=""
if command -v rg >/dev/null 2>&1; then
  SEARCH_TOOL="rg"
elif command -v grep >/dev/null 2>&1; then
  SEARCH_TOOL="grep"
else
  echo "Design-law check requires rg or grep."
  exit 2
fi

# 1) Comfortaa quarantine: only allowed in four locked locations.
allowed_paths=(
  "src/entry/DPWallpaper.jsx"
  "src/components/RecordShelf.css"
  "src/styles/identity.css"
  "src/App.css"
)

if [[ "$SEARCH_TOOL" == "rg" ]]; then
  mapfile -t comfortaa_lines < <(rg -n "Comfortaa|comfortaa" "$ROOT" || true)
else
  mapfile -t comfortaa_lines < <(grep -RsnE "Comfortaa|comfortaa" "$ROOT" --exclude-dir=node_modules --exclude-dir=dist || true)
fi
if [[ ${#comfortaa_lines[@]} -gt 0 ]]; then
  bad=()
  for line in "${comfortaa_lines[@]}"; do
    path="${line%%:*}"
    ok=false
    for allowed in "${allowed_paths[@]}"; do
      if [[ "$path" == "$allowed" ]]; then
        ok=true
        break
      fi
    done
    if [[ "$ok" == "false" ]]; then
      bad+=("$line")
    fi
  done

  if [[ ${#bad[@]} -gt 0 ]]; then
    echo "Design-law check failed: Comfortaa used outside whitelist."
    printf '%s\n' "${bad[@]}"
    exit 1
  fi
fi

# 2) Deprecated font families must not appear in source.
if [[ "$SEARCH_TOOL" == "rg" ]]; then
  rg -n "Cormorant|Geist" "$ROOT" >/tmp/psc_design_font_failures.txt 2>/dev/null || true
else
  grep -RsnE "Cormorant|Geist" "$ROOT" --exclude-dir=node_modules --exclude-dir=dist >/tmp/psc_design_font_failures.txt 2>/dev/null || true
fi

if [[ -s /tmp/psc_design_font_failures.txt ]]; then
  echo "Design-law check failed: deprecated font reference found (Cormorant/Geist)."
  cat /tmp/psc_design_font_failures.txt
  exit 1
fi

echo "Design-law check passed."
