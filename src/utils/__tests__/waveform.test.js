import { describe, it, expect } from "vitest";
import { getWaveformBars, waveformPath } from "../waveform";

describe("getWaveformBars", () => {
  it("is deterministic for the same seed and count", () => {
    expect(getWaveformBars("track-1", 18)).toEqual(getWaveformBars("track-1", 18));
  });

  it("produces a different sequence for a different seed", () => {
    expect(getWaveformBars("track-1")).not.toEqual(getWaveformBars("track-2"));
  });

  it("defaults to 18 bars when count is omitted", () => {
    expect(getWaveformBars("track-1")).toHaveLength(18);
  });

  it("honors a custom count", () => {
    expect(getWaveformBars("track-1", 5)).toHaveLength(5);
    expect(getWaveformBars("track-1", 40)).toHaveLength(40);
  });

  it("every bar value falls within the 18-90 range", () => {
    const bars = getWaveformBars("track-1", 100);
    for (const bar of bars) {
      expect(bar).toBeGreaterThanOrEqual(18);
      expect(bar).toBeLessThanOrEqual(90);
    }
  });

  it("accepts a numeric seed (coerced to string internally)", () => {
    expect(() => getWaveformBars(42)).not.toThrow();
    expect(getWaveformBars(42)).toEqual(getWaveformBars("42"));
  });

  it("returns an empty array for count 0", () => {
    expect(getWaveformBars("track-1", 0)).toEqual([]);
  });
});

describe("waveformPath", () => {
  it("returns a fixed height of 24 regardless of count", () => {
    expect(waveformPath("x", 18).H).toBe(24);
    expect(waveformPath("x", 5).H).toBe(24);
  });

  it("computes width from count using the bar width + gap formula", () => {
    // W = count * (barW + gap) - gap, with barW=3, gap=2 → count*5 - 2
    expect(waveformPath("x", 18).W).toBe(18 * 5 - 2);
    expect(waveformPath("x", 5).W).toBe(5 * 5 - 2);
  });

  it("emits exactly `count` <rect> elements", () => {
    const { rects } = waveformPath("x", 7);
    expect(rects.match(/<rect/g)).toHaveLength(7);
  });

  it("every rect height stays within the 18-90% of H bounds", () => {
    const { rects, H } = waveformPath("x", 30);
    const heights = [...rects.matchAll(/height="([\d.]+)"/g)].map((m) => Number(m[1]));
    for (const h of heights) {
      expect(h).toBeGreaterThanOrEqual((18 / 100) * H - 0.1);
      expect(h).toBeLessThanOrEqual((90 / 100) * H + 0.1);
    }
  });

  it("defaults to 18 bars when count is omitted", () => {
    const { rects } = waveformPath("x");
    expect(rects.match(/<rect/g)).toHaveLength(18);
  });
});
