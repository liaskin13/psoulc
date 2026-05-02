---
name: resolvers
description: "Skill for the Resolvers area of psoulc. 22 symbols across 6 files."
---

# Resolvers

22 symbols | 6 files | Cohesion: 97%

## When to Use

- Working with code in `gstack/`
- Understanding how generateReviewArmy, generateQuestionTuning, generateQuestionPreferenceCheck work
- Modifying resolvers-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `gstack/scripts/resolvers/review-army.ts` | generateSpecialistSelection, generateSpecialistDispatch, generateFindingsMerge, generateRedTeam, generateReviewArmy |
| `gstack/scripts/resolvers/question-tuning.ts` | binDir, generateQuestionTuning, generateQuestionPreferenceCheck, generateQuestionLog, generateInlineTuneFeedback |
| `gstack/scripts/resolvers/review.ts` | generatePlanFileDiscovery, generatePlanCompletionAuditInner, generatePlanCompletionAuditShip, generatePlanCompletionAuditReview, generateBenefitsFrom |
| `gstack/scripts/resolvers/testing.ts` | generateTestCoverageAuditInner, generateTestCoverageAuditPlan, generateTestCoverageAuditShip, generateTestCoverageAuditReview |
| `gstack/scripts/resolvers/codex-helpers.ts` | extractNameAndDescription, transformFrontmatter |
| `gstack/scripts/resolvers/composition.ts` | generateInvokeSkill |

## Entry Points

Start here when exploring this area:

- **`generateReviewArmy`** (Function) — `gstack/scripts/resolvers/review-army.ts:231`
- **`generateQuestionTuning`** (Function) — `gstack/scripts/resolvers/question-tuning.ts:21`
- **`generateQuestionPreferenceCheck`** (Function) — `gstack/scripts/resolvers/question-tuning.ts:60`
- **`generateQuestionLog`** (Function) — `gstack/scripts/resolvers/question-tuning.ts:68`
- **`generateInlineTuneFeedback`** (Function) — `gstack/scripts/resolvers/question-tuning.ts:78`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `generateReviewArmy` | Function | `gstack/scripts/resolvers/review-army.ts` | 231 |
| `generateQuestionTuning` | Function | `gstack/scripts/resolvers/question-tuning.ts` | 21 |
| `generateQuestionPreferenceCheck` | Function | `gstack/scripts/resolvers/question-tuning.ts` | 60 |
| `generateQuestionLog` | Function | `gstack/scripts/resolvers/question-tuning.ts` | 68 |
| `generateInlineTuneFeedback` | Function | `gstack/scripts/resolvers/question-tuning.ts` | 78 |
| `generateTestCoverageAuditPlan` | Function | `gstack/scripts/resolvers/testing.ts` | 540 |
| `generateTestCoverageAuditShip` | Function | `gstack/scripts/resolvers/testing.ts` | 544 |
| `generateTestCoverageAuditReview` | Function | `gstack/scripts/resolvers/testing.ts` | 548 |
| `generatePlanCompletionAuditShip` | Function | `gstack/scripts/resolvers/review.ts` | 908 |
| `generatePlanCompletionAuditReview` | Function | `gstack/scripts/resolvers/review.ts` | 912 |
| `generateBenefitsFrom` | Function | `gstack/scripts/resolvers/review.ts` | 210 |
| `generateInvokeSkill` | Function | `gstack/scripts/resolvers/composition.ts` | 9 |
| `extractNameAndDescription` | Function | `gstack/scripts/resolvers/codex-helpers.ts` | 4 |
| `transformFrontmatter` | Function | `gstack/scripts/resolvers/codex-helpers.ts` | 76 |
| `generateSpecialistSelection` | Function | `gstack/scripts/resolvers/review-army.ts` | 13 |
| `generateSpecialistDispatch` | Function | `gstack/scripts/resolvers/review-army.ts` | 83 |
| `generateFindingsMerge` | Function | `gstack/scripts/resolvers/review-army.ts` | 134 |
| `generateRedTeam` | Function | `gstack/scripts/resolvers/review-army.ts` | 202 |
| `binDir` | Function | `gstack/scripts/resolvers/question-tuning.ts` | 13 |
| `generateTestCoverageAuditInner` | Function | `gstack/scripts/resolvers/testing.ts` | 181 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `GeneratePlanCompletionAuditShip → GeneratePlanFileDiscovery` | intra_community | 3 |
| `GeneratePlanCompletionAuditReview → GeneratePlanFileDiscovery` | intra_community | 3 |

## How to Explore

1. `gitnexus_context({name: "generateReviewArmy"})` — see callers and callees
2. `gitnexus_query({query: "resolvers"})` — find related execution flows
3. Read key files listed above for implementation details
