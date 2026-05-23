// Canvas-based waveform renderer for deck view.
// Physics-correct Serato model: bass→RED, mid→GREEN, high→BLUE.
// Fixed time window centered on playhead — waveform scrolls in real time.
// Three presets: 64s / 32s (default) / 16s.

import { useEffect, useRef, useState } from "react";

export default function DeckWaveform({
  waveformData = null,
  currentTime = 0,
  duration = 1,
  onSeek = null,
  trackId = "default",
  width = 800,
  height = 120,
  hotCues = {},
  cueColors = [],
  loopRegion = null,
  isGenerating = false,
  generatingPct = null,
}) {
  const canvasRef    = useRef(null);
  const overviewRef  = useRef(null);
  const animFrameRef = useRef(null);

  const currentTimeRef   = useRef(currentTime);
  const durationRef      = useRef(duration);
  const [windowSeconds, setWindowSeconds] = useState(32);
  const windowSecondsRef = useRef(32);

  currentTimeRef.current   = currentTime;
  durationRef.current      = duration;
  windowSecondsRef.current = windowSeconds;

  // Main waveform draw + rAF loop.
  // currentTime / duration read via refs so the loop runs without restarting every frame.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const w   = canvas.offsetWidth || width;

    canvas.width  = w * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    function draw() {
      const ct  = currentTimeRef.current;
      const dur = durationRef.current;
      const win = windowSecondsRef.current;

      ctx.clearRect(0, 0, w, height);

      if (!waveformData || !Array.isArray(waveformData) || waveformData.length === 0) {
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, height / 2); ctx.lineTo(w, height / 2); ctx.stroke();
        return;
      }
      const peaks    = waveformData;
      const barCount = peaks.length;
      const halfH    = height / 2;
      const playheadX = w / 2;

      // Time-window: viewStart → viewEnd, centered on playhead
      const pixelsPerSec = w / win;
      const viewStart    = ct - win / 2;

      // Loop region highlight
      if (loopRegion?.start != null && dur > 0) {
        const lsx = (loopRegion.start - viewStart) * pixelsPerSec;
        const lex = loopRegion.end != null
          ? (loopRegion.end - viewStart) * pixelsPerSec
          : playheadX;
        if (lex > lsx) {
          ctx.fillStyle = "rgba(0,204,204,0.12)";
          ctx.fillRect(Math.max(0, lsx), 0, Math.min(lex - lsx, w), height);
          ctx.strokeStyle = "rgba(0,204,204,0.5)";
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(Math.max(0, lsx), 0); ctx.lineTo(Math.max(0, lsx), height); ctx.stroke();
          if (loopRegion.end != null) {
            ctx.beginPath(); ctx.moveTo(Math.min(lex, w), 0); ctx.lineTo(Math.min(lex, w), height); ctx.stroke();
          }
        }
      }

      // Waveform bars — one column per pixel, time-mapped to bar index
      for (let px = 0; px < Math.ceil(w); px++) {
        const isPast  = px < playheadX;
        const dimMult = isPast ? 0.45 : 1.0;

        const barTime = viewStart + (px / w) * win;
        const barIdx  = Math.floor((barTime / dur) * barCount);
        if (barIdx < 0 || barIdx >= barCount) continue;
        const d = peaks[barIdx];
        if (!d) continue;

        const barH = Math.max(1, Math.pow(d.peak, 2.5) * halfH * 0.96);

        if (d.bass !== undefined) {
          const r = Math.round(d.bass * 255 * dimMult);
          const g = Math.round(d.mid  * 255 * dimMult);
          const b = Math.round(d.high * 255 * dimMult);
          ctx.fillStyle = `rgb(${r},${g},${b})`;
        } else {
          const cr = Math.round(parseInt(d.freq.slice(1, 3), 16) * dimMult);
          const cg = Math.round(parseInt(d.freq.slice(3, 5), 16) * dimMult);
          const cb = Math.round(parseInt(d.freq.slice(5, 7), 16) * dimMult);
          ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
        }
        ctx.fillRect(px, halfH - barH, 1, barH);
        ctx.fillRect(px, halfH,        1, barH);
      }

      // Center reference line
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, halfH); ctx.lineTo(w, halfH); ctx.stroke();

      // Playhead
      ctx.strokeStyle = "rgba(255,255,255,0.92)";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(playheadX, 0); ctx.lineTo(playheadX, height); ctx.stroke();

      // Hot cue markers — time-based positioning
      ctx.textAlign = "center";
      Object.entries(hotCues).forEach(([num, cue]) => {
        if (!cue || typeof cue.time !== "number") return;
        const n = parseInt(num, 10);
        const x = Math.round((cue.time - viewStart) * pixelsPerSec);
        if (x < -10 || x > w + 10) return;
        const color = cueColors[n - 1] || "#ffffff";
        const isB2  = n > 8;

        ctx.strokeStyle = color;
        ctx.lineWidth = isB2 ? 1.5 : 2;
        if (isB2) ctx.setLineDash([4, 3]); else ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
        ctx.setLineDash([]);

        if (isB2) {
          ctx.strokeStyle = color; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(x - 6, height); ctx.lineTo(x + 6, height); ctx.lineTo(x, height - 12); ctx.closePath(); ctx.stroke();
          ctx.fillStyle = color;
          ctx.font = "bold 7px JetBrains Mono, monospace";
          ctx.fillText(num, x, height - 4);
        } else {
          ctx.fillStyle = color;
          ctx.beginPath(); ctx.moveTo(x - 6, 0); ctx.lineTo(x + 6, 0); ctx.lineTo(x, 12); ctx.closePath(); ctx.fill();
          ctx.fillStyle = "#000";
          ctx.font = "bold 7px JetBrains Mono, monospace";
          ctx.fillText(num, x, 10);
        }
      });
      ctx.textAlign = "left";
    }

    draw();
    let raf;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!prefersReduced) {
      const animate = () => { draw(); raf = requestAnimationFrame(animate); };
      raf = requestAnimationFrame(animate);
      animFrameRef.current = raf;
    }

    return () => { if (raf) cancelAnimationFrame(raf); };
  // currentTime / duration intentionally omitted — handled via refs above
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waveformData, trackId, width, height, hotCues, cueColors, loopRegion, windowSeconds]);

  // Overview strip — compressed full-track view, same spectral colors + power curve
  useEffect(() => {
    const canvas = overviewRef.current;
    if (!canvas || !waveformData?.length || !duration) return;

    const OVERVIEW_H = 24;
    const dpr = window.devicePixelRatio || 1;
    const w   = canvas.offsetWidth || 800;
    canvas.width  = w * dpr;
    canvas.height = OVERVIEW_H * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, OVERVIEW_H);

    const bars      = waveformData;
    const N         = bars.length;
    const barsPerPx = N / w;

    for (let px = 0; px < w; px++) {
      const bStart = Math.floor(px * barsPerPx);
      const bEnd   = Math.min(Math.ceil((px + 1) * barsPerPx) + 1, N);
      let maxPeak = 0, best = null;
      for (let b = bStart; b < bEnd; b++) {
        if (bars[b] && bars[b].peak > maxPeak) { maxPeak = bars[b].peak; best = bars[b]; }
      }
      if (!best) continue;

      // Same 2.5 power curve as main waveform — spiky, not block
      const overallH = Math.max(1, Math.round(Math.pow(maxPeak, 2.5) * OVERVIEW_H));

      if (best.bass !== undefined) {
        const r = Math.round(best.bass * 255);
        const g = Math.round(best.mid  * 255);
        const b = Math.round(best.high * 255);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(px, OVERVIEW_H - overallH, 1, overallH);
      } else {
        const cr = best.freq === "#1464dc" ? 20  : best.freq === "#e56020" ? 229 : 20;
        const cg = best.freq === "#1464dc" ? 100 : best.freq === "#e56020" ? 96  : 220;
        const cb = best.freq === "#1464dc" ? 220 : best.freq === "#e56020" ? 32  : 20;
        ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
        ctx.fillRect(px, OVERVIEW_H - overallH, 1, overallH);
      }
    }

    if (hotCues && duration > 0) {
      Object.entries(hotCues).forEach(([num, cue]) => {
        if (!cue || typeof cue.time !== "number") return;
        const cx = Math.round((cue.time / duration) * w);
        ctx.fillStyle = cueColors[parseInt(num, 10) - 1] || "rgba(255,255,255,0.7)";
        ctx.fillRect(cx, 0, 1, OVERVIEW_H);
      });
    }

    if (duration > 0) {
      const px = Math.round((currentTime / duration) * w);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fillRect(px, 0, 1, OVERVIEW_H);
    }
  }, [waveformData, currentTime, duration, hotCues, cueColors]);

  const handleClick = (e) => {
    if (!onSeek) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const frac = (e.clientX - rect.left) / rect.width;
    const seekTime = windowSecondsRef.current * (frac - 0.5) + currentTimeRef.current;
    onSeek(Math.max(0, Math.min(seekTime, duration)));
  };

  const handleOverviewClick = (e) => {
    if (!onSeek || !duration) return;
    const rect = overviewRef.current.getBoundingClientRect();
    onSeek(((e.clientX - rect.left) / rect.width) * duration);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", position: "relative" }}>
      {isGenerating && (
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 2, pointerEvents: "none",
          fontSize: "0.6rem", fontFamily: "'Chakra Petch', monospace",
          color: "rgba(255,255,255,0.55)", letterSpacing: "0.12em",
        }}>
          {generatingPct != null ? `ANALYZING ${generatingPct}%` : "ANALYZING…"}
        </div>
      )}
      <canvas
        ref={overviewRef}
        onClick={handleOverviewClick}
        style={{ width: "100%", height: "24px", cursor: onSeek ? "pointer" : "default", display: "block", flexShrink: 0 }}
      />
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        style={{
          width: "100%",
          height: `${height}px`,
          cursor: onSeek ? "pointer" : "default",
          display: "block",
          flex: 1,
        }}
      />
      <div style={{ display: "flex", gap: 6, marginTop: 4, justifyContent: "flex-end" }}>
        {[64, 32, 16].map(s => (
          <button
            key={s}
            onClick={() => setWindowSeconds(s)}
            style={{
              fontSize: "0.55rem", padding: "2px 8px",
              background: windowSeconds === s ? "rgba(255,255,255,0.15)" : "transparent",
              color: "rgba(255,255,255,0.5)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 3, cursor: "pointer",
              fontFamily: "'Chakra Petch', monospace",
              letterSpacing: "0.06em",
            }}
          >{s}s</button>
        ))}
      </div>
    </div>
  );
}
