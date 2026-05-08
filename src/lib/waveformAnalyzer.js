// Client-side waveform analyzer using Web Audio API
// Generates frequency-colored peak data for Serato-style visualization

import { UPLOAD_WORKER_URL, UPLOAD_SECRET } from "../config";

const WORKER_URL = UPLOAD_WORKER_URL;

// Serato cue color palette (exact)
export const SERATO_COLORS = [
  "#e52020", // red
  "#e56020", // orange
  "#e5a020", // yellow/amber
  "#14dc14", // green
  "#00c8dc", // cyan
  "#1464dc", // blue
  "#8c14dc", // purple
  "#e5e5e5", // white/grey
];

// Frequency bands for Serato-style coloring
const FREQ_BANDS = {
  low: { color: "#1464dc" }, // bass — blue
  mid: { color: "#14dc14" }, // mids — green
  high: { color: "#e56020" }, // treble — orange
};

// Determine dominant frequency band from raw PCM samples using inter-sample
// roughness. High-frequency signals oscillate rapidly → high normalized roughness.
// Low-frequency signals are smooth → low normalized roughness.
function getFreqColor(samples) {
  if (samples.length < 2) return FREQ_BANDS.mid.color;
  let energy = 0;
  let roughness = 0;
  for (let i = 0; i < samples.length; i++) {
    energy += samples[i] * samples[i];
    if (i > 0) roughness += (samples[i] - samples[i - 1]) ** 2;
  }
  energy = Math.sqrt(energy / samples.length);
  if (energy < 0.001) return FREQ_BANDS.mid.color;
  const normRoughness = Math.sqrt(roughness / (samples.length - 1)) / energy;
  if (normRoughness < 0.6) return FREQ_BANDS.low.color;
  if (normRoughness > 1.4) return FREQ_BANDS.high.color;
  return FREQ_BANDS.mid.color;
}

function createDecodeAudioContext() {
  const AudioCtx = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AudioCtx) throw new Error("Web Audio API unavailable");
  return new AudioCtx();
}

async function decodeAudioBuffer(arrayBuffer) {
  const audioContext = createDecodeAudioContext();
  try {
    return await audioContext.decodeAudioData(arrayBuffer);
  } finally {
    if (typeof audioContext.close === "function") {
      try {
        await audioContext.close();
      } catch (_) {}
    }
  }
}

/**
 * Analyze audio and generate waveform data
 * @param {string} audioUrl - URL to the audio file
 * @param {number} highResSamples - Number of samples for deck waveform
 * @param {number} lowResSamples - Number of samples for preview waveform
 * @returns {Promise<{high: Array, low: Array}>}
 */
