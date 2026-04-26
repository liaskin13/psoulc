# PSC Universe — Sovereign Tasks

## Phase 9 Execution Queue (Autoplan Aligned, 2026-04-26)

### NOW (Do First)
- [x] Resolve design-law drift between [tasks/plan.active.md](tasks/plan.active.md) and [DESIGN.md](DESIGN.md) for entry color behavior and Comfortaa whitelist count.
  - ✅ Comfortaa whitelist: removed `.aperture-seal`, locked to 4 locations (DPWallpaper, file-cell-dp-mark, psc-seal, aperture-code-cell cursor)
  - ✅ Pre-auth entry color: clarified copper/amber removed, entry is BLACK ON BLACK until post-auth theme applied
- [x] Add & verify phase-9 acceptance criteria (measurable gates before NEXT begins): **✅ COMPLETE**
  
  **✅ DESIGN & VISUAL LOCK (ALL PASS):**
  - ✅ Comfortaa whitelist locked: 7 references in exactly 4 whitelisted locations. Removed 14 stale CSS selectors. Removed dead .aperture-seal CSS.
  - ✅ Zero copper/amber in entry scope (BLACK ON BLACK confirmed)
  - ✅ Zero deprecated font names (Cormorant, Geist expunged)
  - ✅ CSS identity tokens properly injected at body level + theme-scoped overrides
  
  **✅ CODE QUALITY & STALE REFERENCES (ALL PASS):**
  - ✅ ArchitectConsole: arch-viewscreen-zone already removed (no ENG-1 prep work needed)
  - ✅ Zero deprecated class names in jsx/tsx
  - ✅ Both consoles wired with MembersPanel + CommentPanel
  - ✅ SystemContext.jsx: auth already in place, dispatchCommand ready to extend, telemetry pending ENG-5 Phase 3
  - ✅ All existing command paths functional
  
  **⚠️ ACCESSIBILITY BASELINE (DEFERRED TO NEXT):**
  - [ ] AnalogConsole: keyboard nav + focus + contrast audit
  - [ ] ArchitectConsole: keyboard nav + focus + contrast audit
  - [ ] Entry sequence: keyboard input + focus verification
  
  **✅ DOCUMENTATION GATE (READY):**
  - ✅ DESIGN.md locked, Comfortaa verified, pre-auth color confirmed
  - ✅ plan.active.md updated with audit pass
  - ✅ todo.md synchronized with NOW/NEXT/LATER queue
  - ✅ CLAUDE.md references DESIGN.md as canonical source

- [x] Run full typography/token audit across jsx/tsx/css (not jsx-only grep): **PASS**
  - ✅ Comfortaa whitelist: 7 matches in 4 locations (locked)
  - ✅ Deprecated token references: 0 (expunged)
  - ✅ Chakra Petch weight distribution: 300/400/500/600/700 all loaded (verified in variables.css)
  - ✅ CSS variable coverage: --identity, --surface, --text-* consistent across App.css, variables.css, identity.css

- [x] Keep [tasks/todo.md](tasks/todo.md) and [tasks/plan.active.md](tasks/plan.active.md) sequencing synchronized: **SYNCED**

### NEXT (After NOW is Green)

✅ **COMPLETE — All NEXT items already implemented:**

- [x] ENG-1: Remove arch-viewscreen-zone from [src/console/ArchitectConsole.jsx](src/console/ArchitectConsole.jsx).
  - ✅ Already removed (scope completed)
  
- [x] ENG-5 (staged): Extend dispatchCommand in [src/state/SystemContext.jsx](src/state/SystemContext.jsx).
  - ✅ Phase 1: Adapter/handler map + 8 command handlers (auth checks lines 392-398)
  - ✅ Phase 2: Auth enforcement + collaborator cross-check (lines 399-404)
  - ✅ Phase 3: CommandLog telemetry persisted to localStorage (lines 421-428)
  
- [x] ENG-4: Build CMD MATRIX against the stabilized command/auth contract.
  - ✅ Full UI implementation in ArchitectConsole (lines 415-485)
  - ✅ ARM gate with button state change (lines 108, 427-434)
  - ✅ Toggle cells (●/○) with pending state tracking (lines 468-478)
  - ✅ COMMIT/CANCEL buttons with correct disabled states (lines 431-433)
  
- [x] ENG-3: Replace member cards with dense phosphor ROSTER table.
  - ✅ Full ROSTER table implementation (lines 320-383)
  - ✅ Columns: Tier, Handle, Planet, Code (masked/reveal), Registered date
  - ✅ Empty state handling
  - ✅ ADD MEMBER button wired

### LATER (Defer)
- [ ] Broader visual expansion not required for phase-9 stabilization.
- [ ] Performance optimization not tied to immediate command/auth risk reduction.
- [ ] Additional backlog items that depend on unresolved command contract details.

### Release Gate (Before Marking Phase 9 Done)
- [x] Run devex review only after NOW+NEXT tasks are complete, with pass criteria:
  - [x] zero critical onboarding/runtime blockers
  - [x] all high-severity findings either fixed or explicitly deferred with owner + reason
  - [x] [tasks/plan.active.md](tasks/plan.active.md) updated with shipped delta and remaining risk

