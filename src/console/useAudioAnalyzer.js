// Waveform-driven VU + spectrum analyzer.
// Reads pre-analyzed peak/freq data from the loaded track's waveform_data.
// No Web Audio API — audio plays native HTML5, zero risk of silence.

import { useEffect, useRef } from "react";

const BASS_HEX  = "#1464dc";
const MID_HEX   = "#14dc14";
const HIGH_HEX  = "#e56020";
const CLIP_HEX  = "#e52020";
const PEAK_TICK = "rgba(240,237,232,0.85)";

const SPEC_N = 150;

// Props: { isPlaying, waveformData, currentTime, duration }
// waveformData = array of {peak: 0-1, freq: "#rrggbb"} (the .high array)
export default function useAudioAnalyzer({ isPlaying, waveformData, currentTime, duration }) {
  const vuRef       = useRef(null);
  const specRef     = useRef(null);
  const rafRef      = useRef(null);
  const peakL       = useRef(0);
  const peakR       = useRef(0);
  const specPeakRef = useRef(new Float32Array(150)); // per-column peak hold

  // liveRef carries values into the RAF loop without re-triggering the effect
  const liveRef = useRef({ waveformData, currentTime, duration });
  liveRef.current = { waveformData, currentTime, duration };

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    if (!isPlaying) {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      [vuRef.current, specRef.current].forEach((c) => {
        if (c) c.getContext("2d").clearRect(0, 0, c.width, c.height);
      });
      peakL.current = 0;
      peakR.current = 0;
      specPeakRef.current = new Float32Array(SPEC_N);
      return;
    }

    function draw() {
      rafRef.current = requestAnimationFrame(draw);

      const { waveformData: bars, currentTime: t, duration: dur } = liveRef.current;
      if (!bars || !bars.length || !dur || dur <= 0) return;

      const N = bars.length;
      const barIndex = Math.min(Math.floor((t / dur) * N), N - 1);
      const W_HALF = 7; // half-window of bars to sample

      // Gather bars in the current playback window
      const windowBars = [];
      for (let i = Math.max(0, barIndex - W_HALF); i <= Math.min(N - 1, barIndex + W_HALF); i++) {
        if (bars[i]) windowBars.push(bars[i]);
      }
      if (!windowBars.length) return;

      const avgPeak = windowBars.reduce((s, b) => s + b.peak, 0) / windowBars.length;

      // Use direct band fields when available, fall back to freq-based classification
      let rL, rR;
      if (windowBars[0]?.bass !== undefined) {
        rL = windowBars.reduce((s, b) => s + b.bass, 0) / windowBars.length;
        rR = windowBars.reduce((s, b) => s + b.high, 0) / windowBars.length;
      } else {
        let bassSum = 0, bassCount = 0, highSum = 0, highCount = 0;
        for (const b of windowBars) {
          if (b.freq === BASS_HEX)  { bassSum += b.peak; bassCount++; }
          else if (b.freq !== MID_HEX) { highSum += b.peak; highCount++; }
        }
        rL = bassCount > 0 ? bassSum / bassCount : avgPeak * 0.85;
        rR = highCount > 0 ? highSum / highCount : avgPeak * 0.70;
      }

      // ── VU ──────────────────────────────────────────────────────────────
      const vu = vuRef.current;
      if (vu) {
        const ctx = vu.getContext("2d");
        const W = vu.width, H = vu.height;
        ctx.clearRect(0, 0, W, H);

        peakL.current = Math.max(peakL.current * 0.97, rL);
        peakR.current = Math.max(peakR.current * 0.97, rR);

        const bw = Math.floor((W - 6) / 2);
        const N_SEGS = 24;
        const segH = Math.floor(H / N_SEGS);
        const segGap = 2;
        const segFill = segH - segGap;

        // Serato color scheme: blue (low) → green (mid) → orange (hot) → red (clip)
        function segColor(segFrac) {
          if (segFrac >= 0.88) return CLIP_HEX;
          if (segFrac >= 0.70) return HIGH_HEX;
          if (segFrac >= 0.45) return MID_HEX;
          return BASS_HEX;
        }

        function drawSegBar(x, level, peak) {
          const lit = Math.round(level * N_SEGS);
          for (let s = 0; s < N_SEGS; s++) {
            const segFrac = s / N_SEGS;
            const color = segColor(segFrac);
            const y = H - (s + 1) * segH + segGap;
            ctx.fillStyle = color;
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

        drawSegBar(0, rL, peakL.current);
        drawSegBar(bw + 6, rR, peakR.current);
      }

      // ── Spectrum ─────────────────────────────────────────────────────────
      const spec = specRef.current;
      if (spec) {
        // Sync canvas buffer to actual CSS display size
        const dispW = spec.offsetWidth;
        const dispH = spec.offsetHeight;
        if (dispW > 0 && dispH > 0 && (spec.width !== dispW || spec.height !== dispH)) {
          spec.width  = dispW;
          spec.height = dispH;
        }

        const ctx = spec.getContext("2d");
        const W = spec.width, H = spec.height;
        ctx.clearRect(0, 0, W, H);

        const specStart = Math.max(0, barIndex - SPEC_N);
        // Bar width — 150 bars across the canvas gives ~7px each at 1100px
        const barStep = W / SPEC_N;
        const bw = Math.max(1, Math.floor(barStep));
        const peakArr = specPeakRef.current;
        const FLOOR = Math.round(H * 0.08);

        // Global Tektronix gradient: color = amplitude, created once for the full canvas height.
        // Tall bars reach into cyan-white; mid bars hit green/gold; short bars stay in red.
        const liveGrad = ctx.createLinearGradient(0, 0, 0, H);
        liveGrad.addColorStop(0,    "rgba(210,255,248,0.96)"); // cyan-white — tallest peaks
        liveGrad.addColorStop(0.15, "rgba(40,235,185,0.93)");  // cyan-green
        liveGrad.addColorStop(0.38, "rgba(40,215,40,0.90)");   // green
        liveGrad.addColorStop(0.60, "rgba(205,148,0,0.90)");   // orange-gold
        liveGrad.addColorStop(0.80, "rgba(200,28,0,0.93)");    // deep red
        liveGrad.addColorStop(1.0,  "rgba(108,8,0,0.97)");     // floor — always visible

        for (let i = 0; i < SPEC_N; i++) {
          const b = bars[specStart + i];
          const liveH = b ? Math.max(Math.round(b.peak * H), FLOOR) : FLOOR;

          // Decay peak hold then clamp to live if live exceeded it
          peakArr[i] = Math.max(peakArr[i] * 0.985, liveH);
          const maxH = Math.round(peakArr[i]);

          const x = Math.round(i * barStep);

          // IntermodAnalyzer: salmon ghost fills from live top up to max-hold
          if (maxH > liveH + 1) {
            ctx.fillStyle = "rgba(225,85,68,0.42)";
            ctx.fillRect(x, H - maxH, bw, maxH - liveH);
          }

          // Tektronix: live bar uses the global gradient — tall bars are cyan, short bars are red
          ctx.fillStyle = liveGrad;
          ctx.fillRect(x, H - liveH, bw, liveH);
        }
      }
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    };
  }, [isPlaying]); // only restarts on play/pause — values read live via liveRef

  return { vuRef, specRef };
}
