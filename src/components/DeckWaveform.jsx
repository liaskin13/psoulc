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
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    // Set canvas size with device pixel ratio for crisp rendering
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    function draw() {
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
      // Zoom: show a window of barCount/zoom bars centered on playhead
      const visibleBars = Math.round(barCount / zoom);
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

      // Draw waveform bars — multi-band stacked, mirrored from center
      const halfH = height / 2;
      const BASS_COLOR = "#1464dc";
      const MID_COLOR  = "#14dc14";
      const HIGH_COLOR = "#e56020";
      for (let i = startBar; i < endBar; i++) {
        const d = peaks[i];
        const x = (i - startBar) * barWidth;
        const bw = Math.max(barWidth - 1, 1);
        const isPast = x < playheadX;
        const suffix = isPast ? "40" : "ff";

        if (d.bass !== undefined) {
          // Stacked spectral bars: bass nearest center, mid, high at edges
          const total = d.bass + d.mid + d.high;
          if (total < 0.001) continue;
          const scale = (d.peak * halfH) / total;
          const bH = d.bass * scale;
          const mH = d.mid  * scale;
          const hH = d.high * scale;

          // Top half — bass from center up, mid above bass, high above mid
          ctx.fillStyle = BASS_COLOR + suffix;
          ctx.fillRect(x, halfH - bH, bw, bH);
          ctx.fillStyle = MID_COLOR + suffix;
          ctx.fillRect(x, halfH - bH - mH, bw, mH);
          ctx.fillStyle = HIGH_COLOR + suffix;
          ctx.fillRect(x, halfH - bH - mH - hH, bw, hH);

          // Bottom half — mirror
          ctx.fillStyle = BASS_COLOR + suffix;
          ctx.fillRect(x, halfH, bw, bH);
          ctx.fillStyle = MID_COLOR + suffix;
          ctx.fillRect(x, halfH + bH, bw, mH);
          ctx.fillStyle = HIGH_COLOR + suffix;
          ctx.fillRect(x, halfH + bH + mH, bw, hH);
        } else {
          // Legacy single-color fallback
          const barHeight = d.peak * height;
          ctx.fillStyle = isPast ? d.freq + "40" : d.freq;
          ctx.fillRect(x, (height - barHeight) / 2, bw, barHeight);
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

  // Handle click to seek — accounts for zoom window offset
  const handleClick = (e) => {
    if (!onSeek) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const frac = x / width;
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

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        cursor: onSeek ? "pointer" : "default",
        display: "block",
      }}
    />
  );
}
