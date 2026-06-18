// VU + spectrum analyzer: live FFT side-chain tap when playing, pre-analyzed fallback when paused.
// Energy Map always uses pre-analyzed waveformData (full-track view requires complete data).

import { useEffect, useRef } from "react";
import { getAudioElement, getAudioContext } from "../lib/audioEngine.js";

const BASS_HEX    = "#1464dc";
const MID_HEX     = "#14dc14";
const PEAK_TICK   = "rgba(240,237,232,0.85)";
const SPEC_N      = 150;
const FLOOR_PCT   = 0.06; // minimum bar height as fraction of canvas height
const BPM_BUF_SIZE = 240; // 4 seconds × ~60 Hz rAF rate

// Convert linear amplitude (0-1+) to decibels full-scale (dBFS).
// reference=1.0: 0 dBFS = peak digital headroom
// floor=-60: values below -60 dBFS clamp to floor (silence threshold)
// 20*log10(x) undefined at x=0, so Math.max(v, 1e-6) prevents -Infinity.
// Exported for unit testing and VU calculation.
export function amplitudeTodBFS(value, floor = -60) {
  if (value <= 0) return floor;
  const dbfs = 20 * Math.log10(value);
  return Math.max(floor, dbfs);
}

// Maps frequency position + amplitude to 3-band RGB color (PSC original, screen-blend aesthetic).
// freqT: 0 = bass (red), 0.5 = mid (green), 1.0 = high (cyan).
// normH: 0-1 amplitude — scales opacity; brighter = louder.
// bass=RED #ff0000, mid=GREEN #00ff00, high=CYAN #00ffff — matches DeckWaveformV2 waveform bands.
// Exported for unit testing.
export function specBarColor(normH, freqT, alpha = 1) {
  // 3-band RGB model (PSC forward-thinking)
  let r, g, b;
  if (freqT < 0.33) {
    // Bass: red
    r = 255;
    g = 0;
    b = 0;
  } else if (freqT < 0.67) {
    // Mid: green
    r = 0;
    g = 255;
    b = 0;
  } else {
    // High: cyan
    r = 0;
    g = 255;
    b = 255;
  }
  // Amplitude modulates opacity: low amp = dim, high amp = bright
  const opacity = Math.max(0.2, normH); // floor at 0.2 to keep quiet bars visible
  return `rgba(${r}, ${g}, ${b}, ${alpha * opacity})`;
}

