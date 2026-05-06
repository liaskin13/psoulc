import { useEffect, useRef } from "react";
import * as audioEngine from "../lib/audioEngine";

const BASS = "#1464dc";
const MID  = "#14dc14";
const HIGH = "#e56020";
const CLIP = "#e52020";
const PEAK_TICK = "rgba(240,237,232,0.85)";

export default function useAudioAnalyzer(isPlaying) {
  const vuRef  = useRef(null);
  const specRef = useRef(null);
  const rafRef = useRef(null);
  const peakL  = useRef(0);
  const peakR  = useRef(0);

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

    const analyser = audioEngine.getAnalyser();
    if (!analyser) return;

    const binCount = analyser.frequencyBinCount; // 256
    const freqData = new Uint8Array(binCount);

    function draw() {
      rafRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(freqData);

      // VU — L: lower 128 bins, R: upper 128 bins
      const vu = vuRef.current;
      if (vu) {
        const ctx = vu.getContext("2d");
        const W = vu.width;
        const H = vu.height;
        ctx.clearRect(0, 0, W, H);

        let sL = 0, sR = 0;
        for (let i = 0; i < 128; i++) sL += freqData[i] ** 2;
        for (let i = 128; i < 256; i++) sR += freqData[i] ** 2;
        const rL = Math.sqrt(sL / 128) / 255;
        const rR = Math.sqrt(sR / 128) / 255;

        peakL.current = Math.max(peakL.current * 0.97, rL);
        peakR.current = Math.max(peakR.current * 0.97, rR);

        const bw = Math.floor((W - 3) / 2);

        const lH = Math.round(rL * H);
        ctx.fillStyle = rL > 0.85 ? CLIP : rL > 0.55 ? MID : BASS;
        if (lH > 0) ctx.fillRect(0, H - lH, bw, lH);
        if (peakL.current > 0.03) {
          ctx.fillStyle = PEAK_TICK;
          ctx.fillRect(0, H - Math.round(peakL.current * H) - 1, bw, 2);
        }

        const rH = Math.round(rR * H);
        ctx.fillStyle = rR > 0.85 ? CLIP : rR > 0.55 ? HIGH : BASS;
        if (rH > 0) ctx.fillRect(bw + 3, H - rH, bw, rH);
        if (peakR.current > 0.03) {
          ctx.fillStyle = PEAK_TICK;
          ctx.fillRect(bw + 3, H - Math.round(peakR.current * H) - 1, bw, 2);
        }
      }

      // Spectrum — 64 bars, bins 0-127 (~11 kHz)
      const spec = specRef.current;
      if (spec) {
        const ctx = spec.getContext("2d");
        const W = spec.width;
        const H = spec.height;
        ctx.clearRect(0, 0, W, H);

        const N = 64;
        const USE = 128;
        const bpb = Math.floor(USE / N);
        const bw = Math.floor(W / N) - 1;

        for (let i = 0; i < N; i++) {
          let sum = 0;
          for (let j = 0; j < bpb; j++) sum += freqData[i * bpb + j];
          const v = sum / bpb / 255;
          const bH = Math.round(v * H);
          if (bH < 1) continue;
          ctx.fillStyle = i < 10 ? BASS : i < 38 ? MID : HIGH;
          ctx.globalAlpha = 0.5 + v * 0.5;
          ctx.fillRect(i * (bw + 1), H - bH, bw, bH);
        }
        ctx.globalAlpha = 1;
      }
    }

    draw();
    return () => {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    };
  }, [isPlaying]);

  return { vuRef, specRef };
}
