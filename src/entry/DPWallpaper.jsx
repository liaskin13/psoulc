import React, { useEffect, useRef, useCallback } from 'react';

const SERATO = ['#e52020','#e56020','#e5a020','#14dc14','#00c8dc','#1464dc','#8c14dc','#e5e5e5'];

function DPWallpaper({ opacity = 1 }) {
  const canvasRef = useRef(null);
  const seratoIdxRef = useRef(0);
  const timerRef = useRef(null);
  const animFrameRef = useRef(null);

  const getPositions = useCallback((W, H) => {
    const CW = 110, CH = 80;
    const COLS = Math.ceil(W / CW) + 3;
    const ROWS = Math.ceil(H / CH) + 3;
    const pos = [];
    for (let row = -1; row < ROWS; row++) {
      const odd = row % 2 !== 0;
      for (let col = -1; col < COLS; col++) {
        pos.push({
          x: col * CW + (odd ? CW / 2 : 0) + CW / 2,
          y: row * CH + CH / 2,
          mir: (row + col) % 2 !== 0,
        });
      }
    }
    return pos;
  }, []);

  const drawBase = useCallback((ctx, W, H) => {
    const FS = 40, CW = 110, CH = 80;
    const COLS = Math.ceil(W / CW) + 3;
    const ROWS = Math.ceil(H / CH) + 3;
    const passes = [
      { ox: 1.5,  oy: 1.5,  fill: 'rgba(0,0,0,0.97)' },
      { ox: 0,    oy: 0,    fill: 'rgba(14,12,10,0.91)' },
      { ox: -0.8, oy: -0.8, fill: 'rgba(24,21,17,0.75)' },
    ];
    ctx.font = `700 ${FS}px Comfortaa`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    for (let row = -1; row < ROWS; row++) {
      const odd = row % 2 !== 0;
      for (let col = -1; col < COLS; col++) {
        const cx = col * CW + (odd ? CW / 2 : 0) + CW / 2;
        const cy = row * CH + CH / 2;
        const mir = (row + col) % 2 !== 0;
        passes.forEach(p => {
          ctx.save();
          ctx.translate(cx + p.ox, cy + p.oy);
          if (mir) ctx.scale(-1, 1);
          ctx.fillStyle = p.fill;
          ctx.fillText('dp', 0, 0);
          ctx.restore();
        });
      }
    }
  }, []);

  const glowOne = useCallback((ctx, pos, colorHex, onDone) => {
    const passes = [
      { ox: 1.5,  oy: 1.5,  fill: 'rgba(0,0,0,0.97)' },
      { ox: 0,    oy: 0,    fill: 'rgba(14,12,10,0.91)' },
      { ox: -0.8, oy: -0.8, fill: 'rgba(24,21,17,0.75)' },
    ];
    ctx.font = '700 40px Comfortaa';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const hex = colorHex.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const holdFrames = 30 + Math.floor(Math.random() * 90);
    let alpha = 0, phase = 'in', held = 0;
    const step = () => {
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      passes.forEach(p => {
        ctx.save();
        ctx.translate(pos.x + p.ox, pos.y + p.oy);
        if (pos.mir) ctx.scale(-1, 1);
        ctx.fillStyle = p.fill;
        ctx.fillText('dp', 0, 0);
        ctx.restore();
      });
      ctx.save();
      ctx.translate(pos.x, pos.y);
      if (pos.mir) ctx.scale(-1, 1);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fillText('dp', 0, 0);
      ctx.restore();
      ctx.restore();
      if (phase === 'in') {
        alpha += 0.005;
        if (alpha >= 0.45) { alpha = 0.45; phase = 'hold'; }
      } else if (phase === 'hold') {
        held++;
        if (held >= holdFrames) phase = 'out';
      } else {
        alpha -= 0.0025;
        if (alpha <= 0) { onDone(); return; }
      }
      animFrameRef.current = requestAnimationFrame(step);
    };
    step();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0;

    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };

    const paint = () => {
      resize();
      drawBase(ctx, W, H);
    };

    const runLoop = (idx) => {
      const positions = getPositions(W, H);
      const pos = positions[Math.floor(Math.random() * positions.length)];
      glowOne(ctx, pos, SERATO[idx % SERATO.length], () => {
        timerRef.current = setTimeout(() => runLoop(idx + 1), 50);
      });
    };

    document.fonts.ready.then(() => {
      paint();
      timerRef.current = setTimeout(() => runLoop(0), 1200);
    });

    window.addEventListener('resize', paint);
    return () => {
      window.removeEventListener('resize', paint);
      clearTimeout(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [drawBase, getPositions, glowOne]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position:      'fixed',
        inset:         0,
        zIndex:        0,
        pointerEvents: 'none',
        opacity,
        transition:    'opacity 1.4s ease',
      }}
    />
  );
}

export default DPWallpaper;
