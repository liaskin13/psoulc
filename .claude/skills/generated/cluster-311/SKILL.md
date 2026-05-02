---
name: cluster-311
description: "Skill for the Cluster_311 area of psoulc. 17 symbols across 3 files."
---

# Cluster_311

17 symbols | 3 files | Cohesion: 62%

## When to Use

- Working with code in `gstack/`
- Understanding how cleanup, TabSession, setTabContent work
- Modifying cluster_311-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `gstack/browse/src/browser-manager.ts` | findExtensionPath, launchHeaded, cleanup, close, newTab (+8) |
| `gstack/browse/src/tab-session.ts` | TabSession, setTabContent, getLoadedHtml |
| `gstack/browse/src/buffers.ts` | clear |

## Entry Points

Start here when exploring this area:

- **`cleanup`** (Function) — `gstack/browse/src/browser-manager.ts:400`
- **`TabSession`** (Class) — `gstack/browse/src/tab-session.ts:28`
- **`setTabContent`** (Method) — `gstack/browse/src/tab-session.ts:181`
- **`getLoadedHtml`** (Method) — `gstack/browse/src/tab-session.ts:192`
- **`clear`** (Method) — `gstack/browse/src/buffers.ts:71`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `TabSession` | Class | `gstack/browse/src/tab-session.ts` | 28 |
| `cleanup` | Function | `gstack/browse/src/browser-manager.ts` | 400 |
| `setTabContent` | Method | `gstack/browse/src/tab-session.ts` | 181 |
| `getLoadedHtml` | Method | `gstack/browse/src/tab-session.ts` | 192 |
| `clear` | Method | `gstack/browse/src/buffers.ts` | 71 |
| `findExtensionPath` | Method | `gstack/browse/src/browser-manager.ts` | 132 |
| `launchHeaded` | Method | `gstack/browse/src/browser-manager.ts` | 245 |
| `close` | Method | `gstack/browse/src/browser-manager.ts` | 531 |
| `newTab` | Method | `gstack/browse/src/browser-manager.ts` | 570 |
| `closeTab` | Method | `gstack/browse/src/browser-manager.ts` | 602 |
| `clearRefs` | Method | `gstack/browse/src/browser-manager.ts` | 761 |
| `closeAllPages` | Method | `gstack/browse/src/browser-manager.ts` | 844 |
| `saveState` | Method | `gstack/browse/src/browser-manager.ts` | 870 |
| `restoreState` | Method | `gstack/browse/src/browser-manager.ts` | 911 |
| `recreateContext` | Method | `gstack/browse/src/browser-manager.ts` | 1000 |
| `setDeviceScaleFactor` | Method | `gstack/browse/src/browser-manager.ts` | 1073 |
| `handoff` | Method | `gstack/browse/src/browser-manager.ts` | 1130 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `HandleMetaCommand → IsBlockedIpv6` | cross_community | 5 |
| `HandleMetaCommand → ClearRefs` | cross_community | 5 |
| `Start → NormalizeFileUrl` | cross_community | 5 |
| `Start → ValidateReadPath` | cross_community | 5 |
| `Start → NormalizeHostname` | cross_community | 5 |
| `Start → On` | cross_community | 5 |
| `Handoff → Get` | cross_community | 5 |
| `RecreateContext → ClearRefs` | cross_community | 5 |
| `HandleMetaCommand → NormalizeFileUrl` | cross_community | 4 |
| `HandleMetaCommand → ValidateReadPath` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Extension | 5 calls |
| Cluster_350 | 3 calls |
| Test | 2 calls |
| Daemon | 2 calls |
| Cluster_302 | 2 calls |
| Cluster_313 | 1 calls |
| Cluster_316 | 1 calls |

## How to Explore

1. `gitnexus_context({name: "cleanup"})` — see callers and callees
2. `gitnexus_query({query: "cluster_311"})` — find related execution flows
3. Read key files listed above for implementation details
