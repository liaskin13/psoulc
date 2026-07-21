// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

// ─── Module mocks (hoisted before imports) ───────────────────────────────────

vi.mock("../../config", () => ({
  VAULT_DISPLAY_NAMES: {
    saturn: "ORIGINAL MUSIC",
    venus: "MIXES",
    mercury: "LIVE SETS",
    earth: "EARTH",
  },
  VAULT_IDS: ["saturn", "venus", "mercury", "earth"],
  UPLOAD_WORKER_URL: "https://psc-worker.example.com",
}));

vi.mock("../../state/SystemContext", () => ({
  useSystem: () => ({ consoleOwner: "D" }),
}));

import UploadModal from "../UploadModal";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeFile(name = "track.mp3", type = "audio/mpeg") {
  return new File([new Uint8Array(16).fill(1)], name, { type });
}

function makeQueueItem(overrides = {}) {
  return {
    id: "batch-0",
    file: makeFile(overrides.name ?? "track.mp3"),
    status: "pending",
    progress: 0,
    error: null,
    metadata: { title: "TRACK", artist: null, bpm: 120 },
    ...overrides,
  };
}

function renderModal(props = {}) {
  const defaults = {
    onClose: vi.fn(),
    vault: "saturn",
    setVault: vi.fn(),
    queue: [],
    addFiles: vi.fn(),
    retry: vi.fn(),
    dismiss: vi.fn(),
    duplicateCount: 0,
    isDraggingOver: false,
    onDragEnter: vi.fn(),
    onDragOver: vi.fn(),
    onDragLeave: vi.fn(),
    onDrop: vi.fn(),
  };
  const merged = { ...defaults, ...props };
  const utils = render(React.createElement(UploadModal, merged));
  return { ...utils, props: merged };
}

function getFileInput(container) {
  return container.querySelector('input[type="file"]');
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("vault selection", () => {
  it("renders every vault as an option and reflects the current vault prop", () => {
    renderModal({ vault: "mercury" });
    const select = screen.getByDisplayValue("LIVE SETS");
    expect(select).toBeTruthy();
  });

  it("calls setVault when the destination is changed", () => {
    const { props } = renderModal();
    const select = document.querySelector("select.tune-label-input");
    fireEvent.change(select, { target: { value: "venus" } });
    expect(props.setVault).toHaveBeenCalledWith("venus");
  });
});

describe("multi-file input", () => {
  it("renders a multi-select file input", () => {
    const { container } = renderModal();
    const input = getFileInput(container);
    expect(input.multiple).toBe(true);
    expect(input.accept).toBe("audio/*");
  });

  it("calls addFiles with the full FileList on select — the literal bug being fixed", () => {
    const { container, props } = renderModal();
    const input = getFileInput(container);
    const files = [makeFile("a.mp3"), makeFile("b.mp3"), makeFile("c.mp3")];

    fireEvent.change(input, { target: { files } });

    expect(props.addFiles).toHaveBeenCalledTimes(1);
    const passedFiles = Array.from(props.addFiles.mock.calls[0][0]);
    expect(passedFiles).toHaveLength(3);
  });

  it("wires drag handlers from props onto the dropzone", () => {
    const { props } = renderModal();
    const dropzone = screen.getByText(/DROP AUDIO FILES/).closest(".upload-dropzone");

    fireEvent.dragEnter(dropzone);
    fireEvent.dragOver(dropzone);
    fireEvent.drop(dropzone, { dataTransfer: { files: [] } });

    expect(props.onDragEnter).toHaveBeenCalled();
    expect(props.onDragOver).toHaveBeenCalled();
    expect(props.onDrop).toHaveBeenCalled();
  });
});

describe("duplicate notice", () => {
  it("shows nothing when duplicateCount is 0", () => {
    renderModal({ duplicateCount: 0 });
    expect(screen.queryByText(/DUPLICATE/)).toBeNull();
  });

  it("shows a singular notice for 1 duplicate", () => {
    renderModal({ duplicateCount: 1 });
    expect(screen.getByText(/1 DUPLICATE SKIPPED/)).toBeTruthy();
  });

  it("shows a plural notice for multiple duplicates", () => {
    renderModal({ duplicateCount: 3 });
    expect(screen.getByText(/3 DUPLICATES SKIPPED/)).toBeTruthy();
  });
});

describe("batch queue rendering", () => {
  it("shows every queued file", () => {
    renderModal({
      queue: [
        makeQueueItem({ id: "b1", name: "one.mp3" }),
        makeQueueItem({ id: "b2", name: "two.mp3" }),
      ],
    });

    expect(screen.getByText("one.mp3")).toBeTruthy();
    expect(screen.getByText("two.mp3")).toBeTruthy();
  });

  it("wires retry and dismiss through to the queue item's id", () => {
    const { props } = renderModal({
      queue: [
        makeQueueItem({ id: "err-1", name: "failed.mp3", status: "error", error: "WORKER 500" }),
      ],
    });

    fireEvent.click(screen.getByText("RETRY"));
    expect(props.retry).toHaveBeenCalledWith("err-1");

    fireEvent.click(screen.getByText("×"));
    expect(props.dismiss).toHaveBeenCalledWith("err-1");
  });
});

describe("close behavior", () => {
  it("closing no longer blocks on an uploading state — clicking CLOSE always closes", () => {
    const { props } = renderModal({
      queue: [makeQueueItem({ status: "uploading" })],
    });
    fireEvent.click(screen.getByText("CLOSE"));
    expect(props.onClose).toHaveBeenCalled();
  });

  it("clicking the overlay background closes the modal", () => {
    const { props } = renderModal();
    fireEvent.click(document.querySelector(".tune-modal-overlay"));
    expect(props.onClose).toHaveBeenCalled();
  });
});
