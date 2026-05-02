---
name: components
description: "Skill for the Components area of psoulc. 22 symbols across 8 files."
---

# Components

22 symbols | 8 files | Cohesion: 98%

## When to Use

- Working with code in `src/`
- Understanding how getWaveformBars, waveformPath, uploadTrack work
- Modifying components-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/components/UploadModal.jsx` | syncsafeToInt, readId3Frame, decodeTextFrame, readId3Tags, UploadModal (+3) |
| `src/components/PresenceOrbs.jsx` | fracHash, homePos, orbColor, orbRadius, OrbMesh |
| `src/utils/waveform.js` | hashStr, getWaveformBars, waveformPath |
| `src/components/MissionStatusBar.jsx` | formatMet, MissionStatusBar |
| `src/listener/ListenerShell.jsx` | ListenerWatermark |
| `src/components/VaultWindow.jsx` | HelixWaveform |
| `src/components/RecordShelf.jsx` | WaveformThumb |
| `src/lib/tracks.js` | uploadTrack |

## Entry Points

Start here when exploring this area:

- **`getWaveformBars`** (Function) — `src/utils/waveform.js:13`
- **`waveformPath`** (Function) — `src/utils/waveform.js:24`
- **`uploadTrack`** (Function) — `src/lib/tracks.js:20`
- **`MissionStatusBar`** (Function) — `src/components/MissionStatusBar.jsx:12`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `getWaveformBars` | Function | `src/utils/waveform.js` | 13 |
| `waveformPath` | Function | `src/utils/waveform.js` | 24 |
| `uploadTrack` | Function | `src/lib/tracks.js` | 20 |
| `MissionStatusBar` | Function | `src/components/MissionStatusBar.jsx` | 12 |
| `syncsafeToInt` | Function | `src/components/UploadModal.jsx` | 11 |
| `readId3Frame` | Function | `src/components/UploadModal.jsx` | 18 |
| `decodeTextFrame` | Function | `src/components/UploadModal.jsx` | 28 |
| `readId3Tags` | Function | `src/components/UploadModal.jsx` | 39 |
| `UploadModal` | Function | `src/components/UploadModal.jsx` | 87 |
| `applyFile` | Function | `src/components/UploadModal.jsx` | 100 |
| `handleDrop` | Function | `src/components/UploadModal.jsx` | 114 |
| `hashStr` | Function | `src/utils/waveform.js` | 3 |
| `ListenerWatermark` | Function | `src/listener/ListenerShell.jsx` | 6 |
| `HelixWaveform` | Function | `src/components/VaultWindow.jsx` | 6 |
| `WaveformThumb` | Function | `src/components/RecordShelf.jsx` | 6 |
| `fracHash` | Function | `src/components/PresenceOrbs.jsx` | 6 |
| `homePos` | Function | `src/components/PresenceOrbs.jsx` | 15 |
| `orbColor` | Function | `src/components/PresenceOrbs.jsx` | 22 |
| `orbRadius` | Function | `src/components/PresenceOrbs.jsx` | 29 |
| `OrbMesh` | Function | `src/components/PresenceOrbs.jsx` | 37 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `UploadModal → SyncsafeToInt` | intra_community | 5 |
| `HandleDrop → SyncsafeToInt` | intra_community | 5 |
| `UploadModal → DecodeTextFrame` | intra_community | 4 |
| `HandleDrop → DecodeTextFrame` | intra_community | 4 |
| `OrbMesh → FracHash` | intra_community | 3 |
| `WaveformPath → HashStr` | intra_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Console | 1 calls |

## How to Explore

1. `gitnexus_context({name: "getWaveformBars"})` — see callers and callees
2. `gitnexus_query({query: "components"})` — find related execution flows
3. Read key files listed above for implementation details
