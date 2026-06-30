# Plan: Batch Upload Bug Fixes

## Context

The drag & drop batch upload feature shipped in commit `d6af921`. The upload pipeline itself is functional — files reach R2, tracks land in D1, `uploaded_by` is attributed correctly when D uses D's console (`viewer="D"`). D has not tested it yet.

Two bugs were found in code review that will degrade the experience:
- Uploads run sequentially (1 at a time) despite the queue being designed for 2 concurrent
- Every upload triggers 2 library refreshes instead of 1 (double Worker round-trip)

A third issue is an architectural smell (not a user-facing bug) that should be cleaned up in the same pass.

---

## Bug 1 — False concurrency

**File:** `src/hooks/useDragDropBatch.js:37,41`

**Problem:** `processingRef` is a single boolean. When upload 1 starts, the ref is set to `true`. The `useEffect` fires again (queue state changed when item was marked "uploading"), immediately returns because the ref is `true`, and upload 2 never starts. Despite `CONCURRENT_UPLOADS = 2`, the queue runs 1 file at a time — serially.

**Fix (corrected from original plan):** Remove the `processingRef` entirely. Do NOT introduce a replacement ref. The `uploadingCount` check from queue state is the correct and sufficient concurrency ceiling guard. Once item 1 is marked "uploading" via `setQueue`, the next effect run reads `uploadingCount = 1` and starts item 2 if under the cap. No ref needed.

```js
// Before
const processingRef = useRef(false);
useEffect(() => {
  if (processingRef.current) return;  // ← THIS is the bug
  const uploadingCount = queue.filter((i) => i.status === "uploading").length;
  if (uploadingCount >= CONCURRENT_UPLOADS) return;
  const nextPending = queue.find((i) => i.status === "pending");
  if (!nextPending) return;
  processingRef.current = true;
  // ... start upload
  // finally: processingRef.current = false;
}, [queue, activeLibVault, consoleOwner]);

// After — ref gone entirely
useEffect(() => {
  const uploadingCount = queue.filter((i) => i.status === "uploading").length;
  if (uploadingCount >= CONCURRENT_UPLOADS) return;
  const nextPending = queue.find((i) => i.status === "pending");
  if (!nextPending) return;
  // ... start upload (no ref manipulation needed)
}, [queue, activeLibVault, consoleOwner]);
```

The `uploadingCount` check self-enforces the cap: each started upload immediately marks its item "uploading" before the async work begins, so the next effect run sees the correct count.

---

## Bug 2 — Missing dispatch with detail + redundant dispatch without detail

**Files:** `src/lib/tracks.js:185,205`, `src/hooks/useDragDropBatch.js:59-81`

**Problem — two parts:**

1. **`tracks.js` fires without detail.** `uploadTrack()` dispatches `psc:track-uploaded` at lines 185 and 205 with no `detail` payload. `handleUpload` in ArchitectConsole calls `loadTracks()` on it but skips `ensureWaveformForTrack` (no track data). This means waveform generation is never auto-triggered by single-file uploads either.

2. **Batch hook discards the result and fires nothing.** After `7c957ad` removed the hook's dispatch (it was trying to fix a double-trigger OOM), the hook calls `await uploadTrack(...)` with no assignment and has no dispatch at all (line 81 comment). So batch uploads: trigger `loadTracks()` once (via tracks.js), but never trigger `ensureWaveformForTrack`. Waveform generation does not happen automatically after batch upload.

**Root cause history:** `d6af921` (batch upload) had BOTH dispatches — hook with `{detail: result}` AND tracks.js without detail. Double `handleUpload` → double `ensureWaveformForTrack` → two concurrent analyses of the same large WAV → OOM. `7c957ad` removed the hook's dispatch to stop the double-fire, but that was the wrong removal. The tracks.js dispatch (no detail) is the one that should have been removed.

