# Next Session — Resume Here

**Last updated:** 2026-05-19

## Status
/investigate COMPLETE — root causes found, fixes NOT yet applied (awaiting approval)

---

## BUG 1: Sound broken — affects BOTH D's console and listener (uoyni.com)

**Root cause confirmed:**
Sprint 1A added live FFT analyzer (useAudioAnalyzer.js:75: createMediaElementSource).
When audio element is tapped into Web Audio API via createMediaElementSource,
browser enforces CORS on the src URL. R2 public URL has NO CORS headers.
Result: CORS error silently kills audio. Before Sprint 1A, basic HTML audio
element playback didnt require CORS so it worked.
`pub-a782f6b9fdf342b3bfa6c668c4b7a5ce.r2.dev/venus/1777811220926-ng5hgc3pc3a.wav`
returns HTTP 200 with NO Content-Type header (confirmed via curl -I).
Browser audio element fires `onerror` → load rejects → "Audio load failed" error.

**Fix (two files):**

1. `worker/upload-worker.js` — Add `/audio/*` streaming proxy route:
```js
// GET /audio/:key — stream from R2 with correct Content-Type + Range support
if (request.method === "GET" && url.pathname.startsWith("/audio/")) {
  const key = decodeURIComponent(url.pathname.slice(7)); // strip /audio/
  const ext = key.split('.').pop().toLowerCase();
  const contentTypes = { wav:'audio/wav', mp3:'audio/mpeg', flac:'audio/flac', m4a:'audio/mp4' };
  const contentType = contentTypes[ext] || 'audio/mpeg';
  
  const rangeHeader = request.headers.get('Range');
  const obj = rangeHeader
    ? await env.PSC_AUDIO.get(key, { range: parseRange(rangeHeader) })
    : await env.PSC_AUDIO.get(key);
  
  if (!obj) return new Response('Not found', { status: 404, headers: corsHeaders });
  
  const status = rangeHeader ? 206 : 200;
  const headers = { ...corsHeaders, 'Content-Type': contentType, 'Accept-Ranges': 'bytes' };
  if (rangeHeader && obj.range) {
    headers['Content-Range'] = `bytes ${obj.range.offset}-${obj.range.end}/${obj.size}`;
  }
  return new Response(obj.body, { status, headers });
}
```

2. `src/lib/tracks.js:85` — Update getAudioUrl to use worker proxy:
```js
export function getAudioUrl(audio_path) {
  if (!audio_path) return null;
  if (IS_DEV) return null;
  return `${UPLOAD_WORKER_URL}/audio/${audio_path}`;  // was: R2_PUBLIC_URL
}
```
(Remove the `if (!R2_PUBLIC_URL) return null;` check — no longer needed)

---

## BUG 2: Waveform zoom — both strips show identical full-track view

**Root cause confirmed:**
`zoom={1}` hardcoded at `src/console/ArchitectConsole.jsx:1680`.
DeckWaveform has two canvases: 24px overview (always full-track) + main canvas
(zoomed when zoom>1). zoom=1 → both show full track → looks duplicated.

**Fix (one file):**
`src/console/ArchitectConsole.jsx`:
- Add: `const [deckZoom, setDeckZoom] = useState(4);` near other deck state
- Change line 1680: `zoom={1}` → `zoom={deckZoom}`
- Add zoom +/- buttons near waveform (use god-btn pattern, 11px Chakra Petch)

---

## Design Consultation — COMPLETE (DESIGN.md written, not implemented)

Guest Flow spec locked in DESIGN.md:
- Vault landing: total runtime hero (Space Mono, 82px), "TOUCH ANYWHERE TO ENTER" breathing
- Mix list: 52×26px seeded waveform thumbnails, voice badge
- Player paused: ghost waveform 11% opacity + pulsing ▶
- Player playing: full waveform stage, played=green, unplayed=grey, playhead=green
- Voice comments: warm near-white `--vc` tokens, whisper mode audio ducking

Preview: `/workspaces/psoulc/public/guest-flow-preview.html`
Start Vite: `npx vite --port 5174` then open http://localhost:5174/guest-flow-preview.html
**User has NOT approved preview visually yet — show before implementing.**

Voice comments: listener-only, D can respond/react/like, Phase 2: D samples fan voice in mixes.

---

## Pending (do NOT implement without showing preview first)
1. Fix sound bug (worker proxy) + fix waveform zoom → needs approval
2. Show guest-flow-preview.html → get approval → implement v3 design
3. D needs to publish 4 remaining mixes (only 1/5 published)
4. Zone B: ACCESS CODES panel for L
5. Migration 0006: cue_labels column (D-bank cue persistence)
