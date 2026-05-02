---
name: providers
description: "Skill for the Providers area of psoulc. 17 symbols across 5 files."
---

# Providers

17 symbols | 5 files | Cohesion: 100%

## When to Use

- Working with code in `gstack/`
- Understanding how estimateCostUsd, GptAdapter, GeminiAdapter work
- Modifying providers-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `gstack/test/helpers/providers/gpt.ts` | estimateCost, GptAdapter, run, parseJsonl, emptyResult |
| `gstack/test/helpers/providers/gemini.ts` | estimateCost, GeminiAdapter, run, parseStreamJson, emptyResult |
| `gstack/test/helpers/providers/claude.ts` | estimateCost, ClaudeAdapter, run, parseOutput, emptyResult |
| `gstack/test/helpers/pricing.ts` | estimateCostUsd |
| `gstack/test/helpers/providers/types.ts` | ProviderAdapter |

## Entry Points

Start here when exploring this area:

- **`estimateCostUsd`** (Function) — `gstack/test/helpers/pricing.ts:38`
- **`GptAdapter`** (Class) — `gstack/test/helpers/providers/gpt.ts:14`
- **`GeminiAdapter`** (Class) — `gstack/test/helpers/providers/gemini.ts:15`
- **`ClaudeAdapter`** (Class) — `gstack/test/helpers/providers/claude.ts:15`
- **`estimateCost`** (Method) — `gstack/test/helpers/providers/gpt.ts:74`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `GptAdapter` | Class | `gstack/test/helpers/providers/gpt.ts` | 14 |
| `GeminiAdapter` | Class | `gstack/test/helpers/providers/gemini.ts` | 15 |
| `ClaudeAdapter` | Class | `gstack/test/helpers/providers/claude.ts` | 15 |
| `estimateCostUsd` | Function | `gstack/test/helpers/pricing.ts` | 38 |
| `ProviderAdapter` | Interface | `gstack/test/helpers/providers/types.ts` | 59 |
| `estimateCost` | Method | `gstack/test/helpers/providers/gpt.ts` | 74 |
| `estimateCost` | Method | `gstack/test/helpers/providers/gemini.ts` | 73 |
| `estimateCost` | Method | `gstack/test/helpers/providers/claude.ts` | 74 |
| `run` | Method | `gstack/test/helpers/providers/gpt.ts` | 31 |
| `parseJsonl` | Method | `gstack/test/helpers/providers/gpt.ts` | 86 |
| `emptyResult` | Method | `gstack/test/helpers/providers/gpt.ts` | 116 |
| `run` | Method | `gstack/test/helpers/providers/gemini.ts` | 33 |
| `parseStreamJson` | Method | `gstack/test/helpers/providers/gemini.ts` | 84 |
| `emptyResult` | Method | `gstack/test/helpers/providers/gemini.ts` | 112 |
| `run` | Method | `gstack/test/helpers/providers/claude.ts` | 35 |
| `parseOutput` | Method | `gstack/test/helpers/providers/claude.ts` | 84 |
| `emptyResult` | Method | `gstack/test/helpers/providers/claude.ts` | 105 |

## How to Explore

1. `gitnexus_context({name: "estimateCostUsd"})` — see callers and callees
2. `gitnexus_query({query: "providers"})` — find related execution flows
3. Read key files listed above for implementation details
