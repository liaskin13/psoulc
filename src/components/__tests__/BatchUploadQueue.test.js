// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { BatchUploadQueue } from "../BatchUploadQueue";

function makeItem(overrides = {}) {
  return {
    id: "batch-0",
    file: new File([new Uint8Array(1024)], "track.mp3", { type: "audio/mpeg" }),
    status: "pending",
    progress: 0,
    error: null,
    ...overrides,
  };
}

function renderQueue(props) {
  return render(React.createElement(BatchUploadQueue, props));
}

afterEach(() => {
  cleanup();
});

describe("BatchUploadQueue", () => {
  it("renders nothing when the queue is empty", () => {
    const { container } = renderQueue({ queue: [], onRetry: vi.fn(), onDismiss: vi.fn() });
    expect(container.firstChild).toBeNull();
  });

  it("shows the completed-of-total count in the header", () => {
    renderQueue({
      queue: [
        makeItem({ id: "a", status: "done" }),
        makeItem({ id: "b", status: "uploading" }),
        makeItem({ id: "c", status: "pending" }),
      ],
      onRetry: vi.fn(),
      onDismiss: vi.fn(),
    });
    expect(screen.getByText("1 of 3")).toBeTruthy();
  });

  it("renders filename and status chip text per item", () => {
    renderQueue({
      queue: [makeItem({ id: "a", status: "uploading" })],
      onRetry: vi.fn(),
      onDismiss: vi.fn(),
    });
    expect(screen.getByText("track.mp3")).toBeTruthy();
    expect(screen.getByText("UPLOADING")).toBeTruthy();
  });

  it("only shows a RETRY button for items with status error", () => {
    renderQueue({
      queue: [
        makeItem({ id: "a", status: "error", error: "WORKER 500" }),
        makeItem({ id: "b", status: "done" }),
      ],
      onRetry: vi.fn(),
      onDismiss: vi.fn(),
    });
    expect(screen.getAllByText("RETRY")).toHaveLength(1);
  });

  it("calls onRetry and onDismiss with the item id", () => {
    const onRetry = vi.fn();
    const onDismiss = vi.fn();
    renderQueue({
      queue: [makeItem({ id: "err-item", status: "error", error: "x" })],
      onRetry,
      onDismiss,
    });

    fireEvent.click(screen.getByText("RETRY"));
    expect(onRetry).toHaveBeenCalledWith("err-item");

    fireEvent.click(screen.getByText("×"));
    expect(onDismiss).toHaveBeenCalledWith("err-item");
  });

  it("collapses and expands the item list on header click", () => {
    renderQueue({
      queue: [makeItem({ id: "a" })],
      onRetry: vi.fn(),
      onDismiss: vi.fn(),
    });

    expect(screen.getByText("track.mp3")).toBeTruthy();
    fireEvent.click(screen.getByText("UPLOAD QUEUE"));
    expect(screen.queryByText("track.mp3")).toBeNull();
    fireEvent.click(screen.getByText("UPLOAD QUEUE"));
    expect(screen.getByText("track.mp3")).toBeTruthy();
  });
});
