# PSC Universe — Lessons Learned

## Self-Improvement Loop (Protocol #3)
Captures patterns, mistakes, and corrections to prevent "Shadow Gaps" from repeating.

---

### Session: Phase 1 Ignition (April 2, 2026)

#### Typography Implementation
- **Lesson**: Always verify font imports and weights before implementation
- **Pattern**: Comfortaa 700 weight requires explicit font-weight declaration
- **Prevention**: Test font loading in isolation before integrating into components

#### Color Scheme Standards
- **Lesson**: Use CSS custom properties for all color definitions
- **Pattern**: Define semantic color names (midnight-vault, aged-stone, burnished-copper)
- **Prevention**: Create variables.css first, then reference in components

#### Component Architecture
- **Lesson**: Keep components minimalist and focused on single responsibilities
- **Pattern**: Sovereignty Gate should only handle access logic, not styling concerns
- **Prevention**: Separate logic from presentation layers

#### Void State Visibility Breach (April 2, 2026)
- **Root Cause**: Missing root route "/" in React Router configuration
- **Symptom**: Page rendered as solid black void with no content
- **Prevention**: Always include root route "/" when Entry/Home component exists

#### Duplicate Import PARSE_ERROR (April 2, 2026)
- **Root Cause**: Multiple edit sessions caused file corruption with duplicate React imports
- **Symptom**: Build fails with "Identifier `React` has already been declared"
- **Prevention**: Manual audit of import statements before every save

---

### Session: Phase 2 Sovereign Architect Calibration (April 11, 2026)

#### Always Run Build After Each Phase — Not Just At The End
- **Lesson**: The `transportAudio.js` stale import (`'./audioContext'`) was caught only at final build. Had we built after Phase 5, it would have been isolated immediately.
- **Rule**: `npm run build` after completing each phase, especially when creating new files with inter-module dependencies.
- **How to apply**: At the end of every phase that creates a new file or adds a new import, run the build and fix before moving on.

#### Use `forwardRef + useImperativeHandle` for 3D-to-DOM Position Bridging
- **Lesson**: VaultWindow needed to expose the Black Star's screen position to the streak animation. Passing a raw ref gives fragile DOM access. `useImperativeHandle` exposes a clean, named API (`getBlackStarTarget()`).
- **Rule**: When a child component needs to expose computed values (especially from 3D/canvas space) to a parent, use `forwardRef + useImperativeHandle` with a descriptive API — not raw DOM refs.
- **How to apply**: Any time you need canvas/Three.js coordinates in DOM space, define a named method on the imperative handle rather than exposing the canvas element directly.

#### Shared Hooks Eliminate Vault Boilerplate
- **Lesson**: SaturnVault, VenusArchive, and EarthSafe all needed identical void animation state (active, source, target, inverseBloom, pendingVoid). Writing it inline three times = 120+ lines of duplication and three places to fix bugs.
- **Rule**: When ≥2 components share the same stateful pattern (especially with side effects like audio), extract to a `useX` hook immediately.
- **How to apply**: Before copy-pasting state + logic to a second component, ask: "would this be a hook?" If yes, write the hook first.

