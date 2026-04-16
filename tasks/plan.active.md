# Active Plan — Phase 9 (0528 -> D Console Design)

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
- [ ] D7: Collaborator object system pass

## Put In Stone — Immediate Next Execution

### D7 Definition (Collaborator Object System)
- [ ] D7.1: Introduce unified collaborator object schema (member/listener/artist role, scopes, status, command grants)
- [ ] D7.2: Normalize collaborator ingestion paths (request modal, inbox approvals, manual add member)
- [ ] D7.3: Attach collaborator object to vault file ownership/comment events for auditability
- [ ] D7.4: Enforce collaborator command grants at runtime in D/L consoles and vault command rows
- [ ] D7.5: Add migration shim for existing localStorage records to new collaborator shape

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

## Acceptance
- 0528 path opens with intended first-seen NASA sequence
- D console uses hardware readout + encoder control language
- Vault wall is functional file-cell grid, not record-spine metaphor
- Player controls are implemented per selected option set
