---
name: cluster-308
description: "Skill for the Cluster_308 area of psoulc. 22 symbols across 6 files."
---

# Cluster_308

22 symbols | 6 files | Cohesion: 61%

## When to Use

- Working with code in `gstack/`
- Understanding how checkDomain, getSessionMarker, datamarkContent work
- Modifying cluster_308-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `gstack/browse/src/content-security.ts` | ensureMarker, getSessionMarker, datamarkContent, markHiddenElements, getCleanTextWithStripping (+5) |
| `gstack/browse/src/server.ts` | wrapError, handleCommandInternal, handleCommand |
| `gstack/browse/src/commands.ts` | canonicalizeCommand, levenshtein, buildUnknownCommandError |
| `gstack/browse/src/browser-manager.ts` | addWatchSnapshot, incrementFailures, getFailureHint |
| `gstack/browse/src/token-registry.ts` | checkDomain, matchDomainGlob |
| `gstack/browse/src/audit.ts` | writeAuditEntry |

## Entry Points

Start here when exploring this area:

- **`checkDomain`** (Function) — `gstack/browse/src/token-registry.ts:351`
- **`getSessionMarker`** (Function) — `gstack/browse/src/content-security.ts:28`
- **`datamarkContent`** (Function) — `gstack/browse/src/content-security.ts:42`
- **`markHiddenElements`** (Function) — `gstack/browse/src/content-security.ts:86`
- **`getCleanTextWithStripping`** (Function) — `gstack/browse/src/content-security.ts:168`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `checkDomain` | Function | `gstack/browse/src/token-registry.ts` | 351 |
| `getSessionMarker` | Function | `gstack/browse/src/content-security.ts` | 28 |
| `datamarkContent` | Function | `gstack/browse/src/content-security.ts` | 42 |
| `markHiddenElements` | Function | `gstack/browse/src/content-security.ts` | 86 |
| `getCleanTextWithStripping` | Function | `gstack/browse/src/content-security.ts` | 168 |
| `cleanupHiddenMarkers` | Function | `gstack/browse/src/content-security.ts` | 189 |
| `escapeEnvelopeSentinels` | Function | `gstack/browse/src/content-security.ts` | 214 |
| `wrapUntrustedPageContent` | Function | `gstack/browse/src/content-security.ts` | 225 |
| `getFilterMode` | Function | `gstack/browse/src/content-security.ts` | 271 |
| `runContentFilters` | Function | `gstack/browse/src/content-security.ts` | 281 |
| `canonicalizeCommand` | Function | `gstack/browse/src/commands.ts` | 203 |
| `buildUnknownCommandError` | Function | `gstack/browse/src/commands.ts` | 252 |
| `writeAuditEntry` | Function | `gstack/browse/src/audit.ts` | 41 |
| `addWatchSnapshot` | Method | `gstack/browse/src/browser-manager.ts` | 124 |
| `incrementFailures` | Method | `gstack/browse/src/browser-manager.ts` | 1243 |
| `getFailureHint` | Method | `gstack/browse/src/browser-manager.ts` | 1251 |
| `matchDomainGlob` | Function | `gstack/browse/src/token-registry.ts` | 369 |
| `wrapError` | Function | `gstack/browse/src/server.ts` | 1032 |
| `handleCommandInternal` | Function | `gstack/browse/src/server.ts` | 1069 |
| `handleCommand` | Function | `gstack/browse/src/server.ts` | 1407 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `HandleCommandInternal → Get` | cross_community | 4 |
| `HandleCommandInternal → Set` | cross_community | 4 |
| `HandleCommandInternal → MatchDomainGlob` | intra_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Cluster_307 | 5 calls |
| Extension | 5 calls |
| Test | 5 calls |
| Cluster_312 | 2 calls |
| Cluster_306 | 1 calls |
| Cluster_311 | 1 calls |
| Cluster_325 | 1 calls |
| Cluster_326 | 1 calls |

## How to Explore

1. `gitnexus_context({name: "checkDomain"})` — see callers and callees
2. `gitnexus_query({query: "cluster_308"})` — find related execution flows
3. Read key files listed above for implementation details
