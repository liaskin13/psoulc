// Client-side waveform analyzer using Web Audio API
// Generates 3-band frequency data for layered spectral visualization

import { UPLOAD_WORKER_URL, UPLOAD_SECRET } from "../config";

const WORKER_URL = UPLOAD_WORKER_URL;

// Serato cue color palette (exact)
export const SERATO_COLORS = [
  "#CC0000", // red (Serato #1)
  "#CC8800", // orange-brown (Serato #3)
  "#CCCC00", // yellow (Serato #4)
  "#00CC00", // green (Serato #7)
  "#00CCCC", // cyan (Serato #10)
  "#0044CC", // blue (Serato #12)
  "#8800CC", // purple (Serato #15)
  "#E5E5E5", // white/grey
];

/**
 * Analyze audio and generate 3-band waveform data.
 * Returns [{bass, mid, high, peak}] bars where all values are 0-1.
 *
 * Uses cascaded single-pole IIR lowpass filters:
 *   LP-200Hz  → bass
 *   LP-2500Hz → bass+mid; high = original − LP-2500Hz
 *   mid = LP-2500Hz − LP-200Hz
 */
export async function analyzeAudio(
  audioUrl,
  highResSamples = 1000,
  lowResSamples = 80,
  barsPerSec = null,
) {
  const response = await fetch(audioUrl);
  if (!response.ok)
    throw new Error(`Failed to fetch audio: ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();

  const audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const actualHighRes = barsPerSec
    ? Math.min(Math.ceil(audioBuffer.duration * barsPerSec), 250000)
    : highResSamples;

  const highRes = generateWaveformDataBands(audioBuffer, actualHighRes);
  const lowRes  = generateWaveformDataBands(audioBuffer, lowResSamples);

  return { high: highRes, low: lowRes, duration: audioBuffer.duration };
}

/**
 * Generate 3-band waveform data using two cascaded single-pole IIR lowpass filters.
 *
 * Each band is independently normalized so quiet content stays visible.
 * A 2% floor relative to the overall peak prevents absent bands from
 * being amplified to full scale.
 *
 * Returns [{bass, mid, high, peak}] — all values 0-1.
 */
function generateWaveformDataBands(audioBuffer, barCount) {
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate  = audioBuffer.sampleRate;
  const total       = channelData.length;
  const samplesPerBar = Math.floor(total / barCount);

  // Single-pole IIR coefficient: α = 1 − exp(−2π·fc/fs)
  const aLow  = 1 - Math.exp(-2 * Math.PI * 200  / sampleRate);
  const aHigh = 1 - Math.exp(-2 * Math.PI * 2500 / sampleRate);

  let lpLowState  = 0;
  let lpHighState = 0;

  const bars = [];

  for (let i = 0; i < barCount; i++) {
    const start = i * samplesPerBar;
    const end   = Math.min(start + samplesPerBar, total);

    let bassPeak = 0, midPeak = 0, highPeak = 0, allPeak = 0;

    for (let j = start; j < end; j++) {
      const x = channelData[j];

      lpLowState  = aLow  * x + (1 - aLow)  * lpLowState;
      lpHighState = aHigh * x + (1 - aHigh) * lpHighState;

      const absBass = Math.abs(lpLowState);
      const absMid  = Math.abs(lpHighState - lpLowState);
      const absHigh = Math.abs(x - lpHighState);
      const absAll  = Math.abs(x);

      if (absBass > bassPeak) bassPeak = absBass;
      if (absMid  > midPeak)  midPeak  = absMid;
      if (absHigh > highPeak) highPeak = absHigh;
      if (absAll  > allPeak)  allPeak  = absAll;
    }

    bars.push({ bass: bassPeak, mid: midPeak, high: highPeak, peak: allPeak });
  }

  let maxPeak = 0;
  for (const b of bars) if (b.peak > maxPeak) maxPeak = b.peak;
  maxPeak = Math.max(maxPeak, 0.0001);

  let maxBass = 0, maxMid = 0, maxHigh = 0;
  for (const b of bars) {
    if (b.bass > maxBass) maxBass = b.bass;
    if (b.mid  > maxMid)  maxMid  = b.mid;
    if (b.high > maxHigh) maxHigh = b.high;
  }
  maxBass = Math.max(maxBass, maxPeak * 0.02);
  maxMid  = Math.max(maxMid,  maxPeak * 0.02);
  maxHigh = Math.max(maxHigh, maxPeak * 0.02);

  return bars.map(b => ({
    bass: Math.min(1, b.bass / maxBass),
    mid:  Math.min(1, b.mid  / maxMid),
    high: Math.min(1, b.high / maxHigh),
    peak: Math.min(1, b.peak / maxPeak),
  }));
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
 * Analyze and save waveform for a track (D1 only — legacy, kept for fallback)
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

/**
 * Pack bars array into a compact Uint8Array — 4 bytes per bar: bass, mid, high, peak (0–255).
 * Returns null for empty or invalid input.
 */
export function packToBinary(bars) {
  if (!bars || bars.length === 0) return null;
  const buf = new Uint8Array(bars.length * 4);
  for (let i = 0; i < bars.length; i++) {
    const b = bars[i];
    buf[i * 4]     = Math.round((b.bass ?? 0) * 255);
    buf[i * 4 + 1] = Math.round((b.mid  ?? 0) * 255);
    buf[i * 4 + 2] = Math.round((b.high ?? 0) * 255);
    buf[i * 4 + 3] = Math.round((b.peak ?? 0) * 255);
  }
  return buf;
}

/**
 * Decode a Uint8Array produced by packToBinary back into [{bass,mid,high,peak}] 0-1 floats.
 * Returns null if the buffer length is not a multiple of 4.
 */
export function unpackFromBinary(bytes) {
  if (!bytes || bytes.length % 4 !== 0) return null;
  const bars = new Array(bytes.length / 4);
  for (let i = 0; i < bars.length; i++) {
    bars[i] = {
      bass: bytes[i * 4]     / 255,
      mid:  bytes[i * 4 + 1] / 255,
      high: bytes[i * 4 + 2] / 255,
      peak: bytes[i * 4 + 3] / 255,
    };
  }
  return bars;
}

/**
 * Render a full-track waveform overview PNG using an OffscreenCanvas.
 * Returns a Blob (image/png) or null if OffscreenCanvas is unavailable.
 */
export async function renderWaveformPng(bars, width = 1200, height = 60) {
  if (typeof OffscreenCanvas === "undefined") return null;
  if (!bars || bars.length === 0) return null;

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, width, height);

  const N = bars.length;
  const barsPerPx = N / width;

  for (let px = 0; px < width; px++) {
    const bStart = Math.floor(px * barsPerPx);
    const bEnd   = Math.min(Math.ceil((px + 1) * barsPerPx) + 1, N);
    let maxPeak = 0, best = null;
    for (let b = bStart; b < bEnd; b++) {
      if (bars[b] && bars[b].peak > maxPeak) { maxPeak = bars[b].peak; best = bars[b]; }
    }
    if (!best) continue;
    const barH = Math.max(1, Math.round(maxPeak * height));
    const r = Math.round(best.bass * 255);
    const g = Math.round(best.mid  * 255);
    const bv = Math.round(best.high * 255);
    ctx.fillStyle = `rgb(${r},${g},${bv})`;
    ctx.fillRect(px, height - barH, 1, barH);
  }

  return canvas.convertToBlob({ type: "image/png" });
}

function uint8ToBase64(bytes) {
  let binary = "";
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/**
 * Upload high-res binary and PNG waveform assets to R2 via the worker.
 * Throws on non-2xx response.
 */
export async function uploadWaveformAssets(trackId, binaryBytes, pngBlob, onProgress) {
  if (onProgress) onProgress(80);

  const b64bin = binaryBytes ? uint8ToBase64(binaryBytes) : null;

  let b64png = null;
  if (pngBlob) {
    const pngBuf = await pngBlob.arrayBuffer();
    b64png = uint8ToBase64(new Uint8Array(pngBuf));
  }

  if (onProgress) onProgress(90);

  const res = await fetch(`${WORKER_URL}/tracks/${trackId}/waveform-assets`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "PSC-Secret": UPLOAD_SECRET,
    },
    body: JSON.stringify({ binary_b64: b64bin, png_b64: b64png }),
  });

  if (!res.ok) throw new Error(`Failed to upload waveform assets: ${res.status}`);
  if (onProgress) onProgress(100);
  return res.json();
}

/**
 * Full v2 waveform generation: analyze audio, pack to binary, render PNG, upload both to R2.
 * Returns the bars array so callers can use it immediately without re-fetching from R2.
 */
export async function generateAndUploadWaveformV2(trackId, audioUrl, onProgress) {
  if (onProgress) onProgress(5);

  const { high: bars, duration } = await analyzeAudio(audioUrl, 1000, 80);

  if (onProgress) onProgress(60);

  const binaryBytes = packToBinary(bars);
  const pngBlob = null;

  if (onProgress) onProgress(75);

  await uploadWaveformAssets(trackId, binaryBytes, pngBlob, (p) => {
    if (onProgress) onProgress(75 + Math.round(p * 0.25));
  });

  return { bars, duration };
}
