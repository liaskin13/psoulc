# NEXT SESSION — START HERE. READ THIS BEFORE TOUCHING ANYTHING.

## CLAUDE BEHAVIOR RULES — NON-NEGOTIABLE
- **Ask questions. Wait for answers. Do not proceed until Lisa confirms.**
- **Use plan mode for every non-trivial action. No exceptions.**
- **Never summarize Lisa's words back to her and then proceed — confirm first.**
- Lisa was burned badly this session by Claude running ahead without confirmation. Do not repeat this.

---

## THE RULE
Do not skip tasks. Do not jump ahead. Do not follow the user's excitement into a later task.
If the user says "I'm excited about task 7," say: "We get there after [current task]. Ready?"
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

L = Lisa = the Architect = the user you are talking to. D = Darnell = Soul Pleasant = the artist. D has seen NOTHING yet. L is building this FOR D.

---

## USER TIERS — CANONICAL NAMES

- **MASTERS** — Tier A (D, L, and future invited masters)
- **MEMBERS / SUBSCRIBERS** — paying subscribers
- **MUSES** — lockbox artists (Janet, Erikah, Larry, Drake)
- **LISTENERS** — free/public viewers. **NEED A BETTER WORD.** Must hint they are not fully part of the collective but make them WANT to be. Lisa wants this renamed. Do not use "Listeners" in any new design work — flag it as unresolved.
- **COLLABORATORS** — vault access / vetted contributors

---

## APP IS NOT RENDERING CORRECTLY — FIX THIS FIRST

The app at port 5173 is showing unstyled/plain text. CSS loads fine (confirmed via curl).
This is a browser-side JavaScript error. Lisa needs to:
1. Open port 5173 in Codespace browser
2. Press F12 → Console tab
3. Report the first red error

**Quickest thing to try first (no error reporting needed):**
In browser → F12 → Application tab → Local Storage → delete `psc_session` → hard refresh (Ctrl+Shift+R).
If entry screen appears, the app is working. A corrupted session was likely the cause.

**Modified files (minor changes, likely not the crash cause):**
- `src/state/SystemContext.jsx` — `meta.vault` → `meta.planet` (1 line)
- `src/listener/ListenerShell.jsx` — vault transition moved to useEffect
- `src/components/UploadModal.jsx` — `tags` field added to upload

---

## DESIGN DIRECTION — CONFIRMED THIS SESSION (2026-04-30)

Lisa confirmed this in conversation. Do NOT re-derive from old files. These override anything older.

### What is confirmed correct (items 1–4):
1. Entry screen is good — do not touch it
2. There is no consistent design base yet — that is the core problem to solve
3. The next design task is: **L's console / Architect Console**
4. **General Master Console = the base template** — Serato-inspired. Both D and L consoles build from this.

### Item 5 — D's console (corrected):
- D's console = General Master Console base + his identity touches
- **Serato-inspired but stripped of things D won't use.** If unsure whether to keep something, LEAVE IT IN — D will say what to remove.
- **Amber problem:** the current design has amber everywhere — it looks cheap and boring. Lisa's words: "amber vomited all over it."
- **Correct amber usage = fashion luxury rule:** amber appears in MAXIMUM 3 specific places. Luxury brands use colour as a signal, not wallpaper. One amber element = powerful. Amber everywhere = nothing.
- D's console keeps amber — but surgically, not saturated.

### Item 6 — L's console (corrected):
- L = GOD MODE. L is: admin + IT + marketing + gatekeeper + security for the entire system.
- L controls ALL tiers: MASTERS, MEMBERS/SUBSCRIBERS, MUSES, LISTENERS (rename needed), COLLABORATORS.
- L's console = General Master Console WITHOUT amber. Cyan identity only, used with the same restraint.
- **COLLABORATOR ONBOARDING — Phase 11 feature (do not build now, keep in context):**
  - Vault Access Request form collects phone/email
  - Autoresponse includes a link with copy: **"ARE YOU A GENIUS WITH NO SOVEREIGN HOME FOR YOUR ART TO LIVE AND BREATHE? DOES THE COLLECTIVE FEEL LIKE HOME?"**
  - Link leads to: upload original music / submit work to be vetted by L
  - If L approves → sends to D for review
  - This is Phase 11 scope. Do not build. Do capture the vision.

### Item 7 — L and D are CO-CREATORS (confirmed):
- L and D are co-creators. The hierarchy L → D → Everyone Else is confirmed correct.
- L handles ALL backend: admin, IT, marketing, gatekeeper, security
- D populates the system, gives it life, and ideally focuses purely on his art
- Future MASTERS will have full control of their own systems just like D — except whatever L/D decide they shouldn't touch in the UX
- The design must reflect this partnership at the top level, not just "L controls D"

---

## DO NOT REDESIGN ANYTHING WITHOUT A CONFIRMED PLAN

The design-shotgun AI image generation requires OpenAI org verification — it does NOT work in this environment.
Fall back to HTML mockups only. Do not attempt AI image generation.

