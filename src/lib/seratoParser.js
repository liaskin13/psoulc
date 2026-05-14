const FREQ_BANDS = {
  low: "#1464dc",
  mid: "#14dc14",
  high: "#e56020",
};

function syncsafeToInt(b, o) {
  return ((b[o] & 0x7f) << 21) | ((b[o + 1] & 0x7f) << 14) | ((b[o + 2] & 0x7f) << 7) | (b[o + 3] & 0x7f);
}

function uint32BE(b, o) {
  return b[o] * 0x1000000 + (b[o + 1] << 16) + (b[o + 2] << 8) + b[o + 3];
}

function seratoBytesToBars(rawData) {
  const bytes = rawData.slice(2); // skip 2-byte Serato version header
  const isColored = bytes.length > 0 && bytes.length % 3 === 0;
  const bars = [];
  if (isColored) {
    for (let i = 0; i < bytes.length; i += 3) {
      const lo = bytes[i], mi = bytes[i + 1], hi = bytes[i + 2];
      const peak = Math.max(lo, mi, hi) / 255;
      const freq = lo >= mi && lo >= hi ? FREQ_BANDS.low
                 : mi >= hi            ? FREQ_BANDS.mid
                                       : FREQ_BANDS.high;
      bars.push({ peak, freq });
    }
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bars.push({ peak: bytes[i] / 255, freq: FREQ_BANDS.mid });
    }
  }
  return bars;
}

function resample(bars, targetCount) {
  if (bars.length === 0 || targetCount === 0) return [];
  if (bars.length === targetCount) return bars.slice();
  const ratio = (bars.length - 1) / Math.max(targetCount - 1, 1);
  const result = [];
  for (let i = 0; i < targetCount; i++) {
    const pos = i * ratio;
    const lo = Math.floor(pos);
    const hi = Math.min(lo + 1, bars.length - 1);
    const t = pos - lo;
    result.push({
      peak: bars[lo].peak * (1 - t) + bars[hi].peak * t,
      freq: bars[Math.round(pos)].freq,
    });
  }
  return result;
}

function parseSeratoOverviewFromBytes(bytes) {
  if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) return null;

  const version = bytes[3];
  if (version < 3) return null;

  const tagSize = syncsafeToInt(bytes, 6) + 10;

  let offset = 10;
  while (offset + 10 <= tagSize && offset + 10 <= bytes.length) {
    const frameId = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
    const frameSize = version === 4
      ? syncsafeToInt(bytes, offset + 4)
      : uint32BE(bytes, offset + 4);

    offset += 10;

    if (frameSize <= 0 || offset + frameSize > bytes.length) break;

    if (frameId === "GEOB") {
      const frame = bytes.slice(offset, offset + frameSize);
      let pos = 1;
      while (pos < frame.length && frame[pos] !== 0) pos++;
      pos++;
      while (pos < frame.length && frame[pos] !== 0) pos++;
      pos++;

      const descStart = pos;
      while (pos < frame.length && frame[pos] !== 0) pos++;
      const description = new TextDecoder().decode(frame.slice(descStart, pos));
      pos++;

      if (description === "Serato Overview") {
        const bars = seratoBytesToBars(frame.slice(pos));
        if (bars.length === 0) return null;
        return { bars, low: resample(bars, 80), high: resample(bars, 1000) };
      }
    }

    offset += frameSize;
  }

  return null;
}

/**
 * Read Serato GEOB "Serato Overview" tag from a URL via a 256KB range request.
 * Returns {bars, low (80), high (1000)} in PSC waveform format, or null.
 * Works on any R2 URL — no full-file download, sub-second.
 */
export async function parseSeratoOverviewFromUrl(url) {
  try {
    const res = await fetch(url, { headers: { Range: "bytes=0-4194303" } });
    if (!res.ok && res.status !== 206) return null;
    const buffer = await res.arrayBuffer();
    return parseSeratoOverviewFromBytes(new Uint8Array(buffer));
  } catch {
    return null;
  }
}

/**
 * Read Serato GEOB "Serato Overview" tag from a File object.
 * Returns {bars, low (80), high (1000)} in PSC waveform format, or null.
 * Reads only the first 256KB — no full-file decode needed.
 *
 * ID3v2.3: frame sizes are plain uint32 (NOT syncsafe)
 * ID3v2.4: frame sizes are syncsafe integers
 * Getting this wrong silently misses every GEOB frame.
 */
export async function parseSeratoOverview(file) {
  try {
    const buffer = await file.slice(0, 256 * 1024).arrayBuffer();
    return parseSeratoOverviewFromBytes(new Uint8Array(buffer));
  } catch {
    return null;
  }
}
