import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── VOID STREAK OVERLAY ────────────────────────────────────────────────────
// Renders the spaghettification prism streak from a record spine to the
// Black Star position visible in the VaultWindow porthole.
//
// The streak inherits the true spectrum chakra color of the originating planet.
// Its head is the vibrant planet color; its tail fades into absolute black.
//
// Props:
//   active      — boolean trigger
//   source      — { x, y } screen position of the record spine center
//   target      — { x, y } screen position of the Black Star in VaultWindow
//   color       — true spectrum chakra color (VOID_CHAKRA_COLORS[planet])
//   onComplete  — called when animation finishes (after void is stored)

function VoidStreakOverlay({ active, source, target, color, onComplete }) {
  const [phase, setPhase] = useState('idle'); // idle → stretch → fade

  useEffect(() => {
    if (!active) { setPhase('idle'); return; }
    setPhase('stretch');
    const t = setTimeout(() => {
      setPhase('fade');
      setTimeout(() => {
        setPhase('idle');
        onComplete?.();
      }, 400);
    }, 900);
    return () => clearTimeout(t);
  }, [active]);

  if (phase === 'idle' || !source || !target) return null;

  // Geometry — line from source to target
  const dx     = target.x - source.x;
  const dy     = target.y - source.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle  = Math.atan2(dy, dx) * (180 / Math.PI);

  const safeColor = color || '#9b59b6';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9900,
      }}
    >
      {/* ── Prism streak line ────────────────── */}
      <AnimatePresence>
        {phase === 'stretch' && (
          <motion.div
            key="streak"
            style={{
              position: 'absolute',
              left:     source.x,
              top:      source.y - 2,
              width:    length,
              height:   3,
              transformOrigin: 'left center',
              transform: `rotate(${angle}deg)`,
              background: `linear-gradient(
                to right,
                ${safeColor} 0%,
                ${safeColor}cc 30%,
                rgba(0,0,0,0.6) 70%,
                transparent 100%
              )`,
              borderRadius: 3,
              boxShadow: `0 0 12px ${safeColor}, 0 0 4px ${safeColor}`,
            }}
            initial={{ scaleX: 0, opacity: 1 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.85, ease: [0.2, 0, 0.8, 1] }}
          />
        )}
        {phase === 'fade' && (
          <motion.div
            key="streak-fade"
            style={{
              position: 'absolute',
              left:   source.x,
              top:    source.y - 2,
              width:  length,
              height: 3,
              transformOrigin: 'left center',
              transform: `rotate(${angle}deg)`,
              background: `linear-gradient(
                to right,
                ${safeColor}44 0%,
                transparent 100%
              )`,
              borderRadius: 3,
            }}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* ── Spaghettification particle burst at target ────────── */}
      <AnimatePresence>
        {phase === 'stretch' && (
          <motion.div
            key="impact"
            style={{
              position: 'absolute',
              left:   target.x - 20,
              top:    target.y - 20,
              width:  40,
              height: 40,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${safeColor}88 0%, transparent 70%)`,
              boxShadow: `0 0 20px ${safeColor}66`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.8, 1.2], opacity: [0, 1, 0] }}
            transition={{ duration: 0.85, delay: 0.65, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default VoidStreakOverlay;
