import React, { useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SpaceWindow from '../three/SpaceWindow';
import VaultSkeleton from '../components/VaultSkeleton';

const PlanetApproach = lazy(() => import('../three/PlanetApproach'));
const SaturnVault    = lazy(() => import('../saturn/SaturnVault'));
const VenusArchive   = lazy(() => import('../venus/VenusArchive'));
const EarthSafe      = lazy(() => import('../earth/EarthSafe'));
const MercuryStream  = lazy(() => import('../mercury/MercuryStream'));
const AmethystVault  = lazy(() => import('../amethyst/AmethystVault'));
const MarsVault      = lazy(() => import('../mars/MarsVault'));

// Planet dock definitions — LISTENER sees all main planets, no Moons
const LISTENER_PLANETS = [
  { id: 'mercury', symbol: '☿', label: 'MERCURY', color: '#b8a68f' },
  { id: 'venus',   symbol: '♀', label: 'VENUS',   color: '#d2691e' },
  { id: 'earth',   symbol: '⊕', label: 'EARTH',   color: '#8B7355' },
  { id: 'mars',    symbol: '♂', label: 'MARS',    color: '#c1440e' },
  { id: 'saturn',  symbol: '♄', label: 'SATURN',  color: '#b8860b' },
  { id: 'amethyst',symbol: '✦', label: 'CRYSTAL', color: '#9b7aa8' },
];

function renderVault(id, onBack) {
  switch (id) {
    case 'saturn':   return <SaturnVault   readOnly onBack={onBack} />;
    case 'venus':    return <VenusArchive  readOnly onBack={onBack} />;
    case 'earth':    return <EarthSafe     readOnly onBack={onBack} />;
    case 'mercury':  return <MercuryStream readOnly onBack={onBack} />;
    case 'amethyst': return <AmethystVault readOnly onBack={onBack} />;
    case 'mars':     return <MarsVault     readOnly onBack={onBack} />;
    default:         return null;
  }
}

function ListenerShell({ onPowerDown }) {
  const [pendingPlanet, setPendingPlanet] = useState(null);
  const [activeVault,   setActiveVault]   = useState(null);

  const handlePlanetSelect = (id) => {
    setPendingPlanet(id);
  };

  const handleApproachComplete = () => {
    setActiveVault(pendingPlanet);
    setPendingPlanet(null);
  };

  const handleVaultBack = () => {
    setActiveVault(null);
  };

  // ── PLANET APPROACH ──────────────────────────────────────────────
  if (pendingPlanet) {
    return (
      <Suspense fallback={<VaultSkeleton />}>
        <PlanetApproach
          planetId={pendingPlanet}
          onComplete={handleApproachComplete}
        />
      </Suspense>
    );
  }

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

  // ── MAIN LISTENER SHELL ─────────────────────────────────────────
  return (
    <div className="listener-shell">
      {/* 3D Solar System — ambient, non-clickable */}
      <div className="listener-space">
        <SpaceWindow onPlanetClick={undefined} />
      </div>

      {/* Top bar */}
      <div className="listener-topbar">
        <button className="listener-powerdown" onClick={onPowerDown}>
          EXIT SYSTEM
        </button>
        <span className="listener-title">PSC · LISTENER</span>
      </div>

      {/* Bottom planet dock */}
      <div className="listener-dock">
        {LISTENER_PLANETS.map(planet => (
          <motion.button
            key={planet.id}
            className="listener-planet-btn"
            style={{ '--planet-color': planet.color }}
            onClick={() => handlePlanetSelect(planet.id)}
            whileHover={{ scale: 1.15, y: -4 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            title={planet.label}
          >
            <span className="listener-planet-symbol">{planet.symbol}</span>
            <span className="listener-planet-label">{planet.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export default ListenerShell;
