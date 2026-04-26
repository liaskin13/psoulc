# Design System — Pleasant Soul Collective

## Product Context
- **What this is:** A cinematic, artist-first music platform. Sovereign infrastructure for independent creators.
- **Who it's for:** D (primary), L (co-architect), and invited collaborators with personal access codes.
- **Space/industry:** Music creation, archival, and selective sharing. Not a streaming platform — a private instrument.
- **Project type:** Web app / artist console system.

## Memorable Thing
"This is D's world — I'm just visiting." AND: "Looks like nothing anyone has ever seen."

---

## Aesthetic Direction
- **Direction:** Achromatic Brutalist Futurism + Artist Identity Layer
- **Decoration level:** Intentional — dp wallpaper canvas texture, 1px structural borders, identity glows. Nothing decorative for its own sake.
- **Mood:** The platform has no color identity of its own. It is pure black architecture — monumental, precise, cold. The artist brings the color. When you are in D's world, his amber bleeds into everything. When you are in L's world, cyan does. The color IS the sovereignty.
- **Key insight:** Every music platform has a brand color. PSC's brand color is *whoever you're visiting.*

---

## Typography

| Role | Font | Notes |
|------|------|-------|
| All UI: display titles, labels, nav, console controls, body | **Chakra Petch** | Singular font. Geometric, technical, cinematic. The voice of the console. No serif, no alternate stacks. |
| Brand wordmark — "PLEASANT SOUL COLLECTIVE" and logo mark "dp" | **Comfortaa** | WORDMARK ONLY. Never assigned to `--font-display`, `--font-primary`, `--font-ui`, or `--font-headers`. Appears in: `.entry-maison-line`, `.room-header`, DPWallpaper canvas, `.file-cell-dp-mark`, `.psc-seal`, `.aperture-code-cell.aperture-cell-active::after`. Every other string — nav, labels, vault titles, console controls — uses Chakra Petch. |

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

  /* Typography */
  --text-primary:    #f0ede8;   /* warm off-white, not pure white */
  --text-secondary:  #666666;
  --text-muted:      #333333;

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
  --font-mono:     'SF Mono', 'Monaco', 'Courier New', monospace;  /* data readouts only — BPM, duration, timestamps */
}
```

### Pre-Auth Entry Accent (Scrapped — see Settled Entry Design)
Concept: copper accent before theme applied. **Current state (settled 2026-04-26):** This has been removed. Entry screen is now BLACK ON BLACK (no copper, no amber, no color identity until post-auth theme applied). All entry controls use near-white rgba only (0.07–0.22 opacity). The DPWallpaper canvas is the sole visual element on entry.

### D's Theme (70s Soul)
Applied via `data-theme="d-soul"` on `<body>`:
```css
[data-theme="d-soul"] {
  --identity:        #ffb347;
  --identity-dim:    rgba(255, 179, 71, 0.12);
  --identity-glow:   0 0 24px rgba(255, 179, 71, 0.25);
  --surface:         #0a0806;   /* warm brown-black — like a room lit by one lamp */
  --text-primary:    #f5ead8;   /* cream, not white */
  --studer-copper:   #ffb347;   /* pre-auth copper promoted to D's amber after auth */
}
```

### L's Theme (Architect)
Applied via `data-theme="l-architect"` on `<body>`:
```css
[data-theme="l-architect"] {
  --identity:        #00e5ff;
  --identity-dim:    rgba(0, 229, 255, 0.12);
  --identity-glow:   0 0 24px rgba(0, 229, 255, 0.22);
  --surface:         #070a0d;   /* cold near-black */
  --studer-copper:   #00e5ff;
}
```

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

## Entry Screen — "The Velvet Rope"

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

### Aperture Controls
- Label "ENTER MASTER KEY": Chakra Petch 500, 10px, tracking 0.4em, `--studer-copper` at 0.6 opacity
- Code cells: Chakra Petch 600, 22px, `--studer-copper` with glow
- Extending lines: 1px gradient from `--studer-copper` to transparent
- "dp" seal: Comfortaa 700, 14px, `--studer-copper` at 0.25 opacity — this is the logo
- Cursor indicator on active cell: `dp` in Comfortaa 7px (logo quarantine — this is a logo appearance)

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

## Surface Treatments

### Upload Drag Zone
Dashed 1px border in `--identity`. Background `--void`. On hover: border solid, `--identity-glow` appears. Error states: border → `--error-text`. Error message in Chakra Petch 400 below. No rounded corners. Feels like a tape loading bay.

### Metadata Editor
Minimal. Title = Chakra Petch 500, `--text-primary`. BPM = Chakra Petch 600 readout + fader-style range input (horizontal line, no pill thumb — a needle indicator). Section selector = Chakra Petch 500 uppercase label + chip row (UNRELEASED / RELEASED / ARCHIVE as small-caps chips).

### Voice Comment List
Each comment = a strip. `[code] @ 1:32` in Chakra Petch 500 10px, `--text-secondary`. Play control = bare `▶` triangle, no button chrome. D's delete = small `×`, appears on hover in `--identity`. Logged tape aesthetic.

### REC Button
Three states: idle (muted `--record-red` outline, no fill), armed (slow identity pulse — `--identity` at 0.4 opacity breathing), recording (solid `--record-red` fill, live Chakra Petch timer beside it).

### Telemetry Rail
Logging printer aesthetic. Chakra Petch 500 9px. Faint `--border` lines between entries. `[01:22] UPLOAD_TRACK saturn — OK`. SUCCESS entries in dim `--identity`. DENIED entries in `--error-text`.

### Section Tags
Chakra Petch 500, 9px, tracking 0.12em, uppercase. `UNRELEASED` amber, `RELEASED` dim green, `ARCHIVE` stone. On dark chip backgrounds (`--section-*`). Very compact — metadata, not navigation.

### Vault Track Wall
CSS grid `repeat(auto-fill, minmax(118px, 1fr))`. Each cell: waveform thumbnail, track number, title, BPM. Duration bar at bottom (1px, `--identity` at 0.12). Watermark (artist name) at bottom of wall, color ~20 brightness steps above bg — visible on close inspection, not a label. Orphan last-row cell spans full width (`grid-column: 1 / -1`), max-width 180px.

### Vault dp Wallpaper
`.mv-screen::before` and `.janet-screen::before`: white SVG dp pattern at 2.2% opacity. Same monogram as entry, but applied as CSS pseudo-element since vault colors vary. The luxury texture continues inside the vault.

### Muse Cards (MUSES section)
4 cards in a row. Identity color per Muse. Genre tag: Chakra Petch 500 9px, tracking 0.16em. Count: 9px. ENTER VAULT CTA: Chakra Petch 500 8px, tracking 0.18em, `opacity: 0.7` (→ 1 on hover). No rounded corners.

---

## Muse Identity Colors (locked)
| Muse | Identity | Key Track |
|------|----------|-----------|
| LARRY | `#7aaa5a` sage green | Empty Pages — Larry June |
| JANET | `#cc3399` deep magenta | Would You Mind — Janet Jackson |
| ERIKAH | `#cc6633` terracotta | Honey — Erykah Badu |
| DRAKE | `#c4a428` OVO gold | Passionfruit — Drake |

