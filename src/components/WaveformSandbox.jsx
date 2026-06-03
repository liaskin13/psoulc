// Sandbox: 3-layer screen-blend outline waveform engine.
// IIR analysis, single global normalization, BPM-aware zoom, Serato-style scroll.

import { useEffect, useRef, useState, useCallback } from 'react';

const PLAYHEAD_X_FRAC = 0.25;
const BARS_PER_SEC    = 50; // Rekordbox standard

// ─── IIR 3-band analysis, single global normalization ─────────────────────────
// Runs in a single O(N_samples) pass — fast regardless of bar count.
// Single global max ensures bands are shown relative to each other, not
// independently normalized (which would make all three look identical).
function analyzeBands(channelData, sampleRate, barCount) {
  const total         = channelData.length;
  const samplesPerBar = Math.floor(total / barCount);
  const dt  = 1 / sampleRate;
  const aL  = dt / (1 / (2 * Math.PI * 250)  + dt); // LP at 250Hz  → bass
  const aM  = dt / (1 / (2 * Math.PI * 4000) + dt); // LP at 4000Hz → mid

  let lpL = 0, lpM = 0;
  const lowRms  = new Float32Array(barCount);
  const midRms  = new Float32Array(barCount);
  const highRms = new Float32Array(barCount);

  for (let bar = 0; bar < barCount; bar++) {
    const start = bar * samplesPerBar;
    const end   = Math.min(start + samplesPerBar, total);
    let ls = 0, ms = 0, hs = 0;
    const n = end - start;
    for (let i = start; i < end; i++) {
      const s   = channelData[i];
      lpL       = lpL + aL * (s  - lpL);
      const hp  = s - lpL;
      lpM       = lpM + aM * (hp - lpM);
      const hgh = hp - lpM;
      ls += lpL * lpL;
      ms += lpM * lpM;
      hs += hgh * hgh;
    }
    lowRms[bar]  = Math.sqrt(ls / n);
    midRms[bar]  = Math.sqrt(ms / n);
    highRms[bar] = Math.sqrt(hs / n);
  }

  // Single global max across all three bands
  let gMax = 0;
  for (let i = 0; i < barCount; i++) {
    if (lowRms[i]  > gMax) gMax = lowRms[i];
    if (midRms[i]  > gMax) gMax = midRms[i];
    if (highRms[i] > gMax) gMax = highRms[i];
  }
  gMax = Math.max(gMax, 1e-6);

  return {
    lowAmps:  Float32Array.from(lowRms,  v => v / gMax),
    midAmps:  Float32Array.from(midRms,  v => v / gMax),
    highAmps: Float32Array.from(highRms, v => v / gMax),
  };
}

