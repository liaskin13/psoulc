// Seeded waveform bar generator — deterministic per track id.
// Used by RecordShelf thumbnails and VaultWindow helix overlay.

function hashStr(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ h >>> 13, 0x9e3779b9);
    h ^= s.charCodeAt(i);
  }
  return Math.abs(h);
}

// Returns `count` bar heights (0–100) deterministically from a seed string.
export function getWaveformBars(seed, count = 18) {
  let h = hashStr(String(seed));
  return Array.from({ length: count }, () => {
    h = Math.imul(h ^ (h >>> 13), 0x9e3779b9) | 0;
    h ^= h >>> 7;
    return (Math.abs(h) % 72) + 18; // 18–90 %
  });
}

// Renders an inline SVG waveform element (string, usable in dangerouslySetInnerHTML
// OR as a React component via the companion WaveformSVG).
export function waveformPath(seed, count = 18) {
  const bars = getWaveformBars(seed, count);
  const barW = 3;
  const gap  = 2;
  const H    = 24;
  const W    = count * (barW + gap) - gap;
  const rects = bars.map((pct, i) => {
    const h = (pct / 100) * H;
    const x = i * (barW + gap);
    const y = H - h;
    return `<rect x="${x}" y="${y.toFixed(1)}" width="${barW}" height="${h.toFixed(1)}" rx="1"/>`;
  }).join('');
  return { W, H, rects };
}
