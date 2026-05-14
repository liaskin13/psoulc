---
name: psc-system
description: "Load this skill whenever working on ANY PSC UI, vault design, entry sequence, console layout, planet/orbit mechanics, tier access, void mechanic, Studer transport, or command system. Contains the full design canon for the Pleasant Soul Collective platform."
---

# PSC System Design Canon

This skill contains the authoritative design specification for the Pleasant Soul Collective. Read this before implementing any UI, animation, access control, vault component, or entry sequence.

The full canonical spec lives at: `vault/architecture/SYSTEM_DIRECTIVE.md`

---

## Quick Reference — What This Platform Is

A cinematic music streaming and sharing platform where the **independent artist is the center of the universe**. Built around one belief: art sustains the world. Artists hold **sovereign control** over their work.

**The artist benefit check:** Before every implementation decision, ask — does this serve the creator?

---

## The Console

**One component, two views.** Both D and L use `src/console/ArchitectConsole.jsx`. The `viewer` prop controls what each person sees.

| Role | `viewer` prop | Identity Color | What they get |
|---|---|---|---|
| **D** (the artist) | `"D"` | `#14dc14` (Serato green) | AdminSettings panel: SYSTEM, MEMBERS, LOCKBOX |
| **L** (the architect) | `"architect"` | Cyan | Same base as D + additional admin capabilities on top |

The design language is fully shared. L's view is a superset of D's, not a separate console. There is no separate "Sun" or "Black Star" console — that concept was scrapped.

**Palette:** Cold achromatic. `--text-primary: rgba(230, 230, 230, 0.92)`. No warmth, no amber. Identity colors inject via `--identity` CSS custom property at the body level. See `DESIGN.md` for full token reference.

---

## The Vault Planets

| Planet | Contents | Owner / Access |
|---|---|---|
| Saturn | Original Music — Master Tracks by Soul Pleasant | D |
| Saturn's Moons | Artist vaults: Janet, Erikah, Drake, Larry — stems & remixes | D + Featured Artists (Tier C) |
| Mercury | Live Sets (pre-recorded) + Live Streaming | D |
| Venus | Soul Pleasant Curated Mixes — long-form, deep-storage | D |
| Earth | Sonic Architecture Proposal — confidential docs/roadmaps | D + L + Propective architects/clients |
| Mars | Jess B Dedicated Vault | Jess B — Access: 1984 |
| Amethyst | Angi's Crystal Vault — 7 chakra bowls + 4 sound bath sessions | Angi — Access: 4096 | 
| PX-09 | Unnamed objects — future expansion (D/L instantiate at will) | D + L — TBD |

**Orbital physics:** 23° tilted elliptical plane, Keplerian speeds (Mercury fastest, Saturn slowest, Amethyst wobbles like a singing bowl). Faint chakra-colored orbit trails.

---

## The Gate (Entry + Tiers)

**Visual:** `dp` logo wallpaper + Comfortaa font access code input.

| Tier | Name | Who | How | Access |
|---|---|---|---|---|
| A | — | D + L | Founders | God Mode |
| B | Collective Members | Angi, Jess B | L + D jointly assign | Planet admin + explore all |
| C | Featured Artists | Janet Jackson, etc. | D creates Moon; L invites | Moon + explore |
| D | The Destined | Aspiring artists | Self-submit | Browse-only until elevated |
| G | Listeners | General public | Auto-code on request | Browse-only |

**Onboarding pipeline (B/C/D):** Submit → L reviews → D confirms → code auto-generated.

---

## The Vault Interior

**Layout:** 30% top viewport (Binary Core porthole) / 70% file-cell library wall.

**File-cell wall:** Square cells. Each cell: chakra-colored ownership rail + creator sigil. Hover reveals info + COMMENT handles.

**Readout:** Track Name + BPM on hover.

**Controls:** PLAY · FFWD · REWIND · STOP · REC

**Scroll:** Kinetic, heavy, mechanical.

**Voice Transmissions (REC):** Arms mic capture — audio-only voice notes pinned to tracks, visible to vault owner. Any authenticated tier. *(MediaRecorder implementation pending.)*

**Moon vaults** inherit this template, themed to their target artist (accent color, lighting tone within owner's sovereignty).

---

## The Studer Transport

Brushed Chrome Studer-style bar, bottom centre. Hover → 528Hz glow + tape hiss audio floor.

---

## The Void Transfer (Spaghettification)

1. Asset stretches non-linearly toward the Black Star → thins to 1px line of light
2. Color: inherits origin planet's chakra color → fades to absolute black at event horizon
3. Sound: granular pitch-down
4. Capture: Inverse Bloom (flash of darkness) at Black Star
5. Only L can Restore

**Confirmation modal:** *"Commit to the Void? This cannot be undone."*

**Eternal Registry:** Origin planet + time-of-voiding metadata. Hover over Black Star in 2D map → multi-colored nebula of stored frequencies.

---

## The CMD Registry

| Command | Tier | Purpose |
|---|---|---|
| `< EXPLORE >` | All | Enter vault |
| `< TUNE >` | B+ (own vault) | Library control (upload/rename/edit/void) |
| `< VOID >` | D, L, vault owner | Black Star transfer |
| `< RESTORE >` | L only | Retrieve from Eternal Registry |
| `< BROADCAST >` | D only | Transmit from console |
| `< INTAKE >` | D, L | Asset intake |
| `< CLAIM >` | D, L | Claim vault node |
| `< UPLOAD >` | D, L, vault owner | Upload track |

---

## Chakra Color Identity

| Planet | Chakra | Color |
|---|---|---|
| Saturn | Crown | Violet |
| Venus | Sacral | Orange |
| Mercury | Root | Scarlet |
| Earth | Heart | Green |
| Mars | Solar Plexus | Iron Red |
| Amethyst | Third Eye | Indigo |
