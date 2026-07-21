# PSC TODOS

Deferred work captured during plan reviews. Each item includes why it was deferred
and enough context to pick it up cold.

---

## Phase 11

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

---

### AudioContext leak + unthrottled waveform generation on upload

**Priority:** Medium
**Blocked by:** nothing — separate failure surface from the INTAKE batch-upload fix, deferred out of that PR to keep the diff right-sized.

**What:** `src/lib/waveformAnalyzer.js:222` creates `new AudioContext()` inside `analyzeAudio()` and never calls `.close()`. Separately, `ArchitectConsole.jsx`'s `psc:track-uploaded` listener (`handleUpload`, ~line 570-576) calls `ensureWaveformForTrack(newTrack, true)` directly and unthrottled, instead of going through the existing sequential `waveformQueueRef`/`runWaveformQueue` pipeline (~line 528) already used for the initial track-list load.

**Why:** Dropping several files in one batch fires one `psc:track-uploaded` event per upload, each triggering its own immediate, concurrent waveform decode — each opening a fresh, never-closed `AudioContext`. This is the confirmed cause of stacked `[PSC] waveform generation failed: EncodingError: Decoding failed` console errors observed during a multi-file drop session (2026-07-21).

**Fix:** (1) wrap the `decodeAudioData` call in `analyzeAudio()` in try/finally and close the context; (2) route `handleUpload`'s waveform trigger through `waveformQueueRef`/`runWaveformQueue` instead of calling `ensureWaveformForTrack` directly, so upload-time waveform generation is one-at-a-time regardless of batch size.

**Context:** Discovered while diagnosing a separate multi-file upload bug (INTAKE modal only reading `dataTransfer.files[0]`) that turned out to be the real cause of "only the first file uploads." This waveform issue is real but was a red herring for that bug — uploads succeed, only the post-upload waveform decode fails.

---

### Pre-existing: vault-switch-mid-batch and orphaned R2 multipart sessions

**Priority:** Low
**Blocked by:** nothing, but the second half touches `worker/upload-worker.js` — treat with extra care, prior worker changes have caused regressions (see `~/.gstack/projects/*/  *-main-design-20260527-*.md` constraints).

**What:** Two small, pre-existing gaps noticed during the INTAKE batch-upload eng review (2026-07-21):
1. If the destination vault `<select>` is changed while items are still queued/uploading, later items in the same batch go to the new vault — a single drop can silently split across two vaults. Already true today via console tab-switching; the INTAKE modal's dedicated dropdown just makes it more discoverable/likely to trigger.
2. If the browser closes or reloads mid-upload, the R2 multipart upload session (`worker/upload-worker.js` `/upload-init`/`/upload-part`/`/upload-complete`) is abandoned with no `abortMultipartUpload` call — an orphaned-storage leak in R2 over time.

**Why:** Neither is caused by the INTAKE fix, both are worth a deliberate look eventually. #2 is the more concrete one (real storage cost over time); #1 is a UX footgun.

**Context:** Flagged, not investigated further — didn't want to scope-creep the INTAKE batch-upload fix into worker territory. #2 needs a periodic cleanup job (e.g., a scheduled worker cron listing/aborting stale multipart uploads via R2's API) or accept the leak as negligible at current volume.
