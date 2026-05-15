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
  const bytes = rawData.slice(2);
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

// --- Serato ID3 / RIFF parsing ---

function parseSeratoId3(bytes) {
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

    if (frameSize <= 0) break;
    if (offset + frameSize > bytes.length) { offset += frameSize; continue; }

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

function extractId3FromWav(bytes) {
  if (bytes.length < 12) return null;
  if (bytes[8] !== 0x57 || bytes[9] !== 0x41 || bytes[10] !== 0x56 || bytes[11] !== 0x45) return null;

  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const id = String.fromCharCode(bytes[offset], bytes[offset+1], bytes[offset+2], bytes[offset+3]);
    const size = bytes[offset+4] | (bytes[offset+5] << 8) | (bytes[offset+6] << 16) | (bytes[offset+7] << 24);
    offset += 8;

    if (size < 0 || size > bytes.length) break;

    if (id === "id3 " || id === "ID3 ") {
      return bytes.slice(offset, offset + size);
    }

    offset += size + (size & 1);
  }
  return null;
}

function parseSeratoOverviewFromBytes(bytes) {
  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    return parseSeratoId3(bytes);
  }

  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
    const id3 = extractId3FromWav(bytes);
    if (id3 && id3[0] === 0x49 && id3[1] === 0x44 && id3[2] === 0x33) return parseSeratoId3(id3);
  }

  return null;
}

// --- WAV PCM waveform generation (for files without Serato tags) ---

function fftInPlace(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      let t = re[i]; re[i] = re[j]; re[j] = t;
      t = im[i]; im[i] = im[j]; im[j] = t;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const cosW = Math.cos(ang), sinW = Math.sin(ang);
    const half = len >> 1;
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let j = 0; j < half; j++) {
        const a = i + j, b = a + half;
        const tr = re[b] * cr - im[b] * ci;
        const ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti;
        re[a] += tr; im[a] += ti;
        const ncr = cr * cosW - ci * sinW;
        ci = cr * sinW + ci * cosW;
        cr = ncr;
      }
    }
  }
}

// Parse key WAV header fields from the first 256 bytes
function parseWavInfo(bytes) {
  if (bytes[0] !== 0x52 || bytes[1] !== 0x49 || bytes[2] !== 0x46 || bytes[3] !== 0x46) return null;
  if (bytes[8] !== 0x57 || bytes[9] !== 0x41 || bytes[10] !== 0x56 || bytes[11] !== 0x45) return null;

  let offset = 12, numChannels = 0, sampleRate = 0, bitsPerSample = 0;
  let dataStart = 0, dataSize = 0;

  while (offset + 8 <= bytes.length) {
    const id = String.fromCharCode(bytes[offset], bytes[offset+1], bytes[offset+2], bytes[offset+3]);
    const sz = (bytes[offset+4] | (bytes[offset+5] << 8) | (bytes[offset+6] << 16) | (bytes[offset+7] << 24)) >>> 0;
    offset += 8;

    if (id === "fmt ") {
      numChannels   = bytes[offset+2] | (bytes[offset+3] << 8);
      sampleRate    = (bytes[offset+4] | (bytes[offset+5] << 8) | (bytes[offset+6] << 16) | (bytes[offset+7] << 24)) >>> 0;
      bitsPerSample = bytes[offset+14] | (bytes[offset+15] << 8);
    } else if (id === "data") {
      dataStart = offset;
      dataSize  = sz;
      break;
    }

    offset += sz + (sz & 1);
  }

  if (!numChannels || !sampleRate || !bitsPerSample || !dataStart || !dataSize) return null;
  return { numChannels, sampleRate, bitsPerSample, dataStart, dataSize };
}

// Analyze one PCM window → { rawPeak, freq } using FFT
// FFT_N must be power-of-2; windowBytes = FFT_N * bytesPerFrame
const FFT_N = 512;

