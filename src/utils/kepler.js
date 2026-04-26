// Shared Keplerian orbital mechanics — single source of truth for planet positions.
// Used by SpaceWindow (3D) and SystemMap2D (2D radar) to stay in sync.

export const PLANET_DEFS = [
  { id: 'mercury', name: 'MERCURY', a: 12, e: 0.2,    period: 3,  size: 0.5,  color: '#b8a68f', chakra: '#b8a68f' },
  { id: 'venus',   name: 'VENUS',   a: 18, e: 0.006,  period: 8,  size: 0.7,  color: '#8b7a69', chakra: '#d2691e' },
  { id: 'earth',   name: 'EARTH',   a: 24, e: 0.017,  period: 12, size: 0.75, color: '#2a2a2a', chakra: '#8B7355' },
  { id: 'mars',    name: 'MARS',    a: 28, e: 0.0934, period: 16, size: 0.8,  color: '#c1440e', chakra: '#ff4500' },
  { id: 'saturn',  name: 'SATURN',  a: 32, e: 0.09,   period: 20, size: 1.0,  color: '#9d8b7a', chakra: '#b8860b' },
  { id: 'amethyst',name: 'AMETHYST',a: 42, e: 0.05,   period: 28, size: 1.2,  color: '#9b7aa8', chakra: '#9d7e6a' },
];

// Kepler's equation solver — returns [x, z] in orbital plane (y is up/tilt axis)
export function keplerPos(a, e, M) {
  // Eccentric anomaly via two Newton iterations (sufficient for e < 0.1)
  let E = M + e * Math.sin(M);
  E = M + e * Math.sin(E);
  // True anomaly
  const nu = 2 * Math.atan2(
    Math.sqrt(1 + e) * Math.sin(E / 2),
    Math.sqrt(1 - e) * Math.cos(E / 2),
  );
  const r = (a * (1 - e * e)) / (1 + e * Math.cos(nu));
  return [r * Math.cos(nu), r * Math.sin(nu)];
}

// Convert orbital [x, z] to normalized [0, 1] canvas coordinates.
// maxRadius should match the largest semi-major axis (amethyst.a = 42).
export function orbitalToCanvas(x, z, canvasW, canvasH, maxRadius = 44) {
  const cx = ((x / maxRadius) * 0.5 + 0.5) * canvasW;
  const cy = ((z / maxRadius) * 0.5 + 0.5) * canvasH;
  return [cx, cy];
}