## Phase 10 Planning Queue (Draft, 2026-04-26)

### NOW (Kickoff)
- [x] PR hygiene cleanup: remove generated artifacts from tracked diff (`.venv`, `dist`, `node_modules`) and tighten ignore policy.
- [x] Re-cut a review-safe PR with product-intent files only.
- [x] Lock merge checklist for phase-10 branch hygiene.

### NEXT (Hardening)
- [ ] Accessibility baseline: keyboard flow + focus-visible + contrast for entry, AnalogConsole, ArchitectConsole.
  - ✅ Entry: keyboard focus semantics + lockout live-region messaging
  - ✅ Console controls: stronger focus-visible treatment + ARIA state wiring
  - [ ] Final contrast verification pass (D amber and L cyan themes)
- [ ] Command matrix persistence and rollback-safe permission transitions.
- [ ] Add local/CI design-law guardrail checks (Comfortaa whitelist + token policy).

### LATER (Post-Hardening)
- [ ] Performance tuning by route (entry, consoles, vault views).
- [ ] Collaborator workflow expansion after permission model hardening is complete.

---

## Historical Log (Pre-Autoplan)
The sections below are preserved as session history and implementation archive.

## Phase 1: 7677 Ignition — Sovereign Infrastructure ✓
- [x] Create tasks/todo.md and tasks/lessons.md
- [x] Setup variables.css with Midnight Vault, Aged Stone, and Burnished Copper hex codes
- [x] Import Comfortaa (700) font and sharp Serif font for headers with high-kerning rules
- [x] Sovereignty Gate Logic — access codes 0528 / 7677 / 4096
- [x] Tier routing: D → Sun Console, L → Black Star, ANGI → Amethyst direct
- [x] Binary Flyby 3D slingshot entry animation
- [x] Pull Cord global isProtected state + CSS grayscale filter
- [x] Keplerian orbital physics (SpaceWindow.jsx + BinaryCore3D.jsx)
- [x] Spaghettification animation (MasterReel.jsx)
- [x] Nixie Tube metadata editor (TuneModal.jsx)
- [x] Studer Transport Bar UI (StuderTransportBar.jsx)
- [x] Saturn, Venus, Earth vaults with vinyl shelves + BPM rotation
- [x] Black Star Archive with EventHorizonLog (BlackStarConsole.jsx)

---

## Phase 2: Sovereign Architect Calibration — Shadow Gap Closure ✓
*Session: April 11, 2026 — Full 7-phase calibration pass*

### Shadow Gaps Identified via Audit
- [x] GAP 1 — Void Vector: streak aimed at screen center, not Black Star position
- [x] GAP 2 — Stroboscopic Shutter: CSS blur(), not true frame-aliasing moiré
- [x] GAP 3 — Chakra Color Dual-System Conflict: earth tones vs. true spectrum
- [x] GAP 4 — L's Console: passive archive log, not a full command bridge
- [x] GAP 5 — Eternal Registry: volatile React state, not persistent

### Implementations (7 Phases)

**Phase 1 — Chakra Color Calibration**
- [x] variables.css: `--void-chakra-*` true spectrum colors (Scarlet, Orange, Green, Violet, Indigo)
- [x] config.js: `VOID_CHAKRA_COLORS` map exported
- [x] MasterReel.jsx: `voidColor` prop (spectrum) separated from `planetColor` (ambient)

**Phase 2 — VaultWindow (Binary Core Porthole)**
- [x] VaultWindow.jsx: Three.js porthole — Sun + Black Star orbiting barycenter, always visible
- [x] VoidStreakOverlay.jsx: Prism streak from spine to Black Star + Inverse Bloom
- [x] useVaultVoid.js: Shared hook managing all void animation state + audio triggers
- [x] RecordShelf.jsx: VOID handle passes spine screen position to animation system
- [x] SaturnVault.jsx, VenusArchive.jsx, EarthSafe.jsx: All integrated

**Phase 3 — Stroboscopic Shutter Shader**
- [x] StrobeVinylCanvas.jsx: WebGL fragment shader — BPM-synced shutter aliasing, procedural vinyl grooves, Honey Amber light

**Phase 4 — Tape Hiss + Granular Pitch-Down**
- [x] vaultAudio.js: Pink noise (Paul Kellet), tape hiss on hover, granular pitch-down on void, 528Hz glow tone

**Phase 5 — Studer Transport Wiring**
- [x] transportAudio.js: BPM-synced transport tones — play, stop, rewind pitch drop, FF pitch rise, varispeed real-time
- [x] StuderTransportBar.jsx: All 5 buttons fire real Web Audio API events

**Phase 6 — Ghost Light Nebula**
- [x] SystemMap2D.jsx: Black Star indicator added; hover reveals multi-colored nebula from archive, archive count badge

**Phase 7 — Architect Console**
- [x] ArchitectConsole.jsx: Full command bridge — SystemMap2D, MasterClock, Pull Cord, ConduitSlider
- [x] Cold graphite/cyan theme (--arch-* variables): no amber, no warmth
- [x] EventHorizonPanel: slide-out sub-panel with restore access
- [x] App.jsx: 7677 now routes to ArchitectConsole (full bridge) not passive BlackStarConsole

