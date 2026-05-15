// Waveform-driven VU + spectrum analyzer.
// Reads pre-analyzed peak/freq data from the loaded track's waveform_data.
// No Web Audio API — audio plays native HTML5, zero risk of silence.

import { useEffect, useRef } from "react";

const BASS_HEX  = "#1464dc";
const MID_HEX   = "#14dc14";
const HIGH_HEX  = "#e56020";
const CLIP_HEX  = "#e52020";
const PEAK_TICK = "rgba(240,237,232,0.85)";

// Props: { isPlaying, waveformData, currentTime, duration }
// waveformData = array of {peak: 0-1, freq: "#rrggbb"} (the .high array)
export default function useAudioAnalyzer({ isPlaying, waveformData, currentTime, duration }) {
  const vuRef   = useRef(null);
  const specRef = useRef(null);
  const rafRef  = useRef(null);
  const peakL   = useRef(0);
  const peakR   = useRef(0);

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

      // Split window by frequency band
      let bassSum = 0, bassCount = 0;
      let midSum  = 0, midCount  = 0;
      let highSum = 0, highCount = 0;
      for (const b of windowBars) {
        if (b.freq === BASS_HEX)     { bassSum += b.peak; bassCount++; }
        else if (b.freq === MID_HEX) { midSum  += b.peak; midCount++;  }
        else                          { highSum += b.peak; highCount++; }
      }
      const avgPeak = windowBars.reduce((s, b) => s + b.peak, 0) / windowBars.length;

      // L = bass energy, R = high energy
      const rL = bassCount > 0 ? bassSum / bassCount : avgPeak * 0.85;
      const rR = highCount > 0 ? highSum / highCount : avgPeak * 0.70;

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
        const ctx = spec.getContext("2d");
        const W = spec.width, H = spec.height;
        ctx.clearRect(0, 0, W, H);

        const SPEC_N = 64;
        const specStart = Math.max(0, barIndex - SPEC_N);
        const bw = Math.floor(W / SPEC_N) - 1;

        for (let i = 0; i < SPEC_N; i++) {
          const b = bars[specStart + i];
          if (!b) continue;
          const bH = Math.round(b.peak * H);
          if (bH < 1) continue;
          ctx.fillStyle = b.freq;
          ctx.globalAlpha = 0.35 + b.peak * 0.65;
          ctx.fillRect(i * (bw + 1), H - bH, bw, bH);
        }
        ctx.globalAlpha = 1;
      }
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    };
  }, [isPlaying]); // only restarts on play/pause — values read live via liveRef

  return { vuRef, specRef };
}
