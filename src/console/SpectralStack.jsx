import React, { useEffect, useRef } from "react";

// SpectralStack — The Helix
// Renders tracks from the active vault as stacked amber sine-wave layers.
// Waveforms are synthesized from BPM + index — no extra Supabase columns needed.
// Lives behind the hero + tracklist in the MONITOR column (z-index: 1).

const FALLBACK_BPMS = [88, 93, 104];
const SCROLL_SPEED = 20; // px per second

export default function SpectralStack({ tracks = [] }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const offsetRef = useRef(0);
  const prevTimeRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const sources =
      tracks.length > 0
        ? tracks.slice(0, 10).map((t, i) => ({ bpm: t.bpm || 90, index: i }))
        : FALLBACK_BPMS.map((bpm, i) => ({ bpm, index: i }));

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    function draw(ts) {
      if (prevTimeRef.current != null) {
        const dt = (ts - prevTimeRef.current) / 1000;
        offsetRef.current += SCROLL_SPEED * dt;
      }
      prevTimeRef.current = ts;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      sources.forEach(({ bpm, index }) => {
        const amplitude = 20 + (bpm % 40);
        const freq = bpm / 120;
        const phase = index * (Math.PI / 5);
        const baseline = h * 0.5 + (index - sources.length / 2) * 18;
        const opacity = 0.08 + index * 0.015;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(240, 237, 232, ${Math.min(opacity, 0.12)})`;
        ctx.lineWidth = 1.5;

        for (let x = 0; x <= w; x += 2) {
          const t = (x + offsetRef.current) / w;
          const y =
            baseline + amplitude * Math.sin(freq * t * Math.PI * 2 + phase);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [tracks]);

  return (
    <canvas
      ref={canvasRef}
      className="spectral-stack-canvas"
      aria-hidden="true"
    />
  );
}
