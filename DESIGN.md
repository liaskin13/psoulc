# Design System — Pleasant Soul Collective

## Product Context

- **What this is:** A cinematic, artist-first music platform. Sovereign infrastructure for independent creators.
- **Who it's for:** D (primary), L (co-architect), and invited collaborators with personal access codes.
- **Space/industry:** Music , archival, and selective sharing. Not a streaming platform — a private instrument.
- **Project type:** Web app / artist console system.

## Memorable Thing

"This is D's world — I'm just visiting." AND: "Looks like nothing anyone has ever seen."

---

## Aesthetic Direction

- **Direction:** Achromatic Brutalist Futurism + Artist Identity Layer
- **Decoration level:** Intentional — dp wallpaper canvas texture, 1px structural borders, identity glows. Nothing decorative for its own sake.
- **Mood:** The platform has no color identity of its own. It is pure black architecture — monumental, precise, cold. The artist brings the color.  The color IS the sovereignty.
- **Key insight:** Every music platform has a brand color. PSC's brand color is *whoever you're visiting.*

---

## Typography

| Role | Font | Notes |
|------|------|-------|
| All UI: display titles, labels, nav, console controls, body | **Chakra Petch** | Singular font. Geometric, technical, cinematic. The voice of the console. No serif, no alternate stacks. |
| Logo mark "dp" | **Comfortaa** | QUARANTINED — logo use only. Never assigned to `--font-display`, `--font-primary`, `--font-ui`, or `--font-headers`. Only appears in: DPWallpaper canvas, `.file-cell-dp-mark`, `.psc-seal`, `.aperture-code-cell.aperture-cell-active::after`. |

**Loading:**

```html
<link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Comfortaa:wght@700&display=swap" rel="stylesheet">
```

Note: Space Mono is kept in `--font-mono` only for genuine numeric data readouts (BPM counters, duration displays, telemetry timestamps). All labels, nav, and UI copy use Chakra Petch.

**Scale:**

- Display (vault titles, muse names): 48–96px, Chakra Petch 700, tracking -0.01em
- Heading: 20–36px, Chakra Petch 600
- UI label: 10–13px, Chakra Petch 500, uppercase, tracking 0.08–0.12em
- Body / track data: 13–14px, Chakra Petch 400
- Micro label: 9–10px, Chakra Petch 500, uppercase, tracking 0.14em

**Why Chakra Petch and not Geist + Cormorant + Space Mono:** D's console is one instrument, one voice. Three fonts = three personalities fighting. Chakra Petch reads equally well as a data readout, a vault title, and a nav label — it just changes weight and scale. No serifs. One typeface, full sovereignty.

---

## Color System

### Base Tokens (achromatic — applies before any theme)

```css
:root {
  /* Foundation */
  --void:            #050505;   /* universal canvas */
  --surface:         #0d0d0d;   /* panels, cards */
  --surface-raised:  #141414;   /* modals, dropdowns */
  --border:          #222222;   /* 1px structural borders */

  /* Typography — ZERO WARMTH. Cold achromatic only. */
  --text-primary:    rgba(230, 230, 230, 0.92);  /* cold near-white — NO warmth */
  --text-secondary:  rgba(160, 160, 160, 0.72);  /* cold mid-gray */
  --text-muted:      rgba(90, 90, 90, 0.80);     /* cold dark-gray */

  /* Identity — filled by theme, transparent by default */
  --identity:        transparent;
  --identity-dim:    transparent;
  --identity-glow:   none;

  /* System states (theme-agnostic) */
  --record-red:      #cc2200;   /* REC active — blood red */
  --error-surface:   #1a0505;
  --error-text:      #ff4444;
  --cmd-success:     rgba(0, 200, 80, 0.22);
  --cmd-fail:        rgba(204, 34, 0, 0.32);

  /* Section tags */
  --section-unreleased: #1a1200;
  --section-released:   #0a1a0a;
  --section-archive:    #181818;

  /* Font system */
  --font-display:  'Chakra Petch', sans-serif;
  --font-primary:  'Chakra Petch', sans-serif;
  --font-ui:       'Chakra Petch', sans-serif;
  --font-headers:  'Chakra Petch', sans-serif;
  --font-mono:     'Space Mono', 'SF Mono', monospace;  /* data readouts only */
}
```

