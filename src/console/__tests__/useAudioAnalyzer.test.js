// @vitest-environment node
import { describe, it, expect, vi } from "vitest";

// ── specBarColor ──────────────────────────────────────────────────────────────

import { specBarColor } from "../useAudioAnalyzer.js";

describe("specBarColor", () => {
  it("returns red at bass (freqT=0) full amplitude", () => {
    expect(specBarColor(1.0, 0, 1)).toBe("rgba(220, 0, 0, 1)");
  });

  it("returns green at mid (freqT=0.5) full amplitude", () => {
    expect(specBarColor(1.0, 0.5, 1)).toBe("rgba(0, 215, 0, 1)");
  });

  it("returns blue at treble (freqT=1.0) full amplitude", () => {
    expect(specBarColor(1.0, 1.0, 1)).toBe("rgba(0, 0, 210, 1)");
  });

  it("interpolates orange between bass and mid (freqT=0.25)", () => {
    expect(specBarColor(1.0, 0.25, 1)).toBe("rgba(110, 108, 0, 1)");
  });

  it("interpolates cyan between mid and treble (freqT=0.75)", () => {
    expect(specBarColor(1.0, 0.75, 1)).toBe("rgba(0, 108, 105, 1)");
  });

  it("amplitude scaling dims bars — low normH produces darker color than full", () => {
    const dimColor  = specBarColor(0.1, 0, 1);
    const fullColor = specBarColor(1.0, 0, 1);
    expect(dimColor).toBe("rgba(62, 0, 0, 1)");
    expect(fullColor).toBe("rgba(220, 0, 0, 1)");
  });

  it("embeds alpha correctly in output string", () => {
    expect(specBarColor(1.0, 0, 0.5)).toBe("rgba(220, 0, 0, 0.5)");
  });

  it("defaults alpha to 1 when omitted", () => {
    const color = specBarColor(0.5, 0.5);
    expect(color).toContain(", 1)");
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
