// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Module mocks (hoisted before imports) ───────────────────────────────────

vi.mock("../../config", () => ({
  UPLOAD_WORKER_URL: "https://psc-worker.example.com",
  UPLOAD_SECRET: "test-secret",
  R2_PUBLIC_URL: "https://r2.example.com",
}));

import { uploadTrack, getAudioUrl } from "../tracks";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeFile(name = "track.mp3", type = "audio/mpeg") {
  return new File([new Uint8Array(1024).fill(1)], name, { type });
}


function mockFetchSuccess() {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ uploadId: "uid-test", key: "saturn/track.mp3" }),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ partNumber: 1, etag: "etag-abc123" }),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, id: 42, audio_path: "saturn/track.mp3" }),
    });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function getUploadCompleteBody(fetchMock) {
  const call = fetchMock.mock.calls.find(([url]) => String(url).includes("/upload-complete"));
  if (!call) return null;
  return JSON.parse(call[1].body);
}

// ─── Tests ───────────────────────────────────────────────────────────────────


describe("getAudioUrl", () => {
  it("returns null for falsy audio_path", () => {
    expect(getAudioUrl(null)).toBeNull();
    expect(getAudioUrl("")).toBeNull();
    expect(getAudioUrl(undefined)).toBeNull();
  });

  it("returns correct worker proxy URL for valid audio_path", () => {
    expect(getAudioUrl("saturn/1234-uuid.mp3")).toBe(
      "https://psc-worker.example.com/audio/saturn/1234-uuid.mp3"
    );
  });
});