### Pre-Auth Entry Accent (Scrapped — see Settled Entry Design)

Concept: copper accent before theme applied. **Current state (settled 2026-04-26):** This has been removed. Entry screen is now BLACK ON BLACK (no copper, no amber, no color identity until post-auth theme applied). All entry controls use near-white rgba only (0.07–0.22 opacity). The DPWallpaper canvas is the sole visual element on entry.

### Theme Application (implemented)

`App.jsx` sets `data-theme` on `<body>` when a user authenticates:

```js
const themeMap = { D: 'd-soul', L: 'l-architect' };
document.body.setAttribute('data-theme', themeMap[owner]);
```

No theme attribute on entry — pre-auth state stays achromatic.

### Adding Future Artist Themes

```css
[data-theme="custom-{memberId}"] {
  --identity:      /* their chosen color */;
  --identity-dim:  /* rgba version at 0.12 */;
  --identity-glow: /* 0 0 24px rgba version at 0.22 */;
}
```

---

## Entry Screen

### DP Monogram Wallpaper

Canvas-based, rendered by `DPWallpaper.jsx`. Half-drop tessellation (like Fendi/LV). Comfortaa 700 at 44px. Colors stay within 0–15% lightness — specular layer at #242424, body gradient #0a0a0a–#161616, shadow at #020202. Black gloss on black matte. The door.

**Important:** `.entry-aperture` must have `background: transparent` — the canvas provides the full-screen background. The gate panels carry their own background for the open animation.

### Entry Z-Index Layering

```
DPWallpaper canvas:  position: fixed, z-index: 0   (page level — paints first)
.entry-aperture:     position: fixed, z-index: 1000 (transparent, sits over canvas)
.aperture-gate-*:    position: absolute, z-index: 10 (within aperture stacking context)
.aperture-controls:  position: relative, z-index: 20 (above gates)
```

---

## Spacing

- **Base unit:** 4px
- **Density:** Compact. This is infrastructure, not a landing page.
- **Scale:** 2(2px) 4 8 12 16 24 32 48 64 96
- **Border radius:** `0px` everywhere, except pill toggles (`9999px`). Hard edges. No rounded corners. The material language of milled steel and anodized aluminum.
- **Borders:** 1px only, `var(--border)`. Structural, never decorative.

---

## Layout

- **Approach:** Grid-disciplined. Strict columns, predictable alignment. Hardware console faceplate logic.
- **Grid:** 12 columns desktop, 4 mobile
- **Max content width:** 1440px
- **Console layout:** Full-bleed dark surface, controls justified to a strict 4px grid. Dense, purposeful, no wasted space.
- **Device targets:** Listener view = iPhone primary. D/L consoles = desktop/laptop primary.
- **Console mobile scope:** The D-sovereign and L-sovereign console views are explicitly desktop/laptop-only. Touch targets follow desktop sizing. Mobile breakpoints on the console only handle library column hiding. The Listener Shell is the mobile-first surface — console mobile optimization is out of scope.

---

## Motion

- **Approach:** Minimal-functional. State transitions only. No entrance animations. No scroll-driven flourishes. Instruments respond; they don't perform.
- **Easing:** `cubic-bezier(0.25, 0, 0, 1)` — fast-in, controlled-out. Hardware response curve.
- **Durations:** micro 60ms / short 120ms / medium 200ms / long 350ms
- **Identity glow transition:** `transition: box-shadow 200ms, border-color 200ms`
- **Command result flash:** 80ms ease-out peak → 400ms ease-in decay. VU needle behavior.
- **REC armed pulse:** `1.6s ease-in-out infinite`. Slow heartbeat. Never frantic.
- **Theme transition (when switching):** `transition: background-color 300ms, color 300ms, border-color 300ms` on `:root`. The world shifts slowly, like light changing in a room.
- **DPWallpaper on entry exit:** `opacity: 0, transition: opacity 1.6s ease`. The door dissolves.

