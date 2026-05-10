// Audio preprocessor: generate waveform before upload
// Analyzes audio file client-side to avoid post-upload download lag

const FREQ_BANDS = {
  low:  { color: "#1464dc" }, // bass — blue
  mid:  { color: "#14dc14" }, // mids — green
  high: { color: "#e56020" }, // treble — orange
};

// Determine dominant frequency band from raw PCM samples using inter-sample
// roughness. High-frequency signals oscillate rapidly → high normalized roughness.
// Low-frequency signals are smooth → low normalized roughness.
// This avoids amplitude-only thresholds which produce all-green waveforms.
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
 * Process audio file: generate waveform before upload
 * @param {File} file - Original audio file
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<{waveformData: Object, duration: number}>}
 */
export async function preprocessAudio(file, onProgress = null) {
  if (onProgress) onProgress(10);

  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  audioContext.close();

  if (onProgress) onProgress(60);

  const waveformData = {
    high: generateWaveformData(audioBuffer, 1000),
    low:  generateWaveformData(audioBuffer, 80),
  };

  if (onProgress) onProgress(100);

  return {
    waveformData,
    duration: audioBuffer.duration,
  };
}

/**
 * Re-analyze a track from its remote URL — used to backfill waveform data
 * for tracks uploaded before the preprocessor existed.
 * @param {string} url - Public audio URL
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<{waveformData: Object, duration: number}>}
 */
export async function reanalyzeFromUrl(url, onProgress = null) {
  if (onProgress) onProgress(5);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch audio: ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();

  if (onProgress) onProgress(40);

  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  audioContext.close();

  if (onProgress) onProgress(75);

  const waveformData = {
    high: generateWaveformData(audioBuffer, 1000),
    low:  generateWaveformData(audioBuffer, 80),
  };

  if (onProgress) onProgress(100);

  return { waveformData, duration: audioBuffer.duration };
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
