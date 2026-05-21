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
) {
  const response = await fetch(audioUrl);
  if (!response.ok)
    throw new Error(`Failed to fetch audio: ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();

  const audioContext = new OfflineAudioContext(2, 44100 * 30, 44100);
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const highRes = generateWaveformDataBands(audioBuffer, highResSamples);
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
