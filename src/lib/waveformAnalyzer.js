// Client-side waveform analyzer using Web Audio API
// Generates frequency-colored peak data for Serato-style visualization

const WORKER_URL = "https://psc-upload-worker.psoulc.workers.dev";

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
  low:  { color: "#1464dc" }, // bass — blue
  mid:  { color: "#14dc14" }, // mids — green
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
  if (normRoughness < 0.6)  return FREQ_BANDS.low.color;
  if (normRoughness > 1.4)  return FREQ_BANDS.high.color;
  return FREQ_BANDS.mid.color;
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

  const audioContext = new OfflineAudioContext(2, 44100 * 30, 44100);
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const highRes = generateWaveformData(audioBuffer, highResSamples);
  const lowRes  = generateWaveformData(audioBuffer, lowResSamples);

  return { high: highRes, low: lowRes };
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
export async function saveWaveform(trackId, waveformData) {
  const res = await fetch(`${WORKER_URL}/tracks/${trackId}/waveform`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ waveform_data: waveformData }),
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
  const waveformData = await analyzeAudio(audioUrl);
  if (onProgress) onProgress(80);
  await saveWaveform(trackId, waveformData);
  if (onProgress) onProgress(100);
  return waveformData;
}
