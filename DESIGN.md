# Design System — Pleasant Soul Collective

## ⚡ AGENT SESSION CHECKLIST — READ THIS BEFORE TOUCHING ANY FILE

| Check | Rule |
|---|---|
| D's identity colour | `#14dc14` (green). Applied in exactly **3 places**: THE SIGNAL button · active track accent line · BPM/Key in track detail panel. Nowhere else. |
| L's identity colour | `#00e5ff` (cyan). Same 3 places. Same restraint. |
| Amber | **Banned from all surfaces. Zero exceptions.** Search for `#ffb347`, `#ffbf00`, `rgba(255,179,71`, `rgba(255,191,0` before committing. All must return zero hits outside config legacy keys. |
| THE SIGNAL | Always Serato red `#e52020`. On every surface. Never identity green. |


---

## System Architecture — The Three Layers

Every surface in PSC is built from the same three layers in order. Later layers never override earlier ones except through the defined token system.

### Layer 1 — Achromatic Base (every surface, always)
- Void black (`#050505`) canvas
- Chakra Petch as the only typeface
- Living dp monogram canvas — black on black, one instance pulsing at a time
- `pleasantsoulcollective` wordmark fixed top-left post-auth
- 1px structural borders only (`--border: #222222`), 0px radius everywhere
- Serato 8-colour palette as **functional data signals only**: hotcue markers, waveform loop regions, vault tab accents, THE SIGNAL indicator (always red `#e52020`). Not identity. Not decoration.

### Layer 2 — Identity Overlay (3 points only, per authenticated user)
Identity colour appears in exactly **3 places** on any surface. No more. Luxury brands use colour as a signal, not wallpaper. One identity element = powerful. Identity colour spread across a surface = nothing.

| User | Colour | Token |
|---|---|---|
| D | `#14dc14` green | `--identity` |
| L | `#00e5ff` cyan | `--identity` |
| Listener view | none — achromatic only | — |

**The 3 identity points:**
1. THE SIGNAL button
2. Active track accent line (1px left edge on selected cell)
3. BPM/Key text in the track detail panel

### Layer 3 — General Master Console Template
One base template. Both D and L consoles build from this.
- Structural reference: Serato DJ library model (single-deck, archive management, not mixing surface)

- D adds green at 3 points. L adds cyan at 3 points. Everything else is identical.

---

## Product Context
- **What this is:** A cinematic, artist-first music platform. Sovereign infrastructure for independent creators.
- **Who it's for:** D (primary), L (co-architect), and  muses, members, those who aspire to collaborate, and discerning listeners to whom autheticity and skill reign supreme..
- **Space/industry:** Music creation, archival, and selective sharing. The future, forward thinking,  streaming platform — a private instrumentdesigned for the true artist..
- **Project type:** Web app / artist console system.

## Memorable Thing
"The most serious music platform I've ever seen."

---

## Aesthetic Direction
- **Direction:** Achromatic Brutalist Futurism + Artist Identity Layer
- **Decoration level:** Intentional — dp wallpaper canvas texture, 1px structural borders, identity glows. Nothing decorative for its own sake.
- **Mood:** The platform has no color identity of its own. It is pure black architecture — monumental, precise, cold. The artist brings the color. When you are in D's world, his green bleeds into 3 precise places. When you are in L's world, cyan does. The color IS the sovereignty.
- **Key insight:** Every music platform has a brand color. PSC's brand color is *whoever you're visiting.* Applied with the restraint of a luxury brand, not the saturation of a streaming service.

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
Concept:  Entry screen is now BLACK ON BLACK (no copper, no amber, no color identity until post-auth theme applied). All entry controls use near-white rgba only (0.07–0.22 opacity). The DPWallpaper canvas is the sole visual element on entry.

