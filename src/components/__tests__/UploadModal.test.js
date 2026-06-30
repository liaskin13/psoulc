// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";

// ─── Module mocks (hoisted before imports) ───────────────────────────────────

vi.mock("../../config", () => ({
  VAULT_DISPLAY_NAMES: {
    saturn: "ORIGINAL MUSIC",
    venus: "MIXES",
    mercury: "LIVE SETS",
    earth: "EARTH",
  },
  UPLOAD_WORKER_URL: "https://psc-worker.example.com",
  UPLOAD_SECRET: "test-secret",
}));

vi.mock("../../lib/tracks", () => ({
  uploadTrack: vi.fn(),
}));

vi.mock("../../lib/readId3Tags", () => ({
  readId3Tags: vi.fn(),
}));

const mockDispatchCommand = vi.fn();
const mockLoadVaultTracks = vi.fn();
vi.mock("../../state/SystemContext", () => ({
  useSystem: () => ({
    consoleOwner: "D",
    sessionMeta: null,
    loadVaultTracks: mockLoadVaultTracks,
    dispatchCommand: mockDispatchCommand,
  }),
  CMD: { UPLOAD_TRACK: "UPLOAD_TRACK" },
}));

import UploadModal from "../UploadModal";
import { readId3Tags } from "../../lib/readId3Tags";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeFile(name = "track.mp3", type = "audio/mpeg") {
  return new File([new Uint8Array(16).fill(1)], name, { type });
}

function renderModal(props = {}) {
  return render(React.createElement(UploadModal, { onClose: vi.fn(), ...props }));
}

function getFileInput(container) {
  return container.querySelector('input[type="file"]');
}

function getCommitButton() {
  return screen.getByText(/COMMIT TO VAULT/i);
}

beforeEach(() => {
  readId3Tags.mockResolvedValue({ title: null, artist: null, bpm: null });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("file format validation", () => {
  it("accepts a valid audio file by MIME type and clears any prior error", async () => {
    const { container } = renderModal();
    const fileInput = getFileInput(container);

    fireEvent.change(fileInput, { target: { files: [makeFile("track.mp3", "audio/mpeg")] } });

    await waitFor(() => {
      expect(screen.getByText("track.mp3")).toBeTruthy();
    });
    expect(screen.queryByText(/INVALID FILE TYPE/)).toBeNull();
  });

  it("accepts a recognized audio extension even with an empty MIME type", async () => {
    const { container } = renderModal();
    const fileInput = getFileInput(container);

    fireEvent.change(fileInput, { target: { files: [makeFile("track.wav", "")] } });

    await waitFor(() => {
      expect(screen.getByText("track.wav")).toBeTruthy();
    });
  });

  it("rejects a non-audio file and shows the INVALID FILE TYPE error", async () => {
    const { container } = renderModal();
    const fileInput = getFileInput(container);

    fireEvent.change(fileInput, { target: { files: [makeFile("notes.pdf", "application/pdf")] } });

    await waitFor(() => {
      expect(screen.getByText(/INVALID FILE TYPE/)).toBeTruthy();
    });
    expect(screen.queryByText("notes.pdf")).toBeNull();
  });

  it("applies the same validation when a file is dropped instead of selected", async () => {
    renderModal();
    const dropzone = screen.getByText(/DROP AUDIO FILE/).closest(".upload-dropzone");

    fireEvent.drop(dropzone, { dataTransfer: { files: [makeFile("drop.pdf", "application/pdf")] } });

    await waitFor(() => {
      expect(screen.getByText(/INVALID FILE TYPE/)).toBeTruthy();
    });
  });

  it("falls back to the filename-derived title when ID3 read fails", async () => {
    readId3Tags.mockRejectedValue(new Error("corrupt tag"));
    const { container } = renderModal();
    const fileInput = getFileInput(container);

    fireEvent.change(fileInput, { target: { files: [makeFile("my-track_name.mp3")] } });

    await waitFor(() => {
      expect(screen.getByPlaceholderText("TRACK DESIGNATION").value).toBe("MY TRACK NAME");
    });
    expect(screen.getByText(/TAG SCAN FAILED/)).toBeTruthy();
  });
});

describe("BPM validation", () => {
  it("accepts a plain integer BPM within range", () => {
    renderModal();
    const bpmInput = screen.getByPlaceholderText("e.g. 73-119");

    fireEvent.change(bpmInput, { target: { value: "124" } });
    expect(bpmInput.value).toBe("124");
  });

  it("accepts a BPM range (e.g. 73-119)", () => {
    renderModal();
    const bpmInput = screen.getByPlaceholderText("e.g. 73-119");

    fireEvent.change(bpmInput, { target: { value: "73-119" } });
    expect(bpmInput.value).toBe("73-119");
  });

  it("rejects a BPM above the 400 ceiling — value stays unchanged", () => {
    renderModal();
    const bpmInput = screen.getByPlaceholderText("e.g. 73-119");

    fireEvent.change(bpmInput, { target: { value: "500" } });
    expect(bpmInput.value).not.toBe("500");
  });

  it("rejects a BPM below the minimum of 1", () => {
    renderModal();
    const bpmInput = screen.getByPlaceholderText("e.g. 73-119");

    fireEvent.change(bpmInput, { target: { value: "0" } });
    expect(bpmInput.value).not.toBe("0");
  });

  it("rejects non-numeric input", () => {
    renderModal();
    const bpmInput = screen.getByPlaceholderText("e.g. 73-119");

    fireEvent.change(bpmInput, { target: { value: "abc" } });
    expect(bpmInput.value).not.toBe("abc");
  });

  it("allows clearing the field to empty", () => {
    renderModal();
    const bpmInput = screen.getByPlaceholderText("e.g. 73-119");

    fireEvent.change(bpmInput, { target: { value: "" } });
    expect(bpmInput.value).toBe("");
  });
});

describe("submit guard", () => {
  it("disables COMMIT TO VAULT when no file is selected", () => {
    renderModal();
    expect(getCommitButton().disabled).toBe(true);
  });

  it("disables COMMIT TO VAULT when a file is selected but title is blank", async () => {
    const { container } = renderModal();
    fireEvent.change(getFileInput(container), { target: { files: [makeFile()] } });

    await waitFor(() => expect(screen.getByText("track.mp3")).toBeTruthy());

    fireEvent.change(screen.getByPlaceholderText("TRACK DESIGNATION"), {
      target: { value: "   " },
    });
    expect(getCommitButton().disabled).toBe(true);
  });

  it("enables COMMIT TO VAULT once a valid file and non-empty title are present", async () => {
    const { container } = renderModal();
    fireEvent.change(getFileInput(container), { target: { files: [makeFile()] } });

    await waitFor(() => expect(screen.getByText("track.mp3")).toBeTruthy());

    fireEvent.change(screen.getByPlaceholderText("TRACK DESIGNATION"), {
      target: { value: "Test Track" },
    });
    expect(getCommitButton().disabled).toBe(false);
  });
});
