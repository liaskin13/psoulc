---
description: Run the PSC artist benefit check on a proposed feature — evaluates sovereign control, tier access model, and anti-engagement-metric principles
argument-hint: Describe the feature or change you want to evaluate
agent: ask
---

You are evaluating a proposed feature for the Pleasant Soul Collective against the platform's core principles. This is the **artist benefit check** — no feature ships without passing it.

## Evaluation Criteria

**1. Sovereign Control**
Does the artist retain godlike control over who accesses their work, when, and on what terms?
- Does the feature reduce, bypass, or obscure artist control in any way?
- Does it require D or L approval for actions that should be artist-initiated?
- Does it expose content to tiers that shouldn't have access?

**2. Tier Integrity**
Does the feature respect the access model?
- Tier A (D + L): Full admin everywhere
- Tier B (Collective Members): Admin of own planet only
- Tier C (Featured Artists): Read-only + own moon
- Tier D (The Destined): Browse-only until elevated
- Tier G (Listeners): Browse-only, no comments, no void

**3. Anti-Engagement-Metric**
Does the feature serve the artist or the platform's engagement numbers?
- No algorithmic recommendations
- No "trending" or "popular" signals
- No engagement-optimized discovery
- No dark patterns that extract attention

**4. Design Canon Alignment**
Does the feature fit the cinematic, vault-based visual language?
- No generic CRUD UI
- No modern-minimal aesthetic drift
- No interfaces that feel like a dashboard or SaaS product

## Output Format

Return a structured evaluation:

```
ARTIST BENEFIT CHECK
Feature: [name/description]

✓ / ✗  Sovereign Control — [one sentence verdict]
✓ / ✗  Tier Integrity — [one sentence verdict]
✓ / ✗  Anti-Engagement — [one sentence verdict]
✓ / ✗  Design Canon — [one sentence verdict]

VERDICT: PASS / FAIL / CONDITIONAL

[If FAIL or CONDITIONAL: what must change before this can ship]
```
