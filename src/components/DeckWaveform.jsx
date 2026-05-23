// Canvas-based waveform renderer for deck view.
// Physics-correct Serato model: bass→RED, mid→GREEN, high→BLUE.
// Each band is drawn as its own semi-transparent layer at screen blend mode so
// they combine additively: bass+mid=yellow, mid+high=cyan, all=white.
// Each band's bar height is proportional to that band's own amplitude, so
// spectral structure is visible within every bar.

import { useEffect, useRef } from "react";

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
  zoom = 1,
  loopRegion = null,
  isGenerating = false,
  generatingPct = null,
}) {
  const canvasRef      = useRef(null);
  const overviewRef    = useRef(null);
  const animFrameRef   = useRef(null);
  const displayZoomRef = useRef(zoom);

  const currentTimeRef = useRef(currentTime);
  const durationRef    = useRef(duration);
  const zoomRef        = useRef(zoom);

  currentTimeRef.current = currentTime;
  durationRef.current    = duration;
  zoomRef.current        = zoom;

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
      const ct      = currentTimeRef.current;
      const dur     = durationRef.current;
      const zTarget = zoomRef.current;

      ctx.clearRect(0, 0, w, height);

      if (!waveformData || !Array.isArray(waveformData) || waveformData.length === 0) {
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, height / 2); ctx.lineTo(w, height / 2); ctx.stroke();
        return;
      }
      const peaks = waveformData;
      const barCount = peaks.length;

      displayZoomRef.current += (zTarget - displayZoomRef.current) * 0.12;
      const displayZoom = displayZoomRef.current;

      const visibleBars  = Math.round(barCount / displayZoom);
      const playheadFrac = dur > 0 ? ct / dur : 0;
      const centerBar    = Math.round(playheadFrac * barCount);
      const startBar     = centerBar - Math.round(visibleBars / 2);
      const endBar       = startBar + visibleBars;
      const playheadX    = w / 2;
      const halfH        = height / 2;

      // Loop region highlight
      if (loopRegion?.start != null && dur > 0) {
        const lsx = (((loopRegion.start / dur) * barCount - startBar) / (endBar - startBar)) * w;
        const lex = loopRegion.end != null
          ? (((loopRegion.end / dur) * barCount - startBar) / (endBar - startBar)) * w
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

      ctx.globalCompositeOperation = "screen";
      for (let px = 0; px < Math.ceil(w); px++) {
        const isPast  = px < playheadX;
        const dimMult = isPast ? 0.45 : 1.0;
        const bLo = Math.floor(startBar + (px / w) * (endBar - startBar));
        const bHi = Math.ceil(startBar + ((px + 1) / w) * (endBar - startBar));
        let d = null, maxPeak = 0;
        for (let bi = bLo; bi <= bHi; bi++) {
          if (bi < 0 || bi >= barCount) continue;
          if (peaks[bi] && peaks[bi].peak > maxPeak) { maxPeak = peaks[bi].peak; d = peaks[bi]; }
        }
        if (!d) continue;

        if (d.bass !== undefined) {
          const bH = Math.max(1, Math.pow(d.bass, 2.5) * halfH * 0.96);
          ctx.fillStyle = `rgb(${Math.round(d.bass * 255 * dimMult)},0,0)`;
          ctx.fillRect(px, halfH - bH, 1, bH);
          ctx.fillRect(px, halfH,      1, bH);

          const mH = Math.max(1, Math.pow(d.mid, 2.5) * halfH * 0.96);
          ctx.fillStyle = `rgb(0,${Math.round(d.mid * 255 * dimMult)},0)`;
          ctx.fillRect(px, halfH - mH, 1, mH);
          ctx.fillRect(px, halfH,      1, mH);

          const hH = Math.max(1, Math.pow(d.high, 2.5) * halfH * 0.96);
          ctx.fillStyle = `rgb(0,0,${Math.round(d.high * 255 * dimMult)})`;
          ctx.fillRect(px, halfH - hH, 1, hH);
          ctx.fillRect(px, halfH,      1, hH);
        } else {
          const barH = Math.max(1, d.peak * halfH);
          const cr = Math.round(parseInt(d.freq.slice(1,3),16) * dimMult);
          const cg = Math.round(parseInt(d.freq.slice(3,5),16) * dimMult);
          const cb = Math.round(parseInt(d.freq.slice(5,7),16) * dimMult);
          ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
          ctx.fillRect(px, halfH - barH, 1, barH);
          ctx.fillRect(px, halfH,        1, barH);
        }
      }
      ctx.globalCompositeOperation = "source-over";

      // Time ruler ticks — no labels (left of playhead counts down, right counts up)
      const startTimeSec = startBar / 50;
      const endTimeSec   = endBar   / 50;
      ctx.lineWidth = 1;
      for (let sec = Math.ceil(startTimeSec); sec <= Math.floor(endTimeSec); sec++) {
        const xPos  = ((sec * 50 - startBar) / (endBar - startBar)) * w;
        const is5   = sec % 5 === 0;
        const tickH = is5 ? 6 : 3;
        ctx.strokeStyle = `rgba(255,255,255,${is5 ? 0.35 : 0.15})`;
        ctx.beginPath(); ctx.moveTo(xPos, 0);      ctx.lineTo(xPos, tickH);          ctx.stroke();
        ctx.beginPath(); ctx.moveTo(xPos, height); ctx.lineTo(xPos, height - tickH); ctx.stroke();
      }

      // Center reference line
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, halfH); ctx.lineTo(w, halfH); ctx.stroke();

      // Playhead
      ctx.strokeStyle = "rgba(255,255,255,0.92)";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(playheadX, 0); ctx.lineTo(playheadX, height); ctx.stroke();

      // Hot cue markers
      ctx.textAlign = "center";
      Object.entries(hotCues).forEach(([num, cue]) => {
        if (!cue || typeof cue.time !== "number") return;
        const n     = parseInt(num, 10);
        const x     = (cue.time / dur) * w;
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waveformData, trackId, width, height, hotCues, cueColors, zoom, loopRegion]);

  // Prevent page scroll when cursor is over waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e) => { e.preventDefault(); };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, []);

  // Overview strip — spiky power curve matches main waveform
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
    const canvas = canvasRef.current;
    const rect   = canvas.getBoundingClientRect();
    const frac   = (e.clientX - rect.left) / rect.width;
    if (zoom <= 1) { onSeek(frac * duration); return; }
    const totalBars   = waveformData?.length ?? 1000;
    const visibleBars = Math.round(totalBars / zoom);
    const centerBar   = Math.round((currentTime / duration) * totalBars);
    const startBar    = centerBar - Math.round(visibleBars / 2);
    const clickedBar  = startBar + Math.round(frac * visibleBars);
    onSeek(Math.max(0, Math.min((clickedBar / totalBars) * duration, duration)));
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
    </div>
  );
}
