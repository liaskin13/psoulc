import { describe, it, expect } from "vitest";
import { parseSeratoOverview } from "../seratoParser";

// ─── Binary helpers ──────────────────────────────────────────────────────────

/**
 * Build a minimal valid ID3v2.3 binary containing a single GEOB frame.
 * ID3v2.3: frame sizes are plain big-endian uint32 (NOT syncsafe).
 */
function buildID3v3(geobBody) {
  const frameHeader = new Uint8Array(10);
  frameHeader[0] = 0x47; frameHeader[1] = 0x45; frameHeader[2] = 0x4f; frameHeader[3] = 0x42; // "GEOB"
  // frame size: plain uint32 big-endian
  frameHeader[4] = (geobBody.length >>> 24) & 0xff;
  frameHeader[5] = (geobBody.length >>> 16) & 0xff;
  frameHeader[6] = (geobBody.length >>> 8) & 0xff;
  frameHeader[7] = geobBody.length & 0xff;
  // flags: 0x00 0x00

  const tagDataLen = frameHeader.length + geobBody.length; // everything after ID3 10-byte header

  const id3Header = new Uint8Array(10);
  id3Header[0] = 0x49; id3Header[1] = 0x44; id3Header[2] = 0x33; // "ID3"
  id3Header[3] = 3; // ID3v2.3
  id3Header[4] = 0; id3Header[5] = 0;
  // syncsafe int for tag size
  id3Header[6] = (tagDataLen >>> 21) & 0x7f;
  id3Header[7] = (tagDataLen >>> 14) & 0x7f;
  id3Header[8] = (tagDataLen >>> 7) & 0x7f;
  id3Header[9] = tagDataLen & 0x7f;

  const total = new Uint8Array(10 + frameHeader.length + geobBody.length);
  total.set(id3Header, 0);
  total.set(frameHeader, 10);
  total.set(geobBody, 20);
  return total;
}

/**
 * Build a GEOB frame body for the given description and amplitude bytes.
 * Serato encoding byte = 0 (Latin-1), MIME and filename are empty.
 */
function buildGeobBody(description, amplitudeBytes) {
  const descBytes = new TextEncoder().encode(description);
  // layout: encoding(1) + mime_null(1) + filename_null(1) + desc + desc_null(1) + serato_version(2) + amplitude
  const body = new Uint8Array(1 + 1 + 1 + descBytes.length + 1 + 2 + amplitudeBytes.length);
  let pos = 0;
  body[pos++] = 0;              // encoding: Latin-1
  body[pos++] = 0;              // MIME: empty string null terminator
  body[pos++] = 0;              // filename: empty string null terminator
  body.set(descBytes, pos); pos += descBytes.length;
  body[pos++] = 0;              // description null terminator
  body[pos++] = 0x01;           // Serato version byte 0
  body[pos++] = 0x00;           // Serato version byte 1
  body.set(amplitudeBytes, pos);
  return body;
}