### D's Theme (Electric Soul)
Applied via `data-theme="d-soul"` on `<body>`:
```css
[data-theme="d-soul"] {
  --identity:        #14dc14;
  --identity-dim:    rgba(20, 220, 20, 0.10);
  --identity-glow:   0 0 24px rgba(20, 220, 20, 0.22);
  --surface:         #050805;   /* near-black with faint green undertone */
  --text-primary:    #f0ede8;   /* warm off-white */
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

### Aperture Controls — Masters Mode (current implementation)
- Label "ENTER MASTER KEY": Chakra Petch 500, 10px, tracking 0.4em, `--studer-copper` at 0.6 opacity
- Code cells: Chakra Petch 600, 22px, `--studer-copper` with glow
- Extending lines: 1px gradient from `--studer-copper` to transparent
- "dp" seal: Comfortaa 700, 14px, `--studer-copper` at 0.25 opacity — this is the logo
- Cursor indicator on active cell: `dp` in Comfortaa 7px (logo quarantine — this is a logo appearance)

### Unified Entry Screen 
One screen. Three elements. The dp monogram wallpaper is the full-screen background.

- **Top-left:** `pleasantsoulcollective` wordmark — fixed, always present (see Global Wordmark spec)
- **Center:** Request access form — email or phone input. "REQUEST ACCESS" in Chakra Petch 500, 10px, near-white, tracking 0.3em. This is what everyone sees first. No color until post-auth.
- **Bottom-right:** Master key code input — small, near-white at low opacity, discreet. Like a lamp in the corner. Masters know it's there. Everyone else doesn't need to.

No toggling. No modes. One door. Two ways through it.

---

## Global — `pleasantsoulcollective` Wordmark

Persistent across **all screens, all surfaces, post-auth.** Top-left corner. Always.

- **Font:** Comfortaa 700 — brand wordmark, Comfortaa quarantine applies correctly here
- **Treatment:** all lowercase, no spaces — one continuous compound word
  - `pleasant` + `soul` + `collective` rendered as `pleasantsoulcollective`
  - `soul` is set at **1.2× the size** of `pleasant` and `collective` — emphasis through scale, not capitalization
  - Example: `pleasant` at 11px · `soul` at 13px · `collective` at 11px — reads as one word, `soul` carries the weight
- **Color:** `--text-primary` at 0.65 opacity
- **Pre-auth (entry screen):** present at 0.12 opacity — the brand exists before it reveals itself
- **Position:** `position: fixed`, `top: 16px`, `left: 20px`, `z-index: 100`
- The wordmark does not change per theme. It is the platform's one constant voice.

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
Songs are mood/visual inspiration for each lockbox interior — not literal contents.
| Muse | Identity | Visual Mood Reference |
|------|----------|-----------------------|
| LARRY | `#7aaa5a` sage green | *Empty Pages* — Larry June (smooth, warm, West Coast haze) |
| JANET | `#cc3399` deep magenta | *Would You Mind* — Janet Jackson (cinematic, sensual, dramatic) |
| ERIKAH | `#cc6633` terracotta | *Honey* — Erykah Badu (golden, warm, neo-soul) |
| DRAKE | `#c4a428` OVO gold | *Passionfruit* — Drake (night-time, smooth, tropical warmth) |

---

## ⛔ HARD STOPS — Never introduce these, no exceptions

- **Amber** — `#ffb347`, `#ffbf00`, `rgba(255,179,71,*)`, `rgba(255,191,0,*)` — permanently banned from all surfaces. It was D's identity colour. It is no longer. D's identity is green (`#14dc14`). Do not reintroduce amber under any name, in any token, on any surface. This decision is locked.

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

### Core Design Principle — The Flow State

D mixes entirely without headphones. He reads the waveform and operates from intuitive flow. This is not a technical monitoring console — it is **an instrument for intuition.**

Design consequences:
- **The waveform is sacred.** It is D's primary sensory connection to the music. It must be the dominant visual element — large, luminous, readable at a glance. Everything else is subordinate to it.

- **Trust the artist.** No headphone cue controls. No pre-fader listen buttons. No technical scaffolding he doesn't use. The luxury is in what is *not* there.
- **VU meters belong — but as atmosphere.** Not for headphone monitoring, but as the visual heartbeat of the room. They reflect the music's energy to the eye, not the ear.
- The console should feel like a space where flow is possible, not a cockpit demanding attention.