#### Plan Mode + AskUserQuestion Before Architectural Decisions = Zero Regressions
- **Lesson**: The 5 Shadow Gap questions (void vector, strobe fidelity, chakra color system, L's console aesthetic, persistence strategy) were asked *before any code was written*. Every decision made in that session was implemented correctly on the first attempt — zero rework.
- **Rule**: For any decision that affects multiple files or has aesthetic/UX trade-offs, use Plan Mode to enumerate options and AskUserQuestion to get alignment before typing code.
- **How to apply**: If you find yourself about to write code but uncertain about a design choice, stop and ask. The cost of one question is always less than one rewrite.

#### Dual Color System Must Have Explicit Domain Boundaries
- **Lesson**: The PSC has two parallel color systems (warm earth tones for UI ambient, true spectrum for void events). Without explicit naming (`--chakra-*` vs. `--void-chakra-*`, `planetColor` vs. `voidColor` props), components will use whichever color they get and the distinction collapses silently.
- **Rule**: When two color systems coexist in one application, enforce domain separation at the variable name, prop name, and CSS variable name level — not just in comments.
- **How to apply**: Check: does the receiving component know *which system* this color belongs to? If not, rename to make it explicit.

#### Module-Level Mutable for 60fps Shared State (April 11, 2026)
- **Lesson**: Syncing SpaceWindow's orbital time to SystemMap2D at 60fps via React state (`setOrbitalTime`) would trigger a full re-render of every SystemContext consumer each frame — catastrophic.
- **Rule**: For high-frequency values shared between animation systems (RAF, useFrame), use a module-level mutable object (`export const orbitalClock = { t: 0 }`). Both systems read the same reference with zero React overhead.
- **How to apply**: Any time a Three.js `useFrame` or RAF needs to share its tick value with another animation system, use a shared module ref — not state, not context.

#### `loadRegistry()` as useState Initializer (April 11, 2026)
- **Lesson**: Calling `useState(loadFromLocalStorage())` evaluates the function on every render. `useState(loadFromLocalStorage)` (passing the function reference) evaluates it only once on mount.
- **Rule**: Always pass expensive initializers to `useState` as a function reference, not a call.
- **How to apply**: `useState(loadRegistry)` — not `useState(loadRegistry())`.

#### Parallel Subagents for Codebases You Haven't Read
- **Lesson**: Two parallel Explore agents covering the entire src/ took < 2 minutes and returned a complete audit. Sequential reading of 35 files would have consumed the context window and taken 10+ minutes.
- **Rule**: For an unknown or not-recently-read codebase, always launch 2-3 parallel Explore agents with different focus areas before writing a single line.
- **How to apply**: The question to ask is: "Do I know the current state of this code well enough to change it without breaking it?" If the answer is "partially" — spawn agents.

#### Don't Create a New File Without Checking If the Import Target Exists
- **Lesson**: `transportAudio.js` was written with `import { getCtx } from './audioContext'` pointing to a file that was never created (the local `ctx()` function was already defined in the same file). This compiled silently in development but failed the production build.
- **Rule**: Before writing any `import` statement for a local module, verify the target file exists (or that you're about to create it in the same session).
- **How to apply**: After writing a new file with local imports, grep for each import path and confirm the file is present before moving to the next task.

---

### Session: Phase 4 — Dynamic Registry + Permissions + Comments (April 11, 2026)

#### Edit Collisions — New Code Appended Rather Than Replacing Old Code
- **Lesson**: In three files (RecordShelf, AnalogConsole, RequestAccessModal), new code was added after `export default` in prior sessions, leaving both old and new versions in the file. The build caught two `multiple default exports` errors and one `return outside function` error.
- **Rule**: When rewriting a function in an existing file, always verify the file ends cleanly after the `export default` before moving on. If the file is long, read the last 10 lines explicitly.
- **How to apply**: After any significant Edit to an existing file, read lines around and after the `export default` to confirm there is no orphaned content trailing. Run `npm run build` to catch duplicates immediately.

#### `canVoid === canEdit` — Identical Logic, Two Named Exports
- **Lesson**: Tier B VOID and TUNE permissions are identical (own planet only). Three separate conditions (`readOnly`, `voidAllowed`) were originally planned but since they're always equal, the existing `readOnly ? undefined : handler` pattern already handles both — no `voidAllowed` prop needed.
- **Rule**: Before adding a new prop, verify it produces a different value from any existing prop at every call site. If values are always equal, the prop is redundant.
- **How to apply**: Check `canVoid(x) !== canEdit(x)` at every vault call site. If never true, reuse the existing prop.

#### File-By-File Edits for the Same Pattern Across Multiple Files — Do Round-By-Round
- **Lesson**: Adding `handleComment` + `onComment` to 5 vault files required two distinct edit types per file (inject function body, then add prop to JSX). Mixing both edits for the same file in one batch risks incorrect anchor strings after the first edit shifts line numbers.
- **Rule**: For multi-file edits with 2 changes per file, do Round 1 (all first changes) in parallel, then Round 2 (all second changes) in parallel. Within a single file, never send both edits simultaneously.
- **How to apply**: If editing file A requires change 1 then change 2 (where 2 depends on 1 having landed), always sequence those two as separate tool calls, but you can parallelize change 1 across all files at once.

#### Context Compression Causes "Appended" Bugs in Long Sessions
- **Lesson**: Across all three duplicate-code files, the pattern was new code prepended (or placed first) and old code surviving after it. This happens when a session writes new code but the prior session's edit that was supposed to remove the old code was lost to context compression.
- **Rule**: At session handoff (when summary is generated), note explicitly which files were partially rewritten and need their old function bodies removed. Verify all files on session resume before continuing.
- **How to apply**: After context compression, read the key modified files from the top to verify they're structurally clean (no duplicate exports, no orphaned return blocks). Don't assume prior session edits were complete.

---

### Session: Phase 5 — Performance + Accessibility + Responsive (April 11, 2026)

#### `lazy()` Code-Splitting Is Defeated by Static Imports Elsewhere
- **Lesson**: `App.jsx` used `lazy()` for all 6 vault components. Vite emitted `INEFFECTIVE_DYNAMIC_IMPORT` for all 6 because `ListenerShell.jsx` statically imported the same components. A module can only be code-split if ALL consumers import it dynamically.
- **Rule**: When converting a component to `lazy()`, grep for all other import sites of that component across the entire codebase. Every static import ruins the split.
- **How to apply**: After any `lazy()` conversion, run `grep -r "import.*ComponentName"` and convert any remaining static imports to `lazy()` + `Suspense` wrappers.

#### `100svh` for Mobile Viewport Height — Not `100vh`
- **Lesson**: `100vh` on mobile includes the collapsible browser chrome in its calculation, causing layout overflow when the address bar is visible. `100svh` (small viewport height) is always the safe minimum.
- **Rule**: Use `100svh` everywhere `100vh` is used for full-bleed mobile layouts. Only use `100dvh` (dynamic) if the UI should resize smoothly as the browser chrome appears/disappears.
- **How to apply**: Any time a component must fill the screen on mobile, use `100svh` (or `min-height: 100svh`) rather than `100vh`.

#### `backdrop-filter` on Full-Viewport `body::after` Causes Constant GPU Repaint
- **Lesson**: `body::after { backdrop-filter: blur(0.5px) }` applies a blur filter to the entire screen on every frame, even when nothing is animating. This forces constant compositor work and prevents any layer from being promoted to its own GPU texture.
- **Rule**: Never put `backdrop-filter` on a full-viewport overlay unless the blur is truly needed and changes dynamically. For static scanline/grain effects, use a CSS linear-gradient (same visual, zero compositor cost).
- **How to apply**: If a `backdrop-filter` is on an element larger than ~200×200px and never changes, replace it with a static gradient or pseudo-element pattern.

---

### Session: Phase 9 Reconciliation (April 13, 2026)

#### Don't Trust a Phase Header Without Reconciling Its Scope List
- **Lesson**: Phase 9 was marked complete even though its H-item numbering was sparse and several implied Sprint 4 items were never written into the tracker. The build was green, but the plan state was inaccurate.
- **Rule**: Never treat a phase as complete based only on a section header or build success. Reconcile the declared scope identifiers against the implemented items first.
- **How to apply**: If a phase uses numbered sub-items (`H1`, `H2`, etc.), grep the tracker for gaps before closing the phase. Either document the missing numbers as intentionally dropped or backfill them from verified code before moving on.

#### Session Continuity Must Use Plan Files, Not Chat Memory
- **Lesson**: Reconstructing status from ad-hoc chat memory drifted away from the user-approved D-series plan and created confusion about what Phase 9 meant.
- **Rule**: On reconnect/new session, first read `tasks/plan.active.md` and `tasks/plan.state.json` before interpreting `tasks/todo.md` or making scope claims.
- **How to apply**: Treat plan files as source of truth. If tracker wording conflicts with active plan state, reconcile tracker to plan immediately and log the correction.