function makeFile(bytes) {
  return new Blob([bytes]);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("parseSeratoOverview", () => {
  it("returns null for empty input", async () => {
    expect(await parseSeratoOverview(makeFile(new Uint8Array([])))).toBeNull();
  });

  it("returns null for non-ID3 data (MP3 sync word)", async () => {
    expect(await parseSeratoOverview(makeFile(new Uint8Array([0xff, 0xfb, 0x90, 0x00])))).toBeNull();
  });

  it("returns null for ID3v2.2 (version < 3, frame IDs differ)", async () => {
    const id3v22 = new Uint8Array([0x49, 0x44, 0x33, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    expect(await parseSeratoOverview(makeFile(id3v22))).toBeNull();
  });

  it("returns null for ID3 with no GEOB frame", async () => {
    const emptyTag = new Uint8Array([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    expect(await parseSeratoOverview(makeFile(emptyTag))).toBeNull();
  });

  it("returns null when GEOB description is not 'Serato Overview'", async () => {
    const amplitude = new Uint8Array([128, 64, 32]);
    const geob = buildGeobBody("Serato Beatgrid", amplitude);
    expect(await parseSeratoOverview(makeFile(buildID3v3(geob)))).toBeNull();
  });

  it("parses colored Serato Overview — bar count, peaks, and frequency colors", async () => {
    // 3 bars, colored format (3 bytes per bar)
    // bar 0: lo=80 > mi=40 > hi=20 → bass blue
    // bar 1: mi=80 > hi=40 > lo=20 → mid green
    // bar 2: hi=80 > mi=40 > lo=20 → treble orange
    const amplitude = new Uint8Array([80, 40, 20, 20, 80, 40, 20, 40, 80]);
    const geob = buildGeobBody("Serato Overview", amplitude);

    const result = await parseSeratoOverview(makeFile(buildID3v3(geob)));

    expect(result).not.toBeNull();
    expect(result.bars).toHaveLength(3);
    expect(result.low).toHaveLength(80);
    expect(result.high).toHaveLength(1000);

    expect(result.bars[0].freq).toBe("#1464dc"); // bass — blue
    expect(result.bars[0].peak).toBeCloseTo(80 / 255, 5);

    expect(result.bars[1].freq).toBe("#14dc14"); // mid — green
    expect(result.bars[1].peak).toBeCloseTo(80 / 255, 5);

    expect(result.bars[2].freq).toBe("#e56020"); // treble — orange
    expect(result.bars[2].peak).toBeCloseTo(80 / 255, 5);
  });

  it("parses mono Serato Overview — single amplitude byte per bar", async () => {
    // 4 bytes → 4 % 3 = 1 → mono path; all bars get mid green
    const amplitude = new Uint8Array([100, 150, 200, 50]);
    const geob = buildGeobBody("Serato Overview", amplitude);

    const result = await parseSeratoOverview(makeFile(buildID3v3(geob)));

    expect(result).not.toBeNull();
    expect(result.bars).toHaveLength(4);
    result.bars.forEach((bar) => expect(bar.freq).toBe("#14dc14"));
    expect(result.bars[0].peak).toBeCloseTo(100 / 255, 5);
    expect(result.bars[2].peak).toBeCloseTo(200 / 255, 5);
  });

  it("resample: low is always 80 bars, high is always 1000 bars", async () => {
    // 500-bar colored waveform (typical Serato overview resolution)
    const amplitude = new Uint8Array(500 * 3).fill(128);
    const geob = buildGeobBody("Serato Overview", amplitude);

    const result = await parseSeratoOverview(makeFile(buildID3v3(geob)));

    expect(result.bars).toHaveLength(500);
    expect(result.low).toHaveLength(80);
    expect(result.high).toHaveLength(1000);
    // All peaks interpolate from 128/255
    result.low.forEach((bar) => expect(bar.peak).toBeCloseTo(128 / 255, 4));
    result.high.forEach((bar) => expect(bar.peak).toBeCloseTo(128 / 255, 4));
  });

  it("skips the 2-byte Serato version header before reading amplitude", async () => {
    // version bytes [0x01, 0x00] should be skipped; only the 3 amplitude bytes matter
    const amplitude = new Uint8Array([255, 0, 0]); // 1 bar, all lo → bass blue, peak=1.0
    const geob = buildGeobBody("Serato Overview", amplitude);

    const result = await parseSeratoOverview(makeFile(buildID3v3(geob)));

    expect(result.bars).toHaveLength(1);
    expect(result.bars[0].peak).toBeCloseTo(1.0, 5);
    expect(result.bars[0].freq).toBe("#1464dc");
  });

  it("returns null for Serato Overview with zero amplitude bytes (empty data after version header)", async () => {
    const geob = buildGeobBody("Serato Overview", new Uint8Array([])); // only version header, no amplitude
    const result = await parseSeratoOverview(makeFile(buildID3v3(geob)));
    expect(result).toBeNull();
  });

  it("handles corrupted/truncated ID3 without throwing", async () => {
    // ID3 header says size=1000 but we only have 10 bytes total
    const corrupted = new Uint8Array([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x07, 0x6b, 0x78]);
    await expect(parseSeratoOverview(makeFile(corrupted))).resolves.toBeNull();
  });

  it("handles ID3v2.4 with syncsafe frame sizes", async () => {
    // Build ID3v2.4: same structure but version byte = 4 and frame size is syncsafe
    const amplitude = new Uint8Array([100, 50, 25]); // 1 colored bar
    const descBytes = new TextEncoder().encode("Serato Overview");
    const geobBody = new Uint8Array(1 + 1 + 1 + descBytes.length + 1 + 2 + amplitude.length);
    let pos = 0;
    geobBody[pos++] = 0;
    geobBody[pos++] = 0;
    geobBody[pos++] = 0;
    geobBody.set(descBytes, pos); pos += descBytes.length;
    geobBody[pos++] = 0;
    geobBody[pos++] = 0x01; geobBody[pos++] = 0x00;
    geobBody.set(amplitude, pos);

    // ID3v2.4 frame header: syncsafe frame size
    const frameSize = geobBody.length;
    const frameHeader = new Uint8Array(10);
    frameHeader[0] = 0x47; frameHeader[1] = 0x45; frameHeader[2] = 0x4f; frameHeader[3] = 0x42;
    frameHeader[4] = (frameSize >>> 21) & 0x7f; // syncsafe
    frameHeader[5] = (frameSize >>> 14) & 0x7f;
    frameHeader[6] = (frameSize >>> 7) & 0x7f;
    frameHeader[7] = frameSize & 0x7f;

    const tagDataLen = frameHeader.length + geobBody.length;
    const id3Header = new Uint8Array(10);
    id3Header[0] = 0x49; id3Header[1] = 0x44; id3Header[2] = 0x33;
    id3Header[3] = 4; // ID3v2.4
    id3Header[6] = (tagDataLen >>> 21) & 0x7f;
    id3Header[7] = (tagDataLen >>> 14) & 0x7f;
    id3Header[8] = (tagDataLen >>> 7) & 0x7f;
    id3Header[9] = tagDataLen & 0x7f;

    const total = new Uint8Array(10 + frameHeader.length + geobBody.length);
    total.set(id3Header, 0);
    total.set(frameHeader, 10);
    total.set(geobBody, 20);

    const result = await parseSeratoOverview(makeFile(total));
    expect(result).not.toBeNull();
    expect(result.bars).toHaveLength(1);
    expect(result.bars[0].peak).toBeCloseTo(100 / 255, 5);
    expect(result.bars[0].freq).toBe("#1464dc"); // lo=100 dominates
  });
});
