// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Module mocks (hoisted before imports) ───────────────────────────────────

vi.mock("../../config", () => ({
  UPLOAD_WORKER_URL: "https://psc-worker.example.com",
  UPLOAD_SECRET: "test-secret",
  R2_PUBLIC_URL: "https://r2.example.com",
}));

vi.mock("../seratoParser", () => ({
  parseSeratoOverview: vi.fn(),
}));

vi.mock("../audioPreprocessor", () => ({
  preprocessAudio: vi.fn(),
}));

import { uploadTrack, getAudioUrl } from "../tracks";
import { parseSeratoOverview } from "../seratoParser";
import { preprocessAudio } from "../audioPreprocessor";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeFile(name = "track.mp3", type = "audio/mpeg") {
  return new File([new Uint8Array(1024).fill(1)], name, { type });
}

const MOCK_WAVEFORM = {
  low: Array.from({ length: 80 }, (_, i) => ({ peak: i / 80, freq: "#14dc14" })),
  high: Array.from({ length: 1000 }, (_, i) => ({ peak: i / 1000, freq: "#14dc14" })),
};

const MOCK_SERATO_RESULT = {
  bars: [{ peak: 0.5, freq: "#1464dc" }],
  ...MOCK_WAVEFORM,
};

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

describe("uploadTrack — waveform pre-computation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("includes waveform_data in upload-complete payload when Serato tag is found", async () => {
    parseSeratoOverview.mockResolvedValue(MOCK_SERATO_RESULT);
    const fetchMock = mockFetchSuccess();

    await uploadTrack(makeFile(), { vault: "saturn", title: "Test Track", uploaded_by: "D" }, vi.fn());

    const body = getUploadCompleteBody(fetchMock);
    expect(body).not.toBeNull();
    expect(body.waveform_data).toBeTruthy();

    const waveformData = JSON.parse(body.waveform_data);
    expect(waveformData.low).toHaveLength(80);
    expect(waveformData.high).toHaveLength(1000);
  });

  it("calls preprocessAudio when Serato tag is absent and includes its result", async () => {
    parseSeratoOverview.mockResolvedValue(null);
    preprocessAudio.mockResolvedValue({ waveformData: MOCK_WAVEFORM, duration: 180.5 });
    const fetchMock = mockFetchSuccess();

    await uploadTrack(makeFile(), { vault: "saturn", title: "Test Track", uploaded_by: "D" }, vi.fn());

    expect(preprocessAudio).toHaveBeenCalledOnce();

    const body = getUploadCompleteBody(fetchMock);
    expect(body.waveform_data).toBeTruthy();
    expect(body.duration).toBeCloseTo(180.5, 1);

    const waveformData = JSON.parse(body.waveform_data);
    expect(waveformData.low).toHaveLength(80);
    expect(waveformData.high).toHaveLength(1000);
  });

  it("upload still completes when parseSeratoOverview throws — waveform_data is null", async () => {
    parseSeratoOverview.mockRejectedValue(new Error("Corrupt ID3 header"));
    const fetchMock = mockFetchSuccess();

    // Should NOT throw — try/catch inside uploadTrack absorbs it
    await expect(
      uploadTrack(makeFile(), { vault: "saturn", title: "Test Track", uploaded_by: "D" }, vi.fn())
    ).resolves.toBeDefined();

    // All 3 fetch calls must have happened
    expect(fetchMock).toHaveBeenCalledTimes(3);

    const body = getUploadCompleteBody(fetchMock);
    expect(body.waveform_data).toBeNull();
  });

  it("upload still completes when preprocessAudio throws — waveform_data is null", async () => {
    parseSeratoOverview.mockResolvedValue(null); // no Serato tag → fallback
    preprocessAudio.mockRejectedValue(new Error("Unsupported audio codec"));
    const fetchMock = mockFetchSuccess();

    await expect(
      uploadTrack(makeFile(), { vault: "saturn", title: "Test Track", uploaded_by: "D" }, vi.fn())
    ).resolves.toBeDefined();

    expect(fetchMock).toHaveBeenCalledTimes(3);

    const body = getUploadCompleteBody(fetchMock);
    expect(body.waveform_data).toBeNull();
    expect(body.duration).toBeNull();
  });

  it("does not call preprocessAudio on the Serato fast path", async () => {
    parseSeratoOverview.mockResolvedValue(MOCK_SERATO_RESULT);
    mockFetchSuccess();

    await uploadTrack(makeFile(), { vault: "saturn", title: "Test Track", uploaded_by: "D" }, vi.fn());

    expect(preprocessAudio).not.toHaveBeenCalled();
  });

  it("passes a progress wrapper to preprocessAudio — not the raw onProgress callback", async () => {
    parseSeratoOverview.mockResolvedValue(null);
    preprocessAudio.mockImplementation(async (_file, cb) => {
      if (cb) cb(50); // preprocessAudio emits raw numbers
      return { waveformData: MOCK_WAVEFORM, duration: 120 };
    });
    const fetchMock = mockFetchSuccess();
    const onProgress = vi.fn();

    await uploadTrack(makeFile(), { vault: "saturn", title: "Test Track", uploaded_by: "D" }, onProgress);

    // onProgress should always receive {stage, percent, detail} objects, never raw numbers
    const rawNumberCalls = onProgress.mock.calls.filter(([arg]) => typeof arg === "number");
    expect(rawNumberCalls).toHaveLength(0);

    // Progress during analysis should come through as a structured object
    const analyzingCalls = onProgress.mock.calls.filter(([arg]) => arg?.stage === "analyzing");
    expect(analyzingCalls.length).toBeGreaterThan(0);
  });

  it("waveform_data from Serato path is valid JSON parseable object", async () => {
    parseSeratoOverview.mockResolvedValue(MOCK_SERATO_RESULT);
    const fetchMock = mockFetchSuccess();

    await uploadTrack(makeFile(), { vault: "saturn", title: "Test Track", uploaded_by: "D" }, vi.fn());

    const body = getUploadCompleteBody(fetchMock);
    expect(() => JSON.parse(body.waveform_data)).not.toThrow();
    const parsed = JSON.parse(body.waveform_data);
    expect(parsed).toHaveProperty("low");
    expect(parsed).toHaveProperty("high");
    expect(Array.isArray(parsed.low)).toBe(true);
    expect(Array.isArray(parsed.high)).toBe(true);
  });
});

describe("getAudioUrl", () => {
  it("returns null for falsy audio_path", () => {
    expect(getAudioUrl(null)).toBeNull();
    expect(getAudioUrl("")).toBeNull();
    expect(getAudioUrl(undefined)).toBeNull();
  });

  it("returns correct R2 URL for valid audio_path", () => {
    expect(getAudioUrl("saturn/1234-uuid.mp3")).toBe(
      "https://r2.example.com/saturn/1234-uuid.mp3"
    );
  });
});
