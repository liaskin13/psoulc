# Interface Design System: Pleasant Soul Collective

**Intent:** Cinematic, professional instrument feel for sovereign artists. High density, technical precision, and ambient warmth.

## Design Tokens

### Palette (Identity System)
- **--void**: #000000 (Base background)
- **--surface**: #0d0d0d (Elevated surface)
- **--border**: rgba(255, 255, 255, 0.04) (Subtle separation)
- **--identity**: #ffb347 (Amber - D-Soul) | #00e5ff (Cyan - L-Architect)
- **--identity-dim**: rgba(identity, 0.2)
- **--identity-glow**: rgba(identity, 0.5)

### Typography
- **Display/Body**: Chakra Petch (Weights: 300, 400, 500, 600, 700)
- **Data/Monospace**: "SF Mono", "JetBrains Mono", monospace
- **Signature (Whitelisted Only)**: Comfortaa (Logo, DP Mark, Aperture Cursor, Wordmark)

### Spacing & Layout
- **Base Unit**: 4px
- **Grid Zones**:
  - **Rail (Top)**: 30px
  - **Transport (Bottom)**: 52px
  - **Bins (Sidebar)**: 214px
  - **Chain (Right)**: 188px
- **Density**: High (App UI Rules)

### Depth & Borders
- **Strategy**: Borders-only. 
- **Radius**: 
  - **Standard**: 0px (Sharp edges)
  - **Controls/Toggles**: 9999px (Pill)
- **Borders**: 1px solid var(--border). No heavy decorative borders.

## Component Patterns

### Console Navigation (Vault Pads)
- **Pattern**: Quadrant or Grid-based navigation.
- **Colors**: Custom vault mapping (Venus: Amber, Saturn: Copper, Mercury: Silver, Earth: Stone).
- **State**: Active pads use `--identity-glow`.

### Data Tables (Roster/Tracklist)
- **Pattern**: Dense phosphor tables.
- **Header**: Uppercase, Chakra Petch 500, 11px.
- **Cells**: Monospace for numbers/codes, Chakra Petch for text.
- **Highlight**: Row hover at 4% white or `--identity-dim`.

### Interaction Decorators
- **Aurora**: Animated radial gradients (80px blur) behind the MONITOR zone.
- **CRT Lines**: 2px/4px repeating linear gradients (18% opacity) over waveforms and readouts.
- **Gold Foil**: Animated `background-clip: text` for primary track titles (Amber theme only).

## Usage Rules

### 1. The Pre-Auth Law
The entry screen is **Black on Black**. No identity colors (Amber/Cyan) should appear until a user session is established and `data-theme` is applied to the body.

### 2. The Comfortaa Quarantine
Comfortaa is only allowed in:
1. `PLEASANT SOUL COLLECTIVE` brand wordmark.
2. `DPWallpaper` (Canvas)
3. `.file-cell-dp-mark`
4. `.psc-seal` (Logo)
5. `.aperture-code-cell` active cursor.
All other UI text must use Chakra Petch.

### 3. Affordance Signals
- **Custom Cursor (D-Soul)**:
  - `body { cursor: none; }`
  - **Ball**: 12px glowing amber ball (#ffbf00). Shrinks to 7px on click.
  - **Spotlight**: 500px radial gradient (#ffbf00 at 0.04 opacity) follows cursor.
- **Clickable**: 1px border shift or `--identity` color fill.
- **Inactive**: 40% opacity, `pointer-events: none`.

---
*Created by GStack Interface Design Skill. Approved for Phase 9/10 implementation.*