### Visual Style — Fashion Luxury Recalibration

The console is D's private archive. Not a cockpit. Not a mixing surface. Not a club. A room where a life's work lives, and from which it is shared on his terms.

Three laws govern every element:
- **Negative space is load-bearing.** Wide margins. Generous row heights. Nothing crowds the waveform. What is absent is as deliberate as what is present.
- **Identity in three places only:** THE SIGNAL button · the active track accent line · BPM/Key in the detail panel. Nowhere else. Identity colour is rare here — that is why it means something.
- **Nothing performs.** No animated title gradients. No aurora light show. The one thing that moves is the waveform, because the waveform is alive with music.

Atmospheric depth: A single barely-visible vignette — `radial-gradient(ellipse 60% 40% at 0% 100%, rgba(20, 220, 20, 0.04) 0%, transparent 100%)` — bottom-left corner of the D console canvas. Felt, not seen. Not amber. Not warm. Cold electricity at the edge of the room.

### Layout — Vault Archive Console
```
┌────────────────────────────────────────────────────────┐
│  pleasantsoulcollective [global wordmark — fixed TL]   │
├────────────────────────────────────────────────────────┤
│  RAIL: ALL · UNRELEASED · RELEASED · ARCHIVE  ● SIGNAL │
│  36px · 1px --border below                            │
├────────────────────────────────────────────────────────┤
│                                                        │
│  VAULT TRACK WALL  (fills all remaining height)        │
│  repeat(auto-fill, minmax(118px, 1fr))                 │
│                                                        │
│  each cell: waveform thumb · # · title · BPM · tag    │
│  dp living monogram canvas behind at ~2% opacity       │
│  amber 1px left-edge accent on selected cell only      │
│                                                        │
│  ─────────────────────────────────────────────────     │
│  UPLOAD ZONE — pinned bottom, 80px, dashed 1px border  │
└────────────────────────────────────────────────────────┘

When a track is selected → TRACK DETAIL PANEL slides in
from the right edge (300px wide). Track wall reflows.
Panel dismisses on outside click or × control.
```

### RAIL
- **Left:** Section filters — `ALL` · `UNRELEASED` · `RELEASED` · `ARCHIVE` in Chakra Petch 500, 9px, uppercase, tracking 0.12em. Active filter at full opacity; inactive at 0.35. No button chrome — text is the control.
- **Center:** Track count — e.g. `47 TRACKS` in Chakra Petch 400, 9px, `--text-muted`
- **Right:** `● SIGNAL` — Chakra Petch 600, 11px, `--amber`. The dot pulses 2.4s ease-in-out infinite when live. This is the only amber in the RAIL.
- Height: 36px. `1px --border` below.

### Vault Track Wall
- Primary surface. Fills full available height. Scrollable.
- CSS grid: `repeat(auto-fill, minmax(118px, 1fr))`
- **Each cell:** waveform thumbnail (30px height) · track number (9px, Chakra Petch 500, `--text-muted`) · title (11px, Chakra Petch 400, near-white) · BPM (9px, muted) · section tag (8px)
- **Selected cell:** 1px  left-edge accent line. Nothing else changes.
- **Hover:** waveform thumbnail gains 15% brightness only. No other motion.
- **Orphan last-row:** spans full width, max-width 180px (existing spec unchanged)
- **Upload zone:** pinned to bottom of the wall. 80px. Dashed 1px `--identity` border. On drag-enter: border goes solid, `--identity-glow` appears. Feels like a tape loading bay. (Existing spec applies.)

### Living Monogram — dp Instances
The dp tessellation stays black on black — same as entry. No amber tint. Instead:
- One random `dp` instance pulses softly at a time: `opacity: 0 → 0.07 → 0` over 2.5s `ease-in-out`
- After fade completes, a different random instance is chosen. Never two at once.
- The canvas breathes. The room is alive. Quietly.
- **Implementation:** `DPWallpaper.jsx` — add `mode="living"` prop. In living mode, canvas selects random glyph positions and animates them sequentially instead of rendering all at static opacity.

