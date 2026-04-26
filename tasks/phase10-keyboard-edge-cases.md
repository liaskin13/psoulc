# Phase 10 Keyboard Walkthrough + Edge Cases

Date: 2026-04-26
Route tested: Entry (7677) -> Architect console -> CMD MATRIX
Scope: keyboard-only traversal, focus order, announcement behavior, contrast sanity notes

## Quick Keyboard-Only Walkthrough Script

1. Open entry and keep hands off pointer.
2. Type 7677 and press Enter.
3. Press Tab until CMD MATRIX toggle receives focus.
4. Press Enter to open CMD MATRIX.
5. Press Tab to ARM and press Enter.
6. Press Tab through matrix cells.
7. Press Enter on one permission cell.
8. Shift+Tab to COMMIT and press Enter.
9. Tab to ROLLBACK and press Enter.
10. Press Escape to close active surface.

## Findings

1. Fixed: Entry routing regression sent L users to legacy console path.
- Severity: High
- Root cause: Entry ignition callback did not pass tier.
- Status: Fixed in src/entry/EntrySequence.jsx

2. Matrix toggle default-state bug.
- Severity: High
- Repro: ARM matrix, toggle a default-enabled permission (for A/B tier).
- Expected: First toggle flips enabled -> disabled.
- Observed (before fix): toggle stayed enabled due missing tier-default baseline in toggle logic.
- Status: Fixed in src/console/ArchitectConsole.jsx via src/console/matrixState.js

3. Announcement gap when arming matrix.
- Severity: Medium
- Repro: Open CMD MATRIX and activate ARM.
- Expected: Polite status update that cells are unlocked.
- Observed (before fix): no explicit live announcement.
- Status: Fixed in src/console/ArchitectConsole.jsx

4. Panel focus containment.
- Severity: Medium
- Repro: Open CMD MATRIX, tab repeatedly.
- Observed: Focus can leave matrix panel to skip-nav/other controls; no focus trap.
- Status: Open (logged). This is acceptable for non-modal panel semantics but should be reviewed for operator ergonomics.

5. Contrast note for decorative entry mark.
- Severity: Low
- Observed: New maison subline is intentionally low-contrast black-on-black luxury treatment.
- Status: Accepted (decorative only, aria-hidden). No interactive impact.

## Matrix Rollback Smoke Coverage

- Added pure matrix state helpers in src/console/matrixState.js
- Added smoke harness: scripts/matrix-rollback-smoke.mjs
- Added npm script: npm run test:matrix-smoke
- Coverage checks:
  - default tier permission baseline
  - first toggle correctness for default-enabled permissions
  - commit snapshot/history behavior
  - rollback restores previous committed state
