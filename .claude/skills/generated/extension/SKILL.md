---
name: extension
description: "Skill for the Extension area of psoulc. 103 symbols across 15 files."
---

# Extension

103 symbols | 15 files | Cohesion: 74%

## When to Use

- Working with code in `gstack/`
- Understanding how validateHostConfig, validateAllConfigs, extractRemoteSlugPatterns work
- Modifying extension-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `gstack/extension/sidepanel.js` | authHeaders, formatChatTime, showSecurityBanner, hideSecurityBanner, postSecurityDecision (+40) |
| `gstack/extension/inspector.js` | findElement, applyStyle, toggleClass, buildSelector, isUnique (+9) |
| `gstack/extension/content.js` | captureBasicData, basicBuildSelector, basicPickerCleanup, onBasicClick, onBasicKeydown (+6) |
| `gstack/extension/background.js` | loadPort, getBaseUrl, loadAuthToken, executeCommand, fetchAndRelayRefs (+5) |
| `gstack/browse/src/token-registry.ts` | checkRateLimit, checkRate, restoreRegistry, recordCommand |
| `gstack/browse/src/browser-manager.ts` | transferTab, getTabOwner, checkTabAccess, getSession |
| `gstack/browse/src/server.ts` | generateHelpText, validateAuth, getTabAgentStatus |
| `gstack/scripts/host-config.ts` | validateHostConfig, validateAllConfigs |
| `gstack/test/helpers/skill-parser.ts` | extractRemoteSlugPatterns, extractWeightsFromTable |
| `gstack/browse/src/buffers.ts` | set, get |

## Entry Points

Start here when exploring this area:

- **`validateHostConfig`** (Function) — `gstack/scripts/host-config.ts:119`
- **`validateAllConfigs`** (Function) — `gstack/scripts/host-config.ts:157`
- **`extractRemoteSlugPatterns`** (Function) — `gstack/test/helpers/skill-parser.ts:144`
- **`extractWeightsFromTable`** (Function) — `gstack/test/helpers/skill-parser.ts:179`
- **`generateCommandReference`** (Function) — `gstack/scripts/resolvers/browse.ts:4`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `validateHostConfig` | Function | `gstack/scripts/host-config.ts` | 119 |
| `validateAllConfigs` | Function | `gstack/scripts/host-config.ts` | 157 |
| `extractRemoteSlugPatterns` | Function | `gstack/test/helpers/skill-parser.ts` | 144 |
| `extractWeightsFromTable` | Function | `gstack/test/helpers/skill-parser.ts` | 179 |
| `generateCommandReference` | Function | `gstack/scripts/resolvers/browse.ts` | 4 |
| `checkRate` | Function | `gstack/browse/src/token-registry.ts` | 382 |
| `restoreRegistry` | Function | `gstack/browse/src/token-registry.ts` | 459 |
| `logTunnelDenial` | Function | `gstack/browse/src/tunnel-denial-log.ts` | 48 |
| `recordCommand` | Function | `gstack/browse/src/token-registry.ts` | 390 |
| `extractSseCookie` | Function | `gstack/browse/src/sse-session-cookie.ts` | 70 |
| `set` | Method | `gstack/browse/src/buffers.ts` | 84 |
| `transferTab` | Method | `gstack/browse/src/browser-manager.ts` | 710 |
| `getInfo` | Method | `gstack/lib/worktree.ts` | 303 |
| `get` | Method | `gstack/browse/src/buffers.ts` | 78 |
| `getTabOwner` | Method | `gstack/browse/src/browser-manager.ts` | 690 |
| `checkTabAccess` | Method | `gstack/browse/src/browser-manager.ts` | 699 |
| `getSession` | Method | `gstack/browse/src/browser-manager.ts` | 737 |
| `authHeaders` | Function | `gstack/extension/sidepanel.js` | 29 |
| `formatChatTime` | Function | `gstack/extension/sidepanel.js` | 95 |
| `showSecurityBanner` | Function | `gstack/extension/sidepanel.js` | 119 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Restart → Get` | cross_community | 7 |
| `Main → Get` | cross_community | 6 |
| `UpdateConnection → EscapeHtml` | cross_community | 6 |
| `Handoff → Get` | cross_community | 5 |
| `SpawnClaude → Get` | cross_community | 5 |
| `UpdateConnection → GetEntryClass` | cross_community | 5 |
| `UpdateConnection → FormatTime` | cross_community | 5 |
| `UpdateConnection → FmtBoxVal` | cross_community | 5 |
| `BenchClassify → Get` | cross_community | 5 |
| `MakeFetchHandler → Get` | cross_community | 4 |

## How to Explore

1. `gitnexus_context({name: "validateHostConfig"})` — see callers and callees
2. `gitnexus_query({query: "extension"})` — find related execution flows
3. Read key files listed above for implementation details
