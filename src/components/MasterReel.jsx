import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VOID_DRAG_RADIUS_PX } from '../config';
import { useSystem } from '../state/SystemContext';

// ── MASTER REEL — BPM-synced tape reel with Shadow Gap void transfer ──────
//
// Shadow Gap (L1 Lagrange point) void transfer:
//   1. User drags reel toward screen center (where HolographicMap / Binary Core lives)
//   2. Within VOID_DRAG_RADIUS_PX → gravitational pull animation activates
//   3. Reel snaps toward Black Star and spaghettifies
//   4. Prism streak inherits planet's chakra color (via planetColor prop)
//   5. Item stored in architectArchive via voidItem()
//
function MasterReel({ trackName, bpm, frequency, onVoid, pitchMultiplier = 1.0, planetColor }) {
  const [isVoiding, setIsVoiding]           = useState(false);
  const [showStreak, setShowStreak]         = useState(false);
  const [streakAngle, setStreakAngle]       = useState(0);
  const [gravitationalPull, setGravitationalPull] = useState(false);
  const reelRef = useRef(null);
  const { voidItem } = useSystem();

  const rotationSpeed = (bpm / 60) * 360 * pitchMultiplier; // degrees/second

  const handleDragEnd = (event, info) => {
    if (isVoiding) return;

    const centerX = window.innerWidth  / 2;
    const centerY = window.innerHeight / 2;
    const dx = info.point.x - centerX;
    const dy = info.point.y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < VOID_DRAG_RADIUS_PX) {
      // Crossed the L1 threshold — initiate spaghettification
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      setStreakAngle(angle);
      triggerSpaghettification();
    }
  };

  const handleDrag = (event, info) => {
    if (isVoiding) return;
    const centerX = window.innerWidth  / 2;
    const centerY = window.innerHeight / 2;
    const dx = info.point.x - centerX;
    const dy = info.point.y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    // Enter gravitational pull zone at 2× the trigger radius
    setGravitationalPull(distance < VOID_DRAG_RADIUS_PX * 2.5);
  };

  const triggerSpaghettification = () => {
    setIsVoiding(true);
    setShowStreak(true);

    setTimeout(() => {
      setShowStreak(false);
      if (onVoid) onVoid({ trackName, bpm, frequency });
    }, 1200);
  };

  const chakraColor = planetColor || '#ffbf00';

  return (
    <div style={{ position: 'relative' }}>
      {/* Prism streak — Decree: "head is Vibrant Planet Color, tail fades to black" */}
      <AnimatePresence>
        {showStreak && (
          <motion.div
            className="spaghetti-streak"
            style={{
              '--streak-color': chakraColor,
              transform: `rotate(${streakAngle}deg)`,
            }}
            initial={{ scaleX: 0, opacity: 1 }}
            animate={{ scaleX: 1, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.0, ease: [0.4, 0, 1, 1] }}
          />
        )}
      </AnimatePresence>

      <motion.div
        ref={reelRef}
        className={`master-reel ${gravitationalPull ? 'in-gravity-well' : ''}`}
        animate={isVoiding ? {
          scaleY: 8,
          scaleX: 0.05,
          opacity: 0,
          x: (window.innerWidth / 2) - (reelRef.current?.getBoundingClientRect().left || 0),
          y: (window.innerHeight / 2) - (reelRef.current?.getBoundingClientRect().top || 0),
        } : {}}
        transition={isVoiding ? {
          duration: 1.0,
          ease: [0.8, 0, 1, 0.8],
        } : {}}
        drag
        dragConstraints={{ left: -200, right: 200, top: -200, bottom: 200 }}
        dragElastic={0.25}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        whileDrag={{ scale: 1.08, zIndex: 100 }}
      >
        <motion.div
          className="reel-body"
          animate={{ rotate: 360 }}
          transition={{
            rotate: {
              duration: 60 / Math.max(bpm * pitchMultiplier, 1),
              repeat: Infinity,
              ease: 'linear',
            },
          }}
          style={{
            // BPM strobe — Decree: "Motion Blur to simulate 70's film capture"
            filter: `blur(${Math.max(0, (bpm - 100) * 0.012)}px)`,
          }}
        >
          <div className="reel-label">
            <div className="track-info">
              <span className="track-name">{trackName}</span>
              <span className="bpm-display">{bpm} BPM</span>
              <span className="freq-display">{frequency}</span>
            </div>
          </div>
        </motion.div>

        {/* Gravitational pull indicator */}
        {gravitationalPull && !isVoiding && (
          <motion.div
            className="gravity-indicator"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        )}
      </motion.div>
    </div>
  );
}

export default MasterReel;
