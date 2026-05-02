---
name: blender
description: "Skill for the Blender area of psoulc. 44 symbols across 9 files."
---

# Blender

44 symbols | 9 files | Cohesion: 73%

## When to Use

- Working with code in `skills/`
- Understanding how runRetargetingFromCLI, registerRetargetingCommands, findProjectRoot work
- Modifying blender-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `skills/blender-astro/scripts/src/blender/config.ts` | getLocalTimestamp, findProjectRoot, getProjectName, getProjectConfig, updateProjectLastUsed (+8) |
| `skills/blender-astro/scripts/src/index.ts` | AnimationRetargetingWorkflow, getManualDownloadInstructions, getPopularAnimations, getRecommendedSettings, runRetargetingFromCLI (+5) |
| `skills/blender-astro/scripts/src/blender/retargeting.ts` | getBones, autoMapBones, retarget, addToNLA, getAnimations (+4) |
| `skills/blender-astro/scripts/src/blender/mixamo.ts` | getManualDownloadInstructions, getPopularAnimations, getRecommendedSettings, MixamoHelper |
| `skills/blender-astro/scripts/src/blender/client.ts` | sendCommand, messageHandler, BlenderClient, close |
| `skills/blender-astro/scripts/src/cli/commands/retargeting.ts` | registerRetargetingCommands |
| `src/hooks/useNetworkStatus.js` | off |
| `skills/blender-astro/scripts/src/cli/commands/material.ts` | registerMaterialCommands |
| `skills/blender-astro/scripts/src/cli/commands/collection.ts` | registerCollectionCommands |

## Entry Points

Start here when exploring this area:

- **`runRetargetingFromCLI`** (Function) — `skills/blender-astro/scripts/src/index.ts:292`
- **`registerRetargetingCommands`** (Function) — `skills/blender-astro/scripts/src/cli/commands/retargeting.ts:9`
- **`findProjectRoot`** (Function) — `skills/blender-astro/scripts/src/blender/config.ts:62`
- **`getProjectConfig`** (Function) — `skills/blender-astro/scripts/src/blender/config.ts:189`
- **`updateProjectLastUsed`** (Function) — `skills/blender-astro/scripts/src/blender/config.ts:260`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `AnimationRetargetingWorkflow` | Class | `skills/blender-astro/scripts/src/index.ts` | 34 |
| `RetargetingController` | Class | `skills/blender-astro/scripts/src/blender/retargeting.ts` | 23 |
| `MixamoHelper` | Class | `skills/blender-astro/scripts/src/blender/mixamo.ts` | 8 |
| `BlenderClient` | Class | `skills/blender-astro/scripts/src/blender/client.ts` | 30 |
| `runRetargetingFromCLI` | Function | `skills/blender-astro/scripts/src/index.ts` | 292 |
| `registerRetargetingCommands` | Function | `skills/blender-astro/scripts/src/cli/commands/retargeting.ts` | 9 |
| `findProjectRoot` | Function | `skills/blender-astro/scripts/src/blender/config.ts` | 62 |
| `getProjectConfig` | Function | `skills/blender-astro/scripts/src/blender/config.ts` | 189 |
| `updateProjectLastUsed` | Function | `skills/blender-astro/scripts/src/blender/config.ts` | 260 |
| `getProjectPort` | Function | `skills/blender-astro/scripts/src/blender/config.ts` | 274 |
| `isPortAvailable` | Function | `skills/blender-astro/scripts/src/blender/config.ts` | 318 |
| `findAvailablePort` | Function | `skills/blender-astro/scripts/src/blender/config.ts` | 338 |
| `off` | Function | `src/hooks/useNetworkStatus.js` | 11 |
| `messageHandler` | Function | `skills/blender-astro/scripts/src/blender/client.ts` | 133 |
| `registerMaterialCommands` | Function | `skills/blender-astro/scripts/src/cli/commands/material.ts` | 8 |
| `registerCollectionCommands` | Function | `skills/blender-astro/scripts/src/cli/commands/collection.ts` | 8 |
| `loadSharedConfig` | Function | `skills/blender-astro/scripts/src/blender/config.ts` | 123 |
| `saveSharedConfig` | Function | `skills/blender-astro/scripts/src/blender/config.ts` | 158 |
| `listProjects` | Function | `skills/blender-astro/scripts/src/blender/config.ts` | 282 |
| `resetProjectConfig` | Function | `skills/blender-astro/scripts/src/blender/config.ts` | 304 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `RunRetargetingFromCLI → Off` | cross_community | 5 |
| `RunRetargetingFromCLI → On` | cross_community | 5 |
| `RegisterRetargetingCommands → Off` | cross_community | 5 |
| `RegisterRetargetingCommands → On` | cross_community | 5 |
| `Start → GetSharedConfigPath` | cross_community | 5 |
| `UpdateProjectLastUsed → GetSharedConfigPath` | cross_community | 4 |
| `ResetProjectConfig → GetSharedConfigPath` | intra_community | 4 |
| `ListProjects → GetSharedConfigPath` | intra_community | 4 |
| `RunRetargetingFromCLI → GetManualDownloadInstructions` | intra_community | 3 |
| `RunRetargetingFromCLI → GetRecommendedSettings` | intra_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Console | 4 calls |
| Daemon | 1 calls |

## How to Explore

1. `gitnexus_context({name: "runRetargetingFromCLI"})` — see callers and callees
2. `gitnexus_query({query: "blender"})` — find related execution flows
3. Read key files listed above for implementation details
