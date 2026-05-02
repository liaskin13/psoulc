---
name: entry
description: "Skill for the Entry area of psoulc. 20 symbols across 5 files."
---

# Entry

20 symbols | 5 files | Cohesion: 97%

## When to Use

- Working with code in `src/`
- Understanding how findResidentByCode work
- Modifying entry-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/entry/RequestAccessModal.jsx` | RequestAccessModal, renderConfirm, renderListenForm, renderVettingStep, renderContactStep (+2) |
| `src/entry/EntrySequence.jsx` | readLock, writeLock, clearLock, triggerIgnition, handleInputChange (+2) |
| `src/entry/DPWallpaper.jsx` | DPWallpaper, draw, resize |
| `src/entry/SolarFlare.jsx` | SolarFlare, run |
| `src/data/residentBlueprint.js` | findResidentByCode |

## Entry Points

Start here when exploring this area:

- **`findResidentByCode`** (Function) — `src/data/residentBlueprint.js:63`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `findResidentByCode` | Function | `src/data/residentBlueprint.js` | 63 |
| `RequestAccessModal` | Function | `src/entry/RequestAccessModal.jsx` | 43 |
| `renderConfirm` | Function | `src/entry/RequestAccessModal.jsx` | 98 |
| `renderListenForm` | Function | `src/entry/RequestAccessModal.jsx` | 127 |
| `renderVettingStep` | Function | `src/entry/RequestAccessModal.jsx` | 174 |
| `renderContactStep` | Function | `src/entry/RequestAccessModal.jsx` | 221 |
| `renderFileStep` | Function | `src/entry/RequestAccessModal.jsx` | 264 |
| `renderContent` | Function | `src/entry/RequestAccessModal.jsx` | 301 |
| `readLock` | Function | `src/entry/EntrySequence.jsx` | 13 |
| `writeLock` | Function | `src/entry/EntrySequence.jsx` | 17 |
| `clearLock` | Function | `src/entry/EntrySequence.jsx` | 20 |
| `triggerIgnition` | Function | `src/entry/EntrySequence.jsx` | 44 |
| `handleInputChange` | Function | `src/entry/EntrySequence.jsx` | 84 |
| `DPWallpaper` | Function | `src/entry/DPWallpaper.jsx` | 16 |
| `draw` | Function | `src/entry/DPWallpaper.jsx` | 37 |
| `resize` | Function | `src/entry/DPWallpaper.jsx` | 90 |
| `SolarFlare` | Function | `src/entry/SolarFlare.jsx` | 7 |
| `run` | Function | `src/entry/SolarFlare.jsx` | 11 |
| `focusInput` | Function | `src/entry/EntrySequence.jsx` | 94 |
| `handleApertureKeyDown` | Function | `src/entry/EntrySequence.jsx` | 96 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `HandleInputChange → ReadLock` | intra_community | 3 |
| `HandleInputChange → FindResidentByCode` | intra_community | 3 |
| `HandleInputChange → ClearLock` | intra_community | 3 |
| `HandleInputChange → WriteLock` | intra_community | 3 |
| `RequestAccessModal → RenderConfirm` | intra_community | 3 |
| `RequestAccessModal → RenderListenForm` | intra_community | 3 |
| `RequestAccessModal → RenderVettingStep` | intra_community | 3 |
| `RequestAccessModal → RenderContactStep` | intra_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Console | 1 calls |

## How to Explore

1. `gitnexus_context({name: "findResidentByCode"})` — see callers and callees
2. `gitnexus_query({query: "entry"})` — find related execution flows
3. Read key files listed above for implementation details
