---
name: skill-creation
description: Use when converting a process, pattern, or agent workflow into a new workspace SKILL.md file
---

# Skill Creation

## Overview

This skill captures the process for writing a new workspace-level `SKILL.md` document. It is intended for situations where a pattern or workflow should be preserved as a reusable agent skill rather than kept as one-off notes.

## When to Use

- You have a repeatable agent workflow, decision process, or quality checklist that should be reused.
- You need to author a new skill file in `skills/<name>/SKILL.md` for the current repository.
- You want to standardize skill frontmatter, discovery triggers, and minimal token cost.
- You are asked to turn a conversation or implementation method into a shared skill.

When NOT to use:
- For one-off code fixes or project-specific implementation details.
- When the guidance belongs in `CLAUDE.md`, a prompt, or a custom agent instead.

## Core Pattern

1. Choose a clear, hyphenated skill name.
2. Write a `description` that starts with `Use when...` and only describes trigger conditions.
3. Keep the body concise and action-oriented.
4. Put workspace skills under `skills/<name>/SKILL.md`.
5. Avoid redundant workflow summaries in the description.

## Quick Reference

- Location: `skills/<name>/SKILL.md`
- Required frontmatter:
  - `name`
  - `description`
- Description style: trigger-only, third-person, no workflow summary
- Naming style: letters, numbers, hyphens only

## Authoring Checklist

- [ ] Confirm the skill is reusable beyond a single task
- [ ] Pick a name that reflects the trigger condition
- [ ] Write a description that begins with `Use when...`
- [ ] Keep the document shorter than 500 words when possible
- [ ] Add a short `Overview` and `When to Use` section
- [ ] Reference existing skill templates if available
- [ ] Avoid applying this skill to non-workflow cases

## Common Mistakes

- Using a description that summarizes what the skill does instead of when to use it
- Putting the skill in the wrong folder
- Choosing a name with spaces or special characters
- Writing an overly long workflow inside `description`
- Creating a skill for one-off or project-specific implementation details

## Example

```markdown
---
name: skill-creation
description: Use when converting a process, pattern, or agent workflow into a new workspace SKILL.md file
---

# Skill Creation

...content...
```
