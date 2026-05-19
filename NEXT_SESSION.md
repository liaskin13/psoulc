# NEXT SESSION — Start Here

## First Commands

```bash
git -C /workspaces/psoulc pull --ff-only
git -C /workspaces/psoulc status -sb
git -C /workspaces/psoulc log --oneline -5
```

## Current Baseline

- Branch: `main`
- Build: clean (457 modules, no errors — Sprint 1A+1B + INTAKE/search/build-vault shipped)
- Worker: deployed — `psc-upload-worker.psoulc.workers.dev`
- Pages: NOT YET deployed this session — run full 4-step deploy sequence before testing
- Working tree: UNCOMMITTED — commit + deploy before switching windows

---

## MANUAL STEP REQUIRED — Apply Migration 0005

The vault_config table does not exist in D1 yet. Apply it via the CF dashboard:

1. Go to Cloudflare dashboard → Workers & Pages → D1 → `psc-tracks`
2. Open the Console tab
3. Paste and run the contents of `worker/migrations/0005_add_vault_config.sql`

Until this is done:
- GET /vaults returns an empty array (fallback vaults show in listener shell)
- PUT /vaults/:id will fail (table missing)
- ArchitectConsole VAULTS panel will show empty

---

## What Shipped This Session (T1–T13 — Guest Flow Complete)

### T1 — residentBlueprint.js
Removed dead code: Jess B (code:"1984") and Janet (code:"J-1966"). Only D and L remain.

### T2 — worker/upload-worker.js
- Code generation: 4-digit numeric, padded (e.g. "0847"), RESERVED=["0528","7677","0000"]
- 0000 is a TEST CODE — bypass returns `{ tier:"MEMBERS", grantedTo:"TEST" }` — **REMOVE BEFORE LAUNCH**
- Removed `identityColor` from /redeem response
- Added GET /vaults (public: vaults with ≥1 published track)
- Added PUT /vaults/:id (auth required, upsert vault_config)

### T3 — EntrySequence.jsx
- async `attempt()` tries residentBlueprint first, falls back to `redeemCode()` on miss
- LEN=4, digits only — 4-cell input unchanged for beta
- Shows "VERIFYING" during async, "CODE EXPIRED" for 410, "ACCESS DENIED" otherwise

### T4 — ListenerShell.jsx (hooks violation fixed)
- All hooks (useCallback, 2× useEffect) now run before conditional CodeGate return
- Signal poll skips while CodeGate is active

### T5 — CodeGate loading state
- "LOADING" → "VERIFYING"
- Glow: rgba(20,220,20,0.08) → rgba(230,230,230,0.04) — achromatic pre-auth

### T6 — CodeGate error state
- Removed "CURATED BY D" from error screen
- Added CLOSE button (god-btn) → window.history.back() + window.close()

### T7 — Welcome interstitial + persistent header name
- After CodeGate success: full-screen overlay (WELCOME / grantedTo / CURATED BY D), 1.2s hold, 400ms fade
- grantedTo persists in header as `.listener-header-guest` (8px, rgba white 0.25)

### T8 — Remove DPWallpaper from shell
- DPWallpaper removed from ListenerShell main return (kept in CodeGate)
- Shell background is pure --void

### T9 — EXIT → CLOSE for code guests
- When `code` prop set: button shows "CLOSE", calls window.history.back() + window.close()

### T10 — iPhone safe area insets
- `.listener-header`: calc(4px + env(safe-area-inset-top)) padding
- `.listener-dock`: env(safe-area-inset-bottom) padding
- index.html viewport-fit=cover was already present

### T11 — Vault accent colors (config.js)
- venus (MIXES): #14dc14 (Serato green)
- saturn (ORIGINAL MUSIC): null (achromatic)
- mercury (LIVE SETS): #cc2200 (record red)
- LOCKBOX_CODES preserved — lockboxes stay

### T12 — Dynamic vault list
- LISTENER_VAULTS_FALLBACK used during fetch
- GET /vaults fetched on mount, replaces fallback
- selectedVaultId as string state, selectedVault derived via .find()
- Null color handled gracefully in JSX and CSS

### T13 — ArchitectConsole vault config panel
- VAULTS button in Zone B
- Per-vault: label, color (blank=achromatic), visibility toggle, copy line, SAVE
- GET /vaults (authenticated) + PUT /vaults/:id wired

---

## Pending Tasks (Next Session)

