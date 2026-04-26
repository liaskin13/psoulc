# NEXT SESSION — START HERE. READ THIS BEFORE TOUCHING ANYTHING.

## THE RULE
Do not skip tasks. Do not jump ahead. Do not follow the user's excitement into a later task.
If the user says "I'm excited about task 7," say: "We get there after 2, 3, 4, 5, 6. Ready?"
The sequence is law. Lisa trusts the sequence. Honor it.

## CURRENT BRANCH
`phase-10`

## DO THESE IN ORDER. NO EXCEPTIONS.

- [ ] **P10-2** — Collaborator object system
  `src/data/collaborators.js` — schema: `name, vault, tier, grantedVaults[], lockboxGrants[]`
  Wire into SystemContext: `collaborators` state, `addCollaborator`, `canCollaboratorAccess`
  Note: Angi → vault `venus`, Jess B → vault `saturn`. No mars, no amethyst (deleted).

- [ ] **P10-6** — Lockbox access layer (depends on P10-2)
  Double-key check: lockbox requires `owner === 'D'` OR Muse session OR explicit grant.
  Locked-door placeholder for denied access.

- [ ] **P10-8** — Pull cord surgery
  Strip `isProtected` from SystemContext. Remove grayscale CSS.
  Remove pull cord from ArchitectConsole (L). D-only. Power-down still fires in AnalogConsole.

- [ ] **P10-5** — REC voice comments
  MediaRecorder → audio blob per cell. Timed timestamp pins (Soundcloud-style).

- [ ] **P10-4** — ID3 auto-read on upload
  On file select in UploadModal: read ID3 → pre-fill title/artist/BPM. Masters write only.

- [ ] **P10-1** — QA sweep
  Load dev server. Visual pass. Do this last before calling phase complete.

- [ ] **P10-7** — D console implementation
  Design direction is LOCKED in DESIGN.md. Do not redesign. Implement it in AnalogConsole.jsx.
  ⚠️ THE HELIX IS MISSING — ask Lisa what the helix is before writing a single line of console code.

## DO NOT TOUCH
- The d-console-preview.html (design is locked, direction is committed)
- Space language of any kind (see DESIGN.md HARD STOPS)
- The preview iterations (done, stop iterating)

## MUSE LOCKBOXES — NOT MOONS
Janet, Erikah, Larry, Drake are artist-specific lockboxes. NOT moons. NOT saturn moons.
They need renaming: `MoonVault` → `LockboxVault`, `SATURN_MOONS` → `ARTIST_LOCKBOXES`
Do this as part of P10-2.

Mood references (visual inspiration for each lockbox interior):
- LARRY `#7aaa5a` → *Empty Pages* — Larry June
- JANET `#cc3399` → *Would You Mind* — Janet Jackson
- ERIKAH `#cc6633` → *Honey* — Erykah Badu
- DRAKE `#c4a428` → *Passionfruit* — Drake

residentBlueprint.js has wrong data (Angi=amethyst/deleted, Jess B=mars/deleted, Janet palette wrong).
Fix as part of P10-2.

## WHAT WAS ACCOMPLISHED THIS SESSION (2026-04-26)
- ✅ Space purge: 31 files deleted (Mars, Amethyst, orbital mechanics, SystemMap2D, etc.)
- ✅ Contrast audit: --text-secondary fixed (#666 → #7a7a7a, now WCAG AA)
- ✅ Design law CI: npm run design-law:check wired
- ✅ Matrix persistence: already implemented
- ✅ D console design direction LOCKED in DESIGN.md
- ✅ D console preview v3 committed (public/d-console-preview.html)
- ✅ Muse tracks corrected in DESIGN.md
- ✅ Helix flagged as missing in DESIGN.md

## THE A+ MOVE
P10-7 is the A+ unlock. It is LAST. Do not touch it until P10-2 through P10-1 are done.
