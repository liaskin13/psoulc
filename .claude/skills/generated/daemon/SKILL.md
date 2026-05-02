---
name: daemon
description: "Skill for the Daemon area of psoulc. 45 symbols across 15 files."
---

# Daemon

45 symbols | 15 files | Cohesion: 67%

## When to Use

- Working with code in `skills/`
- Understanding how registerDaemonCommands, on, checkTranscript work
- Modifying daemon-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `skills/blender-astro/scripts/src/daemon/server.ts` | start, startIPCServer, handleIPCConnection, setupShutdownHandlers, shutdown (+7) |
| `skills/blender-astro/scripts/src/daemon/manager.ts` | DaemonManager, stop, restart, getStatus, constructor (+6) |
| `skills/blender-astro/scripts/src/daemon/client.ts` | IPCClient, connect, setupSocket, handleResponse, rejectAllPending (+4) |
| `gstack/browse/src/security-classifier.ts` | checkHaikuAvailable, checkTranscript |
| `gstack/browse/src/server.ts` | closeTunnel |
| `skills/blender-astro/scripts/src/cli/commands/daemon.ts` | registerDaemonCommands |
| `src/hooks/useNetworkStatus.js` | on |
| `gstack/browse/src/bun-polyfill.cjs` | kill |
| `skills/superpowers-main/superpowers-main/tests/brainstorm-server/server.test.js` | fetch |
| `gstack/browse/test/security-review-fullstack.test.ts` | stopStack |

## Entry Points

Start here when exploring this area:

- **`registerDaemonCommands`** (Function) — `skills/blender-astro/scripts/src/cli/commands/daemon.ts:10`
- **`on`** (Function) — `src/hooks/useNetworkStatus.js:10`
- **`checkTranscript`** (Function) — `gstack/browse/src/security-classifier.ts:419`
- **`getProjectSocketName`** (Function) — `skills/blender-astro/scripts/src/daemon/protocol.ts:49`
- **`getOutputDir`** (Function) — `skills/blender-astro/scripts/src/blender/config.ts:102`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `DaemonManager` | Class | `skills/blender-astro/scripts/src/daemon/manager.ts` | 14 |
| `IPCClient` | Class | `skills/blender-astro/scripts/src/daemon/client.ts` | 19 |
| `registerDaemonCommands` | Function | `skills/blender-astro/scripts/src/cli/commands/daemon.ts` | 10 |
| `on` | Function | `src/hooks/useNetworkStatus.js` | 10 |
| `checkTranscript` | Function | `gstack/browse/src/security-classifier.ts` | 419 |
| `getProjectSocketName` | Function | `skills/blender-astro/scripts/src/daemon/protocol.ts` | 49 |
| `getOutputDir` | Function | `skills/blender-astro/scripts/src/blender/config.ts` | 102 |
| `stop` | Method | `skills/blender-astro/scripts/src/daemon/manager.ts` | 88 |
| `restart` | Method | `skills/blender-astro/scripts/src/daemon/manager.ts` | 188 |
| `getStatus` | Method | `skills/blender-astro/scripts/src/daemon/manager.ts` | 206 |
| `connect` | Method | `skills/blender-astro/scripts/src/daemon/client.ts` | 51 |
| `setupSocket` | Method | `skills/blender-astro/scripts/src/daemon/client.ts` | 86 |
| `handleResponse` | Method | `skills/blender-astro/scripts/src/daemon/client.ts` | 135 |
| `rejectAllPending` | Method | `skills/blender-astro/scripts/src/daemon/client.ts` | 156 |
| `sendRequest` | Method | `skills/blender-astro/scripts/src/daemon/client.ts` | 167 |
| `close` | Method | `skills/blender-astro/scripts/src/daemon/client.ts` | 201 |
| `isHealthy` | Method | `gstack/browse/src/browser-manager.ts` | 554 |
| `isConnected` | Method | `skills/blender-astro/scripts/src/blender/client.ts` | 194 |
| `constructor` | Method | `skills/blender-astro/scripts/src/daemon/manager.ts` | 18 |
| `constructor` | Method | `skills/blender-astro/scripts/src/daemon/client.ts` | 29 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Start → On` | cross_community | 7 |
| `Restart → Get` | cross_community | 7 |
| `Start → IsConnected` | cross_community | 6 |
| `Restart → On` | cross_community | 6 |
| `Restart → RejectAllPending` | intra_community | 6 |
| `Start → On` | cross_community | 5 |
| `AskClaude → On` | cross_community | 5 |
| `RunRetargetingFromCLI → On` | cross_community | 5 |
| `RegisterDaemonCommands → IsProcessRunning` | cross_community | 5 |
| `RegisterDaemonCommands → On` | cross_community | 5 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Blender | 4 calls |
| Extension | 3 calls |
| Console | 2 calls |
| Cluster_311 | 1 calls |
| Hooks | 1 calls |
| Cluster_77 | 1 calls |

## How to Explore

1. `gitnexus_context({name: "registerDaemonCommands"})` — see callers and callees
2. `gitnexus_query({query: "daemon"})` — find related execution flows
3. Read key files listed above for implementation details
