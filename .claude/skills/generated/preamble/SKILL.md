---
name: preamble
description: "Skill for the Preamble area of psoulc. 24 symbols across 22 files."
---

# Preamble

24 symbols | 22 files | Cohesion: 96%

## When to Use

- Working with code in `gstack/`
- Understanding how generatePreamble, generateModelOverlay, generateWritingStyle work
- Modifying preamble-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `gstack/scripts/resolvers/model-overlay.ts` | readOverlay, generateModelOverlay |
| `gstack/scripts/resolvers/preamble/generate-writing-style.ts` | loadJargonList, generateWritingStyle |
| `gstack/scripts/resolvers/preamble.ts` | generatePreamble |
| `gstack/scripts/resolvers/preamble/generate-writing-style-migration.ts` | generateWritingStyleMigration |
| `gstack/scripts/resolvers/preamble/generate-voice-directive.ts` | generateVoiceDirective |
| `gstack/scripts/resolvers/preamble/generate-vendoring-deprecation.ts` | generateVendoringDeprecation |
| `gstack/scripts/resolvers/preamble/generate-upgrade-check.ts` | generateUpgradeCheck |
| `gstack/scripts/resolvers/preamble/generate-telemetry-prompt.ts` | generateTelemetryPrompt |
| `gstack/scripts/resolvers/preamble/generate-spawned-session-check.ts` | generateSpawnedSessionCheck |
| `gstack/scripts/resolvers/preamble/generate-search-before-building.ts` | generateSearchBeforeBuildingSection |

## Entry Points

Start here when exploring this area:

- **`generatePreamble`** (Function) — `gstack/scripts/resolvers/preamble.ts:70`
- **`generateModelOverlay`** (Function) — `gstack/scripts/resolvers/model-overlay.ts:45`
- **`generateWritingStyle`** (Function) — `gstack/scripts/resolvers/preamble/generate-writing-style.ts:17`
- **`generateWritingStyleMigration`** (Function) — `gstack/scripts/resolvers/preamble/generate-writing-style-migration.ts:2`
- **`generateVoiceDirective`** (Function) — `gstack/scripts/resolvers/preamble/generate-voice-directive.ts:2`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `generatePreamble` | Function | `gstack/scripts/resolvers/preamble.ts` | 70 |
| `generateModelOverlay` | Function | `gstack/scripts/resolvers/model-overlay.ts` | 45 |
| `generateWritingStyle` | Function | `gstack/scripts/resolvers/preamble/generate-writing-style.ts` | 17 |
| `generateWritingStyleMigration` | Function | `gstack/scripts/resolvers/preamble/generate-writing-style-migration.ts` | 2 |
| `generateVoiceDirective` | Function | `gstack/scripts/resolvers/preamble/generate-voice-directive.ts` | 2 |
| `generateVendoringDeprecation` | Function | `gstack/scripts/resolvers/preamble/generate-vendoring-deprecation.ts` | 2 |
| `generateUpgradeCheck` | Function | `gstack/scripts/resolvers/preamble/generate-upgrade-check.ts` | 2 |
| `generateTelemetryPrompt` | Function | `gstack/scripts/resolvers/preamble/generate-telemetry-prompt.ts` | 2 |
| `generateSpawnedSessionCheck` | Function | `gstack/scripts/resolvers/preamble/generate-spawned-session-check.ts` | 2 |
| `generateSearchBeforeBuildingSection` | Function | `gstack/scripts/resolvers/preamble/generate-search-before-building.ts` | 2 |
| `generateRoutingInjection` | Function | `gstack/scripts/resolvers/preamble/generate-routing-injection.ts` | 2 |
| `generateRepoModeSection` | Function | `gstack/scripts/resolvers/preamble/generate-repo-mode-section.ts` | 2 |
| `generateProactivePrompt` | Function | `gstack/scripts/resolvers/preamble/generate-proactive-prompt.ts` | 2 |
| `generateLakeIntro` | Function | `gstack/scripts/resolvers/preamble/generate-lake-intro.ts` | 2 |
| `generateContinuousCheckpoint` | Function | `gstack/scripts/resolvers/preamble/generate-continuous-checkpoint.ts` | 2 |
| `generateContextRecovery` | Function | `gstack/scripts/resolvers/preamble/generate-context-recovery.ts` | 2 |
| `generateContextHealth` | Function | `gstack/scripts/resolvers/preamble/generate-context-health.ts` | 2 |
| `generateConfusionProtocol` | Function | `gstack/scripts/resolvers/preamble/generate-confusion-protocol.ts` | 0 |
| `generateCompletionStatus` | Function | `gstack/scripts/resolvers/preamble/generate-completion-status.ts` | 2 |
| `generateCompletenessSection` | Function | `gstack/scripts/resolvers/preamble/generate-completeness-section.ts` | 2 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `GeneratePreamble → GetHostConfig` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Scripts | 1 calls |
| Resolvers | 1 calls |

## How to Explore

1. `gitnexus_context({name: "generatePreamble"})` — see callers and callees
2. `gitnexus_query({query: "preamble"})` — find related execution flows
3. Read key files listed above for implementation details
