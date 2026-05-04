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
      const barWidth = width / barCount;
      const playheadX = (currentTime / duration) * width;

      // Draw waveform bars
      peaks.forEach((data, i) => {
        const x = i * barWidth;
        const barHeight = data.peak * height;
        const y = (height - barHeight) / 2; // center vertically

        // Color: dimmed if past playhead, full intensity if not played yet
        const isPast = x < playheadX;
        ctx.fillStyle = isPast
          ? data.freq + "40" // 25% opacity for played portion
          : data.freq;

        ctx.fillRect(x, y, Math.max(barWidth - 1, 1), barHeight);
      });

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

      // Draw hot cue markers
      Object.entries(hotCues).forEach(([num, cue]) => {
        if (!cue || typeof cue.time !== "number") return;
        const x = (cue.time / duration) * width;
        const color = cueColors[num - 1] || "#ffffff";

        // Vertical line
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();

        // Cue number badge at top
        ctx.fillStyle = color;
        ctx.font = "bold 10px JetBrains Mono, monospace";
        ctx.fillText(num, x - 4, 10);
      });
    }

    // Initial draw
    draw();

    // Redraw on animation frame if playing
    function animate() {
      draw();
      animFrameRef.current = requestAnimationFrame(animate);
    }

    if (currentTime > 0) {
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
  ]);

  // Handle click to seek
  const handleClick = (e) => {
    if (!onSeek) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const seekTime = (x / width) * duration;
    onSeek(seekTime);
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
