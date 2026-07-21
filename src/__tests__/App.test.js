// @vitest-environment jsdom
//
// Scope note: this file intentionally does NOT attempt full App.jsx coverage
// (entry/room/architect/console stage routing, mobile guard, etc.) — that's a
// much larger surface than this bug fix touches. It exists for one reason:
// regression-proof the identity-change queue reset added while fixing the
// INTAKE batch-upload bug. Without it, App.jsx (which never unmounts across
// a power-down/re-login cycle) would leak one owner's upload queue into the
// next owner's console.
//
// The reset lives inside handleIgnite itself (synchronous, same handler that
// flips consoleOwner) rather than in a useEffect keyed on consoleOwner — a
// dependency-array effect runs after commit/paint, which left a real
// (if sub-frame) window for React to paint the new owner's console with the
// previous owner's stale queue still in it. Flagged by /security-review,
// fixed by moving the reset into the handler so there's no separate render
// for a stale frame to exist in. These tests exercise both paths that call
// handleIgnite: a fresh login via EntrySequence's onIgnite, and auto-login
// from a persisted session on mount.
import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";
import { SESSION_KEY } from "../config";

// ─── Module mocks (hoisted before imports) ───────────────────────────────────

let mockSystemState = {
  consoleOwner: null,
  sessionMeta: null,
  setConsoleOwner: vi.fn(),
  setSessionMeta: vi.fn(),
};
vi.mock("../state/SystemContext", () => ({
  useSystem: () => mockSystemState,
}));

vi.mock("../hooks/useNetworkStatus", () => ({
  useNetworkStatus: () => true,
}));

vi.mock("../hooks/useBreakpoint", () => ({
  useBreakpoint: () => ({ isMobile: false }),
}));

const mockReset = vi.fn();
vi.mock("../hooks/useDragDropBatch", () => ({
  useDragDropBatch: () => ({
    queue: [],
    addFiles: vi.fn(),
    retry: vi.fn(),
    dismiss: vi.fn(),
    reset: mockReset,
    duplicateCount: 0,
    isDraggingOver: false,
    onDragEnter: vi.fn(),
    onDragOver: vi.fn(),
    onDragLeave: vi.fn(),
    onDrop: vi.fn(),
  }),
}));

// Stands in for the real EntrySequence with a single button that fires
// onIgnite exactly the way a real login does, so handleIgnite runs for real.
vi.mock("../entry/EntrySequence", () => ({
  default: ({ onIgnite }) =>
    React.createElement(
      "button",
      { onClick: () => onIgnite("D", "A") },
      "MOCK IGNITE",
    ),
}));

vi.mock("../components/CommandPalette", () => ({
  default: () => null,
}));

import App from "../App";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
  mockSystemState = {
    consoleOwner: null,
    sessionMeta: null,
    setConsoleOwner: vi.fn(),
    setSessionMeta: vi.fn(),
  };
});

describe("batch-upload queue identity reset", () => {
  it("resets the batch queue synchronously as part of a fresh login (handleIgnite)", () => {
    render(React.createElement(App));
    expect(mockReset).not.toHaveBeenCalled();

    fireEvent.click(document.querySelector("button"));

    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it("resets the batch queue on auto-login from a persisted session on mount", () => {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ owner: "D", tier: "A", expires: Date.now() + 60_000 }),
    );

    render(React.createElement(App));

    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it("does not reset on unrelated re-renders that don't call handleIgnite", () => {
    const { rerender } = render(React.createElement(App));
    expect(mockReset).not.toHaveBeenCalled();

    rerender(React.createElement(App));

    expect(mockReset).not.toHaveBeenCalled();
  });
});