### Track Detail Panel
Slides in from right edge on track selection. 300px wide. `background: #0b0806`. `1px --border` left edge.

- **Waveform preview:** 80px tall, full panel width. Amber playhead. CRT scanlines at 5% opacity.
- **Track title:** Chakra Petch 700, 28px, near-white. Static. No animation. It knows what it is.
- **BPM + Key:** Chakra Petch 600, 14px, 
- **Section selector:** `UNRELEASED` · `RELEASED` · `ARCHIVE` chips. Chakra Petch 500, 9px, uppercase. Active chip: 1px amber border.
- **Descriptors:** editable tag list. Chakra Petch 400, 11px. `+` to add. Near-white on `--surface`.
- **Voice comment list:** existing spec applies here.
- **Dismiss:** `×` top-right corner, Chakra Petch 500, 10px, `--text-muted`.

### Identity Color Application (sparse)
- `--identity: #14dc14` (D) / `#00e5ff` (L) — applied in exactly **3 places only**
- Applied in exactly three places: **THE SIGNAL button · active track accent line · BPM/Key in detail panel**
- Amber (`#ffb347`, `#ffbf00`) is **permanently banned** from all surfaces. It does not exist here.
- THE SIGNAL dot colour is Serato red `#e52020` — not identity green.

### Cursor
- Custom glowing ball (12px, `box-shadow: 0 0 8px #ffb347, 0 0 20px #ffb347, 0 0 50px #ffb347`)
- Shrinks to 7px on click
- Spotlight: 500px radial gradient follows cursor
- `cursor: none` on body


---

## Listener Experience — The Living Archive

### Concept
When a Master or Member authenticates, they do not arrive at a music app. They arrive at D's world. The platform is the frame. D is everything inside it.

This is a private archive — a room built for the music, and for the person D chose to let in. No recommendations. No social metrics. No platform voice. Just the work, laid out with dignity.

### The Vault — Listener Hero Layout

The full screen is the vault. Two states: browsing and playing.

**Browsing state:**
- The living dp monogram canvas is the background — black on black, one `dp` instance pulsing quietly at a time (see Living Monogram spec)