// Props: { isPlaying, waveformData, currentTime, duration, hotCues? }
// waveformData = array of { peak: 0-1, freq: "#rrggbb", bass?: 0-1, high?: 0-1 }
// Returns: { vuRef, vuRRef, specRef, energyRef, phiRef, bpmResultRef }
export default function useAudioAnalyzer({ isPlaying, waveformData, currentTime, duration, hotCues }) {
  const vuRef       = useRef(null);
  const vuRRef      = useRef(null);
  const specRef     = useRef(null);
  const energyRef   = useRef(null);
  const phiRef      = useRef(null);
  const rafRef      = useRef(null);
  const peakL       = useRef(0);
  const peakR       = useRef(0);
  const peakHeldL   = useRef(0);  // 1.5s hold timer value for VU peak hold
  const peakHeldR   = useRef(0);
  const peakHoldTimeL = useRef(0); // timestamp when peakHeld was last updated
  const peakHoldTimeR = useRef(0);
  const clipHeldL   = useRef(0);  // performance.now() timestamp of last clip event (value > 0.99)
  const clipHeldR   = useRef(0);
  const specPeakRef = useRef(new Float32Array(SPEC_N));

  // Live FFT state — created once, never recreated
  const audioCtxRef       = useRef(null);
  const analyserRef       = useRef(null);
  const freqDataRef       = useRef(null);
  const analyserSetupRef  = useRef(false); // guard: createMediaElementSource can only be called once

  // Frame counter for throttling energy map redraws (4fps on 60fps RAF)
  const frameCountRef = useRef(0);

  // BPM ring buffer — one bass-bin RMS sample per rAF frame (~60 Hz effective rate)
  const bpmBufferRef = useRef(new Float32Array(BPM_BUF_SIZE));
  const bpmWriteRef  = useRef(0);
  const bpmResultRef = useRef({ bpm: null, confidence: 0 });


  // EMA state for smooth needle gauges
  const vuLEmaRef        = useRef(0);
  const vuREmaRef        = useRef(0);
  const phiEmaRef        = useRef(0); // phase correlation smoothing
  const lastFrameTimeRef = useRef(performance.now());

  // Phase correlation state — left/right channel analysers for mono compatibility detection
  const lChannelAnalyserRef = useRef(null);
  const rChannelAnalyserRef = useRef(null);
  const lChannelDataRef     = useRef(null);
  const rChannelDataRef     = useRef(null);

  // liveRef carries values into the RAF loop without re-triggering the effect
  const liveRef = useRef({ waveformData, currentTime, duration, hotCues, isPlaying });
  liveRef.current = { waveformData, currentTime, duration, hotCues, isPlaying };

  // ── Live FFT setup ──────────────────────────────────────────────────────────
  // Called once when playback starts for the first time. Safe to call every
  // play event — the analyserSetupRef guard ensures createMediaElementSource
  // is only ever called once per page lifecycle (it permanently binds the element).
  function setupAnalyser() {
    if (analyserSetupRef.current) return; // singleton guard

    const audioEl = getAudioElement();
    if (!audioEl) return;

    // Use the shared AudioContext from audioEngine — it was created inside a user
    // gesture (prewarm() call in handlePlayPause), so it starts RUNNING, not suspended.
    // Creating a new AudioContext here (outside gesture scope via useEffect) would start
    // suspended and permanently silence audio after createMediaElementSource routes the
    // audio element through it.
    let audioCtx = getAudioContext();

    try {
      if (!audioCtx) {
        // Fallback: create our own and immediately try to resume
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        audioCtx = new AudioCtx();
        audioCtx.resume().catch(() => {});
      }

      const source   = audioCtx.createMediaElementSource(audioEl);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize               = 2048; // 1024 frequency bins
      analyser.smoothingTimeConstant = 0.75;

      // Phase correlation: split stereo into L/R channels for mono compatibility detection
      const splitter = audioCtx.createChannelSplitter(2);
      const lAnalyser = audioCtx.createAnalyser();
      const rAnalyser = audioCtx.createAnalyser();
      lAnalyser.fftSize = rAnalyser.fftSize = 512; // smaller window for real-time correlation
      lAnalyser.smoothingTimeConstant = rAnalyser.smoothingTimeConstant = 0.3;

      // KEY: source → destination (audio still plays) AND source → analysers (side-chain taps).
      // Analysers are NOT inserted into the playback path — no dropout risk.
      source.connect(audioCtx.destination);
      source.connect(analyser);
      source.connect(splitter);
      splitter.connect(lAnalyser, 0);
      splitter.connect(rAnalyser, 1);

      audioCtxRef.current         = audioCtx;
      analyserRef.current         = analyser;
      freqDataRef.current         = new Uint8Array(analyser.frequencyBinCount);
      lChannelAnalyserRef.current = lAnalyser;
      rChannelAnalyserRef.current = rAnalyser;
      lChannelDataRef.current     = new Float32Array(lAnalyser.fftSize);
      rChannelDataRef.current     = new Float32Array(rAnalyser.fftSize);
      analyserSetupRef.current = true;
    } catch (err) {
      // AudioContext unavailable or blocked — fall back to pre-analyzed data silently
      console.warn("[useAudioAnalyzer] AudioContext setup failed, using pre-analyzed fallback:", err.message);
    }
  }

  // ── Main effect ─────────────────────────────────────────────────────────────
  // WCAG 2.3.3: Skip all animation (RAF loop) when prefers-reduced-motion is active.
  // This disables: VU bar EMA smoothing, spectrum peak decay, phase correlation EMA,
  // energy map animation. Phase meter still renders static state in idle/paused modes.
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    if (!isPlaying) {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      peakL.current = 0;
      peakR.current = 0;
      peakHeldL.current = 0;
      peakHeldR.current = 0;
      clipHeldL.current = 0;
      clipHeldR.current = 0;
      specPeakRef.current = new Float32Array(SPEC_N);
      frameCountRef.current = 0;

      // Draw idle state: neutral dim floor bars on spectrum, ghost segment structure on VU
      const spec = specRef.current;
      if (spec && spec.width > 0 && spec.height > 0) {
        const ctx = spec.getContext("2d");
        const W = spec.width, H = spec.height;
        ctx.clearRect(0, 0, W, H);
        const barStep = W / SPEC_N;
        const bw      = Math.max(1, Math.floor(barStep) - 1);
        const FLOOR   = Math.round(H * FLOOR_PCT);
        for (let i = 0; i < SPEC_N; i++) {
          ctx.fillStyle = "rgba(185, 185, 185, 0.12)";
          ctx.fillRect(Math.round(i * barStep), H - FLOOR, bw, FLOOR);
        }
      }
      const dpr = window.devicePixelRatio || 1;
      const vu = vuRef.current;
      if (vu) {
        const vuW = vu.offsetWidth || 60;
        const vuH = vu.offsetHeight || 120;
        const bsW = Math.round(vuW * dpr), bsH = Math.round(vuH * dpr);
        if (vu.width !== bsW || vu.height !== bsH) { vu.width = bsW; vu.height = bsH; }
        const ctx = vu.getContext("2d");
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawVuNeedle(ctx, vuW, vuH, { value: 0, peakValue: 0, showClip: false, channel: "L" });
      }
      const vuR = vuRRef.current;
      if (vuR) {
        const vuW = vuR.offsetWidth || 60;
        const vuH = vuR.offsetHeight || 120;
        const bsW = Math.round(vuW * dpr), bsH = Math.round(vuH * dpr);
        if (vuR.width !== bsW || vuR.height !== bsH) { vuR.width = bsW; vuR.height = bsH; }
        const ctx = vuR.getContext("2d");
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawVuNeedle(ctx, vuW, vuH, { value: 0, peakValue: 0, showClip: false, channel: "R" });
      }

      // Idle phi meter
      const phi = phiRef.current;
      if (phi) {
        const phiW = phi.offsetWidth || 60;
        const phiH = phi.offsetHeight || 120;
        const bsW = Math.round(phiW * dpr), bsH = Math.round(phiH * dpr);
        if (phi.width !== bsW || phi.height !== bsH) { phi.width = bsW; phi.height = bsH; }
        const ctx = phi.getContext("2d");
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawCorrelationMeter(ctx, phiW, phiH, 0);
      }

      // Draw energy map using available waveformData, or ghost grid if none loaded
      const energy = energyRef.current;
      if (energy) {
        const dispW = energy.offsetWidth || energy.width;
        const dispH = energy.offsetHeight || energy.height;
        if (dispW > 0 && dispH > 0) {
          if (energy.width !== dispW || energy.height !== dispH) {
            energy.width = dispW;
            energy.height = dispH;
          }
          const { waveformData: bars, currentTime: t, duration: dur, hotCues: cues } = liveRef.current;
          if (bars && bars.length > 0 && dur > 0) {
            drawEnergyMap(energy, bars, t, dur, cues);
          } else {
            drawEnergyMapIdle(energy);
          }
        }
      }

      return;
    }

    // Attempt live FFT setup on first play (singleton guard makes this safe to call repeatedly)
    setupAnalyser();

    function draw() {
      rafRef.current = requestAnimationFrame(draw);
      frameCountRef.current++;

      // Resume AudioContext if browser auto-suspended (happens after 30s inactivity)
      if (audioCtxRef.current?.state === "suspended") {
        audioCtxRef.current.resume();
      }

      const { waveformData: bars, currentTime: t, duration: dur, hotCues: cues } = liveRef.current;
      const hasPreAnalyzed = bars && bars.length > 0 && dur > 0;

      // ── Read live FFT data ────────────────────────────────────────────────
      let freqBins = null;
      if (analyserRef.current && freqDataRef.current) {
        analyserRef.current.getByteFrequencyData(freqDataRef.current);
        freqBins = freqDataRef.current;
      }

      // EMA dt clamp: prevents spike on first frame or after tab backgrounded
      const now = performance.now();
      const dt = Math.min(now - lastFrameTimeRef.current, 50);
      lastFrameTimeRef.current = now;
      const alpha = 1 - Math.exp(-dt / 300);

      // ── VU needle gauges (L + R) ─────────────────────────────────────────
      // Stereo channel measurement (true left/right RMS), not frequency-band energy
      const dprLive = window.devicePixelRatio || 1;
      let rL = 0, rR = 0;
      if (lChannelAnalyserRef.current && rChannelAnalyserRef.current
          && lChannelDataRef.current && rChannelDataRef.current) {
        // Live FFT: true stereo channel RMS measurement
        lChannelAnalyserRef.current.getFloatTimeDomainData(lChannelDataRef.current);
        rChannelAnalyserRef.current.getFloatTimeDomainData(rChannelDataRef.current);
        const lData = lChannelDataRef.current;
        const rData = rChannelDataRef.current;
        let lSumSq = 0, rSumSq = 0;
        for (let i = 0; i < lData.length; i++) {
          lSumSq += lData[i] * lData[i];
          rSumSq += rData[i] * rData[i];
        }
        rL = Math.sqrt(lSumSq / lData.length);  // true RMS: 0..1
        rR = Math.sqrt(rSumSq / rData.length);
      } else if (hasPreAnalyzed) {
        // Pre-analyzed fallback: use overall peak as symmetric RMS approximation
        const barIndex   = Math.min(Math.floor((t / dur) * bars.length), bars.length - 1);
        const W_HALF     = 7;
        const windowBars = bars.slice(Math.max(0, barIndex - W_HALF), Math.min(bars.length, barIndex + W_HALF + 1));
        const avgPeak    = windowBars.reduce((s, b) => s + b.peak, 0) / (windowBars.length || 1);
        rL = rR = avgPeak * 0.707;  // RMS ≈ peak / sqrt(2) ≈ peak * 0.707
      }

      peakL.current = Math.max(peakL.current * 0.97, rL);
      peakR.current = Math.max(peakR.current * 0.97, rR);

      // Pro VU calibration: 0 VU = -18 dBFS (SMPTE standard), display -20 to +3 VU
      const VU_CALIBRATION = -18;  // dBFS where needle reads exactly 0 VU
      const VU_MIN_DISPLAY = -20;  // left end of needle arc
      const VU_MAX_DISPLAY = 3;    // right end of needle arc

      const vuLDb   = amplitudeTodBFS(rL, -60);
      const vuLVu   = vuLDb - VU_CALIBRATION;  // convert dBFS to VU offset
      const vuLNorm = Math.max(0, Math.min(1, (vuLVu - VU_MIN_DISPLAY) / (VU_MAX_DISPLAY - VU_MIN_DISPLAY)));
      vuLEmaRef.current = vuLEmaRef.current + alpha * (vuLNorm - vuLEmaRef.current);

      const vuRDb   = amplitudeTodBFS(rR, -60);
      const vuRVu   = vuRDb - VU_CALIBRATION;
      const vuRNorm = Math.max(0, Math.min(1, (vuRVu - VU_MIN_DISPLAY) / (VU_MAX_DISPLAY - VU_MIN_DISPLAY)));
      vuREmaRef.current = vuREmaRef.current + alpha * (vuRNorm - vuREmaRef.current);

      // ── Peak hold logic (1.5s hold, then ~8dB/sec decay) ────────────────────
      const PEAK_HOLD_TIME = 1500; // milliseconds
      const PEAK_DECAY_MULTIPLIER = Math.pow(10, -8 / (20 * 60)); // ~0.9857 per frame at 60fps

      // L channel peak hold
      if (vuLNorm > peakHeldL.current) {
        peakHeldL.current = vuLNorm;
        peakHoldTimeL.current = now;
      } else if (now - peakHoldTimeL.current > PEAK_HOLD_TIME) {
        peakHeldL.current *= PEAK_DECAY_MULTIPLIER;
        if (peakHeldL.current < 0.001) peakHeldL.current = 0;
      }

      // R channel peak hold
      if (vuRNorm > peakHeldR.current) {
        peakHeldR.current = vuRNorm;
        peakHoldTimeR.current = now;
      } else if (now - peakHoldTimeR.current > PEAK_HOLD_TIME) {
        peakHeldR.current *= PEAK_DECAY_MULTIPLIER;
        if (peakHeldR.current < 0.001) peakHeldR.current = 0;
      }

      // ── Clip indicator logic (2s hold after value > 0.99) ──────────────────
      const CLIP_HOLD_TIME = 2000;
      if (rL > 0.99) clipHeldL.current = now;
      if (rR > 0.99) clipHeldR.current = now;

      // ── Phase correlation (mono compatibility, -1 to +1) ─────────────────────
      // Note: L/R time-domain data already read above for VU measurement; reuse those buffers
      let phiRaw = 0;
      if (lChannelAnalyserRef.current && rChannelAnalyserRef.current && lChannelDataRef.current && rChannelDataRef.current) {
        const lData = lChannelDataRef.current;
        const rData = rChannelDataRef.current;
        let dotProd = 0, lNorm = 0, rNorm = 0;
        for (let i = 0; i < lData.length; i++) {
          dotProd += lData[i] * rData[i];
          lNorm += lData[i] * lData[i];
          rNorm += rData[i] * rData[i];
        }
        const denom = Math.sqrt(lNorm * rNorm);
        phiRaw = denom > 0.0001 ? dotProd / denom : 0;
      }
      // Guard against NaN propagation in EMA smoothing (defensive; audio should always be valid)
      if (!isNaN(phiRaw)) {
        phiEmaRef.current = phiEmaRef.current + alpha * (phiRaw - phiEmaRef.current);
      }

      // Clip indicator: shows if within 2s of clip event, fades out in last 200ms
      const CLIP_FADE_TIME = 200;
      const timeSinceClipL = now - clipHeldL.current;
      const timeSinceClipR = now - clipHeldR.current;
      const clipShowL = clipHeldL.current > 0 && timeSinceClipL < CLIP_HOLD_TIME;
      const clipShowR = clipHeldR.current > 0 && timeSinceClipR < CLIP_HOLD_TIME;
      const clipOpacityL = clipShowL ? Math.max(0, 1 - Math.max(0, timeSinceClipL - (CLIP_HOLD_TIME - CLIP_FADE_TIME)) / CLIP_FADE_TIME) : 0;
      const clipOpacityR = clipShowR ? Math.max(0, 1 - Math.max(0, timeSinceClipR - (CLIP_HOLD_TIME - CLIP_FADE_TIME)) / CLIP_FADE_TIME) : 0;

      const vu = vuRef.current;
      if (vu) {
        const vuW = vu.offsetWidth || 60;
        const vuH = vu.offsetHeight || 120;
        const bsW = Math.round(vuW * dprLive), bsH = Math.round(vuH * dprLive);
        if (vu.width !== bsW || vu.height !== bsH) { vu.width = bsW; vu.height = bsH; }
        const ctx = vu.getContext("2d");
        ctx.setTransform(dprLive, 0, 0, dprLive, 0, 0);
        drawVuNeedle(ctx, vuW, vuH, { value: vuLEmaRef.current, peakValue: peakHeldL.current, showClip: clipShowL, clipOpacity: clipOpacityL, channel: "L" });
      }
      const vuR = vuRRef.current;
      if (vuR) {
        const vuW = vuR.offsetWidth || 60;
        const vuH = vuR.offsetHeight || 120;
        const bsW = Math.round(vuW * dprLive), bsH = Math.round(vuH * dprLive);
        if (vuR.width !== bsW || vuR.height !== bsH) { vuR.width = bsW; vuR.height = bsH; }
        const ctx = vuR.getContext("2d");
        ctx.setTransform(dprLive, 0, 0, dprLive, 0, 0);
        drawVuNeedle(ctx, vuW, vuH, { value: vuREmaRef.current, peakValue: peakHeldR.current, showClip: clipShowR, clipOpacity: clipOpacityR, channel: "R" });
      }

      // ── Phase Correlation Meter (φ) ───────────────────────────────────────
      const phi = phiRef.current;
      if (phi) {
        const phiW = phi.offsetWidth || 60;
        const phiH = phi.offsetHeight || 120;
        const bsW = Math.round(phiW * dprLive), bsH = Math.round(phiH * dprLive);
        if (phi.width !== bsW || phi.height !== bsH) { phi.width = bsW; phi.height = bsH; }
        const ctx = phi.getContext("2d");
        ctx.setTransform(dprLive, 0, 0, dprLive, 0, 0);
        drawCorrelationMeter(ctx, phiW, phiH, phiEmaRef.current);
      }

      {  // BPM ring: separate block so it still runs after the canvas split

        // BPM ring: write bass-bin RMS each frame; detect every 30 frames (~500ms)
        if (freqBins) {
          const bassEnd = Math.min(40, freqBins.length);
          let bassSum = 0;
          for (let i = 0; i < bassEnd; i++) bassSum += freqBins[i];
          const bassRms = bassSum / (bassEnd * 255);
          bpmBufferRef.current[bpmWriteRef.current % BPM_BUF_SIZE] = bassRms;
          bpmWriteRef.current++;
          if (frameCountRef.current % 30 === 0) {
            bpmResultRef.current = detectBpm(bpmBufferRef.current, 60);
          }
        }
      }


      // ── Spectrum (live FFT → per-bar color; pre-analyzed fallback when no FFT) ──
      const spec = specRef.current;
      if (spec) {
        const dispW = spec.offsetWidth;
        const dispH = spec.offsetHeight;
        const specW = Math.round(dispW * dprLive);
        const specH = Math.round(dispH * dprLive);
        if (dispW > 0 && dispH > 0 && (spec.width !== specW || spec.height !== specH)) {
          spec.width  = specW;
          spec.height = specH;
        }

        const ctx = spec.getContext("2d");
        ctx.setTransform(dprLive, 0, 0, dprLive, 0, 0);
        const W = dispW, H = dispH; // use display dimensions for drawing (DPR is handled by setTransform)
        ctx.clearRect(0, 0, W, H);

        const barStep  = W / SPEC_N;
        const bw       = Math.max(1, Math.floor(barStep) - 1); // 1px gap between bars
        const peakArr  = specPeakRef.current;
        const FLOOR    = Math.round(H * FLOOR_PCT);

        if (freqBins) {
          // Live FFT path: map 1024 frequency bins to SPEC_N bars using logarithmic frequency spacing
          // Human hearing is logarithmic: 20Hz–18kHz should occupy bars evenly in perceived frequency
          const MIN_FREQ = 20;    // Hz — bottom of human hearing
          const MAX_FREQ = 18000; // Hz — top of useful music range (below Nyquist for 44.1kHz)
          const nyquist  = 44100 / 2;
          const totalBins = freqBins.length;
          for (let i = 0; i < SPEC_N; i++) {
            // Log-spaced frequency edges for this bar
            const freqLo = MIN_FREQ * Math.pow(MAX_FREQ / MIN_FREQ, i / SPEC_N);
            const freqHi = MIN_FREQ * Math.pow(MAX_FREQ / MIN_FREQ, (i + 1) / SPEC_N);
            const binStart = Math.max(0, Math.floor(freqLo / nyquist * totalBins));
            const binEnd   = Math.min(totalBins, Math.ceil(freqHi / nyquist * totalBins));
            let sum = 0;
            for (let b = binStart; b < binEnd; b++) sum += freqBins[b];
            const avg    = sum / (binEnd - binStart || 1);
            const liveH  = Math.max(Math.round((avg / 255) * H), FLOOR);
            const normH  = liveH / H;

            peakArr[i]   = Math.max(peakArr[i] * 0.985, liveH);
            const maxH   = Math.round(peakArr[i]);
            const x      = Math.round(i * barStep);

            // IntermodAnalyzer: salmon ghost fill from live top to peak-hold
            if (maxH > liveH + 1) {
              ctx.fillStyle = "rgba(225, 85, 68, 0.42)";
              ctx.fillRect(x, H - maxH, bw, maxH - liveH);
            }
            // Peak-hold line: bright 1px at peak position
            if (maxH > FLOOR) {
              ctx.fillStyle = "rgba(255, 255, 220, 0.9)";
              ctx.fillRect(x, H - maxH, bw, 1);
            }

            ctx.fillStyle = specBarColor(normH, i / (SPEC_N - 1));
            ctx.fillRect(x, H - liveH, bw, liveH);
          }
        } else if (hasPreAnalyzed) {
          // Pre-analyzed fallback (paused or AudioContext failed)
          const barIndex  = Math.min(Math.floor((t / dur) * bars.length), bars.length - 1);
          const specStart = Math.max(0, barIndex - SPEC_N);

          for (let i = 0; i < SPEC_N; i++) {
            const b     = bars[specStart + i];
            const liveH = b ? Math.max(Math.round(b.peak * H), FLOOR) : FLOOR;
            const normH = liveH / H;

            peakArr[i]  = Math.max(peakArr[i] * 0.985, liveH);
            const maxH  = Math.round(peakArr[i]);
            const x     = Math.round(i * barStep);

            if (maxH > liveH + 1) {
              ctx.fillStyle = "rgba(225, 85, 68, 0.42)";
              ctx.fillRect(x, H - maxH, bw, maxH - liveH);
            }
            if (maxH > FLOOR) {
              ctx.fillStyle = "rgba(255, 255, 220, 0.9)";
              ctx.fillRect(x, H - maxH, bw, 1);
            }

            ctx.fillStyle = specBarColor(normH, i / (SPEC_N - 1));
            ctx.fillRect(x, H - liveH, bw, liveH);
          }
        } else {
          // No data at all — draw idle floor bars
          for (let i = 0; i < SPEC_N; i++) {
            const x = Math.round(i * barStep);
            ctx.fillStyle = specBarColor(FLOOR_PCT, i / (SPEC_N - 1));
            ctx.fillRect(x, H - FLOOR, bw, FLOOR);
          }
        }

        // Subtle dB reference grid lines drawn after bars so they read through them
        ctx.strokeStyle = "rgba(255,255,255,0.04)";
        ctx.lineWidth = 1;
        for (const frac of [0.25, 0.5, 0.75]) {
          const gy = Math.round(H * (1 - frac));
          ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
        }
      }

      // ── Energy Map (pre-analyzed only, throttled to ~4fps) ───────────────
      // Energy Map shows the FULL track at all times — requires complete waveformData.
      // Playhead tick updates every frame; full redraw every 15 frames.
      const energy = energyRef.current;
      if (energy && hasPreAnalyzed) {
        const doFullRedraw = frameCountRef.current % 15 === 1;

        if (doFullRedraw) {
          const dispW = energy.offsetWidth;
          const dispH = energy.offsetHeight;
          if (dispW > 0 && dispH > 0 && (energy.width !== dispW || energy.height !== dispH)) {
            energy.width  = dispW;
            energy.height = dispH;
          }
          drawEnergyMap(energy, bars, t, dur, cues);
        } else {
          // Cheap playhead-only update: redraw just the playhead line
          updateEnergyPlayhead(energy, t, dur);
        }
      }
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    };
  }, [isPlaying]); // only restarts on play/pause — values read live via liveRef

  // Secondary effect: redraw energy map whenever waveformData or playhead changes while paused.
  // The main RAF loop handles this when playing; this covers the static/scrubbing case.
  useEffect(() => {
    if (isPlaying) return;
    const energy = energyRef.current;
    if (!energy) return;
    const dispW = energy.offsetWidth || energy.width;
    const dispH = energy.offsetHeight || energy.height;
    if (dispW <= 0 || dispH <= 0) return;
    if (energy.width !== dispW || energy.height !== dispH) {
      energy.width = dispW;
      energy.height = dispH;
    }
    if (waveformData && waveformData.length > 0 && duration > 0) {
      drawEnergyMap(energy, waveformData, currentTime, duration, hotCues);
    } else {
      drawEnergyMapIdle(energy);
    }
  }, [waveformData, currentTime, duration, hotCues, isPlaying]);

  return { vuRef, vuRRef, specRef, energyRef, phiRef, bpmResultRef };
}

