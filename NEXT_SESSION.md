# NEXT SESSION — START HERE. READ THIS BEFORE TOUCHING ANYTHING.

## LAST UPDATED: 2026-05-05 (impeccable 20/20 session)

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
| D       | Master/Artist | VAULT           | A    |
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

## STATUS AS OF 2026-05-05 — /IMPECCABLE 20/20 COMPLETE ✅

All 7 audit items fully resolved. Stack is Cloudflare-only — no Supabase.

### What was fixed this session (May 5, 2026):
- **P0 — INTAKE upload broken**: Root cause was missing `.env` file (falls back to localhost:8787). L must create `/workspaces/psoulc/.env` manually with `VITE_UPLOAD_WORKER_URL=https://psc-upload-worker.psoulc.workers.dev` + their wrangler upload secret.
- **P0 — INTAKE aria-label**: Added `aria-label="Upload tracks to vault"` to button.
- **P0 — ConduitSlider**: Added `aria-label="Broadcast conduit — drag to activate The Signal"` + `aria-valuetext`. Copy changed from "THE LOVE"/"FLOW STATE" → "STANDBY"/"SIGNAL OPEN".
- **P1 — console.log purge**: Removed ALL 5 console.log calls from ArchitectConsole.jsx.
- **P1 — Tab glider scaleX migration**: Switched from `width` animation to `transform: scaleX()`. CSS: `width: 1px; transform-origin: left center`. JS: `scaleX(offsetWidth)`. Single GPU-composited property, no layout thrash.
- **P1 — Track row side-stripes**: `border-left` removed from `.arch-track-row` and `.arch-track-list-head`. Selected states use background tints only. D's selected row retains 2px identity green border-left (functional marker, not decorative stripe).
- **P2 — Color tokenization complete**: `--arch-muted-rgb: 180, 200, 210`, `--arch-error: rgba(220, 80, 80, 0.7)`, `--arch-error-solid: #dc5050` defined in root. All ~30 hardcoded instances replaced with `rgba(var(--arch-muted-rgb), X)` or `var(--arch-error)`.

### ONE REMAINING MANUAL STEP:
Create `/workspaces/psoulc/.env`:
```
VITE_UPLOAD_WORKER_URL=https://psc-upload-worker.psoulc.workers.dev
VITE_UPLOAD_SECRET=<your wrangler secret>
VITE_SIGNAL_HLS_URL=<your cloudflare stream HLS url>
```

### What to verify:
1. Run `npm run dev` → open localhost:5173
2. D console (0528): neutral/sage palette, green ONLY at selected track row + BPM/Key. THE SIGNAL button red.
3. L console (7677): cyan palette.
4. INTAKE button → upload modal opens → file uploads to Cloudflare R2 (needs .env)
5. ConduitSlider: shows "STANDBY", slides to "SIGNAL OPEN" past 80%

### Session key: `psc_session`

### Session key: `psc_session` (NOT psc_session_v2)

---

## APP IS NOT RENDERING CORRECTLY — MAY HAVE BEEN RESOLVED

The app at port 5173 was showing unstyled/plain text in a prior session. CSS loads fine (confirmed via curl).
This was a browser-side JavaScript error or corrupted session.

**Quickest thing to try first (no error reporting needed):**
In browser → F12 → Application tab → Local Storage → delete `psc_session` → hard refresh (Ctrl+Shift+R).
If entry screen appears, the app is working.

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

## CONSOLE ARCHITECTURE — LOCKED

Old Analog console path is deleted.

- D and L now use the same console chassis: `ArchitectConsole`.
- D route uses `viewer="D"`; L route uses default architect view.
- `src/console/AnalogConsole.jsx` has been removed.
- `src/console/GodModePullCord.jsx` and `src/console/GodModePullCord.css` have been removed.

Run `npm run preflight` before shipping any follow-up changes.

---

## UPLOAD — MIGRATED TO CLOUDFLARE R2

**STATUS:** Upload modal UI is complete. Storage backend migrated from Supabase (50MB limit) to Cloudflare R2 (no size limits).


**Lisa has 5 mixes (121MB+) ready to upload once R2 is configured.**
4. This counts toward Gate A (50+ tracks needed before inviting Masters)



---

## MESSAGING SYSTEM — NEW FEATURE (plan before building)

Lisa wants in-console messaging:
- D ↔ L console-to-console
- D or L → Members
- D or L → Muses

This needs its own design + implementation plan. Do not build without planning first.
Suggested scope: post-phase-10 tracker reconciliation.

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
- **Colors:**  L = cyan `#00e5ff` (restrained). Base = achromatic `#050505`.
- **Border radius:** 0px everywhere. Hard edges.
- **pleasantsoulcollective wordmark:** all lowercase, soul at 1.2× scale, Comfortaa 700, fixed TL.
- **Lockbox colors:** Janet `#cc3399`, Erikah `#cc6633`, Larry `#7aaa5a`, Drake `#c4a428`
- **Device targets:** Listener = iPhone. D/L consoles = desktop.
- **Living monogram:** one dp pulses at a time (0→0.07→0, 2.5s), never two at once.
- **Vault display names:** ORIGINAL MUSIC · LIVE SETS · MIXES · SONIC ARCH (no astronomical names in UI ever)


---


