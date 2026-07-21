// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

vi.mock("../DirectLinePanel.jsx", () => ({
  default: () => null,
}));

import ContextStrip from "../ContextStrip";

function renderStrip(props = {}) {
  return render(React.createElement(ContextStrip, props));
}

afterEach(() => {
  cleanup();
});

describe("COMMS LCD — idle / searching", () => {
  it("shows the COMMS label and a search input when there is no status", () => {
    renderStrip();
    expect(screen.getByText("COMMS")).toBeTruthy();
    expect(screen.getByPlaceholderText("SEARCH VAULT")).toBeTruthy();
  });

  it("calls onSearchChange as the user types", () => {
    const onSearchChange = vi.fn();
    renderStrip({ onSearchChange });
    fireEvent.change(screen.getByPlaceholderText("SEARCH VAULT"), {
      target: { value: "eightysixty" },
    });
    expect(onSearchChange).toHaveBeenCalledWith("eightysixty");
  });

  it("shows a match count next to the query when searching", () => {
    renderStrip({ libSearch: "eighty", matchCount: 3 });
    expect(screen.getByText("3 MATCHES")).toBeTruthy();
  });

  it("uses singular MATCH for exactly one result", () => {
    renderStrip({ libSearch: "eighty", matchCount: 1 });
    expect(screen.getByText("1 MATCH")).toBeTruthy();
  });

  it("does not show a match count with an empty query", () => {
    renderStrip({ libSearch: "", matchCount: null });
    expect(screen.queryByText(/MATCH/)).toBeNull();
  });

  it("clear button resets the search", () => {
    const onSearchChange = vi.fn();
    renderStrip({ libSearch: "eighty", onSearchChange });
    fireEvent.click(screen.getByLabelText("Clear search"));
    expect(onSearchChange).toHaveBeenCalledWith("");
  });
});

describe("COMMS LCD — system status overlay", () => {
  it("shows the status message instead of the search input when systemStatus is set", () => {
    renderStrip({
      libSearch: "eighty",
      systemStatus: { message: "2 tracks moved → ORIGINAL MUSIC.", kind: "success" },
    });
    expect(screen.getByText("2 tracks moved → ORIGINAL MUSIC.")).toBeTruthy();
    expect(screen.queryByPlaceholderText("SEARCH VAULT")).toBeNull();
  });

  it("applies the error status class for kind: error", () => {
    const { container } = renderStrip({
      systemStatus: { message: "Move failed — HTTP 500", kind: "error" },
    });
    expect(container.querySelector(".arch-comms-lcd.status-error")).toBeTruthy();
  });

  it("applies the success status class for kind: success", () => {
    const { container } = renderStrip({
      systemStatus: { message: "Saved.", kind: "success" },
    });
    expect(container.querySelector(".arch-comms-lcd.status-success")).toBeTruthy();
  });

  it("reverts to showing search (with the same query preserved) once systemStatus clears", () => {
    const { rerender } = renderStrip({
      libSearch: "eighty",
      systemStatus: { message: "Saved.", kind: "success" },
    });
    expect(screen.queryByPlaceholderText("SEARCH VAULT")).toBeNull();

    rerender(
      React.createElement(ContextStrip, { libSearch: "eighty", systemStatus: null }),
    );

    const input = screen.getByPlaceholderText("SEARCH VAULT");
    expect(input.value).toBe("eighty");
  });
});

describe("REACH LCD (regression check — unrelated sibling, should be unaffected)", () => {
  it("still renders the idle REACH window alongside COMMS", () => {
    renderStrip({ reachMessages: [] });
    expect(screen.getByText("REACH")).toBeTruthy();
    expect(screen.getByText("——")).toBeTruthy();
  });
});
