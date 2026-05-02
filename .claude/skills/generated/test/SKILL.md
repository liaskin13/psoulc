---
name: test
description: "Skill for the Test area of psoulc. 154 symbols across 54 files."
---

# Test

154 symbols | 54 files | Cohesion: 75%

## When to Use

- Working with code in `gstack/`
- Understanding how handleWriteCommand, handleReadCommand, isCaptureActive work
- Modifying test-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `gstack/browse/src/browser-manager.ts` | getActiveSession, getPage, resolveRef, getRefRole, getRefCount (+11) |
| `gstack/browse/src/network-capture.ts` | exportToFile, summary, isCaptureActive, getCaptureBuffer, createResponseListener (+4) |
| `gstack/browse/src/cookie-picker-routes.ts` | generatePickerCode, getSessionFromCookie, isValidSession, corsOrigin, jsonResponse (+2) |
| `gstack/browse/src/tab-session.ts` | resolveRef, getRefRole, getRefCount, getFrame, getActiveFrameOrPage (+1) |
| `gstack/test/skill-e2e.test.ts` | recordE2E, setupBrowseShims, logCost, dumpOutcomeDiagnostic, runPlantedBugEval (+1) |
| `gstack/browse/src/read-commands.ts` | hasAwait, needsBlockWrapper, wrapForEvaluate, assertJsOriginAllowed, handleReadCommand |
| `gstack/browse/test/cookie-import-browser.test.ts` | encryptCookieValue, chromiumEpoch, createFixtureDb, createMacFixtureDb, createLinuxFixtureDb |
| `gstack/browse/src/cookie-import-browser.ts` | findBrowserExe, isBrowserRunning, importCookiesViaCdp, findInstalledBrowsers |
| `gstack/test/helpers/llm-judge.ts` | callJudge, judge, outcomeJudge, judgePosture |
| `gstack/test/helpers/e2e-helpers.ts` | setupBrowseShims, logCost, dumpOutcomeDiagnostic, recordE2E |

## Entry Points

Start here when exploring this area:

- **`handleWriteCommand`** (Function) — `gstack/browse/src/write-commands.ts:129`
- **`handleReadCommand`** (Function) — `gstack/browse/src/read-commands.ts:97`
- **`isCaptureActive`** (Function) — `gstack/browse/src/network-capture.ts:91`
- **`getCaptureBuffer`** (Function) — `gstack/browse/src/network-capture.ts:95`
- **`startCapture`** (Function) — `gstack/browse/src/network-capture.ts:148`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `handleWriteCommand` | Function | `gstack/browse/src/write-commands.ts` | 129 |
| `handleReadCommand` | Function | `gstack/browse/src/read-commands.ts` | 97 |
| `isCaptureActive` | Function | `gstack/browse/src/network-capture.ts` | 91 |
| `getCaptureBuffer` | Function | `gstack/browse/src/network-capture.ts` | 95 |
| `startCapture` | Function | `gstack/browse/src/network-capture.ts` | 148 |
| `getCaptureListener` | Function | `gstack/browse/src/network-capture.ts` | 156 |
| `stopCapture` | Function | `gstack/browse/src/network-capture.ts` | 161 |
| `exportCapture` | Function | `gstack/browse/src/network-capture.ts` | 176 |
| `extractMedia` | Function | `gstack/browse/src/media-extract.ts` | 70 |
| `getModificationHistory` | Function | `gstack/browse/src/cdp-inspector.ts` | 620 |
| `formatInspectorResult` | Function | `gstack/browse/src/cdp-inspector.ts` | 655 |
| `parseGeminiJSONL` | Function | `gstack/test/helpers/gemini-session-runner.ts` | 49 |
| `runGeminiSkill` | Function | `gstack/test/helpers/gemini-session-runner.ts` | 94 |
| `locateBinary` | Function | `gstack/browse/src/find-browse.ts` | 26 |
| `getGitRoot` | Function | `gstack/browse/src/config.ts` | 28 |
| `resolveConfig` | Function | `gstack/browse/src/config.ts` | 49 |
| `getRemoteSlug` | Function | `gstack/browse/src/config.ts` | 120 |
| `parseCodexJSONL` | Function | `gstack/test/helpers/codex-session-runner.ts` | 51 |
| `installSkillToTempHome` | Function | `gstack/test/helpers/codex-session-runner.ts` | 106 |
| `runCodexSkill` | Function | `gstack/test/helpers/codex-session-runner.ts` | 138 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Handoff → Get` | cross_community | 5 |
| `SpawnClaude → Get` | cross_community | 5 |
| `Main → SpawnSync` | cross_community | 4 |
| `ImportCookies → Spawn` | cross_community | 4 |
| `EnsureServer → SpawnSync` | cross_community | 4 |
| `SendCommand → SpawnSync` | cross_community | 4 |
| `HandleMetaCommand → Get` | cross_community | 3 |
| `Start → SpawnSync` | cross_community | 3 |
| `HandleCookiePickerRoute → Get` | cross_community | 3 |
| `HandleReadCommand → Get` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Extension | 9 calls |
| Cluster_339 | 7 calls |
| Cluster_311 | 4 calls |
| Cluster_215 | 3 calls |
| Cluster_312 | 3 calls |
| Cluster_348 | 3 calls |
| Cluster_338 | 3 calls |
| Cluster_329 | 2 calls |

## How to Explore

1. `gitnexus_context({name: "handleWriteCommand"})` — see callers and callees
2. `gitnexus_query({query: "test"})` — find related execution flows
3. Read key files listed above for implementation details
