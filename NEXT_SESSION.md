# Next Session — Resume Here

**Last updated:** 2026-05-20 (session 3)

## Status
Guest flow adapt + animate COMPLETE. Critique score **35/40** (25→27→31→35). All shipped to uoyni.com. Zero P0/P1/P2 issues — two P3s remaining.

---

## DONE this session (session 2 — bolder/harden)

### v3 guest flow — full implementation (commit 3d0aebe)
- `src/listener/ListenerVaultView.jsx` + `src/listener/ListenerVaultView.css` (new files)
- `src/listener/ListenerShell.jsx`: duration hero, vaultStats, openVault on stage click
- `src/index.css`: breathing hint, duration hero classes, safe area fix

### 8 iPhone 13 bugs fixed (commit 5e867ec)
1. Waveform visibility: unplayed bars 0.28 → 0.55 opacity
2. Dock tab: tapping active tab now enters vault via openVault()
3. Persistent playback: back keeps music playing; mini-transport strip in track list
4. Play icon: unicode ▶ replaced with clean SVG polygon
5. Waveform seek: tap playing canvas to seek to that position
6. Stage safe area: `.listener-stage` inset accounts for `env(safe-area-inset-top)`
7. Welcome screen overflow: `overflow:hidden`, clamped font, padding
8. Text sizes: subtitle/meta 8px → 10px, meta contrast raised

### Waveform rAF fix + header layout (commit 77e7ad2)
- `WaveformCanvas`: stable rAF draw loop, refs for currentTime/duration, `getBoundingClientRect()`
- `lvv-header`: `height: 44px` → `calc(44px + env(safe-area-inset-top, 0px))`

All three commits pushed and deployed to uoyni.com.

---

## Bolder/harden changes (session 2, all shipped)

- Scrolling zoom waveform: 40 bars visible, playhead always centered (`VISIBLE=40`)
- Overview strip: 16px thin full-track canvas, seekable
- WAVE mode: correct Serato display colors via `seratoRgb()` GEOB mapping (bass=orange, mid=green, high=yellow-white)
- FREQ mode (was HEAT): amplitude rainbow via `heatColor()` fn
- WAVE/FREQ toggle on playing screen
- Ghost waveform seekable: tap seeks + auto-plays via `handleGhostSeek`
- DPWallpaper in ListenerShell at opacity 0.35
- `--vault-color` propagated to duration hero, dock, transport status, play SVG, viz toggle
- Error state: COULDN'T LOAD + RETRY (playerState === 'error')
- Transport time readout: elapsed · −remaining in Space Mono, both full player AND mini-transport
- Audio loading state: `isAudioLoading` boolean; play button shows LOADING dot during `audioEngine.load()`
- TAP WAVEFORM TO SEEK hint on paused screen (hidden during loading)
- ThumbnailCanvas: updated to Serato display colors

Critique: 25 → 27 → 31 → 33/40. Zero P0/P1. Slug: `guest-flow-listenershell-listenervaultview`.

---

## Start here next session

1. **Zone B: ACCESS CODES panel** for L — highest priority feature backlog
2. **D needs to publish 4 more mixes** (only 1/5 published currently)
3. **Waveform zoom fix in console**: `zoom={1}` hardcoded at `src/console/ArchitectConsole.jsx:1680`
4. **Migration 0006: cue_labels column** (D-bank cue persistence)
5. ~~Push critique to 35+~~ — DONE (35/40 as of session 3)
6. **[P3] Vault name in player header**: LVV header always shows "LISTENING ROOM / CURATED BY D" regardless of vault — add vault label at ~20% opacity
7. **[P3] Welcome interstitial duration**: 1.2s may feel like a loading screen; consider 2.5s with "BROWSE THE VAULTS BELOW" subtitle

---

## Key technical notes

### Canvas rendering (HARD-WON this session)
- `canvas.offsetWidth` returns 0 on Chrome/iOS before layout settles → use `getBoundingClientRect()` as primary
- `currentTime` in draw `useCallback` deps → ResizeObserver thrashes at 250ms → nothing draws
- Pattern: `currentTimeRef` + `durationRef` updated via `useEffect`, rAF loop for continuous redraw
- See `src/listener/ListenerVaultView.jsx` WaveformCanvas (lines ~68-160)

### Safe area header pattern
- Fixed-height headers with safe-area padding must use: `height: calc(44px + env(safe-area-inset-top, 0px))`
- NOT `height: 44px` — that causes content to be hidden behind the notch

### Deploy sequence (every session, all 4 steps)
```
git add <files> && git commit -m "..."
git push
npm run build
npx wrangler pages deploy dist --project-name psoulc
```
Pages is NOT auto-deployed from git.

### Dev server
Use `npm run preview` not `npm run dev` (react version mismatch causes dev server issues)

### Waveform colors (confirmed by L — no green bars)
- Played bars: `#14dc14` (identity green)
- Unplayed bars: `rgba(240,237,232,0.55)` — off-white only
- Ghost (paused state): `rgba(240,237,232,0.11)` — intentionally subtle
- Thumbnails (track list): `rgba(240,237,232,0.55)` — same off-white

### File boundaries
- `src/listener/ListenerVaultView.jsx` — all player/waveform changes
- `src/listener/ListenerShell.jsx` — vault shell, dock, duration hero
- `src/listener/ListenerVaultView.css` — vault player styles
- `src/index.css` — global + ListenerShell styles
- DO NOT touch `src/console/VaultView.jsx` — old D-console vault, separate codebase

---

## Already done (do NOT redo)
- Audio CORS fix: worker proxy `/audio/*` + `crossOrigin="anonymous"` (commit 2e476df)
- Design findings 001–003+007: committed and deployed
- DESIGN.md: Guest Flow + Voice Comments spec written
- v3 guest flow full implementation
- All 8 iPhone 13 device bugs fixed and deployed (commits 5e867ec, 77e7ad2)
