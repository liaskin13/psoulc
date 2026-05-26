// @vitest-environment node
// Pure math tests for the DeckWaveform time-window render logic.
// These functions mirror the draw loop in DeckWaveform.jsx exactly —
// if the component math changes, update these to match.
import { describe, it, expect } from "vitest";

// ── Render math (mirrored from DeckWaveform draw loop) ────────────────────────

function barIdxForPixel(px, canvasW, windowSeconds, currentTime, duration, barCount) {
  const viewStart = currentTime - windowSeconds / 2;
  const barTime   = viewStart + (px / canvasW) * windowSeconds;
  return Math.floor((barTime / duration) * barCount);
}

function pixelForTime(time, canvasW, windowSeconds, currentTime) {
  const pixelsPerSec = canvasW / windowSeconds;
  const viewStart    = currentTime - windowSeconds / 2;
  return Math.round((time - viewStart) * pixelsPerSec);
}

function seekTimeForClick(fracX, windowSeconds, currentTime) {
  return windowSeconds * (fracX - 0.5) + currentTime;
}

function overviewSeekTime(fracX, duration) {
  return fracX * duration;
}

function powerCurveHeight(peak, halfH, exponent = 2.5) {
  return Math.max(1, Math.pow(peak, exponent) * halfH * 0.96);
}

// ── barIdxForPixel ────────────────────────────────────────────────────────────

describe("barIdxForPixel — time-window bar mapping", () => {
  const W        = 800;
  const BARS     = 10000;
  const DURATION = 200; // seconds

  it("center pixel maps to the bar at currentTime", () => {
    const ct  = 100; // exactly halfway through a 200s track
    const win = 32;
    const idx = barIdxForPixel(W / 2, W, win, ct, DURATION, BARS);
    const expected = Math.floor((ct / DURATION) * BARS);
    expect(idx).toBe(expected);
  });

  it("left-edge pixel maps to bar at currentTime − windowSeconds/2", () => {
    const ct  = 60;
    const win = 32;
    const idx = barIdxForPixel(0, W, win, ct, DURATION, BARS);
    const expectedTime = ct - win / 2; // 44s
    const expected = Math.floor((expectedTime / DURATION) * BARS);
    expect(idx).toBe(expected);
  });

  it("right-edge pixel maps to bar at currentTime + windowSeconds/2", () => {
    const ct  = 60;
    const win = 32;
    const idx = barIdxForPixel(W - 1, W, win, ct, DURATION, BARS);
    // W-1 pixel, very close to right edge
    const viewStart   = ct - win / 2;
    const barTime     = viewStart + ((W - 1) / W) * win;
    const expected    = Math.floor((barTime / DURATION) * BARS);
    expect(idx).toBe(expected);
  });

  it("pixels before track start return negative index (caller skips them)", () => {
    const ct  = 5; // near start — left half of window is before t=0
    const win = 32;
    const idx = barIdxForPixel(0, W, win, ct, DURATION, BARS);
    expect(idx).toBeLessThan(0); // component skips these
  });

  it("pixels after track end return index >= barCount (caller skips them)", () => {
    const ct  = 195; // near end — right half of window is past duration
    const win = 32;
    const idx = barIdxForPixel(W - 1, W, win, ct, DURATION, BARS);
    expect(idx).toBeGreaterThanOrEqual(BARS);
  });

  it("wider window (64s) maps center pixel to same bar as 32s window", () => {
    const ct = 100;
    const idx32 = barIdxForPixel(W / 2, W, 32, ct, DURATION, BARS);
    const idx64 = barIdxForPixel(W / 2, W, 64, ct, DURATION, BARS);
    expect(idx32).toBe(idx64); // playhead bar is the same regardless of zoom
  });
});

// ── pixelForTime — hot cue / loop positioning ─────────────────────────────────

describe("pixelForTime — converts a time position to canvas x pixel", () => {
  const W  = 800;
  const CT = 100;
  const WIN = 32;

  it("currentTime maps to center of canvas", () => {
    expect(pixelForTime(CT, W, WIN, CT)).toBe(W / 2);
  });

  it("viewStart time maps to x=0", () => {
    const viewStart = CT - WIN / 2;
    expect(pixelForTime(viewStart, W, WIN, CT)).toBe(0);
  });

  it("viewEnd time maps to x=canvasWidth", () => {
    const viewEnd = CT + WIN / 2;
    expect(pixelForTime(viewEnd, W, WIN, CT)).toBe(W);
  });

  it("cue 8 seconds before currentTime maps to left of center", () => {
    const cueTime = CT - 8;
    const x = pixelForTime(cueTime, W, WIN, CT);
    expect(x).toBeLessThan(W / 2);
    // 8s before center in a 32s window = 8/32 = 25% from left = 200px
    expect(x).toBe(200);
  });

  it("narrower window spreads the same cue further from center", () => {
    const cueTime = CT - 4;
    const x32 = pixelForTime(cueTime, W, 32, CT);
    const x16 = pixelForTime(cueTime, W, 16, CT);
    expect(x16).toBeLessThan(x32); // 4s gap looks bigger in 16s window
  });
});

