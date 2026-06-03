# Design System — Pleasant Soul Collective

## Product Context

- **What this is:** A cinematic, artist-first music platform. Sovereign infrastructure for independent creators.
- **Who it's for:** M³ tiers — MASTERS (D and L), MUSES (invited collaborators), MEMBERS (paying listeners).
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

## Guest Flow

The guest was invited — not discovering. Every design decision in this flow should reflect that. The sensation is receiving a mixtape, not browsing a catalog. Abundance is communicated through time, not marketing.

### Vault Landing

- **Hero:** Total runtime of all published mixes. 72–96px `--font-mono` (Space Mono, valid numeric readout surface). Format: `5:42` = 5 hours 42 minutes. The number IS the promise. No kicker — the number stands alone.
- **Vault name:** Below the hero — vault label + session count at 8px Chakra Petch 600, 0.24em tracking, `--text-secondary`.
- **No CTA button.** Entry is: `TOUCH ANYWHERE TO ENTER` — 10px Chakra Petch 500, 0.14em tracking, `rgba(240,237,232,0.35)` color. Breathes at `opacity: 0.35 ↔ 0.65` over `2.6s ease-in-out infinite`. An invitation, not a button.
- **Background:** DPWallpaper canvas at full opacity. Permanent — same tessellation as entry. The wallpaper is the room, not a door.
- **Layout:** Vertically centered content block. No wasted empty space — if it reads as "page failed to load," something is wrong.

### Mix List

Visual identity problem: PSC has no cover art, no album art, no per-mix image. The **waveform shape IS the artwork** for each mix. Every mix has a distinct waveform fingerprint.

- **Row structure:** track number · title · duration · waveform thumbnail · voice badge
  - Track number: Space Mono 15px, left-anchored, `--text-muted`
  - Title: Chakra Petch 500, flex-grow, `--text-primary`
  - Duration: Space Mono 11px, right-anchored, `--text-secondary`
  - Waveform thumbnail: 52×26px, seeded pseudorandom bars (seed = track title string → always same shape per mix), bar color `rgba(240,237,232,0.55)` (warm off-white — achromatic, not identity green)
  - Voice badge: count only, `--vc` color, 9px Chakra Petch, shown only if comments exist
- **Row height:** 52px. `border-bottom: 1px solid var(--border)`.
- **Seeded waveform:** Use track title as string seed for PRNG. Same input → same bar heights every render. The waveform shape becomes how guests recognize a mix before playing it.

### Player — Paused State

Browser autoplay restrictions make this state extremely common. It must feel inhabited, not broken.

- **Main area:** Ghost waveform at 11% opacity — all bars `rgba(240,237,232,0.11)`. Spatial presence without implying playback.
- **Center overlay:** Track title (14px Chakra Petch 600) + pulsing ▶ SVG polygon glyph (24px, `opacity: 0.4 ↔ 1.0` at `2s ease-in-out`).
- **Reading:** "Something is loaded here. Tap to hear it."

### Player — Playing State

The waveform IS the stage. No album art needed. The shape is identity.

**Current implementation (ListenerVaultView — pending upgrade):**
- Played bars: `#14dc14` at 0.92 alpha — D's identity green
- Unplayed bars: `rgba(240,237,232,0.55)` — warm off-white. Never cold grey.
- Playhead: `1px solid rgba(240,237,232,0.9)`, no glow. Clean wire through the shape.

**Canonical waveform spec (DeckWaveform — see Waveform section below):**
The listener waveform is pending upgrade to the Serato frequency-band approach. When upgraded, it should match the DeckWaveform rendering exactly.

- **Voice comment markers:** Warm diamond dots (6×6px `rotate(45deg)` square, `--vc-dot` color) positioned along the top edge of the waveform at time-mapped x positions. Tapping a diamond opens the comment card.

### Mini-Transport Strip

Persists when a guest navigates from the player back to the track list during playback. The music must not stop — the strip is the bridge.

- **Container:** Fixed bottom strip above the vault dock. `--surface` background, `border-top: 1px solid var(--border)`. Height 48px.
- **Content:** Track title (truncated, Chakra Petch 500 11px) + PAUSE/RESUME button (god-btn compact, 28px) + elapsed time (Space Mono 10px, valid mono surface).
- **Tapping strip:** Returns to full player view. Tapping PAUSE/RESUME acts in place.
- **Critical:** Never hide or remove the strip while audio is playing. The guest navigated away from the player — that was their choice. The music plays until they stop it.