// ── Gauge scale definitions ──────────────────────────────────────────────────

// ── BPM detection ────────────────────────────────────────────────────────────

// Autocorrelation BPM detector on a ring buffer sampled at ~60 Hz (one sample per rAF frame).
// Beat period in frames = sampleRate * 60 / BPM:
//   180 BPM → 60*60/180 = 20 frames  (minPeriod)
//    60 BPM → 60*60/60  = 60 frames  (maxPeriod)
// ~7200 multiplications per call, runs every 500ms — trivially fast.
// Exported for unit testing.
export function detectBpm(buffer, sampleRate = 60) {
  const minPeriod = Math.floor(sampleRate * 60 / 180);
  const maxPeriod = Math.floor(sampleRate * 60 / 60);
  let bestLag = -1, bestCorr = 0;
  const n = buffer.length;
  for (let lag = minPeriod; lag <= Math.min(maxPeriod, n / 2); lag++) {
    let corr = 0, norm = 0;
    for (let i = 0; i < n - lag; i++) {
      corr += buffer[i] * buffer[i + lag];
      norm += buffer[i] * buffer[i] + buffer[i + lag] * buffer[i + lag];
    }
    const r = norm > 0 ? 2 * corr / norm : 0;
    if (r > bestCorr) { bestCorr = r; bestLag = lag; }
  }
  if (bestLag < 0) return { bpm: null, confidence: 0 };
  return { bpm: Math.round(sampleRate / bestLag * 60), confidence: bestCorr };
}

