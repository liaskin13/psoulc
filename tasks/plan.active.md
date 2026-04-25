# Active Plan — Phase 9 (0528 → D Console)

## NEXT SESSION HANDOFF — Copy/paste this to start fresh

```text
PSC — Pleasant Soul Collective. React 19 / Vite / Three.js / Framer Motion.
Repo: /workspaces/psoulc | Branch: phase-9

## What shipped — Phase 9 (as of 2026-04-22)

✓ D7 complete: collaborators.js (105L), InboxPanel.jsx (194L), MembersPanel.jsx (206L),
  ArchitectConsole.jsx (341L), SystemContext wiring — all in "Phase 9 complete" commit
✓ CMD registry in SystemContext + dispatchCommand stub (returns bool, no handler map yet)
✓ CLAUDE.md: gstack skill routing rules added
✓ Both reviews done:
  - /plan-design-review: CLEAN (3/10 → 8/10, 12 decisions)
  - /plan-eng-review: CLEAR (3 arch decisions, 2 quality findings, 0 blockers)

## Next — execute in this order (tasks/todo.md ENG-1 through ENG-6)

ENG-1. L0.9: Remove arch-viewscreen-zone + ArchitectViewscreen component (ArchitectConsole.jsx)
ENG-2. L0.1: Add L palette tokens to variables.css (--arch-bg, --arch-phosphor, --arch-phosphor-dim, --arch-separator)
ENG-3. L0.3: ROSTER — dense phosphor text table (TIER|ID|HANDLE|STATUS|LAST SEEN), no cards, add SET CODE field, kill generateCode()
ENG-4. L0.4: CMD MATRIX — interactive permission grid in ArchitectConsole
ENG-5. C1: Extend dispatchCommand — handler map + collaborator auth + commandLog→localStorage
ENG-6. Manual auth regression before C1 ships

## Key files

- L console: src/console/ArchitectConsole.jsx (341L) — ENG-1/3/4 touch this
- D console: src/console/AnalogConsole.jsx
- Members: src/console/MembersPanel.jsx (206L) — cards being replaced in ENG-3
- Inbox: src/console/InboxPanel.jsx (194L)
- State: src/state/SystemContext.jsx (455L) — ENG-5 touches this
- Collaborators: src/data/collaborators.js (105L)
- Styles: src/styles/variables.css — add L tokens in ENG-2
- Design canon: skills/psc-system/SKILL.md (load for any UI work)
- Plan: tasks/plan.active.md | Todos: tasks/todo.md

## Key decisions (locked)

- Viewer window REMOVED from both consoles — pure control surfaces
- ROSTER: dense phosphor text table, NO cards/avatars/rounded corners, cyan phosphor on #070a0d
- showVoidConfirm/showPowerConfirm floating modals: DO NOT port to L rebuild, replace in C4
- Codes manually entered (not auto-generated) — add SET CODE field in ENG-3
- dispatchCommand wraps existing functions, returns {success, error, result} (not bool)
- Command ARM state: local useCommandState() hook per console (not global)
- commandLog: localStorage ‘psc_command_log’, cap 500 entries, rotate oldest
- L palette: bg #070a0d, phosphor #00e5ff, separator #1a2530
- C2-C7 deferred to Phase 10
```

Source of truth: /home/codespace/.claude/plans/gleaming-sprouting-dragon.md

## Objective

Continue the D-series UI track from code input 0528 through NASA first-seen animation to final D console design language.

## Steps

- [x] Step 1: NASA-style first-seen astral entry baseline
- [x] Step 1a: Library wall visual mock direction established (wood-grid file wall)
- [x] D1: Hardware readout + encoder nav replaces map-first control
- [x] D2: Enforce 30/70 top-window + file-wall layout across vaults
- [x] D3: Top edit window behavior (live orbit + cancel void)
- [x] D4: File-cell wall functional wiring (selection/readout sync)
- [x] D5: Player controls package + admin commands
- [x] D6: Soul-chakra ownership language pass
- [x] D7: Collaborator object system pass (deferred — entry sequence prioritized first)

## Put In Stone — Immediate Next Execution

### L0: L Console — Architect Surface (PREREQUISITE for D7)

