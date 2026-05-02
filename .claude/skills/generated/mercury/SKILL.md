---
name: mercury
description: "Skill for the Mercury area of psoulc. 20 symbols across 10 files."
---

# Mercury

20 symbols | 10 files | Cohesion: 90%

## When to Use

- Working with code in `src/`
- Understanding how getTuneOverride, useVaultVoid, getTarget work
- Modifying mercury-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/mercury/MercuryStream.jsx` | MercuryStream, resize, draw, drawWave |
| `src/venus/VenusArchive.jsx` | parseFrequency, VenusArchive |
| `src/saturn/SaturnVault.jsx` | parseFrequency, SaturnVault |
| `src/lockbox/LockboxVault.jsx` | titleFromLockboxId, LockboxVault |
| `src/hooks/useVaultVoid.js` | useVaultVoid, getTarget |
| `src/hooks/useVaultFileCells.js` | normalizeCells, useVaultFileCells |
| `src/earth/EarthSafe.jsx` | parseFrequency, EarthSafe |
| `src/components/MasterReel.jsx` | handleDragEnd, triggerSpaghettification |
| `src/App.jsx` | onVoid |
| `src/state/SystemContext.jsx` | getTuneOverride |

## Entry Points

Start here when exploring this area:

- **`getTuneOverride`** (Function) — `src/state/SystemContext.jsx:377`
- **`useVaultVoid`** (Function) — `src/hooks/useVaultVoid.js:14`
- **`getTarget`** (Function) — `src/hooks/useVaultVoid.js:24`
- **`useVaultFileCells`** (Function) — `src/hooks/useVaultFileCells.js:10`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `getTuneOverride` | Function | `src/state/SystemContext.jsx` | 377 |
| `useVaultVoid` | Function | `src/hooks/useVaultVoid.js` | 14 |
| `getTarget` | Function | `src/hooks/useVaultVoid.js` | 24 |
| `useVaultFileCells` | Function | `src/hooks/useVaultFileCells.js` | 10 |
| `onVoid` | Function | `src/App.jsx` | 186 |
| `parseFrequency` | Function | `src/venus/VenusArchive.jsx` | 27 |
| `VenusArchive` | Function | `src/venus/VenusArchive.jsx` | 36 |
| `parseFrequency` | Function | `src/saturn/SaturnVault.jsx` | 26 |
| `SaturnVault` | Function | `src/saturn/SaturnVault.jsx` | 35 |
| `MercuryStream` | Function | `src/mercury/MercuryStream.jsx` | 25 |
| `resize` | Function | `src/mercury/MercuryStream.jsx` | 78 |
| `draw` | Function | `src/mercury/MercuryStream.jsx` | 86 |
| `drawWave` | Function | `src/mercury/MercuryStream.jsx` | 91 |
| `titleFromLockboxId` | Function | `src/lockbox/LockboxVault.jsx` | 21 |
| `LockboxVault` | Function | `src/lockbox/LockboxVault.jsx` | 26 |
| `normalizeCells` | Function | `src/hooks/useVaultFileCells.js` | 2 |
| `parseFrequency` | Function | `src/earth/EarthSafe.jsx` | 31 |
| `EarthSafe` | Function | `src/earth/EarthSafe.jsx` | 40 |
| `handleDragEnd` | Function | `src/components/MasterReel.jsx` | 25 |
| `triggerSpaghettification` | Function | `src/components/MasterReel.jsx` | 53 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `MercuryStream → VoidItem` | cross_community | 5 |
| `App → VoidItem` | cross_community | 5 |
| `HandleDragEnd → VoidItem` | cross_community | 5 |
| `VenusArchive → NormalizeCells` | intra_community | 3 |
| `SaturnVault → NormalizeCells` | intra_community | 3 |
| `MercuryStream → NormalizeCells` | intra_community | 3 |
| `MercuryStream → GetTarget` | intra_community | 3 |
| `LockboxVault → NormalizeCells` | intra_community | 3 |
| `EarthSafe → NormalizeCells` | intra_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Console | 5 calls |
| State | 1 calls |

## How to Explore

1. `gitnexus_context({name: "getTuneOverride"})` — see callers and callees
2. `gitnexus_query({query: "mercury"})` — find related execution flows
3. Read key files listed above for implementation details