**Fix:**
1. Capture `uploadTrack()` return value in the hook: `const result = await uploadTrack(...)`
2. After success, dispatch from the hook WITH detail: `window.dispatchEvent(new CustomEvent("psc:track-uploaded", { detail: result }))`
3. Remove the no-detail dispatch from `tracks.js` at **both line 185 (production) and line 205 (dev)**

**Corrected impact math:** `fetchAllTracks()` is a single `/tracks` Worker GET. Before fix: tracks.js fires 1 event per upload → 1 GET, no waveform. After fix: hook fires 1 event with detail → 1 GET + waveform gen. Correct behavior.

**Why safe for UploadModal:** `UploadModal.handleSubmit` calls `loadVaultTracks` explicitly after `uploadTrack()` returns — does not depend on `psc:track-uploaded` for library refresh. Removing the event from `uploadTrack()` does not break the modal flow.

**Bonus fix:** The UploadModal waveform gap (noted in TODOs) can also be closed by adding the same detail-carrying dispatch to `UploadModal.handleSubmit` after upload completes — separate PR, listed in TODOs.

---

## Bug 3 — Architectural smell: `viewer` prop as `uploaded_by`

**File:** `src/hooks/useDragDropBatch.js:33,68`

**Problem:** The hook accepts `consoleOwner` as a parameter and receives `viewer` from the call site. `UploadModal` does this correctly by calling `useSystem().consoleOwner` directly. The batch hook bypasses the auth system and trusts the caller.

Today this is not user-facing: App.jsx correctly passes `viewer="D"` for D's console. But it's one missed prop away from attributing all D's uploads to L.

**Fix:** Remove the `consoleOwner` parameter from `useDragDropBatch`. Call `useSystem()` inside the hook. Remove `consoleOwner` from the call site in `ArchitectConsole.jsx`.

**Null guard required:** `useSystem().consoleOwner` can be `null` if the session hasn't resolved. The current `viewer` prop defaulted to `"L"`, never null. Add a guard: if `!consoleOwner` return early from the upload (don't start without a known owner).

```js
// Before
export function useDragDropBatch(activeLibVault, consoleOwner) { ... }
// called as: useDragDropBatch(activeLibVault, viewer)

// After
export function useDragDropBatch(activeLibVault) {
  const { consoleOwner } = useSystem();
  // ... in the upload IIFE:
  if (!consoleOwner) return; // guard before upload starts
}
// called as: useDragDropBatch(activeLibVault)
```

---

## Files to change

| File | Change |
|------|--------|
| `src/hooks/useDragDropBatch.js` | Remove processingRef entirely; remove `consoleOwner` param; add `useSystem` import; call `useSystem()` inside; add null guard before setQueue |
| `src/lib/tracks.js` | Remove no-detail `psc:track-uploaded` dispatch at lines 185 AND 205 |
| `src/console/ArchitectConsole.jsx` | Remove `viewer` from `useDragDropBatch` call |
| `src/components/UploadModal.jsx` | Production path: capture `uploadTrack()` return value, dispatch `psc:track-uploaded` with detail — MUST land in same PR as tracks.js removal |

---

## Verification

1. Drop 3 files into the queue — confirm 2 show "UPLOADING" simultaneously, 3rd stays "PENDING"
2. Watch browser network tab — each completed batch upload should trigger exactly 1 `/tracks` GET (not 2)
3. After batch upload, confirm track appears in library with correct `uploaded_by` and waveform generation starts automatically
4. After single UploadModal upload (production path), confirm track appears in library and waveform generation starts — this verifies the UploadModal dispatch addition
5. Drop a non-audio file (e.g. .pdf) — confirm it is filtered out, no queue entry created
6. Confirm `uploaded_by` is "D" in D's console (verifies Bug 3 fix)

---

## What is NOT changing

- Worker: no changes
- R2 multipart upload: no changes
- D1 schema: no changes
- `UploadModal`: no changes
- `BatchUploadQueue` UI: no changes
- Auth / viewer routing: no changes

---

## What already exists (reused by this plan)