### Verification
- [x] `npm run build` — clean build, zero errors
- [x] All 7 phases deployed to dist/

---

## REVIEW SECTION — Phase 2 Calibration

**What worked well:**
- Plan Mode + AskUserQuestion before implementation prevented all 5 shadow gap regressions
- `useVaultVoid` shared hook eliminated ~120 lines of duplication across 3 vault files
- `forwardRef + useImperativeHandle` on VaultWindow cleanly exposes `getBlackStarTarget()` without prop drilling
- Parallel Explore agents cut audit time in half

**Gaps still open (Phase 3 candidates):**
- Eternal Registry persistence (localStorage — deferred by decision, Phase 2 approved)
- MercuryStream vault not yet integrated with VaultWindow + void system
- AmethystVault not yet integrated with VaultWindow (different aesthetic — singing bowls, not vinyl)
- Tier B/C access enforcement at runtime (currently only coded, not enforced)
- 23-degree orbital tilt confirmed in SpaceWindow.jsx line 7 (`ORBITAL_TILT = Math.PI * 23 / 180`) — no gap

---

## Phase 3: Gap Closure — COMPLETE ✓
*Session: April 11, 2026*

- [x] Eternal Registry — localStorage persistence (`psc_eternal_registry` key, `SystemContext.jsx`)
- [x] MercuryStream vault — VaultWindow Binary Core porthole added (no void — no track data)
- [x] AmethystVault — VaultWindow + `useVaultVoid` + session-level VOID (crystal indigo streak)
- [x] Tier B/C session tokens — 4hr localStorage token, 3-attempt lockout with 30s cooldown, shake animation
- [x] Viewport transit accuracy — `kepler.js` + `orbitalClock.js` shared utils; SystemMap2D RAF reads SpaceWindow time

### Phase 3 Verification
- [x] `npm run build` — clean, zero errors
- [x] `architectArchive` initializes from localStorage on mount
- [x] AmethystVault sessions show VOID button on hover, streak fires to Black Star
- [x] Wrong code × 3 triggers `entry-shake` animation + 30s `LOCKED · Xs` display
- [x] Correct code writes `psc_session` token; reload skips gate

---

## Phase 4: Dynamic Registry + Permissions + Comments — COMPLETE ✓
*Session: April 11, 2026*

### Items Built
- [x] `src/utils/permissions.js` — `canVoid`, `canEdit`, `canComment` (tier-aware)
- [x] `src/state/SystemContext.jsx` — member + listener registries, enriched sessions, two-stage inbox pipeline, comment system
- [x] `src/entry/EntrySequence.jsx` — dynamic member lookup, enriched session writes, listener auto-approve
- [x] `src/entry/RequestAccessModal.jsx` — "REQUEST LISTENER ACCESS" (auto-approve / code 0000) + "COLLABORATE WITH THE COLLECTIVE" (3-step vetting pipeline)
- [x] `src/App.jsx` — `readOnly` + `voidAllowed` driven by permission functions for all vaults
- [x] `src/console/InboxPanel.jsx` — two-stage pipeline (L vets → D final-approves → personal code generated)
- [x] `src/console/MembersPanel.jsx` — MEMBERS tab (add member, reveal code) + LISTENERS tab (read-only)
- [x] `src/console/CommentPanel.jsx` — D + L comment inbox, grouped by planet, mark-read on open
- [x] `src/console/AnalogConsole.jsx` — wired MembersPanel + CommentPanel (D view)
- [x] `src/console/ArchitectConsole.jsx` — wired InboxPanel (L view) + MembersPanel + CommentPanel
- [x] `src/components/RecordShelf.jsx` — COMMENT handle + inline textarea (Tier B + A)
- [x] All vault components — `handleComment` wired, `onComment` passed to RecordShelf
- [x] `src/data/mercury.js` — 3 placeholder pre-recorded sets
- [x] `src/mercury/MercuryStream.jsx` — full rework: RecordShelf overlay, waveform ambient, useVaultVoid scarlet streak, StuderTransportBar

### Permission Matrix (Final)
| Tier | VOID | TUNE | COMMENT |
|---|---|---|---|
| A (D/L) | anywhere | anywhere | anywhere |
| B with planet | own planet | own planet | everywhere |
| B no planet | none | none | everywhere |
| Listener (0000) | none | none | none |

### Seeded Members
- Angi: code `4096`, planet `amethyst`, Tier B
- Jess B: code `1984`, planet `mars`, Tier B

### Phase 4 Verification
- [x] `npm run build` — clean, 1040 modules, zero errors
- [x] Three duplicate-code build errors caught and fixed (RecordShelf, AnalogConsole, RequestAccessModal)

---

## Phase 5: Performance + Accessibility + Responsive — COMPLETE ✓
*Session: April 11, 2026*

