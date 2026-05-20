# Next Session — Resume Here

**Last updated:** 2026-05-20

## Status
v3 Guest Flow IMPLEMENTATION COMPLETE — uncommitted, design review pending.
Next: commit + deploy, then run `/plan-design-review`.

---

## DONE: v3 Guest Flow (shipped 2026-05-20, uncommitted)

### Decision locked
- **Fork, not conditional**: Create `src/listener/ListenerVaultView.jsx` (new file)
- `VaultView.jsx` and all 4 console consumers are **NOT TOUCHED**
- Audio via `audioEngine` (not `new Audio()`) — CORS already handled

### What the preview looks like (approved by L)
Live at: uoyni.com/guest-flow-preview.html

5 screens:
1. Vault landing — large duration hero (H:MM) + "TOUCH ANYWHERE TO ENTER" breathing hint
2. Mix list — track rows with 52×26px waveform thumbnails + duration
3. Player paused — ghost waveform (11% opacity) + pulsing play triangle, nothing else
4. Player playing — full waveform (played=green, unplayed=grey), green playhead line
5. Voice note open — deferred (no backend), do NOT implement now

### Task list (3 tasks)

**T1 — `src/listener/ListenerVaultView.jsx` (NEW FILE)**
- Fetch published tracks via `fetchPublishedVaultTracks(vault)` from lib/tracks.js
- Track list with rows: num | title + duration | 52×26px waveform thumbnail canvas
  - Waveform: parse `track.waveform_data` (JSON string `{low:[...], high:[...]}`)
  - Fallback: seeded bars from `getWaveformBars(track.id, 80)` in utils/waveform.js
- Player state machine: `null` | `paused` | `playing`
  - null: show track list
  - paused: hide list, show ghost waveform + pulsing play button center stage
  - playing: hide list, show waveform with playhead, transport bar at bottom
- Audio: use `audioEngine` (load/play/pause/stop/seek/onStateChange) from lib/audioEngine.js
- Back button: from track list → ListenerShell vault landing; from player → track list
- Header: "LISTENING ROOM / CURATED BY D" + EXIT button (same as current)
- Transport bar: "▶ PLAYING · TRACK TITLE · STOP" or "▮▮ PAUSED · TRACK TITLE · STOP"

**T2 — `src/listener/ListenerShell.jsx` (MODIFY)**
- Add `vaultStats` state: `{ [vaultId]: { totalDuration: number, count: number } }`
- Fetch published tracks when vault tab changes to compute totalDuration + count
- Format duration hero: `Math.floor(totalSecs/3600) + ':' + String(Math.floor((totalSecs%3600)/60)).padStart(2,'0')`
  - e.g. 5h 42m → "5:42", show "--:--" while loading
- Replace `listener-stage-content` block with:
  ```
  <duration-hero>5:42</duration-hero>          ← Space Mono, 72-82px, tabular-nums
  <subtitle>MIXES · 5 SESSIONS</subtitle>     ← Chakra Petch, 8px
  <meta>CURATED BY D · EXTENDED SETS · FULL SEQUENCES</meta>
  <rule/>
  <hint>TOUCH ANYWHERE TO ENTER</hint>        ← breathing animation (opacity pulse)
  ```
- Make entire `listener-stage` clickable (onClick → openVault), not just a button
- Remove: `.listener-stage-cta` button, `.listener-stage-kicker`, `.listener-vault-accent`
- Import `fetchPublishedVaultTracks` from lib/tracks.js (already available)
- Replace `<VaultView>` with `<ListenerVaultView>` (new import)

**T3 — `src/index.css` + `src/listener/ListenerVaultView.css` (NEW FILE)**
- Add CSS vars to `:root`: `--vc`, `--vc-dot`, `--vc-active`, `--vc-bg` (from preview)
- Duration hero class: Space Mono or monospace, 72-82px, font-weight 700, tabular-nums
- Touch hint: `animation: breathe 2.6s ease-in-out infinite` (opacity 0.09 → 0.35 → 0.09)
- Ghost waveform: opacity 0.11, full width
- Waveform thumbnail: 52px × 26px canvas, display block
- Playhead: 1px green line, box-shadow 0 0 6px rgba(20,220,20,0.5)

### Key imports to use
```js
// In ListenerVaultView.jsx
import { fetchPublishedVaultTracks, getAudioUrl } from '../lib/tracks';
import * as audioEngine from '../lib/audioEngine';
import { getWaveformBars } from '../utils/waveform';
```

### waveform_data format
Stored as JSON string in D1. Parse with: `JSON.parse(track.waveform_data || 'null')`
Structure: `{ low: Float32Array|number[], high: Float32Array|number[] }`
For thumbnails: use `high` array. Normalize to 0-1 range. Draw centered bars.

### CSS design tokens (from preview, already approved)
```css
--void: #050505;
--surface: #0d0d0d;
--border: #1e1e1e;
--id: #14dc14;          /* identity green */
--id-dim: rgba(20,220,20,0.07);
--tp: rgba(230,230,230,0.92);   /* text primary */
--ts: rgba(160,160,160,0.72);   /* text secondary */
--tm: rgba(90,90,90,0.80);      /* text muted */
--tg: rgba(255,255,255,0.09);   /* text ghost */
```

---

## BUG: Waveform zoom — both strips show identical full-track view

**Root cause confirmed:**
`zoom={1}` hardcoded at `src/console/ArchitectConsole.jsx:1680`.

**Fix:**
- Add: `const [deckZoom, setDeckZoom] = useState(4);` near other deck state
- Change line 1680: `zoom={1}` → `zoom={deckZoom}`
- Add zoom +/- buttons near waveform (god-btn pattern, 11px Chakra Petch)

---

## Already done (do NOT redo)
- Audio CORS fix: worker proxy `/audio/*` + `crossOrigin="anonymous"` in audioEngine (commit 2e476df)
- Design findings 001–003+007: committed and deployed
- Preview deployed: uoyni.com/guest-flow-preview.html (commit f966855)
- DESIGN.md: Guest Flow + Voice Comments spec written
- **v3 guest flow implementation** — ListenerVaultView.jsx + ListenerVaultView.css + ListenerShell.jsx updates

## Start here next session
1. **Commit v3 guest flow** — stage `src/listener/`, `src/index.css`, `src/variables.css`; do NOT stage `node_modules/`, `.claude/settings.json`
2. **Deploy** — push to main → wrangler pages deploy (Pages is NOT auto-deployed from git per memory)
3. **Run `/plan-design-review`** — score the implementation against DESIGN.md
4. D needs to publish 4 remaining mixes (only 1/5 published currently)
5. Zone B: ACCESS CODES panel for L
6. Migration 0006: cue_labels column (D-bank cue persistence)
7. Waveform zoom fix: `zoom={1}` hardcoded at `src/console/ArchitectConsole.jsx:1680`
