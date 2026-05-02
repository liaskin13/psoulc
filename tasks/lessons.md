# PSC Universe — Lessons Learned

---

### ⛔ ROOT CAUSE OF RECURRING SPACE-LANGUAGE REGRESSIONS (April 26, 2026)

**Why this kept happening every single session:**

The code contradicted the design docs. Every session, an AI reads both — and the *code* wins over the doc. When the codebase had `PLANETS = ['mercury', 'venus', 'mars', 'amethyst']`, `import MarsVault`, `import SystemMap2D`, `kepler.js`, and `orbit-path` CSS classes, the AI concluded these were valid active patterns — regardless of what DESIGN.md said in a "Scrapped Concepts" section.

**The permanent fix (done 2026-04-26):**

All of it was deleted. The code now matches the docs. See DESIGN.md's ⛔ HARD STOPS section for the full list.

**Never again:**
- Do not re-add Mars or Amethyst vaults under any name or ID.
- Do not re-add Space Mono under any circumstances.
- Do not re-add SystemMap2D, HolographicMap, BinaryCore, EmpireNode, kepler.js, orbitalClock.js.
- Do not add orbital rings, warp animations, galaxy flyby, or any space/astronomical UI.
- DESIGN.md § "HARD STOPS" is authoritative. Read it before touching any vault, font, or nav component.

---

### Session: Phase 10 Regression Guard (April 26, 2026)

#### Active Surface Drift Is a Process Failure, Not a One-Off Bug

- **Root Cause**: Legacy space-era language remained in active UI components (`ArchitectConsole` route and copy) and there was no failing design-law check for banned display phrases in active files.
- **Rule**: When DESIGN.md bans a language family (for example space-themed vocabulary), enforce it in CI/local guardrails for active UI files. Do not rely on memory or manual review.
- **How to apply**: Keep a narrow banned-display-phrase check in `scripts/check-design-law.sh` scoped to active surface files (`App.jsx`, `EntrySequence.jsx`, `ArchitectConsole.jsx`) and fail fast on prohibited phrases.

## Agent Routing Calibration Log

### Session: Architect Console Contract Lock (May 2, 2026)

- **Lesson**: When L asks for Serato-familiar controls, implement from the explicit keep/drop contract in `tasks/plan.active.md:10-24` before any visual polish.
- **Rule**: Do not ship `ArchitectConsole` changes without a keep/drop audit pass: 1) kept controls present, 2) dropped controls absent, 3) direct D↔L dialogue box present in both consoles, 4) all three signature animations still active.
- **Enforcement checklist**:
	- `DirectLinePanel` mounted in both `ArchitectConsole` and `AnalogConsole`.
	- `arch-standing-wave`, `arch-scan-line`/`arch-row-ignite`, and magnetic `arch-tab-glider` transitions remain in `ArchitectConsole.css`.
	- Build passes and no planet names are rendered in L console UI text.

Use this template when an intent routes to the wrong custom agent.

Template entry:

- Date: YYYY-MM-DD
- Prompt (short):
- Expected Agent:
- Actual Agent:
- Root Cause:
- Description Tuning Applied:
- Status: open

Seed entries (2026-04-23):

- Date: 2026-04-23 | Prompt (short): "ship this" | Expected Agent: PSC Ship | Actual Agent: PSC Builder | Root Cause: Builder and Ship both had strong "ship" language, no explicit ship trigger block in Ship | Description Tuning Applied: Added explicit ship trigger phrases in Ship and narrowed Builder to implementation verbs | Status: tuned
- Date: 2026-04-23 | Prompt (short): "why is this broken" | Expected Agent: PSC Debug Perf | Actual Agent: PSC Builder | Root Cause: Generic fix/build verbs in Builder dominated routing confidence | Description Tuning Applied: Added explicit debug root-cause phrases and troubleshooting aliases in Debug Perf | Status: tuned
- Date: 2026-04-23 | Prompt (short): "make this look better" | Expected Agent: PSC Design | Actual Agent: PSC Builder | Root Cause: Design prompt lacked short natural-language aliases | Description Tuning Applied: Added short visual polish and redesign trigger phrases in Design | Status: tuned
- Date: 2026-04-23 | Prompt (short): "check if ready to merge" | Expected Agent: PSC Review | Actual Agent: PSC Ship | Root Cause: Merge/release wording overlapped without explicit review-gate command aliases | Description Tuning Applied: Added review-specific merge-readiness aliases in Review | Status: tuned
- Date: 2026-04-23 | Prompt (short): "permission audit this" | Expected Agent: PSC Security | Actual Agent: PSC Review | Root Cause: Security-specific trigger vocabulary was too broad and less command-like | Description Tuning Applied: Added explicit security, trust-boundary, and permission-audit trigger phrases in Security | Status: tuned
- Date: 2026-04-23 | Prompt (short): "security review this" | Expected Agent: PSC Security | Actual Agent: PSC Review | Root Cause: Review and Security both carried overlapping risk language in discovery text | Description Tuning Applied: Removed dedicated security-audit phrasing from Review and made Security explicitly dedicated owner | Status: tuned
- Date: 2026-04-23 | Prompt (short): "why is this broken" | Expected Agent: PSC Debug Perf | Actual Agent: PSC Builder | Root Cause: Builder still retained overlapping unblock/hotfix implementation language with diagnosis-like intent | Description Tuning Applied: Removed overlap terms from Builder and added explicit Builder negative trigger for root-cause/crash/perf diagnosis | Status: tuned

