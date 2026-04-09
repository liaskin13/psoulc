import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

// Mercury Live Stream — Liquid Chrome data conduit.
// No shelves. No archive. Pure passthrough.
// A canvas waveform represents the live audio pipeline.
function MercuryStream({ onBack }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const [armed, setArmed] = useState(false);

  // Animated liquid-chrome waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let t = 0;

    const resize = () => {
      canvas.width  = canvas.offsetWidth  * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      const drawWave = (ampScale, freqMod, speedMod, alpha, lineWidth) => {
        const grad = ctx.createLinearGradient(0, 0, W, 0);
        grad.addColorStop(0,   `rgba(160,200,240,${alpha * 0.4})`);
        grad.addColorStop(0.3, `rgba(220,240,255,${alpha})`);
        grad.addColorStop(0.6, `rgba(180,220,255,${alpha * 0.8})`);
        grad.addColorStop(1,   `rgba(120,170,220,${alpha * 0.3})`);

        ctx.strokeStyle = grad;
        ctx.lineWidth   = lineWidth;
        ctx.shadowColor = `rgba(160,220,255,${alpha * 0.5})`;
        ctx.shadowBlur  = 10;

        ctx.beginPath();
        for (let x = 0; x <= W; x += 1.5) {
          const nx   = x / W;
          const y    = H / 2
            + Math.sin(nx * 6  * freqMod + t * speedMod)          * (H * 0.22 * ampScale)
            + Math.sin(nx * 14 * freqMod + t * speedMod * 1.4)    * (H * 0.10 * ampScale)
            + Math.sin(nx * 3  * freqMod + t * speedMod * 0.6)    * (H * 0.15 * ampScale)
            + (armed ? Math.random() * 2 - 1 : 0);          // tape noise when armed
          if (x === 0) ctx.moveTo(x, y);
          else         ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      };

      // Three overlapping wave layers — chrome depth
      drawWave(1.0, 1,    1,    0.80, 1.5);   // primary carrier
      drawWave(0.5, 1.6,  1.25, 0.40, 1.0);   // harmonic overlay
      drawWave(0.3, 0.7,  0.75, 0.25, 0.8);   // sub-harmonic

      // Data nodes — bright cyan points riding the primary wave
      ctx.shadowColor = 'rgba(0,255,220,0.9)';
      ctx.shadowBlur  = 6;
      ctx.fillStyle   = 'rgba(0,255,200,0.9)';
      for (let i = 0; i <= 16; i++) {
        const x  = (W / 16) * i;
        const nx = x / W;
        const y  = H / 2
          + Math.sin(nx * 6 + t)         * (H * 0.22)
          + Math.sin(nx * 14 + t * 1.4)  * (H * 0.10)
          + Math.sin(nx * 3  + t * 0.6)  * (H * 0.15);
        ctx.beginPath();
        ctx.arc(x, y, armed ? 2 : 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Scanline — horizontal tick marks at top and bottom
      ctx.strokeStyle = 'rgba(0,180,255,0.08)';
      ctx.lineWidth   = 1;
      for (let y = 0; y <= H; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      t += armed ? 0.055 : 0.025;
      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [armed]);

  return (
    <motion.div
      className="vault-screen mercury-stream"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.08, 0, 0.3, 1] }}
    >
      <div className="vault-header">
        <h1 className="vault-title">MERCURY</h1>
        <p className="vault-subtitle">LIVE PIPELINE · HIGH-VELOCITY CONDUIT</p>
      </div>

      <div className="vault-commands">
        <button className="god-btn" onClick={onBack}>← BACK</button>
        <button
          className={`god-btn ${armed ? 'god-btn-armed' : ''}`}
          onClick={() => setArmed(prev => !prev)}
        >
          {armed ? '■ DISARM' : '● ARM STREAM'}
        </button>
        <button className="god-btn">CONFIG</button>
      </div>

      {/* Status line */}
      <div className="mercury-status">
        <div className={`mercury-status-dot ${armed ? 'dot-armed' : 'dot-standby'}`} />
        <span className="mercury-status-label">
          {armed ? 'PIPELINE ARMED — AWAITING SIGNAL' : 'STANDBY — PIPELINE COLD'}
        </span>
      </div>

      {/* Liquid Chrome Waveform */}
      <div className="mercury-waveform-housing">
        <canvas ref={canvasRef} className="mercury-canvas" />
        <div className="waveform-label-left">IN</div>
        <div className="waveform-label-right">OUT</div>
      </div>

      {/* Signal telemetry */}
      <div className="mercury-telemetry">
        {[
          { key: 'INPUT FEED',  value: armed ? '——— kHz' : '———',       dim: !armed },
          { key: 'BITRATE',     value: armed ? '——— kbps' : '———',      dim: !armed },
          { key: 'LATENCY',     value: armed ? '——— ms' : '———',        dim: !armed },
          { key: 'UPTIME',      value: '00:00:00',                       dim: false  },
          { key: 'STATUS',      value: armed ? 'ARMED' : 'STANDBY',     dim: false  },
        ].map(row => (
          <div key={row.key} className="telemetry-row">
            <span className="telemetry-key">{row.key}</span>
            <span className={`telemetry-value ${row.dim ? 'dim' : ''}`}>{row.value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default MercuryStream;