export async function analyzeAudio(
  audioUrl,
  highResSamples = 1000,
  lowResSamples = 80,
) {
  const response = await fetch(audioUrl);
  if (!response.ok)
    throw new Error(`Failed to fetch audio: ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await decodeAudioBuffer(arrayBuffer);

  const highRes = generateWaveformData(audioBuffer, highResSamples);
  const lowRes = generateWaveformData(audioBuffer, lowResSamples);

  return { high: highRes, low: lowRes, duration: audioBuffer.duration };
}

// Detect WAV/AIFF files that can be stream-analyzed without full decode
function isStreamableWav(file) {
  return (
    file.type === "audio/wav" ||
    file.type === "audio/x-wav" ||
    file.type === "audio/wave" ||
    /\.wav$/i.test(file.name)
  );
}

// Parse RIFF/WAV header from a small buffer (first 8KB).
// Returns null if not standard PCM or IEEE-float WAV.
function parseWavHeader(buffer) {
  if (buffer.byteLength < 44) return null;
  const view = new DataView(buffer);
  const u8 = new Uint8Array(buffer);
  const id = (off) =>
    String.fromCharCode(u8[off], u8[off + 1], u8[off + 2], u8[off + 3]);
  if (id(0) !== "RIFF" || id(8) !== "WAVE") return null;

  let offset = 12;
  let audioFormat, numChannels, sampleRate, bitsPerSample;
  let dataOffset = null;

  while (offset + 8 <= buffer.byteLength) {
    const chunkId = id(offset);
    const chunkSize = view.getUint32(offset + 4, true);
    if (chunkId === "fmt ") {
      audioFormat = view.getUint16(offset + 8, true);
      numChannels = view.getUint16(offset + 10, true);
      sampleRate = view.getUint32(offset + 12, true);
      bitsPerSample = view.getUint16(offset + 22, true);
    } else if (chunkId === "data") {
      dataOffset = offset + 8;
      break;
    }
    offset += 8 + chunkSize + (chunkSize & 1); // word-align
  }

  // audioFormat 1 = PCM int, 3 = IEEE float
  if (dataOffset === null || (audioFormat !== 1 && audioFormat !== 3))
    return null;
  return { audioFormat, numChannels, sampleRate, bitsPerSample, dataOffset };
}

// Stream a WAV file in 4MB chunks, computing peaks without loading the whole file.
// This is how Serato/Pioneer handle large files — they never decode everything at once.
async function analyzeWavStreaming(
  file,
  highResSamples,
  lowResSamples,
  onProgress,
) {
  const headerBuf = await file.slice(0, 8192).arrayBuffer();
  const wav = parseWavHeader(headerBuf);

  if (!wav) {
    // Not standard PCM WAV (compressed WAV, unusual variant) — fall back
    const ab = await file.arrayBuffer();
    const audioBuffer = await decodeAudioBuffer(ab);
    const high = generateWaveformData(audioBuffer, highResSamples);
    const low = generateWaveformData(audioBuffer, lowResSamples);
    return { high, low, duration: audioBuffer.duration };
  }

  const { audioFormat, numChannels, sampleRate, bitsPerSample, dataOffset } =
    wav;
  const bytesPerSample = bitsPerSample >> 3;
  const bytesPerFrame = bytesPerSample * numChannels;
  const dataBytes = file.size - dataOffset;
  const totalFrames = Math.floor(dataBytes / bytesPerFrame);
  const duration = totalFrames / sampleRate;

  // TypedArrays stay tiny regardless of file size
  const hPeak = new Float32Array(highResSamples);
  const hEnergy = new Float64Array(highResSamples);
  const hRough = new Float64Array(highResSamples);
  const lPeak = new Float32Array(lowResSamples);
  const lEnergy = new Float64Array(lowResSamples);
  const lRough = new Float64Array(lowResSamples);
  const hFPB = Math.ceil(totalFrames / highResSamples);
  const lFPB = Math.ceil(totalFrames / lowResSamples);

  const CHUNK = 4 * 1024 * 1024; // 4MB per read — constant RAM overhead
  let fileOff = dataOffset;
  let globalFrame = 0;
  let hPrev = 0,
    lPrev = 0;
  let chunksRead = 0;
  const totalChunks = Math.ceil(dataBytes / CHUNK);

  while (fileOff < file.size) {
    const end = Math.min(fileOff + CHUNK, file.size);
    const chunk = await file.slice(fileOff, end).arrayBuffer();
    const view = new DataView(chunk);
    const frames = Math.floor(chunk.byteLength / bytesPerFrame);

    for (let f = 0; f < frames; f++) {
      const byteOff = f * bytesPerFrame; // left channel is always first
      let s;
      if (audioFormat === 3) {
        s = view.getFloat32(byteOff, true);
      } else if (bitsPerSample === 16) {
        s = view.getInt16(byteOff, true) / 32768;
      } else if (bitsPerSample === 24) {
        const b0 = view.getUint8(byteOff),
          b1 = view.getUint8(byteOff + 1),
          b2 = view.getUint8(byteOff + 2);
        let v = (b2 << 16) | (b1 << 8) | b0;
        if (v & 0x800000) v |= ~0xffffff; // sign-extend 24→32 bit
        s = v / 8388608;
      } else if (bitsPerSample === 32) {
        s = view.getInt32(byteOff, true) / 2147483648;
      } else {
        s = 0;
      }

      const abs = s < 0 ? -s : s;
      const gf = globalFrame;

      // High-res bin
      const hIdx =
        ((gf / hFPB) | 0) < highResSamples
          ? (gf / hFPB) | 0
          : highResSamples - 1;
      if (abs > hPeak[hIdx]) hPeak[hIdx] = abs;
      hEnergy[hIdx] += s * s;
      const hd = s - hPrev;
      hRough[hIdx] += hd * hd;
      hPrev = s;

      // Low-res bin
      const lIdx =
        ((gf / lFPB) | 0) < lowResSamples ? (gf / lFPB) | 0 : lowResSamples - 1;
      if (abs > lPeak[lIdx]) lPeak[lIdx] = abs;
      lEnergy[lIdx] += s * s;
      const ld = s - lPrev;
      lRough[lIdx] += ld * ld;
      lPrev = s;

      globalFrame++;
    }

    fileOff += frames * bytesPerFrame;
    chunksRead++;
    if (onProgress) onProgress(Math.round((chunksRead / totalChunks) * 100));
  }

  // Convert accumulator arrays to waveform format
  const toWaveform = (peak, energy, rough, n) => {
    const result = [];
    for (let i = 0; i < n; i++) {
      let freq;
      const e = energy[i];
      if (e < 1e-8) {
        freq = FREQ_BANDS.mid.color;
      } else {
        // normRoughness = sqrt(rough/energy) — equivalent to existing getFreqColor math
        const r = Math.sqrt(rough[i] / e);
        freq =
          r < 0.6
            ? FREQ_BANDS.low.color
            : r > 1.4
              ? FREQ_BANDS.high.color
              : FREQ_BANDS.mid.color;
      }
      result.push({ peak: Math.min(peak[i], 1), freq });
    }
    return result;
  };

  return {
    high: toWaveform(hPeak, hEnergy, hRough, highResSamples),
    low: toWaveform(lPeak, lEnergy, lRough, lowResSamples),
    duration,
  };
}

/**
 * Analyze audio from a File object — no network round-trip.
 * WAV files (including 900MB+ masters) are streamed in 4MB chunks;
 * constant ~4MB RAM usage regardless of file size.
 * MP3/AAC/other fall back to AudioContext decode (fine for typical sizes).
 * @param {File} file
 * @param {number} highResSamples
 * @param {number} lowResSamples
 * @param {(pct: number) => void} [onProgress] - called 0→100 during streaming
 */
export async function analyzeAudioFile(
  file,
  highResSamples = 1000,
  lowResSamples = 80,
  onProgress,
) {
  if (isStreamableWav(file)) {
    return analyzeWavStreaming(file, highResSamples, lowResSamples, onProgress);
  }
  // Non-WAV (MP3, M4A, etc.) — full decode; acceptable for compressed files
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await decodeAudioBuffer(arrayBuffer);
  if (onProgress) onProgress(100);
  const high = generateWaveformData(audioBuffer, highResSamples);
  const low = generateWaveformData(audioBuffer, lowResSamples);
  return { high, low, duration: audioBuffer.duration };
}

function generateWaveformData(audioBuffer, samples) {
  const channelData = audioBuffer.getChannelData(0);
  const samplesPerBin = Math.floor(channelData.length / samples);
  const waveform = [];

  for (let i = 0; i < samples; i++) {
    const start = i * samplesPerBin;
    const end = Math.min(start + samplesPerBin, channelData.length);
    let peak = 0;

    for (let j = start; j < end; j++) {
      const abs = Math.abs(channelData[j]);
      if (abs > peak) peak = abs;
    }

    const binSamples = channelData.subarray(start, end);
    waveform.push({ peak: Math.min(peak, 1), freq: getFreqColor(binSamples) });
  }

  return waveform;
}

/**
 * Save waveform data to database
 */
export async function saveWaveform(trackId, waveformData, duration) {
  const body = { waveform_data: waveformData };
  if (duration != null) body.duration = duration;
  const res = await fetch(`${WORKER_URL}/tracks/${trackId}/waveform`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "PSC-Secret": UPLOAD_SECRET,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to save waveform: ${res.status}`);
  const result = await res.json();
  return result.success;
}

/**
 * Analyze and save waveform for a track
 */
export async function generateAndSaveWaveform(trackId, audioUrl, onProgress) {
  if (onProgress) onProgress(10);
  const { high, low, duration } = await analyzeAudio(audioUrl);
  const waveformData = { high, low };
  if (onProgress) onProgress(80);
  await saveWaveform(trackId, waveformData, duration);
  if (onProgress) onProgress(100);
  return waveformData;
}
