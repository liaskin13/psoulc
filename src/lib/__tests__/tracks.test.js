// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Module mocks (hoisted before imports) ───────────────────────────────────

vi.mock("../../config", () => ({
  UPLOAD_WORKER_URL: "https://psc-worker.example.com",
  UPLOAD_SECRET: "test-secret",
  R2_PUBLIC_URL: "https://r2.example.com",
}));

import {
  uploadTrack,
  getAudioUrl,
  fetchVaultTracks,
  fetchAllTracks,
  fetchPublishedVaultTracks,
  countVaultTracks,
  voidTrack,
  saveTrackHotCues,
  saveTrackWaveform,
} from "../tracks";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeFile(name = "track.mp3", type = "audio/mpeg") {
  return new File([new Uint8Array(1024).fill(1)], name, { type });
}

// A file-like stub for multi-chunk tests — avoids allocating real
// multi-megabyte buffers. uploadTrack only ever reads name/type/size and
// calls .slice(start, end); it never inspects chunk contents itself.
function makeFakeFile({ name = "track.wav", type = "audio/wav", size = 1024 } = {}) {
  return {
    name,
    type,
    size,
    slice: vi.fn((start, end) => ({ __chunk: true, start, end })),
  };
}

function mockFetchSuccess() {
  const fetchMock = vi
    .fn()
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

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  localStorage.clear();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("getAudioUrl", () => {
  it("returns null for falsy audio_path", () => {
    expect(getAudioUrl(null)).toBeNull();
    expect(getAudioUrl("")).toBeNull();
    expect(getAudioUrl(undefined)).toBeNull();
  });

  it("returns correct worker proxy URL for valid audio_path", () => {
    expect(getAudioUrl("saturn/1234-uuid.mp3")).toBe(
      "https://psc-worker.example.com/audio/saturn/1234-uuid.mp3",
    );
  });
});

describe("uploadTrack — happy path", () => {
  it("completes the 3-step multipart flow and returns the worker's response", async () => {
    const fetchMock = mockFetchSuccess();

    const result = await uploadTrack(
      makeFile(),
      { vault: "saturn", title: "Test Track", artist: "D", bpm: "124", uploaded_by: "D" },
      vi.fn(),
    );

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result).toEqual({ success: true, id: 42, audio_path: "saturn/track.mp3" });

    const body = getUploadCompleteBody(fetchMock);
    expect(body).toMatchObject({
      vault: "saturn",
      title: "Test Track",
      artist: "D",
      bpm: "124",
      uploaded_by: "D",
      waveform_data: null,
    });
  });

  it("sends the PSC-Secret auth header on every request", async () => {
    const fetchMock = mockFetchSuccess();
    await uploadTrack(makeFile(), { vault: "saturn", title: "T", uploaded_by: "D" }, vi.fn());

    for (const [, opts] of fetchMock.mock.calls) {
      expect(opts.headers["PSC-Secret"]).toBe("test-secret");
    }
  });

  it("reports progress through init, chunking, finalize, db-write, and done stages", async () => {
    mockFetchSuccess();
    const onProgress = vi.fn();

    await uploadTrack(makeFile(), { vault: "saturn", title: "T", uploaded_by: "D" }, onProgress);

    const stages = onProgress.mock.calls.map(([arg]) => arg.stage);
    expect(stages).toEqual(["init", "chunking", "finalize", "db-write", "done"]);
    expect(onProgress.mock.calls.at(-1)[0]).toMatchObject({ stage: "done", percent: 100 });
  });

  it("splits a file larger than the 50MB chunk size into multiple upload-part requests", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ uploadId: "uid", key: "saturn/big.wav" }),
      })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ partNumber: 1, etag: "etag-1" }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ partNumber: 2, etag: "etag-2" }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ partNumber: 3, etag: "etag-3" }) })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, id: 1, audio_path: "saturn/big.wav" }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const bigFile = makeFakeFile({ name: "big.wav", size: 120 * 1024 * 1024 }); // 120MB → 3 chunks of 50MB

    await uploadTrack(bigFile, { vault: "saturn", title: "Big", uploaded_by: "D" }, vi.fn());

    expect(bigFile.slice).toHaveBeenCalledTimes(3);
    const partCalls = fetchMock.mock.calls.filter(([url]) => String(url).includes("/upload-part"));
    expect(partCalls).toHaveLength(3);

    const completeCall = fetchMock.mock.calls.find(([url]) => String(url).includes("/upload-complete"));
    const body = JSON.parse(completeCall[1].body);
    expect(body.parts).toEqual([
      { partNumber: 1, etag: "etag-1" },
      { partNumber: 2, etag: "etag-2" },
      { partNumber: 3, etag: "etag-3" },
    ]);
  });
});

