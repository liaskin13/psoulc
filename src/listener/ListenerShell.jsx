import React, { useState, lazy, Suspense, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VaultSkeleton from '../components/VaultSkeleton';
import { getWaveformBars } from '../utils/waveform';

function ListenerWatermark() {
  const bars = getWaveformBars('listener-ambient', 48);
  const barW = 4, gap = 3, H = 80;
  const W = bars.length * (barW + gap) - gap;
  return (
    <svg
      className="listener-waveform-watermark"
      aria-hidden="true"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {bars.map((pct, i) => {
        const h = (pct / 100) * H;
        return (
          <rect
            key={i}
            x={i * (barW + gap)}
            y={H - h}
            width={barW}
            height={h}
            rx="1"
            fill="rgba(255,191,0,0.12)"
          />
        );
      })}
    </svg>
  );
}

const TheVault = lazy(() => import('../components/TheVault'));

// Active vaults only — in launch priority order.
// Crystal (Amethyst) and Mars excluded: no content to upload yet.
// Earth (Sonic Architecture) exists but is not a listener priority yet.
const LISTENER_VAULTS = [
  { id: 'venus',   label: 'MIXES',          color: '#d2691e' },
  { id: 'saturn',  label: 'ORIGINAL MUSIC', color: '#b8860b' },
  { id: 'mercury', label: 'LIVE SETS',      color: '#b8a68f' },
];

function renderVault(id, onBack) {
  if (!id) return null;
  return <TheVault vault={id} readOnly onBack={onBack} />;
}

function ListenerShell({ onPowerDown }) {
  const [pendingPlanet, setPendingPlanet] = useState(null);
  const [activeVault,   setActiveVault]   = useState(null);
  const [lastPlayed,    setLastPlayed]    = useState(null);

  const handlePlanetSelect = (id) => {
    setPendingPlanet(id);
  };

  const handleVaultBack = () => {
    setLastPlayed(activeVault);
    setActiveVault(null);
  };

  // Skip approach animation (three.js removed) — resolve to vault in effect, not render
  useEffect(() => {
    if (!pendingPlanet) return;
    setActiveVault(pendingPlanet);
    setPendingPlanet(null);
  }, [pendingPlanet]);

  // ── VAULT VIEW ───────────────────────────────────────────────────
  if (activeVault) {
    return (
      <div className="universe listener-mainframe">
        <div className="glitter-grain" />
        <div className="receded-logo">dp</div>
        <Suspense fallback={<VaultSkeleton />}>
          {renderVault(activeVault, handleVaultBack)}
        </Suspense>
      </div>
    );
  }

  const lastVaultMeta = lastPlayed
    ? LISTENER_VAULTS.find(v => v.id === lastPlayed)
    : null;

  // ── MAIN LISTENER SHELL ─────────────────────────────────────────
  return (
    <div className="listener-shell">
      <div className="listener-space" />

      {/* Top bar */}
      <div className="listener-topbar">
        <button className="listener-powerdown" onClick={onPowerDown}>
          EXIT SYSTEM
        </button>
        <span className="listener-title">PSC · LISTENER</span>
      </div>

      {/* Background waveform watermark */}
      <ListenerWatermark />

      {/* Now playing strip — shown after leaving a vault */}
      <AnimatePresence>
        {lastVaultMeta && (
          <motion.div
            className="listener-now-playing"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <span
              className="listener-np-dot"
              style={{ background: lastVaultMeta.color }}
              aria-hidden="true"
            />
            <span className="listener-np-label">{lastVaultMeta.label}</span>
            <span className="listener-np-status">LISTENING</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom vault dock */}
      <div className="listener-dock">
        {LISTENER_VAULTS.map(vault => (
          <motion.button
            key={vault.id}
            className={`listener-vault-btn ${lastPlayed === vault.id ? 'listener-vault-active' : ''}`}
            style={{ '--vault-color': vault.color }}
            onClick={() => handlePlanetSelect(vault.id)}
            whileHover={{ scale: 1.08, y: -3 }}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            <span className="listener-vault-pip" aria-hidden="true" />
            <span className="listener-vault-label">{vault.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export default ListenerShell;
