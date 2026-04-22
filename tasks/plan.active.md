# Active Plan — Phase 9 (0528 → D Console)

## NEXT SESSION HANDOFF — Copy/paste this to start fresh

```
PSC — Pleasant Soul Collective. React 19 / Vite / Three.js / Framer Motion.
Repo: /workspaces/psoulc | Branch: codespace-glowing-garbanzo-7vg56g665w4v3v77

## What shipped last session (April 17, 2026)

✓ SolarFlare: white strobe → honey amber glow (entry bridge)
✓ AstralFlyby: t^2.5 velocity curve + star-streak at 60% + corona burst at 85% + white-out → D console
✓ animationsEnabled toggle in SystemContext (persisted localStorage)
✓ Flyby login counter in App.jsx — auto-skips after 3 logins or if animations off
✓ AnalogConsole: ANIM ON/OFF toggle button wired
✓ Vault exit routing: D→console, L→architect, others→gallery-drift
✓ RecordShelf.css: full purge of dead .spine-* → deep wood cubby wall
  - Dark cell interior (#0d0804 + heavy inset shadows = 3D recess)
  - Amber radial overhead lighting on wall (center-bright, corner-dark vignette)
  - Wood lattice dividers via ::before pseudo-element
  - Studio vignette via ::after overlay
✓ App.css .file-cell: dark recess + amber-warm text + chakra glow on active
✓ App.css: purged old dead .record-shelf pine-shelf block + .shelf-floor
✓ Build: clean (1.98s)

## Console inspiration locked (D console redesign next)
- Image 1: Neve/SSL large-format console — warm red/amber LED rows, wood surround, fader banks,
  dual studio monitors + centered screen. This is the warmth + hardware density reference.
- Image 2: AKAI MPC Live II on walnut cradle — 4x4 dark pad grid, touchscreen, encoders.
  This is the pad-grid + encoder language for the vault/cell interaction zone.
- Image 3: D’s travel rig — AKAI MPC (left), MacBook + Serato/rekordbox (center),
  Roland (right, colorful pads). Real workflow = two hardware controllers + software center.
  D’s console should feel like this desk — two zones flanking a central screen.

## Open — complete Phase 9 in this order

N1. Browser verify — npm run dev, open Saturn/Venus/Earth vaults, confirm cubby wall renders
N2. D7 — Collaborator object schema + ingestion + grants (src/data/collaborators.js + SystemContext)
N3. Amethyst vault — replace bowl rings + session rows with file-cell cubby wall
N4. Saturn moons — each moon needs its own vault interior with file-cell wall
N5. Venus upload — ID3 metadata auto-read → pre-fill title/artist/BPM in UploadModal
N6. REC voice comments — MediaRecorder → audio blob per cell, stored in comment thread
N7. D console layout pass — Neve fader row language + AKAI pad grid zone + encoder bank
    (Use D’s studio images as reference, locked above)
N8. Pull Cord enforcement — grayscale drain + Tier B/C/D/G actual severance (currently visual only)
N9. Push to feature branch phase-9 for checkpoint before merging main

## Key files
- Entry: src/entry/EntrySequence.jsx, SolarFlare.jsx
- Flyby: src/three/AstralFlyby.jsx
- D console: src/console/AnalogConsole.jsx
- Vault wall: src/components/RecordShelf.jsx + RecordShelf.css
- File cell styles: src/App.css (— FILE CELL section)
- State: src/state/SystemContext.jsx
- Design canon: skills/psc-system/SKILL.md (load for any UI work)
- Decisions: tasks/plan.decisions.md
- Lessons: tasks/lessons.md
```

Source of truth: /home/codespace/.claude/plans/gleaming-sprouting-dragon.md

## Objective

Continue the D-series UI track from code input 0528 through NASA first-seen animation to final D console design language.

## Steps

- [x] Step 1: NASA-style first-seen astral entry baseline
- [x] Step 1a: Library wall visual mock direction established (wood-grid file wall)
- [x] D1: Hardware readout + encoder nav replaces map-first control
- [x] D2: Enforce 30/70 top-window + file-wall layout across vaults
- [x] D3: Top edit window behavior (live orbit + cancel void)
- [x] D4: File-cell wall functional wiring (selection/readout sync)
- [x] D5: Player controls package + admin commands
- [x] D6: Soul-chakra ownership language pass
- [x] D7: Collaborator object system pass (deferred — entry sequence prioritized first)

## Put In Stone — Immediate Next Execution

### D7 Definition (Collaborator Object System)

- [ ] D7.1: Introduce unified collaborator object schema (member/listener/artist role, scopes, status, command grants)
- [ ] D7.2: Normalize collaborator ingestion paths (request modal, inbox approvals, manual add member)
- [ ] D7.3: Attach collaborator object to vault file ownership/comment events for auditability
- [ ] D7.4: Enforce collaborator command grants at runtime in D/L consoles and vault command rows
- [ ] D7.5: Add migration shim for existing localStorage records to new collaborator shape

### Console Controls Program (All Controls For All Things)

- [ ] C1: Build unified command bus in SystemContext (explore/tune/void/seal/exit/broadcast/restore)
- [ ] C2: Add command-state engine (idle/armed/confirming/executing/success/failure/timeout)
- [ ] C3: Add single source control matrix (who can do what, where, and in what state)
- [ ] C4: Add safety interlocks (double-confirm + auto-cancel timeout) for destructive commands
- [ ] C5: Add command telemetry rail (actor/target/action/time/result) visible in both D and L consoles
- [ ] C6: Standardize command language globally to one verb set (SEAL VAULT, EXIT SYSTEM, ARM, COMMIT, CANCEL)
- [ ] C7: Add keyboard command palette fallback for high-density control operation

## Backlog (Do Not Drop)

- [ ] Messaging capability to complement comments: direct thread(s), console inbox/outbox, unread state, and planet-scoped channels
- [ ] VOICE COMMENTS (REC button): recorded voice note capture per file — arms recording on selected cell, STOP commits — store as audio blob in comment thread (never been done in this space)
- [ ] Amethyst vault NEEDS shelf-based file cell wall (currently uses bowl rings + session rows, no RecordShelf)
- [ ] Saturn MOONS need shelf-based vaults (each moon is currently a spine in Saturn's wall without its own vault screen)

## Acceptance

- 0528 path opens with intended first-seen NASA sequence
- D console uses hardware readout + encoder control language
- Vault wall is functional file-cell grid, not record-spine metaphor
- Player controls are implemented per selected option set
