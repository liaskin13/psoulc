---
name: console
description: "Skill for the Console area of psoulc. 41 symbols across 16 files."
---

# Console

41 symbols | 16 files | Cohesion: 78%

## When to Use

- Working with code in `src/`
- Understanding how commitMatrixState, rollbackMatrixState, useSystem work
- Modifying console-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/console/ArchitectConsole.jsx` | announce, handleBroadcast, handleExplore, handleVoidProtocol, handleMatrixArm (+10) |
| `src/console/matrixState.js` | commitMatrixState, rollbackMatrixState, tierDefaultsForMember, resolveMatrixPerm, toggleMatrixPerm |
| `src/console/ReadoutNavigator.jsx` | ReadoutNavigator, rotate, pushSelect, longPress, handleKeyDown |
| `src/console/SpectralStack.jsx` | SpectralStack, resize |
| `src/console/AnalogConsole.jsx` | AnalogConsole, checkPreferences |
| `skills/blender-astro/scripts/src/blender/client.ts` | connect, disconnect |
| `src/state/SystemContext.jsx` | useSystem |
| `src/console/MembersPanel.jsx` | MembersPanel |
| `src/console/InboxPanel.jsx` | InboxPanel |
| `src/console/CommentPanel.jsx` | CommentPanel |

## Entry Points

Start here when exploring this area:

- **`commitMatrixState`** (Function) — `src/console/matrixState.js:28`
- **`rollbackMatrixState`** (Function) — `src/console/matrixState.js:36`
- **`useSystem`** (Function) — `src/state/SystemContext.jsx:488`
- **`CommandPalette`** (Function) — `src/components/CommandPalette.jsx:67`
- **`SpectralStack`** (Function) — `src/console/SpectralStack.jsx:10`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `commitMatrixState` | Function | `src/console/matrixState.js` | 28 |
| `rollbackMatrixState` | Function | `src/console/matrixState.js` | 36 |
| `useSystem` | Function | `src/state/SystemContext.jsx` | 488 |
| `CommandPalette` | Function | `src/components/CommandPalette.jsx` | 67 |
| `SpectralStack` | Function | `src/console/SpectralStack.jsx` | 10 |
| `resize` | Function | `src/console/SpectralStack.jsx` | 26 |
| `registerObjectCommands` | Function | `skills/blender-astro/scripts/src/cli/commands/object.ts` | 11 |
| `registerModifierCommands` | Function | `skills/blender-astro/scripts/src/cli/commands/modifier.ts` | 11 |
| `registerGeometryCommands` | Function | `skills/blender-astro/scripts/src/cli/commands/geometry.ts` | 11 |
| `tierDefaultsForMember` | Function | `src/console/matrixState.js` | 0 |
| `resolveMatrixPerm` | Function | `src/console/matrixState.js` | 9 |
| `toggleMatrixPerm` | Function | `src/console/matrixState.js` | 15 |
| `connect` | Method | `skills/blender-astro/scripts/src/blender/client.ts` | 45 |
| `disconnect` | Method | `skills/blender-astro/scripts/src/blender/client.ts` | 174 |
| `announce` | Function | `src/console/ArchitectConsole.jsx` | 136 |
| `handleBroadcast` | Function | `src/console/ArchitectConsole.jsx` | 219 |
| `handleExplore` | Function | `src/console/ArchitectConsole.jsx` | 226 |
| `handleVoidProtocol` | Function | `src/console/ArchitectConsole.jsx` | 232 |
| `handleMatrixArm` | Function | `src/console/ArchitectConsole.jsx` | 275 |
| `handleMatrixCommit` | Function | `src/console/ArchitectConsole.jsx` | 280 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Start → On` | cross_community | 7 |
| `SpectralStack → Close` | cross_community | 3 |
| `RegisterMaterialCommands → On` | cross_community | 3 |
| `RegisterCollectionCommands → On` | cross_community | 3 |
| `RegisterObjectCommands → On` | cross_community | 3 |
| `RegisterObjectCommands → Off` | cross_community | 3 |
| `RegisterObjectCommands → Close` | cross_community | 3 |
| `RegisterModifierCommands → On` | cross_community | 3 |
| `RegisterModifierCommands → Off` | cross_community | 3 |
| `RegisterModifierCommands → Close` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Blender | 4 calls |
| Daemon | 1 calls |

## How to Explore

1. `gitnexus_context({name: "commitMatrixState"})` — see callers and callees
2. `gitnexus_query({query: "console"})` — find related execution flows
3. Read key files listed above for implementation details