// ── seekTimeForClick ──────────────────────────────────────────────────────────

describe("seekTimeForClick — waveform canvas click to seek time", () => {
  it("click at center (frac=0.5) seeks to currentTime", () => {
    expect(seekTimeForClick(0.5, 32, 100)).toBe(100);
  });

  it("click at left edge (frac=0) seeks to currentTime − windowSeconds/2", () => {
    expect(seekTimeForClick(0, 32, 100)).toBe(84);
  });

  it("click at right edge (frac=1) seeks to currentTime + windowSeconds/2", () => {
    expect(seekTimeForClick(1, 32, 100)).toBe(116);
  });

  it("narrower window seeks closer to currentTime for the same frac", () => {
    const seek32 = seekTimeForClick(0.25, 32, 100); // 0.25*32 - 16 + 100 = 92
    const seek16 = seekTimeForClick(0.25, 16, 100); // 0.25*16 - 8  + 100 = 96
    expect(seek16).toBeGreaterThan(seek32);
  });

  it("seek time is linear across canvas width", () => {
    const ct = 60, win = 32;
    const t0 = seekTimeForClick(0,    win, ct);
    const t1 = seekTimeForClick(0.25, win, ct);
    const t2 = seekTimeForClick(0.5,  win, ct);
    const t3 = seekTimeForClick(0.75, win, ct);
    const t4 = seekTimeForClick(1.0,  win, ct);
    // Each step should be win * 0.25 = 8 seconds
    expect(t1 - t0).toBeCloseTo(8);
    expect(t2 - t1).toBeCloseTo(8);
    expect(t3 - t2).toBeCloseTo(8);
    expect(t4 - t3).toBeCloseTo(8);
  });
});

// ── overviewSeekTime ──────────────────────────────────────────────────────────

describe("overviewSeekTime — overview strip click to seek time", () => {
  it("frac=0 seeks to start of track", () => {
    expect(overviewSeekTime(0, 4800)).toBe(0);
  });

  it("frac=1 seeks to end of track", () => {
    expect(overviewSeekTime(1, 4800)).toBe(4800);
  });

  it("frac=0.5 seeks to exact midpoint", () => {
    expect(overviewSeekTime(0.5, 4800)).toBe(2400);
  });

  it("is linear across the strip", () => {
    const dur = 300;
    expect(overviewSeekTime(0.25, dur)).toBe(75);
    expect(overviewSeekTime(0.75, dur)).toBe(225);
  });
});

// ── power curve ───────────────────────────────────────────────────────────────

describe("powerCurveHeight — waveform bar height with 2.5 exponent", () => {
  const HALF_H = 78; // half of 156px canvas height

  it("peak=1.0 fills nearly full half height", () => {
    const h = powerCurveHeight(1.0, HALF_H);
    expect(h).toBeCloseTo(HALF_H * 0.96, 1);
  });

  it("peak=0.0 collapses to minimum 1px", () => {
    expect(powerCurveHeight(0.0, HALF_H)).toBe(1);
  });

  it("is spikier than a linear curve — quiet peaks are much smaller", () => {
    const quietPeak = 0.3;
    const linear    = quietPeak * HALF_H * 0.96;
    const spiky     = powerCurveHeight(quietPeak, HALF_H); // Math.pow(0.3, 2.5)
    expect(spiky).toBeLessThan(linear * 0.3); // dramatic compression of quiet content
  });

  it("loud transient (peak=0.9) is still tall — doesn't over-compress loud peaks", () => {
    const h = powerCurveHeight(0.9, HALF_H);
    expect(h).toBeGreaterThan(HALF_H * 0.5); // still more than half height
  });

  it("old exponent 0.65 would have made quiet peak much taller (block effect)", () => {
    const quietPeak = 0.3;
    const old = Math.max(1, Math.pow(quietPeak, 0.65) * HALF_H * 0.96);
    const now = powerCurveHeight(quietPeak, HALF_H);
    // The old curve inflated quiet signals — now is dramatically lower
    expect(now).toBeLessThan(old * 0.25);
  });
});
