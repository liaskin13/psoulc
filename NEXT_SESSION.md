# NEXT SESSION — START HERE. READ THIS BEFORE TOUCHING ANYTHING.

## LAST UPDATED: 2026-05-06 (impeccable audit + ListenerShell rebuild + DPWallpaper extraction)

## CLAUDE BEHAVIOR RULES — NON-NEGOTIABLE
- Read DESIGN.md in full before touching any CSS or JSX
- Run impact analysis before modifying any shared symbol
- One task at a time, in the order listed below — no skipping
- If user expresses excitement about a future task: "We get there after [current task]. Ready?"
- Confirm before destructive or wide-impact changes
- Never mark complete without proving it works

---

## CURRENT AUDIT SCORE: ~18/20 (Good)
Last audit: 2026-05-06. All P0/P1 fixed. Remaining: P3 sort pill touch targets in vault.

---

## WHAT SHIPPED THIS SESSION (2026-05-06)
- impeccable audit run: 11/20 → 18/20
- All focus ring fixes (outline:none → :focus:not(:focus-visible))
- backdrop-filter eliminated everywhere
- prefers-reduced-motion guards on all rAF/setInterval animation loops
- Framer Motion blur transitions removed
- Console mobile guard (Masters on iPhone → listener view, not dead end)
- DPWallpaper extracted to src/components/DPWallpaper.jsx (shared by Entry, TheSignal, ListenerShell)
- ListenerShell fully rebuilt: single-viewport, no scroll, living monogram canvas background,
  bottom dock vault switcher, full-width OPEN CTA, SIGNAL banner, mobile-first 390px
- public/ cleaned: 14 old design HTML variants deleted (were being served publicly)
- skills/ zips deleted (blender.zip, frontend-design.zip, ui-ux-pro-max.zip)
- Harden P2 fixes: inbox-close aria-label, CommentPanel #111 to var(--void), RecordShelf rgba to var(--error-text)

---

## ARCHITECTURE TRUTH — READ THIS
The D console and L console are THE SAME COMPONENT: src/console/ArchitectConsole.jsx.
- stage === "architect" renders ArchitectConsole for L (no viewer prop)
- stage === "console" renders ArchitectConsole with viewer="D" prop
- Identity: data-theme="d-soul" (green) vs data-theme="l-architect" (cyan) via --identity CSS var
- D-specific CSS: .architect-console--d class in ArchitectConsole.css
- CONSEQUENCE: Any structural/layout fix to ArchitectConsole affects BOTH consoles.

---

## NEXT TASKS — IN ORDER

### TASK 1: Console layout fix (BOTH consoles, one component)
Problems reported by L:
- Top half of console is mostly empty (wasted space)
- Bottom half has content cut off / not accessible
- Weird bright white bar bottom-left (likely BottomNav or scrollbar rendering on desktop)
Approach: $impeccable craft — shape first, then implement.
Reference: public/psc-p10-7-preview.html is the locked D console design reference.
Fix once in ArchitectConsole.jsx/.css — applies to both D and L automatically.

### TASK 2: Wire dead buttons in console
Audit which buttons exist and have no handlers. Map gaps in ArchitectConsole.jsx.
Do this in the same $impeccable craft session as Task 1.

### TASK 3: Upload functionality restoration
UploadModal is present and lazy-loaded. Worker endpoint exists. onIntake is wired in App.jsx.
Test manually in browser first. Use $impeccable harden if UI has gaps; use /investigate if backend failing.

### TASK 4: Cyan scope reduction on L's console
NOT a color change — cyan stays as L's identity color.
Problem: cyan appearing in more than 3 places (should only be: SIGNAL button, active track accent, BPM/Key).
Audit ArchitectConsole.css for every --arch-accent / --arch-phosphor / --identity usage.
Reduce to exactly 3 identity points. CSS-only change, safe targeted edit.

### TASK 5: D/L internal messaging (new feature)
Private channel between D and L visible only in Master consoles.
Requires shape brief first, then backend (D1 table) + console UI in both views.
Slim implementation: message thread in console sidebar, similar to TheSignal chat architecture.

### TASK 6: Guest vault interior on mobile
ListenerShell lobby is done. The vault INTERIOR (TheVault, SaturnVault, MercuryStream)
as seen by a guest on iPhone has not been audited.
Run $impeccable audit targeting vault views at 390px.
Fix: sort pill touch targets (P3 — min-height: 44px under pointer: coarse).

### TASK 7: Beta testing readiness for D
Before D tests, verify:
- Upload flow working end-to-end
- All vault content visible and playable
- THE SIGNAL button functional
- No broken/dead buttons in D's view
- D on iPhone lands in listener shell, not console
- Deploy to psoulc.pages.dev and verify live

---

## KNOWN ISSUES (not blocking beta)
- Sort pills in vault view sub-44px on mobile (P3)
- public/psc-test.wav — test file, delete before production
- public/three.min.js — check if used or can be removed
- skills/ subfolders (blender-astro, frontend-design, psc-system, superpowers-main, ui-ux-pro-max)
  audit if active, delete unused

---

## KEY FILE LOCATIONS
- Shared console: src/console/ArchitectConsole.jsx + src/console/ArchitectConsole.css
- Console routing: src/App.jsx lines 98-113 (handleIgnite), 218-254 (architect), 286-344 (D console)
- Listener shell: src/listener/ListenerShell.jsx (fully rebuilt this session)
- DPWallpaper: src/components/DPWallpaper.jsx (shared — do not move again)
- D console reference: public/psc-p10-7-preview.html (DO NOT DELETE)
- Design law: DESIGN.md (read in full before any visual change)
- Token system: src/variables.css
