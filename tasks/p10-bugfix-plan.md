<!-- /autoplan restore point: /home/codespace/.gstack/projects/liaskin13-psoulc/phase-10-autoplan-restore-20260507-005245.md -->
# Phase 10 — 3 Critical Bug Fix Plan
Branch: phase-10 | Date: 2026-05-07

## Problem Statement
Three features broken in production (psoulc.pages.dev) that prevent D from using the console:

1. **Upload progress bar is fake** — `setInterval` in `UploadModal.jsx` animates to 95% regardless of actual upload state. The real upload (`fetch`) runs in parallel but progress is disconnected from it. D sees 95% and nothing happens.

2. **BPM input rejects ranges** — D uses "73-119" or "128-135" style BPM notation (common in DJ software). The regex `/^\d+(\.\d{0,2})?$/` rejects the dash, making the field unusable for his workflow.

3. **No audio playback** — Audio worked in a prior session. R2 bucket was made public this session. After today's rebuild, playback is broken. Root cause unconfirmed — needs R2 URL verification before touching code.

## Affected Files
- `src/components/UploadModal.jsx` — fixes 1 and 2
- `src/lib/audioEngine.js` — fix 3 (if code change needed at all)
- `worker/upload-worker.js` — may need CORS header on 413 responses

## Fix 1: Real XHR Progress
Remove the `useEffect` fake progress (lines 172-192). Replace `fetch()` (lines 275-289) with `XMLHttpRequest` + `upload.onprogress`.

```js
function xhrUpload(url, formData, secret, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('PSC-Secret', secret);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 95));
    };
    xhr.onload = () => {
      const data = JSON.parse(xhr.responseText);
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(new Error(data.error || `HTTP ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error('NETWORK ERROR'));
    xhr.send(formData);
  });
}
```

Progress state becomes real: driven by actual bytes sent.

## Fix 2: BPM Range Regex
Line 316 change:
- Old: `/^\d+(\.\d{0,2})?$/`
- New: `/^(\d+(\.\d{0,2})?)(-(\d+(\.\d{0,2})?)?)?$/`

`bpmNumeric` (line 168) already does `parseFloat(String(bpm))` — that naturally takes the first number from "73-119" → 73. NixieDigits shows 073. DB stores 73. The range string "73-119" stays in the input for D to read.

## Fix 3: Audio Root Cause
1. Curl `https://pub-a782f6b9fdf342b3bfa6c668c4b7a5ce.r2.dev/{audio_path}` for a real track — must return 200 + audio content
2. If 404 → R2 public access still not propagated or wrong path format
3. If 200 → audio engine code is correct (it is — native HTMLAudioElement, no Web Audio graph bugs), diagnose browser-level block
4. Audio engine: no code changes unless curl proves a URL format mismatch

## Not In Scope
- Track editing (inline edit panel) — Phase 10 task 8, deferred
- Column alignment CSS — minor, deferred until audio+upload confirmed working
- R2 presigned URLs for files >100MB — architectural, separate session
- 413 CORS header fix — Cloudflare Transform Rule, separate session

## Proof Required
- Fix 1: Progress bar moves in real time as bytes transmit. Reaches 100% on success.
- Fix 2: D can type "73-119" into BPM field without it rejecting. NixieDigits shows 073.
- Fix 3: Audio plays in browser. L confirms she hears sound.
