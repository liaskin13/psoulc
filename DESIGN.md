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
- **Decoration level:** Intentional — film grain texture, 1px structural borders, identity glows. Nothing decorative for its own sake.
- **Mood:** The platform has no color identity of its own. It is pure black architecture — monumental, precise, cold. The artist brings the color. When you are in D's world, his amber bleeds into everything. When you are in L's world, cyan does. The color IS the sovereignty.
- **Key insight:** Every music platform has a brand color. PSC's brand color is *whoever you're visiting.*

---

## Typography

| Role | Font | Notes |
|------|------|-------|
| All UI: display titles, labels, nav, console controls, body | **Chakra Petch** | Singular font. Geometric, technical, cinematic. The voice of the console. No serif, no alternate stacks. |
| Logo mark "dp" | **Comfortaa** | QUARANTINED — logo use only. Never assigned to `--font-display`, `--font-primary`, `--font-ui`, or `--font-headers`. |

**Loading:**
```html
<link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Comfortaa:wght@700&display=swap" rel="stylesheet">
```

**Scale:**
- Display (vault titles, muse names): 48–96px, Chakra Petch 700, tracking -0.01em
- Heading: 20–36px, Chakra Petch 600
- UI label: 10–13px, Chakra Petch 500, uppercase, tracking 0.08–0.12em
- Body / track data: 13–14px, Chakra Petch 400
- Micro label: 9–10px, Chakra Petch 500, uppercase, tracking 0.14em

**Why Chakra Petch and not Geist + Cormorant + Space Mono:** D's console is one instrument, one voice. Three fonts = three personalities fighting. Chakra Petch reads equally well as a data readout, a vault title, and a nav label — it just changes weight and scale. No serifs. No monospace separate identity. One typeface, full sovereignty.

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
}
```

### D's Theme (70s Soul)
```css
[data-theme="d-soul"] {
  --identity:        #ffb347;
  --identity-dim:    rgba(255, 179, 71, 0.12);
  --identity-glow:   0 0 24px rgba(255, 179, 71, 0.25);
  --surface:         #0a0806;   /* warm brown-black — like a room lit by one lamp */
  --text-primary:    #f5ead8;   /* cream, not white */
}
```

### L's Theme (Architect)
```css
[data-theme="l-architect"] {
  --identity:        #00e5ff;
  --identity-dim:    rgba(0, 229, 255, 0.12);
  --identity-glow:   0 0 24px rgba(0, 229, 255, 0.22);
  --surface:         #070a0d;   /* cold near-black */
}
```

### Adding Future Artist Themes
```css
[data-theme="custom-{memberId}"] {
  --identity:      /* their chosen color */;
  --identity-dim:  /* rgba version at 0.12 */;
  --identity-glow: /* 0 0 24px rgba version at 0.22 */;
}
```

---

## Entry Wallpaper — The "dp" Monogram

The vault access entryway background. "dp" in Comfortaa (the logo mark), tiled as a repeating pattern. Black gloss on black matte — like Fendi FF or LV monogram. Almost invisible. The luxury texture. The door.

```css
.entry-wallpaper {
  background-color: var(--void);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Ctext x='10' y='75' font-family='Comfortaa' font-size='52' fill='%23111111' opacity='0.6'%3Edp%3C/text%3E%3C/svg%3E");
  background-size: 120px 120px;
  background-repeat: repeat;
}
/* The "gloss" effect: the SVG fill (#111111) is just barely lighter than --void (#050505).
   Visible at angle. Luxury texture. No other decoration on this screen. */
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

---

## Motion
- **Approach:** Minimal-functional. State transitions only. No entrance animations. No scroll-driven flourishes. Instruments respond; they don't perform.
- **Easing:** `cubic-bezier(0.25, 0, 0, 1)` — fast-in, controlled-out. Hardware response curve.
- **Durations:** micro 60ms / short 120ms / medium 200ms / long 350ms
- **Identity glow transition:** `transition: box-shadow 200ms, border-color 200ms`
- **Command result flash:** 80ms ease-out peak → 400ms ease-in decay. VU needle behavior. Applied as `::before` overlay using `--cmd-success` or `--cmd-fail`.
- **REC armed pulse:** `1.6s ease-in-out infinite`. Slow heartbeat. Never frantic.
- **Theme transition (when switching):** `transition: background-color 300ms, color 300ms, border-color 300ms` on `:root`. The world shifts slowly, like light changing in a room.

