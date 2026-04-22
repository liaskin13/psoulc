import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import './App.css';

import { useSystem } from './state/SystemContext';
import { SESSION_KEY, MOON_PREFIX } from './config';
import { canVoid, canEdit } from './utils/permissions';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { useBreakpoint } from './hooks/useBreakpoint';

// ── STATIC IMPORTS ───────────────────────────────────────────────────────────
import EntrySequence from './entry/EntrySequence';

// ── LAZY IMPORTS ─────────────────────────────────────────────────────────────
const AnalogConsole     = lazy(() => import('./console/AnalogConsole'));
const ArchitectConsole  = lazy(() => import('./console/ArchitectConsole'));

const SaturnVault    = lazy(() => import('./saturn/SaturnVault'));
const MercuryStream  = lazy(() => import('./mercury/MercuryStream'));
const VenusArchive   = lazy(() => import('./venus/VenusArchive'));
const EarthSafe      = lazy(() => import('./earth/EarthSafe'));
const AmethystVault  = lazy(() => import('./amethyst/AmethystVault'));
const MarsVault      = lazy(() => import('./mars/MarsVault'));
const MoonVault      = lazy(() => import('./moons/MoonVault'));
const UploadModal    = lazy(() => import('./components/UploadModal'));

// ── SHARED UI ────────────────────────────────────────────────────────────────
import VaultSkeleton from './components/VaultSkeleton';
import BottomNav     from './components/BottomNav';

import { SATURN_MOONS } from './data/saturn';
import { BROADCAST_DURATION_MS } from './config';

const VAULT_IDS = new Set(['saturn', 'mercury', 'venus', 'earth', 'amethyst', 'mars']);

function isVaultId(id) {
  return VAULT_IDS.has(id) || (typeof id === 'string' && id.startsWith(MOON_PREFIX));
}

function refreshSessionMeta() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || Date.now() > s.expires) return null;
    return { owner: s.owner, planet: s.planet ?? null, tier: s.tier ?? 'G' };
  } catch (_) { return null; }
}

