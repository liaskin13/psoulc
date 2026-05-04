import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import './App.css';

import { useSystem } from './state/SystemContext';
import { SESSION_KEY, LOCKBOX_PREFIX, VAULT_DISPLAY_NAMES } from './config';
import { canVoid, canEdit } from './utils/permissions';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { useBreakpoint } from './hooks/useBreakpoint';

// ── STATIC IMPORTS ───────────────────────────────────────────────────────────
import EntrySequence from './entry/EntrySequence';

// ── LAZY IMPORTS ─────────────────────────────────────────────────────────────
const AnalogConsole     = lazy(() => import('./console/AnalogConsole'));
const ArchitectConsole  = lazy(() => import('./console/ArchitectConsole'));
const ListenerShell     = lazy(() => import('./listener/ListenerShell'));

const TheVault       = lazy(() => import('./components/TheVault'));
const LockboxVault   = lazy(() => import('./lockbox/LockboxVault'));
const LockedDoor     = lazy(() => import('./lockbox/LockedDoor'));
const UploadModal    = lazy(() => import('./components/UploadModal'));

// ── SHARED UI ────────────────────────────────────────────────────────────────
import VaultSkeleton from './components/VaultSkeleton';
import BottomNav     from './components/BottomNav';

import { ARTIST_LOCKBOXES } from './data/saturn';
import { BROADCAST_DURATION_MS } from './config';

const VAULT_IDS = new Set(['saturn', 'mercury', 'venus', 'earth']);

function isVaultId(id) {
  return VAULT_IDS.has(id) || (typeof id === 'string' && id.startsWith(LOCKBOX_PREFIX));
}

function refreshSessionMeta() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || Date.now() > s.expires) return null;
    return { 
      owner: s.owner, 
      vault: s.vault ?? s.planet ?? null, 
      tier: s.tier ?? 'G',
      residentId: s.residentId ?? null
    };
  } catch (_) { return null; }
}

