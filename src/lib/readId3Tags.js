// ── Lightweight ID3v2 parser ────────────────────────────────────────────────
// Reads only TIT2, TPE1, and TBPM frames from ID3v2.3/2.4 tags.
// Operates on the first 16KB of the file — enough for any typical ID3 header.

function syncsafeToInt(bytes, offset) {
  return (
    ((bytes[offset] & 0x7f) << 21) |
    ((bytes[offset + 1] & 0x7f) << 14) |
    ((bytes[offset + 2] & 0x7f) << 7) |
    (bytes[offset + 3] & 0x7f)
  );
}

function readId3Frame(bytes, offset, version) {
  const id = String.fromCharCode(
    bytes[offset],
    bytes[offset + 1],
    bytes[offset + 2],
    bytes[offset + 3],
  );
  const size =
    version >= 4
      ? syncsafeToInt(bytes, offset + 4)
      : (bytes[offset + 4] << 24) |
        (bytes[offset + 5] << 16) |
        (bytes[offset + 6] << 8) |
        bytes[offset + 7];
  const dataStart = offset + 10;
  const dataEnd = dataStart + size;
  return { id, size, dataStart, dataEnd };
}

function decodeTextFrame(bytes, start, end) {
  const enc = bytes[start];
  const raw = bytes.slice(start + 1, end);
  try {
    if (enc === 1 || enc === 2) return new TextDecoder("utf-16").decode(raw);
    return new TextDecoder("utf-8").decode(raw);
  } catch (_) {
    return null;
  }
}

export async function readId3Tags(file) {
  const slice = file.slice(0, 16384);
  const buf = await slice.arrayBuffer();
  const bytes = new Uint8Array(buf);

  // Check for ID3v2 magic
  if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) return {};
  const version = bytes[3];
  if (version < 2 || version > 4) return {};

  const tagSize = syncsafeToInt(bytes, 6) + 10;
  const result = {};
  let offset = 10;

  while (offset + 10 < tagSize && offset + 10 < bytes.length) {
    if (bytes[offset] === 0) break;
    const frame = readId3Frame(bytes, offset, version);
    if (frame.size <= 0 || frame.dataEnd > bytes.length) break;

    if (frame.id === "TIT2") {
      result.title =
        decodeTextFrame(bytes, frame.dataStart, frame.dataEnd)
          ?.replace(/\0/g, "")
          .trim() || null;
    }
    if (frame.id === "TPE1") {
      result.artist =
        decodeTextFrame(bytes, frame.dataStart, frame.dataEnd)
          ?.replace(/\0/g, "")
          .trim() || null;
    }
    if (frame.id === "TBPM") {
      const raw = decodeTextFrame(bytes, frame.dataStart, frame.dataEnd)
        ?.replace(/\0/g, "")
        .trim();
      const bpm = Number.parseFloat(raw);
      if (bpm > 0 && bpm <= 300) result.bpm = bpm;
    }
    offset = frame.dataEnd;
  }
  return result;
}
