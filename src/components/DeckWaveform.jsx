// Canvas-based waveform renderer for deck view
// Serato-style: frequency-colored peaks, playhead, zoom support

import { useEffect, useRef } from "react";
import { getWaveformBars } from "../utils/waveform";

/**
 * DeckWaveform - High-resolution waveform display with playhead
 * @param {Object} props
 * @param {Array} props.waveformData - Real waveform data [{peak, freq}] or null for placeholder
 * @param {number} props.currentTime - Current playback time in seconds
 * @param {number} props.duration - Total track duration in seconds
 * @param {Function} props.onSeek - Callback when user clicks to seek (time in seconds)
 * @param {string} props.trackId - Track ID for placeholder generation
 * @param {number} props.width - Canvas width
 * @param {number} props.height - Canvas height
 * @param {Object} props.hotCues - Hot cues { 1: {time: 10.5}, 2: {time: 45.2}, ... }
 * @param {Array} props.cueColors - Array of 8 Serato colors for cue markers
 */
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
  const displayZoomRef = useRef(zoom); // smoothed zoom for lerp transition
  const pinchRef       = useRef(null); // { dist, zoom } at pinch start
  const zoomRef        = useRef(zoom); // always tracks latest zoom for wheel handler
  zoomRef.current = zoom;
  const onZoomChangeRef = useRef(onZoomChange);
  onZoomChangeRef.current = onZoomChange;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.offsetWidth || width;

    // Set canvas size with device pixel ratio for crisp rendering
    canvas.width = w * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    function draw() {
      const width = w;
      ctx.clearRect(0, 0, width, height);

      // Get waveform data (real or placeholder)
      let peaks;
      if (waveformData && Array.isArray(waveformData)) {
        peaks = waveformData;
      } else {
        // Generate placeholder
        const placeholderBars = getWaveformBars(trackId, 1000);
        peaks = placeholderBars.map((pct) => ({
          peak: pct / 100,
          freq: "#666666",
        }));
      }

      const barCount = peaks.length;
      // Smooth zoom: lerp displayZoom toward target zoom, ~300ms at 60fps
      displayZoomRef.current += (zoom - displayZoomRef.current) * 0.12;
      const displayZoom = displayZoomRef.current;
      // Zoom: show a window of barCount/zoom bars centered on playhead
      const visibleBars = Math.round(barCount / displayZoom);
      const playheadFrac = duration > 0 ? currentTime / duration : 0;
      const centerBar = Math.round(playheadFrac * barCount);
      const startBar = Math.max(
        0,
        Math.min(
          centerBar - Math.round(visibleBars / 2),
          barCount - visibleBars,
        ),
      );
      const endBar = Math.min(barCount, startBar + visibleBars);
      const barWidth = width / (endBar - startBar);
      const playheadX = ((centerBar - startBar) / (endBar - startBar)) * width;

      // Draw loop region highlight
      if (
        loopRegion?.start !== null &&
        loopRegion?.start !== undefined &&
        duration > 0
      ) {
        const loopStartX =
          (((loopRegion.start / duration) * barCount - startBar) /
            (endBar - startBar)) *
          width;
        const loopEndX =
          loopRegion.end !== null
            ? (((loopRegion.end / duration) * barCount - startBar) /
                (endBar - startBar)) *
              width
            : playheadX;
        if (loopEndX > loopStartX) {
          const LOOP_CYAN = "0, 204, 204";
          ctx.fillStyle = `rgba(${LOOP_CYAN}, 0.12)`;
          ctx.fillRect(
            Math.max(0, loopStartX),
            0,
            Math.min(loopEndX - loopStartX, width),
            height,
          );
          ctx.strokeStyle = `rgba(${LOOP_CYAN}, 0.5)`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(Math.max(0, loopStartX), 0);
          ctx.lineTo(Math.max(0, loopStartX), height);
          ctx.stroke();
          if (loopRegion.end !== null) {
            ctx.beginPath();
            ctx.moveTo(Math.min(loopEndX, width), 0);
            ctx.lineTo(Math.min(loopEndX, width), height);
            ctx.stroke();
          }
        }
      }

      // Continuous pixel-resolution rendering — no visible bars.
      // Iterates one logical pixel column at a time, interpolating between adjacent
      // data points so color and height transition smoothly (Serato-style).
      const halfH = height / 2;
      const totalCols = Math.ceil(width);

      for (let px = 0; px < totalCols; px++) {
        const isPast = px < playheadX;
        const alpha = isPast ? 0.25 : 1;

        // Map logical pixel to interpolated position between bars
        const barFrac = startBar + (px / width) * (endBar - startBar);
        const b0 = Math.max(startBar, Math.min(endBar - 2, Math.floor(barFrac)));
        const b1 = Math.min(endBar - 1, b0 + 1);
        const t = barFrac - b0;
        const d0 = peaks[b0], d1 = peaks[b1] || d0;
        if (!d0) continue;

        let cr, cg, cb, barH;
        if (d0.bass !== undefined) {
          // True additive RGB with linear interpolation between adjacent bars.
          // bass→B, mid→G, high→R channels blend to produce the full Serato spectrum:
          // blue, green, orange, cyan, yellow, purple, white.
          const bass = d0.bass + (((d1.bass ?? d0.bass) - d0.bass) * t);
          const mid  = d0.mid  + (((d1.mid  ?? d0.mid)  - d0.mid)  * t);
          const high = d0.high + (((d1.high ?? d0.high) - d0.high) * t);
          const peak = d0.peak + ((d1.peak - d0.peak) * t);
          const bAmp = Math.sqrt(bass), mAmp = Math.sqrt(mid), hAmp = Math.sqrt(high);
          cr = Math.min(255, Math.round(bAmp * 20  + mAmp * 20  + hAmp * 229));
          cg = Math.min(255, Math.round(bAmp * 100 + mAmp * 220 + hAmp * 96));
          cb = Math.min(255, Math.round(bAmp * 220 + mAmp * 20  + hAmp * 32));
          barH = Math.max(1, peak * halfH);
        } else {
          const peak = d0.peak + ((d1.peak - d0.peak) * t);
          barH = Math.max(1, peak * halfH);
          cr = parseInt(d0.freq.slice(1, 3), 16);
          cg = parseInt(d0.freq.slice(3, 5), 16);
          cb = parseInt(d0.freq.slice(5, 7), 16);
        }

        ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`;
        ctx.fillRect(px, halfH - barH, 1, barH);   // upper half
        ctx.fillRect(px, halfH, 1, barH);           // lower half (mirror)

        // Transient peak cap: 2px bright flash at high-amplitude peaks
        if (barH > halfH * 0.80 && !isPast) {
          ctx.fillStyle = "rgba(255,255,220,0.95)";
          ctx.fillRect(px, halfH - barH - 1, 1, 2);
          ctx.fillRect(px, halfH + barH - 1, 1, 2);
        }
      }

      // Draw playhead line
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();

      // Draw center line (reference)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Draw hot cue markers — bank 1 (1-8): filled triangle, bank 2 (9-16): outlined inverse
      ctx.textAlign = "center";
      Object.entries(hotCues).forEach(([num, cue]) => {
        if (!cue || typeof cue.time !== "number") return;
        const n = parseInt(num, 10);
        const x = (cue.time / duration) * width;
        const color = cueColors[n - 1] || "#ffffff";
        const isB2 = n > 8;

        // Vertical line
        ctx.strokeStyle = color;
        ctx.lineWidth = isB2 ? 1.5 : 2;
        if (isB2) ctx.setLineDash([4, 3]);
        else ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
        ctx.setLineDash([]);

        if (isB2) {
          // Outlined downward triangle at bottom
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x - 6, height);
          ctx.lineTo(x + 6, height);
          ctx.lineTo(x, height - 12);
          ctx.closePath();
          ctx.stroke();
          ctx.fillStyle = color;
          ctx.font = "bold 7px JetBrains Mono, monospace";
          ctx.fillText(num, x, height - 4);
        } else {
          // Filled downward triangle at top
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.moveTo(x - 6, 0);
          ctx.lineTo(x + 6, 0);
          ctx.lineTo(x, 12);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#000";
          ctx.font = "bold 7px JetBrains Mono, monospace";
          ctx.fillText(num, x, 10);
        }
      });
      ctx.textAlign = "left";
    }

    // Initial draw
    draw();

    // Redraw on animation frame if playing
    function animate() {
      draw();
      animFrameRef.current = requestAnimationFrame(animate);
    }

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (currentTime > 0 && !prefersReduced) {
      animate();
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [
    waveformData,
    currentTime,
    duration,
    trackId,
    width,
    height,
    hotCues,
    cueColors,
    zoom,
    loopRegion,
  ]);

  // Non-passive wheel listener so we can call preventDefault and block page scroll
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheelNative = (e) => {
      if (!onZoomChangeRef.current) return;
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.85 : 1 / 0.85;
      const next = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoomRef.current * factor));
      onZoomChangeRef.current(Math.round(next * 10) / 10);
    };
    canvas.addEventListener("wheel", onWheelNative, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheelNative);
  }, []); // mount/unmount only — reads latest values via refs

  // ── Overview strip drawing ────────────────────────────────────────────────
  // Full-track compressed miniature: 1px per horizontal pixel, same palette.
  useEffect(() => {
    const canvas = overviewRef.current;
    if (!canvas || !waveformData || !waveformData.length || !duration) return;

    const OVERVIEW_H = 24;
    const dpr = window.devicePixelRatio || 1;
    const w   = canvas.offsetWidth || 800;
    canvas.width  = w * dpr;
    canvas.height = OVERVIEW_H * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, OVERVIEW_H);

    const bars = waveformData;
    const N    = bars.length;
    const barsPerPx = N / w;

    // Draw compressed waveform: pick max peak per pixel column
    for (let px = 0; px < w; px++) {
      const barStart = Math.floor(px * barsPerPx);
      const barEnd   = Math.min(Math.ceil((px + 1) * barsPerPx) + 1, N);
      let maxPeak = 0, bestBar = null;
      for (let b = barStart; b < barEnd; b++) {
        if (bars[b] && bars[b].peak > maxPeak) {
          maxPeak = bars[b].peak; bestBar = bars[b];
        }
      }
      if (!bestBar) continue;
      const barH = Math.max(2, Math.round(maxPeak * OVERVIEW_H));
      let cr, cg, cb;
      if (bestBar.bass !== undefined) {
        // True additive RGB — same model as main waveform
        const bAmp = Math.sqrt(bestBar.bass);
        const mAmp = Math.sqrt(bestBar.mid);
        const hAmp = Math.sqrt(bestBar.high);
        cr = Math.min(255, Math.round(bAmp * 20  + mAmp * 20  + hAmp * 229));
        cg = Math.min(255, Math.round(bAmp * 100 + mAmp * 220 + hAmp * 96));
        cb = Math.min(255, Math.round(bAmp * 220 + mAmp * 20  + hAmp * 32));
      } else if (bestBar.freq === "#1464dc") { [cr, cg, cb] = [20,  100, 220]; } // bass → blue
      else if   (bestBar.freq === "#e56020") { [cr, cg, cb] = [229, 96,  32];  } // high → orange
      else                                   { [cr, cg, cb] = [20,  220, 20];  } // mid → green
      ctx.fillStyle = `rgba(${cr},${cg},${cb},0.8)`;
      ctx.fillRect(px, OVERVIEW_H - barH, 1, barH);
    }

    // Hot cue marks (1px colored verticals)
    if (hotCues && duration > 0) {
      Object.entries(hotCues).forEach(([num, cue]) => {
        if (!cue || typeof cue.time !== "number") return;
        const cx = Math.round((cue.time / duration) * w);
        const color = cueColors[parseInt(num, 10) - 1] || "rgba(255,255,255,0.7)";
        ctx.fillStyle = color;
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

  // Handle click to seek — accounts for zoom window offset
  const handleClick = (e) => {
    if (!onSeek) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const frac = x / rect.width;
    if (zoom <= 1) {
      onSeek(frac * duration);
      return;
    }
    const totalBars =
      waveformData && Array.isArray(waveformData) ? waveformData.length : 1000;
    const visibleBars = Math.round(totalBars / zoom);
    const centerBar = Math.round((currentTime / duration) * totalBars);
    const startBar = Math.max(
      0,
      Math.min(
        centerBar - Math.round(visibleBars / 2),
        totalBars - visibleBars,
      ),
    );
    const clickedBar = startBar + Math.round(frac * visibleBars);
    onSeek(
      Math.max(0, Math.min((clickedBar / totalBars) * duration, duration)),
    );
  };

  const handleOverviewClick = (e) => {
    if (!onSeek || !duration) return;
    const canvas = overviewRef.current;
    const rect   = canvas.getBoundingClientRect();
    onSeek(((e.clientX - rect.left) / rect.width) * duration);
  };

  const pinchDist = (touches) =>
    Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY,
    );

  const handleTouchStart = (e) => {
    if (!onZoomChange || e.touches.length !== 2) return;
    pinchRef.current = { dist: pinchDist(e.touches), zoom };
  };

  const handleTouchMove = (e) => {
    if (!onZoomChange || e.touches.length !== 2 || !pinchRef.current) return;
    e.preventDefault();
    const scale = pinchDist(e.touches) / pinchRef.current.dist;
    const next = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, pinchRef.current.zoom * scale));
    onZoomChange(Math.round(next * 10) / 10);
  };

  const handleTouchEnd = () => { pinchRef.current = null; };

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", position: "relative" }}>
      <canvas
        ref={overviewRef}
        onClick={handleOverviewClick}
        style={{
          width: "100%",
          height: "24px",
          cursor: onSeek ? "pointer" : "default",
          display: "block",
          flexShrink: 0,
        }}
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
        <div
          style={{
            position: "absolute",
            bottom: 4,
            right: 6,
            fontSize: "0.55rem",
            fontFamily: "'Chakra Petch', monospace",
            color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.06em",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          {zoom >= 10 ? `${Math.round(zoom)}×` : `${zoom.toFixed(1)}×`}
        </div>
      )}
    </div>
  );
}