export default function WaveformSandbox() {
  const canvasRef     = useRef(null);
  const audioRef      = useRef(null);
  const rafRef        = useRef(null);
  const bandsRef      = useRef(null);   // { lowAmps, midAmps, highAmps, duration, barCount }
  const zoomRef       = useRef(1);      // duration / secondsVisible — RAF reads this
  const scrollLeftRef = useRef(0);      // current pixel scroll — click-to-seek reads this
  const drawFnRef     = useRef(null);   // stable draw ref for handlers outside useEffect
  const bpmRef        = useRef(120);
  const zoomBarsRef   = useRef(32);

  const [bpm,       setBpm]       = useState(120);
  const [zoomBars,  setZoomBars]  = useState(32);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [audioSrc,  setAudioSrc]  = useState(null);
  const [hasTrack,  setHasTrack]  = useState(false);

  // ─── Canvas + RAF loop ────────────────────────────────────────────────────────
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
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);

      const bands = bandsRef.current;
      if (!bands) return;

      const { lowAmps, midAmps, highAmps, barCount, duration } = bands;
      const cx      = H / 2;
      const scale   = cx * 0.82;
      const OFF_LOW = 2, OFF_MID = 5, OFF_HIGH = 9; // idle stacking offsets px

      const zoom       = zoomRef.current;
      const virtualW   = W * zoom;
      const PLAYHEAD_X = W * PLAYHEAD_X_FRAC;

      const ct         = audioRef.current?.currentTime ?? 0;
      const pFrac      = duration > 0 ? ct / duration : 0;
      const phVX       = pFrac * virtualW;
      const scrollLeft = Math.max(0, Math.min(virtualW - W, phVX - PLAYHEAD_X));
      scrollLeftRef.current = scrollLeft;

      // Only iterate bars in the visible window (+ 2-bar buffer for path continuity)
      const startBar = Math.max(0,          Math.floor((scrollLeft         / virtualW) * barCount) - 2);
      const endBar   = Math.min(barCount - 1, Math.ceil(((scrollLeft + W) / virtualW) * barCount) + 2);

      function drawBand(amps, color, offset) {
        ctx.beginPath();
        // Top outline — left to right
        for (let i = startBar; i <= endBar; i++) {
          const x   = (i / barCount) * virtualW - scrollLeft;
          const amp = amps[i] ?? 0;
          const y   = cx - (amp * scale + offset);
          if (i === startBar) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        // Bottom outline — right to left (mirrored)
        for (let i = endBar; i >= startBar; i--) {
          const x   = (i / barCount) * virtualW - scrollLeft;
          const amp = amps[i] ?? 0;
          ctx.lineTo(x, cx + (amp * scale + offset));
        }
        ctx.closePath();
        ctx.strokeStyle = color;
        ctx.lineWidth   = 1.5;
        ctx.stroke();
        // No fill — outlines only
      }

      ctx.globalCompositeOperation = 'screen';
      drawBand(lowAmps,  'rgba(255,0,0,0.8)',   OFF_LOW);
      drawBand(midAmps,  'rgba(0,255,0,0.8)',   OFF_MID);
      drawBand(highAmps, 'rgba(0,255,255,0.8)', OFF_HIGH);

      // Stationary playhead — drawn after resetting composite
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(PLAYHEAD_X, 0);
      ctx.lineTo(PLAYHEAD_X, H);
      ctx.stroke();
    }

    drawFnRef.current = draw;

    function loop() { draw(); rafRef.current = requestAnimationFrame(loop); }
    rafRef.current = requestAnimationFrame(loop);

    const ro = new ResizeObserver(() => { setupCanvas(); draw(); });
    ro.observe(canvas);

    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, []);

  // ─── Zoom factor helper ───────────────────────────────────────────────────────
  const applyZoom = useCallback((bars, bpmVal) => {
    const duration = bandsRef.current?.duration;
    if (!duration) return;
    const secondsVisible = bars * 4 * (60 / Math.max(bpmVal, 1));
    zoomRef.current = Math.max(1, duration / Math.max(secondsVisible, 0.01));
    drawFnRef.current?.();
  }, []);

  // ─── File upload + analysis ───────────────────────────────────────────────────
  const handleFile = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    setHasTrack(false);
    setProgress(10);

    if (audioSrc) URL.revokeObjectURL(audioSrc);
    const src = URL.createObjectURL(file);
    setAudioSrc(src);

    try {
      const arrayBuffer = await file.arrayBuffer();
      setProgress(25);

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const decoded  = await audioCtx.decodeAudioData(arrayBuffer);
      audioCtx.close();
      setProgress(40);

      const barCount = Math.round(decoded.duration * BARS_PER_SEC);
      const ch       = decoded.getChannelData(0);

      // Synchronous IIR pass: ~0.3s per 30min of audio
      const { lowAmps, midAmps, highAmps } = analyzeBands(ch, decoded.sampleRate, barCount);
      setProgress(95);

      bandsRef.current = { lowAmps, midAmps, highAmps, duration: decoded.duration, barCount };

      // Apply current zoom selection
      const secondsVisible = zoomBarsRef.current * 4 * (60 / bpmRef.current);
      zoomRef.current = Math.max(1, decoded.duration / Math.max(secondsVisible, 0.01));

      setProgress(100);
      setHasTrack(true);
    } catch (err) {
      console.error('[WaveformSandbox]', err);
    } finally {
      setAnalyzing(false);
    }
  }, [audioSrc]);

  // ─── BPM input ────────────────────────────────────────────────────────────────
  const handleBpm = useCallback((e) => {
    const v = Math.max(40, Math.min(220, +e.target.value || 120));
    setBpm(v);
    bpmRef.current = v;
    applyZoom(zoomBarsRef.current, v);
  }, [applyZoom]);

  // ─── Zoom bar buttons ─────────────────────────────────────────────────────────
  const handleZoomBars = useCallback((bars) => {
    setZoomBars(bars);
    zoomBarsRef.current = bars;
    applyZoom(bars, bpmRef.current);
  }, [applyZoom]);

  // ─── Click-to-seek ────────────────────────────────────────────────────────────
  const handleCanvasClick = useCallback((e) => {
    const audio  = audioRef.current;
    const bands  = bandsRef.current;
    const canvas = canvasRef.current;
    if (!audio || !bands || !canvas) return;
    const rect    = canvas.getBoundingClientRect();
    const virtualW = rect.width * zoomRef.current;
    const virtualX = (e.clientX - rect.left) + scrollLeftRef.current;
    audio.currentTime = Math.min(1, Math.max(0, virtualX / virtualW)) * bands.duration;
  }, []);

  // ─── Cleanup ──────────────────────────────────────────────────────────────────
  useEffect(() => () => { if (audioSrc) URL.revokeObjectURL(audioSrc); }, [audioSrc]);

  // ─── UI ───────────────────────────────────────────────────────────────────────
  const btnStyle = (active) => ({
    padding: '5px 14px',
    border: active ? '1px solid rgba(255,255,255,0.6)' : '1px solid #222',
    borderRadius: '3px',
    background: active ? 'rgba(255,255,255,0.05)' : 'transparent',
    color: active ? '#fff' : '#444',
    fontSize: '11px',
    letterSpacing: '0.12em',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.1s',
  });

  return (
    <div style={{
      background: '#060606', minHeight: '100vh', padding: '28px 24px',
      fontFamily: '"SF Mono","Fira Code",monospace', color: '#fff', boxSizing: 'border-box',
    }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '10px', letterSpacing: '0.15em', color: '#2a2a2a' }}>WAVEFORM SANDBOX</span>

        <label style={{
          cursor: 'pointer', border: '1px solid #1e1e1e', padding: '5px 14px',
          borderRadius: '3px', fontSize: '11px', letterSpacing: '0.12em', color: '#666', userSelect: 'none',
        }}>
          LOAD AUDIO
          <input type="file" accept="audio/*" onChange={handleFile} style={{ display: 'none' }} />
        </label>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '10px', color: '#333', letterSpacing: '0.12em' }}>BPM</span>
          <input
            type="number" value={bpm} onChange={handleBpm} min={40} max={220}
            style={{
              width: '54px', background: '#0f0f0f', border: '1px solid #1e1e1e',
              borderRadius: '3px', color: '#888', fontSize: '12px', padding: '4px 6px',
              fontFamily: 'inherit', textAlign: 'center',
            }}
          />
        </div>

        {analyzing && (
          <span style={{ fontSize: '10px', color: '#333', letterSpacing: '0.1em' }}>
            ANALYZING {progress}%
          </span>
        )}
      </div>

      {/* ── Canvas ── */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{
          width: '100%', height: '220px', display: 'block',
          background: '#000', cursor: 'crosshair', borderRadius: '3px',
          border: '1px solid #0f0f0f',
        }}
      />

      {/* ── Controls row ── */}
      <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {[8, 16, 32].map(n => (
          <button key={n} onClick={() => handleZoomBars(n)} style={btnStyle(zoomBars === n)}>
            {n} BAR
          </button>
        ))}
        {hasTrack && audioSrc && (
          <audio
            ref={audioRef} src={audioSrc} controls
            style={{ flex: 1, minWidth: 0, marginLeft: '8px', opacity: 0.65 }}
          />
        )}
      </div>

      {/* ── Legend ── */}
      <div style={{ marginTop: '14px', display: 'flex', gap: '20px' }}>
        {[
          { label: 'LOW  0–250 Hz',  color: 'rgba(255,0,0,0.6)'   },
          { label: 'MID  250–4kHz',  color: 'rgba(0,255,0,0.6)'   },
          { label: 'HIGH  4kHz+',    color: 'rgba(0,255,255,0.6)' },
        ].map(({ label, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <div style={{ width: '20px', height: '1.5px', background: color }} />
            <span style={{ fontSize: '10px', color: '#2a2a2a', letterSpacing: '0.1em' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