---

## ⛔ HARD STOPS — Never introduce these, no exceptions

These are not "deprecated ideas." They were built, caused regressions, and were permanently removed. Any AI reading this: do not re-introduce any of the following under any circumstances — not in code, not in comments, not in copy, not in component names, not as internal IDs.

- **Space Mono** — removed from the font stack entirely. `--font-mono` uses SF Mono / system monospace. Do not add Space Mono back. Do not load it from Google Fonts.
- **Mars vault** — does not exist. No `src/mars/`, no `MarsVault`, no mars ID anywhere.
- **Amethyst vault** — does not exist. No `src/amethyst/`, no `AmethystVault`, no amethyst ID anywhere.
- **SystemMap2D** — deleted. No orbital map, no holographic map, no planet node map.
- **HolographicMap, BinaryCore, EmpireNode, BinaryCore3D** — deleted. Do not recreate.
- **kepler.js / orbitalClock.js** — deleted. No orbital mechanics anywhere.
- **Space/astronomical themes** — no planets, no orbital rings, no warp streaks, no galaxy flyby, no stars, no chakras, no "event horizon," no "stasis," no "gravitational."
- **Cormorant Garant, Geist, Rajdhani** — rejected fonts. Chakra Petch only.
- **Pull cord visual** — scrapped.
- **30/70 vault split** — scrapped. Vault is full-screen.
- **Three.js flyby/warp animations** — removed.

---

---

## D Console — Analog Console Design Direction (locked 2026-04-26)