// ── Drawing helpers ──────────────────────────────────────────────────────────

// Analog VU needle meter (Midnight Marauders inspired).
// Arc-sweep needle from bottom-center pivot, colors from album palette.
function drawVuNeedle(ctx, W, H, opts) {
  const { value = 0, peakValue = 0, showClip = false, clipOpacity = 1, channel = "L" } = opts;
  const clamped = Math.max(0, Math.min(1, value));
  const peakClamped = Math.max(0, Math.min(1, peakValue));

  // Black background with radial gradient depth
  ctx.fillStyle = "rgba(0,0,0,0.97)";
  ctx.fillRect(0, 0, W, H);

  // Clipping indicator: red block at top when clipping
  if (showClip) {
    ctx.fillStyle = `rgba(255, 68, 68, ${clipOpacity * 0.95})`;
    ctx.fillRect(0, 0, W, 12);
  }

  // Pivot geometry
  const pivotX = W / 2;
  const pivotY = H * 0.90;
  const radius = H * 0.82;

  // VU scale: -20 to +3 VU (23 range)
  const VU_MIN = -20;
  const VU_MAX = 3;
  const ANGLE_MIN = 215; // degrees, -20 VU (upper-left ~7 o'clock)
  const ANGLE_MAX = 325; // degrees, +3 VU (upper-right ~5 o'clock)

  // Background gradient for depth (pronounced radial glow)
  const bgGradient = ctx.createRadialGradient(pivotX, pivotY, 0, pivotX, pivotY, radius * 1.4);
  bgGradient.addColorStop(0, "rgba(40,40,40,1)");
  bgGradient.addColorStop(0.6, "rgba(15,15,15,1)");
  bgGradient.addColorStop(1, "rgba(0,0,0,1)");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, W, H);

  // Identity-color arc guide along scale radius
  const isL = channel === "L";
  const startRad = (ANGLE_MIN * Math.PI) / 180;
  const endRad = (ANGLE_MAX * Math.PI) / 180;
  ctx.strokeStyle = isL ? "rgba(0,255,255,0.18)" : "rgba(20,220,20,0.18)";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(pivotX, pivotY, radius * 0.78, startRad, endRad);
  ctx.stroke();

  // 4. Scale ticks and labels (-20, -10, -7, -5, -3, -2, -1, 0, +1, +2, +3)
  const VU_LABELS = [-20, -10, -7, -5, -3, -2, -1, 0, 1, 2, 3];

  // Responsive font sizing for different viewport heights
  const labelSize = Math.max(8, Math.min(9, H * 0.067));
  const vuHeaderSize = Math.max(10, Math.min(12, H * 0.083));

  ctx.save();
  ctx.font = `400 ${Math.round(labelSize)}px 'Chakra Petch', sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (const vuVal of VU_LABELS) {
    const normVal = (vuVal - VU_MIN) / (VU_MAX - VU_MIN);
    const angle = ANGLE_MIN + normVal * (ANGLE_MAX - ANGLE_MIN);
    const angleRad = (angle * Math.PI) / 180;
    const isHot = vuVal > 0;
    const tickColor = isHot ? "#cc2200" : "#14dc14";

    // Tick mark (short line radiating outward)
    const tickStartR = radius * 0.65;
    const tickEndR = radius * 0.75;
    const x1 = pivotX + tickStartR * Math.cos(angleRad);
    const y1 = pivotY + tickStartR * Math.sin(angleRad);
    const x2 = pivotX + tickEndR * Math.cos(angleRad);
    const y2 = pivotY + tickEndR * Math.sin(angleRad);
    ctx.strokeStyle = tickColor;
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Label (e.g., "-10", "+3") — positioned near the arc for compact professional look
    const labelR = radius * 0.94;
    const labelX = pivotX + labelR * Math.cos(angleRad);
    let labelY = pivotY + labelR * Math.sin(angleRad);
    // Small adjustment for "0" to center it visually between "-1" and "+1"
    if (vuVal === 0) labelY += 1.5;
    ctx.fillStyle = tickColor;
    ctx.fillText(String(vuVal), labelX, labelY);
  }
  ctx.restore();

  // 3. "VU" label at top-center
  ctx.save();
  ctx.font = `500 ${Math.round(vuHeaderSize)}px 'Chakra Petch', sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = "rgba(240,237,232,0.5)";
  ctx.fillText("VU", pivotX, 2);
  ctx.restore();

  // 5 & 6. Needle with shadow (cream stroke from pivot to arc)
  const needleAngle = ANGLE_MIN + clamped * (ANGLE_MAX - ANGLE_MIN);
  const needleAngleRad = (needleAngle * Math.PI) / 180;
  const needleX = pivotX + radius * Math.cos(needleAngleRad);
  const needleY = pivotY + radius * Math.sin(needleAngleRad);

  // Needle shadow (darker, offset +1px for depth)
  ctx.strokeStyle = "rgba(0,0,0,0.4)";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(pivotX + 1, pivotY + 1);
  ctx.lineTo(needleX + 1, needleY + 1);
  ctx.stroke();

  // Needle (cream/white, bright)
  ctx.strokeStyle = "#f0e8c0";
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(pivotX, pivotY);
  ctx.lineTo(needleX, needleY);
  ctx.stroke();

  // 7. Pivot cap (small filled circle, cream color)
  ctx.fillStyle = "#f0e8c0";
  ctx.beginPath();
  ctx.arc(pivotX, pivotY, 3, 0, Math.PI * 2);
  ctx.fill();

  // 8. Peak hold tick (white arc segment at peak position, 1.5s hold)
  if (peakClamped > 0.02) {
    const peakAngle = ANGLE_MIN + peakClamped * (ANGLE_MAX - ANGLE_MIN);
    const peakAngleRad = (peakAngle * Math.PI) / 180;
    const peakTickLength = radius * 0.08;
    const peakX1 = pivotX + (radius - peakTickLength) * Math.cos(peakAngleRad);
    const peakY1 = pivotY + (radius - peakTickLength) * Math.sin(peakAngleRad);
    const peakX2 = pivotX + radius * Math.cos(peakAngleRad);
    const peakY2 = pivotY + radius * Math.sin(peakAngleRad);
    ctx.strokeStyle = "rgba(240,237,232,0.9)";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(peakX1, peakY1);
    ctx.lineTo(peakX2, peakY2);
    ctx.stroke();
  }

  // Channel label at bottom
  ctx.save();
  ctx.font = "500 9px 'Chakra Petch', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillStyle = "rgba(185,185,185,0.50)";
  ctx.fillText(channel, W / 2, H - 2);
  ctx.restore();
}