### Responsive / Mobile
- [x] `index.html` — `viewport-fit=cover` for safe-area insets on iOS
- [x] `index.html` — font preload for Comfortaa
- [x] `variables.css` — z-index scale, motion duration/easing tokens, shadow elevation, semantic accent colors, fluid `clamp()` typography, `env(safe-area-inset-*)` tokens
- [x] `index.css` — all `100vh` → `100svh` (8 instances); removed `backdrop-filter: blur()` from `body::after` (GPU repaint fix)
- [x] `App.css` — all `100vh` → `100svh` (9 instances); `monitor-flicker` 0.1s → 0.3s fix
- [x] `App.css` — GPU compositor: `will-change + contain + translateZ(0)` on starfield/corona/orbit/singularity layers
- [x] `App.css` — 4-state breakpoint cascade: pointer:coarse, hover:none, tablet (1023px), mobile (767px), narrow (479px)
- [x] `App.css` — mobile: cockpit reflows, console fixed bottom strip, panels → bottom sheets, BottomNav visible
- [x] `App.css` — touch targets 48px on buttons, 28px on void/comment handles, `scroll-snap + overscroll-behavior` on RecordShelf

### New Hooks + Utils
- [x] `src/utils/device.js` — `isTouchPrimary`, `hasHover`, `isLowEnd()`, `clampedDPR()`
- [x] `src/hooks/useBreakpoint.js` — reactive breakpoint with `isMobile/isTablet/isDesktop`
- [x] `src/hooks/useNetworkStatus.js` — reactive online/offline via `window` events

### New Components
- [x] `src/components/BottomNav.jsx` — 5-planet mobile nav bar (hidden at ≥768px)
- [x] `src/components/VaultSkeleton.jsx` — amber skeleton shimmer, `aria-busy="true"`
- [x] `src/components/VaultEmpty.jsx` — empty state with `role="status"` + `aria-live="polite"`

### App.jsx — Code Splitting + Progressive Enhancement
- [x] All vaults + Three.js scenes + consoles converted to `lazy()` + `Suspense`
- [x] `useReducedMotion` — cockpit entrance skips 2s cinematic at reduced-motion
- [x] `useNetworkStatus` — offline banner throughout all stages
- [x] `useBreakpoint` — `isMobile` gates BottomNav
- [x] Skip-nav link + `id="main-content"` on all stages
- [x] `renderVault` wraps each vault in `<Suspense fallback={<VaultSkeleton />}>`

### Accessibility
- [x] `index.css` — global `:focus-visible` amber phosphor ring; arch console cyan override
- [x] `index.css` — `@media (forced-colors: active)` Windows High Contrast support
- [x] `index.css` — `@media (prefers-reduced-motion: reduce)` — all ambient animations muted; structural transitions preserved at 150ms
- [x] `RecordShelf.jsx` — `role="list/listitem"`, `tabIndex`, `aria-label`, `aria-pressed`, `onKeyDown` (Enter/Space); VOID + COMMENT handles get `role="button"` + keyboard; comment form `aria-labelledby/describedby` + char count
- [x] `EntrySequence.jsx` — lockout `role="timer"` + `aria-live="polite"`
- [x] `AnalogConsole.jsx` — badge buttons: `title` → `aria-label`
- [x] `ListenerShell.jsx` — all vault imports converted to `lazy()` (fixes INEFFECTIVE_DYNAMIC_IMPORT warnings)

### SpaceWindow.jsx (Three.js quality tier)
- [x] `isLowEnd()` detected at module init (`LOW_END` constant)
- [x] Canvas: `dpr={LOW_END ? 1 : clampedDPR()}`, `antialias: !LOW_END`, `powerPreference: 'low-power'` on low-end
- [x] Stars count: 4000 → 1500 on low-end
- [x] EffectComposer/Bloom: skipped entirely on low-end

### Phase 5 Verification
- [x] `npm run build` — clean, 1045 modules, zero errors
- [x] `INEFFECTIVE_DYNAMIC_IMPORT` warnings eliminated (ListenerShell fix)
- [x] All vault chunks split correctly (individual JS files in dist/assets/)

---

## Phase 6: NASA Upgrade Plan — Sprint 2 (R2) ✓
*Session: April 12, 2026*

### R2 Scope
- [x] Amber phosphor monitor flicker tuned for cockpit readouts and viewscreen overlays

### Implementation
- [x] `src/App.css` — `monitor-flicker` keyframes refined with mid-phase phosphor decay state
- [x] `src/App.css` — `viewport-focus` now runs monitor flicker for active node/moon readouts
- [x] `src/App.css` — `divine-sessions-welcome` combines warmup sequence with subtle phosphor flicker
- [x] `src/App.css` — flicker applied consistently to `clock-frequency`, `clock-time`, `resonance-indicator`, `node-label`, `moon-focus`, `node-focus`, and `broadcast-overlay`

### Verification
- [x] `npm run build` — clean build, 1049 modules transformed, zero errors

### R3 Scope
- [x] Reduced-motion accessibility guard for Sprint 2 phosphor monitor effects

### R3 Implementation
- [x] `src/App.css` — added `@media (prefers-reduced-motion: reduce)` override to disable `monitor-flicker` animations for viewscreen and cockpit phosphor readouts

