/**
 * Device capability utilities.
 * Detect pointer type, hover support, and hardware tier
 * for progressive enhancement decisions.
 */

/** True when the primary pointer is a finger / pen (touch-first device) */
export const isTouchPrimary = window.matchMedia('(pointer: coarse)').matches;

/** True when hover is supported (mouse / trackpad) */
export const hasHover = window.matchMedia('(hover: hover)').matches;

/** True when device has low RAM or few cores — downgrade Three.js quality */
export const isLowEnd = () => {
  const cores = navigator.hardwareConcurrency || 4;
  const ram   = navigator.deviceMemory      || 4; // GB; undefined = assume 4
  return cores <= 4 || ram <= 2;
};

/** Preferred DPR capped at 2 — avoid 3x rendering on high-res mobile */
export const clampedDPR = () => Math.min(window.devicePixelRatio || 1, 2);