### Visual Style
Combination of three design languages:
- **Dark OLED Luxury (#10)** — absolute black base, gold foil gradients, spotlight effects. Primary foundation.
- **Aurora / Mesh Gradient (#06)** — slow-drifting amber/gold light blobs behind the UI. Atmospheric depth layer.
- **Retro-Futurism (#07, subtle)** — CRT scanline texture on waveform and signal readout blocks only. Keeps the "pro hardware" feel.

### Layout — 5-Zone Serato Model
```
┌─────────────────────────────────────────────┐
│  RAIL  — 30px top bar: live · session · BPM │
├──────────┬──────────────────────┬────────────┤
│  BINS    │  MONITOR             │  CHAIN     │
│  214px   │  flex 1              │  188px     │
│  warm    │  absolute black      │  cool dark │
│  black   │  (hero + waveform    │  (signal · │
│  #0b0806 │   + tracklist)       │   pads ·   │
│          │                      │   M³)      │
├──────────┴──────────────────────┴────────────┤
│  TRANSPORT — 52px bottom bar                 │
└─────────────────────────────────────────────┘
```

### Surface Colors (3 distinct zones)
- Bins column: `#0b0806` — warm black
- Monitor center: `#000000` — absolute black (OLED)
- Signal chain: `#060608` — cool dark

### Identity Color Application
- `--amber: #ffb347` — primary identity
- `--gold: #d4890a` — deep gold
- `--pale: #ffe4a0` — pale amber highlight
- Amber left accent line on bins column
- Gold foil animated gradient on hero track title
- Amber glow on active elements, playhead, BPM readout, transport clock

### Hero Section (Now Playing)
- Track title: 54px Chakra Petch 700, animated gold foil gradient (background-size 300%, animates left↔right over 5s)
- Radial amber glow from left edge behind hero
- Badges: Unreleased (amber border), vault name (dim)

### Waveform
- CRT scanline overlay (repeating 2px transparent / 2px rgba(0,0,0,0.18))
- Played portion: warm amber/orange color variation per bar
- Playhead: amber with glow box-shadow
- Height: 56px

### Cursor
- Custom glowing amber ball (12px, `box-shadow: 0 0 8px amber, 0 0 20px amber, 0 0 50px amber`)
- Shrinks to 7px on click
- Spotlight: 500px radial gradient follows cursor
- `cursor: none` on body

### Aurora Background
- 3 blobs: `filter: blur(80px)`, `mix-blend-mode: screen`
- Blob 1: 600×400px, amber/orange, top-left, 18s drift cycle
- Blob 2: 400×500px, deep amber, center, 24s drift cycle
- Blob 3: 350×350px, gold, bottom-right, 20s drift cycle
- All at ~0.10–0.18 opacity

### Signal Chain Right Column
- BPM + Key: 2×2 grid, accent blocks (amber bg + border + glowing value)
- kbps + kHz: standard blocks
- CRT scanlines on all readout blocks
- Vault pads: 2×2 grid, bottom amber line on active pad
- System toggles: pill switches, amber when on
- M³: 2×2 grid, Masters block in amber

### ⚠️ HELIX — MISSING, MUST RESTORE
The helix was a design element present before the Phase 10 preview iterations. It disappeared during the redesign sessions. **Do not ship the console without it.** Ask Lisa to describe the helix at the start of the next session and restore it immediately before continuing.

---

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-24 | Achromatic base + artist identity layer | Platform's brand color is the artist's identity color. Sovereignty model expressed visually. |
| 2026-04-24 | Chakra Petch as the singular typeface | One instrument, one voice. Reads as data readout, vault title, and nav label. No serifs. |
| 2026-04-24 | Comfortaa quarantined to logo/dp mark only | Comfortaa = the brand mark. Every functional element gets Chakra Petch. |
| 2026-04-24 | 0px border-radius everywhere | Hard edges = hardware language. Anodized aluminum, not rounded plastic. |
| 2026-04-24 | DPWallpaper canvas on entry | Canvas-rendered half-drop tessellation. Comfortaa in canvas = correct (it's the logo). |
| 2026-04-24 | D's theme = 70s soul (warm amber #ffb347, cream text, warm surfaces) | First theme. Personal. Amber stays. |
| 2026-04-24 | Theme system via data-theme on body + CSS custom property overrides | `--identity` / `--identity-dim` / `--identity-glow` are the three core theme tokens. |
| 2026-04-24 | Pre-auth entry accent = copper #B87333, not D's amber | Entry is before identity. Copper hints at the premium without committing to D's world. |
| 2026-04-25 | Vault dp wallpaper via CSS ::before at 2.2% white opacity | CSS vars can't go in SVG data URIs. White at near-zero opacity reads as luxury texture against dark identity backgrounds. |
| 2026-04-25 | Orphan track row fix: span full-width via rAF + getBoundingClientRect | Detects lone last-row cells after grid render, applies grid-column: 1 / -1. |
| 2026-04-26 | entry-aperture background: transparent | DPWallpaper canvas provides the background. Aperture must be transparent or canvas is hidden behind it. |