// Phase correlation meter (φ) — mono compatibility indicator (-1 to +1).
// -1 = fully anti-phase (cancels in mono), 0 = uncorrelated, +1 = mono-correlated (safe).
// Positive (in-phase) fills upward with green; negative (anti-phase) fills downward with red-orange.
// Tooltip: "Phase Correlation — +1: mono-safe, -1: cancels in mono"
function drawCorrelationMeter(ctx, W, H, correlation) {
  const clamped = Math.max(-1, Math.min(1, correlation));

  // Black background
  ctx.fillStyle = "rgba(0,0,0,0.97)";
  ctx.fillRect(0, 0, W, H);

  const midY = H / 2;

  // Center axis line
  ctx.strokeStyle = "rgba(185,185,185,0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, midY);
  ctx.lineTo(W, midY);
  ctx.stroke();

  // Ghost segments when idle (faint outline structure)
  const segH = Math.round(H / 4);
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  for (let i = 1; i <= 3; i++) {
    ctx.fillRect(0, midY - i * segH, W, 1);
    ctx.fillRect(0, midY + i * segH - 1, W, 1);
  }

  // Fill bars from center
  const barH = Math.abs(clamped) * (H / 2) * 0.85;
  if (clamped > 0) {
    // Positive (in-phase): green fill upward
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = "rgba(20, 220, 20, 0.8)";
    ctx.fillRect(0, midY - barH, W, barH);
    ctx.globalCompositeOperation = "source-over";
  } else if (clamped < 0) {
    // Negative (anti-phase): red-orange fill downward
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = "rgba(229, 96, 32, 0.8)";
    ctx.fillRect(0, midY, W, barH);
    ctx.globalCompositeOperation = "source-over";
  }

  // Current pointer (off-white line at position)
  const pointerY = midY - clamped * (H / 2) * 0.85;
  ctx.fillStyle = "rgba(240,237,232,0.85)";
  ctx.fillRect(0, pointerY - 1, W, 2);

  // Scale marks at -1, -0.5, 0, +0.5, +1
  ctx.save();
  ctx.font = "500 7px 'Space Mono', 'SF Mono', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(185,185,185,0.40)";
  const marks = [-1, -0.5, 0, 0.5, 1];
  for (const val of marks) {
    const y = midY - val * (H / 2) * 0.85;
    // Tick mark
    ctx.fillRect(W / 2 - 3, y - 0.5, 6, 1);
    // Label at small mark
    if (val !== 0) {
      ctx.fillText(val === 0.5 || val === -0.5 ? val.toFixed(1) : val.toFixed(0), W * 0.75, y);
    }
  }
  ctx.restore();

  // Phi label (φ symbol) — same size/style as VU labels (L/R) for visual consistency
  ctx.save();
  ctx.font = "500 9px 'Chakra Petch', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillStyle = "rgba(185,185,185,0.50)";
  ctx.fillText("φ", W / 2, H - 2);
  ctx.restore();
}

