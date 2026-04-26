---
description: Stub a complete new PSC planet vault — data file, vault component, chakra identity, and orbital config following the Saturn/Venus/Mercury pattern
argument-hint: Planet name, chakra, color, owner tier, access code (if any), and content type
agent: agent
tools: [read, search, edit]
---

You are adding a new planet vault to the Pleasant Soul Collective. Before writing anything, read:

- [SYSTEM_DIRECTIVE.md](../../vault/architecture/SYSTEM_DIRECTIVE.md) — canonical spec for vault structure and orbital physics
- [SaturnVault.jsx](../../src/saturn/SaturnVault.jsx) — canonical vault component to follow exactly
- An existing data file, e.g. [saturn.js](../../src/data/saturn.js) — track data pattern
- [permissions.js](../../src/utils/permissions.js) — tier model

## What to Create

### 1. Data file — `src/data/<planet>.js`
Follow the Saturn/Venus/Mars pattern:
- Track array with `id`, `name`, `bpm`, `frequency`, `createdBy`, `duration`
- Export as default array

### 2. Vault component — `src/<planet>/<Planet>Vault.jsx`
Follow `SaturnVault.jsx` exactly:
- Props: `onVoid`, `onBack`, `onExitSystem`, `readOnly`
- `useSystem()` for session context
- `useVaultVoid()` for void animation state
- `useVaultFileCells()` for navigation + readout sync
- Correct chakra color for this planet (from SYSTEM_DIRECTIVE.md §2)
- Warm wood-tone frame, Honey Amber lighting
- 30/70 split: Binary Core porthole top / file-cell wall bottom
- VOID + COMMENT handles on hover
- Studer transport bar at bottom center
- Kinetic scroll

### 3. Register the planet
- Add chakra color constants (e.g. `SATURN_CHAKRA = '#7C3AED'`) to the relevant constants file
- Add orbital config (semi-major axis, eccentricity, period, tilt offset) following the Keplerian pattern in existing planet configs
- Add the planet to the system map / navigation wherever other planets are registered

## Orbital Physics Rules
- 23° tilted elliptical plane
- Keplerian speeds: Mercury fastest → Saturn slowest → Amethyst wobbles
- Faint chakra-colored orbit trails

## Checklist Before Done
- [ ] Data file created with at least 3 seed tracks
- [ ] Vault component follows SaturnVault structure exactly
- [ ] Chakra color applied to ownership rail and void streak
- [ ] Tier permission guards in place (`canVoid`, `canEdit`, `canComment`)
- [ ] Planet registered in orbital config
- [ ] `npm run build` passes
