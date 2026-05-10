import { useEffect, useRef } from "react";
import * as audioEngine from "../lib/audioEngine";

const BASS = "#1464dc";
const MID = "#14dc14";
const HIGH = "#e56020";
const CLIP = "#e52020";
const PEAK_TICK = "rgba(240,237,232,0.85)";

export default function AudioAnalyzer({ isPlaying }) {
  const vuRef = useRef(null);
  const specRef = useRef(null);
  const rafRef = useRef(null);
  const peakL = useRef(0);
  const peakR = useRef(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    if (!isPlaying) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
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

      // VU — L: lower 128 bins (bass/mids), R: upper 128 bins (presence/air)
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

        // L bar
        const lH = Math.round(rL * H);
        ctx.fillStyle = rL > 0.85 ? CLIP : rL > 0.55 ? MID : BASS;
        if (lH > 0) ctx.fillRect(0, H - lH, bw, lH);
        if (peakL.current > 0.03) {
          ctx.fillStyle = PEAK_TICK;
          ctx.fillRect(0, H - Math.round(peakL.current * H) - 1, bw, 2);
        }

        // R bar
        const rH = Math.round(rR * H);
        ctx.fillStyle = rR > 0.85 ? CLIP : rR > 0.55 ? HIGH : BASS;
        if (rH > 0) ctx.fillRect(bw + 3, H - rH, bw, rH);
        if (peakR.current > 0.03) {
          ctx.fillStyle = PEAK_TICK;
          ctx.fillRect(bw + 3, H - Math.round(peakR.current * H) - 1, bw, 2);
        }
      }

      // Spectrum — 32 bars over bins 0-96 (~8 kHz)
      const spec = specRef.current;
      if (spec) {
        const ctx = spec.getContext("2d");
        const W = spec.width;
        const H = spec.height;
        ctx.clearRect(0, 0, W, H);

        const N = 32;
        const USE = 96;
        const bpb = Math.floor(USE / N); // bins per bar
        const bw = Math.floor(W / N) - 1;

        for (let i = 0; i < N; i++) {
          let sum = 0;
          for (let j = 0; j < bpb; j++) sum += freqData[i * bpb + j];
          const v = sum / bpb / 255;
          const bH = Math.round(v * H);
          if (bH < 1) continue;

          ctx.fillStyle = i < 6 ? BASS : i < 22 ? MID : HIGH;
          ctx.globalAlpha = 0.5 + v * 0.5;
          ctx.fillRect(i * (bw + 1), H - bH, bw, bH);
        }
        ctx.globalAlpha = 1;
      }
    }

    draw();
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isPlaying]);

  return (
    <div className="arch-analyzer-wrap" aria-hidden="true">
      <span className="arch-monitor-label">VU</span>
      <canvas ref={vuRef} className="arch-vu-canvas" width={25} height={44} />
      <span className="arch-monitor-label">SPECTRUM</span>
      <canvas ref={specRef} className="arch-spectrum-canvas" width={200} height={44} />
    </div>
  );
}
