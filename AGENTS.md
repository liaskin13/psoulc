<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **psoulc** (16823 symbols, 22083 relationships, 275 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/psoulc/context` | Codebase overview, check index freshness |
| `gitnexus://repo/psoulc/clusters` | All functional areas |
| `gitnexus://repo/psoulc/processes` | All execution flows |
| `gitnexus://repo/psoulc/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |
| Work in the Test area (154 symbols) | `.claude/skills/generated/test/SKILL.md` |
| Work in the Extension area (103 symbols) | `.claude/skills/generated/extension/SKILL.md` |
| Work in the Scripts area (68 symbols) | `.claude/skills/generated/scripts/SKILL.md` |
| Work in the Daemon area (45 symbols) | `.claude/skills/generated/daemon/SKILL.md` |
| Work in the Commands area (45 symbols) | `.claude/skills/generated/commands/SKILL.md` |
| Work in the Blender area (44 symbols) | `.claude/skills/generated/blender/SKILL.md` |
| Work in the Console area (41 symbols) | `.claude/skills/generated/console/SKILL.md` |
| Work in the Addon area (36 symbols) | `.claude/skills/generated/addon/SKILL.md` |
| Work in the State area (29 symbols) | `.claude/skills/generated/state/SKILL.md` |
| Work in the Cluster_306 area (25 symbols) | `.claude/skills/generated/cluster-306/SKILL.md` |
| Work in the Preamble area (24 symbols) | `.claude/skills/generated/preamble/SKILL.md` |
| Work in the Cluster_317 area (23 symbols) | `.claude/skills/generated/cluster-317/SKILL.md` |
| Work in the Cluster_308 area (22 symbols) | `.claude/skills/generated/cluster-308/SKILL.md` |
| Work in the Components area (22 symbols) | `.claude/skills/generated/components/SKILL.md` |
| Work in the Resolvers area (22 symbols) | `.claude/skills/generated/resolvers/SKILL.md` |
| Work in the Mercury area (20 symbols) | `.claude/skills/generated/mercury/SKILL.md` |
| Work in the Entry area (20 symbols) | `.claude/skills/generated/entry/SKILL.md` |
| Work in the Cluster_239 area (17 symbols) | `.claude/skills/generated/cluster-239/SKILL.md` |
| Work in the Cluster_311 area (17 symbols) | `.claude/skills/generated/cluster-311/SKILL.md` |
| Work in the Providers area (17 symbols) | `.claude/skills/generated/providers/SKILL.md` |

<!-- gitnexus:end -->
