// @vitest-environment jsdom
//
// Scope note: this file intentionally does NOT attempt full App.jsx coverage
// (entry/room/architect/console stage routing, mobile guard, etc.) — that's a
// much larger surface than this bug fix touches. It exists for one reason:
// regression-proof the identity-reset effect added while fixing the INTAKE
// batch-upload bug. Without this effect, App.jsx (which never unmounts across
// a power-down/re-login cycle) would leak one owner's upload queue into the
// next owner's console. See the eng-review plan for the full writeup.
import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

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
const mockSetQueueSpy = vi.fn();
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

vi.mock("../entry/EntrySequence", () => ({
  default: () => null,
}));

vi.mock("../components/CommandPalette", () => ({
  default: () => null,
}));

import App from "../App";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mockSystemState = {
    consoleOwner: null,
    sessionMeta: null,
    setConsoleOwner: vi.fn(),
    setSessionMeta: vi.fn(),
  };
});

describe("batch-upload queue identity reset", () => {
  it("wipes the batch queue when consoleOwner changes (login/logout/owner switch)", () => {
    mockSystemState = { ...mockSystemState, consoleOwner: "D" };
    const { rerender } = render(React.createElement(App));

    const callsAfterMount = mockReset.mock.calls.length;
    expect(callsAfterMount).toBeGreaterThanOrEqual(1); // fires on mount too — that's fine

    // Simulate D powering down and L logging in on the same device/session —
    // App.jsx never unmounts across this transition (confirmed by reading
    // handlePowerDown/handleIgnite directly during the eng review).
    mockSystemState = { ...mockSystemState, consoleOwner: "L" };
    rerender(React.createElement(App));

    expect(mockReset.mock.calls.length).toBeGreaterThan(callsAfterMount);
  });

  it("does not call reset again on a re-render where consoleOwner is unchanged", () => {
    mockSystemState = { ...mockSystemState, consoleOwner: "D" };
    const { rerender } = render(React.createElement(App));

    const callsAfterMount = mockReset.mock.calls.length;

    // Re-render with the exact same consoleOwner value — effect deps unchanged.
    rerender(React.createElement(App));

    expect(mockReset.mock.calls.length).toBe(callsAfterMount);
  });
});
