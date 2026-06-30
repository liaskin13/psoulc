// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// isTouchPrimary/hasHover are computed ONCE at module import time from
// window.matchMedia(...).matches. To exercise both true/false outcomes we
// must reset the module registry and re-import with a fresh matchMedia
// mock for each scenario — a plain vi.fn() swap after import wouldn't
// re-run the top-level const initializers.

function stubMatchMedia({ coarse = false, hover = true } = {}) {
  window.matchMedia = vi.fn((query) => ({
    matches: query.includes("coarse") ? coarse : query.includes("hover") ? hover : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("isTouchPrimary / hasHover (module-load-time evaluation)", () => {
  it("reflects a touch-primary, no-hover device (coarse pointer)", async () => {
    stubMatchMedia({ coarse: true, hover: false });
    const { isTouchPrimary, hasHover } = await import("../device");
    expect(isTouchPrimary).toBe(true);
    expect(hasHover).toBe(false);
  });

  it("reflects a mouse-primary, hover-capable device (fine pointer)", async () => {
    stubMatchMedia({ coarse: false, hover: true });
    vi.resetModules();
    const { isTouchPrimary, hasHover } = await import("../device");
    expect(isTouchPrimary).toBe(false);
    expect(hasHover).toBe(true);
  });
});

describe("isLowEnd", () => {
  beforeEach(() => {
    stubMatchMedia();
  });

  function setHardware({ cores, ram } = {}) {
    Object.defineProperty(navigator, "hardwareConcurrency", {
      value: cores,
      configurable: true,
    });
    Object.defineProperty(navigator, "deviceMemory", { value: ram, configurable: true });
  }

  it("is true when core count is at or below 4", async () => {
    setHardware({ cores: 4, ram: 8 });
    const { isLowEnd } = await import("../device");
    expect(isLowEnd()).toBe(true);
  });

  it("is true when device memory is at or below 2GB", async () => {
    setHardware({ cores: 8, ram: 2 });
    const { isLowEnd } = await import("../device");
    expect(isLowEnd()).toBe(true);
  });

  it("is false for a capable device (>4 cores and >2GB ram)", async () => {
    setHardware({ cores: 8, ram: 8 });
    const { isLowEnd } = await import("../device");
    expect(isLowEnd()).toBe(false);
  });

  it("defaults missing hardwareConcurrency/deviceMemory to 4 — treated as low-end", async () => {
    setHardware({ cores: undefined, ram: undefined });
    const { isLowEnd } = await import("../device");
    expect(isLowEnd()).toBe(true); // default cores=4 triggers the <=4 branch
  });
});

describe("clampedDPR", () => {
  beforeEach(() => {
    stubMatchMedia();
  });

  function setDPR(value) {
    Object.defineProperty(window, "devicePixelRatio", { value, configurable: true });
  }

  it("passes through a DPR below the cap", async () => {
    setDPR(1.5);
    const { clampedDPR } = await import("../device");
    expect(clampedDPR()).toBe(1.5);
  });

  it("caps a high DPR at 2", async () => {
    setDPR(3);
    const { clampedDPR } = await import("../device");
    expect(clampedDPR()).toBe(2);
  });

  it("defaults to 1 when devicePixelRatio is falsy (0 or undefined)", async () => {
    setDPR(0);
    const { clampedDPR } = await import("../device");
    expect(clampedDPR()).toBe(1);
  });
});
