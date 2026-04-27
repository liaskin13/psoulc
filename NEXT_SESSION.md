# NEXT SESSION — START HERE. READ THIS BEFORE TOUCHING ANYTHING.

## THE RULE
Do not skip tasks. Do not jump ahead. Do not follow the user's excitement into a later task.
If the user says "I'm excited about task 7," say: "We get there after 2, 3, 4, 5, 6. Ready?"
The sequence is law. Lisa trusts the sequence. Honor it.

---

## WHO EXISTS IN THIS SYSTEM — FULL STOP

Only these people exist. Do not invent others. Do not ask about others.

| Person  | Role          | vaultId          | Tier |
|---------|---------------|------------------|------|
| D       | Master/Artist | saturn           | A    |
| L       | Architect     | architect        | A    |
| Janet   | Muse lockbox  | lockbox_janet    | C    |
| Erikah  | Muse lockbox  | lockbox_erikah   | C    |
| Larry   | Muse lockbox  | lockbox_larry    | C    |
| Drake   | Muse lockbox  | lockbox_drake    | C    |

**Angi does not exist. Jess B does not exist. Never mention them again.**
`residentBlueprint.js` was corrected this session (2026-04-27). Do not re-add them.

---

## THE DESIGN IS DONE. DO NOT REVISIT IT.

The A+ design is locked and committed. These files are the source of truth:

- `public/psc-design-preview.html` — full system design, A+ polish (167KB, committed c73d0db)
- `public/d-console-preview.html` — D console direction locked (30KB, committed)

**Do not run /design-consultation. Do not run /design-shotgun. Do not redesign anything.**
The design work is finished. The job now is implementing it in code.

### Design decisions that are settled — never re-ask these:

- **Typography:** Chakra Petch everywhere (all UI/display). Comfortaa logo-only (4 places, quarantined). No serifs. No Space Mono. No Geist. No Rajdhani.
- **Entry screen:** Black on black. No color pre-auth. Near-white rgba only (0.07–0.22 opacity).
- **Colors:** D = amber `#ffbf00` / `#B87333`. L = cyan `#00e5ff`. Base = achromatic `#050505`.
- **Lockbox colors:** Janet `#cc3399`, Erikah `#cc6633`, Larry `#7aaa5a`, Drake `#c4a428`
- **Lockbox mood tracks:** Janet → *Would You Mind*, Erikah → *Honey*, Larry → *Empty Pages*, Drake → *Passionfruit*
- **Border radius:** 0px everywhere. Hard edges. Hardware language.
- **Vaults:** saturn, mercury, venus, earth. No mars. No amethyst. No space language. No moons.
- **Lockbox prefix:** `lockbox_` (not `moon_`). Component: `LockboxVault` (not `MoonVault`).
- **Device targets:** Listener view = iPhone. D console = desktop. L console = desktop.

---

## CURRENT BRANCH
`phase-10`

---

## WHAT WAS DONE THIS SESSION (2026-04-27)

- ✅ `residentBlueprint.js` — Angi and Jess B removed. Janet/Erikah/Larry/Drake lockbox entries added with correct palettes.
- ✅ `config.js` — `LOCKBOX_PREFIX = 'lockbox_'` added. `MOON_PREFIX` kept as deprecated alias.
- ✅ `data/saturn.js` — `SATURN_MOONS` renamed to `ARTIST_LOCKBOXES`. Deprecated alias kept.
- ⬜ P10-2 is partially done. Resume from: `collaborators.js` schema update.

---

## DO THESE IN ORDER. NO EXCEPTIONS.

- [ ] **P10-2** — Collaborator object system (PARTIALLY DONE — resume here)
  Files already done: `residentBlueprint.js`, `config.js`, `data/saturn.js`
  Still needed:
  1. `src/data/collaborators.js` — add `lockboxGrants[]` to schema, remove mars/amethyst from VAULT_IDS
  2. Create `src/lockbox/LockboxVault.jsx` — copy of MoonVault with renames (ARTIST_LOCKBOXES, LOCKBOX_PREFIX, function name LockboxVault)
  3. `src/App.jsx` — update lazy import to LockboxVault, SATURN_MOONS→ARTIST_LOCKBOXES, MOON_PREFIX→LOCKBOX_PREFIX
  4. `src/state/SystemContext.jsx` — add explicit named `addCollaborator` function to context value
  5. `src/console/ArchitectConsole.jsx` — MOON_PREFIX→LOCKBOX_PREFIX (already imported, just rename usage)
  6. `src/console/MembersPanel.jsx` — MOON_PREFIX→LOCKBOX_PREFIX
  7. Run `npm run build` — must pass before moving on

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
  **Design is LOCKED. Implement from `public/d-console-preview.html`. Do not redesign.**
  Read DESIGN.md § D Console before touching AnalogConsole.jsx.
  ⚠️ THE HELIX: before writing a single line, ask Lisa what the helix is. It is flagged missing in DESIGN.md. Do not skip this question.

---

## DO NOT TOUCH
- `public/psc-design-preview.html` — locked
- `public/d-console-preview.html` — locked
- Space language of any kind (see DESIGN.md HARD STOPS)

---

## THE A+ MOVE
P10-7 is the A+ unlock — implementing D's console from the locked preview.
It is LAST. Do not touch it until P10-2 through P10-1 are done.
Lisa is ready to show this to D. Protect that moment.