function analyzeWindow(pcmBytes, bitsPerSample, numChannels) {
  const bytesPerFrame = numChannels * (bitsPerSample >> 3);
  const numFrames = Math.min(FFT_N, Math.floor(pcmBytes.length / bytesPerFrame));
  const re = new Float32Array(FFT_N);
  const im = new Float32Array(FFT_N);

  for (let i = 0; i < numFrames; i++) {
    let s = 0;
    for (let ch = 0; ch < numChannels; ch++) {
      const off = i * bytesPerFrame + ch * (bitsPerSample >> 3);
      if (bitsPerSample === 16) {
        let v = pcmBytes[off] | (pcmBytes[off + 1] << 8);
        if (v >= 32768) v -= 65536;
        s += v / 32768;
      } else if (bitsPerSample === 24) {
        let v = pcmBytes[off] | (pcmBytes[off+1] << 8) | (pcmBytes[off+2] << 16);
        if (v >= 8388608) v -= 16777216;
        s += v / 8388608;
      } else if (bitsPerSample === 32) {
        let v = pcmBytes[off] | (pcmBytes[off+1] << 8) | (pcmBytes[off+2] << 16) | (pcmBytes[off+3] << 24);
        s += v / 2147483648;
      }
    }
    // Hanning window
    re[i] = (s / numChannels) * 0.5 * (1 - Math.cos(2 * Math.PI * i / (numFrames - 1)));
  }

  fftInPlace(re, im);

  // Frequency resolution: sampleRate / FFT_N — but we don't have sampleRate here.
  // Use bin index proportions: low = first ~4%, mid = 4-17%, high = 17-100% of halfN.
  // At 48kHz/512: bin=1 → 93Hz, bin=20 → 1875Hz, bin=88 → 8250Hz
  // These thresholds give bass/mid/high split at ~375Hz and ~4.5kHz — musically sensible.
  const halfN = FFT_N >> 1;
  const lowTop = Math.max(2, Math.floor(halfN * 0.04));   // ~375 Hz at 48kHz
  const midTop = Math.max(lowTop + 1, Math.floor(halfN * 0.17)); // ~4.5 kHz at 48kHz

  let lo = 0, mi = 0, hi = 0;
  for (let i = 1; i < halfN; i++) {
    const mag = Math.sqrt(re[i] * re[i] + im[i] * im[i]);
    if (i <= lowTop) lo = Math.max(lo, mag);
    else if (i <= midTop) mi = Math.max(mi, mag);
    else hi = Math.max(hi, mag);
  }

  const rawPeak = Math.max(lo, mi, hi);
  const freq = lo >= mi && lo >= hi ? FREQ_BANDS.low
             : mi >= hi             ? FREQ_BANDS.mid
                                    : FREQ_BANDS.high;
  return { rawPeak, freq };
}

// Generate Serato-compatible waveform bars from a raw PCM WAV URL.
// Makes 240 small range requests (batched 8 at a time) — total ~240KB fetched.
async function generateWaveformFromWavUrl(url, firstChunk) {
  const info = parseWavInfo(firstChunk);
  if (!info) return null;

  const { numChannels, bitsPerSample, dataStart, dataSize } = info;
  const bytesPerFrame = numChannels * (bitsPerSample >> 3);
  const windowBytes   = FFT_N * bytesPerFrame;
  const numBars       = 240;
  const stride        = Math.max(windowBytes, Math.floor(dataSize / numBars));

  const rawBars = new Array(numBars);
  const BATCH   = 8;

  for (let batch = 0; batch < numBars; batch += BATCH) {
    const end = Math.min(batch + BATCH, numBars);
    await Promise.all(
      Array.from({ length: end - batch }, (_, k) => {
        const i       = batch + k;
        const bytePos = dataStart + i * stride;
        const endPos  = bytePos + windowBytes - 1;
        return fetch(url, { headers: { Range: `bytes=${bytePos}-${endPos}` } })
          .then(r => r.arrayBuffer())
          .then(buf => { rawBars[i] = analyzeWindow(new Uint8Array(buf), bitsPerSample, numChannels); })
          .catch(() => { rawBars[i] = { rawPeak: 0, freq: FREQ_BANDS.mid }; });
      })
    );
  }

  // Normalize peaks across all bars (linear, so loudest bar = 1.0)
  const maxPeak = Math.max(...rawBars.map(b => b.rawPeak), 1e-9);
  const bars = rawBars.map(b => ({ peak: b.rawPeak / maxPeak, freq: b.freq }));

  return { bars, low: resample(bars, 80), high: resample(bars, 1000) };
}

// --- Public API ---

export async function parseSeratoOverviewFromUrl(url) {
  try {
    const res = await fetch(url, { headers: { Range: "bytes=0-4194303" } });
    if (!res.ok && res.status !== 206) return null;
    const buffer = await res.arrayBuffer();
    const bytes  = new Uint8Array(buffer);

    // Try Serato GEOB tags (MP3 ID3 or WAV id3 chunk)
    const serato = parseSeratoOverviewFromBytes(bytes);
    if (serato) return serato;

    // Raw WAV with no Serato tags — generate from PCM using sparse sampling
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
      return generateWaveformFromWavUrl(url, bytes);
    }

    return null;
  } catch {
    return null;
  }
}

export async function parseSeratoOverview(file) {
  try {
    const buffer = await file.slice(0, 256 * 1024).arrayBuffer();
    return parseSeratoOverviewFromBytes(new Uint8Array(buffer));
  } catch {
    return null;
  }
}