- [x] L0.2: `src/console/ArchitectConsole.jsx` exists (341 lines) — shipped in Phase 9
- [x] L0.8: Route 7677 → ArchitectConsole — done in App.jsx
- [ ] L0.1: Extend `variables.css` with L palette tokens (cyan `#00e5ff`, graphite `#070a0d`, separator `#1a2530`) — may already exist, verify
- [ ] L0.3: Refactor ROSTER zone — replace card UI in MembersPanel with dense phosphor text table (TIER | ID | HANDLE | STATUS | LAST SEEN), no avatars per design review
- [ ] L0.4: Add CMD MATRIX zone — interactive permission grid, ARM required before any toggle commits
- [ ] L0.5: Command palette overlay (C7) — deferred to Phase 10 (C2-C7 block)
- [ ] L0.6: Full audit log (C5) — deferred to Phase 10 (C2-C7 block)
- [ ] L0.7: Wire to command bus — deferred to Phase 10 (C1 ships first)
- [ ] L0.9: Remove viewscreen zone from ArchitectConsole (viewer window deprecated per design review)

### D7 Definition (Collaborator Object System) ✓ COMPLETE

- [x] D7.1: Collaborator schema — `src/data/collaborators.js` (105 lines), factory, access checks
- [x] D7.2: Ingestion paths — InboxPanel.jsx (194 lines), two-stage L→D vetting pipeline
- [x] D7.3: Attach to events — SystemContext wires makeCollaborator on member approval
- [x] D7.4: Enforce grants at runtime — canCollaboratorAccess used in SystemContext
- [x] D7.5: Migration shim — migrateToCollaborators in collaborators.js

### Console Controls Program (All Controls For All Things)

- [ ] C1: Build unified command bus in SystemContext (explore/tune/void/seal/exit/broadcast/restore)
- [ ] C2: Add command-state engine (idle/armed/confirming/executing/success/failure/timeout)
- [ ] C3: Add single source control matrix (who can do what, where, and in what state)
- [ ] C4: Add safety interlocks (double-confirm + auto-cancel timeout) for destructive commands
- [ ] C5: Add command telemetry rail (actor/target/action/time/result) visible in both D and L consoles
- [ ] C6: Standardize command language globally to one verb set (SEAL VAULT, EXIT SYSTEM, ARM, COMMIT, CANCEL)
- [ ] C7: Add keyboard command palette fallback for high-density control operation

## Backlog (Do Not Drop)