### R3 Verification
- [x] `npm run build` — clean build, 1049 modules transformed, zero errors

### R4 Scope
- [x] Build chunk strategy upgrade for the NASA Sprint 2 pipeline

### R4 Implementation
- [x] `vite.config.js` — added `rollupOptions.output.manualChunks` strategy for React, motion, and the 3D rendering stack
- [x] `vite.config.js` — refined vendor splitting into `three-core`, `r3f-core`, `r3f-drei`, and `postfx-vendor`
- [x] `vite.config.js` — set `chunkSizeWarningLimit` to `1200` to align warnings with intentional large post-processing bundle size

### R4 Verification
- [x] `npm run build` — clean build, 1049 modules transformed, no chunk warning emitted

### R5 Scope
- [x] High-contrast / forced-colors compatibility for Sprint 2 phosphor overlays

### R5 Implementation
- [x] `src/App.css` — added `@media (forced-colors: active)` overrides for viewscreen focus, welcome text, and cockpit readouts
- [x] `src/App.css` — disabled flicker/text-shadow in forced-colors to preserve readability and avoid phosphor artifacts in system high-contrast mode
- [x] `src/App.css` — aligned viewscreen border color with system `CanvasText`

### R5 Verification
- [x] `npm run build` — clean build, 1049 modules transformed, zero errors

### R6 Scope
- [x] Phosphor cadence unification and touch-device adaptation

### R6 Implementation
- [x] `src/App.css` — removed duplicate `broadcast-overlay` flicker declaration so all phosphor overlays share one cadence source
- [x] `src/App.css` — introduced `--phosphor-flicker-rate` and `--phosphor-flicker-rate-touch` tokens
- [x] `src/App.css` — added coarse-pointer/hover-none media override for slower flicker duration on touch-first devices

### R6 Verification
- [x] `npm run build` — clean build, 1049 modules transformed, zero errors

---

## Phase 6: NASA Upgrade Plan — Sprint 2 COMPLETE ✓

### Sprint 2 Outcomes
- [x] R2: Monitor phosphor realism pass
- [x] R3: Reduced-motion compliance
- [x] R4: Build chunking + vendor strategy stabilization
- [x] R5: Forced-colors accessibility compatibility
- [x] R6: Phosphor cadence unification + touch adaptation

### Phase 6 Review
- [x] Visual fidelity and accessibility now share one phosphor behavior model across default, reduced-motion, forced-colors, and touch contexts
- [x] Build pipeline produces stable chunk outputs with intentional vendor segmentation and warning noise removed
- [x] All Sprint 2 increments were validated by production builds after each grouped implementation

---

## Phase 9: Put In Stone (Next Session Start Here)
*Session lock: April 13, 2026*

- [ ] Execute D7 collaborator object system pass (schema + ingestion + grants + migration)
- [ ] Implement C1 command bus in `SystemContext` and route all console/vault actions through it
- [ ] Implement C2 state engine for command lifecycle (`idle/armed/confirming/executing/success/failure/timeout`)
- [ ] Implement C3 control matrix enforcement in D console, L console, and vault command rows
- [ ] Implement C4 destructive-command interlocks (double-confirm + timeout auto-cancel)
- [ ] Implement C5 command telemetry rail for operator visibility
- [ ] Implement C6 global command verb consistency audit and cleanup
- [ ] Implement C7 keyboard command palette fallback

---

## Phase 6: NASA Upgrade Plan — Sprint 3/4 COMPLETE ✓
*Session: April 12, 2026*

### R7 Scope
- [x] Sprint 4 empire node interaction hardening (mouse, touch, keyboard parity)

### R7 Implementation
- [x] `src/console/EmpireNode.jsx` — replaced stateful press timer with refs to prevent long-press/select race behavior
- [x] `src/console/EmpireNode.jsx` — fixed long-press flow so releasing after long-press no longer triggers an extra select event
- [x] `src/console/EmpireNode.jsx` — added keyboard support (`Enter`/`Space`), touch handlers, ARIA role/state, and descriptive labels

### R8 Scope
- [x] Sprint 3 binary core node selection accessibility

### R8 Implementation
- [x] `src/console/BinaryCore3D.jsx` — added DOM quick-select control group for Sun / Black Star so selection is available without canvas pointer interaction

### R9 Scope
- [x] Sprint 3/4 reduced-motion guard extension

### R9 Implementation
- [x] `src/App.css` — disabled empire node film-grain animation and control transitions for `prefers-reduced-motion`
- [x] `src/App.css` — suppressed singularity flash effect in reduced-motion context

### R10 Scope
- [x] Sprint 3/4 forced-colors and focus-visibility compliance

### R10 Implementation
- [x] `src/App.css` — added `:focus-visible` ring treatment for empire nodes and binary core controls
- [x] `src/App.css` — extended `forced-colors` compatibility to binary core labels, node labels/metadata, empire node bodies, and quick-select controls

---

## Phase 7: NASA Upgrade Plan (Claude Sprint 2 HUD) — COMPLETE ✓
*Session: April 12, 2026*