- `uploadTrack()` in `src/lib/tracks.js` — the 3-step multipart upload (no changes to logic)
- `psc:track-uploaded` CustomEvent pattern — `handleUpload` in ArchitectConsole already handles the detail-carrying version (calls `ensureWaveformForTrack` when `e.detail` has a track); the hook just needs to capture the result and dispatch it
- `handleUpload` listener in `ArchitectConsole` — already wired for both `loadTracks()` and `ensureWaveformForTrack()`; no changes needed
- `useSystem().consoleOwner` — already used by `UploadModal`; the hook just needs to call it too

---

## NOT in scope

- `AUDIO_EXTENSIONS` / `isAudioFileCandidate` DRY cleanup — duplicated between `useDragDropBatch.js` and `UploadModal.jsx`; correct fix but touches UploadModal, separate PR
- UploadModal waveform gen gap — single-file uploads via UploadModal never trigger `ensureWaveformForTrack`; pre-existing, separate issue
- Debouncing `loadTracks()` across batch uploads — 50 uploads = 50 refreshes = 200 Worker GETs; acceptable now, optimization for later
- Test infrastructure — zero test coverage on the batch hook; worth adding but a separate effort

---

## Test Coverage Diagram

```
CODE PATHS                                            USER FLOWS
[~] src/lib/tracks.js                                [+] Batch drop → queue → upload
  ├── uploadTrack() multipart                          ├── [GAP] 2 files → both start concurrently
  │   ├── [GAP] dispatch removal regression            ├── [GAP] Error → RETRY re-queues correctly
  │   └── [★  TESTED] getAudioUrl — tracks.test.js     └── [GAP] Dismiss removes item from queue
[~] src/hooks/useDragDropBatch.js                    [+] Edge cases
  ├── useEffect auto-process                           ├── [GAP] Non-audio file filtered out
  │   ├── [GAP] uploadingCount >= cap → waits          └── [GAP] consoleOwner=null → no upload
  │   ├── [GAP] 2 uploads run concurrently
  │   ├── [GAP] upload success → dispatch + done
  │   └── [GAP] upload error → error state
  ├── addFiles()
  │   ├── [GAP] valid audio passes filter
  │   └── [GAP] ID3 failure → filename fallback
  ├── retry() [GAP]
  └── dismiss() [GAP]

COVERAGE: 1/14 paths tested (7%)  |  Code: 1/9 (11%)  |  User flows: 0/5 (0%)
GAPS: 13 — all unit tests (concurrency best tested with vi.fakeTimers + vi.fn on uploadTrack)
Note: tests for uploadTrack() were removed in commit 0af6c81 — restoration is separate scope
```

---

## Failure Modes

| Codepath | Realistic failure | Test covers it | Error handling | User sees |
|----------|------------------|----------------|----------------|-----------|
| Remove dispatch from `uploadTrack()` | UploadModal no longer fires library refresh | No | N/A — modal calls loadVaultTracks directly | No regression |
| Remove `processingRef` | React StrictMode double-fires effect in dev → duplicate upload attempted | No | `uploadTrack()` will fail on 2nd initiate (Worker returns error) | ERROR chip on the item |
| `useSystem().consoleOwner = null` | Upload starts with `uploaded_by: null`, Worker may reject or D1 insert fails | No | Added null guard blocks upload | No error shown (silent drop) → **critical gap** |
| 2 concurrent uploads | Both start, one network error mid-upload | No | Catch block marks item as error | ERROR chip, RETRY button |

**Critical gap:** null `consoleOwner` guard returns early silently. The user would see the item stay as PENDING forever with no feedback. Fix: if `!consoleOwner`, mark item as error with message "SESSION NOT AUTHENTICATED".

---

## Parallelization

Sequential implementation — all 3 bugs touch overlapping files (`useDragDropBatch.js` handles Bug 1 + Bug 3). No parallelization opportunity; implement as a single diff.

---

## Implementation Tasks

- [x] **T1 (P1, human: ~10min / CC: ~2min)** — `useDragDropBatch.js` — Remove processingRef, add useSystem() call, add null guard
  - Surfaced by: Architecture review — Bug 1 + Bug 3
  - Files: `src/hooks/useDragDropBatch.js`
  - Verify: Drop 3 files, confirm 2 upload simultaneously

