# NEXT SESSION — START HERE. READ THIS BEFORE TOUCHING ANYTHING.

## LAST UPDATED: 2026-05-06 (Serato-grade console redesign + upload pipeline restoration)

## CLAUDE BEHAVIOR RULES — NON-NEGOTIABLE
- Read DESIGN.md in full before touching any CSS or JSX
- Run impact analysis before modifying any shared symbol
- One task at a time, in the order listed below — no skipping
- If user expresses excitement about a future task: "We get there after [current task]. Ready?"
- Confirm before destructive or wide-impact changes
- Never mark complete without proving it works

---

## WHAT SHIPPED THIS SESSION (2026-05-06 — phase-10)

### Console Layout Fix (DONE)
- Grid bug: `grid-template-rows` had 4 rows for 5 in-flow children → fixed to 5-row definition
- `.arch-deck-zone` got `min-height:0; overflow:hidden` to prevent blowout
- White bar bottom-right: `arch-vol-slider` track pseudo-elements added to kill browser default white

### Dead Buttons Wired/Disabled (DONE)
- RELOAD button wired: stops audio, reloads from `loadedTrack.audio_path`
- Disabled buttons (opacity 0.22, pointer-events:none): loop controls, CUE ABCD, NEEDLE DROP/ZOOM, monitor EQ, BACK/FWD/FILES/CRATES
- Fixed field name: `loadedTrack.storage_key` → `loadedTrack.audio_path`

### Upload Pipeline Restoration (DONE — pending user's R2 public URL)
- `src/lib/tracks.js` — COMPLETE REWRITE: reads from Worker API in production, localStorage only in dev
- `src/config.js` — added `R2_PUBLIC_URL` from `VITE_R2_PUBLIC_URL` env var
- `worker/upload-worker.js` — `file.stream()` → `await file.arrayBuffer()` (was silently hanging at 95%)
- `ArchitectConsole.jsx` — vault tab counts now use `vaultTracksState` from SystemContext (not dead localStorage)
- Worker needs redeployment: `cd worker && npx wrangler deploy`

### $impeccable craft — Serato Console Redesign (DONE — CSS only)
Applied to `src/console/ArchitectConsole.css`:
- Waveform: 64px → **108px** height, bi-directional gradient bars, alternating thin sub-bars, center hairline
- Transport keycaps: 4px physical depth, inset bottom shadow, 3px press travel
- PLAY button: wider (28px pad), brighter glow, more presence
- Hot cue buttons: 26×28 → **30×32px**, 3px depth
- Monitor strip: flexible → **fixed 36px** status rail
- Track rows: 9px padding → **5px + min-height 32px** (Serato density)
- Column header: 4px padding, 24px min-height
- Library search: fixed 32px height
- Vault tabs: tightened to 8px vertical pad
- Deck meta/tools: tightened gap and margin

---

## USER ACTION STILL REQUIRED (not code — you need to do this in Cloudflare)

### R2 Public Access Setup
1. Cloudflare dashboard → R2 → your bucket → **Settings** tab
2. Under "Public Access" click **Allow Access** → ON
3. Copy the `pub-xxx.r2.dev` URL that appears
4. Add to `.env`: `VITE_R2_PUBLIC_URL=https://pub-xxx.r2.dev`
5. Also confirm: `VITE_UPLOAD_SECRET=<your PSC_SECRET value from wrangler secrets>`
6. `cd worker && npx wrangler deploy`
7. `npm run build && npx wrangler pages deploy dist`

Until this is done, uploads succeed at the Worker but tracks won't appear in the console (no public URL to play back from).

---

## ARCHITECTURE TRUTH — READ THIS
The D console and L console are THE SAME COMPONENT: `src/console/ArchitectConsole.jsx`.
- `stage === "architect"` renders ArchitectConsole for L (no viewer prop)
- `stage === "console"` renders ArchitectConsole with `viewer="D"` prop
- `.architect-console--d` class (green identity) vs `.architect-console--l` class (cyan identity)
- CONSEQUENCE: Any structural/layout fix to ArchitectConsole affects BOTH consoles.

---

## NEXT TASKS — IN ORDER

### TASK 5: D/L internal messaging (new feature)
Private channel between D and L visible only in their Master consoles.
Needs shape brief first — ask L to describe the UX they want.
Then: D1 table (`messages` with sender, content, created_at), Worker endpoint, console sidebar UI.
Architecture reference: TheSignal chat — same D1 pattern.

### TASK 6: Guest vault interior on mobile
ListenerShell lobby is done. Vault INTERIOR (TheVault, SaturnVault, MercuryStream)
as seen by a guest on iPhone has not been audited at 390px.
Run `$impeccable audit` targeting vault views at 390px.
Fix: sort pill touch targets (P3 — `min-height: 44px` under `pointer: coarse`).

### TASK 7: Beta testing readiness for D
Before D tests:
- [ ] R2 setup complete (user action above)
- [ ] Upload flow end-to-end working (upload → appears in console → plays)
- [ ] All vault content visible and playable
- [ ] THE SIGNAL button functional
- [ ] No broken/dead buttons in D's view
- [ ] D on iPhone lands in listener shell, not console
- [ ] Deploy to psoulc.pages.dev and verify live

---

## KNOWN ISSUES (not blocking beta)
- Sort pills in vault view sub-44px on mobile (P3, Task 6)
- public/psc-test.wav — delete before production
- public/three.min.js — verify if used or remove

---

## KEY FILE LOCATIONS
- Shared console: `src/console/ArchitectConsole.jsx` + `src/console/ArchitectConsole.css`
- Console routing: `src/App.jsx` lines ~98-113 (handleIgnite), ~218-254 (architect), ~286-344 (D console)
- Track library: `src/lib/tracks.js` (rewritten — Worker API in prod, localStorage in dev)
- Worker: `worker/upload-worker.js`
- Listener shell: `src/listener/ListenerShell.jsx`
- DPWallpaper: `src/components/DPWallpaper.jsx`
- D console reference: `public/psc-p10-7-preview.html` (DO NOT DELETE)
- Design law: `DESIGN.md` (read in full before any visual change)
- Token system: `src/variables.css`
- Config/env vars: `src/config.js`

---

## HOW TO START THE NEXT SESSION
Open the window and type this exactly:

> "Read NEXT_SESSION.md and DESIGN.md, then tell me what's next."

That's it. The memory system carries everything else.