### R2 Scope — Mission Control radar redesign
- [x] `src/console/SystemMap2D.jsx` — radar sweep layer, active crosshair reticle, orbit micro labels, active id normalization
- [x] `src/console/SystemMap2D.css` — near-black matte radar surface, amber coordinate grid styling, radar sweep animation, compact mission-control styling

### R1 Scope — Telemetry HUD overlay
- [x] `src/components/TelemetryHUD.jsx` — new amber phosphor telemetry overlay with live orbital metrics
- [x] `src/console/Viewscreen.jsx` — mounted TelemetryHUD and wired hover/active planet feed

### R3 Scope — Planet readout slide-in panel
- [x] `src/components/PlanetReadout.jsx` — new right-edge telemetry panel with Keplerian data and action controls
- [x] `src/console/Viewscreen.jsx` — mounted PlanetReadout with mission session context

### R5 Scope — Mission status top strip
- [x] `src/components/MissionStatusBar.jsx` — new MET status strip with archived and active-vault counts
- [x] `src/console/Viewscreen.jsx` — mounted MissionStatusBar above the 3D viewport

### R12 Scope — Entry gate CRT amber upgrade
- [x] `src/entry/EntrySequence.jsx` — added mission top rail element in gate stack
- [x] `src/App.css` — upgraded singularity to radar ping, enhanced amber digit glow, and phosphor hint text treatment

### Verification
- [x] `npm run build` — clean build, 1052 modules transformed, zero errors

---

## Phase 10: Verification Sweep — April 13, 2026 ✓

### Scope
- [x] Re-validate the current working tree against the recorded Phase 9 state

### Verification
- [x] `npm run build` — clean build, 1052 modules transformed, build completed in 4.24s

### Review
- [x] Source tree is compiling successfully on the current local state
- [x] Repository remains intentionally dirty: large source changes plus regenerated `dist/` artifacts are present and uncommitted
- [x] No automated test suite exists beyond the placeholder `npm test` script, so production build is the only verified gate right now

---

## Phase 8: NASA Upgrade Plan (Claude Sprint 3) — COMPLETE ✓
*Session: April 12, 2026*

### R4 Scope — Orbital markers + velocity arrows
- [x] `src/three/SpaceWindow.jsx` — added perihelion/aphelion markers for each orbit and dynamic velocity vector arrows per planet

### R6 Scope — Trajectory arc preview on hover
- [x] `src/three/SpaceWindow.jsx` — added dashed half-period predictive trajectory preview for hovered planet

### R7 Scope — Approach vector readout during PlanetApproach
- [x] `src/three/PlanetApproach.jsx` — added live telemetry panel with approach vector distance interpolation, velocity interpolation, and orbit insertion countdown

### R11 Scope — MasterClock oscilloscope wave
- [x] `src/console/MasterClock.jsx` — replaced static resonance dot with animated SVG oscilloscope waveform
- [x] `src/App.css` — added oscilloscope visual treatment matching amber phosphor monitor language

### Verification
- [x] `npm run build` — clean build, 1052 modules transformed, zero errors

### Sprint 3/4 Verification
- [x] `npm run build` — clean build, 1049 modules transformed, zero errors

### Sprint 3/4 Outcomes
- [x] Binary core selection now has keyboard- and switch-accessible control paths
- [x] Empire node interaction semantics are consistent across pointer, touch, and keyboard input
- [x] Sprint 3/4 visuals now honor reduced-motion and forced-colors accessibility modes

---

## Phase 9: 0528 Entry To D Console Design — ACTIVE
*Recovered Baseline: April 13, 2026 (from `/home/codespace/.claude/plans/gleaming-sprouting-dragon.md`)*

### Mission Intent
- [x] Phase 9 is the first checkpoint in the new UI track: `0528` code entry → NASA-style first-seen animation → D console design progression

### Confirmed Operator Decisions
- [x] 30/70 vault split (top window / library wall)
- [x] D console direction: hardware readout + encoder dial (not holographic map-first)
- [x] Library wall direction: square file-cell model (not record spines)
- [x] Platform model: planets/moons are audio-file libraries by work type

### Current Step Status (Recovered)
- [x] Step 1 start completed: NASA-style first-seen astral entry animation path is present
- [x] Library wall visual direction started: warm wood-grid file-wall mock work exists (`src/components/RecordShelf.css`)
- [ ] D console redesign is not complete yet (hardware readout + encoder interaction still pending as primary control language)

### D-Series Plan (From Recovered Plan)
- [x] D1 — Replace map-centric interaction with hardware readout + encoder navigation
- [x] D2 — Enforce 30/70 layout system-wide across all vaults
- [x] D3 — Edit-mode top window behavior (live orbit + cancel void overlay)
- [x] D4 — Functional file-cell wall (navigation + readout sync)
- [x] D5 — Full Studer command pack: PAUSE, REC, admin row (ARM/COMMIT/SEAL/CLEAR)
- [x] D6 — Soul-chakra ownership language system-wide (chakra rail + sigil badge per cell)

