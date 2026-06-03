// Screen-blend outline waveform renderer.
// Three continuous vector ribbon paths (bass/mid/high) with globalCompositeOperation='screen'
// so crossing strokes blend to white on loud multi-band moments.
// Drop-in replacement for DeckWaveform.jsx — identical props interface.

import { useEffect, useMemo, useRef } from "react";

const BARS_PER_SEC = 50;
const OFF_LOW  = 2;   // idle stacking offsets (px) — bass closest to center
const OFF_MID  = 5;
const OFF_HIGH = 9;   // high furthest out

export default function DeckWaveformV2({
  waveformData    = null,
  currentTime     = 0,
  duration        = 1,
  onSeek          = null,
  trackId         = "default",
  width           = 800,
  height          = 200,
  hotCues         = {},
  cueColors       = [],
  zoom            = 1,
  loopRegion      = null,
  isGenerating    = false,
  generatingPct   = null,
  bpm             = null,
  getTime         = null,
}) {
  const canvasRef      = useRef(null);
  const rafRef         = useRef(null);
  const displayZoomRef = useRef(zoom);
  const isDraggingRef  = useRef(false);
  const lastDragXRef   = useRef(0);
  const seekedTimeRef  = useRef(0); // tracks accumulated seek during drag

  // All live values kept in refs — RAF closure reads them without stale captures.
  // No live prop goes in the useEffect dep array; only structural deps do.
  const getTimeRef   = useRef(getTime);
  const ctRef        = useRef(currentTime);
  const durRef       = useRef(duration);
  const zoomRef      = useRef(zoom);
  const hotCuesRef   = useRef(hotCues);
  const cueColorsRef = useRef(cueColors);
  const loopRef      = useRef(loopRegion);
  const bpmRef       = useRef(bpm);
  const bandsRef     = useRef(null);

  getTimeRef.current   = getTime;
  ctRef.current        = currentTime;
  durRef.current       = duration;
  zoomRef.current      = zoom;
  hotCuesRef.current   = hotCues;
  cueColorsRef.current = cueColors;
  loopRef.current      = loopRegion;
  bpmRef.current       = bpm;

  // Convert [{bass, mid, high, peak}] → typed arrays once per track load.
  // useMemo prevents re-creating up to 360 K × 3 Float32Arrays on every render.
  const bands = useMemo(() => {
    if (!waveformData?.length || waveformData[0]?.bass === undefined) return null;
    return {
      lowAmps:  Float32Array.from(waveformData, b => b.bass),
      midAmps:  Float32Array.from(waveformData, b => b.mid),
      highAmps: Float32Array.from(waveformData, b => b.high),
      barCount: waveformData.length,
    };
  }, [waveformData]);

  bandsRef.current = bands;

  // ─── Canvas setup + RAF loop ────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    let w = 0, h = 0;

    function setupCanvas() {
      const rect = canvas.getBoundingClientRect();
      w = rect.width  || width;
      h = rect.height || height;
      canvas.width  = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }
    setupCanvas();

    // Reset smooth-zoom state when a new track loads
    displayZoomRef.current = zoomRef.current;

    function draw() {
      const ct  = getTimeRef.current ? getTimeRef.current() : ctRef.current;
      const dur = durRef.current;
      const bds = bandsRef.current;

      // Black base — screen composite requires a dark ground
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);

      if (!bds) {
        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        ctx.lineWidth   = 1;
        ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();
        return;
      }

      const { lowAmps, midAmps, highAmps, barCount } = bds;
      const halfH = h / 2;
      const scale = halfH * 0.82;

      // Smooth zoom interpolation — matches DeckWaveform feel
      displayZoomRef.current += (zoomRef.current - displayZoomRef.current) * 0.12;
      const displayZoom = displayZoomRef.current;

      const visibleBars = barCount / displayZoom;
      const playFrac    = dur > 0 ? ct / dur : 0;
      const centerBar   = playFrac * barCount;
      const halfVisible = visibleBars / 2;

      // Serato-aware viewport: playhead drifts at track start/end rather than
      // showing empty black space. Mid-track: playhead is centered.
      let startBar, endBar, playheadX;
      if (centerBar < halfVisible) {
        startBar  = 0;
        endBar    = visibleBars;
        playheadX = (centerBar / visibleBars) * w;
      } else if (centerBar > barCount - halfVisible) {
        endBar    = barCount;
        startBar  = barCount - visibleBars;
        playheadX = ((centerBar - startBar) / visibleBars) * w;
      } else {
        startBar  = centerBar - halfVisible;
        endBar    = centerBar + halfVisible;
        playheadX = w / 2;
      }

      const startTimeSec = startBar / BARS_PER_SEC;
      const endTimeSec   = endBar   / BARS_PER_SEC;

      // ─── Band outlines — screen composite ────────────────────────────────
      function drawBand(amps, color, offset) {
        ctx.beginPath();
        let first = true;
        for (let i = Math.floor(startBar); i <= Math.ceil(endBar); i++) {
          if (i < 0 || i >= barCount) continue;
          const x   = ((i - startBar) / (endBar - startBar)) * w;
          const amp = amps[i] ?? 0;
          const y   = halfH - (amp * scale + offset);
          if (first) { ctx.moveTo(x, y); first = false; }
          else ctx.lineTo(x, y);
        }
        for (let i = Math.ceil(endBar); i >= Math.floor(startBar); i--) {
          if (i < 0 || i >= barCount) continue;
          const x = ((i - startBar) / (endBar - startBar)) * w;
          ctx.lineTo(x, halfH + ((amps[i] ?? 0) * scale + offset));
        }
        ctx.closePath();
        ctx.strokeStyle = color;
        ctx.lineWidth   = 1.5;
        ctx.stroke();
        // No fill — outlines only
      }

      ctx.globalCompositeOperation = "screen";
      drawBand(lowAmps,  "rgba(255,0,0,0.8)",   OFF_LOW);
      drawBand(midAmps,  "rgba(0,255,0,0.8)",   OFF_MID);
      drawBand(highAmps, "rgba(0,255,255,0.8)", OFF_HIGH);
      ctx.globalCompositeOperation = "source-over";

      // ─── Past-portion dim ─────────────────────────────────────────────────
      if (playheadX > 0) {
        ctx.fillStyle = "rgba(0,0,0,0.38)";
        ctx.fillRect(0, 0, Math.min(playheadX, w), h);
      }

      // ─── Loop region ──────────────────────────────────────────────────────
      const loop = loopRef.current;
      if (loop?.start != null && dur > 0) {
        const lsx = (((loop.start / dur) * barCount - startBar) / (endBar - startBar)) * w;
        const lex = loop.end != null
          ? (((loop.end / dur) * barCount - startBar) / (endBar - startBar)) * w
          : playheadX;
        if (lex > lsx) {
          ctx.fillStyle = "rgba(0,204,204,0.12)";
          ctx.fillRect(Math.max(0, lsx), 0, Math.min(lex - lsx, w), h);
          ctx.strokeStyle = "rgba(0,204,204,0.5)";
          ctx.lineWidth   = 1.5;
          ctx.beginPath(); ctx.moveTo(Math.max(0, lsx), 0); ctx.lineTo(Math.max(0, lsx), h); ctx.stroke();
          if (loop.end != null) {
            ctx.beginPath(); ctx.moveTo(Math.min(lex, w), 0); ctx.lineTo(Math.min(lex, w), h); ctx.stroke();
          }
        }
      }

      // ─── Beat grid ────────────────────────────────────────────────────────
      const bp = bpmRef.current;
      if (bp && bp > 0) {
        const secPerBeat = 60 / bp;
        const secPer4    = secPerBeat * 4;
        const firstBeat  = Math.floor(startTimeSec / secPerBeat) * secPerBeat;

        for (let t = firstBeat; t <= endTimeSec + secPerBeat; t += secPerBeat) {
          const beatIdx  = Math.round(t / secPerBeat);
          const isBar    = beatIdx % 4  === 0;
          const isPhrase = beatIdx % 16 === 0;
          const xPos     = ((t * BARS_PER_SEC - startBar) / (endBar - startBar)) * w;
          if (xPos < 0 || xPos > w) continue;
          ctx.strokeStyle = isPhrase ? "rgba(255,255,255,0.22)"
                          : isBar   ? "rgba(255,255,255,0.10)"
                                    : "rgba(255,255,255,0.04)";
          ctx.lineWidth   = isPhrase ? 1 : 0.5;
          ctx.beginPath(); ctx.moveTo(xPos, 0); ctx.lineTo(xPos, h * 0.88); ctx.stroke();
        }

        // Bar number labels — only when bars are wide enough to read
        const pxPerBar = ((secPer4 * BARS_PER_SEC) / (endBar - startBar)) * w;
        if (pxPerBar >= 20) {
          ctx.font      = "7px 'JetBrains Mono', monospace";
          ctx.fillStyle = "rgba(255,255,255,0.32)";
          ctx.textAlign = "center";
          const firstBar4 = Math.ceil(startTimeSec / secPer4) * secPer4;
          for (let t = firstBar4; t <= endTimeSec + secPer4; t += secPer4) {
            const xPos = ((t * BARS_PER_SEC - startBar) / (endBar - startBar)) * w;
            if (xPos < 6 || xPos > w - 6) continue;
            ctx.fillText(String(Math.round(t / secPer4) + 1), xPos, 9);
          }
          ctx.textAlign = "left";
        }
      }

      // ─── Time ruler ───────────────────────────────────────────────────────
      const secondsVisible = visibleBars / BARS_PER_SEC;
      const tickSec = secondsVisible > 120 ? 60
                    : secondsVisible > 40  ? 15
                    : secondsVisible > 15  ? 5
                    : secondsVisible > 5   ? 2 : 1;
      ctx.font      = "7px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.lineWidth = 1;
      for (let sec = Math.ceil(startTimeSec); sec <= Math.floor(endTimeSec); sec++) {
        if (sec % tickSec !== 0) continue;
        const xPos  = ((sec * BARS_PER_SEC - startBar) / (endBar - startBar)) * w;
        const tickH = 5;
        ctx.strokeStyle = "rgba(255,255,255,0.30)";
        ctx.beginPath(); ctx.moveTo(xPos, h - tickH); ctx.lineTo(xPos, h); ctx.stroke();
        if (xPos > 14 && xPos < w - 14) {
          const mm = Math.floor(sec / 60);
          const ss = String(sec % 60).padStart(2, "0");
          ctx.fillStyle = "rgba(255,255,255,0.38)";
          ctx.fillText(`${mm}:${ss}`, xPos, h - tickH - 2);
        }
      }
      ctx.textAlign = "left";

      // ─── Center reference line ────────────────────────────────────────────
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth   = 1;
      ctx.beginPath(); ctx.moveTo(0, halfH); ctx.lineTo(w, halfH); ctx.stroke();

      // ─── Hot cue markers ──────────────────────────────────────────────────
      ctx.textAlign = "center";
      Object.entries(hotCuesRef.current).forEach(([num, cue]) => {
        if (!cue || typeof cue.time !== "number") return;
        const n      = parseInt(num, 10);
        const cueBar = (cue.time / dur) * barCount;
        const x      = ((cueBar - startBar) / (endBar - startBar)) * w;
        if (x < -10 || x > w + 10) return;
        const color = cueColorsRef.current[n - 1] || "#ffffff";
        const isB2  = n > 8;

        ctx.strokeStyle = color;
        ctx.lineWidth   = isB2 ? 1.5 : 2;
        ctx.setLineDash(isB2 ? [4, 3] : []);
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        ctx.setLineDash([]);

        if (isB2) {
          ctx.beginPath(); ctx.moveTo(x - 6, h); ctx.lineTo(x + 6, h); ctx.lineTo(x, h - 12); ctx.closePath(); ctx.stroke();
          ctx.fillStyle = color;
          ctx.font      = "bold 7px JetBrains Mono, monospace";
          ctx.fillText(num, x, h - 4);
        } else {
          ctx.fillStyle = color;
          ctx.beginPath(); ctx.moveTo(x - 6, 0); ctx.lineTo(x + 6, 0); ctx.lineTo(x, 12); ctx.closePath(); ctx.fill();
          ctx.fillStyle = "#000";
          ctx.font      = "bold 7px JetBrains Mono, monospace";
          ctx.fillText(num, x, 10);
        }
      });
      ctx.textAlign = "left";

      // ─── Playhead ─────────────────────────────────────────────────────────
      ctx.strokeStyle = "rgba(255,255,255,0.92)";
      ctx.lineWidth   = 2;
      ctx.beginPath(); ctx.moveTo(playheadX, 0); ctx.lineTo(playheadX, h); ctx.stroke();
    }

    draw();

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!prefersReduced) {
      const loop = () => { draw(); rafRef.current = requestAnimationFrame(loop); };
      rafRef.current = requestAnimationFrame(loop);
    }

    const ro = new ResizeObserver(() => { setupCanvas(); draw(); });
    ro.observe(canvas);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackId, width, height]); // all live props read through refs — no restarts needed

  // Prevent accidental page scroll when cursor hovers over waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e) => e.preventDefault();
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, []);

  const handleMouseDown = (e) => {
    isDraggingRef.current  = true;
    lastDragXRef.current   = e.clientX;
    seekedTimeRef.current  = ctRef.current;
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !onSeek) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dx            = e.clientX - lastDragXRef.current;
    lastDragXRef.current = e.clientX;
    const W             = canvas.getBoundingClientRect().width;
    const barCount      = bandsRef.current?.barCount ?? 1000;
    const visibleBars   = barCount / (displayZoomRef.current || 1);
    const secondsVisible = visibleBars / BARS_PER_SEC;
    // drag left = forward, drag right = backward (Serato convention)
    const dt  = -(dx / W) * secondsVisible;
    const next = Math.max(0, Math.min(durRef.current, seekedTimeRef.current + dt));
    seekedTimeRef.current = next;
    onSeek(next);
  };

  const handleMouseUp = () => { isDraggingRef.current = false; };

  const handleClick = (e) => {
    // Ignore if the user was dragging (moved more than 4px)
    if (Math.abs(e.clientX - lastDragXRef.current) > 4) return;
    if (!onSeek) return;
    const canvas    = canvasRef.current;
    const rect      = canvas.getBoundingClientRect();
    const frac      = (e.clientX - rect.left) / rect.width;
    const barCount  = waveformData?.length ?? 1000;
    const visibleBars = Math.round(barCount / zoom);
    const centerBar   = Math.round((currentTime / duration) * barCount);
    const halfVisible = visibleBars / 2;
    let startBar;
    if (centerBar < halfVisible)                 startBar = 0;
    else if (centerBar > barCount - halfVisible) startBar = barCount - visibleBars;
    else                                         startBar = centerBar - Math.round(halfVisible);
    const clickedBar = startBar + Math.round(frac * visibleBars);
    onSeek(Math.max(0, Math.min((clickedBar / barCount) * duration, duration)));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", position: "relative" }}>
      {isGenerating && (
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)", zIndex: 2,
          pointerEvents: "none", fontSize: "0.6rem",
          fontFamily: "'Chakra Petch', monospace",
          color: "rgba(255,255,255,0.55)", letterSpacing: "0.12em",
        }}>
          {generatingPct != null ? `ANALYZING ${generatingPct}%` : "ANALYZING…"}
        </div>
      )}
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ width: "100%", height: "100%", cursor: onSeek ? "ew-resize" : "default", display: "block", flex: 1, userSelect: "none" }}
      />
    </div>
  );
}