### IMMEDIATE (before any real guest gets a code)
1. **Apply migration 0005** — CF dashboard D1 console — vault_config table
2. **Apply migration 0006** — CF dashboard D1 console — `ALTER TABLE tracks ADD COLUMN cue_labels TEXT DEFAULT NULL` (D-bank cue label persistence)
3. **Remove 0000 test bypass** — `worker/upload-worker.js`, search `TEST CODE`, delete the early-return block
4. **Add rate limiting to /redeem** — 5 attempts per IP per minute via Cloudflare rate limiting rule (prevents brute-force of 4-digit codes; 10k combinations crackable in hours without this)
5. **Verify R2 audio URLs** — confirm tracks require auth to stream, not publicly accessible by raw URL; if public, add signed URL expiry

### CROWN JEWEL FEATURES (what makes PSC unlike anything else)
These 5 features are PSC-exclusive — no other music platform does them:

1. **SPRINT 2 — Multi-Version Release Chain** ← highest priority feature
   ROUGH → MIXED → MASTERED, each a separate file, tier-gated access at each stage.
   D advances tracks along the chain. No other platform treats a track as an evolving artifact.
   Requires schema change + new upload flow.

2. **Track Readiness Score** — pre-publish AI quality gate
   Waveform quality + metadata completeness + version state → green/amber/red scorecard.
   No other platform runs a pre-publish gate for independent artist catalog.

3. **Track Vibe Score** — single energy fingerprint per track
   LOW/MID/HIGH energy reading from waveformData math (no AI). Vibe color tint in library cells.
   D scans his library and knows at a glance which tracks are weapons vs journey music.
   No other platform gives artists a "vibe fingerprint" of their own catalog.

4. **Release Scheduler** — "drop this Friday midnight" in 10 seconds
   Upload → set schedule → done. Worker promotes the track at scheduled time automatically.

5. **Production Timeline / Ledger** — immutable timestamped log per track
   Every state change (uploaded, mixed, mastered, published, retracted) recorded with timestamp.
   No other platform gives the artist an audit trail of their own creative history.

### VAULT EDIT MODAL
D/L double-clicks a vault tab → ContextStrip body opens with edit options (label, color, visibility, copy link).
Currently VAULTS is a right-side overlay panel — replace with inline context body.

### BUTTON/FIELD AUDIT
Every button categorized: working / stub (empty handler) / missing feature / dead code.
Run as Explore agent. Many stubs exist from earlier sessions.

### D1 DATABASE BACKUP
No backup exists. If a migration corrupts the DB, all track metadata is lost (audio files survive in R2 but become anonymous blobs).
One-time setup: nightly D1 export to R2 or GitHub. 30-minute task, prevents catastrophic loss.

### DESIGN REVIEW
Run `/design-review` after audio confirmed working on D's machine.

### UPLOAD WORKS — CONFIRMED
D has successfully uploaded 5 mixes through the console. Upload auth uses PSC-Secret embedded in
the console client — viewer prop (D vs L) controls UI features shown, not upload auth.
This is the correct and intended behavior.

---

## Test Checklist After 0005 Migration

- [ ] uoyni.com?code=0000 → CodeGate shows VERIFYING (pulsing) → welcome overlay → listening room
- [ ] uoyni.com?code=9999 → CodeGate shows "THIS LINK DOESN'T EXIST"
- [ ] Vault dock shows D's real vaults (not fallback) after migration applied
- [ ] VAULTS panel in console saves label/color/copy changes
- [ ] EXIT shows "CLOSE" for code guests, standard EXIT for L
- [ ] iPhone: no overlap with Dynamic Island or home indicator

---

## REMOVE BEFORE PRODUCTION LAUNCH

- **0000 test bypass** in `worker/upload-worker.js` around the `/redeem` handler
  Search: `TEST CODE` comment — delete the 0000 early-return block

---

## Key Files

| File | Last Changed | What |
|------|-------------|------|
| src/data/residentBlueprint.js | T1 | D + L only |
| worker/upload-worker.js | T2, T12 | 4-digit codes, GET/PUT /vaults |
| worker/migrations/0005_add_vault_config.sql | T12 | vault_config table — NEEDS APPLYING |
| src/entry/EntrySequence.jsx | T3 | /redeem fallback |
| src/listener/ListenerShell.jsx | T4–T9, T12 | guest flow complete |
| src/index.css | T5, T6, T7, T10 | CodeGate + listener styles |
| src/config.js | T11 | vault accent colors, lockboxes preserved |
| src/console/ArchitectConsole.jsx | T13 | vault config panel |
| src/console/ArchitectConsole.css | T13 | vault config styles |
| src/lib/accessCodes.js | new | redeemCode(), generateCode() |