---

## Waveform (Canonical — DeckWaveformV2)

**The waveform is not decoration. It is the visual identity of the mix.**

PSC has no album art concept. The waveform shape is how a mix is recognized before it plays. This is not a limitation — it is the principle. Every rendering decision reinforces it.

### Screen-Blend Outline Rendering (Production)

Used by `DeckWaveformV2.jsx` (console). A three-layer vector outline approach using screen composite blending on a black canvas. Replaces the old Serato bar renderer.

**Three continuous outline paths per frame:**

| Layer | Color | Frequency Range | Role |
|-------|-------|-----------------|------|
| Bass  | `rgba(255, 0, 0, 0.8)` | 0–250 Hz | The groove — the lowest harmonic |
| Mid   | `rgba(0, 255, 0, 0.8)` | 250 Hz–2.5 kHz | The melody — the vocal/harmony range |
| High  | `rgba(0, 255, 255, 0.8)` | 2.5 kHz+ | Transients, attack, air — brightness |

**Rendering pipeline:**
1. Black background (alpha 0)
2. Three closed outline paths rendered with `globalCompositeOperation = 'screen'`
3. At crossings where two or more paths overlap, screen blending produces white (`#ffffff`)
4. Playhead drifts naturally at track edges (Serato convention)
5. Past-portion dimmed via black overlay (plays through, visual weight on future)
6. All production features preserved: hot cues (colored markers), loop regions (cyan highlight), beat grid (phrase/bar/beat opacities), time ruler (MM:SS labels), zoom (6 levels: 2s→64s windows)

**Why screen composite:**
Screen blending (multiply light intensities) on a black canvas creates natural white at band crossings, visualizing frequency overlap. A kick hitting a hi-hat shows white at the intersection — the physics of sound made visible.

**Data source:** Pre-computed waveform at 50 bars/sec (Rekordbox standard), stored as `{bass, mid, high, peak}` per bar. Generated via single-pole IIR filtering (250 Hz bass cutoff, 2.5 kHz mid cutoff) with per-band independent normalization.

### Seeded Placeholder (No Real Waveform Data)

Used in track lists (52×26px thumbnail) and wherever real FFT data isn't available. Seed = track title string → deterministic PRNG → same shape every render. The waveform fingerprint is stable: a guest learns to recognize a mix by its shape before they tap it.

- Thumbnail color: `rgba(240,237,232,0.55)` — warm off-white. Single color (no frequency bands at thumbnail scale).
- Thumbnail size: 52×26px. Seeded bar heights. No playhead.

### ListenerVaultView Waveform (Pending Upgrade)

Currently renders single-color (played green / unplayed off-white). Targeted for upgrade to Serato frequency bands in a future sprint. Until then, use the NEXT_SESSION.md values:

- Played: `#14dc14` at 0.92 alpha
- Unplayed: `rgba(240,237,232,0.55)` — warm off-white, not cold grey
- Ghost (paused): `rgba(240,237,232,0.11)`

---

## Voice Comments

Timed voice notes anchored to precise waveform positions. Like SoundCloud timed comments, but with voice — and with rules that protect the mix.

### Philosophy

Voice comments are **listener-authored content** — not platform chrome, not artist identity. They are moments of connection: a listener whispering something about the music at exactly the moment it hit them. The warm near-white color communicates humanity and intimacy, distinct from the cold achromatic system and from D's sovereign identity green.

### Color Tokens

```css
--vc:        rgba(240,230,200,0.72);   /* warm near-white — voice content accent */
--vc-dot:    rgba(240,230,200,0.55);   /* marker dots at rest */
--vc-active: rgba(240,230,200,0.92);   /* active/tapped marker */
--vc-bg:     rgba(20,18,14,0.96);      /* comment card background (dark warm) */
```

Why warm near-white and not identity green: green = D's sovereignty. Warm near-white = a person speaking. The distinction is immediate and correct.

### Marker Anatomy

- 6×6px `rotate(45deg)` square (diamond shape) at `--vc-dot` color
- Positioned at `x = (timestamp / total_duration) × waveform_width` along top edge of waveform
- Tapping expands comment card inline below the waveform. Waveform remains visible.
- Tapping again or tapping elsewhere closes card.

### Comment Card

```
[00:42:17]  L         ×
"the way this break hits after the build..."
[ HEAR IT ]
PLAYS AT WHISPER VOLUME · MIX CONTINUES
```