Monthly Prompt Pruning Pass:

- Schedule: First week of each month.
- Inputs: Latest 10-20 prompts from routing calibration entries.
- Steps: Mark prompts that misrouted more than once.
- Steps: Remove stale or overlapping trigger phrases causing false positives.
- Steps: Add 2-5 high-signal phrases for each agent based on real prompts.
- Steps: Re-check user-invocable settings and keep only 1-2 agents visible.
- Completion Criteria: At least 80% of sampled prompts route to expected agent on first pass.

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

---

### Session: Phase 9 Vault Wall Rewrite (April 17, 2026)

#### CSS Class Mismatch — Dead Stylesheets Are Silent

- **Root Cause**: RecordShelf.css was written for `.spine` class names. JSX was later updated to render `.file-cell` classes. The two were never reconciled. Result: 200+ lines of CSS that never applied to anything — cells rendered as completely unstyled divs.
- **Rule**: When renaming JSX class names, grep the companion CSS file immediately and rename all matching selectors in the same commit. Never leave a CSS file whose selector names don’t match any rendered JSX.
- **How to apply**: After any JSX className refactor, run `grep -r 'old-class-name' src/` to find orphaned CSS. If it returns zero matches in JSX, the CSS is dead.

#### Two CSS Blocks for the Same Component = One Will Be Wrong

- **Root Cause**: `.record-shelf` container styles existed in both `RecordShelf.css` AND `App.css`. The App.css version was the old pine-shelf design that was never removed when RecordShelf.css was updated.
- **Rule**: Each component’s primary styles live in one place. If a component has a dedicated `.css` file, App.css should not also contain a block for its root class. Audit for duplicates before starting a visual redesign.
- **How to apply**: Before rewriting any component’s CSS, `grep -r '.component-root-class' src/` and delete ALL matches that aren’t in the canonical file.
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

---

### Session: Phases 6–8 — Design Canon, Tier Naming, Vault Redesign (April 17, 2026)

#### Stale Design Docs Are a Confidence Trap

- **Lesson**: `CLAUDE.md` had wrong planet labels (missing Mars), blank aesthetic fields, outdated tier structure, and a "record shelf" vault description that had been redesigned 4 days earlier (April 13). None of this was caught proactively — the user had to flag it.
- **Rule**: At the start of any session that touches UI, vaults, or access control, read the canonical design doc (`vault/architecture/SYSTEM_DIRECTIVE.md`) and cross-check it against the plan log (`tasks/plan.log.ndjson`) for recent decisions that may have overridden it.
- **How to apply**: Before any design implementation task, run a grep for the component name in `plan.log.ndjson`. If a D-series entry exists that postdates the design doc, the log wins.

#### Vault Redesign Was in the Plan Log, Not the Design Doc

- **Lesson**: The record shelf → file-cell wall redesign happened on April 13 (D4-A: "converted record wall to file-cell interface") but was never reflected in `CLAUDE.md`. When asked about vault interior, the agent described the old record shelf because it only read the design doc.
- **Rule**: The plan log (`tasks/plan.log.ndjson`) is the ground truth for "what is actually built." The design doc describes intent; the plan log describes decisions made during implementation. When they conflict, the log wins.
- **How to apply**: Whenever verifying a visual or structural design detail, grep `plan.log.ndjson` for the relevant component or section before trusting the spec file.

