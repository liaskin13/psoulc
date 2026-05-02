---
name: cluster-317
description: "Skill for the Cluster_317 area of psoulc. 23 symbols across 3 files."
---

# Cluster_317

23 symbols | 3 files | Cohesion: 81%

## When to Use

- Working with code in `gstack/`
- Understanding how combineVerdict, checkCanaryInStructure, hashPayload work
- Modifying cluster_317-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `gstack/browse/src/sidebar-agent.ts` | cancelFileForTab, sendEvent, shorten, describeToolCall, summarizeToolInput (+6) |
| `gstack/browse/src/security.ts` | combineVerdict, checkCanaryInStructure, getDeviceSalt, hashPayload, rotateIfNeeded (+3) |
| `gstack/browse/src/security-classifier.ts` | htmlToPlainText, scanPageContent, scanPageContentDeberta, shouldRunTranscriptCheck |

## Entry Points

Start here when exploring this area:

- **`combineVerdict`** (Function) — `gstack/browse/src/security.ts:95`
- **`checkCanaryInStructure`** (Function) — `gstack/browse/src/security.ts:212`
- **`hashPayload`** (Function) — `gstack/browse/src/security.ts:277`
- **`logAttempt`** (Function) — `gstack/browse/src/security.ts:370`
- **`excerptForReview`** (Function) — `gstack/browse/src/security.ts:486`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `combineVerdict` | Function | `gstack/browse/src/security.ts` | 95 |
| `checkCanaryInStructure` | Function | `gstack/browse/src/security.ts` | 212 |
| `hashPayload` | Function | `gstack/browse/src/security.ts` | 277 |
| `logAttempt` | Function | `gstack/browse/src/security.ts` | 370 |
| `excerptForReview` | Function | `gstack/browse/src/security.ts` | 486 |
| `extractDomain` | Function | `gstack/browse/src/security.ts` | 526 |
| `scanPageContent` | Function | `gstack/browse/src/security-classifier.ts` | 254 |
| `scanPageContentDeberta` | Function | `gstack/browse/src/security-classifier.ts` | 343 |
| `shouldRunTranscriptCheck` | Function | `gstack/browse/src/security-classifier.ts` | 528 |
| `cancelFileForTab` | Function | `gstack/browse/src/sidebar-agent.ts` | 36 |
| `sendEvent` | Function | `gstack/browse/src/sidebar-agent.ts` | 143 |
| `shorten` | Function | `gstack/browse/src/sidebar-agent.ts` | 163 |
| `describeToolCall` | Function | `gstack/browse/src/sidebar-agent.ts` | 172 |
| `summarizeToolInput` | Function | `gstack/browse/src/sidebar-agent.ts` | 240 |
| `detectCanaryLeak` | Function | `gstack/browse/src/sidebar-agent.ts` | 250 |
| `extractToolResultText` | Function | `gstack/browse/src/sidebar-agent.ts` | 328 |
| `handleStreamEvent` | Function | `gstack/browse/src/sidebar-agent.ts` | 348 |
| `onCanaryLeaked` | Function | `gstack/browse/src/sidebar-agent.ts` | 432 |
| `preSpawnSecurityCheck` | Function | `gstack/browse/src/sidebar-agent.ts` | 479 |
| `askClaude` | Function | `gstack/browse/src/sidebar-agent.ts` | 536 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `AskClaude → On` | cross_community | 5 |
| `AskClaude → HtmlToPlainText` | intra_community | 4 |
| `AskClaude → IsDebertaEnabled` | cross_community | 4 |
| `AskClaude → Kill` | cross_community | 4 |
| `HandleStreamEvent → Shorten` | intra_community | 4 |
| `OnCanaryLeaked → FindTelemetryBinary` | cross_community | 4 |
| `OnCanaryLeaked → Unref` | cross_community | 4 |
| `OnCanaryLeaked → On` | cross_community | 4 |
| `OnCanaryLeaked → GetBreakpoint` | cross_community | 4 |
| `AskClaude → RefreshToken` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Daemon | 4 calls |
| Extension | 3 calls |
| Cluster_319 | 2 calls |
| Cluster_327 | 2 calls |
| Cluster_334 | 1 calls |
| Hooks | 1 calls |
| Cluster_77 | 1 calls |

## How to Explore

1. `gitnexus_context({name: "combineVerdict"})` — see callers and callees
2. `gitnexus_query({query: "cluster_317"})` — find related execution flows
3. Read key files listed above for implementation details