- Full-width, `--vc-bg` background, `border: 1px solid rgba(240,230,200,0.18)`
- Timestamp: Space Mono 11px (valid mono surface — it's a timestamp readout)
- Handle: Chakra Petch 500 11px. `D` renders in Serato green. `L` renders in L's cyan. Guest handles render in `--vc`.
- Transcript: Chakra Petch 400 **italic**, 13px, `--vc` color. Auto-transcribed from voice by default.
- HEAR IT: 28px god-btn variant, `--vc` border and color. Never auto-plays.
- Footer: `PLAYS AT WHISPER VOLUME · MIX CONTINUES` — 9px Chakra Petch 500, `--text-muted`.

### Audio Behavior (HEAR IT)

The mix never stops. The comment is a layer, not a takeover.

```js
// Web Audio API gain ramping — never interrupts the mix
mixGainNode.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.3)
vcAudio.play()
vcAudio.onended = () => {
  mixGainNode.gain.linearRampToValueAtTime(1.0, ctx.currentTime + 2.0)
}
```

The sensation: someone leans over and whispers to you while the music plays. Then the music comes back up.

Auto-transcription is the **default display**. Voice is always opt-in (HEAR IT button). This solves public-space listening, accessibility, and the "I don't want to make noise" case simultaneously.

### Access Model

**Phase 1 (current spec):**
- Listeners (guests with valid access codes) can post voice comments on any track
- Comments auto-transcribe via Cloudflare AI (Whisper)
- D receives all new comments in console — pending review queue
- D can: respond (text or voice), react (like in Serato green), or ignore
- D's reactions and responses are visible to guests on the comment card
- L's console comments are **never** surfaced to guests — internal only

**Phase 2 (future — do not build yet):**
- D can **sample approved voice comments as audio clips in future mixes** — pull a fan's voice in as an effect or texture
- A fan hears their own voice in a published mix. They lose their mind. They tell everyone.
- This is a deliberate platform differentiator. It closes the loop between listener and artist in a way no platform has done. Spec it when building the comment approval queue.

### Never

- Auto-play voice comments
- Overlay comment text on the waveform (cluttered)
- Show L's internal notes to guests
- Allow voice comments without a valid access code session
- Show Serato cue point labels in the guest view (D does not want this)

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
| 2026-05-19 | Guest flow: total runtime as vault landing hero | Guest was invited, not discovering. Duration communicates abundance and trust. No marketing language. |
| 2026-05-19 | No CTA button on vault landing — "TOUCH ANYWHERE TO ENTER" breathing | An invitation, not a button. The breathing opacity (2.6s ease-in-out) is the only motion on the landing. |
| 2026-05-19 | Waveform shape = visual identity of each mix. No album art. | PSC has no cover art concept. Seeded PRNG from track title → stable, unique waveform fingerprint per mix. |
| 2026-05-19 | Voice comments in warm near-white (--vc), not identity green | Green = D's sovereignty. Warm near-white = a person speaking. The distinction is legible and correct. |
| 2026-05-19 | Voice comments: listener-authored, D can respond/react/like via console | Comments are guest-facing. D's response carries authority (Serato green badge). L's internal notes never surface to guests. |
| 2026-05-19 | HEAR IT ducks mix to 25% gain, ramps back over 2s on ended | Mix is never interrupted. Comment is a layer. Web Audio API linearRampToValueAtTime. |
| 2026-05-19 | Phase 2: D can sample fan voice comments as audio in future mixes | Closes the listener↔artist loop in a way no platform has done. Fan hears their voice in a published mix. Build when comment approval queue ships. |
| 2026-05-19 | Serato cue labels never shown in guest/listener view | D does not want this. Cue points are his internal production metadata, not guest-facing content. |
| 2026-05-20 | User tiers renamed to M³: MASTERS / MUSES / MEMBERS | MASTERS = D and L (sovereign). MUSES = invited collaborators. MEMBERS = paying listeners. Formalizes what was implicit. |
| 2026-05-20 | DeckWaveform: Serato frequency-band rendering (orange/green/yellow-white) | Three bands stacked per bar, sqrt boost, 0.25 alpha past playhead. Mirrors Serato DJ Pro GEOB overview. The waveform IS the artwork. |
| 2026-05-20 | ListenerVaultView waveform: unplayed bars rgba(240,237,232,0.55) not cold grey | Off-white is warm and legible. Cold grey (rgba(160,160,160,0.13)) was wrong — too invisible on void background. |
| 2026-05-20 | Mini-transport strip: persists above vault dock during playback while in tracklist | Guest navigated away from player — their choice. Music plays until they stop it. Strip is the bridge back. |
| 2026-05-27 | Stereo VU: two canvases, L=cyan, R=green | Identity colors on the most live instrument in the console. The stereo field as a collaboration metaphor: L's eye on the left, D's soul on the right. Amber officially retired. |
| 2026-05-27 | Loudness meter: green→cyan gradient arc (the fused mix) | Neither L nor D — the combined signal. Completes the trio: cyan / green / gradient. |
| 2026-05-27 | Waveform 200px → 160px, analyzer row 96px → 120px | Brings waveform:meters ratio from 2.08x to 1.33x, matching pro DJ software proportions. Net deck: −16px. |
| 2026-05-27 | Arc geometry fix: r = min(cx×0.88, H×0.60) | Previous formula Math.min(W,H)×0.78 caused needle to clip off canvas edge at 205°/335° extremes. |
| 2026-05-27 | DPR fix: canvas backing store × devicePixelRatio, ctx.setTransform(dpr,0,0,dpr,0,0) | All needle gauges were rendering at 1x on Retina displays. setTransform before draw; coordinates remain in CSS pixels. |

---

## Stereo VU Meter (Analyzer Row — Left Column)

The analyzer row holds three instruments: VU (left), Spectrum Analyzer (center), Loudness (right). All three are canvas-drawn at 120px height (upgraded from 96px).

### VU Meter — L + R Channels

Two separate canvases side by side in `.arch-vu-col`. Each canvas is `calc(50% - 2px)` wide, 120px tall.

| Channel | Canvas | Arc color | Needle/hub | Label | Glow |
|---------|--------|-----------|------------|-------|------|
| L (Left) | `vuRef` | `#00ccff` cyan | `#00ccff` | "L" in cyan | `0 0 12px rgba(0,204,255,0.28)` |
| R (Right) | `vuRRef` | `#14dc14` green | `#14dc14` | "R" in green | `0 0 12px rgba(20,220,20,0.28)` |

**Signal routing:** L canvas = bass-frequency energy (rL). R canvas = high-frequency energy (rR). This mirrors the stereo split approximation already computed in `useAudioAnalyzer.js`.

**The trio metaphor:** L (cyan = the architect) | R (green = the artist) | Loudness (green→cyan gradient = the mix)

### Arc Geometry (applies to all needle gauges)

- `START_DEG = 205°`, `END_DEG = 335°`, `SPAN = 130°` (classic VU sweep)
- Pivot: `cx = W/2`, `cy = H * 0.91`
- **Radius fix:** `r = Math.min(cx * 0.90, H * 0.60)` — prevents needle clipping at narrow canvas widths (the old `Math.min(W,H)*0.78` formula caused the needle to extend off-canvas at the extreme positions)
- **DPR fix:** canvas backing store multiplied by `window.devicePixelRatio`, then `ctx.scale(dpr, dpr)` before drawing — ensures sharp rendering at 2x displays

### Loudness Meter — Gradient Arc (Green → Cyan)

Single canvas, `~72px` wide × `120px` tall. Represents overall RMS (neither L nor D — the fused mix).

- **Arc track gradient:** linear from `#14dc14` (green, at quiet/left end) → `#00ccff` (cyan, at hot/right end)
- **Needle tip:** `lerpHex(green, cyan, value)` — the tip color tracks the needle's position on the gradient arc
- **Red zone:** remains at `0.90` but in the gradient palette (cyan end reads "collision" naturally)
- **Label:** "dBFS"

### Sizing (waveform + analyzer proportions)

| Element | Before | After | Reason |
|---------|--------|-------|--------|
| `.arch-waveform-main` | 200px | 160px | Proportional to pro DJ software (Serato/Rekordbox ~130-140px) |
| `.arch-analyzer-row` | 96px | 120px | Meters now 43% of combined height vs 32% before |
| `.arch-spectrum-deck` | 96px | 120px | Matches analyzer row |
| `.arch-loudness-meter` | 96px | 120px | Matches analyzer row |
| Waveform : meters ratio | 2.08x | 1.33x | From amateurish to pro-grade proportions |

Net deck height change: −16px (tighter on 13" screens).

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
