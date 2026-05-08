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