describe("uploadTrack — error paths", () => {
  it("throws the worker's error message when upload-init fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "VAULT NOT FOUND" }),
      }),
    );

    await expect(
      uploadTrack(makeFile(), { vault: "ghost", title: "T", uploaded_by: "D" }, vi.fn()),
    ).rejects.toThrow("VAULT NOT FOUND");
  });

  it("falls back to 'HTTP <status>' when the error response has no JSON body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: () => Promise.reject(new Error("not json")),
      }),
    );

    await expect(
      uploadTrack(makeFile(), { vault: "saturn", title: "T", uploaded_by: "D" }, vi.fn()),
    ).rejects.toThrow("HTTP 503");
  });

  it("throws when upload-init succeeds but the response is missing uploadId/key", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) }),
    );

    await expect(
      uploadTrack(makeFile(), { vault: "saturn", title: "T", uploaded_by: "D" }, vi.fn()),
    ).rejects.toThrow("missing uploadId/key");
  });

  it("throws the worker's error message when an upload-part request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ uploadId: "uid", key: "saturn/track.mp3" }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 502,
          json: () => Promise.resolve({ error: "R2 TIMEOUT" }),
        }),
    );

    await expect(
      uploadTrack(makeFile(), { vault: "saturn", title: "T", uploaded_by: "D" }, vi.fn()),
    ).rejects.toThrow("R2 TIMEOUT");
  });

  it("throws when an upload-part response is missing an etag", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ uploadId: "uid", key: "saturn/track.mp3" }),
        })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ partNumber: 1 }) }),
    );

    await expect(
      uploadTrack(makeFile(), { vault: "saturn", title: "T", uploaded_by: "D" }, vi.fn()),
    ).rejects.toThrow("Upload chunk 1 failed: missing etag");
  });

  it("throws the worker's error message when upload-complete fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ uploadId: "uid", key: "saturn/track.mp3" }),
        })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ partNumber: 1, etag: "e1" }) })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: "D1 WRITE FAILED" }),
        }),
    );

    await expect(
      uploadTrack(makeFile(), { vault: "saturn", title: "T", uploaded_by: "D" }, vi.fn()),
    ).rejects.toThrow("D1 WRITE FAILED");
  });
});

describe("fetchVaultTracks (production)", () => {
  it("returns the worker's track array for the given vault", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{ id: 1, vault: "venus" }]),
      }),
    );

    const tracks = await fetchVaultTracks("venus");
    expect(tracks).toEqual([{ id: 1, vault: "venus" }]);
  });

  it("throws when the worker responds with an error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "D1 UNAVAILABLE" }),
      }),
    );

    await expect(fetchVaultTracks("venus")).rejects.toThrow("D1 UNAVAILABLE");
  });

  it("returns an empty array when the worker response is not an array", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ unexpected: true }) }),
    );

    expect(await fetchVaultTracks("venus")).toEqual([]);
  });
});

describe("fetchAllTracks (production)", () => {
  it("returns the worker's full track array", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([{ id: 1 }, { id: 2 }]) }),
    );

    expect(await fetchAllTracks()).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it("throws when the worker responds with an error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: "UNAUTHORIZED" }),
      }),
    );

    await expect(fetchAllTracks()).rejects.toThrow("UNAUTHORIZED");
  });
});

describe("fetchPublishedVaultTracks (production, listener-facing — never throws)", () => {
  it("returns published tracks for the vault", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([{ id: 1, is_published: 1 }]) }),
    );

    expect(await fetchPublishedVaultTracks("venus")).toEqual([{ id: 1, is_published: 1 }]);
  });

  it("returns an empty array (not a throw) when the worker request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    expect(await fetchPublishedVaultTracks("venus")).toEqual([]);
  });

  it("sends no auth header — listener requests are unauthenticated", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });
    vi.stubGlobal("fetch", fetchMock);

    await fetchPublishedVaultTracks("venus");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://psc-worker.example.com/tracks/venus",
    );
  });
});

describe("countVaultTracks (localStorage-backed, IS_DEV-independent)", () => {
  it("counts only non-voided tracks in the given vault", () => {
    localStorage.setItem(
      "psc_dev_tracks",
      JSON.stringify([
        { id: 1, vault: "venus", is_voided: false },
        { id: 2, vault: "venus", is_voided: true },
        { id: 3, vault: "saturn", is_voided: false },
      ]),
    );

    expect(countVaultTracks("venus")).toBe(1);
    expect(countVaultTracks("saturn")).toBe(1);
    expect(countVaultTracks("mercury")).toBe(0);
  });

  it("returns 0 when localStorage has no track data", () => {
    expect(countVaultTracks("venus")).toBe(0);
  });
});

describe("voidTrack / saveTrackHotCues / saveTrackWaveform (production mode)", () => {
  it("voidTrack no-ops outside dev mode (IS_DEV is false against a non-localhost worker URL)", async () => {
    localStorage.setItem(
      "psc_dev_tracks",
      JSON.stringify([{ id: "local-1", vault: "venus", is_voided: false }]),
    );

    await voidTrack("local-1");

    const stored = JSON.parse(localStorage.getItem("psc_dev_tracks"));
    expect(stored[0].is_voided).toBe(false);
  });

  it("saveTrackHotCues writes hot_cues onto the matching local track", async () => {
    localStorage.setItem(
      "psc_dev_tracks",
      JSON.stringify([{ id: "local-1", vault: "venus" }]),
    );

    await saveTrackHotCues("local-1", [{ time: 12.5, label: "drop" }]);

    const stored = JSON.parse(localStorage.getItem("psc_dev_tracks"));
    expect(JSON.parse(stored[0].hot_cues)).toEqual([{ time: 12.5, label: "drop" }]);
  });

  it("saveTrackWaveform writes waveform_data onto the matching local track", async () => {
    localStorage.setItem(
      "psc_dev_tracks",
      JSON.stringify([{ id: "local-1", vault: "venus" }]),
    );

    await saveTrackWaveform("local-1", { high: [1, 2, 3] });

    const stored = JSON.parse(localStorage.getItem("psc_dev_tracks"));
    expect(JSON.parse(stored[0].waveform_data)).toEqual({ high: [1, 2, 3] });
  });

  it("saveTrackHotCues is a no-op when the track id doesn't exist", async () => {
    localStorage.setItem("psc_dev_tracks", JSON.stringify([{ id: "other", vault: "venus" }]));

    await saveTrackHotCues("missing-id", [{ time: 1 }]);

    const stored = JSON.parse(localStorage.getItem("psc_dev_tracks"));
    expect(stored[0].hot_cues).toBeUndefined();
  });
});