// Stages: 'entry' | 'console' | 'architect' | 'room'
function App() {
  const { isProtected, setConsoleOwner, voidItem, sessionMeta, setSessionMeta } = useSystem();
  const online = useNetworkStatus();
  const { isMobile } = useBreakpoint();
  const prefersReduced = useReducedMotion();

  const [stage, setStage]             = useState('entry');
  const [owner, setOwner]             = useState(null);
  const [activeNode, setActiveNode]   = useState(null);
  const [activeMoon, setActiveMoon]   = useState(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [latentNodes, setLatentNodes] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const intakeInputRef = useRef(null);

  useEffect(() => {
    console.log('📍 APP STAGE:', stage);
  }, [stage]);

  // Auto-login: skip entry gate if a valid session exists
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const session = JSON.parse(raw);
      if (session?.owner && session.expires > Date.now()) {
        handleIgnite(session.owner);
      }
    } catch (_) {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleIgnite = (ownerVal) => {
    setOwner(ownerVal);
    setConsoleOwner(ownerVal);
    setSessionMeta(refreshSessionMeta());
    if (ownerVal === 'D') setStage('console');
    else if (ownerVal === 'L') setStage('architect');
    else setStage('room');
  };

  const closeVault = () => {
    setActiveNode(null);
    if (owner === 'D') setStage('console');
    else if (owner === 'L') setStage('architect');
    else setStage('room');
  };

  const handlePowerDown = () => {
    try { localStorage.removeItem(SESSION_KEY); } catch (_) {}
    setSessionMeta(null);
    setStage('entry');
  };

  const handleNodeSelect = (node) => {
    setActiveMoon(null);
    setActiveNode(node);
  };

  const handleNodeLongPress = (node) => {
    const action = prompt(`Architect Override for ${node.label}:\n1. Rename\n2. Move\n3. Delete`);
    if (action === '1') {
      const newName = prompt('New name:');
      if (newName) console.log(`Renaming ${node.label} to ${newName}`);
    }
  };

  const handleMoonSync = (moon) => {
    setActiveMoon(moon);
    setActiveNode(null);
  };

  const handleBroadcast = () => {
    setIsBroadcasting(true);
    setTimeout(() => setIsBroadcasting(false), BROADCAST_DURATION_MS);
  };

  const handleIntakeFiles = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const targetPlanet = VAULT_IDS.has(activeNode?.id) ? activeNode.id : null;
    const incoming = files.map((file) => ({
      id: `latent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      label: file.name,
      size: file.size,
      targetPlanet,
      receivedAt: new Date().toISOString(),
    }));
    setLatentNodes((prev) => [...incoming, ...prev]);
    event.target.value = '';
  };

  const handleClaimNode = (node) => {
    setLatentNodes((prev) => prev.filter((n) => n.id !== node.id));
    if (node.targetPlanet && VAULT_IDS.has(node.targetPlanet)) {
      setActiveNode({ id: node.targetPlanet });
    }
  };

  const handleArchitectExplore = (planetId) => {
    if (!planetId || !VAULT_IDS.has(planetId)) return;
    setActiveNode({ id: planetId });
  };

  const handleVoid = (item, planet) => {
    voidItem(item, planet);
  };

  const renderVault = (id) => {
    const rOnly = !canEdit(sessionMeta, id);
    const vAllowed = canVoid(sessionMeta, id);
    let vault = null;
    switch (id) {
      case 'saturn':   vault = <SaturnVault   onVoid={(item) => handleVoid(item, 'saturn')}   onExplore={() => {}} onTune={() => {}} onBack={closeVault} onExitSystem={handlePowerDown} readOnly={rOnly} voidAllowed={vAllowed} />; break;
      case 'mercury':  vault = <MercuryStream  onBack={closeVault} onExitSystem={handlePowerDown} readOnly={rOnly} voidAllowed={vAllowed} />; break;
      case 'venus':    vault = <VenusArchive   onVoid={(item) => handleVoid(item, 'venus')}   onBack={closeVault} onExitSystem={handlePowerDown} readOnly={rOnly} voidAllowed={vAllowed} />; break;
      case 'earth':    vault = <EarthSafe      onVoid={(item) => handleVoid(item, 'earth')}   onBack={closeVault} onExitSystem={handlePowerDown} readOnly={rOnly} voidAllowed={vAllowed} />; break;
      case 'amethyst': vault = <AmethystVault  onVoid={(item) => handleVoid(item, 'amethyst')} onBack={closeVault} onExitSystem={handlePowerDown} readOnly={rOnly} voidAllowed={vAllowed} />; break;
      case 'mars':     vault = <MarsVault      onVoid={(item) => handleVoid(item, 'mars')}     onBack={closeVault} onExitSystem={handlePowerDown} readOnly={rOnly} voidAllowed={vAllowed} />; break;
      default: break;
    }
    if (!vault && typeof id === 'string' && id.startsWith(MOON_PREFIX)) {
      vault = <MoonVault moonId={id} onBack={closeVault} onExitSystem={handlePowerDown} readOnly={rOnly} voidAllowed={vAllowed} onVoid={(item) => handleVoid(item, id)} />;
    }
    return <Suspense fallback={<VaultSkeleton />}>{vault}</Suspense>;
  };

  // ── ENTRY ────────────────────────────────────────────────────────────────
  if (stage === 'entry') {
    return (
      <>
        {!online && <div className="offline-banner" role="status">SIGNAL LOST — ARCHIVE CACHED LOCALLY</div>}
        <a href="#main-content" className="skip-nav">Skip to archive</a>
        <EntrySequence onIgnite={handleIgnite} />
      </>
    );
  }

  // ── ROOM — Guest/Listener (Phase 3 shell) ────────────────────────────────
  if (stage === 'room') {
    return (
      <div className="the-room" id="main-content">
        <div className="room-backdrop" />
        <div className="room-light" />
        <div className="room-header">PLEASANT SOUL COLLECTIVE</div>
        <div className="room-vault-grid">
          {[...VAULT_IDS].map(id => (
            <button
              key={id}
              className="vault-panel"
              onClick={() => setActiveNode({ id })}
            >
              <span className="vault-panel-name">{id.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── ARCHITECT CONSOLE ────────────────────────────────────────────────────
  if (stage === 'architect') {
    return (
      <>
        {!online && <div className="offline-banner" role="status">SIGNAL LOST — ARCHIVE CACHED LOCALLY</div>}
        <a href="#main-content" className="skip-nav">Skip to archive</a>
        <div className="universe god-mode-mainframe state-create" id="main-content">
          <div className="glitter-grain" />
          {isBroadcasting && <div className="system-broadcast-pulse" aria-live="polite">SYSTEM BROADCAST ACTIVE</div>}
          <Suspense fallback={null}>
            <ArchitectConsole onPowerDown={handlePowerDown} onExplorePlanet={handleArchitectExplore} onBroadcast={handleBroadcast} />
          </Suspense>
        </div>
      </>
    );
  }

  // N8: If sealed, non-Tier-A sessions are evicted back to entry.
  if (isProtected && sessionMeta && sessionMeta.tier !== 'A') {
    return (
      <>
        {!online && <div className="offline-banner" role="status">SIGNAL LOST — ARCHIVE CACHED LOCALLY</div>}
        <EntrySequence onIgnite={handleIgnite} />
      </>
    );
  }

  const stateClass = isProtected ? 'state-protected' : 'state-create';

  // ── VAULT TAKEOVER ───────────────────────────────────────────────────────
  if (activeNode && isVaultId(activeNode.id)) {
    return (
      <>
        {!online && <div className="offline-banner" role="status">SIGNAL LOST — ARCHIVE CACHED LOCALLY</div>}
        <motion.div
          className={`universe god-mode-mainframe ${stateClass}`}
          id="main-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="glitter-grain" />
          <div className="receded-logo">dp</div>
          {renderVault(activeNode.id)}
          {isMobile && (
            <BottomNav
              activeId={activeNode.id}
              onSelect={(id) => setActiveNode({ id })}
            />
          )}
        </motion.div>
      </>
    );
  }

  // ── D's GOD MODE CONSOLE (full screen) ──────────────────────────────────
  return (
    <>
      {!online && <div className="offline-banner" role="status">SIGNAL LOST — ARCHIVE CACHED LOCALLY</div>}
      <a href="#main-content" className="skip-nav">Skip to archive</a>
      <div className={`universe god-mode-mainframe ${stateClass}`}>
        <div className="glitter-grain" />
        <div className="receded-logo">dp</div>
        {isBroadcasting && <div className="system-broadcast-pulse" aria-live="polite">SYSTEM BROADCAST ACTIVE</div>}

        <input
          ref={intakeInputRef}
          type="file"
          multiple
          onChange={handleIntakeFiles}
          style={{ display: 'none' }}
          aria-hidden="true"
        />

        <motion.div
          id="main-content"
          className="cockpit"
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, scale: 1.06, filter: 'brightness(5) blur(6px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'brightness(1) blur(0px)' }}
          transition={prefersReduced
            ? { duration: 0.15 }
            : { duration: 2, ease: [0.08, 0, 0.3, 1] }
          }
        >
          <Suspense fallback={null}>
            <AnalogConsole
              activeNode={activeNode}
              onNodeSelect={handleNodeSelect}
              onNodeLongPress={handleNodeLongPress}
              onClaimNode={handleClaimNode}
              onBroadcast={handleBroadcast}
              onIntake={() => setShowUploadModal(true)}
              isBroadcasting={isBroadcasting}
              latentNodes={latentNodes}
              saturnMoons={SATURN_MOONS}
              onMoonSync={handleMoonSync}
              onPowerDown={handlePowerDown}
            />
          </Suspense>

          {showUploadModal && (
            <Suspense fallback={null}>
              <UploadModal onClose={() => setShowUploadModal(false)} />
            </Suspense>
          )}
        </motion.div>

        {isMobile && (
          <BottomNav
            activeId={activeNode?.id}
            onSelect={(id) => setActiveNode({ id })}
          />
        )}
      </div>
    </>
  );
}

export default App;
