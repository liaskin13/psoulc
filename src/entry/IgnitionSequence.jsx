import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  IGNITION_WARP_DURATION_MS,
  IGNITION_STAGE_DURATION_MS,
  IGNITION_SETTLE_DELAY_MS
} from '../config';

// Chakra spectrum — Root → Crown
const CHAKRA = [
  { color: '#cc2200', shadow: 'rgba(204,34,0,0.8)' },
  { color: '#ff6600', shadow: 'rgba(255,102,0,0.8)' },
  { color: '#ffdd00', shadow: 'rgba(255,221,0,0.8)' },
  { color: '#33dd55', shadow: 'rgba(51,221,85,0.8)' },
  { color: '#22aaff', shadow: 'rgba(34,170,255,0.8)' },
  { color: '#5566ee', shadow: 'rgba(85,102,238,0.8)' },
  { color: '#cc44ff', shadow: 'rgba(204,68,255,0.8)' },
];

function IgnitionSequence({ onComplete }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const sequence = [
      () => setStage(1), // THE FLASH
      () => setStage(2), // THE WARP — Chakra tunnel
      () => setStage(3), // THE SOLAR PLUNGE
      () => setStage(4), // THE SETTLE
    ];

    let timeout = 0;
    sequence.forEach((action, index) => {
      timeout += index === 1 ? IGNITION_WARP_DURATION_MS : IGNITION_STAGE_DURATION_MS;
      setTimeout(action, timeout);
    });

    setTimeout(onComplete, timeout + IGNITION_SETTLE_DELAY_MS);
  }, [onComplete]);

  return (
    <div className={`ignition-sequence stage-${stage}`}>
      {/* Stage 1 — The Flash */}
      <div className="flash-overlay" />

      {/* Stage 2 — DP Grid accelerating toward camera */}
      {stage >= 1 && stage <= 3 && (
        <motion.div
          className="dp-grid-warp"
          initial={{ scale: 1, opacity: 0.3 }}
          animate={{ scale: stage >= 2 ? 8 : 1.5, opacity: stage >= 3 ? 0 : 0.4 }}
          transition={{ duration: IGNITION_WARP_DURATION_MS / 1000, ease: [0.2, 0, 1, 0.9] }}
        />
      )}

      {/* Stage 2 — Chakra Warp: 7 orbs stretching into light streaks */}
      {stage >= 1 && (
        <div className="chakra-warp">
          {CHAKRA.map((c, i) => (
            <motion.div
              key={i}
              className="chakra-orb"
              style={{ background: c.color, boxShadow: `0 0 8px ${c.shadow}` }}
              initial={{ scaleX: 1, scaleY: 1, opacity: 0 }}
              animate={stage >= 1 ? {
                scaleX: [1, 1, 40, 80],
                scaleY: [1, 1, 0.15, 0.05],
                opacity: [0, 1,  1,  0],
              } : {}}
              transition={{
                duration: 1.6,
                delay: i * 0.08,
                ease: [0.15, 0, 1, 0.9],
              }}
            />
          ))}
        </div>
      )}

      {/* Stage 3 — Solar Plunge: sun expanding to fill the screen */}
      <div className="solar-plunge" />

      {/* Warp streaks (background layer) */}
      <div className="warp-streaks" />
    </div>
  );
}

export default IgnitionSequence;