---

## Listener Shell

The listening room for Shadow subscribers (LISTENER_CODE). iPhone-primary. Post-auth surface but identity-neutral — this is D's world presented to guests, not D's personal console.

- **Background:** `--void` (#050505). DPWallpaper canvas at full opacity (same canvas as entry — the tessellation is permanent, not just a door).
- **Header:** Solid `--surface` (#0d0d0d) strip, 1px `--border` bottom. No gradients. `position: fixed; top: 0; z-index: 10`. Left: LISTENING ROOM kicker + CURATED BY D at 8px/0.2em Chakra Petch. Right: EXIT button.
- **Signal banner:** When D is live — full-width strip at 48px fixed below header. Blood red `--record-red` (#cc2200) 7px pulse dot with `ls-dot-pulse` animation. 1px `--record-red` accent border at bottom. No gradient. `z-index: 20`.
- **Stage hero:** Selected vault preview fills remaining height. Vault label as 48px Chakra Petch 700 display heading. Tagline copy at 11px 0.2em tracking. 1px horizontal rule divider (`--border`). CTA button: Chakra Petch 500, 10px, 0.24em, `border: 1px solid rgba(240,237,232,0.14)`, height 56px, full width.
- **Vault dock:** Fixed bottom bar, 64px, 3-column grid (one per vault). `z-index: 15`. `border-top: 1px solid --border`. Each button: full height, Chakra Petch label at 8-9px, 0.2em tracking. Active vault: `--vault-color` pip (Serato color per vault). Touch target: full button width.
- **Handoff overlay:** Full-screen `--void`, centered OPENING kicker + vault label. 180ms in, 120ms out.
- **Vault names:** MIXES / ORIGINAL MUSIC / LIVE SETS. Never show internal IDs (venus/saturn/mercury) in UI.

---

## Vault Interior

Post-auth vault screen. Full-screen dark surface. Same rules as console: hard edges, Chakra Petch, 1px structural borders, `--identity` glow on active items.

- **Background:** `--void` (#050505). Vault dp wallpaper via CSS `::before` pseudo-element at 2.2% white opacity (pattern texture on surface, not entry canvas).
- **Vault header:** Vault name at 20px Chakra Petch 600 uppercase. Subtitle at 10px 0.2em tracking. Left-aligned. `border-bottom: 1px solid --border`.
- **Command strip:** `god-btn` row below vault header. See god-btn spec below.
- **god-btn pattern** (canonical across vault + console):
  - `background: transparent`
  - `border: 1px solid var(--border, #222222)`
  - Chakra Petch 500, 11px, 0.12em tracking, uppercase
  - Hover: `border-color: var(--identity)`, `color: var(--identity)` (uses whatever identity is active)
  - Disabled: `opacity: 0.35`
  - Height: 28px desktop. Min-height 44px on mobile (touch target).
- **RecordShelf / file cells:** Grid of file cells. Active cell: 2px `--identity` left border + subtle `--identity-glow` background highlight. Void-armed state: cell dims to 0.4 opacity.
- **Void operation overlay:** Full-viewport, `--void` at 0.94 opacity. Title "VOID [TRACK NAME]?" 14px Chakra Petch 600. CANCEL = ghost god-btn. CONFIRM = `--record-red` border god-btn.
- **File cell dp mark:** Comfortaa 700 "dp" mark on cells — this is one of the 4 whitelisted Comfortaa locations.

---

## Audio Transport (StuderTransportBar)

Visual metaphor: Studer A800 tape deck. Hardware readout. Post-auth surface.

- **Container:** `--surface` (#0d0d0d) background. `border-top: 1px solid --border`. Fixed or sticky at bottom of vault screen.
- **Transport controls:** PLAY / STOP / REW / FF / PAUSE / REC. `transport-btn` class: Chakra Petch 500, 10px, 0.12em tracking, 1px `--border` border. Active: `--identity` fill or accent border.
- **REC button:** `--record-red` (#cc2200) border when armed. `rec-pulse` animation at 1.6s ease-in-out (slow heartbeat, matches DESIGN.md motion spec).
- **Status readout:** Track title at 11px Chakra Petch 500. BPM and duration via `--font-mono` (Space Mono, tabular-nums). This is one of 3 valid mono surfaces (the others: BPM nixie in upload modal, telemetry timestamps).
- **Pitch fader:** Range input styled with no rounded thumb. Hidden on mobile (< 640px).

---

## Intake (Upload Modal)

INTAKE is a console-level action. The button lives in the browser utility bar (`arch-browser-utility`) alongside PUBLISH / RETRACT / LOAD DECK — not in the top rail (deliberately clean) and not buried in loop controls.

- **Modal overlay:** `position: fixed; inset: 0; z-index: 1200; background: rgba(0,0,0,0.88)`. The high z-index ensures it clears all console surfaces. NOTE: the UploadModal must be rendered OUTSIDE any `motion.div` that applies a CSS transform — transforms create stacking contexts that trap fixed-position children.
- **Modal container:** `--surface` background, `border: 1px solid --border`, 0px border-radius.
- **Vault selector:** Buttons show MIXES / ORIGINAL MUSIC / LIVE SETS / SONIC ARCH. Internal IDs (venus/saturn/mercury/earth) never shown in UI. Default vault: MIXES (venus).
- **BPM display:** Nixie-style digits using Space Mono tabular-nums. 1px `--border` cell border. No glow or radial gradients.
- **Progress bar:** 2px `--border` track, `--identity` fill.
- **Error state:** `--error-text` (#ff4444) color, `--error-surface` (#1a0505) background, `--error-text` border.

---

---

## Scrapped Concepts (do not revisit)

- **Space/astronomical themes** — scrapped. No planets, no orbital UI, no chakras.
- **Cormorant Garant** — scrapped. Was proposed as display serif. Rejected. Chakra Petch only.
- **Geist** — scrapped. Was proposed for UI. Rejected. Chakra Petch only.
- **Space Mono for labels** — scrapped for labels. Kept only for numeric data readouts via `--font-mono`.
- **Pull cord visual** — scrapped. Button TBD.
- **30/70 vault split** — scrapped. Vault is full-screen.
- **Three.js flyby/warp animations** — removed. Too heavy, off-brand.

---

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-24 | Achromatic base + artist identity layer | Platform's brand color is the artist's identity color. Sovereignty model expressed visually. |
| 2026-04-24 | Chakra Petch as the singular typeface | One instrument, one voice. Reads as data readout, vault title, and nav label. No serifs. |
| 2026-04-24 | Comfortaa quarantined to logo/dp mark only | Comfortaa = the brand mark. Every functional element gets Chakra Petch. |
| 2026-04-24 | 0px border-radius everywhere | Hard edges = hardware language. Anodized aluminum, not rounded plastic. |
| 2026-04-24 | DPWallpaper canvas on entry | Canvas-rendered half-drop tessellation. Comfortaa in canvas = correct (it's the logo). |
| 2026-04-24 | D's theme initial concept = 70s soul (warm amber #ffb347) | First theme. Superseded — see 2026-05-04. |
| 2026-05-04 | D's theme = Serato green `--identity: #14dc14`. Amber fully removed. | Locked. variables.css is source of truth. The identity IS the Serato cue green. |
| 2026-04-24 | Theme system via data-theme on body + CSS custom property overrides | `--identity` / `--identity-dim` / `--identity-glow` are the three core theme tokens. |
| 2026-04-24 | Pre-auth entry accent = copper #B87333, not D's amber | Entry is before identity. Copper hints at the premium without committing to D's world. |
| 2026-04-25 | Vault dp wallpaper via CSS ::before at 2.2% white opacity | CSS vars can't go in SVG data URIs. White at near-zero opacity reads as luxury texture against dark identity backgrounds. |
| 2026-04-25 | Orphan track row fix: span full-width via rAF + getBoundingClientRect | Detects lone last-row cells after grid render, applies grid-column: 1 / -1. |
| 2026-04-26 | entry-aperture background: transparent | DPWallpaper canvas provides the background. Aperture must be transparent or canvas is hidden behind it. |
| 2026-05-13 | Listener header: solid --surface + 1px --border, no gradient | Linear gradient is a soft edge in a hard-edge language. Gradient removed. |
| 2026-05-13 | god-btn documented as canonical vault/console control | Shared pattern across all admin surfaces. Needed spec to prevent drift. |
| 2026-05-13 | Space Mono valid in 3 surfaces: transport readout, BPM nixie, telemetry timestamps | All three are numeric data readouts. Everything else: Chakra Petch. |
| 2026-05-13 | UploadModal must render outside any CSS-transform ancestor | CSS transforms create stacking contexts that trap fixed-position modals. Modal moved to sibling of cockpit motion.div. |
| 2026-05-13 | INTAKE button moved to arch-browser-utility bar alongside PUBLISH / RETRACT / LOAD DECK | Top rail is deliberately clean — no functional controls. Loop controls were wrong too. Browser utility bar is correct. |
| 2026-05-13 | Vault selector in INTAKE shows friendly names only | MIXES / ORIGINAL MUSIC / LIVE SETS / SONIC ARCH. Venus/saturn/mercury/earth are internal IDs — never surface them in UI. |
| 2026-05-13 | tune-modal CSS added back to index.css with design system tokens | CSS was deleted in May 10 reconciliation (had banned amber colors). Rewritten with --surface, --border, --identity, 0px border-radius. |
| 2026-05-18 | SIGNAL button neutral at rest, red only when is-live | Red = live signal only. Permanently red SIGNAL conflated idle with broadcasting. |
| 2026-05-18 | BPM sort is 2-state toggle (desc ↔ asc), not 3-state cycle | 3-state cycle returns to date order on 3rd click — accidental sort loss during live use. |
| 2026-05-18 | INTAKE uses --arch-identity color (green D / cyan L) | INTAKE is a sovereign vault action. Identity color marks it as D's control, not platform chrome. |

---

## Console Variable Namespace (`--arch-*`)

`ArchitectConsole.css` uses an `--arch-*` prefix for console-scoped tokens that shadow or extend the global design system. This is intentional isolation — the console is an instrument, not a general surface.

| Token | Value (D-sovereign) | Value (L-sovereign) | Purpose |
|-------|--------------------|--------------------|---------|
| `--arch-identity` | `#14dc14` | `#00e5ff` | Sovereign identity color — active track row, SIGNAL live, INTAKE border |
| `--arch-identity-rgb` | `20, 220, 20` | `0, 229, 255` | RGB triplet for `rgba()` identity calculations |
| `--arch-accent` | `rgba(185,185,185,0.9)` | same | Column headers, labels, muted UI text |
| `--arch-accent-rgb` | `185, 185, 185` | same | Pure achromatic. Zero warmth. |
| `--arch-muted-rgb` | `185, 185, 185` | same | Structural borders and inactive controls |
| `--arch-surface` | `#060606` | same | Console background (distinct from global `--surface`) |

**Planned unification (P2 backlog):** `--arch-identity` → `--identity`, `--arch-accent` → global token. Requires audit of all `--arch-*` usages in ArchitectConsole.css before collapsing.
