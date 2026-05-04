# PSC TODOS

Deferred work captured during plan reviews. Each item includes why it was deferred
and enough context to pick it up cold.

---

## Phase 11

### Drag-and-drop track reorder within vault sections
**Priority:** Medium
**Blocked by:** Phase 10 (position column + sections must exist first)

Track ordering in Phase 10 defaults to upload order (stored in the `position` column,
set at insert time). Manual drag-reorder was explicitly out of Phase 10 scope (~30 min
estimate grew to "more scope than it's worth right now").

When picking this up: use `@dnd-kit/sortable` (lightest React DnD lib, no global
drag context needed). On drop, recalculate `position` for affected rows and batch-update
Supabase. The `position` column is already in the schema — this is purely a UI + update
layer.

**Files to touch:** `SaturnVault.jsx`, `lib/tracks.js` (add `updateTrackPosition()`).

---

### Test suite — Vitest baseline
**Priority:** High
**Blocked by:** nothing (can start any time after Phase 10)

Phase 10 ships with zero automated tests. Build verification is the only gate. This
is acceptable for Phase 10 (D+L internal only), but any refactoring after this
point is invisible until it visually breaks.

Minimum viable test baseline:
- `lib/tracks.js` — unit tests for `uploadTrack()`, `getAudioUrl()` (now async),
  `fetchVaultTracks()` error path (should return [], not throw)
- `src/state/SystemContext.jsx` — `dispatchCommand()` with authorized vs unauthorized
  caller, `loadVaultTracks()` side effect from CMD.UPLOAD_TRACK handler
- `src/components/UploadModal.jsx` — format validation (WAV/AIFF/MP3 accepted,
  others rejected), size validation (>200MB rejected)

Set up: `bun add -d vitest @testing-library/react`. No Playwright/E2E yet — unit tests
first.

---

---

## Phase 10 — Captured from plan-eng-review (2026-05-01)

### Orphan file cleanup in upload worker
**Priority:** DONE — implemented in worker
**Blocked by:** nothing

If R2 `put()` succeeds but the D1 `tracks` insert fails, the worker already deletes the
orphaned R2 object (`await env.PSC_AUDIO.delete(key)`) before throwing. Worker handles
this case correctly as of the Phase 10 waveform/worker commit.

---

### Pagination / infinite scroll for vault
**Priority:** Low
**Blocked by:** nothing (implement when track count approaches 200+)

`fetchVaultTracks()` does an unbounded SELECT. Fine at 50 tracks, problematic at 500+.

Add `LIMIT 100 ORDER BY created_at DESC` and an offset/cursor-based load-more. The vault
component shows a "Load more" button or infinite scroll trigger at the bottom.

---

### AnalogConsole.jsx — holding screen
**Priority:** High (before D's first login)
**Blocked by:** nothing

`AnalogConsole.jsx` is currently a cursor/spotlight stub with no console UI. If D logs in
before P10-7 is built, he sees a blank screen with a cursor effect. Add a minimal holding
screen: black background, `dp` seal centered, "YOUR CONSOLE IS BEING BUILT" in Chakra Petch,
amber glow. One file, ~30 lines.

---

### Replace prompt() dialogs in App.jsx
**Priority:** High (before D sees his console)
**Blocked by:** nothing

`handleNodeLongPress()` in `App.jsx` uses native `window.prompt()` and `window.alert()`.
These are browser-native dialogs — wrong design language for PSC. Replace with an in-UI
modal (can reuse the existing confirm modal pattern from VoidConfirm). Before D's first
login.

**Files:** `src/App.jsx` — handleNodeLongPress handler.

---

### Tags field — Phase 11
**Priority:** Low
**Blocked by:** Phase 10 completion

Tags were dropped from UploadModal for Phase 10 (data was silently dropped — not passed
to Supabase). Phase 11 implementation:
- Add `tags text[]` column to Supabase `tracks` table
- Wire through `uploadTrack()` in `src/lib/tracks.js`
- Restore tags input to UploadModal
- Add tag-based filtering to TheVault.jsx

---

## Implementation Decisions (pending)

### Voice comment signed URL TTL strategy
**Context:** Audio tracks use 1-week TTL with graceful onerror handling. Voice comments
are shorter-lived and more transient in nature — the right TTL and refresh strategy
may differ.

**Options to evaluate during Item 2 implementation:**
- Same as tracks: 1-week TTL, graceful onerror message
- Shorter TTL (e.g., 1hr) with automatic re-sign on onerror (more complex but voice
  comments are accessed in shorter, active collaboration sessions)
- Generate signed URLs on-demand per play click (lazy, avoids TTL issue entirely but
  adds 100-200ms latency per play)

**Resolve during:** Item 2 (voice comments) implementation in Phase 10.
