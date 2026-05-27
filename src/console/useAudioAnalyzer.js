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

// Maps frequency position + amplitude to a color matching the V2 waveform palette.
// freqT: 0 = lowest frequency bar (bass), 1 = highest (treble).
// normH: 0-1 amplitude — scales brightness; 0.2 floor keeps bars visible when quiet.
// bass=RED, mid=GREEN, high=BLUE — same spectral language as DeckWaveform V2 bars.
// Exported for unit testing.
export function specBarColor(normH, freqT, alpha = 1) {
  const hue        = Math.round(freqT * 280);        // red→orange→yellow→green→cyan→blue→violet
  const lightness  = Math.round(12 + normH * 52);    // 12% at silence → 64% at peak
  return `hsla(${hue}, 90%, ${lightness}%, ${alpha})`;
}

// Props: { isPlaying, waveformData, currentTime, duration, hotCues? }
// waveformData = array of { peak: 0-1, freq: "#rrggbb", bass?: 0-1, high?: 0-1 }
// Returns: { vuRef, specRef, energyRef, bpmResultRef }
export default function useAudioAnalyzer({ isPlaying, waveformData, currentTime, duration, hotCues }) {
  const vuRef       = useRef(null);
  const specRef     = useRef(null);
  const energyRef   = useRef(null);
  const rafRef      = useRef(null);
  const peakL       = useRef(0);
  const peakR       = useRef(0);
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

  // Needle/arc gauge canvases
  const loudnessRef = useRef(null);

  // EMA state for smooth needle gauges
  const vuEmaRef         = useRef(0);
  const loudnessEmaRef   = useRef(0);
  const lastFrameTimeRef = useRef(performance.now());

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

      // KEY: source → destination (audio still plays) AND source → analyser (side-chain tap).
      // Analyser is NOT inserted into the playback path — no dropout risk.
      source.connect(audioCtx.destination);
      source.connect(analyser);

      audioCtxRef.current      = audioCtx;
      analyserRef.current      = analyser;
      freqDataRef.current      = new Uint8Array(analyser.frequencyBinCount);
      analyserSetupRef.current = true;
    } catch (err) {
      // AudioContext unavailable or blocked — fall back to pre-analyzed data silently
      console.warn("[useAudioAnalyzer] AudioContext setup failed, using pre-analyzed fallback:", err.message);
    }
  }

  // ── Main effect ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    if (!isPlaying) {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      peakL.current = 0;
      peakR.current = 0;
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
      const vu = vuRef.current;
      if (vu) {
        const vuW = vu.offsetWidth || 72;
        const vuH = vu.offsetHeight || 96;
        if (vu.width !== vuW || vu.height !== vuH) { vu.width = vuW; vu.height = vuH; }
        drawNeedleGauge(vu.getContext("2d"), vu.width, vu.height, {
          value: 0, scale: VU_SCALE, arcColor: "#c8860a", redZone: 0.87, label: "VU",
        });
      }
      const loudnessIdle = loudnessRef.current;
      if (loudnessIdle) {
        const lW = loudnessIdle.offsetWidth || 72;
        const lH = loudnessIdle.offsetHeight || 96;
        if (loudnessIdle.width !== lW || loudnessIdle.height !== lH) { loudnessIdle.width = lW; loudnessIdle.height = lH; }
        drawNeedleGauge(loudnessIdle.getContext("2d"), loudnessIdle.width, loudnessIdle.height, {
          value: 0, scale: LOUDNESS_SCALE, arcColor: "#c8860a", redZone: 0.90, label: "dBFS",
        });
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

      // ── VU needle gauge ──────────────────────────────────────────────────
      const vu = vuRef.current;
      if (vu) {
        const vuW = vu.offsetWidth || 72;
        const vuH = vu.offsetHeight || 96;
        if (vu.width !== vuW || vu.height !== vuH) { vu.width = vuW; vu.height = vuH; }
        const ctx = vu.getContext("2d");

        let rL, rR;
        if (freqBins) {
          const bassEnd   = Math.min(40, freqBins.length);
          const highStart = Math.min(500, freqBins.length - 1);
          const highEnd   = Math.min(900, freqBins.length);
          let bassSum = 0;
          for (let i = 0; i < bassEnd; i++) bassSum += freqBins[i];
          rL = bassSum / (bassEnd * 255);
          let highSum = 0;
          for (let i = highStart; i < highEnd; i++) highSum += freqBins[i];
          rR = highSum / ((highEnd - highStart) * 255);
        } else if (hasPreAnalyzed) {
          const barIndex   = Math.min(Math.floor((t / dur) * bars.length), bars.length - 1);
          const W_HALF     = 7;
          const windowBars = bars.slice(Math.max(0, barIndex - W_HALF), Math.min(bars.length, barIndex + W_HALF + 1));
          const avgPeak    = windowBars.reduce((s, b) => s + b.peak, 0) / (windowBars.length || 1);
          if (windowBars[0]?.bass !== undefined) {
            rL = windowBars.reduce((s, b) => s + b.bass, 0) / windowBars.length;
            rR = windowBars.reduce((s, b) => s + b.high, 0) / windowBars.length;
          } else {
            let bassSum = 0, bassCount = 0, highSum = 0, highCount = 0;
            for (const b of windowBars) {
              if (b.freq === BASS_HEX) { bassSum += b.peak; bassCount++; }
              else if (b.freq !== MID_HEX) { highSum += b.peak; highCount++; }
            }
            rL = bassCount > 0 ? bassSum / bassCount : avgPeak * 0.85;
            rR = highCount > 0 ? highSum / highCount : avgPeak * 0.70;
          }
        } else {
          rL = 0;
          rR = 0;
        }

        peakL.current = Math.max(peakL.current * 0.97, rL);
        peakR.current = Math.max(peakR.current * 0.97, rR);

        const monoRms = Math.sqrt((rL * rL + rR * rR) / 2);
        const vuDb    = monoRms > 0 ? Math.max(-20, Math.min(3, 20 * Math.log10(monoRms / 0.7))) : -20;
        const vuNorm  = (vuDb + 20) / 23;
        vuEmaRef.current = vuEmaRef.current + alpha * (vuNorm - vuEmaRef.current);

        drawNeedleGauge(ctx, vu.width, vu.height, {
          value: vuEmaRef.current,
          scale: VU_SCALE,
          arcColor: "#c8860a",
          redZone: 0.87,
          label: "VU",
        });

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

      // ── Loudness needle gauge ─────────────────────────────────────────────
      const loudness = loudnessRef.current;
      if (loudness) {
        const lW = loudness.offsetWidth || 72;
        const lH = loudness.offsetHeight || 96;
        if (loudness.width !== lW || loudness.height !== lH) { loudness.width = lW; loudness.height = lH; }
        const ctx = loudness.getContext("2d");

        let rms = 0;
        if (freqBins) {
          let sum = 0;
          for (let i = 0; i < freqBins.length; i++) sum += (freqBins[i] / 255) ** 2;
          rms = Math.sqrt(sum / freqBins.length);
        } else if (hasPreAnalyzed) {
          const barIndex   = Math.min(Math.floor((t / dur) * bars.length), bars.length - 1);
          const W_HALF     = 7;
          const windowBars = bars.slice(Math.max(0, barIndex - W_HALF), Math.min(bars.length, barIndex + W_HALF + 1));
          rms = windowBars.reduce((s, b) => s + b.peak, 0) / (windowBars.length || 1);
        }

        const dbFS      = rms > 0 ? Math.max(-40, Math.min(0, 20 * Math.log10(rms))) : -40;
        const loudNorm  = Math.max(0, Math.min(1, (dbFS + 40) / 40));
        loudnessEmaRef.current = loudnessEmaRef.current + alpha * (loudNorm - loudnessEmaRef.current);

        drawNeedleGauge(ctx, loudness.width, loudness.height, {
          value: loudnessEmaRef.current,
          scale: LOUDNESS_SCALE,
          arcColor: "#c8860a",
          redZone: 0.90,
          label: "dBFS",
        });
      }

      // ── Spectrum (live FFT → per-bar color; pre-analyzed fallback when no FFT) ──
      const spec = specRef.current;
      if (spec) {
        const dispW = spec.offsetWidth;
        const dispH = spec.offsetHeight;
        if (dispW > 0 && dispH > 0 && (spec.width !== dispW || spec.height !== dispH)) {
          spec.width  = dispW;
          spec.height = dispH;
        }

        const ctx = spec.getContext("2d");
        const W = spec.width, H = spec.height;
        ctx.clearRect(0, 0, W, H);

        const barStep  = W / SPEC_N;
        const bw       = Math.max(1, Math.floor(barStep) - 1); // 1px gap between bars
        const peakArr  = specPeakRef.current;
        const FLOOR    = Math.round(H * FLOOR_PCT);

        if (freqBins) {
          // Live FFT path: map 1024 frequency bins to SPEC_N bars
          const binsPerBar = freqBins.length / SPEC_N;
          for (let i = 0; i < SPEC_N; i++) {
            const binStart = Math.floor(i * binsPerBar);
            const binEnd   = Math.floor((i + 1) * binsPerBar);
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

  return { vuRef, specRef, energyRef, loudnessRef, bpmResultRef };
}

// ── Gauge scale definitions ──────────────────────────────────────────────────

const VU_SCALE = [
  {l:"-20",p:0},{l:"-10",p:0.43},{l:"-7",p:0.56},{l:"-5",p:0.65},
  {l:"-3",p:0.74},{l:"-1",p:0.83},{l:"0",p:0.87},{l:"+1",p:0.91},{l:"+3",p:1},
];

const LOUDNESS_SCALE = [
  {l:"-40",p:0},{l:"-30",p:0.25},{l:"-20",p:0.5},{l:"-10",p:0.75},{l:"-6",p:0.85},{l:"0",p:1},
];

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

// Needle/arc analog gauge. opts: { value 0-1, scale [{l,p}], arcColor, redZone 0-1|null, label }
function drawNeedleGauge(ctx, W, H, opts) {
  const { value = 0, scale = [], arcColor = "#c8860a", redZone = null, label = "" } = opts;

  const START_DEG = 205;
  const END_DEG   = 335;
  const SPAN_DEG  = END_DEG - START_DEG; // 130°
  const toRad     = (d) => (d * Math.PI) / 180;

  const cx = W / 2;
  const cy = H * 0.88;
  const r  = Math.min(W, H) * 0.78;

  // Background
  ctx.fillStyle = "rgba(12, 8, 4, 0.92)";
  ctx.fillRect(0, 0, W, H);

  // Arc backdrop glow
  const grd = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.1);
  grd.addColorStop(0, "rgba(200,134,10,0.08)");
  grd.addColorStop(1, "rgba(200,134,10,0)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);

  // Scale arc (dim amber track)
  ctx.beginPath();
  ctx.arc(cx, cy, r, toRad(START_DEG), toRad(END_DEG));
  ctx.strokeStyle = "rgba(200,134,10,0.25)";
  ctx.lineWidth   = 3;
  ctx.stroke();

  // Red zone arc
  if (redZone != null) {
    const rzStart = toRad(START_DEG + redZone * SPAN_DEG);
    ctx.beginPath();
    ctx.arc(cx, cy, r, rzStart, toRad(END_DEG));
    ctx.strokeStyle = "rgba(220,50,30,0.55)";
    ctx.lineWidth   = 3;
    ctx.stroke();
  }

  // Tick marks + labels
  ctx.save();
  ctx.font = `${Math.max(7, Math.round(W * 0.13))}px 'JetBrains Mono', monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const {l, p} of scale) {
    const angDeg = START_DEG + p * SPAN_DEG;
    const angRad = toRad(angDeg);
    const cos = Math.cos(angRad), sin = Math.sin(angRad);
    const outer = r + 2;
    const inner = r - 6;
    const isRed = redZone != null && p >= redZone;
    ctx.strokeStyle = isRed ? "rgba(220,80,50,0.8)" : "rgba(200,134,10,0.6)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx + cos * inner, cy + sin * inner);
    ctx.lineTo(cx + cos * outer, cy + sin * outer);
    ctx.stroke();
    const lx = cx + cos * (r - 14);
    const ly = cy + sin * (r - 14);
    ctx.fillStyle = isRed ? "rgba(220,80,50,0.9)" : "rgba(200,180,120,0.75)";
    ctx.fillText(l, lx, ly);
  }
  ctx.restore();

  // Needle
  const clampedVal = Math.max(0, Math.min(1, value));
  const needleAngle = toRad(START_DEG + clampedVal * SPAN_DEG);
  const needleCos = Math.cos(needleAngle), needleSin = Math.sin(needleAngle);
  const needleLen = r - 4;
  const pivotBack = 6;

  ctx.beginPath();
  ctx.moveTo(cx - needleCos * pivotBack, cy - needleSin * pivotBack);
  ctx.lineTo(cx + needleCos * needleLen * 0.7, cy + needleSin * needleLen * 0.7);
  ctx.strokeStyle = "rgba(240,237,232,0.35)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx + needleCos * needleLen * 0.7, cy + needleSin * needleLen * 0.7);
  ctx.lineTo(cx + needleCos * needleLen, cy + needleSin * needleLen);
  ctx.strokeStyle = clampedVal >= (redZone ?? 2) ? "rgba(220,60,40,0.95)" : "rgba(200,134,10,0.95)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Center hub
  ctx.beginPath();
  ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = arcColor;
  ctx.fill();

  // Label
  if (label) {
    ctx.font = `${Math.max(7, Math.round(W * 0.12))}px 'Chakra Petch', monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "rgba(200,134,10,0.5)";
    ctx.fillText(label, cx, cy - r * 0.35);
  }
}

function drawVU(ctx, W, H, rL, rR, peakLVal, peakRVal) {
  const bw      = Math.floor((W - 6) / 2);
  const N_SEGS  = 24;
  const segH    = Math.floor(H / N_SEGS);
  const segGap  = 2;
  const segFill = segH - segGap;

  function segColor(segFrac) {
    if (segFrac >= 0.88) return "#e52020"; // clip
    if (segFrac >= 0.70) return "#e56020"; // hot
    if (segFrac >= 0.45) return "#14dc14"; // mid (Serato green)
    return "#1464dc";                       // low (bass blue)
  }

  function drawSegBar(x, level, peak) {
    const lit = Math.round(level * N_SEGS);
    for (let s = 0; s < N_SEGS; s++) {
      const segFrac = s / N_SEGS;
      const y = H - (s + 1) * segH + segGap;
      ctx.fillStyle = segColor(segFrac);
      ctx.globalAlpha = s < lit ? 1 : 0.1;
      ctx.fillRect(x, y, bw, segFill);
    }
    ctx.globalAlpha = 1;
    if (peak > 0.03) {
      const peakSeg = Math.min(Math.round(peak * N_SEGS), N_SEGS - 1);
      const py = H - (peakSeg + 1) * segH + segGap;
      ctx.fillStyle = PEAK_TICK;
      ctx.fillRect(x, py, bw, 2);
    }
  }

  drawSegBar(0, rL, peakLVal);
  drawSegBar(bw + 6, rR, peakRVal);
}

// Pass Serato freq hex values through unchanged.
function pscFreqColor(hexColor) {
  return hexColor;
}

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

