// Canvas-based waveform renderer for deck view.
// Physics-correct Serato model: bass→RED, mid→GREEN, high→BLUE.
// Each band is drawn as its own semi-transparent layer at screen blend mode so
// they combine additively: bass+mid=yellow, mid+high=cyan, all=white.
// Each band's bar height is proportional to that band's own amplitude, so
// spectral structure is visible within every bar.

import { useEffect, useRef } from "react";
import { getWaveformBars } from "../utils/waveform";

const ZOOM_MIN = 1;
const ZOOM_MAX = 100;

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
  onZoomChange = null,
  loopRegion = null,
}) {
  const canvasRef      = useRef(null);
  const overviewRef    = useRef(null);
  const animFrameRef   = useRef(null);
  const displayZoomRef = useRef(zoom);
  const pinchRef       = useRef(null);

  // Refs updated every render so the rAF loop always reads the latest value
  // without restarting the animation on every prop change.
  const currentTimeRef = useRef(currentTime);
  const durationRef    = useRef(duration);
  const zoomRef        = useRef(zoom);
  const onZoomChangeRef = useRef(onZoomChange);

  currentTimeRef.current  = currentTime;
  durationRef.current     = duration;
  zoomRef.current         = zoom;
  onZoomChangeRef.current = onZoomChange;

  // Main waveform draw + rAF loop.
  // currentTime / duration intentionally excluded from deps — read via refs
  // so the animation loop runs continuously without restarting every frame.
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
      const zTarget = zoomRef.current;

      ctx.clearRect(0, 0, w, height);

      let peaks;
      if (waveformData && Array.isArray(waveformData)) {
        peaks = waveformData;
      } else {
        peaks = getWaveformBars(trackId, 1000).map(pct => ({
          peak: pct / 100,
          freq: "#666666",
        }));
      }

      const barCount = peaks.length;

      // Smooth zoom lerp — ~300ms at 60fps
      displayZoomRef.current += (zTarget - displayZoomRef.current) * 0.12;
      const displayZoom = displayZoomRef.current;

      const visibleBars  = Math.round(barCount / displayZoom);
      const playheadFrac = dur > 0 ? ct / dur : 0;
      const centerBar    = Math.round(playheadFrac * barCount);
      const startBar     = Math.max(0, Math.min(centerBar - Math.round(visibleBars / 2), barCount - visibleBars));
      const endBar       = Math.min(barCount, startBar + visibleBars);
      const barWidth     = w / (endBar - startBar);
      const playheadX    = ((centerBar - startBar) / (endBar - startBar)) * w;
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

      // ── Phase 1: waveform layers — screen blend for additive RGB mixing ──
      // bass→RED, mid→GREEN, high→BLUE.
      // Bars grow from center outward; each band has its own height.
      // Where bands overlap, colors add: R+G=yellow, G+B=cyan, all=white.
      // Played side is dimmed (a=0.20), future side is bright (a=0.88).
      ctx.globalCompositeOperation = "screen";

      const transients = [];
      const totalCols  = Math.ceil(w);

      for (let px = 0; px < totalCols; px++) {
        const isPast   = px < playheadX;
        const a        = isPast ? 0.20 : 0.88;

        const barFrac = startBar + (px / w) * (endBar - startBar);
        const b0 = Math.max(startBar, Math.min(endBar - 2, Math.floor(barFrac)));
        const b1 = Math.min(endBar - 1, b0 + 1);
        const t  = barFrac - b0;
        const d0 = peaks[b0];
        const d1 = peaks[b1] || d0;
        if (!d0) continue;

        if (d0.bass !== undefined) {
          // 3-band format — layered per-frequency bars
          const bass = d0.bass + (((d1.bass ?? d0.bass) - d0.bass) * t);
          const mid  = d0.mid  + (((d1.mid  ?? d0.mid)  - d0.mid)  * t);
          const high = d0.high + (((d1.high ?? d0.high) - d0.high) * t);

          // sqrt compresses dynamic range, keeping quiet elements visible
          const bH = Math.max(1, Math.sqrt(bass) * halfH * 0.94);
          const mH = Math.max(1, Math.sqrt(mid)  * halfH * 0.94);
          const hH = Math.max(1, Math.sqrt(high) * halfH * 0.94);

          // RED — bass
          ctx.fillStyle = `rgba(255,0,0,${a})`;
          ctx.fillRect(px, halfH - bH, 1, bH);
          ctx.fillRect(px, halfH,      1, bH);

          // GREEN — mid
          ctx.fillStyle = `rgba(0,255,0,${a})`;
          ctx.fillRect(px, halfH - mH, 1, mH);
          ctx.fillRect(px, halfH,      1, mH);

          // BLUE — high
          ctx.fillStyle = `rgba(0,0,255,${a})`;
          ctx.fillRect(px, halfH - hH, 1, hH);
          ctx.fillRect(px, halfH,      1, hH);

          // Collect transient positions for second-pass bright cap
          const maxH = Math.max(bH, mH, hH);
          if (!isPast && maxH > halfH * 0.82) transients.push({ px, maxH });

        } else {
          // Legacy {peak, freq} fallback — single color bar
          const peak  = d0.peak + ((d1.peak - d0.peak) * t);
          const barH  = Math.max(1, peak * halfH);
          const cr    = parseInt(d0.freq.slice(1, 3), 16);
          const cg    = parseInt(d0.freq.slice(3, 5), 16);
          const cb    = parseInt(d0.freq.slice(5, 7), 16);
          ctx.fillStyle = `rgba(${cr},${cg},${cb},${a})`;
          ctx.fillRect(px, halfH - barH, 1, barH);
          ctx.fillRect(px, halfH,        1, barH);
        }
      }

      // ── Phase 2: source-over for everything on top ──────────────────────
      ctx.globalCompositeOperation = "source-over";

      // Transient peak caps — bright white flash at loudest peaks
      for (const { px, maxH } of transients) {
        ctx.fillStyle = "rgba(255,255,220,0.90)";
        ctx.fillRect(px, halfH - maxH - 1, 1, 2);
        ctx.fillRect(px, halfH + maxH - 1, 1, 2);
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
        const n  = parseInt(num, 10);
        const x  = (cue.time / dur) * w;
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

    // Always run the rAF loop — zoom lerp needs it even when paused
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
  }, [waveformData, trackId, width, height, hotCues, cueColors, zoom, loopRegion]);

  // Non-passive wheel listener so preventDefault blocks page scroll
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e) => {
      if (!onZoomChangeRef.current) return;
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.85 : 1 / 0.85;
      const next = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoomRef.current * factor));
      onZoomChangeRef.current(Math.round(next * 10) / 10);
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, []); // mount/unmount only — reads latest values via refs

  // ── Overview strip ────────────────────────────────────────────────────────
  // Compressed full-track view; same screen-blend layered colors.
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

    ctx.globalCompositeOperation = "screen";

    for (let px = 0; px < w; px++) {
      const bStart = Math.floor(px * barsPerPx);
      const bEnd   = Math.min(Math.ceil((px + 1) * barsPerPx) + 1, N);
      let maxPeak = 0, best = null;
      for (let b = bStart; b < bEnd; b++) {
        if (bars[b] && bars[b].peak > maxPeak) { maxPeak = bars[b].peak; best = bars[b]; }
      }
      if (!best) continue;

      const overallH = Math.max(2, Math.round(maxPeak * OVERVIEW_H));

      if (best.bass !== undefined) {
        const bH = Math.max(1, Math.round(Math.sqrt(best.bass) * overallH));
        const mH = Math.max(1, Math.round(Math.sqrt(best.mid)  * overallH));
        const hH = Math.max(1, Math.round(Math.sqrt(best.high) * overallH));

        ctx.fillStyle = "rgba(255,0,0,0.82)";
        ctx.fillRect(px, OVERVIEW_H - bH, 1, bH);
        ctx.fillStyle = "rgba(0,255,0,0.82)";
        ctx.fillRect(px, OVERVIEW_H - mH, 1, mH);
        ctx.fillStyle = "rgba(0,0,255,0.82)";
        ctx.fillRect(px, OVERVIEW_H - hH, 1, hH);
      } else {
        // Legacy single-color fallback
        const cr = best.freq === "#1464dc" ? 20  : best.freq === "#e56020" ? 229 : 20;
        const cg = best.freq === "#1464dc" ? 100 : best.freq === "#e56020" ? 96  : 220;
        const cb = best.freq === "#1464dc" ? 220 : best.freq === "#e56020" ? 32  : 20;
        ctx.fillStyle = `rgba(${cr},${cg},${cb},0.8)`;
        ctx.fillRect(px, OVERVIEW_H - overallH, 1, overallH);
      }
    }

    ctx.globalCompositeOperation = "source-over";

    // Hot cue marks
    if (hotCues && duration > 0) {
      Object.entries(hotCues).forEach(([num, cue]) => {
        if (!cue || typeof cue.time !== "number") return;
        const cx = Math.round((cue.time / duration) * w);
        ctx.fillStyle = cueColors[parseInt(num, 10) - 1] || "rgba(255,255,255,0.7)";
        ctx.fillRect(cx, 0, 1, OVERVIEW_H);
      });
    }

    // Playhead
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
    const totalBars  = waveformData?.length ?? 1000;
    const visibleBars = Math.round(totalBars / zoom);
    const centerBar   = Math.round((currentTime / duration) * totalBars);
    const startBar    = Math.max(0, Math.min(centerBar - Math.round(visibleBars / 2), totalBars - visibleBars));
    const clickedBar  = startBar + Math.round(frac * visibleBars);
    onSeek(Math.max(0, Math.min((clickedBar / totalBars) * duration, duration)));
  };

  const handleOverviewClick = (e) => {
    if (!onSeek || !duration) return;
    const rect = overviewRef.current.getBoundingClientRect();
    onSeek(((e.clientX - rect.left) / rect.width) * duration);
  };

  const pinchDist = (touches) =>
    Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);

  const handleTouchStart = (e) => {
    if (!onZoomChange || e.touches.length !== 2) return;
    pinchRef.current = { dist: pinchDist(e.touches), zoom };
  };
  const handleTouchMove = (e) => {
    if (!onZoomChange || e.touches.length !== 2 || !pinchRef.current) return;
    e.preventDefault();
    const scale = pinchDist(e.touches) / pinchRef.current.dist;
    const next  = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, pinchRef.current.zoom * scale));
    onZoomChange(Math.round(next * 10) / 10);
  };
  const handleTouchEnd = () => { pinchRef.current = null; };

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", position: "relative" }}>
      <canvas
        ref={overviewRef}
        onClick={handleOverviewClick}
        style={{ width: "100%", height: "24px", cursor: onSeek ? "pointer" : "default", display: "block", flexShrink: 0 }}
      />
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          width: "100%",
          height: `${height}px`,
          cursor: onSeek ? "pointer" : "default",
          display: "block",
          flex: 1,
          touchAction: onZoomChange ? "none" : "auto",
        }}
      />
      {onZoomChange && (
        <div style={{
          position: "absolute", bottom: 4, right: 6,
          fontSize: "0.55rem", fontFamily: "'Chakra Petch', monospace",
          color: "rgba(255,255,255,0.35)", letterSpacing: "0.06em",
          pointerEvents: "none", userSelect: "none",
        }}>
          {zoom >= 10 ? `${Math.round(zoom)}×` : `${zoom.toFixed(1)}×`}
        </div>
      )}
    </div>
  );
}
