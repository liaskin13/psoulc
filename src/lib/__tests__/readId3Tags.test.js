import { describe, it, expect } from "vitest";
import { readId3Tags } from "../readId3Tags";

// ─── ID3v2 byte builders ──────────────────────────────────────────────────────
// Hand-rolled because we're testing a hand-rolled parser — no library deps.

function syncsafeBytes(n) {
  return [(n >> 21) & 0x7f, (n >> 14) & 0x7f, (n >> 7) & 0x7f, n & 0x7f];
}

function regularSizeBytes(n) {
  return [(n >> 24) & 0xff, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function utf8FrameData(text) {
  return [0x03, ...new TextEncoder().encode(text)]; // 0x03 = UTF-8 encoding byte
}

function utf16FrameData(text) {
  const bytes = [];
  // UTF-16LE with BOM (0xFF 0xFE), matching encoding byte 0x01
  bytes.push(0xff, 0xfe);
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    bytes.push(code & 0xff, (code >> 8) & 0xff);
  }
  return [0x01, ...bytes];
}

function buildFrame(id, dataBytes, { version = 3 } = {}) {
  const idBytes = Array.from(id).map((c) => c.charCodeAt(0));
  const sizeBytes =
    version >= 4 ? syncsafeBytes(dataBytes.length) : regularSizeBytes(dataBytes.length);
  return [...idBytes, ...sizeBytes, 0x00, 0x00, ...dataBytes]; // 2 flag bytes = 0
}

function buildId3Tag({ version = 3, frames = [], paddingBytes = 0 } = {}) {
  const frameBytes = frames.flat();
  const padding = new Array(paddingBytes).fill(0);
  const declaredSize = frameBytes.length + padding.length;
  const header = [0x49, 0x44, 0x33, version, 0, 0, ...syncsafeBytes(declaredSize)];
  return new Uint8Array([...header, ...frameBytes, ...padding]);
}

function makeId3File(bytes) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return {
    slice(start, end) {
      const sliced = arr.slice(start, end);
      return { arrayBuffer: async () => sliced.buffer };
    },
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("readId3Tags — no usable tag", () => {
  it("returns {} when the file has no ID3v2 magic bytes", async () => {
    const file = makeId3File(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]));
    expect(await readId3Tags(file)).toEqual({});
  });

  it("returns {} for an ID3 version below 2", async () => {
    const tag = buildId3Tag({ version: 1, frames: [] });
    expect(await readId3Tags(makeId3File(tag))).toEqual({});
  });

  it("returns {} for an ID3 version above 4", async () => {
    const tag = buildId3Tag({ version: 5, frames: [] });
    expect(await readId3Tags(makeId3File(tag))).toEqual({});
  });
});

describe("readId3Tags — TIT2/TPE1/TBPM extraction (v2.3, UTF-8)", () => {
  it("extracts title from a TIT2 frame", async () => {
    const tag = buildId3Tag({
      version: 3,
      frames: [buildFrame("TIT2", utf8FrameData("Midnight Run"))],
    });
    expect(await readId3Tags(makeId3File(tag))).toEqual({ title: "Midnight Run" });
  });

  it("extracts artist from a TPE1 frame", async () => {
    const tag = buildId3Tag({
      version: 3,
      frames: [buildFrame("TPE1", utf8FrameData("D"))],
    });
    expect(await readId3Tags(makeId3File(tag))).toEqual({ artist: "D" });
  });

  it("extracts all three tags together", async () => {
    const tag = buildId3Tag({
      version: 3,
      frames: [
        buildFrame("TIT2", utf8FrameData("Drift")),
        buildFrame("TPE1", utf8FrameData("D")),
        buildFrame("TBPM", utf8FrameData("124")),
      ],
    });
    expect(await readId3Tags(makeId3File(tag))).toEqual({
      title: "Drift",
      artist: "D",
      bpm: 124,
    });
  });

  it("ignores unknown frame types but keeps parsing subsequent known frames", async () => {
    const tag = buildId3Tag({
      version: 3,
      frames: [
        buildFrame("TALB", utf8FrameData("Some Album")),
        buildFrame("TIT2", utf8FrameData("Drift")),
      ],
    });
    expect(await readId3Tags(makeId3File(tag))).toEqual({ title: "Drift" });
  });

  it("strips null terminators and trims whitespace from text frames", async () => {
    const tag = buildId3Tag({
      version: 3,
      frames: [buildFrame("TIT2", utf8FrameData("Drift\0\0"))],
    });
    expect(await readId3Tags(makeId3File(tag))).toEqual({ title: "Drift" });
  });

  it("a frame that decodes to an empty string yields null, not an empty string", async () => {
    const tag = buildId3Tag({
      version: 3,
      frames: [buildFrame("TIT2", utf8FrameData("\0\0\0"))],
    });
    expect(await readId3Tags(makeId3File(tag))).toEqual({ title: null });
  });
});

