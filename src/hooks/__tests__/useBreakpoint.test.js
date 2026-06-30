// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBreakpoint } from "../useBreakpoint";

function setWidth(width) {
  Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: width });
}

function mockMatchMedia() {
  const listeners = new Set();
  const mql = {
    matches: false,
    addEventListener: (event, cb) => {
      if (event === "change") listeners.add(cb);
    },
    removeEventListener: (event, cb) => {
      if (event === "change") listeners.delete(cb);
    },
    dispatchChange: () => listeners.forEach((cb) => cb()),
  };
  window.matchMedia = vi.fn(() => mql);
  return mql;
}

beforeEach(() => {
  mockMatchMedia();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useBreakpoint — initial classification", () => {
  it("classifies a width below 480 as xs / isMobile", () => {
    setWidth(375);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current.bp).toBe("xs");
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
  });

  it("classifies a width of 480-767 as sm / isMobile", () => {
    setWidth(600);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current.bp).toBe("sm");
    expect(result.current.isMobile).toBe(true);
  });

  it("classifies a width of 768-1023 as md / isTablet", () => {
    setWidth(900);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current.bp).toBe("md");
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isMobile).toBe(false);
  });

  it("classifies a width of 1024-1439 as lg / isDesktop", () => {
    setWidth(1200);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current.bp).toBe("lg");
    expect(result.current.isDesktop).toBe(true);
  });

  it("classifies a width of 1440+ as xl / isDesktop", () => {
    setWidth(1920);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current.bp).toBe("xl");
    expect(result.current.isDesktop).toBe(true);
  });

  it("treats the exact md boundary (1024) as lg, not md", () => {
    setWidth(1024);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current.bp).toBe("lg");
  });
});

describe("useBreakpoint — responds to matchMedia change events", () => {
  it("re-evaluates window.innerWidth when the media query change event fires", () => {
    setWidth(1920);
    const mql = mockMatchMedia();
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current.bp).toBe("xl");

    setWidth(375);
    act(() => {
      mql.dispatchChange();
    });
    expect(result.current.bp).toBe("xs");
    expect(result.current.isMobile).toBe(true);
  });

  it("removes its change listener on unmount", () => {
    const mql = mockMatchMedia();
    const removeSpy = vi.spyOn(mql, "removeEventListener");
    const { unmount } = renderHook(() => useBreakpoint());

    unmount();
    expect(removeSpy).toHaveBeenCalledWith("change", expect.any(Function));
  });
});