// Stages: 'entry' | 'console' | 'architect' | 'room'
function App() {
  const { setConsoleOwner, voidItem, sessionMeta, setSessionMeta, canEnterLockbox } = useSystem();
  const online = useNetworkStatus();
  const { isMobile } = useBreakpoint();
  const prefersReduced = useReducedMotion();

  const [stage, setStage]             = useState('entry');
  const [owner, setOwner]             = useState(null);
  const [activeNode, setActiveNode]   = useState(null);
  const [activeLockbox, setActiveLockbox] = useState(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [latentNodes, setLatentNodes] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const intakeInputRef = useRef(null);

  useEffect(() => {
    console.log('📍 APP STAGE:', stage);
  }, [stage]);

  // Apply identity theme to <body> based on authenticated owner
  useEffect(() => {
    const themeMap = { D: 'd-soul', L: 'l-architect' };
    const theme = owner ? (themeMap[owner] ?? null) : null;
    if (theme) {
      document.body.setAttribute('data-theme', theme);
    } else {
      document.body.removeAttribute('data-theme');
    }
  }, [owner]);

  // Auto-login: skip entry gate if a valid session exists
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const session = JSON.parse(raw);
      if (session?.owner && session.expires > Date.now()) {
        handleIgnite(session.owner, session.tier);
      }
    } catch (_) {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleIgnite = (ownerVal, tier = 'G') => {
    const meta = refreshSessionMeta();
    setOwner(ownerVal);
    setConsoleOwner(ownerVal);
    setSessionMeta(meta);

    // Tier-based routing
    if (tier === 'A') {
      if (ownerVal === 'L') setStage('architect');
      else setStage('console');
    } else {
      setStage('room');
      // Auto-focus vault if assigned
      if (meta?.vault) setActiveNode({ id: meta.vault });
    }
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
    setActiveLockbox(null);
    setActiveNode(node);
  };

  const handleNodeLongPress = (_node) => {
    // TODO: replace with in-UI modal before D sees his console (Gate B)
  };

  const handleLockboxSync = (lockbox) => {
    setActiveLockbox(lockbox);
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
    const rOnly    = !canEdit(sessionMeta, id);
    const vAllowed = canVoid(sessionMeta, id);
    const shared   = { onBack: closeVault, onExitSystem: handlePowerDown, readOnly: rOnly, voidAllowed: vAllowed };
    const onVoid   = (planet) => (item) => handleVoid(item, planet);

    let vault = null;
    if (VAULT_IDS.has(id)) {
      vault = <TheVault vault={id} {...shared} onVoid={onVoid(id)} />;
    }
    if (!vault && typeof id === 'string' && id.startsWith(LOCKBOX_PREFIX)) {
      if (canEnterLockbox(sessionMeta, id)) {
        vault = <LockboxVault {...shared} lockboxId={id} onVoid={onVoid(id)} />;
      } else {
        vault = <LockedDoor lockboxId={id} onBack={closeVault} />;
      }
    }
    return <Suspense fallback={<VaultSkeleton />}>{vault}</Suspense>;
  };

  const offlineBanner = !online && (
    <div className="offline-banner" role="status">SIGNAL LOST — ARCHIVE CACHED LOCALLY</div>
  );

  // ── ENTRY ────────────────────────────────────────────────────────────────
  if (stage === 'entry') {
    return (
      <>
        {offlineBanner}
        <a href="#main-content" className="skip-nav">Skip to archive</a>
        <EntrySequence onIgnite={handleIgnite} />
      </>
    );
  }

  // ── LISTENER SHELL — guest / member listening room ───────────────────────
  if (stage === 'room' && !activeNode) {
    return (
      <Suspense fallback={null}>
        <ListenerShell onPowerDown={handlePowerDown} sessionMeta={sessionMeta} />
      </Suspense>
    );
  }

  // ── L's CONSOLE — GOD MODE PLUS (sovereign root) ──────────────────────────
  if (stage === 'architect') {
    return (
      <>
        {offlineBanner}
        <a href="#main-content" className="skip-nav">Skip to archive</a>
        <div className="universe god-mode-mainframe state-create" id="main-content">
          <div className="glitter-grain" />
          {isBroadcasting && <div className="system-broadcast-pulse" aria-live="polite">SYSTEM BROADCAST ACTIVE</div>}
          <Suspense fallback={null}>
            <ArchitectConsole onPowerDown={handlePowerDown} onExplorePlanet={handleArchitectExplore} onBroadcast={handleBroadcast} onIntake={() => setShowUploadModal(true)} />
          </Suspense>
          {showUploadModal && (
            <Suspense fallback={null}>
              <UploadModal onClose={() => setShowUploadModal(false)} />
            </Suspense>
          )}
          <div className="psc-wordmark-footer" aria-hidden="true">PLEASANT SOUL COLLECTIVE</div>
        </div>
      </>
    );
  }

  // ── VAULT TAKEOVER ───────────────────────────────────────────────────────
  if (activeNode && isVaultId(activeNode.id)) {
    return (
      <>
        {offlineBanner}
        <motion.div
          className="universe god-mode-mainframe state-create"
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
          <div className="psc-wordmark-footer" aria-hidden="true">PLEASANT SOUL COLLECTIVE</div>
        </motion.div>
      </>
    );
  }

  // ── D's CONSOLE — ARTIST VIEW ──────────────────────────────────────────────
  return (
    <>
      {offlineBanner}
      <a href="#main-content" className="skip-nav">Skip to archive</a>
      <div className="universe god-mode-mainframe state-create">
        <div className="glitter-grain" />
        <div className="receded-logo">dp</div>
        <div className="psc-wordmark-footer" aria-hidden="true">PLEASANT SOUL COLLECTIVE</div>
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
              artistLockboxes={ARTIST_LOCKBOXES}
              onLockboxSync={handleLockboxSync}
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
