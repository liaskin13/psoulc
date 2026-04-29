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

## WHAT WAS DONE THIS SESSION (2026-04-27 — SESSION 2)

### P10-7 partial implementation — INCOMPLETE, resume immediately

**What IS done (all unstaged, not yet committed):**
- ✅ `src/console/SpectralStack.jsx` — NEW file, untracked. BPM-derived stacked sine-wave canvas. Uses FALLBACK_BPMS if no tracks. Ready to use.
- ✅ `src/App.css` — Full 5-zone D console CSS added. `.analog-console`, `.d-rail`, `.d-bins`, `.d-monitor`, `.d-chain`, `.d-transport`, `.d-cursor`, `.d-spotlight`, aurora blobs, gold foil, CRT scanlines, MUSE panel styles — all present.
- ✅ `src/config.js` — `LOCKBOX_CODES` added (`lockbox_janet: 'J528'`, etc.)
- ✅ `src/console/ArchitectConsole.jsx` — MUSE Outreach Composer panel added. MUSE tab button + full panel with lockbox selector, L's message, D's note, COPY INVITE.

**What is NOT done (do immediately):**
- ❌ `src/console/AnalogConsole.jsx` — THE COMPLETE REWRITE WAS NEVER WRITTEN. Still old 263-line 3-zone version importing SATURN_TRACKS. This is the entire console. All CSS and SpectralStack are ready but nothing uses them yet.

**4 fixes to apply while writing the rewrite:**
1. **D1**: Add a VOICE toggle in the CHAIN system-toggles block (alongside Members) — opens CommentPanel. Use the `.d-tog` pattern, same as the Members toggle.
2. **D2**: Add `countVaultTracks(vault)` to `src/lib/tracks.js` using `select('*', { count: 'exact', head: true })`. Use it in `loadCounts` instead of fetching full arrays.
3. **D3**: Fix MUSE clipboard output format in ArchitectConsole.jsx (line ~844). Change `'Access code:'` → `'Your lockbox:'` and add `'— D\n'` before D's note text.
4. **Bonus**: Add `handleNext` — track navigation forward. Transport has ◀◀ and ■ Stop but no ▶▶.

### How to write AnalogConsole.jsx

The complete spec is in `tasks/plan.active.md` (search for `# P10-7 Implementation Plan`). The locked preview is at `public/d-console-preview.html`.

Key implementation notes:
- `export default function AnalogConsole({ onBroadcast, onIntake, isBroadcasting, onPowerDown, activeNode, onNodeSelect, onNodeLongPress, onClaimNode, latentNodes, artistLockboxes, onLockboxSync })` — keep legacy props for App.jsx compat
- Imports: `fetchVaultTracks, getAudioUrl` from `'../lib/tracks'`; `countVaultTracks` from `'../lib/tracks'` (after you add it); `VAULT_COLORS, VAULT_DISPLAY_NAMES` from `'../config'`; `SpectralStack` from `'./SpectralStack'`
- Vault labels (local, for bins): `{ saturn: 'Original Music', venus: 'Curated Mixes', mercury: 'Live Sets', earth: 'Sonic Archive' }`
- VAULT_ORDER: `['saturn', 'venus', 'mercury', 'earth']`
- M³ defaults: `masterCount || 2` and `museCount || 4` (because members array may show 0 before load)
- Audio useEffect deps: include `isPlaying` to avoid stale closure
- Cancelled flag pattern: `let cancelled = false; return () => { cancelled = true; }` in vault load effect
- Total tracks: `Object.values(vaultCounts).reduce((a, b) => a + b, 0)`
- The `.analog-console` CSS now uses `flex: 1` + CSS grid. The `.cockpit` in App.jsx is already `display: flex; flex-direction: column; height: 100svh`.

After writing, run `npm run preflight` — must be green before done.

---

## DO THESE IN ORDER. NO EXCEPTIONS.

- [x] **P10-2** — Collaborator object system — COMPLETE
- [x] **P10-6** — Lockbox access layer — COMPLETE
- [x] **P10-8** — Pull cord surgery — COMPLETE
- [x] **P10-5** — REC voice comments — COMPLETE
- [x] **P10-4** — ID3 auto-read on upload — COMPLETE
- [x] **P10-1** — QA sweep — COMPLETE

- [ ] **P10-7** — D console implementation — IN PROGRESS
  **RESUME HERE. Write AnalogConsole.jsx + apply 4 fixes above. Run preflight. Then /plan-eng-review.**
  Design is LOCKED. CSS is done. SpectralStack.jsx is done. ArchitectConsole MUSE is done.
  The ONLY missing piece is AnalogConsole.jsx itself.
  📬 MUSE OUTREACH COMPOSER: done in ArchitectConsole.jsx (except D3 format fix).

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
