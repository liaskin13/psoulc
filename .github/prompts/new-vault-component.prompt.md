---
description: Scaffold a new PSC vault UI component with correct chakra colors, Honey Amber lighting, tier permission guards, and Framer Motion animation
argument-hint: What component are you building? (e.g. file-cell row, planet vault, console element)
agent: agent
tools: [read, search, edit]
---

You are building a new UI component for the Pleasant Soul Collective platform. Before writing any code, read the following:

- [SYSTEM_DIRECTIVE.md](../../vault/architecture/SYSTEM_DIRECTIVE.md) — canonical design spec
- [SaturnVault.jsx](../../src/saturn/SaturnVault.jsx) — canonical vault component pattern
- [permissions.js](../../src/utils/permissions.js) — tier permission model
- [useVaultFileCells.js](../../src/hooks/useVaultFileCells.js) — hook extraction pattern

## Component Requirements

Every PSC vault component MUST include:

**Structure**
- `useSystem()` from `src/state/SystemContext` for session/tier access
- Correct chakra color mapping for the planet (see SYSTEM_DIRECTIVE.md §2 and §6)
- Tier permission guard using `canVoid` / `canEdit` / `canComment` from `src/utils/permissions.js`

**Visual**
- Warm wood-tone frame with Honey Amber lighting for vault interiors
- Chakra-colored ownership rail on file-cells
- VOID + COMMENT handles revealed on hover only
- Track Name + BPM readout in Amber phosphor on hover
- Kinetic, heavy, mechanical scroll behavior

**Animation**
- Framer Motion for list transitions and active state shifts
- No decorative animation — every motion must serve the interaction

**Accessibility**
- Full keyboard support (Enter/Space to select, Tab to navigate)
- `aria-label` on interactive controls
- Respect `prefers-reduced-motion`
- Use `100svh` (not `100vh`) for full-bleed layouts on mobile

**Code Standards**
- Extract repeated stateful logic (void animation, file navigation) into `useX` hooks immediately
- Use `canVoid === canEdit` — do not create a separate `voidAllowed` prop unless values can diverge
- No `backdrop-filter` on full-viewport overlays (GPU repaint cost)
- No comments unless the WHY is non-obvious

## Artist Benefit Check

Before finalizing the component, ask: **does this serve the creator?**
If the component adds friction to artist control, removes sovereign access, or optimizes for anything other than artist expression — stop and redesign.

## Output

1. Read the reference files above
2. Scaffold the component with all requirements pre-wired
3. If extracting a hook is appropriate, create it in `src/hooks/`
4. Run a self-check: does every interactive element have a tier guard?
