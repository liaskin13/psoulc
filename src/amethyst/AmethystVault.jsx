import React, { useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';
import { AMETHYST_BOWLS, AMETHYST_SESSIONS } from '../data/amethyst';
import StuderTransportBar from '../components/StuderTransportBar';

// ── SINGING BOWL RING ──────────────────────────────────────────────────────
// Circular CSS ring pulsing at the bowl's Hz frequency.
// Decree: "wobbling orbit that feels like a singing bowl vibration"
function BowlRing({ bowl, isActive, onSelect }) {
  const pulseRate = bowl.frequency / 100; // map Hz to animation seconds

  return (
    <motion.div
      className={`bowl-ring ${isActive ? 'bowl-ring-active' : ''}`}
      style={{ '--bowl-color': bowl.color, '--bowl-glow': bowl.glow }}
      onClick={() => onSelect(bowl)}
      animate={{
        scale: [1, 1.04, 0.98, 1.02, 1],
        opacity: isActive ? [0.9, 1, 0.85, 1, 0.9] : [0.55, 0.65, 0.5, 0.65, 0.55],
      }}
      transition={{
        duration: pulseRate,
        repeat: Infinity,
        ease: 'easeInOut',
        repeatType: 'loop',
      }}
      whileHover={{
        scale: 1.08,
        opacity: 1,
        transition: { duration: 0.2 },
      }}
    >
      {/* Outer ring */}
      <div className="bowl-outer-ring" />
      {/* Inner ring — offset phase */}
      <motion.div
        className="bowl-inner-ring"
        animate={{ scale: [1, 1.06, 0.96, 1.04, 1] }}
        transition={{
          duration: pulseRate * 0.7,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: pulseRate * 0.2,
        }}
      />
      {/* Center node */}
      <div className="bowl-center-node" />

      {/* Frequency label */}
      <div className="bowl-freq-label">
        <span className="bowl-note">{bowl.note}</span>
        <span className="bowl-hz">{bowl.frequency}Hz</span>
      </div>

      {/* Name label below */}
      <div className="bowl-name-label">{bowl.label}</div>
    </motion.div>
  );
}

// ── AMETHYST VAULT ─────────────────────────────────────────────────────────
function AmethystVault({ onBack }) {
  const [activeId, setActiveId]     = useState(null);
  const [activeTrack, setActiveTrack] = useState(null);
  const [transportState, setTransportState] = useState('stop');
  const [pitchMultiplier, setPitchMultiplier] = useState(1.0);

  const handleBowlSelect = (bowl) => {
    setActiveId(bowl.id);
    setActiveTrack({ name: bowl.label, info: `${bowl.frequency}Hz · ${bowl.note}`, bpm: null });
  };

  return (
    <motion.div
      className="vault-screen amethyst-vault"
      initial={{ opacity: 0, scale: 0.93 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.12, 0, 0.2, 1] }}
    >
      {/* Crystal refraction overlay */}
      <div className="amethyst-refraction" />

      {/* Vault header */}
      <div className="vault-header">
        <div className="vault-title">AMETHYST</div>
        <div className="vault-subtitle">ANGI'S CRYSTAL VAULT · SOVEREIGN RESONANCE</div>
      </div>

      {/* Vault commands */}
      <div className="vault-commands">
        <button className="vault-cmd" onClick={onBack}>← BACK</button>
        <button className="vault-cmd">TUNE</button>
      </div>

      {/* Crystal vault body */}
      <div className="amethyst-body">
        {/* Chakra singing bowls — 7 rings arranged in vertical column */}
        <div className="amethyst-bowl-section">
          <div className="amethyst-section-label">CHAKRA BOWLS</div>
          <div className="bowl-grid">
            {AMETHYST_BOWLS.map(bowl => (
              <BowlRing
                key={bowl.id}
                bowl={bowl}
                isActive={activeId === bowl.id}
                onSelect={handleBowlSelect}
              />
            ))}
          </div>
        </div>

        {/* Sessions archive */}
        <div className="amethyst-sessions-section">
          <div className="amethyst-section-label">SESSIONS</div>
          <div className="amethyst-sessions">
            {AMETHYST_SESSIONS.map(session => (
              <motion.div
                key={session.id}
                className={`amethyst-session-row ${activeId === session.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveId(session.id);
                  setActiveTrack({ name: session.label, info: `${session.frequency}Hz · ${session.date}`, bpm: null });
                }}
                whileHover={{ x: 6, transition: { duration: 0.15 } }}
              >
                <span className="session-label">{session.label}</span>
                <span className="session-meta">{session.frequency}Hz · {session.sublabel} · {session.date}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Transport bar */}
      <StuderTransportBar
        activeTrack={activeTrack}
        transportState={transportState}
        pitchMultiplier={pitchMultiplier}
        onPlay={() => setTransportState('play')}
        onStop={() => setTransportState('stop')}
        onRewind={() => setTransportState('rewind')}
        onFastForward={() => setTransportState('ff')}
        onRecord={() => setTransportState('record')}
        onPitchChange={setPitchMultiplier}
      />
    </motion.div>
  );
}

export default AmethystVault;
