# NEXT SESSION — START HERE. READ THIS BEFORE TOUCHING ANYTHING.

## LAST UPDATED: 2026-05-07 (audio root cause found, secret changed)

## CLAUDE BEHAVIOR RULES — NON-NEGOTIABLE
- Read DESIGN.md in full before touching any CSS or JSX
- **TEST LIVE INFRASTRUCTURE FIRST** — curl the live URL before reading any code
- One task at a time, in the order listed below — no skipping
- Never mark complete without proving it works in the browser
- If something "looks broken" → open browser console and read the error BEFORE touching code

---

## ⚠️ CRITICAL: DO THESE BEFORE ANYTHING ELSE

### 1. Secret changed — frontend build is stale
L changed the Cloudflare Worker secret. The deployed frontend still has the OLD secret
(`psc-live-2026`) baked in. Every upload call returns 401 until rebuilt.

**L must**: Edit `/workspaces/psoulc/.env` and set `VITE_UPLOAD_SECRET` to the new value.
Then the AI runs:
```bash
npm run build
wrangler pages deploy dist/ --project-name psoulc --commit-dirty=true
```

### 2. R2 bucket is now public — audio should work after rebuild
L enabled public access on the `psc-audio` R2 bucket this session.
The public URL `https://pub-a782f6b9fdf342b3bfa6c668c4b7a5ce.r2.dev` was returning 404.
After the rebuild above, test audio by double-clicking a track.
**DO NOT touch audio code** unless the browser console shows a specific error.

---

## ROOT CAUSES FOUND THIS SESSION

### NO SOUND
R2 bucket was private. Audio code was always correct. The `<audio>` element loaded
`pub-*.r2.dev/vault/file.mp3` → 404 → error event → no sound.
**Now fixed by L** (bucket made public). Rebuild + deploy = audio works.

### UPLOAD 401
Worker secret changed in Cloudflare dashboard. Frontend has old secret baked in.
**Fix**: L updates .env → rebuild → deploy. Code is correct, no changes needed.

---

## WHAT IS NOT REGRESSIONS (never worked, need to be built)

### FAKE UPLOAD PROGRESS BAR
`src/components/UploadModal.jsx:179` uses `setInterval` to animate fake progress.
Was never replaced with real XHR progress in any git commit.
Replace `fetch()` call with `XMLHttpRequest` + `upload.onprogress`.
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

### BPM RANGE INPUT
`UploadModal.jsx:316` regex `/^\d+(\.\d{0,2})?$/` rejects "73-119". Never supported.
Fix:
- New regex: `/^(\d+(\.\d{0,2})?)(-(\d+(\.\d{0,2})?)?)?$/`
- `bpmNumeric` = `parseFloat(String(bpm).split('-')[0]) || 120`
- D1 `bpm` column is REAL — only store first number numerically in the DB

### COLUMN ALIGNMENT
Track list headers are centre-aligned, data rows are left-aligned.
Fix: find header cell class in `ArchitectConsole.css` → `text-align: left`.

### TRACK EDITING (new feature, never built)
D needs to edit title/artist/BPM/key post-upload.
- Worker: add `PATCH /tracks/:id` (authenticated)
- `src/lib/tracks.js`: add `patchTrack(id, fields)`
- UI: inline edit panel per row (NOT a modal) in ArchitectConsole.jsx

---

## CURRENT CODEBASE STATE

### Committed and deployed (last commit: `5a5a26b`)
- Native HTML5 audio engine — no Web Audio graph (correct, do not revert)
- Waveform-driven VU + spectrum meters
- 16 hot cues (Bank 1 solid, Bank 2 outlined)
- Scrollbar hidden on track list
- `useMemo` for waveform_data parsing

### In working tree, NOT yet committed
- `src/console/ArchitectConsole.jsx` — useMemo + useAudioAnalyzer props wired correctly
- `src/lib/audioEngine.js` — native HTML5 rewrite
- `src/console/useAudioAnalyzer.js` — waveform-driven meters
- These ARE deployed (wrangler pages deploy was run this session, 0 new files = already live)

---

## EXECUTION ORDER FOR NEXT SESSION

| # | Task | Who | Effort |
|---|------|-----|--------|
| 1 | Update .env with new secret | L | 1 min |
| 2 | `npm run build` + `wrangler pages deploy` | AI | 2 min |
| 3 | Test audio in browser (double-click track) | L + AI | 2 min |
| 4 | Test upload in browser (INTAKE → COMMIT) | L + AI | 2 min |
| 5 | Column alignment CSS fix | AI | 5 min |
| 6 | BPM range regex fix | AI | 5 min |
| 7 | Real upload progress (XHR) | AI | 15 min |
| 8 | Track editing (inline, not modal) | AI | 45 min |

Do NOT start #5 until #3 and #4 are confirmed working.

---

## DESIGN CONSTRAINTS — DO NOT VIOLATE
- 0px border radius everywhere
- Chakra Petch: all UI labels
- JetBrains Mono: all numbers and data
- Void-industrial achromatic — no amber
- D's identity: green `#14dc14` at 3 placements maximum
- Track list: no scrollbar (do not undo)
- Track editing: inline only, no modal

---

## KEY FILES
- Console: `src/console/ArchitectConsole.jsx` + `.css`
- Upload modal: `src/components/UploadModal.jsx`
- Worker: `worker/upload-worker.js`
- Tracks lib: `src/lib/tracks.js`
- Audio engine: `src/lib/audioEngine.js`
- Env (gitignored): `.env`
- Live: `phase-10.psoulc.pages.dev` | Production: `psoulc.pages.dev`

---

## HOW TO START THE NEXT SESSION
Open a new window and type:
> "Read NEXT_SESSION.md. The .env secret has been updated. Let's go."
