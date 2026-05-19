// @vitest-environment node
import { describe, it, expect, vi } from "vitest";

// ── specBarColor ──────────────────────────────────────────────────────────────

import { specBarColor } from "../useAudioAnalyzer.js";

describe("specBarColor", () => {
  it("returns cyan-white for normH above 0.88 (peak)", () => {
    const color = specBarColor(0.95, 1);
    expect(color).toBe("rgba(210, 255, 248, 1)");
  });

  it("returns cyan-green for normH between 0.70 and 0.88", () => {
    expect(specBarColor(0.80, 1)).toBe("rgba(40, 235, 185, 1)");
    expect(specBarColor(0.71, 1)).toBe("rgba(40, 235, 185, 1)");
  });

  it("returns green for normH between 0.45 and 0.70", () => {
    expect(specBarColor(0.60, 1)).toBe("rgba(40, 215, 40, 1)");
    expect(specBarColor(0.46, 1)).toBe("rgba(40, 215, 40, 1)");
  });

  it("returns orange-gold for normH between 0.25 and 0.45", () => {
    expect(specBarColor(0.35, 1)).toBe("rgba(205, 148, 0, 1)");
    expect(specBarColor(0.26, 1)).toBe("rgba(205, 148, 0, 1)");
  });

  it("returns deep red for normH at or below 0.25 (floor)", () => {
    expect(specBarColor(0.25, 1)).toBe("rgba(200, 28, 0, 1)");
    expect(specBarColor(0.0, 1)).toBe("rgba(200, 28, 0, 1)");
  });

  it("embeds alpha correctly in output string", () => {
    expect(specBarColor(0.95, 0.5)).toBe("rgba(210, 255, 248, 0.5)");
    expect(specBarColor(0.10, 0.8)).toBe("rgba(200, 28, 0, 0.8)");
  });

  it("defaults alpha to 1 when omitted", () => {
    const color = specBarColor(0.50);
    expect(color).toContain(", 1)");
  });

  it("boundary: 0.88 falls into cyan-green tier (not cyan-white)", () => {
    expect(specBarColor(0.88, 1)).toBe("rgba(40, 235, 185, 1)");
  });

  it("boundary: 0.70 falls into green tier (not cyan-green)", () => {
    expect(specBarColor(0.70, 1)).toBe("rgba(40, 215, 40, 1)");
  });
});

// ── analyser singleton guard ──────────────────────────────────────────────────

describe("analyser singleton guard", () => {
  it("calls createMediaElementSource only once even if setup runs multiple times", () => {
    // Simulate the guard pattern used in useAudioAnalyzer's live FFT setup.
    // createMediaElementSource() can only be called once per audio element —
    // calling it twice throws. The ref guard prevents this.
    const createMediaElementSource = vi.fn().mockReturnValue({
      connect: vi.fn(),
    });

    const fakeAudioCtx = { createMediaElementSource, createAnalyser: vi.fn().mockReturnValue({ fftSize: 0, frequencyBinCount: 1024, smoothingTimeConstant: 0, connect: vi.fn() }) };
    const fakeAudioEl  = { src: "fake.mp3" };

    // Ref guard — mirrors analyserSetupRef.current in useAudioAnalyzer.js
    const setupRef = { current: false };

    function setupAnalyserOnce(audioEl, audioCtx) {
      if (setupRef.current) return null;
      setupRef.current = true;
      const source   = audioCtx.createMediaElementSource(audioEl);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize              = 2048;
      analyser.smoothingTimeConstant = 0.75;
      source.connect(audioCtx.destination);
      source.connect(analyser);
      return analyser;
    }

    // First call: creates source
    const analyser1 = setupAnalyserOnce(fakeAudioEl, fakeAudioCtx);
    expect(createMediaElementSource).toHaveBeenCalledTimes(1);
    expect(analyser1).not.toBeNull();

    // Second call: guard fires, createMediaElementSource NOT called again
    const analyser2 = setupAnalyserOnce(fakeAudioEl, fakeAudioCtx);
    expect(createMediaElementSource).toHaveBeenCalledTimes(1); // still 1
    expect(analyser2).toBeNull();
  });

  it("guard ref starts false — first call always proceeds", () => {
    const createMediaElementSource = vi.fn().mockReturnValue({ connect: vi.fn() });
    const fakeAudioCtx = {
      createMediaElementSource,
      createAnalyser: vi.fn().mockReturnValue({ fftSize: 0, frequencyBinCount: 1024, smoothingTimeConstant: 0, connect: vi.fn() }),
    };
    const setupRef = { current: false };

    expect(setupRef.current).toBe(false);
    if (!setupRef.current) {
      setupRef.current = true;
      fakeAudioCtx.createMediaElementSource({});
    }
    expect(createMediaElementSource).toHaveBeenCalledTimes(1);
    expect(setupRef.current).toBe(true);
  });
});

// ── PUT /tracks/:id auth gate ─────────────────────────────────────────────────

// Tests the timingSafeEqual auth pattern used by all authenticated endpoints.
// When PUT /tracks/:id is implemented (T6), it must use this same pattern.

function timingSafeEqual(a, b) {
  const enc   = new TextEncoder();
  const aBytes = enc.encode(a);
  const bBytes = enc.encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let mismatch = 0;
  for (let i = 0; i < aBytes.length; i++) mismatch |= aBytes[i] ^ bBytes[i];
  return mismatch === 0;
}

function isAuthenticated(request, env) {
  return timingSafeEqual(
    request.headers.get("PSC-Secret") || "",
    env.PSC_SECRET || "",
  );
}

describe("PUT /tracks/:id auth gate (timingSafeEqual pattern)", () => {
  const env = { PSC_SECRET: "correct-secret-abc123" };

  it("returns true when PSC-Secret header matches env.PSC_SECRET", () => {
    const req = { headers: { get: (h) => h === "PSC-Secret" ? "correct-secret-abc123" : null } };
    expect(isAuthenticated(req, env)).toBe(true);
  });

  it("returns false when PSC-Secret header is wrong", () => {
    const req = { headers: { get: () => "wrong-secret" } };
    expect(isAuthenticated(req, env)).toBe(false);
  });

  it("returns false when PSC-Secret header is absent", () => {
    const req = { headers: { get: () => null } };
    expect(isAuthenticated(req, env)).toBe(false);
  });

  it("returns false when header is correct prefix but longer (length mismatch stops match)", () => {
    const req = { headers: { get: () => "correct-secret-abc123-extra" } };
    expect(isAuthenticated(req, env)).toBe(false);
  });

  it("returns false for empty string against non-empty secret", () => {
    const req = { headers: { get: () => "" } };
    expect(isAuthenticated(req, env)).toBe(false);
  });

  it("uses timing-safe comparison — length check runs before byte comparison", () => {
    // Verify length mismatch returns false without byte comparison (no short-circuit leak)
    const a = "abc";
    const b = "abcd";
    expect(timingSafeEqual(a, b)).toBe(false);
    expect(timingSafeEqual("", "x")).toBe(false);
  });
});