- [ ] Messaging capability to complement comments: direct thread(s), console inbox/outbox, unread state, and planet-scoped channels
- [ ] VOICE COMMENTS (REC button): recorded voice note capture per file — arms recording on selected cell, STOP commits — store as audio blob in comment thread (never been done in this space)
- [ ] Amethyst vault NEEDS shelf-based file cell wall (currently uses bowl rings + session rows, no RecordShelf)
- [ ] Saturn MOONS need shelf-based vaults (each moon is currently a spine in Saturn's wall without its own vault screen)

## Design Decisions (from /plan-design-review — 2026-04-22)

### IA Decisions

- **D7.2 Collaborator inbox placement:** Integrated into the **L console rail** (not D console). L is the Gatekeeper — all collaborator approvals flow through Architect. L console is a new, as-yet-undesigned surface. D proposes/creates Moons; L confirms membership.
- **L console is a new major surface** that needs full design spec before D7 implementation. Cold graphite/cyan palette (Black Star identity). L IS the user — laptop-first, must do all things from this console. Designer will propose layout; L retains final say.
- **L console proposed layout:** Two-zone — ROSTER (left, collaborator registry) + COMMAND MATRIX (right, who can do what + active command telemetry rail). Full keyboard control is first-class because L's instrument is their laptop.
- **VIEWER WINDOW REMOVED from consoles:** The top 30% porthole/viewport is no longer part of D or L console layout. Consoles are now fully control-surface layouts without a viewport window.

### Command State Visual Language (C2)

- 7 states map to amber phosphor displays: IDLE (dim), ARMED (steady bright), CONFIRMING (slow pulse), EXECUTING (rapid strobe/sweep), SUCCESS (brief green flash → back to amber), FAILURE (cold white/red flash), TIMEOUT (amber fade to dark)
- State labels: 7-segment LED font or monospace all-caps, e.g. `ARMED — SEAL VAULT`
- Each state: indicator dot + state label + command context sub-label

### Keyboard Command Palette (C7)

- **Activation:** Hotkey (backtick `` ` `` or `Cmd+K`) — full-screen CRT terminal overlay
- **L palette color:** Cyan phosphor on dark graphite (NOT amber — amber is D's exclusive palette)
- **D palette color:** Amber phosphor on matte black (existing console aesthetic)
- **Layout:** Full-screen or large overlay, monospace, autocomplete list below prompt
- **C7 is first-class for L, not a fallback** — L's instrument is laptop, keyboard control is primary

### Interaction States

#### Collaborator Request Modal (D7.2)

| State | What user sees |
| --- | --- |
| IDLE | Input open, copper border, access code field |
| SUBMITTING | Input locks, `TRANSMITTING...` in phosphor, no spinner |
| SUCCESS | Screen dims, single pulse (amber for D, cyan for L), `REQUEST RECEIVED. YOUR SIGNAL HAS BEEN LOGGED.` |
| FAILURE | `TRANSMISSION FAILED. TRY AGAIN.` — cold flash |
| PENDING (post-submit) | Silence. No visible state. The wait is intentional. |

Tone: this is applying to a private institution, not filling out a web form.

#### Safety Interlock Modal (C4) — double-confirm destructive commands

| State | What user sees |
| --- | --- |
| ARMED | Command button lights up (steady bright phosphor), `ARM` indicator |
| CONFIRMING | `COMMIT? [Y / CANCEL]` — cursor blinks, auto-cancel timer visible as phosphor countdown `[00:10]` |
| EXECUTING | Input locked, `EXECUTING...` strobe |
| SUCCESS | Brief green flash → back to idle state |
| FAILURE | Cold white/red flash, `COMMAND REJECTED` |
| TIMEOUT | Amber fades, `COMMAND CANCELLED — TIMEOUT`, returns to IDLE |

### User Journey — Emotional Arcs

#### VOID command (destructive — highest stakes)

| Step | User action | Emotional target | Design supports it via |
| --- | --- | --- | --- |
| 1 | Selects a track in vault | Ownership | Chakra rail + creator sigil on cell |
| 2 | Issues VOID | Gravity | ARM state — button brightens, silence before confirmation |
| 3 | CONFIRMING | Dread (intentional) | `COMMIT? [Y / CANCEL]` — countdown visible, no shortcut |
| 4 | EXECUTING | Irreversibility | Spaghettification animation — track stretches to Black Star |
| 5 | COMPLETE | Finality | Inverse bloom flash, silence, cell disappears |

#### Collaborator approval (L's primary act of power)

| Step | L action | Emotional target | Design supports it via |
| --- | --- | --- | --- |
| 1 | Opens ROSTER | Authority | Cold graphite panel, full roster visible at a glance |
| 2 | Reviews request | Discernment | Request row: who, what tier requested, timestamp — no noise |
| 3 | Issues GRANT | Weight | ARM → COMMIT — same interlock as destructive commands |
| 4 | Code generated | Ceremony | `ACCESS CODE ISSUED: [code]` — displayed once, then sealed |

### AI Slop Guards

- **ROSTER:** Dense phosphor text table. NO cards, NO avatar circles, NO role badges, NO rounded corners. Monospace rows: `TIER | ID | HANDLE | STATUS | LAST SEEN`. Cyan phosphor on dark graphite. Hard-edge separator lines only.
- **Keyboard palette:** Cyan phosphor on dark graphite (L) / amber phosphor on matte black (D). NOT white modal, NOT VS Code blue-highlight style. No drop shadows, no blur backdrop. Hard CRT frame.
- **Safety interlock:** NOT a browser-confirm-style dialog. The ARM→COMMIT sequence happens in-place on the console surface, not in a floating modal above everything else. The console itself transforms into the confirmation state.

### Design System — L Console Token Spec

The existing PSC system fully specifies D's palette but L's is underspecified. Locking in:

| Token | D (Sun / Artist) | L (Black Star / Architect) |
| --- | --- | --- |
| Background | `#0a0806` (warm near-black) | `#070a0d` (cold near-black) |
| Primary phosphor | Amber `#ffb347` | Cyan `#00e5ff` |
| Dim/idle state | Amber at 25% opacity | Cyan at 20% opacity |
| Text/labels | Amber monospace | Cyan monospace |
| Border/separator | Walnut grain + copper `#B87333` | Hard graphite `#1a2530` |
| Accent/warning | Brief green flash on SUCCESS | Brief white flash on SUCCESS |
| Danger/failure | Cold white or red flash | Cold white flash |
| Font stack | 7-segment / Courier monospace | Same — 7-segment / Courier |

Both consoles share: no rounded corners, no drop shadows, no gradients except phosphor glow.

### Responsive & Accessibility

- **Viewport:** Desktop-first. No mobile layout required. Min-width target: 1280px for L console.
- **Keyboard palette (C7):** Focus trap required — Tab stays inside palette while open, Escape closes. ARIA role `dialog` with `aria-label="Command Palette"`.
- **Safety interlock (C4):** Same focus trap. Confirmation input auto-focused when CONFIRMING state activates. Escape key triggers CANCEL (same as timeout).
- **Touch targets:** Not a priority (desktop-first, laptop keyboard as primary instrument for L).
- **Color contrast:** Cyan `#00e5ff` on `#070a0d` meets WCAG AA. Amber `#ffb347` on `#0a0806` meets WCAG AA. Verify before ship.

### Pass 7 — Resolved Design Decisions

- **C5 Telemetry split:** D gets a 3-line live amber ticker (last 3 events, no scroll). L gets a full scrollable audit log (timestamp-sorted, filterable by actor/command/target, cyan phosphor). Different information density for different roles.
- **D7.2 Access codes:** L (or D) manually enters a meaningful numeric code during the approval flow. `SET CODE` field appears in the ROSTER approval step. Code displayed once on approval screen, then sealed in the collaborator object. No auto-generation — codes have personal weight (1984, 4096, 0528, 7677).
- **C3 Control matrix:** Interactive. Each matrix cell is a toggle (grant/revoke). ARM required before committing any change — the C4 interlock applies to permission changes too, not just destructive commands.

### Deferred (not unresolved — decided to defer)

- **D7.2 Prospect Questionnaire:** Join requests will include a questionnaire. D + L define the questions together at a later date. Request modal must accommodate multi-field form — stub fields as TBD, do not hard-code a single input field.

## Acceptance

- 0528 path opens with intended first-seen NASA sequence
- D console uses hardware readout + encoder control language
- Vault wall is functional file-cell grid, not record-spine metaphor
- Player controls are implemented per selected option set

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
| --- | --- | --- | --- | --- | --- |
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR | 3 arch decisions, 2 quality findings, 0 blockers |
| Design Review | `/plan-design-review` | UI/UX gaps | 2 | CLEAN | score: 3/10 → 8/10, 12 decisions |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

**UNRESOLVED:** 0 decisions open (2 explicitly deferred with rationale)

**VERDICT:** Design review CLEAR. Eng review CLEAR. Ready to build.

## Eng Review Findings (plan-eng-review, 2026-04-22)

### Architecture Decisions Made

| ID | Decision | Detail |
| --- | --- | --- |
| 1A | dispatch() wraps existing functions | Backwards compatible. Direct calls (voidItem etc.) still work. dispatchCommand used for command-bus-aware calls. |
| 1B | Local useCommandState() hook per console | ARM state lives per-console, not global. Telemetry log in SystemContext (shared). |
| 1C | localStorage telemetry, capped at 500 | Key: `psc_command_log`. Rotating — oldest dropped when full. |

### Arch Findings (no decision needed — known work items)

- **1D — Auth gap**: `checkAuthorization()` ignores D7 collaborator tier. C1 must add collaborator cross-check via `getCollaboratorForSession()` + `canCollaboratorAccess()`.
- **1E — Floating modals**: `showVoidConfirm`/`showPowerConfirm` in ArchitectConsole are browser-confirm-style overlays. Tech debt for C4. Do NOT port them to the L console rebuild — replace with in-place ARM→COMMIT flow.
- **1F — L0.9 ordering**: `arch-viewscreen-zone` (60% of layout) must be removed BEFORE L0.3/L0.4 layout work. It's the space those zones will occupy.

### Code Quality Findings

- **2A — generateCode() contradicts manual-code decision**: MembersPanel's "+ ADD MEMBER" generates random 4-digit codes. Fix in L0.3: add `SET CODE` field, remove `generateCode()`.
- **2B — SystemContext debt**: At 455 lines, will hit ~550 after C1. Phase 10 work: extract `commandBus.js` module (CMD + checkAuthorization + dispatchCommand + commandLog).

### Implementation Order (locked)

1. L0.9 → L0.1 → L0.3 → L0.4 → C1
