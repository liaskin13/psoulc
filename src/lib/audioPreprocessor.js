// Audio preprocessor: generate waveform before upload
// Analyzes audio file client-side to avoid post-upload download lag

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
    high: generateWaveformDataBands(audioBuffer, 1000),
    low:  generateWaveformDataBands(audioBuffer, 80),
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
    high: generateWaveformDataBands(audioBuffer, 1000),
    low:  generateWaveformDataBands(audioBuffer, 80),
  };

  if (onProgress) onProgress(100);

  return { waveformData, duration: audioBuffer.duration };
}

/**
 * Generate 3-band waveform data using two cascaded single-pole IIR lowpass filters.
 *
 * Two filters in series:
 *   LP-200Hz → bass signal
 *   LP-2500Hz → bass+mid signal; high = original − LP-2500Hz
 *   mid = LP-2500Hz − LP-200Hz
 *
 * Each band is independently normalized so that quiet-but-real content
 * (e.g. hi-hats in a dense mix) remains visible. A 2% floor relative to
 * the overall peak prevents near-silence from being amplified to full scale.
 *
 * Returns [{bass, mid, high, peak}] — all values 0-1.
 */
function generateWaveformDataBands(audioBuffer, barCount) {
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate  = audioBuffer.sampleRate;
  const total       = channelData.length;
  const samplesPerBar = Math.floor(total / barCount);

  // Single-pole IIR coefficient: α = 1 − exp(−2π·fc/fs)
  const aLow  = 1 - Math.exp(-2 * Math.PI * 200  / sampleRate); // 200 Hz  → bass
  const aHigh = 1 - Math.exp(-2 * Math.PI * 2500 / sampleRate); // 2500 Hz → mid/high split

  let lpLowState  = 0; // filter state for the 200 Hz LP
  let lpHighState = 0; // filter state for the 2500 Hz LP

  const bars = [];

  for (let i = 0; i < barCount; i++) {
    const start = i * samplesPerBar;
    const end   = Math.min(start + samplesPerBar, total);

    let bassPeak = 0, midPeak = 0, highPeak = 0, allPeak = 0;

    for (let j = start; j < end; j++) {
      const x = channelData[j];

      lpLowState  = aLow  * x + (1 - aLow)  * lpLowState;
      lpHighState = aHigh * x + (1 - aHigh) * lpHighState;

      const bassVal = lpLowState;
      const midVal  = lpHighState - lpLowState; // 200–2500 Hz band
      const highVal = x - lpHighState;          // above 2500 Hz

      const absBass = Math.abs(bassVal);
      const absMid  = Math.abs(midVal);
      const absHigh = Math.abs(highVal);
      const absAll  = Math.abs(x);

      if (absBass > bassPeak) bassPeak = absBass;
      if (absMid  > midPeak)  midPeak  = absMid;
      if (absHigh > highPeak) highPeak = absHigh;
      if (absAll  > allPeak)  allPeak  = absAll;
    }

    bars.push({ bass: bassPeak, mid: midPeak, high: highPeak, peak: allPeak });
  }

  // Global peak for the floor calculation
  let maxPeak = 0;
  for (const b of bars) if (b.peak > maxPeak) maxPeak = b.peak;
  maxPeak = Math.max(maxPeak, 0.0001);

  // Per-band max with 2% floor so absent bands don't get boosted
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
