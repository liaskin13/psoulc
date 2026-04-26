# Active Plan — Phase 9 Design System Migration

## NEXT SESSION — START HERE, READ THIS FIRST

```
PSC — Pleasant Soul Collective. React + Vite + Framer Motion.
Repo: /workspaces/psoulc | Branch: phase-9

READ DESIGN.md BEFORE TOUCHING ANY CSS OR JSX.
That file is law. Every settled decision lives there.
```

---

## What is this project

A cinematic, private music platform for D (primary) and L (co-architect). Not public.
Not a streaming platform. A sovereign instrument for independent artists.

D's world = warm amber (#ffb347), cream text, warm brown-black surfaces.
L's world = cyan (#00e5ff), cold near-black surfaces.
Pre-auth entry = black on black. No identity color until after login.

---

## What shipped this session (2026-04-25/26)

### Design system migrated from preview → actual app
- `index.html` — Chakra Petch loaded (all weights). Comfortaa 700 only (logo). Space Mono kept.
- `src/variables.css` — new canonical tokens (`--void`, `--surface`, `--border`, `--identity`, etc.)
  Old names (`--void-black`, `--studer-copper`) aliased for backward compat.
  D's theme block (`[data-theme="d-soul"]`) and L's theme block (`[data-theme="l-architect"]`) added.
- `src/App.css` — global font reset → Chakra Petch. Entry screen fully redesigned (see below).
- `src/index.css` — dead Cormorant Garant import removed.
- `src/App.jsx` — applies `data-theme` on `<body>` when user authenticates.
- `src/entry/EntrySequence.jsx` — DPWallpaper canvas wired in. Redundant aperture-seal dp text removed.
- `DESIGN.md` — comprehensive rewrite. This is the canonical design document.
- `CLAUDE.md` — DESIGN.md added to session start checklist.

### Entry screen design (settled, do not revisit)
- Full-screen DPWallpaper canvas (half-drop dp tessellation, Comfortaa 700 in canvas)
- `.entry-aperture` background: transparent — canvas provides the background
- No center line, no copper, no amber on entry — BLACK ON BLACK until auth
- Gate panels: solid `--void` background, no border between upper/lower
- Aperture lines: `display: none` — removed
- All entry colors: near-white rgba only (0.07–0.22 opacity)
- After auth: `data-theme` applied to body → identity color floods everything

### Design preview (psc-design-preview.html)
The 4700+ line preview HTML is the visual reference. Also updated this session:
- A+ polish: orphan track row fix, watermark visibility, muse card legibility
- Vault dp wallpaper (::before pseudo-element at 2.2% white opacity)
- MUSES CTA opacity raised, genre/count text legibility

---

## Comfortaa quarantine (settled, do not revisit)

Comfortaa appears in EXACTLY these 4 places. Nowhere else, ever:
1. `DPWallpaper.jsx` canvas (the wallpaper itself)
2. `.file-cell-dp-mark` in RecordShelf.css (dp mark on record cells)
3. `.psc-seal` in styles/identity.css (logo spec)
4. `.aperture-code-cell.aperture-cell-active::after` (dp cursor blink on active cell)

Everything else: Chakra Petch.

---

## What still needs work

### High priority
- The console components (AnalogConsole, ArchitectConsole, MembersPanel, etc.) have not been
  individually audited for stale Comfortaa inline styles or old variable name usage. The global
  CSS reset (`*, *::before, *::after { font-family: 'Chakra Petch' }`) fixes most of it
  automatically, but inline `style={}` props with explicit font names would override it.
  Run: `grep -rn "Comfortaa\|font-family.*Comfort" src/ --include="*.jsx"` to find them.

- The `tasks/todo.md` is very out of date (references old phase structure and old variable names).
  It needs a full rewrite to reflect current state.

### Pending from before this session (ENG backlog from April 22)
These were the next planned items before the design session began:
- ENG-1: Remove arch-viewscreen-zone from ArchitectConsole.jsx
- ENG-3: ROSTER — dense phosphor text table (replace member cards)
- ENG-4: CMD MATRIX — interactive permission grid
- ENG-5: Extend dispatchCommand — handler map + auth + commandLog
- C1–C7 deferred to Phase 10

### devex-review
We attempted /devex-review and aborted when it exposed that the app wasn't ready.
Now that the design system is migrated, this can be run properly.
Start the dev server (`npm run dev`) at localhost:5173 before running it.

---

## Key files

| File | Purpose |
|------|---------|
| `DESIGN.md` | **Design law. Read before any visual work.** |
| `src/variables.css` | All CSS tokens. Source of truth for colors and fonts. |
| `src/App.css` | Component styles. Global font reset at top. |
| `src/entry/EntrySequence.jsx` | Entry screen. DPWallpaper wired here. |
| `src/entry/DPWallpaper.jsx` | Canvas wallpaper component. Do not change font — Comfortaa in canvas is intentional. |
| `src/App.jsx` | Theme application (data-theme on body after auth). |
| `src/state/SystemContext.jsx` | Global state, session management, command dispatch. |
| `src/console/AnalogConsole.jsx` | D's console. |
| `src/console/ArchitectConsole.jsx` | L's console. |
| `psc-design-preview.html` | Visual reference. 4700+ line single-file preview. Not the source of app CSS. |
| `tasks/plan.active.md` | **This file. Update it at end of every session.** |
| `tasks/todo.md` | Task list (needs rewrite). |
| `tasks/lessons.md` | Corrections log. Read at session start. |

---

## Locked design decisions (do not re-open without explicit user request)

- Font: Chakra Petch everywhere. Comfortaa logo-only.
- Entry: black on black. No color until auth.
- Border radius: 0px everywhere (pill toggles: 9999px only).
- Identity system: `--identity` / `--identity-dim` / `--identity-glow` via data-theme on body.
- D's amber: `#ffb347`. L's cyan: `#00e5ff`. These are locked.
- dp wallpaper: canvas-rendered. Entry screen only (not console). Vaults get CSS ::before at 2.2%.
- Space themes, Three.js flyby animations, pull cord visual, 30/70 split: ALL SCRAPPED. Do not bring back.
- Muse identity colors: LARRY `#7aaa5a`, JANET `#cc3399`, ERIKAH `#cc6633`, DRAKE `#c4a428`. Locked.

---

## How to update this file

At the end of every session, before the last commit:
1. Move completed items from "What still needs work" to a "What shipped" block with the date.
2. Add any new decisions to "Locked design decisions."
3. Update "What still needs work" with the real next steps.
4. Commit this file in the same commit as the work it describes.
