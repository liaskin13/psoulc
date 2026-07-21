// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// ─── Module mocks (hoisted before imports) ───────────────────────────────────

vi.mock("../../lib/tracks", () => ({
  uploadTrack: vi.fn(),
}));

vi.mock("../../lib/readId3Tags", () => ({
  readId3Tags: vi.fn(),
}));

const mockUseSystem = vi.fn();
vi.mock("../../state/SystemContext", () => ({
  useSystem: () => mockUseSystem(),
}));

import { useDragDropBatch } from "../useDragDropBatch";
import { uploadTrack } from "../../lib/tracks";
import { readId3Tags } from "../../lib/readId3Tags";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeFile(name = "track.mp3", type = "audio/mpeg") {
  return new File([new Uint8Array(16).fill(1)], name, { type });
}

function neverResolves() {
  return new Promise(() => {});
}

beforeEach(() => {
  mockUseSystem.mockReturnValue({ consoleOwner: "D" });
  readId3Tags.mockResolvedValue({ title: null, artist: null, bpm: null });
});

afterEach(() => {
  vi.clearAllMocks();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("addFiles", () => {
  it("filters out non-audio files", async () => {
    const { result } = renderHook(() => useDragDropBatch("venus"));

    await act(async () => {
      await result.current.addFiles([
        makeFile("track.mp3"),
        makeFile("notes.pdf", "application/pdf"),
      ]);
    });

    expect(result.current.queue).toHaveLength(1);
    expect(result.current.queue[0].file.name).toBe("track.mp3");
  });

  it("creates no queue entries when no files are audio", async () => {
    const { result } = renderHook(() => useDragDropBatch("venus"));

    await act(async () => {
      await result.current.addFiles([makeFile("notes.pdf", "application/pdf")]);
    });

    expect(result.current.queue).toHaveLength(0);
  });

  it("uses ID3 title/artist/bpm when available", async () => {
    readId3Tags.mockResolvedValue({ title: "drift", artist: "d", bpm: 124 });
    const { result } = renderHook(() => useDragDropBatch("venus"));

    await act(async () => {
      await result.current.addFiles([makeFile("anything.mp3")]);
    });

    expect(result.current.queue[0].metadata).toEqual({
      title: "DRIFT",
      artist: "D",
      bpm: 124,
    });
  });

  it("falls back to filename-derived title when ID3 read fails", async () => {
    readId3Tags.mockRejectedValue(new Error("no ID3 tags"));
    const { result } = renderHook(() => useDragDropBatch("venus"));

    await act(async () => {
      await result.current.addFiles([makeFile("my-track_name.mp3")]);
    });

    expect(result.current.queue[0].metadata.title).toBe("MY TRACK NAME");
    expect(result.current.queue[0].metadata.artist).toBeNull();
    expect(result.current.queue[0].metadata.bpm).toBe(120);
  });
});

describe("concurrency", () => {
  it("runs at most 2 uploads simultaneously, holding the rest pending", async () => {
    uploadTrack.mockImplementation(neverResolves);
    const { result } = renderHook(() => useDragDropBatch("venus"));

    await act(async () => {
      await result.current.addFiles([
        makeFile("a.mp3"),
        makeFile("b.mp3"),
        makeFile("c.mp3"),
      ]);
    });

    await waitFor(() => {
      expect(
        result.current.queue.filter((i) => i.status === "uploading"),
      ).toHaveLength(2);
    });

    expect(
      result.current.queue.filter((i) => i.status === "pending"),
    ).toHaveLength(1);
    expect(uploadTrack).toHaveBeenCalledTimes(2);
  });

  it("starts the next pending item once a running upload finishes", async () => {
    let resolveFirst;
    uploadTrack
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockImplementationOnce(neverResolves)
      .mockImplementationOnce(neverResolves);

    const { result } = renderHook(() => useDragDropBatch("venus"));

    await act(async () => {
      await result.current.addFiles([
        makeFile("a.mp3"),
        makeFile("b.mp3"),
        makeFile("c.mp3"),
      ]);
    });

    await waitFor(() => {
      expect(uploadTrack).toHaveBeenCalledTimes(2);
    });

    await act(async () => {
      resolveFirst({ success: true, id: 1, audio_path: "venus/a.mp3" });
    });

    await waitFor(() => {
      expect(uploadTrack).toHaveBeenCalledTimes(3);
    });

    expect(
      result.current.queue.filter((i) => i.status === "pending"),
    ).toHaveLength(0);
  });
});

describe("upload lifecycle", () => {
  it("marks an item done and dispatches psc:track-uploaded with the upload result", async () => {
    const uploadResult = { success: true, id: 42, audio_path: "venus/a.mp3" };
    uploadTrack.mockResolvedValue(uploadResult);

    const handler = vi.fn();
    window.addEventListener("psc:track-uploaded", handler);

    const { result } = renderHook(() => useDragDropBatch("venus"));

    await act(async () => {
      await result.current.addFiles([makeFile("a.mp3")]);
    });

    await waitFor(() => {
      expect(result.current.queue[0].status).toBe("done");
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toEqual(uploadResult);

    window.removeEventListener("psc:track-uploaded", handler);
  });

  it("passes consoleOwner through as uploaded_by", async () => {
    mockUseSystem.mockReturnValue({ consoleOwner: "D" });
    uploadTrack.mockResolvedValue({ success: true, id: 1, audio_path: "x" });

    const { result } = renderHook(() => useDragDropBatch("venus"));

    await act(async () => {
      await result.current.addFiles([makeFile("a.mp3")]);
    });

    await waitFor(() => expect(uploadTrack).toHaveBeenCalled());

    expect(uploadTrack).toHaveBeenCalledWith(
      expect.any(File),
      expect.objectContaining({ vault: "venus", uploaded_by: "D" }),
      expect.any(Function),
    );
  });

  it("reports upload progress percent onto the queue item", async () => {
    let reportProgress;
    uploadTrack.mockImplementation((file, metadata, onProgress) => {
      reportProgress = onProgress;
      return neverResolves();
    });

    const { result } = renderHook(() => useDragDropBatch("venus"));
    await act(async () => {
      await result.current.addFiles([makeFile("a.mp3")]);
    });
    await waitFor(() => expect(reportProgress).toBeDefined());

    act(() => {
      reportProgress({ percent: 42 });
    });

    expect(result.current.queue[0].progress).toBe(42);
  });

  it("marks an item as error with the failure message on upload rejection", async () => {
    uploadTrack.mockRejectedValue(new Error("WORKER 500"));
    const { result } = renderHook(() => useDragDropBatch("venus"));

    await act(async () => {
      await result.current.addFiles([makeFile("a.mp3")]);
    });

    await waitFor(() => {
      expect(result.current.queue[0].status).toBe("error");
    });
    expect(result.current.queue[0].error).toBe("WORKER 500");
  });

  it("retry resets an error item to pending and lets it re-upload", async () => {
    uploadTrack.mockRejectedValueOnce(new Error("WORKER 500"));
    const { result } = renderHook(() => useDragDropBatch("venus"));

    await act(async () => {
      await result.current.addFiles([makeFile("a.mp3")]);
    });
    await waitFor(() => expect(result.current.queue[0].status).toBe("error"));

    uploadTrack.mockResolvedValueOnce({ success: true, id: 1, audio_path: "x" });
    const itemId = result.current.queue[0].id;
    act(() => {
      result.current.retry(itemId);
    });

    await waitFor(() => expect(result.current.queue[0].status).toBe("done"));
    expect(uploadTrack).toHaveBeenCalledTimes(2);
  });

  it("dismiss removes the item from the queue", async () => {
    uploadTrack.mockResolvedValue({ success: true, id: 1, audio_path: "x" });
    const { result } = renderHook(() => useDragDropBatch("venus"));

    await act(async () => {
      await result.current.addFiles([makeFile("a.mp3")]);
    });
    await waitFor(() => expect(result.current.queue[0].status).toBe("done"));

    const itemId = result.current.queue[0].id;
    act(() => {
      result.current.dismiss(itemId);
    });

    expect(result.current.queue).toHaveLength(0);
  });
});

describe("null session guard", () => {
  it("marks item as SESSION NOT AUTHENTICATED and never calls uploadTrack when consoleOwner is null", async () => {
    mockUseSystem.mockReturnValue({ consoleOwner: null });
    const { result } = renderHook(() => useDragDropBatch("venus"));

    await act(async () => {
      await result.current.addFiles([makeFile("a.mp3")]);
    });

    await waitFor(() => {
      expect(result.current.queue[0].status).toBe("error");
    });
    expect(result.current.queue[0].error).toBe("SESSION NOT AUTHENTICATED");
    expect(uploadTrack).not.toHaveBeenCalled();
  });

  it("auto-resumes the upload once consoleOwner becomes available after retry", async () => {
    mockUseSystem.mockReturnValue({ consoleOwner: null });
    const { result, rerender } = renderHook(() => useDragDropBatch("venus"));

    await act(async () => {
      await result.current.addFiles([makeFile("a.mp3")]);
    });
    await waitFor(() => expect(result.current.queue[0].status).toBe("error"));

    mockUseSystem.mockReturnValue({ consoleOwner: "D" });
    uploadTrack.mockResolvedValue({ success: true, id: 1, audio_path: "x" });
    const itemId = result.current.queue[0].id;

    act(() => {
      result.current.retry(itemId);
    });
    rerender();

    await waitFor(() => expect(result.current.queue[0].status).toBe("done"));
    expect(uploadTrack).toHaveBeenCalledWith(
      expect.any(File),
      expect.objectContaining({ uploaded_by: "D" }),
      expect.any(Function),
    );
  });
});

describe("drag handlers", () => {
  it("onDragEnter and onDragOver set isDraggingOver true", () => {
    const { result } = renderHook(() => useDragDropBatch("venus"));
    const fakeEvent = { preventDefault: vi.fn(), stopPropagation: vi.fn() };

    act(() => {
      result.current.onDragEnter(fakeEvent);
    });
    expect(result.current.isDraggingOver).toBe(true);
  });

  it("onDragOver keeps isDraggingOver true", () => {
    const { result } = renderHook(() => useDragDropBatch("venus"));
    act(() => {
      result.current.onDragOver({ preventDefault: vi.fn(), stopPropagation: vi.fn() });
    });
    expect(result.current.isDraggingOver).toBe(true);
  });

  it("onDragLeave clears isDraggingOver only when leaving the bound element itself", () => {
    const { result } = renderHook(() => useDragDropBatch("venus"));
    const target = {};
    act(() => {
      result.current.onDragEnter({ preventDefault: vi.fn(), stopPropagation: vi.fn() });
    });
    expect(result.current.isDraggingOver).toBe(true);

    act(() => {
      result.current.onDragLeave({
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        currentTarget: target,
        target,
      });
    });
    expect(result.current.isDraggingOver).toBe(false);
  });

  it("onDrop adds files from dataTransfer and clears isDraggingOver", async () => {
    const { result } = renderHook(() => useDragDropBatch("venus"));

    await act(async () => {
      await result.current.onDrop({
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: { files: [makeFile("a.mp3")] },
      });
    });

    expect(result.current.isDraggingOver).toBe(false);
    expect(result.current.queue).toHaveLength(1);
  });
});

describe("hidden/resource-fork file filtering", () => {
  it("filters out dotfiles and AppleDouble resource-fork files even with an audio extension", async () => {
    const { result } = renderHook(() => useDragDropBatch("venus"));

    await act(async () => {
      await result.current.addFiles([
        makeFile("track.mp3"),
        makeFile(".DS_Store", ""),
        makeFile("._track.mp3", "audio/mpeg"),
      ]);
    });

    expect(result.current.queue).toHaveLength(1);
    expect(result.current.queue[0].file.name).toBe("track.mp3");
  });
});

describe("duplicate prevention", () => {
  it("drops a duplicate within the same addFiles call (same name + size)", async () => {
    const { result } = renderHook(() => useDragDropBatch("venus"));

    await act(async () => {
      await result.current.addFiles([
        makeFile("track.mp3"),
        makeFile("track.mp3"),
      ]);
    });

    expect(result.current.queue).toHaveLength(1);
    expect(result.current.duplicateCount).toBe(1);
  });

  it("drops a duplicate against files already in the queue from an earlier drop", async () => {
    uploadTrack.mockImplementation(neverResolves);
    const { result } = renderHook(() => useDragDropBatch("venus"));

    await act(async () => {
      await result.current.addFiles([makeFile("track.mp3")]);
    });
    expect(result.current.queue).toHaveLength(1);

    await act(async () => {
      await result.current.addFiles([makeFile("track.mp3")]);
    });

    expect(result.current.queue).toHaveLength(1);
    expect(result.current.duplicateCount).toBe(1);
  });

  it("does not treat two different files with the same name but different size as duplicates", async () => {
    const { result } = renderHook(() => useDragDropBatch("venus"));

    const small = new File([new Uint8Array(4)], "track.mp3", { type: "audio/mpeg" });
    const big = new File([new Uint8Array(40)], "track.mp3", { type: "audio/mpeg" });

    await act(async () => {
      await result.current.addFiles([small, big]);
    });

    expect(result.current.queue).toHaveLength(2);
    expect(result.current.duplicateCount).toBe(0);
  });
});

describe("reset", () => {
  it("clears the queue and duplicate count", async () => {
    uploadTrack.mockImplementation(neverResolves);
    const { result } = renderHook(() => useDragDropBatch("venus"));

    await act(async () => {
      await result.current.addFiles([makeFile("a.mp3"), makeFile("a.mp3")]);
    });
    expect(result.current.queue).toHaveLength(1);
    expect(result.current.duplicateCount).toBe(1);

    act(() => {
      result.current.reset();
    });

    expect(result.current.queue).toHaveLength(0);
    expect(result.current.duplicateCount).toBe(0);
  });

  it("allows re-adding a previously-queued file after reset (dedupe state is cleared too)", async () => {
    uploadTrack.mockResolvedValue({ success: true, id: 1, audio_path: "x" });
    const { result } = renderHook(() => useDragDropBatch("venus"));

    await act(async () => {
      await result.current.addFiles([makeFile("a.mp3")]);
    });
    await waitFor(() => expect(result.current.queue[0].status).toBe("done"));

    act(() => {
      result.current.reset();
    });

    await act(async () => {
      await result.current.addFiles([makeFile("a.mp3")]);
    });

    expect(result.current.queue).toHaveLength(1);
    expect(result.current.duplicateCount).toBe(0);
  });
});