**Before building any HTML mockup:**
1. Write the plan
2. Present it to Lisa
3. Wait for her confirmation
4. Then and only then: build

---

## CURRENT BRANCH
`phase-10`

---

## P10-7 — D CONSOLE IMPLEMENTATION (after design is settled)

The locked preview is `public/d-console-preview.html`. But the amber design direction is under review per item 5 above. **Do not implement until Lisa confirms the design direction.**

**What IS done:**
- `src/console/SpectralStack.jsx` — NEW, untracked. BPM-derived stacked sine-wave canvas.
- `src/App.css` — Full 5-zone D console CSS added.
- `src/config.js` — `LOCKBOX_CODES` added.
- `src/console/ArchitectConsole.jsx` — MUSE Outreach Composer panel added.

**What is NOT done:**
- `src/console/AnalogConsole.jsx` — THE REWRITE WAS NEVER WRITTEN. Still old 84-line placeholder.

**4 fixes to apply while writing:**
1. Add VOICE toggle in CHAIN system-toggles block
2. Add `countVaultTracks(vault)` to `src/lib/tracks.js`
3. Fix MUSE clipboard format in ArchitectConsole.jsx (~line 844)
4. Add `handleNext` track navigation

**After AnalogConsole is written:** run `npm run preflight` — must be green.

---

## UPLOAD — MIGRATED TO CLOUDFLARE R2

**STATUS:** Upload modal UI is complete. Storage backend migrated from Supabase (50MB limit) to Cloudflare R2 (no size limits).

**SETUP REQUIRED:**
1. Create R2 bucket: `wrangler r2 bucket create psc-audio`
2. Deploy worker: `cd worker && npm install && npm run deploy`
3. Set environment variables in `.env`:
   - `VITE_UPLOAD_WORKER_URL=https://psc-upload-worker.{your-account}.workers.dev`
   - `VITE_R2_PUBLIC_URL=https://pub-{hash}.r2.dev`
4. See `worker/README.md` for complete setup instructions

**LOCAL DEV TESTING:**
- Run `cd worker && npm run dev` (starts worker on localhost:8787)
- Main app uses `http://localhost:8787` by default
- No R2 account needed for initial testing (worker will error but shows flow)

**Lisa has 5 mixes (121MB+) ready to upload once R2 is configured.**
4. This counts toward Gate A (50+ tracks needed before inviting Masters)

L's master key — check `src/config.js` for AUTH_CODES if Lisa doesn't know it.

---

## MESSAGING SYSTEM — NEW FEATURE (plan before building)

Lisa wants in-console messaging:
- D ↔ L console-to-console
- D or L → Members
- D or L → Muses

This needs its own design + implementation plan. Do not build without planning first.
Suggested scope: post-P10-7.

---

## TIER SYSTEM — CANONICAL (updated 2026-04-30)

| Tier | Who | Current Code |
|------|-----|-------------|
| A | L + D + future Masters | `A` |
| B | Members / Subscribers | `B` |
| C | Muses (Janet, Erikah, Larry, Drake) | `C` |
| D | Collaborators | `D` |
| G | Generic / General / Public | `G` |

**LISTENER word is still unresolved — needs a new name that hints they are not fully part of the collective but makes them WANT to be. Flag this in any UI work.**

**Phase 11 — Rename tiers using a music scale:**
- Ask D what his favourite scale is. Use that scale's note names for tier naming.
- Placeholder: D Major scale (D, E, F#, G, A, B, C#)
- Do NOT implement until D is consulted. Capture the idea only.

---

## DESIGN DECISIONS SETTLED — NEVER RE-ASK

- **Typography:** Chakra Petch everywhere. Comfortaa logo/wordmark only. No serifs.
- **Entry screen:** Black on black. One screen: wordmark TL, request-access center, master key BR. GOOD. DO NOT TOUCH.
- **Colors:** D = amber `#ffb347` (3 places max). L = cyan `#00e5ff` (restrained). Base = achromatic `#050505`.
- **Border radius:** 0px everywhere. Hard edges.
- **pleasantsoulcollective wordmark:** all lowercase, soul at 1.2× scale, Comfortaa 700, fixed TL.
- **Lockbox colors:** Janet `#cc3399`, Erikah `#cc6633`, Larry `#7aaa5a`, Drake `#c4a428`
- **Device targets:** Listener = iPhone. D/L consoles = desktop.
- **Living monogram:** one dp pulses at a time (0→0.07→0, 2.5s), never two at once.
- **Vault display names:** ORIGINAL MUSIC · LIVE SETS · MIXES · SONIC ARCH (no astronomical names in UI ever)
- **Amber rule:** fashion luxury — one amber element is powerful, amber everywhere is nothing. Max 3 placements.

---

## DO NOT TOUCH
- `public/d-console-preview.html` — locked reference (amber direction under review)
- `public/psc-design-preview.html` — locked
- Space/astronomical language of any kind — EVER. Not in UI, not in code comments, not in plans.
