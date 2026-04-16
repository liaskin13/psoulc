import React, { useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';
import { AMETHYST_BOWLS, AMETHYST_SESSIONS } from '../data/amethyst';
import StuderTransportBar from '../components/StuderTransportBar';
import VaultWindow from '../components/VaultWindow';
import VoidStreakOverlay from '../components/VoidStreakOverlay';
import { useVaultVoid } from '../hooks/useVaultVoid';
import { VOID_CHAKRA_COLORS } from '../config';
import { useSystem } from '../state/SystemContext';
import { canComment } from '../utils/permissions';

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

// ── SESSION ROW ────────────────────────────────────────────────────────────
// Crystal session entry with hover-reveal VOID action.
function SessionRow({ session, isActive, onSelect, onVoid }) {
  const [hovered, setHovered] = useState(false);

  const handleVoid = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.closest('.amethyst-session-row').getBoundingClientRect();
    const sourcePos = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    onVoid({ id: session.id, label: session.label }, sourcePos);
  };

  return (
    <motion.div
      className={`amethyst-session-row ${isActive ? 'active' : ''}`}
      onClick={() => onSelect(session)}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ x: 6, transition: { duration: 0.15 } }}
    >
      <div className="session-row-content">
        <span className="session-label">{session.label}</span>
        <span className="session-meta">{session.frequency}Hz · {session.sublabel} · {session.date}</span>
      </div>
      <motion.button
        className="session-void-btn"
        onClick={handleVoid}
        initial={{ opacity: 0, x: 6 }}
        animate={{ opacity: hovered ? 1 : 0, x: hovered ? 0 : 6 }}
        transition={{ duration: 0.15 }}
        tabIndex={hovered ? 0 : -1}
        aria-label={`Void session ${session.label}`}
      >
        VOID
      </motion.button>
    </motion.div>
  );
}

// ── AMETHYST VAULT ─────────────────────────────────────────────────────────
function AmethystVault({ onBack, onExitSystem, onVoid, readOnly = false }) {
  const [activeId, setActiveId]     = useState(null);
  const [activeTrack, setActiveTrack] = useState(null);
  const [transportState, setTransportState] = useState('stop');
  const [pitchMultiplier, setPitchMultiplier] = useState(1.0);

  const {
    vaultWindowRef,
    voidProps,
    inverseBloom,
    isVoidArmed,
    armedVoidLabel,
    cancelArmedVoid,
    confirmArmedVoid,
    handleShelfVoid,
  } =
    useVaultVoid({
      voidColor: VOID_CHAKRA_COLORS.amethyst,
      onVoid: (item) => {
        if (activeId === item.id) { setActiveId(null); setActiveTrack(null); }
        onVoid?.(item);
      },
    });

  const handleBowlSelect = (bowl) => {
    setActiveId(bowl.id);
    setActiveTrack({ name: bowl.label, info: `${bowl.frequency}Hz · ${bowl.note}`, bpm: null });
  };

  const handleSessionSelect = (session) => {
    setActiveId(session.id);
    setActiveTrack({ name: session.label, info: `${session.frequency}Hz · ${session.date}`, bpm: null });
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
        <button className="vault-cmd" onClick={onBack}>SEAL VAULT</button>
        <button className="vault-cmd" onClick={onExitSystem}>EXIT SYSTEM</button>
        {!readOnly && <button className="vault-cmd">TUNE</button>}
      </div>

      <div className="vault-main-grid">
        <div className="vault-top-band">
          <VaultWindow
            ref={vaultWindowRef}
            inverseBloom={inverseBloom}
            voidArmed={isVoidArmed}
            armedLabel={armedVoidLabel}
            onCancelVoid={cancelArmedVoid}
            onConfirmVoid={confirmArmedVoid}
          />
        </div>

        <div className="vault-library-band">
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

            {/* Sessions archive — voidable items */}
            <div className="amethyst-sessions-section">
              <div className="amethyst-section-label">SESSIONS</div>
              <div className="amethyst-sessions">
                {AMETHYST_SESSIONS.map(session => (
                  <SessionRow
                    key={session.id}
                    session={session}
                    isActive={activeId === session.id}
                    onSelect={handleSessionSelect}
                    onVoid={readOnly ? undefined : handleShelfVoid}
                  />
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
        </div>
      </div>

      {/* Void system */}
      {!readOnly && <VoidStreakOverlay {...voidProps} />}
    </motion.div>
  );
}

export default AmethystVault;