---

## Phase 10 Surface Treatments

### Upload Drag Zone
Dashed 1px border in `--identity`. Background `--void`. On hover: border solid, `--identity-glow` appears. Error states: border → `--error-text`. Error message in Geist 400 below. No rounded corners. Feels like a tape loading bay.

### Metadata Editor
Minimal. Title = Geist 500, `--text-primary`. BPM = Space Mono readout + fader-style range input (horizontal line, no pill thumb — a needle indicator). Section selector = Cormorant Garant italic label + chip row (UNRELEASED / RELEASED / ARCHIVE as small-caps Geist chips).

### Voice Comment List
Each comment = a strip. `[code] @ 1:32` in Space Mono 10px, `--text-secondary`. Play control = bare `▶` triangle, no button chrome. D's delete = small `×`, appears on hover in `--identity`. Logged tape aesthetic.

### REC Button
Three states: idle (muted `--record-red` outline, no fill), armed (slow amber/identity pulse — `--identity` at 0.4 opacity breathing), recording (solid `--record-red` fill, live Space Mono timer beside it).

### Telemetry Rail
Logging printer aesthetic. Small Space Mono text. Faint `--border` lines between entries. `[01:22] UPLOAD_TRACK saturn — OK`. SUCCESS entries in dim `--identity`. DENIED entries in `--error-text`.

### Section Tags
Small-caps Geist 500, 9px, tracking 0.12em. `UNRELEASED` amber, `RELEASED` dim green, `ARCHIVE` stone. On dark chip backgrounds (`--section-*`). Very compact — metadata, not navigation.

### C3 Inline Error
Geist 400, `--error-text` on `--error-surface` background. 1px `--error-text` left border. No icon. Plain and clear.

---

## CSS Variable Updates Required

Replace in `variables.css`:
```css
/* REMOVE — Comfortaa from all functional roles */
--font-display:  'Cormorant Garant', Georgia, serif;
--font-primary:  'Geist', system-ui, sans-serif;
--font-ui:       'Geist', system-ui, sans-serif;
--font-headers:  'Geist', system-ui, sans-serif;
--font-mono:     'Space Mono', 'SF Mono', monospace;  /* keep */

/* ADD — identity system */
--identity:      transparent;
--identity-dim:  transparent;
--identity-glow: none;

/* ADD -- Phase 10 */
--record-red:       #cc2200;
--error-surface:    #1a0505;
--error-text:       #ff4444;
--cmd-success:      rgba(0, 200, 80, 0.22);
--cmd-fail:         rgba(204, 34, 0, 0.32);
--section-unreleased: #1a1200;
--section-released:   #0a1a0a;
--section-archive:    #181818;

/* ADD -- missing fix from eng review */
--arch-accent:   #00e5ff;
```

Apply themes via `data-theme` attribute on the vault root element or `<body>`.

---

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-24 | Achromatic base + artist identity layer | Platform's brand color is the artist's identity color. Sovereignty model expressed visually. |
| 2026-04-24 | Cormorant Garant for display titles | High-contrast serif at scale. Luxury fashion house move. Nobody in music tech does this. |
| 2026-04-24 | Geist replaces Comfortaa for all functional UI | Comfortaa = logo only. Geist is precise, clean, infrastructure-grade. |
| 2026-04-24 | 0px border-radius everywhere | Hard edges = hardware language. Anodized aluminum, not rounded plastic. |
| 2026-04-24 | "dp" monogram wallpaper on entry | Black gloss on black matte repeating tile. Luxury texture. The door. |
| 2026-04-24 | D's theme = 70s soul (warm amber, cream text, warm surfaces) | First theme. Personal. Amber identity color stays. |
| 2026-04-24 | Theme system via data-theme + CSS custom property overrides | --identity / --identity-dim / --identity-glow are the three core theme tokens. |
