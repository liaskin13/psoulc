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
- **Vault display names (UI-facing, never planet names):**
  - saturn → ORIGINAL MUSIC
  - mercury → LIVE SETS
  - venus → MIXES
  - earth → SONIC ARCH
  - Source of truth: `VAULT_DISPLAY_NAMES` in `src/config.js`
- **MasterClock:** No 528Hz label. Removed. Just the oscilloscope waveform + local time.
- **THE SIGNAL:** Name locked for the future live broadcast feature. Not a vault. Not in scope until post-P10-7.

---

## CURRENT BRANCH
`phase-10`

---

## WHAT WAS DONE THIS SESSION (2026-04-27)

- ✅ P10-2 — Collaborator object system COMPLETE
- ✅ P10-6 — Lockbox access layer COMPLETE
- ✅ P10-8 — Pull cord surgery COMPLETE
  GodModePullCord deleted. isProtected stripped everywhere. EXIT SYSTEM button in both consoles.
  Build passes. grep isProtected src/ → CLEAN.
- ✅ P10-5 — REC voice comments COMPLETE
  Mercury voice comments wired. Timestamp pin (⏺ HH:MM) on CommentPanel voice entries.
  Planet names killed in room view + CommentPanel (VAULT_DISPLAY_NAMES in config.js).
  528Hz removed from MasterClock.
  Build passes.
- ✅ P10-4 — ID3 auto-read COMPLETE
  UploadModal: added TPE1 (artist) parsing, artist + tags state, ARTIST + TAGS fields.
  Artist wired to uploadTrack(). Tags field is UI-only (no DB column yet).
  Build passes.
- ✅ P10-1 — QA sweep COMPLETE
  2 bugs found and fixed:
  • ISSUE-001 (Critical): EarthSafe crash — clearSelection missing from useVaultFileCells destructure. Fixed: ea256d9.
  • ISSUE-002 (Medium): ArchitectConsole vault names hardcoded, not using VAULT_DISPLAY_NAMES. Fixed: 51f0362.
  All vaults, both consoles, entry sequence verified clean. Build passes.

---

## DO THESE IN ORDER. NO EXCEPTIONS.

- [x] **P10-2** — Collaborator object system — COMPLETE
- [x] **P10-6** — Lockbox access layer — COMPLETE
- [x] **P10-8** — Pull cord surgery — COMPLETE
- [x] **P10-5** — REC voice comments — COMPLETE
- [x] **P10-4** — ID3 auto-read on upload — COMPLETE
- [x] **P10-1** — QA sweep — COMPLETE

- [ ] **P10-7** — D console implementation
  **Design is LOCKED. Implement from `public/d-console-preview.html`. Do not redesign.**
  Read DESIGN.md § D Console before touching AnalogConsole.jsx.
  ⚠️ THE HELIX: before writing a single line, ask Lisa what the helix is. It is flagged missing in DESIGN.md. Do not skip this question.
  📬 MUSE OUTREACH COMPOSER (ArchitectConsole scope):
  L drafts a message to a Muse artist with their lockbox access code.
  D can add a personal note — he likely won't (humble, not self-promotional).
  The lockboxes are sonic love letters. The composer is how they get invited in.

---

## DO NOT TOUCH
- `public/psc-design-preview.html` — locked
- `public/d-console-preview.html` — locked
- Space language of any kind (see DESIGN.md HARD STOPS)

---

## THE A+ MOVE
P10-7 is the A+ unlock — implementing D's console from the locked preview.
It is LAST. Do not touch it until P10-4 and P10-1 are done.
Lisa is ready to show this to D. Protect that moment.
