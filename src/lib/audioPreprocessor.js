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

// Cooley-Tukey radix-2 FFT — in-place on interleaved [re, im, re, im, ...] Float32Array.
// N must be a power of 2.
function fft(buf) {
  const N = buf.length >> 1;
  // Bit-reversal permutation
  for (let i = 1, j = 0; i < N; i++) {
    let bit = N >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      let t = buf[2*i]; buf[2*i] = buf[2*j]; buf[2*j] = t;
      t = buf[2*i+1]; buf[2*i+1] = buf[2*j+1]; buf[2*j+1] = t;
    }
  }
  // FFT butterfly
  for (let len = 2; len <= N; len <<= 1) {
    const ang = -2 * Math.PI / len;
    const wRe = Math.cos(ang), wIm = Math.sin(ang);
    for (let i = 0; i < N; i += len) {
      let uRe = 1, uIm = 0;
      for (let j = 0; j < (len >> 1); j++) {
        const eRe = buf[2*(i+j)],   eIm = buf[2*(i+j)+1];
        const oRe = buf[2*(i+j+(len>>1))], oIm = buf[2*(i+j+(len>>1))+1];
        const tRe = uRe*oRe - uIm*oIm, tIm = uRe*oIm + uIm*oRe;
        buf[2*(i+j)]            = eRe + tRe;
        buf[2*(i+j)+1]          = eIm + tIm;
        buf[2*(i+j+(len>>1))]   = eRe - tRe;
        buf[2*(i+j+(len>>1))+1] = eIm - tIm;
        const nuRe = uRe*wRe - uIm*wIm;
        uIm = uRe*wIm + uIm*wRe;
        uRe = nuRe;
      }
    }
  }
}

/**
 * Generate 3-band waveform data using windowed FFT per bar.
 *
 * Each bar gets an independent spectral snapshot — no IIR state bleeds
 * between adjacent bars, so transients (kick hits, snare cracks) appear
 * as sharp spikes rather than smeared mountains.
 *
 * For each bar: extract a centered Hann-windowed analysis frame, run FFT,
 * compute RMS energy in bass/mid/high bins. Peak amplitude of the raw
 * samples is used for bar height (best transient visibility).
 *
 * Band boundaries (Serato-aligned):
 *   bass:  20–250 Hz  → RED channel
 *   mid:   250–2500 Hz → GREEN channel
 *   high:  2500+ Hz   → BLUE channel
 *
 * Each band is independently normalized with a 2% floor so quiet-but-real
 * content (hi-hats in a dense mix) remains visible.
 *
 * Returns [{bass, mid, high, peak}] — all values 0-1.
 */
export function generateWaveformDataBands(audioBuffer, barCount) {
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate  = audioBuffer.sampleRate;
  const total       = channelData.length;
  const samplesPerBar = Math.floor(total / barCount);

  // Analysis window: next power of 2, capped at 2048 samples (~46ms at 44100Hz).
  // Large enough to resolve bass frequencies; small enough for bar-level independence.
  let fftSize = 1;
  while (fftSize < samplesPerBar && fftSize < 2048) fftSize <<= 1;
  if (fftSize > 2048) fftSize = 2048;

  // Frequency bin boundaries
  const bassMaxBin = Math.max(1, Math.floor(250  * fftSize / sampleRate));
  const midMaxBin  = Math.max(bassMaxBin + 1, Math.floor(2500 * fftSize / sampleRate));
  const nyquist    = fftSize >> 1;

  // Pre-compute Hann window coefficients
  const hannWindow = new Float32Array(fftSize);
  for (let i = 0; i < fftSize; i++) {
    hannWindow[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (fftSize - 1)));
  }

  const fftBuf = new Float32Array(fftSize * 2); // interleaved re/im
  const bars = [];

  for (let i = 0; i < barCount; i++) {
    // Center the analysis window on the bar's midpoint
    const barCenter = Math.floor(i * samplesPerBar + samplesPerBar / 2);
    const frameStart = barCenter - (fftSize >> 1);

    // Fill FFT buffer with Hann-windowed samples (zero-pad at edges)
    for (let j = 0; j < fftSize; j++) {
      const idx = frameStart + j;
      const s = (idx >= 0 && idx < total) ? channelData[idx] : 0;
      fftBuf[2*j]   = s * hannWindow[j]; // real
      fftBuf[2*j+1] = 0;                  // imaginary
    }

    fft(fftBuf);

    // RMS energy per band from FFT magnitude bins 1..nyquist
    let bassSum = 0, midSum = 0, highSum = 0;
    let bassCt = 0, midCt = 0, highCt = 0;

    for (let b = 1; b <= nyquist; b++) {
      const mag = fftBuf[2*b]*fftBuf[2*b] + fftBuf[2*b+1]*fftBuf[2*b+1]; // magnitude²
      if (b <= bassMaxBin)       { bassSum += mag; bassCt++; }
      else if (b <= midMaxBin)   { midSum  += mag; midCt++;  }
      else                       { highSum += mag; highCt++; }
    }

    const bassEnergy = bassCt > 0 ? Math.sqrt(bassSum / bassCt) : 0;
    const midEnergy  = midCt  > 0 ? Math.sqrt(midSum  / midCt)  : 0;
    const highEnergy = highCt > 0 ? Math.sqrt(highSum / highCt) : 0;

    // Peak amplitude for bar height — captures transients better than RMS
    let allPeak = 0;
    const s = i * samplesPerBar;
    const e = Math.min(s + samplesPerBar, total);
    for (let j = s; j < e; j++) {
      const abs = Math.abs(channelData[j]);
      if (abs > allPeak) allPeak = abs;
    }

    bars.push({ bass: bassEnergy, mid: midEnergy, high: highEnergy, peak: allPeak });
  }

  // Global peak for normalization floor
  let maxPeak = 0;
  for (const b of bars) if (b.peak > maxPeak) maxPeak = b.peak;
  maxPeak = Math.max(maxPeak, 0.0001);

  // Per-band max with 2% floor so absent bands don't get boosted to full scale
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
