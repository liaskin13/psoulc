# CLAUDE.md — Pleasant Soul Collective

## Mission & Purpose

We are building a visually stunning, cinematic music streaming and sharing
platform where the independent artist is the center of the universe —
not an afterthought.

Skill and authenticity reign supreme here. This is not a platform optimized
for engagement metrics or algorithmic discovery. It is a space built
deliberately around one belief: art sustains the world and shapes our
collective destiny.

Artists on this platform hold sovereign control over their work — who
accesses it, when, where, how, and on what terms. Godlike control is not
a feature. It is the foundation.

### The artist benefit check

Before every task, ask: does this serve the creator?
If the answer is unclear, stop and reframe until it is.

---

## Workflow Orchestration

### 1. Plan First (Default)

- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy

- Use subagents liberally to keep the main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop

- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules that prevent the same mistake from recurring
- Ruthlessly iterate on these lessons until the mistake rate drops
- Review lessons at session start for relevant context

### 4. Verification Before Done

- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)

- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing

- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user
- Fix failing CI tests without being told how

---

## Task Management

### Core Principles

- **Simplicity First** — Make every change as simple as possible. Impact minimal code.
- **No Laziness** — Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact** — Changes should only touch what's necessary. Avoid introducing bugs.

### Execution Order

1. **Plan First** — Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan** — Check in before starting implementation
3. **Track Progress** — Mark items complete as you go
4. **Explain Changes** — High-level summary at each step
5. **Document Results** — Add review section to `tasks/todo.md`
6. **Capture Lessons** — Update `tasks/lessons.md` after any corrections

---

## Session Start Checklist

1. **Read `NEXT_SESSION.md` FIRST** — exact task queue. Do not deviate from it.
2. Read `tasks/lessons.md` — internalize recent corrections
3. Read `tasks/todo.md` — understand current state and next priorities
4. Read `tasks/plan.active.md` if it exists — pick up exactly where we left off
5. **Read `DESIGN.md`** — all design decisions live here. Do not touch any CSS, JSX, or visual element without reading this first. If what you are about to do contradicts DESIGN.md, stop and say so.
6. Apply the artist benefit check to the first task before touching any code

## Sequence Law — Non-Negotiable
- Never start a later task if an earlier one is incomplete.
- If the user expresses excitement about a future task, say: "We get there after [current task]. Ready?"
- The user trusts the sequence. Breaking it without explicit permission is a failure.
- If asked to skip ahead, confirm explicitly: "You want to skip [X] and go straight to [Y]? Confirming before I do."

---

## MASTER DIRECTIVE: SYSTEM

> Full canonical spec: `vault/architecture/SYSTEM_DIRECTIVE.md`
> Design skill (load on-demand for UI/vault/entry/console work): `skills/psc-system/SKILL.md`

---

## gstack

Use the `/browse` skill from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

Available gstack skills:
`/office-hours`, `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`, `/design-consultation`, `/design-shotgun`, `/design-html`, `/review`, `/ship`, `/land-and-deploy`, `/canary`, `/benchmark`, `/browse`, `/connect-chrome`, `/qa`, `/qa-only`, `/design-review`, `/setup-browser-cookies`, `/setup-deploy`, `/retro`, `/investigate`, `/document-release`, `/codex`, `/cso`, `/autoplan`, `/plan-devex-review`, `/devex-review`, `/careful`, `/freeze`, `/guard`, `/unfreeze`, `/gstack-upgrade`, `/learn`

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health