### Completed This Session (April 17, 2026)
- [x] SolarFlare rebuilt: white strobe (150ms) → honey amber flood (650ms) bridge before AstralFlyby
- [x] AstralFlyby rebuilt: `t^2.5` velocity curve (ignition feel), star-streak overlay at 60%+, solar corona burst at 85%+, white-out flash → fade to D console
- [x] SystemContext: `animationsEnabled` boolean added, persisted to `psc_animations_enabled` localStorage
- [x] App.jsx: flyby login counter (`psc_flyby_count`), auto-skip after 3 logins or if animations disabled
- [x] AnalogConsole: `◉ ANIM ON / ○ ANIM OFF` toggle in POWER zone
- [x] Vault exit routing: D→console, L→architect, others→gallery-drift
- [x] RecordShelf.css: full purge of dead `.spine-*` rules → rebuilt as deep wood cubby wall (dark cell interior, amber radial wall lighting, wood lattice dividers, studio vignette)
- [x] App.css `.file-cell`: dark recess interior (#0d0804, inset cubby shadows), amber-warm text on dark, chakra glow on active
- [x] App.css: purged dead `.record-shelf` pine-shelf block + `.shelf-floor` dead code (old design)
- [x] Build: clean ✓ (1.98s)

### Open for Next Session — Complete Phase 9
- [ ] **N1** — Visual browser confirm: load dev server, verify cubby wall renders correctly in Saturn/Venus/Earth vaults
- [ ] **N2** — D7: Collaborator object system (schema + ingestion + grants) — `src/data/collaborators.js` + SystemContext wiring
- [ ] **N3** — Amethyst vault: replace bowl rings + session rows with file-cell cubby wall (matches all other vaults)
- [ ] **N4** — Saturn moons: each moon needs its own vault interior screen with file-cell wall
- [ ] **N5** — Venus upload: ID3 metadata auto-read → pre-fill title/artist/BPM fields in UploadModal on file select
- [ ] **N6** — REC voice comments: MediaRecorder → audio blob capture per selected cell, stored in comment thread
- [ ] **N7** — D console layout pass: hardware-inspired redesign (Neve fader rows, AKAI pad grid language, encoder zones) — D's studio reference images locked in decisions log
- [ ] **N8** — Pull Cord: high-contrast grayscale drain + Tier B/C/D/G severance (currently visual-only, no enforcement)
- [ ] **N9** — Push to feature branch `phase-9` for safe checkpoint before merging main

### Saved Follow-On (Post-Phase 9)
- [ ] Messaging: direct messaging, thread view, inbox/outbox, unread indicators, planet-scoped channels
- [ ] C1–C7: Console Controls Program (command bus + state engine + safety interlocks)

### Verification
- [x] `npm run build` — clean, 1.98s, zero errors (April 17, 2026)

## Design Review TODOs (from /plan-design-review — 2026-04-22)

- [ ] **DESIGN-1** — Define C7 command palette vocabulary: enumerate all commands, aliases, groupings (VAULT / ROSTER / SYSTEM), and autocomplete behavior. Do after C1 (command bus) is defined so vocabulary is canonical. Prevents palette from surfacing internal function names instead of user-facing command language.

- [ ] **DESIGN-2** — Define D7.2 prospect questionnaire fields: D + L decide together what questions applicants must answer. Request modal already stubbed for multi-field form (TBD fields). Unblock before D7.2 UI is finalized.

- [ ] **DESIGN-3** — ~~Run /plan-eng-review for L console (L0.1–L0.8) before shipping.~~ DONE (2026-04-22) — eng review complete, CLEAR.

## Eng Review TODOs (from /plan-eng-review — 2026-04-22)

**Build order locked — execute in this sequence:**

- [ ] **ENG-1** — L0.9: Remove `arch-viewscreen-zone` from ArchitectConsole.jsx (top 60% dead zone — viewer window deprecated). Also remove `ArchitectViewscreen` component. Reclaimed space becomes the full console surface for L0.3/L0.4.

- [ ] **ENG-2** — L0.1: Extend `variables.css` with L palette tokens. Add: `--arch-bg: #070a0d`, `--arch-phosphor: #00e5ff`, `--arch-phosphor-dim: rgba(0,229,255,0.20)`, `--arch-separator: #1a2530`. Verify none already exist first.

- [ ] **ENG-3** — L0.3: Refactor ROSTER zone in ArchitectConsole — replace MembersPanel card UI with a dense phosphor text table (`TIER | ID | HANDLE | STATUS | LAST SEEN`). No cards, no avatar circles, no role badges, no rounded corners. Monospace rows, cyan phosphor. Also add `SET CODE` field to member creation (kills `generateCode()` auto-random — codes must be manually meaningful).

- [ ] **ENG-4** — L0.4: Add CMD MATRIX zone to ArchitectConsole — interactive permission grid. Each cell is a toggle (grant/revoke). ARM required before committing any change (pre-C4 stub: button brightens when armed, COMMIT commits, CANCEL disarms).

- [ ] **ENG-5** — C1: Extend `dispatchCommand` in SystemContext.jsx:
  - Add handler map `{ [CMD.VOID_ITEM]: voidItem, [CMD.RESTORE_ITEM]: restoreItem, ... }` — dispatch() calls the handler, returns `{ success, error, result }` not a boolean
  - Add collaborator auth cross-check (1D gap): after `checkAuthorization(cmd, consoleOwner)` passes, if session is a collaborator, verify `canCollaboratorAccess(collab, vaultId)`
  - Add `commandLog` state, persist to `psc_command_log` in localStorage, cap at 500 entries (rotate oldest)
  - Expose `commandLog` in SystemContext value

- [ ] **ENG-6** — Manual auth regression (before C1 ships): test 4 paths: null owner → denied, D→RESTORE_ITEM → denied, L→RESTORE_ITEM → allowed, collaborator→VOID_ITEM → denied

### ENG Status: ALL COMPLETE ✓ (2026-04-23)
- ENG-1 through ENG-6 shipped clean. Build: 543 modules, 971ms, zero errors.

---

## Phase 10: Sovereign Platform Depth — ACTIVE
*Session start: 2026-04-23*

### Architecture Decisions Locked

**M³ tier naming** — canonical brand language, locked 2026-04-23:
- **Masters** = D + L (Tier A)
- **Members** = Tier B (planet holders)
- **Muses** = Tier C (featured artists, moon vault owners)

**Moon vaults** — double-locked safety deposit box model:
- Muse + D are the only two keys
- Nobody else enters unless D explicitly cuts a key for a peer or collaborator
- Interior UI completely unknown — goes to `/design-shotgun` when D is ready
- Brief: *"just out of reach — a double vault inside the vault"*

**Pull cord** — fate table:

| Element | Fate |
|---|---|
| Global `isProtected` grayscale | **REMOVED** — vestigial, no longer serves a purpose |
| Pull Cord in D's GOD MODE | **SURVIVES** — session logout / power-down only |
| Pull Cord in L's ArchitectConsole | **REMOVED** |
| Spaghettification void animation | **SURVIVES** — D's GOD MODE only, stays cinematic |
| EVENT HORIZON ARCHIVE | **SURVIVES** — D's console only |

**D console** — AKAI MPC III reference dropped. Neve fader row reference dropped. The frame:
> *"Master producer's private sanctum. Not the studio floor — the suite above it. 70s warmth, sovereign darkness. The person in this room made all the decisions before anyone else walked in."*
No code until design exists. Goes to `/design-consultation` → `/design-shotgun`.

---

### Build Order

```
P10-2 (D7 collaborator wiring)
  → P10-6 (moon vault access layer, depends on D7)
  → P10-8 (pull cord surgery)
  → P10-3 (Amethyst parity)
  → P10-5 (voice comments)
  → P10-4 (ID3 auto-read)
  → P10-1 (QA)
  → P10-7 (design session)
```

---

### Tasks

- [ ] **P10-2** — D7 Collaborator object system: `src/data/collaborators.js` schema (`name, planet, tier, grantedVaults[], moonGrants: { moonId, grantedBy, grantedAt }[], activeSince`). Wire into SystemContext: `collaborators` state, `addCollaborator`, `canCollaboratorAccess`. Data layer only — no UI yet.

- [ ] **P10-6** — Moon vault access layer (data only): double-key check in `canEnterVault` — moon vault requires `owner === 'D'` OR session matches the Muse OR explicit `moonGrants` entry. Locked-door placeholder render for denied access (no interior revealed). Depends on P10-2.

- [ ] **P10-8** — Pull cord surgery: strip `isProtected` from SystemContext, remove grayscale CSS from all surfaces, remove pull cord from ArchitectConsole (L). Move pull cord to D-only. Verify spaghettification still fires in MasterReel / AnalogConsole.

- [ ] **P10-3** — Amethyst vault interior: replace bowl rings + session rows with file-cell cubby wall. Same dark recess interior, amber radial lighting, wood lattice dividers. Parity with Saturn / Venus / Earth — no design decisions.

- [ ] **P10-5** — REC voice comments: MediaRecorder → audio blob per selected cell, stored in comment thread (`audioData` field already stubbed). Wire record/playback UI. Timed timestamp pins on track progress bar (Soundcloud-style).
  - *⚠ Open: access scope = full M³ (Masters + Members + Muses) or Masters + Members only?*

- [ ] **P10-4** — ID3 auto-read on upload: on audio file select in UploadModal, read ID3 metadata (`jsmediatags` or File API) and pre-fill title / artist / BPM. Add TAGS field (comma-delimited). Write access: Masters only.

- [ ] **P10-1** — QA sweep: load dev server, confirm cubby wall renders correctly in Saturn / Venus / Earth vaults. Visual browser pass — do last before calling phase complete.

- [ ] **P10-7** — D console design: run `/design-consultation` then `/design-shotgun`. No code written until design is locked. Inputs: UBC music production degree, 70s soul vibe, sovereign sanctum frame above.

---

### Dropped / Deferred (not dev tasks)

- **DESIGN-1** (C7 command palette vocabulary) — operator naming decision required before any code. Carry as open decision item.
- **DESIGN-2** (D7.2 questionnaire fields) — D + L decide together. Unblock before request modal UI is finalized.

---

### Open Decisions
- [ ] **P10-5 scope**: timed comments — full M³ or Masters + Members only?
