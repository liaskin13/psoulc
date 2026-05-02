---
name: scripts
description: "Skill for the Scripts area of psoulc. 68 symbols across 18 files."
---

# Scripts

68 symbols | 18 files | Cohesion: 87%

## When to Use

- Working with code in `gstack/`
- Understanding how getHostConfig, generateCoAuthorTrailer, generatePreambleBash work
- Modifying scripts-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `skills/superpowers-main/superpowers-main/skills/brainstorming/scripts/server.cjs` | computeAcceptKey, encodeFrame, decodeFrame, handleUpgrade, broadcast (+7) |
| `gstack/scripts/gen-skill-docs.ts` | extractNameAndDescription, extractVoiceTriggers, processVoiceTriggers, transformFrontmatter, processTemplate (+6) |
| `gstack/scripts/garry-output-comparison.ts` | isLogicalLine, enumerateCommits, analyzeCommit, daysElapsed, analyzeRepo (+4) |
| `skills/ui-ux-pro-max/scripts/core.py` | tokenize, fit, score, _load_csv, _search_csv (+3) |
| `gstack/scripts/eval-watch.ts` | readJSON, isProcessAlive, formatDuration, renderDashboard, render |
| `gstack/scripts/analytics.ts` | parseJSONL, filterByPeriod, formatReport, main |
| `skills/superpowers-main/superpowers-main/tests/brainstorm-server/ws-protocol.test.js` | runTests, test, makeClientFrame |
| `gstack/scripts/discover-skills.ts` | subdirs, discoverTemplates, discoverSkillFiles |
| `gstack/test/helpers/skill-parser.ts` | extractBrowseCommands, validateSkill |
| `gstack/scripts/one-way-doors.ts` | classifyQuestion, isOneWayDoor |

## Entry Points

Start here when exploring this area:

- **`getHostConfig`** (Function) — `gstack/hosts/index.ts:34`
- **`generateCoAuthorTrailer`** (Function) — `gstack/scripts/resolvers/utility.ts:368`
- **`generatePreambleBash`** (Function) — `gstack/scripts/resolvers/preamble/generate-preamble-bash.ts:3`
- **`tokenize`** (Function) — `skills/ui-ux-pro-max/scripts/core.py:96`
- **`fit`** (Function) — `skills/ui-ux-pro-max/scripts/core.py:101`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `getHostConfig` | Function | `gstack/hosts/index.ts` | 34 |
| `generateCoAuthorTrailer` | Function | `gstack/scripts/resolvers/utility.ts` | 368 |
| `generatePreambleBash` | Function | `gstack/scripts/resolvers/preamble/generate-preamble-bash.ts` | 3 |
| `tokenize` | Function | `skills/ui-ux-pro-max/scripts/core.py` | 96 |
| `fit` | Function | `skills/ui-ux-pro-max/scripts/core.py` | 101 |
| `score` | Function | `skills/ui-ux-pro-max/scripts/core.py` | 120 |
| `detect_domain` | Function | `skills/ui-ux-pro-max/scripts/core.py` | 177 |
| `search` | Function | `skills/ui-ux-pro-max/scripts/core.py` | 197 |
| `search_stack` | Function | `skills/ui-ux-pro-max/scripts/core.py` | 219 |
| `parseJSONL` | Function | `gstack/scripts/analytics.ts` | 30 |
| `filterByPeriod` | Function | `gstack/scripts/analytics.ts` | 50 |
| `formatReport` | Function | `gstack/scripts/analytics.ts` | 68 |
| `renderDashboard` | Function | `gstack/scripts/eval-watch.ts` | 73 |
| `discoverTemplates` | Function | `gstack/scripts/discover-skills.ts` | 16 |
| `discoverSkillFiles` | Function | `gstack/scripts/discover-skills.ts` | 28 |
| `extractBrowseCommands` | Function | `gstack/test/helpers/skill-parser.ts` | 39 |
| `validateSkill` | Function | `gstack/test/helpers/skill-parser.ts` | 104 |
| `parseSnapshotArgs` | Function | `gstack/browse/src/snapshot.ts` | 83 |
| `getQuestion` | Function | `gstack/scripts/question-registry.ts` | 606 |
| `classifyQuestion` | Function | `gstack/scripts/one-way-doors.ts` | 111 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `HandleUpgrade → GetBreakpoint` | cross_community | 4 |
| `GeneratePreamble → GetHostConfig` | cross_community | 3 |
| `HandleUpgrade → Get` | cross_community | 3 |
| `HandleRequest → Get` | cross_community | 3 |
| `ProcessExternalHost → GetHostConfig` | cross_community | 3 |
| `ProcessExternalHost → ExtractNameAndDescription` | cross_community | 3 |
| `ProcessTemplate → ExtractVoiceTriggers` | intra_community | 3 |
| `ProcessTemplate → ExtractNameAndDescription` | intra_community | 3 |
| `ProcessTemplate → GetHostConfig` | intra_community | 3 |
| `Main → Set` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Extension | 4 calls |
| Cluster_242 | 2 calls |
| Daemon | 2 calls |
| Hooks | 1 calls |
| Cluster_77 | 1 calls |

## How to Explore

1. `gitnexus_context({name: "getHostConfig"})` — see callers and callees
2. `gitnexus_query({query: "scripts"})` — find related execution flows
3. Read key files listed above for implementation details
