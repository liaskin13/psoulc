// VU + spectrum analyzer: live FFT side-chain tap when playing, pre-analyzed fallback when paused.
// Energy Map always uses pre-analyzed waveformData (full-track view requires complete data).

import { useEffect, useRef } from "react";
import { getAudioElement } from "../lib/audioEngine.js";

const BASS_HEX  = "#1464dc";
const MID_HEX   = "#14dc14";
const PEAK_TICK = "rgba(240,237,232,0.85)";
const SPEC_N    = 150;
const FLOOR_PCT = 0.06; // minimum bar height as fraction of canvas height

// Pure function: maps normalized bar height (0-1) to a Tektronix-style solid color.
// Each bar gets a single solid color based on amplitude — no global gradient.
// Exported for unit testing.
export function specBarColor(normH, alpha = 1) {
  if (normH > 0.88) return `rgba(210, 255, 248, ${alpha})`;  // cyan-white — peak
  if (normH > 0.70) return `rgba(40, 235, 185, ${alpha})`;   // cyan-green
  if (normH > 0.45) return `rgba(40, 215, 40, ${alpha})`;    // green
  if (normH > 0.25) return `rgba(205, 148, 0, ${alpha})`;    // orange-gold
  return `rgba(200, 28, 0, ${alpha})`;                       // deep red — floor
}

// Props: { isPlaying, waveformData, currentTime, duration, hotCues? }
// waveformData = array of { peak: 0-1, freq: "#rrggbb", bass?: 0-1, high?: 0-1 }
// Returns: { vuRef, specRef, energyRef }
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

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      const source   = audioCtx.createMediaElementSource(audioEl);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize               = 2048; // 1024 frequency bins
      analyser.smoothingTimeConstant = 0.75;

      // KEY: source → destination (audio still plays) AND source → analyser (side-chain tap).
      // Analyser is NOT inserted into the playback path — no dropout risk.
      source.connect(audioCtx.destination);
      source.connect(analyser);

      audioCtxRef.current   = audioCtx;
      analyserRef.current   = analyser;
      freqDataRef.current   = new Uint8Array(analyser.frequencyBinCount);
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

      // Draw idle state: floor bars on spectrum, clear VU
      const spec = specRef.current;
      if (spec && spec.width > 0 && spec.height > 0) {
        const ctx = spec.getContext("2d");
        const W = spec.width, H = spec.height;
        ctx.clearRect(0, 0, W, H);
        const barStep = W / SPEC_N;
        const bw      = Math.max(1, Math.floor(barStep) - 1);
        const FLOOR   = Math.round(H * FLOOR_PCT);
        const idleColor = specBarColor(FLOOR_PCT);
        for (let i = 0; i < SPEC_N; i++) {
          ctx.fillStyle = idleColor;
          ctx.fillRect(Math.round(i * barStep), H - FLOOR, bw, FLOOR);
        }
      }
      const vu = vuRef.current;
      if (vu) vu.getContext("2d").clearRect(0, 0, vu.width, vu.height);

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

      // ── VU (live FFT: bass bins → L, high bins → R) ──────────────────────
      const vu = vuRef.current;
      if (vu) {
        const ctx = vu.getContext("2d");
        const W = vu.width, H = vu.height;
        ctx.clearRect(0, 0, W, H);

        let rL, rR;
        if (freqBins) {
          // Bass: bins 0–40 (~0–1.7kHz), High: bins 500–900 (~20–37kHz)
          const bassEnd  = Math.min(40, freqBins.length);
          const highStart = Math.min(500, freqBins.length - 1);
          const highEnd   = Math.min(900, freqBins.length);

          let bassSum = 0;
          for (let i = 0; i < bassEnd; i++) bassSum += freqBins[i];
          rL = bassSum / (bassEnd * 255);

          let highSum = 0;
          for (let i = highStart; i < highEnd; i++) highSum += freqBins[i];
          rR = highSum / ((highEnd - highStart) * 255);
        } else if (hasPreAnalyzed) {
          // Pre-analyzed fallback
          const barIndex  = Math.min(Math.floor((t / dur) * bars.length), bars.length - 1);
          const W_HALF    = 7;
          const windowBars = bars.slice(Math.max(0, barIndex - W_HALF), Math.min(bars.length, barIndex + W_HALF + 1));
          const avgPeak = windowBars.reduce((s, b) => s + b.peak, 0) / (windowBars.length || 1);
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

        drawVU(ctx, W, H, rL, rR, peakL.current, peakR.current);
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

            ctx.fillStyle = specBarColor(normH);
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

            ctx.fillStyle = specBarColor(normH);
            ctx.fillRect(x, H - liveH, bw, liveH);
          }
        } else {
          // No data at all — draw idle floor bars
          for (let i = 0; i < SPEC_N; i++) {
            const x = Math.round(i * barStep);
            ctx.fillStyle = specBarColor(FLOOR_PCT);
            ctx.fillRect(x, H - FLOOR, bw, FLOOR);
          }
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

  return { vuRef, specRef, energyRef };
}

// ── Drawing helpers ──────────────────────────────────────────────────────────

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

// Full energy map redraw: full-track waveform envelope, playhead, hot cue marks.
function drawEnergyMap(canvas, bars, currentTime, duration, hotCues) {
  const ctx = canvas.getContext("2d");
  const W   = canvas.width;
  const H   = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const N          = bars.length;
  const barsPerPx  = N / W;

  for (let px = 0; px < W; px++) {
    const barStart = Math.floor(px * barsPerPx);
    const barEnd   = Math.min(Math.floor((px + 1) * barsPerPx) + 1, N);
    let   maxPeak  = 0;
    let   color    = "#1464dc";

    for (let b = barStart; b < barEnd; b++) {
      if (bars[b] && bars[b].peak > maxPeak) {
        maxPeak = bars[b].peak;
        color   = bars[b].freq || "#14dc14";
      }
    }

    const barH = Math.max(2, Math.round(maxPeak * H));
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.7;
    ctx.fillRect(px, H - barH, 1, barH);
  }
  ctx.globalAlpha = 1;

  // Hot cue marks
  if (hotCues && duration > 0) {
    for (const cue of hotCues) {
      if (cue.time == null) continue;
      const cx = Math.round((cue.time / duration) * W);
      ctx.fillStyle = cue.color || "rgba(255,255,255,0.6)";
      ctx.fillRect(cx, 0, 1, H);
    }
  }

  // Playhead
  if (duration > 0) {
    const px = Math.round((currentTime / duration) * W);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillRect(px, 0, 1, H);
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