describe("readId3Tags — TBPM range validation", () => {
  it("accepts a BPM within the valid 0-300 range", async () => {
    const tag = buildId3Tag({
      version: 3,
      frames: [buildFrame("TBPM", utf8FrameData("174.5"))],
    });
    expect(await readId3Tags(makeId3File(tag))).toEqual({ bpm: 174.5 });
  });

  it("rejects a BPM of 0 or below", async () => {
    const tag = buildId3Tag({
      version: 3,
      frames: [buildFrame("TBPM", utf8FrameData("0"))],
    });
    expect(await readId3Tags(makeId3File(tag))).toEqual({});
  });

  it("rejects a BPM above 300", async () => {
    const tag = buildId3Tag({
      version: 3,
      frames: [buildFrame("TBPM", utf8FrameData("301"))],
    });
    expect(await readId3Tags(makeId3File(tag))).toEqual({});
  });

  it("accepts exactly 300 (inclusive boundary)", async () => {
    const tag = buildId3Tag({
      version: 3,
      frames: [buildFrame("TBPM", utf8FrameData("300"))],
    });
    expect(await readId3Tags(makeId3File(tag))).toEqual({ bpm: 300 });
  });

  it("rejects a non-numeric BPM string", async () => {
    const tag = buildId3Tag({
      version: 3,
      frames: [buildFrame("TBPM", utf8FrameData("not-a-number"))],
    });
    expect(await readId3Tags(makeId3File(tag))).toEqual({});
  });
});

describe("readId3Tags — UTF-16 encoded frames", () => {
  it("decodes a UTF-16 (encoding byte 0x01) TIT2 frame", async () => {
    const tag = buildId3Tag({
      version: 3,
      frames: [buildFrame("TIT2", utf16FrameData("Night Drive"))],
    });
    expect(await readId3Tags(makeId3File(tag))).toEqual({ title: "Night Drive" });
  });
});

describe("readId3Tags — ID3v2.4 syncsafe frame sizes", () => {
  it("parses a v2.4 tag using syncsafe-encoded frame sizes", async () => {
    const tag = buildId3Tag({
      version: 4,
      frames: [buildFrame("TIT2", utf8FrameData("v4 Track"), { version: 4 })],
    });
    expect(await readId3Tags(makeId3File(tag))).toEqual({ title: "v4 Track" });
  });
});

describe("readId3Tags — malformed/truncated tags don't throw", () => {
  it("stops parsing at a zero-size frame instead of looping forever", async () => {
    // 10-byte frame header declaring size=0, with extra declared tag room
    // after it so the loop actually enters and hits the size<=0 break
    // (rather than being rejected earlier by the "room for a header" check).
    const zeroSizeFrame = [...Array.from("TIT2").map((c) => c.charCodeAt(0)), 0, 0, 0, 0, 0, 0];
    const tag = buildId3Tag({ version: 3, frames: [zeroSizeFrame], paddingBytes: 10 });
    await expect(readId3Tags(makeId3File(tag))).resolves.toEqual({});
  });

  it("stops parsing when a frame's declared size would overrun the buffer", async () => {
    const oversizedFrame = buildFrame("TIT2", utf8FrameData("x"));
    oversizedFrame[4] = 0x7f; // inflate the size byte so dataEnd exceeds the buffer
    const tag = buildId3Tag({ version: 3, frames: [oversizedFrame] });
    await expect(readId3Tags(makeId3File(tag))).resolves.toEqual({});
  });

  it("stops parsing cleanly at padding (a null byte where a frame id should start)", async () => {
    const tag = buildId3Tag({
      version: 3,
      frames: [buildFrame("TIT2", utf8FrameData("Drift"))],
      paddingBytes: 20, // standard ID3v2 trailing padding, declared within tagSize
    });
    await expect(readId3Tags(makeId3File(tag))).resolves.toEqual({ title: "Drift" });
  });
});
