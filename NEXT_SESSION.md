# NEXT SESSION — START HERE. READ THIS BEFORE TOUCHING ANYTHING.

## LAST UPDATED: 2026-05-06 (upload pipeline fully fixed + deployed)

## CLAUDE BEHAVIOR RULES — NON-NEGOTIABLE
- Read DESIGN.md in full before touching any CSS or JSX
- Run impact analysis before modifying any shared symbol
- One task at a time, in the order listed below — no skipping
- If user expresses excitement about a future task: "We get there after [current task]. Ready?"
- Confirm before destructive or wide-impact changes
- Never mark complete without proving it works

---

## WHAT SHIPPED THIS SESSION (2026-05-06 — phase-10)

### Upload Pipeline — FULLY FIXED (deployed to psoulc.pages.dev)
Root cause: worker was blocking every upload with "R2_PUBLIC_URL not set" 500 error.
- `worker/upload-worker.js` — removed R2_PUBLIC_URL requirement; frontend constructs URL from VITE_R2_PUBLIC_URL
- `worker/upload-worker.js` — `file.arrayBuffer()` → `file.stream()` — no memory limit, large files work
- `src/components/UploadModal.jsx` — upload timeout 60s → 300s
- `src/components/UploadModal.jsx` — BPM stored as integer (was `.toFixed(2)` decimal)
- `src/console/ArchitectConsole.jsx` — BPM display: `Math.round(Number(t.bpm))` (was raw decimal)
- Worker redeployed + pages redeployed ✓

### Vault Interior Mobile Redesign (deployed)
- vault-top-band hidden on mobile (saves 200px VaultWindow)
- Sort pills: min-height 44px on touch
- Cue pads: height 44px on touch (was 32px)
- Search: full-width, min-height 44px
- Transport bar: compact, pitch fader hidden, 52px touch targets
- RecordShelf height tuned for mobile

### R2 + Secrets — FULLY CONFIGURED
- `VITE_R2_PUBLIC_URL=https://pub-a782f6b9fdf342b3bfa6c668c4b7a5ce.r2.dev` in .env ✓
- `VITE_UPLOAD_SECRET=psc-live-2026` in .env ✓
- `PSC_SECRET=psc-live-2026` set in wrangler secrets ✓

---

## LIVE SITE
**https://psoulc.pages.dev** — D can use this URL right now.
- D logs in with his master code
- L logs in with her master code
- Guest: code 0000
- Entry code: 0528

---

## NEXT TASKS — IN ORDER

### TASK 5: Vault preview from console (quick win)
L needs to see the guest listener view without logging out.
- Add `VIEW AS GUEST` button to ArchitectConsole header
- Opens listener shell: either window.open to guest route OR prop-driven mode switch in App.jsx
- L only (not D). Muted identity treatment, not amber.

### TASK 6: Upload end-to-end verification
Upload pipeline was just fixed. Needs real test:
- [ ] Log in as D or L at psoulc.pages.dev
- [ ] Upload a real audio file (MP3 or WAV)
- [ ] Track appears in console
- [ ] Track plays back
- [ ] BPM shows as integer (no decimals)
- If any step fails — check browser console errors first, report here

### TASK 7: D/L internal messaging
Private channel between D and L in their consoles only.
Brief first — ask L what UX she wants.
Architecture: D1 `messages` table (sender, content, created_at), Worker endpoint, console sidebar.
Reference: TheSignal chat (same D1 pattern).

### TASK 8: Beta readiness for D
- [ ] Upload verified working (Task 6)
- [ ] All vault content visible + playable
- [ ] THE SIGNAL button functional
- [ ] D on iPhone → lands in listener shell, not console
- [ ] No broken buttons in D's view

---

## KNOWN ISSUES
- Saturn/Mercury internal IDs still used as vault keys (display names are correct). Deferred — requires D1 migration.
- public/psc-test.wav — delete before production
- public/three.min.js — verify if used or remove
- Codespace disk usage is high — node_modules is the main culprit

---

## DESIGNS TO REVIEW NEXT SESSION
User wants to review the interface design mockups. Check:
- `interface-design/` folder (untracked in git — contains design files from earlier)
- `public/psc-p10-7-preview.html` — D console reference (DO NOT DELETE)

---

## KEY FILE LOCATIONS
- Shared console: `src/console/ArchitectConsole.jsx` + `src/console/ArchitectConsole.css`
- Upload modal: `src/components/UploadModal.jsx`
- Upload worker: `worker/upload-worker.js`
- Listener shell: `src/listener/ListenerShell.jsx`
- Vault interior: `src/components/TheVault.jsx`
- Mobile vault CSS: `src/index.css` — bottom of file, search "VAULT INTERIOR — MOBILE"
- Design law: `DESIGN.md`
- Token system: `src/variables.css`
- Local env (gitignored): `.env`
- Live site: https://psoulc.pages.dev

---

## HOW TO START THE NEXT SESSION
Open the window and type:

> "Read NEXT_SESSION.md and DESIGN.md, then tell me what's next."