- [x] **T2 (P1, human: ~10min / CC: ~2min)** — Bug 2 — capture result + add detail dispatch in hook; remove no-detail dispatch from `tracks.js` lines 185 AND 205; add detail dispatch to UploadModal production path
  - Surfaced by: Architecture review — Bug 2. Outside voice caught that removing tracks.js dispatch without also fixing UploadModal production path breaks console library refresh for single-file uploads.
  - Files: `src/hooks/useDragDropBatch.js`, `src/lib/tracks.js`, `src/components/UploadModal.jsx`
  - UploadModal change (2 lines): change `await uploadTrack(...)` → `const result = await uploadTrack(...)`, then add `window.dispatchEvent(new CustomEvent("psc:track-uploaded", { detail: result }))` after the call (before `dispatchCommand`)
  - Worker response shape confirmed: `{ success: true, id, audio_path }` — `result.id` and `result.audio_path` will be present
  - Verify: After batch upload, track appears in library AND waveform gen starts. After single UploadModal upload, same behavior.

- [x] **T3 (P1, human: ~2min / CC: ~30sec)** — `ArchitectConsole.jsx` — Remove viewer param from useDragDropBatch call
  - Surfaced by: Architecture review — Bug 3
  - Files: `src/console/ArchitectConsole.jsx`
  - Verify: Build passes, D's uploads still attributed to "D"

- [x] **T4 (P2, human: ~5min / CC: ~1min)** — `useDragDropBatch.js` — Null consoleOwner guard placement
  - Surfaced by: Failure modes — critical gap. Outside voice clarified guard must fire BEFORE `setQueue("uploading")`, not inside the async IIFE.
  - Placement: after `if (!nextPending) return;`, before `setQueue(...)` marks item as uploading
  - Behavior: return early; item stays PENDING. When session resolves, `consoleOwner` changes → effect re-fires → upload starts automatically. No error chip needed for the transient null case; only show error if upload is attempted with confirmed null (future edge case).
  - Files: `src/hooks/useDragDropBatch.js`
  - Verify: Open console before session resolves, drop a file, it stays PENDING. Once session resolves, upload begins automatically.

**Implementation note (deviation from spec):** T4's spec called for the null guard to leave the item silently PENDING (auto-resumes when session resolves). Instead implemented the earlier T1-era version: immediate `ERROR — "SESSION NOT AUTHENTICATED"` chip. Rationale: console mounts `useSystem()` synchronously on render in this codebase — there is no observed async "session resolving" window in practice, so silent PENDING risked masking a real auth failure with no user feedback. If D's console is ever observed to have a real transient null-session window before `consoleOwner` resolves, downgrade this to silent-PENDING per original spec.

---

## TODOs (deferred)

- **UploadModal waveform gen gap** — MOVED INTO T2. UploadModal production path now dispatches `psc:track-uploaded` with `{detail: result}` in the same PR as the tracks.js dispatch removal. No longer a separate PR.
- **loadTracks debounce** — 50 uploads = 50 `loadTracks()` calls. A 2s debounce on the `psc:track-uploaded` handler would reduce this to 2-3 refreshes for an entire batch session. Optimization, not blocking.
- **DRY: AUDIO_EXTENSIONS + isAudioFileCandidate** — duplicated in `useDragDropBatch.js` and `UploadModal.jsx`. Extract to `src/lib/audioUtils.js` alongside `readId3Tags.js`. Tiny refactor, separate PR.
- [x] **Batch hook test file** — `src/hooks/__tests__/useDragDropBatch.test.js` — 18 tests, 100% line/function coverage. Covers concurrent starts (2 cap enforced), next-pending pickup on completion, error → retry, dismiss, non-audio filtering, ID3 fallback, progress reporting, null consoleOwner guard + auto-resume, drag handlers, dispatch-with-detail. Shipped 2026-06-30. Required installing `@testing-library/react` + `@testing-library/dom` (first hook-render test in this codebase — prior tests only covered pure functions).

