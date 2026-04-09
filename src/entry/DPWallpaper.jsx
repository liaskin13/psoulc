import React, { useEffect, useRef } from 'react';

// ── DP MONOGRAM WALLPAPER — Stealth Wealth ─────────────────────────────────
// Canvas-based repeating "dp" pattern in Comfortaa.
// Waits for document.fonts.ready so the web font is guaranteed loaded.
//
// Aesthetic target: Fendi / Gucci — gloss letter on matte black ground.
//   • Background:  deep matte black (#050505)
//   • Letter base: barely-lighter dark (#111111 → #0b0b0b gradient)
//   • Specular:    1-2px offset highlight on upper-left edge
//   • Shadow:      1px offset darkening on lower-right edge
//   • Net contrast: ~6–8% above background — visible only on close inspection
//
// Tessellation: half-drop repeat (every odd row shifts right by half a tile),
// the same layout used by Louis Vuitton and Fendi monograms.

function DPWallpaper({ opacity = 1 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // ── TILE CONFIG ────────────────────────────────────────────────────────
    const TILE_W   = 110;   // horizontal step between repeats
    const TILE_H   = 72;    // vertical step
    const FONT_SZ  = 44;    // px — Comfortaa 700
    const FONT     = `700 ${FONT_SZ}px Comfortaa, sans-serif`;

    // Colour palette — everything lives within 0–15% lightness
    const BG          = '#050505';
    const FILL_LIGHT  = '#161616';   // letter body highlight corner
    const FILL_DARK   = '#0a0a0a';   // letter body shadow corner
    const SPEC_COLOR  = '#242424';   // 1px specular stroke (top-left edge)
    const SHADOW_CLR  = '#020202';   // 1px shadow stroke (bottom-right edge)

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;

      // ── BG ──────────────────────────────────────────────────────────────
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      ctx.font           = FONT;
      ctx.textAlign      = 'center';
      ctx.textBaseline   = 'middle';
      ctx.globalAlpha    = 1;

      const cols = Math.ceil(W / TILE_W) + 2;
      const rows = Math.ceil(H / TILE_H) + 2;

      for (let row = -1; row < rows; row++) {
        // Half-drop: odd rows shift right by half a tile
        const xShift = (row % 2 !== 0) ? TILE_W * 0.5 : 0;

        for (let col = -1; col < cols; col++) {
          const cx = col * TILE_W + TILE_W / 2 + xShift;
          const cy = row * TILE_H + TILE_H / 2;

          // ── SPECULAR LAYER (top-left offset +1px) ──────────────────────
          ctx.globalAlpha = 0.55;
          ctx.fillStyle   = SPEC_COLOR;
          ctx.fillText('dp', cx - 0.8, cy - 0.8);

          // ── SHADOW LAYER (bottom-right offset +1px) ────────────────────
          ctx.globalAlpha = 0.7;
          ctx.fillStyle   = SHADOW_CLR;
          ctx.fillText('dp', cx + 0.8, cy + 0.8);

          // ── MAIN LETTER BODY — top-left → bottom-right gradient ────────
          const grad = ctx.createLinearGradient(
            cx - FONT_SZ * 0.55, cy - FONT_SZ * 0.45,   // top-left corner of bounding box
            cx + FONT_SZ * 0.55, cy + FONT_SZ * 0.45    // bottom-right corner
          );
          grad.addColorStop(0,    FILL_LIGHT);   // specular face
          grad.addColorStop(0.35, '#111111');    // mid highlight
          grad.addColorStop(0.65, '#0d0d0d');    // mid shadow
          grad.addColorStop(1,    FILL_DARK);    // receding face

          ctx.globalAlpha = 1;
          ctx.fillStyle   = grad;
          ctx.fillText('dp', cx, cy);
        }
      }

      ctx.globalAlpha = 1;
    };

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      draw();
    };

    // Guarantee Comfortaa is loaded before painting
    document.fonts.ready.then(() => {
      resize();
    });

    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position:      'fixed',
        inset:         0,
        zIndex:        0,
        pointerEvents: 'none',
        opacity,
        transition:    'opacity 1.6s ease',
      }}
    />
  );
}

export default DPWallpaper;