- **Featured track** (top of vault — D's designated piece): full-width waveform at 180px, track title at 64px Chakra Petch 700 near-white, track number + BPM at 11px muted below. Generous space above and below. The track has presence.
- **Archive below:** the track wall grid — same structure as D's console view. The listener sees exactly what D organized, in the order D chose.
- Section labels (`UNRELEASED` · `RELEASED` · `ARCHIVE`) in Chakra Petch 500, 9px, uppercase, 
- No sidebar. No navigation chrome. No recommendations. No metrics of any kind.

**Playing state:**
When the listener activates a track:
- The featured waveform is now the active track. Playhead moves. Waveform bars carry amber intensity.
- Background deepens slightly: surface transitions from near-black → true black over 400ms.
- The dp monogram pulse rate slows — one pulse every ~6s instead of ~3s. The room settles.
- The track title holds. Nothing else changes. The archive below remains scrollable.
- D's world does not collapse to a player view. You are in the archive, and the music is playing.

### Track Cells as Objects
Each track in the listener grid is an object, not a row:
- **Waveform thumbnail** (full cell width, 30px height): on hover, brightens 20% and plays a 3s animation — bars subtly shift as if the track is alive
- **Track number:** 9px, Chakra Petch 500, `--text-muted`
- **Title:** 11px, Chakra Petch 400, near-white
- **BPM:** 9px, muted
- **Section tag:** 8px — for UNRELEASED, dim green for RELEASED, stone for ARCHIVE
- No play button at rest. Hover reveals a bare `▶` centered — Chakra Petch, no chrome, no circle, no fill. Click anywhere in the cell plays the track.

### THE SIGNAL — The Live Event
When D is broadcasting, the experience transforms. This is not a notification. It is an event.

- **Event banner** appears at vault top: `● D IS LIVE` — Chakra Petch 600, 11px, .
- **Entering SIGNAL:** vault recedes (opacity → 0.15 over 600ms). The live feed takes the screen. Full-width live waveform at 200px. Amber playhead pulses with the signal. The living dp monogram canvas active behind it.
- THE SIGNAL is not a broadcast interface. It is a room you enter.
- **Masters-tier chat:** right edge, 240px wide, Chakra Petch 400, 11px. Messages appear as minimal strips. No usernames by default — just the message, the code if enabled. No reactions, no threads.
- **Exit:** `× LEAVE` top-right corner. Chakra Petch 500, 10px, near-white. No icon. The vault returns.

### Muse Sections
When the vault contains a Muse artist's content:
- Their section carries a faint identity color ambient — the single vignette treatment in their locked color at 0.05 opacity
- Their section label carries their identity color at 0.6 opacity
- Moving between sections shifts the room's tone — subtle, like walking through a building where each room has its own light

### What Is Never Here
No follower counts. No play counts. No like buttons. No share buttons. No recommendations. No "listeners this week." No platform branding or editorial voice. No algorithmic ordering. No ads. No upsells.

The listener is here because D wanted them here. The design reflects that their presence is already the privilege.

---

## Copy Law — UI Language Rules

All UI copy follows a single voice: the console. Not the app. Not the platform. The instrument.

**Rules (non-negotiable):**
- **ALL CAPS only** for every label, state message, nav item, control, and system message. Chakra Petch renders uppercase cleanly — this is not shouting, it is instrumentation.
- **No complete sentences.** Fragments only. `VAULT EMPTY` — not "This vault is empty." `CONNECTION FAILED` — not "We couldn't connect."
- **No contractions.** Not "can't", not "won't". The console does not hedge.
- **No mixed case in UI labels.** Artist-provided metadata (track titles, descriptions) is exempt — those are D's words, rendered as-is.
- **No human voice.** The console does not apologize, encourage, or reassure. It reports state.
- **Ellipsis for loading:** `LOADING VAULT...` not `Loading...` or `Please wait.`

**Access tier:**
- The read-only tier is called **GUEST**. Never "Listener", "Viewer", "User", or "Fan".
- `REQUEST GUEST ACCESS` — the only public-facing copy for this tier.
- DB tier value: `"guest"`. MembersPanel label: `GUEST`. Any table or log reference: `GUEST`.

---

## Guest Tier — Definition

The GUEST tier is the public-facing access request tier. It is the lowest trust level. Guests receive read-only access to the vault surfaces D has opened.

| Property | Value |
|---|---|
| Canonical name | GUEST |
| DB tier value | `"guest"` |
| UI display | `GUEST` (Chakra Petch 500, 9px, tracking 0.12em, `--text-secondary`) |
| Request modal CTA | `REQUEST GUEST ACCESS` |
| Access level | Read-only — vault browsing and playback only |
| What they cannot do | Upload, comment, view unreleased, access console |

Never use: "Listener", "Listener Access", "listener tier", "fan", "viewer", "watcher", "subscriber."

---

## Empty States — Canonical Specs

Empty states are instrument states, not error states. They communicate current condition, not failure.

### VAULT EMPTY
When all records in a vault have been voided or none have been uploaded yet.
- **Headline:** `VAULT EMPTY` — Chakra Petch 700, 28px, `--text-primary` at 0.4 opacity
- **Sub:** `NO TRACKS HAVE BEEN LOADED` — Chakra Petch 500, 10px, `--text-secondary`, tracking 0.12em
- **Accent:** 1px horizontal line, 48px wide, `var(--identity)` at 0.3 opacity, below the sub-label
- **No icons, no illustrations, no planets, no astronaut silhouettes.** The empty vault is architecture, not decoration.
- **Implemented in:** `VaultEmpty.jsx`

### ARCHIVE LOG CLEAR
When the ArchitectConsole track table has no entries (filtered view is empty).
- **Message:** `— ARCHIVE CLEAR —` — Chakra Petch 400, 11px, `--text-muted`, centered in the table body
- No buttons. No prompt to upload. The console does not suggest.

### TRANSMISSIONS EMPTY
When the voice comment list for a track has no recordings.
- **Message:** `NO TRANSMISSIONS` — Chakra Petch 500, 10px, `--text-muted`, tracking 0.12em
- No sub-label. No prompt.

### MEMBERS PANEL — NO ENTRIES
When MembersPanel has no active members or guests.
- **No members:** `NO MEMBERS` — Chakra Petch 500, 10px, `--text-muted`
- **No guests:** `NO GUESTS` — same treatment

---

## Error Recovery States — Canonical Specs

Errors communicate failure operationally. Cold and precise.

### VAULT FETCH FAILURE
When the track list cannot be loaded from the database.
- **Message:** `VAULT UNAVAILABLE` — Chakra Petch 600, 11px, `--error-text`
- **Retry action:** `RETRY` — Chakra Petch 500, 9px, `--identity` at 0.7 opacity. No button chrome. Text is the control. Inline after the message or on next line.
- **No stack trace, no "something went wrong", no apology.**
- **Implemented in:** `ArchitectConsole.jsx` — `arch-lib-empty arch-lib-error` state + table `<tr>` version

### AUDIO LOAD FAILURE
When a track cannot be streamed (network error, CDN failure, missing file).
- **Message:** `STREAM UNAVAILABLE` — same treatment as VAULT FETCH FAILURE
- **Retry:** same pattern
- **Surface:** inline in the waveform area or track cell, not a modal

### General Error Pattern
```
[ERROR_CODE] — [RETRY?]
```
Error code: Chakra Petch 600, 11px, `--error-text`  
Retry: Chakra Petch 500, 9px, `--identity` at 0.7 opacity  
Background: `--error-surface` (`#1a0505`)  
0px border-radius. 1px `--error-text` left border.

---

## Motion — Accessibility Guard

**All hardware-style animations MUST include a `prefers-reduced-motion` guard.**

This applies to:
- DPWallpaper canvas pulse loop (Living Monogram)
- StrobeVinylCanvas / WebGL shader animation loop
- REC armed pulse
- Cursor spotlight / glow follow
- Any `setInterval` or `requestAnimationFrame` loop

Guard pattern:
```js
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!prefersReduced) {
  // start animation loop
}
```
For canvas-based loops: check once on mount and skip `requestAnimationFrame` entirely when `prefers-reduced-motion: reduce` is set. Do not just reduce the effect — stop the loop.

---

## Mobile Viewport — Layout Rules

**Device split:**
- Listener (GUEST) view: **iPhone primary** — design at 390px, verify at 375px
- D console, L console, ArchitectConsole: **desktop/laptop primary** — 1280px min
- No mobile console for D or L. If a user on mobile tries to access a console route, show `CONSOLE REQUIRES DESKTOP` (Chakra Petch 500, 11px, centered, `--text-secondary`). No redirect, no modal. Just state.

**Listener mobile breakpoints:**
| Breakpoint | Rule |
|---|---|
| `< 768px` | Single-column vault grid. File-cell spans 100% width, 2-up max with `minmax(160px, 1fr)` |
| `< 480px` | Single-column only. File-cell `minmax(100%, 1fr)` |
| Bottom nav | Fixed 48px bar, z-index 100. 4 vault switchers max. Chakra Petch 500, 9px. |

**Touch targets:**
- Minimum 44×44px for all interactive elements
- Track cells: minimum 56px height on mobile
- No hover-only controls on mobile — any hover-reveal (e.g. `▶` play icon) must also appear on first tap/focus

**What never changes on mobile:**
- Font stays Chakra Petch — no system font fallback substitutions for UI labels
- 0px border-radius — hard edges on mobile too
- Identity color remains exactly 3 points
- THE SIGNAL button: present, full touch target, same Serato red

---

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-24 | Achromatic base + artist identity layer | Platform's brand color is the artist's identity color. Sovereignty model expressed visually. |
| 2026-04-24 | Chakra Petch as the singular typeface | One instrument, one voice. Reads as data readout, vault title, and nav label. No serifs. |
| 2026-04-24 | Comfortaa quarantined to logo/dp mark only | Comfortaa = the brand mark. Every functional element gets Chakra Petch. |
| 2026-04-24 | 0px border-radius everywhere | Hard edges = hardware language. Anodized aluminum, not rounded plastic. |
| 2026-04-24 | DPWallpaper canvas on entry | Canvas-rendered half-drop tessellation. Comfortaa in canvas = correct (it's the logo). |
|
| 2026-04-24 | Theme system via data-theme on body + CSS custom property overrides | `--identity` / `--identity-dim` / `--identity-glow` are the three core theme tokens. |
| 2026-04-24 | Pre-auth entry accent = copper #B87333, not D's amber | Entry is before identity. Copper hints at the premium without committing to D's world. |
| 2026-04-25 | Vault dp wallpaper via CSS ::before at 2.2% white opacity | CSS vars can't go in SVG data URIs. White at near-zero opacity reads as luxury texture against dark identity backgrounds. |
| 2026-04-25 | Orphan track row fix: span full-width via rAF + getBoundingClientRect | Detects lone last-row cells after grid render, applies grid-column: 1 / -1. |
| 2026-04-26 | entry-aperture background: transparent | DPWallpaper canvas provides the background. Aperture must be transparent or canvas is hidden behind it. |
| 2026-04-30 | Helix removed — waveform confirmed as D's instrument | D and all DJs live in waveforms (Serato, Pioneer). Waveform is the native language. Helix was decorative; waveform is functional. |
| 2026-04-30 | D console purpose clarified — archive management, not mixing surface | D uses the console to upload, tag, organize, and launch THE SIGNAL. No transport bar, no cue points, no pitch fader. |
| 2026-04-30 | Fashion luxury recalibration — negative space carries weight | Inspired by fashion luxury branding (not hotel luxury). |
| 2026-04-30 | Living Monogram — dp pulses one instance at a time | Vault wallpaper stays black on black. Individual dp instances pulse sequentially, never two at once. The room breathes quietly. |
| 2026-04-30 | pleasantsoulcollective wordmark — global, persistent, top-left | All lowercase, soul at 1.2× scale (no spaces). Comfortaa 700. Present on every screen post-auth. Pre-auth at 0.12 opacity. |
| 2026-04-30 | Listener experience — The Living Archive | Cinematic vault: featured track hero, living monogram, no social mechanics, no platform voice. THE SIGNAL as an event you enter, not a stream you watch. |
| 2026-04-30 | Entry screen two-mode design — Masters vs Seekers | Masters: master key center. Seekers: dp monogram center, request-access form, master code bottom-right corner like a lamp. |
| 2026-05-01 | GUEST tier replaces "Listener" everywhere | "Listener" is too generic. GUEST is precise — they were invited. DB tier: "guest". CTA: "REQUEST GUEST ACCESS". |
| 2026-05-01 | Copy Law locked — ALL CAPS, fragments, no voice | Console does not speak. It reports state. Contractions, sentences, mixed case banned from UI labels. |
| 2026-05-01 | Empty state spec locked — VaultEmpty.jsx canonical | VAULT EMPTY / NO TRACKS HAVE BEEN LOADED / 1px identity accent. No illustrations. Architecture, not decoration. |
| 2026-05-01 | Error recovery pattern locked — cold + operational | VAULT UNAVAILABLE / STREAM UNAVAILABLE + inline RETRY in --identity at 0.7. No apologies. No modals. |
| 2026-05-01 | Motion accessibility guard mandatory | All canvas/rAF loops must check prefers-reduced-motion. Stop the loop — don't just dim the effect. |
| 2026-05-01 | Mobile: Listener = iPhone primary, D/L console = desktop only | Console routes show "CONSOLE REQUIRES DESKTOP" on mobile. No mobile console. No redirect. |
| 2026-05-01 | Memorable thing updated | "The most serious music platform I've ever seen." Replaces "This is D's world — I'm just visiting." |
