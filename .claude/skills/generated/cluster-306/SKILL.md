---
name: cluster-306
description: "Skill for the Cluster_306 area of psoulc. 25 symbols across 8 files."
---

# Cluster_306

25 symbols | 8 files | Cohesion: 56%

## When to Use

- Working with code in `gstack/`
- Understanding how createToken, createSetupKey, exchangeSetupKey work
- Modifying cluster_306-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `gstack/browse/src/token-registry.ts` | generateToken, createToken, createSetupKey, exchangeSetupKey, revokeToken (+2) |
| `gstack/browse/src/server.ts` | getChatBuffer, addChatEntry, saveSession, listSessions, processAgentEvent (+2) |
| `gstack/browse/src/sse-session-cookie.ts` | mintSseSessionToken, validateSseSessionToken, buildSseSetCookie, pruneExpired |
| `gstack/browse/src/browser-manager.ts` | getRefMap, syncActiveTabByUrl, getActiveTabId |
| `gstack/browse/src/tab-session.ts` | getRefEntries |
| `gstack/browse/src/path-security.ts` | validateTempPath |
| `gstack/browse/src/cdp-inspector.ts` | resetModifications |
| `gstack/browse/src/activity.ts` | getSubscriberCount |

## Entry Points

Start here when exploring this area:

- **`createToken`** (Function) — `gstack/browse/src/token-registry.ts:168`
- **`createSetupKey`** (Function) — `gstack/browse/src/token-registry.ts:226`
- **`exchangeSetupKey`** (Function) — `gstack/browse/src/token-registry.ts:254`
- **`revokeToken`** (Function) — `gstack/browse/src/token-registry.ts:398`
- **`listTokens`** (Function) — `gstack/browse/src/token-registry.ts:423`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `createToken` | Function | `gstack/browse/src/token-registry.ts` | 168 |
| `createSetupKey` | Function | `gstack/browse/src/token-registry.ts` | 226 |
| `exchangeSetupKey` | Function | `gstack/browse/src/token-registry.ts` | 254 |
| `revokeToken` | Function | `gstack/browse/src/token-registry.ts` | 398 |
| `listTokens` | Function | `gstack/browse/src/token-registry.ts` | 423 |
| `checkConnectRateLimit` | Function | `gstack/browse/src/token-registry.ts` | 489 |
| `mintSseSessionToken` | Function | `gstack/browse/src/sse-session-cookie.ts` | 38 |
| `validateSseSessionToken` | Function | `gstack/browse/src/sse-session-cookie.ts` | 54 |
| `buildSseSetCookie` | Function | `gstack/browse/src/sse-session-cookie.ts` | 93 |
| `validateTempPath` | Function | `gstack/browse/src/path-security.ts` | 101 |
| `resetModifications` | Function | `gstack/browse/src/cdp-inspector.ts` | 627 |
| `getSubscriberCount` | Function | `gstack/browse/src/activity.ts` | 206 |
| `getRefEntries` | Method | `gstack/browse/src/tab-session.ts` | 122 |
| `getRefMap` | Method | `gstack/browse/src/browser-manager.ts` | 168 |
| `syncActiveTabByUrl` | Method | `gstack/browse/src/browser-manager.ts` | 640 |
| `getActiveTabId` | Method | `gstack/browse/src/browser-manager.ts` | 679 |
| `generateToken` | Function | `gstack/browse/src/token-registry.ts` | 160 |
| `pruneExpired` | Function | `gstack/browse/src/sse-session-cookie.ts` | 103 |
| `getChatBuffer` | Function | `gstack/browse/src/server.ts` | 319 |
| `addChatEntry` | Function | `gstack/browse/src/server.ts` | 408 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `MakeFetchHandler → Get` | cross_community | 4 |
| `MakeFetchHandler → IsRootToken` | cross_community | 4 |
| `MakeFetchHandler → EnsureDir` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Extension | 12 calls |
| Test | 4 calls |
| Cluster_316 | 4 calls |
| Daemon | 3 calls |
| Cluster_320 | 3 calls |
| Cluster_307 | 3 calls |
| Cluster_308 | 3 calls |
| Cluster_305 | 2 calls |

## How to Explore

1. `gitnexus_context({name: "createToken"})` — see callers and callees
2. `gitnexus_query({query: "cluster_306"})` — find related execution flows
3. Read key files listed above for implementation details
