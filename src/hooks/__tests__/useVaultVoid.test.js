// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useVaultVoid } from "../useVaultVoid";

beforeEach(() => {
  Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 1000 });
  Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: 800 });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useVaultVoid — initial state", () => {
  it("starts with no void active and nothing armed", () => {
    const { result } = renderHook(() => useVaultVoid({ onVoid: vi.fn() }));
    expect(result.current.voidProps.active).toBe(false);
    expect(result.current.isVoidArmed).toBe(false);
    expect(result.current.armedVoidLabel).toBe("SELECTED FILE");
  });
});

describe("arming and canceling", () => {
  it("handleShelfVoid arms a void with the item's label", () => {
    const { result } = renderHook(() => useVaultVoid({ onVoid: vi.fn() }));
    act(() => {
      result.current.handleShelfVoid({ label: "Drift Mix" }, { x: 10, y: 20 });
    });
    expect(result.current.isVoidArmed).toBe(true);
    expect(result.current.armedVoidLabel).toBe("Drift Mix");
  });

  it("handleVoidButton arms a void with no source position", () => {
    const { result } = renderHook(() => useVaultVoid({ onVoid: vi.fn() }));
    act(() => {
      result.current.handleVoidButton({ label: "Live Set" });
    });
    expect(result.current.isVoidArmed).toBe(true);
    expect(result.current.armedVoidLabel).toBe("Live Set");
  });

  it("falls back to 'SELECTED FILE' when the armed item has no label", () => {
    const { result } = renderHook(() => useVaultVoid({ onVoid: vi.fn() }));
    act(() => {
      result.current.handleVoidButton({ id: "x" });
    });
    expect(result.current.armedVoidLabel).toBe("SELECTED FILE");
  });

  it("cancelArmedVoid clears the armed state without starting the animation", () => {
    const { result } = renderHook(() => useVaultVoid({ onVoid: vi.fn() }));
    act(() => {
      result.current.handleVoidButton({ label: "X" });
    });
    expect(result.current.isVoidArmed).toBe(true);

    act(() => {
      result.current.cancelArmedVoid();
    });
    expect(result.current.isVoidArmed).toBe(false);
    expect(result.current.voidProps.active).toBe(false);
  });
});

describe("confirming an armed void", () => {
  it("is a no-op when nothing is armed", () => {
    const { result } = renderHook(() => useVaultVoid({ onVoid: vi.fn() }));
    act(() => {
      result.current.confirmArmedVoid();
    });
    expect(result.current.voidProps.active).toBe(false);
  });

  it("starts the void animation with the provided source position and a target centered near the top", () => {
    const { result } = renderHook(() => useVaultVoid({ onVoid: vi.fn() }));
    act(() => {
      result.current.handleShelfVoid({ label: "X" }, { x: 10, y: 20 });
    });
    act(() => {
      result.current.confirmArmedVoid();
    });

    expect(result.current.voidProps.active).toBe(true);
    expect(result.current.voidProps.source).toEqual({ x: 10, y: 20 });
    expect(result.current.voidProps.target.x).toBe(500); // 1000 * 0.5
    expect(result.current.voidProps.target.y).toBeCloseTo(224, 5); // 800 * 0.28
    expect(result.current.isVoidArmed).toBe(false);
  });

  it("falls back to the window center as source when no source position was given", () => {
    const { result } = renderHook(() => useVaultVoid({ onVoid: vi.fn() }));
    act(() => {
      result.current.handleVoidButton({ label: "X" });
    });
    act(() => {
      result.current.confirmArmedVoid();
    });

    expect(result.current.voidProps.source).toEqual({ x: 500, y: 400 }); // 1000/2, 800/2
  });

  it("passes the voidColor through onto voidProps", () => {
    const { result } = renderHook(() => useVaultVoid({ onVoid: vi.fn(), voidColor: "#8B0000" }));
    expect(result.current.voidProps.color).toBe("#8B0000");
  });
});

describe("completing the void animation", () => {
  it("is a no-op (besides clearing active) when there is no pending void", () => {
    const onVoid = vi.fn();
    const { result } = renderHook(() => useVaultVoid({ onVoid }));
    act(() => {
      result.current.voidProps.onComplete();
    });
    expect(onVoid).not.toHaveBeenCalled();
    expect(result.current.voidProps.active).toBe(false);
  });

  it("calls onVoid with the pending item and triggers the inverse bloom flash", () => {
    vi.useFakeTimers();
    const onVoid = vi.fn();
    const { result } = renderHook(() => useVaultVoid({ onVoid }));

    act(() => {
      result.current.handleShelfVoid({ label: "Drift Mix", id: 1 });
    });
    act(() => {
      result.current.confirmArmedVoid();
    });
    act(() => {
      result.current.voidProps.onComplete();
    });

    expect(onVoid).toHaveBeenCalledWith({ label: "Drift Mix", id: 1 });
    expect(result.current.voidProps.active).toBe(false);
    expect(result.current.inverseBloom).toBe(true);

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.inverseBloom).toBe(false);
  });
});