#### Name Iterations Cost Context — Offer a Shortlist, Not Open-Ended Brainstorm

- **Lesson**: Naming Tier D ("The Destined") took multiple rounds across different aesthetic directions (cosmic, future-facing, legacy-honoring). Each round consumed context and required the user to evaluate and redirect.
- **Rule**: When asked to name something, offer 4–6 options in a single message with one-line rationale each, covering clearly distinct aesthetic directions. Let the user pick or riff — don't wait for feedback before generating more options.
- **How to apply**: Never generate one name and wait. Never generate 10+ names in a wall. The target is 4–6 options, grouped by vibe, in one message.

#### Tier Structure Had to Be Corrected Twice — Clarify the Full Shape Before Writing Anything

- **Lesson**: The tier system was revised twice in one session: first to add "The Destined" (self-submit tier), then again when Tier C ("Potential Collaborators") was wrong and needed to be split into Featured Artists vs. The Destined. Both corrections happened after the agent had already written content.
- **Rule**: When the access tier structure is involved, always confirm the full tier list (every level, name, who assigns, how they're onboarded) before writing a single line of spec or code.
- **How to apply**: Ask one clarifying question that covers the full shape: "Can you confirm all tiers top to bottom with who assigns each?" Accept no partial answers. Write nothing until the complete shape is confirmed.

#### Tier C Definition Requires Two Roles — Don't Flatten to One

- **Lesson**: Tier C (Featured Artists) involves two distinct actions from two people: D creates the Moon, L finds and invites the artist. The first draft described it as a single action by one person and had to be corrected.
- **Rule**: For any tier that involves a multi-step or multi-person process, describe all roles and steps explicitly — never flatten to one actor.
- **How to apply**: When writing tier definitions, ask: "Does this action require more than one person?" If yes, name all actors and their distinct contributions in the definition.

#### Space Themes and Chakra Terminology Are Scrapped — Never Use Them

- **Lesson**: Design shotgun variants introduced orbital imagery (variant C) and a "CHAKRA" column (variant D). Both were wrong. These concepts were discarded from the PSC design canon before any code was written.
- **Rule**: Never introduce space aesthetics, astronomical metaphors, or chakra terminology in any design output — mockups, components, HTML previews, copy, or specs. The PSC aesthetic is Achromatic Brutalist Futurism + Artist Identity Layer (DESIGN.md is authoritative).
- **How to apply**: Before generating any design variant or UI element, ask: can this trace directly to DESIGN.md or SYSTEM_DIRECTIVE.md? If not, it doesn't belong.

---

#### CLAUDE.md Must Be Audited at Session Start if Any Structural Work Is Planned

- **Lesson**: An entire session was spent correcting `CLAUDE.md` content that was demonstrably wrong. Had the agent audited the file at session start (cross-checking planets, tiers, vault description against the plan log), the corrections would have been caught before any user effort was spent flagging them.
- **Rule**: If the session involves architectural planning, design spec work, or anything touching `CLAUDE.md` or `SYSTEM_DIRECTIVE.md`, read those files and cross-check key facts (planet list, tier names, vault description, recent D-series log entries) before responding to any request.
- **How to apply**: Session start checklist (from `CLAUDE.md`) already requires reading lessons and `plan.active.md`. Add: if task touches design canon, also read `SYSTEM_DIRECTIVE.md` and grep `plan.log.ndjson` for entries from the last 7 days.

---

### Session: Phase 10 Hardening (April 26, 2026)

#### Tooling Assumption Drift — Guardrails Must Run Without rg

- **Lesson**: `scripts/check-design-law.sh` initially hard-failed in environments without `rg`, blocking preflight despite valid code.
- **Rule**: Validation scripts must gracefully fallback to standard `grep` when `rg` is missing.
- **How to apply**: For source scans, implement dual-path search (`rg` when available, `grep -RsnE` fallback) and only fail when neither exists.

#### Shell Quoting in PR Comments — Avoid Inline Backticks in Terminal Commands

- **Lesson**: Posting a PR comment via `gh pr comment --body` with unescaped markdown tokens can trigger shell execution (`tabIndex: command not found`, `:focus-visible: command not found`).
- **Rule**: For long/mixed-content comments, avoid backticks in terminal inline strings or use a heredoc/file payload.
- **How to apply**: Prefer plain text in `--body` when speed matters, or use `gh pr comment --body-file <file>` for markdown-safe formatting.