// Analog needle gauge — achromatic face, identity-colored needle tip only.
// arcColor: hex "#rrggbb" — used for needle tip + subtle glow only.
//   VU L/R: pass current --arch-identity value.
//   Loudness: pass "#f0ede8" (warm off-white, neutral combined signal).
// Full energy map redraw: full-track waveform envelope, playhead, hot cue marks.
function drawEnergyMap(canvas, bars, currentTime, duration, hotCues) {
  const ctx = canvas.getContext("2d");
  const W   = canvas.width;
  const H   = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const N          = bars.length;
  const barsPerPx  = N / W;
  const playheadPx = duration > 0 ? Math.round((currentTime / duration) * W) : -1;

  // Played-region darkening — subtle fill behind already-played portion
  if (playheadPx > 0) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    ctx.fillRect(0, 0, playheadPx, H);
  }

  // Smooth peak envelope — average nearby bars so it reads as a curve, not individual spikes
  const smoothR = Math.max(1, Math.round(barsPerPx * 3));
  for (let px = 0; px < W; px++) {
    const center = Math.floor(px * barsPerPx + barsPerPx * 0.5);
    let   sum    = 0;
    let   count  = 0;
    for (let b = Math.max(0, center - smoothR); b < Math.min(N, center + smoothR); b++) {
      if (bars[b]) { sum += bars[b].peak; count++; }
    }
    const avg  = count > 0 ? sum / count : 0;
    const barH = Math.max(2, Math.round(Math.pow(avg, 0.7) * H));
    const dim  = px < playheadPx ? 0.35 : 0.7;
    ctx.fillStyle   = "rgba(20, 220, 20, 1)";
    ctx.globalAlpha = dim;
    ctx.fillRect(px, H - barH, 1, barH);
  }
  ctx.globalAlpha = 1;

  // Hot cue marks
  if (hotCues && duration > 0) {
    for (const cue of Object.values(hotCues)) {
      if (cue.time == null) continue;
      const cx = Math.round((cue.time / duration) * W);
      ctx.fillStyle = cue.color || "rgba(255,255,255,0.6)";
      ctx.fillRect(cx, 0, 1, H);
    }
  }

  // White progress bar — 2px line running left-to-right along the bottom edge
  if (playheadPx > 0) {
    ctx.fillStyle = "rgba(240, 237, 232, 0.85)";
    ctx.fillRect(0, H - 2, playheadPx, 2);
  }

  // Playhead — 3px bright line + halo + time readout
  if (playheadPx >= 0) {
    // Outer glow halo
    ctx.fillStyle = "rgba(240, 237, 232, 0.15)";
    ctx.fillRect(Math.max(0, playheadPx - 2), 0, 7, H);
    // Core line
    ctx.fillStyle = "rgba(240, 237, 232, 0.96)";
    ctx.fillRect(playheadPx, 0, 3, H);

    // Time readout — MM:SS above the playhead
    if (duration > 0) {
      const totalSec = Math.floor(currentTime);
      const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
      const ss = String(totalSec % 60).padStart(2, "0");
      const label = `${mm}:${ss}`;
      ctx.font = "bold 9px 'Chakra Petch', 'JetBrains Mono', monospace";
      ctx.textBaseline = "top";
      const tw = ctx.measureText(label).width;
      // Pin label so it doesn't run off right edge
      const lx = Math.min(playheadPx + 4, W - tw - 3);
      ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
      ctx.fillRect(lx - 2, 2, tw + 4, 12);
      ctx.fillStyle = "rgba(240, 237, 232, 0.92)";
      ctx.fillText(label, lx, 3);
      ctx.textBaseline = "alphabetic";
    }
  }
}

// Cheap playhead-only update for the energy map (skips full waveform redraw).
// The stored canvas pixel data persists; only the playhead line needs moving.
// Implementation: redraw two thin columns — erase old, draw new.
// This avoids storing a separate backing canvas while keeping CPU near zero.
// NOTE: Because we can't isolate "just the playhead" without double-buffering,
// we only call the full redraw at 4fps anyway — this function is a no-op placeholder
// that keeps the call site clean. The 15-frame throttle in the RAF loop handles pacing.
function updateEnergyPlayhead(_canvas, _currentTime, _duration) {
  // Intentionally empty — full redraw is throttled to 4fps in the RAF loop.
}

// Ghost grid drawn when no waveformData is loaded yet.
function drawEnergyMapIdle(canvas) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(185, 185, 185, 0.08)";
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    const y = Math.round((i / 4) * H);
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  ctx.strokeStyle = "rgba(185, 185, 185, 0.15)";
  const midY = Math.round(H / 2);
  ctx.beginPath(); ctx.moveTo(0, midY); ctx.lineTo(W, midY); ctx.stroke();
}