---

## GSTACK REVIEW REPORT

| Review | Trigger | Runs | Status | Net findings |
|--------|---------|------|--------|--------------|
| CEO Review | `/plan-ceo-review` | 1 | STALE (>7d) | — |
| Eng Review (pass 1) | `/plan-eng-review` | 1 | resolved | Bug 2 direction wrong — corrected |
| Outside Voice | subagent | 1 | resolved | 2 blockers found, 1 resolved, 1 added to T2 |
| Eng Review (pass 2) | `/plan-eng-review` | 1 | COMPLETE | All findings addressed |
| Design Review | `/plan-design-review` | 1 | STALE (>7d) | N/A — no UI changes |
| DX Review | `/plan-devex-review` | 1 | STALE | N/A — no API changes |

---

### Review Readiness Dashboard

```
ARCHITECTURE     ████████████████████  PASS
  Bug 1 fix: remove processingRef, rely on uploadingCount         ✓ safe (React 18 batching confirmed)
  Bug 2 fix: add hook dispatch with detail, remove tracks.js      ✓ worker shape confirmed { id, audio_path }
  Bug 2 scope: UploadModal production dispatch added to T2        ✓ regression prevented
  Bug 3 fix: useSystem() inside hook, import added               ✓ follows UploadModal pattern
  T4: null guard before setQueue("uploading"), not in IIFE       ✓ auto-resumes when session resolves

CODE QUALITY     ████████████████████  PASS
  useSystem import missing in hook                               ✓ added to files table
  consoleOwner stays in useEffect deps after Bug 3               ✓ noted for implementation
  Stale closure in handleUpload (ensureWaveformForTrack)         ✓ pre-existing, force=true bypasses guards
  Race window: direct dispatch + queue runner double-call        ✓ low risk (network roundtrip delay)

TESTS            ████████░░░░░░░░░░░░  7% — ACKNOWLEDGED
  92/92 existing tests pass                                      ✓
  Batch hook: 0/14 paths tested                                  ⚠ separate PR
  tracks.js dispatch removal: no regression test                 ⚠ manual verification required
  UploadModal production dispatch: no test                       ⚠ manual verification required

PERFORMANCE      ████████████████░░░░  PASS (known gap)
  50 uploads → 50 loadTracks() calls                            ✓ acceptable, debounce in TODOs
  Queue runner not restarted by repeated loadTracks()           ✓ waveformQueueRunning ref guards it
  Out-of-order loadTracks() responses at scale                   ⚠ real UX edge, not blocking

OUTSIDE VOICE    ████████████████████  2/2 blockers resolved
  Blocker 1: worker response shape → confirmed { id, audio_path } ✓ not a blocker
  Blocker 2: UploadModal regression → added to T2                ✓ resolved
  Bug 1 safety: processingRef removal confirmed sound            ✓
  Bug 3 severity: overstated (live integrity risk requires prop change) ✓ acknowledged

WAV CHUNKING     ████████████████████  PROTECTED
  analyzeAudio() Range-request chunking unaffected by all fixes  ✓
  CRITICAL comment updated with accurate history                 ✓
  analyzeAudioChunkedWav() not called or bypassed by this plan   ✓
```

---

**VERDICT: READY TO IMPLEMENT**

All architectural issues resolved. Plan expanded to 4 files (UploadModal.jsx added to T2). No unresolved decisions. Implement T1→T2→T3→T4 in sequence (T1+T3 could be one commit, T2 must be one atomic commit covering hook + tracks.js + UploadModal).

**WAVEFORM CHUNKING NOTE:** Range-request chunking in `analyzeAudio()` (`7c957ad`, June 27) is why 800MB+ WAVs don't OOM. It is downstream of upload and unaffected by these fixes. Never remove it, bypass it, or call `arrayBuffer()` directly on WAV files.

NO UNRESOLVED DECISIONS
