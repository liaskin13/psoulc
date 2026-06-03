// Sandbox: 3-layer screen-blend outline waveform engine.
// Low/Mid/High continuous ribbon paths; screen composite forces white at crossings.
// Self-contained: file uploader + zoom slider + live playhead.

import { useEffect, useRef, useState, useCallback } from 'react';
import { generateWaveformDataBands } from '../lib/audioPreprocessor';

const BAR_COUNT   = 2000;
const PLAYHEAD_X_FRAC = 0.25; // playhead sits at 25% from left edge

export default function WaveformSandbox() {
  const canvasRef       = useRef(null);
  const audioRef        = useRef(null);
  const rafRef          = useRef(null);
  const bandsRef        = useRef(null);   // { lowAmps, midAmps, highAmps, duration, barCount }
  const zoomRef         = useRef(1);
  const scrollLeftRef   = useRef(0);      // pixel offset; stored so click-to-seek can read it
  const drawFnRef       = useRef(null);   // stable draw fn ref for slider handler

  const [zoom,      setZoom]      = useState(1);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [audioSrc,  setAudioSrc]  = useState(null);
  const [hasTrack,  setHasTrack]  = useState(false);

  // ─── Canvas setup + RAF loop ───────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    let W = 0, H = 0;

    function setupCanvas() {
      const rect = canvas.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas.width  = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    setupCanvas();

    function draw() {
      // Black base so screen composite has correct dark ground
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);

      const bands = bandsRef.current;
      if (!bands) return;

      const { lowAmps, midAmps, highAmps, barCount, duration } = bands;
      const cx        = H / 2;
      const scale     = cx * 0.82;          // max excursion from center
      const OFF_LOW   = 2;                  // idle offset px — stacked from center out
      const OFF_MID   = 5;
      const OFF_HIGH  = 9;

      const zoom       = zoomRef.current;
      const virtualW   = W * zoom;
      const PLAYHEAD_X = W * PLAYHEAD_X_FRAC;

      const audio      = audioRef.current;
      const ct         = audio?.currentTime ?? 0;
      const pFrac      = duration > 0 ? ct / duration : 0;

      const playheadVirtualX = pFrac * virtualW;
      const scrollLeft = Math.max(0, Math.min(virtualW - W, playheadVirtualX - PLAYHEAD_X));
      scrollLeftRef.current = scrollLeft;

      // Visible bar range (+ 2 bar buffer for edge continuity)
      const startBar = Math.max(0, Math.floor((scrollLeft / virtualW) * barCount) - 2);
      const endBar   = Math.min(barCount - 1, Math.ceil(((scrollLeft + W) / virtualW) * barCount) + 2);

      function drawBand(amps, color, offset) {
        ctx.beginPath();
        // Top outline: left → right
        for (let i = startBar; i <= endBar; i++) {
          const x   = (i / barCount) * virtualW - scrollLeft;
          const amp = amps[i] ?? 0;
          const y   = cx - (amp * scale + offset);
          if (i === startBar) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        // Bottom outline: right → left (mirrored)
        for (let i = endBar; i >= startBar; i--) {
          const x   = (i / barCount) * virtualW - scrollLeft;
          const amp = amps[i] ?? 0;
          const y   = cx + (amp * scale + offset);
          ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = color;
        ctx.lineWidth   = 1.5;
        ctx.stroke();
        // No fill — outlines only
      }

      ctx.globalCompositeOperation = 'screen';
      drawBand(lowAmps,  'rgba(255, 0,   0,   0.8)', OFF_LOW);
      drawBand(midAmps,  'rgba(0,   255, 0,   0.8)', OFF_MID);
      drawBand(highAmps, 'rgba(0,   255, 255, 0.8)', OFF_HIGH);

      // Stationary playhead — drawn after restoring normal composite
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(PLAYHEAD_X, 0);
      ctx.lineTo(PLAYHEAD_X, H);
      ctx.stroke();
    }

    drawFnRef.current = draw;

    function loop() {
      draw();
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);

    const ro = new ResizeObserver(() => { setupCanvas(); draw(); });
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  // ─── File upload + audio analysis ─────────────────────────────────────────
  const handleFile = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    setHasTrack(false);
    setProgress(10);

    const src = URL.createObjectURL(file);
    setAudioSrc(src);

    try {
      const arrayBuffer = await file.arrayBuffer();
      setProgress(20);

      const audioCtx  = new (window.AudioContext || window.webkitAudioContext)();
      const decoded   = await audioCtx.decodeAudioData(arrayBuffer);
      audioCtx.close();
      setProgress(45);

      const bars = generateWaveformDataBands(decoded, BAR_COUNT);
      setProgress(95);

      bandsRef.current = {
        lowAmps:  bars.map(b => b.bass),
        midAmps:  bars.map(b => b.mid),
        highAmps: bars.map(b => b.high),
        duration: decoded.duration,
        barCount: BAR_COUNT,
      };

      setProgress(100);
      setHasTrack(true);
    } catch (err) {
      console.error('[WaveformSandbox] analysis failed:', err);
    } finally {
      setAnalyzing(false);
    }
  }, []);

  // ─── Zoom slider ───────────────────────────────────────────────────────────
  const handleZoom = useCallback((e) => {
    const v = +e.target.value;
    setZoom(v);
    zoomRef.current = v;
    drawFnRef.current?.();
  }, []);

  // ─── Click-to-seek ─────────────────────────────────────────────────────────
  const handleCanvasClick = useCallback((e) => {
    const audio = audioRef.current;
    const bands = bandsRef.current;
    const canvas = canvasRef.current;
    if (!audio || !bands || !canvas) return;

    const rect     = canvas.getBoundingClientRect();
    const W        = rect.width;
    const virtualW = W * zoomRef.current;
    const clickX   = e.clientX - rect.left;
    const virtualX = Math.max(0, clickX + scrollLeftRef.current);
    const seekFrac = Math.min(1, virtualX / virtualW);
    audio.currentTime = seekFrac * bands.duration;
  }, []);

  // ─── Cleanup object URL ────────────────────────────────────────────────────
  useEffect(() => {
    return () => { if (audioSrc) URL.revokeObjectURL(audioSrc); };
  }, [audioSrc]);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      background: '#060606',
      minHeight: '100vh',
      padding: '32px 24px',
      fontFamily: '"SF Mono", "Fira Code", monospace',
      color: '#fff',
      boxSizing: 'border-box',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontSize: '11px', letterSpacing: '0.15em', color: '#444' }}>WAVEFORM SANDBOX</span>
        <label style={{
          cursor: 'pointer',
          border: '1px solid #2a2a2a',
          padding: '6px 14px',
          borderRadius: '3px',
          fontSize: '11px',
          letterSpacing: '0.1em',
          color: '#aaa',
          userSelect: 'none',
        }}>
          LOAD AUDIO
          <input type="file" accept="audio/*" onChange={handleFile} style={{ display: 'none' }} />
        </label>
        {analyzing && (
          <span style={{ fontSize: '11px', color: '#555', letterSpacing: '0.08em' }}>
            ANALYZING {progress}%
          </span>
        )}
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{
          width: '100%',
          height: '200px',
          display: 'block',
          background: '#000',
          cursor: 'crosshair',
          borderRadius: '3px',
          border: '1px solid #111',
        }}
      />

      {/* Playback controls */}
      {hasTrack && audioSrc && (
        <audio
          ref={audioRef}
          src={audioSrc}
          controls
          style={{ width: '100%', marginTop: '12px', opacity: 0.7 }}
        />
      )}

      {/* Zoom slider */}
      <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '10px', color: '#444', letterSpacing: '0.12em', minWidth: '36px' }}>ZOOM</span>
        <input
          type="range" min={1} max={16} step={0.1} value={zoom}
          onChange={handleZoom}
          style={{ flex: 1, accentColor: '#555' }}
        />
        <span style={{ fontSize: '11px', color: '#555', minWidth: '36px', textAlign: 'right' }}>
          {zoom.toFixed(1)}×
        </span>
      </div>

      {/* Legend */}
      <div style={{ marginTop: '16px', display: 'flex', gap: '20px' }}>
        {[
          { label: 'LOW 0–250 Hz',     color: 'rgba(255,0,0,0.7)' },
          { label: 'MID 250–2500 Hz',  color: 'rgba(0,255,0,0.7)' },
          { label: 'HIGH 2500+ Hz',    color: 'rgba(0,255,255,0.7)' },
        ].map(({ label, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '24px', height: '2px', background: color, borderRadius: '1px' }} />
            <span style={{ fontSize: '10px', color: '#444', letterSpacing: '0.08em' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
