// Canvas-based waveform renderer for deck view
// Serato-style: frequency-colored peaks, playhead, zoom support

import { useEffect, useRef, useCallback } from "react";
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
}) {
  const canvasRef      = useRef(null);
  const overviewRef    = useRef(null);
  const animFrameRef   = useRef(null);
  const displayZoomRef = useRef(zoom); // smoothed zoom for lerp transition

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

      // Serato-style: three stacked bands per bar, tallest drawn first.
      // Tallest band occupies the peak (outermost); shorter bands paint toward center.
      // sqrt() applied per-band to boost quieter frequencies (orange/green visible even
      // on bass-heavy mixes). Mirrors Serato's GEOB overview rendering.
      const halfH = height / 2;

      for (let i = startBar; i < endBar; i++) {
        const d = peaks[i];
        const x = (i - startBar) * barWidth;
        const bw = Math.max(barWidth - 1, 1);
        const isPast = x < playheadX;
        const alpha = isPast ? 0.25 : 1;

        if (d.bass !== undefined) {
          // sqrt boost: lifts quieter bands so all three colors stay visible
          const bassH = Math.sqrt(d.bass) * halfH;
          const midH  = Math.sqrt(d.mid)  * halfH;
          const highH = Math.sqrt(d.high) * halfH;

          // Sort tallest first so dominant frequency color shows at the peak
          const bands = [
            { h: bassH, r: 40,  g: 60,  b: 220 },   // indigo — bass (Serato blue)
            { h: midH,  r: 20,  g: 220, b: 20  },   // green — mid (Serato standard)
            { h: highH, r: 240, g: 237, b: 232 },   // cream-white — transient peaks
          ].sort((a, b) => b.h - a.h);

          for (const band of bands) {
            if (band.h < 1) continue;
            ctx.fillStyle = `rgba(${band.r},${band.g},${band.b},${alpha})`;
            ctx.fillRect(x, halfH - band.h, bw, band.h);   // upper half
            ctx.fillRect(x, halfH, bw, band.h);             // lower half (mirror)
          }

          // Transient peak cap: 2px bright line where tallest band exceeds 80% of halfH
          const tallestH = Math.max(bassH, midH, highH);
          if (tallestH > halfH * 0.80) {
            ctx.fillStyle = `rgba(255, 255, 220, ${isPast ? 0.35 : 0.95})`;
            ctx.fillRect(x, halfH - tallestH - 1, bw, 2);  // upper cap
            ctx.fillRect(x, halfH + tallestH - 1, bw, 2);  // lower cap (mirror)
          }
        } else {
          const barH = d.peak * halfH;
          ctx.fillStyle = isPast ? d.freq + "40" : d.freq;
          ctx.fillRect(x, halfH - barH, bw, barH);
          ctx.fillRect(x, halfH, bw, barH);
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
      let maxPeak = 0, color = "#14dc14";
      for (let b = barStart; b < barEnd; b++) {
        if (bars[b] && bars[b].peak > maxPeak) {
          maxPeak = bars[b].peak;
          // Use band colors matching main waveform
          if (bars[b].freq === "#1464dc") color = "rgba(226,88,20,0.8)";       // bass → orange
          else if (bars[b].freq === "#e56020") color = "rgba(255,248,180,0.8)"; // high → yellow-white
          else color = "rgba(20,220,20,0.8)";                                    // mid → green
        }
      }
      const barH = Math.max(2, Math.round(maxPeak * OVERVIEW_H));
      ctx.fillStyle = color;
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

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
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
