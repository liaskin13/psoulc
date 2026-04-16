import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import './App.css';

import { useSystem } from './state/SystemContext';
import { SESSION_KEY, SESSION_TTL_MS, MOON_PREFIX } from './config';
import { canVoid, canEdit, canComment } from './utils/permissions';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { useBreakpoint } from './hooks/useBreakpoint';

// ── STATIC IMPORTS (needed at entry — small, critical path) ──────────────
import EntrySequence     from './entry/EntrySequence';

// ── LAZY IMPORTS (code-split — only load after authentication) ───────────
const IgnitionSequence  = lazy(() => import('./entry/IgnitionSequence'));
const Viewscreen        = lazy(() => import('./console/Viewscreen'));
const AnalogConsole     = lazy(() => import('./console/AnalogConsole'));
const BlackStarConsole  = lazy(() => import('./black-star/BlackStarConsole'));
const ArchitectConsole  = lazy(() => import('./console/ArchitectConsole'));

const SaturnVault    = lazy(() => import('./saturn/SaturnVault'));
const MercuryStream  = lazy(() => import('./mercury/MercuryStream'));
const VenusArchive   = lazy(() => import('./venus/VenusArchive'));
const EarthSafe      = lazy(() => import('./earth/EarthSafe'));
const AmethystVault  = lazy(() => import('./amethyst/AmethystVault'));
const MarsVault      = lazy(() => import('./mars/MarsVault'));
const MoonVault      = lazy(() => import('./moons/MoonVault'));

const PlanetApproach = lazy(() => import('./three/PlanetApproach'));
const AstralFlyby   = lazy(() => import('./three/AstralFlyby'));
const GalleryDrift  = lazy(() => import('./three/GalleryDrift'));
const SaturnAtrium  = lazy(() => import('./three/SaturnAtrium'));
const SurveyRing    = lazy(() => import('./three/SurveyRing'));

// ── SHARED UI ────────────────────────────────────────────────────────────
import VaultSkeleton from './components/VaultSkeleton';
import BottomNav     from './components/BottomNav';

import { SATURN_MOONS } from './data/saturn';
import { BROADCAST_DURATION_MS } from './config';

// ── CHAKRA FREQUENCY TONES ────────────────────────────────────────────────
const PLANET_TONES = {
  mercury:  480,  // transformation
  venus:    528,  // connecting relationships
  earth:    432,  // liberating guilt
  mars:     396,  // iron frequency
  saturn:   396,  // spiritual order
  amethyst: 852,  // divine consciousness
};

function playChakraTone(hz) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator(); // harmonic
    const gain = ctx.createGain();
    const harmGain = ctx.createGain();

    osc1.frequency.value = hz;
    osc1.type = 'sine';
    osc2.frequency.value = hz * 2; // octave up
    osc2.type = 'sine';

    harmGain.gain.value = 0.25; // harmonic at 25% volume

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.055, ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.055, ctx.currentTime + 2.0);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3.2);

    osc1.connect(gain);
    osc2.connect(harmGain);
    harmGain.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    setTimeout(() => {
      try { osc1.stop(); osc2.stop(); ctx.close(); } catch (_) {}
    }, 3500);
  } catch (_) {
    // Audio blocked or not available
  }
}

const VAULT_IDS = new Set(['saturn', 'mercury', 'venus', 'earth', 'amethyst', 'mars']);

function isVaultId(id) {
  return VAULT_IDS.has(id) || (typeof id === 'string' && id.startsWith(MOON_PREFIX));
}

// Read enriched session from localStorage — called after EntrySequence writes it.
function refreshSessionMeta() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || Date.now() > s.expires) return null;
    return { owner: s.owner, planet: s.planet ?? null, tier: s.tier ?? 'G' };
  } catch (_) { return null; }
}

// Stages:
//   'entry'          — code input portal
//   'astral-flyby'   — cinematic entry flyby (all tiers)
//   'ignition'       — Sun ignition sequence → 'console'
//   'console'        — D's God Mode Console (Sun)
//   'architect'      — L's Black Star Console
//   'gallery-drift'  — Tier G: eternal equatorial drift, browse planets
//   'saturn-atrium'  — Tier C: Saturn lobby, moon orbs
//   'survey-ring'    — Tier B (no planet): top-down full system
//   'vault-open'     — Vault takeover (from parking select)

function App() {
  const { isProtected, setConsoleOwner, voidItem, sessionMeta, setSessionMeta } = useSystem();
  const online = useNetworkStatus();
  const { isMobile } = useBreakpoint();
  const prefersReduced = useReducedMotion();

  const [stage, setStage]                       = useState('entry');
  const [owner, setOwner]                       = useState(null);
  const [activeNode, setActiveNode]             = useState(null);
  const [pendingVaultNode, setPendingVaultNode] = useState(null);
  const [activeMoon, setActiveMoon]             = useState(null);
  const [isBroadcasting, setIsBroadcasting]     = useState(false);
  const [showWelcome, setShowWelcome]           = useState(true);
  const [latentNodes, setLatentNodes]           = useState([]);
  const intakeInputRef                           = useRef(null);

  useEffect(() => {
    console.log('📍 APP STAGE:', stage);
  }, [stage]);

  // Auto-login: skip entry gate if a valid session token exists
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const session = JSON.parse(raw);
      if (session?.owner && session.expires > Date.now()) {
        handleIgnite(session.owner);
      }
    } catch (_) { /* corrupt token — ignore, proceed to gate */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 528Hz Miracle Hum — fades in on Sun console activation
  useEffect(() => {
    if (stage !== 'console') return;
    let ctx, osc, gain;
    try {
      ctx  = new AudioContext();
      osc  = ctx.createOscillator();
      gain = ctx.createGain();
      osc.frequency.value = 528;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.06, ctx.currentTime + 1.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      setTimeout(() => { try { osc.stop(); ctx.close(); } catch (_) {} }, 1500);
    } catch (_) { /* Audio blocked — non-critical */ }
  }, [stage]);

  // Entry dispatch — all tiers route through AstralFlyby
  const handleIgnite = (ownerVal) => {
    setOwner(ownerVal);
    setConsoleOwner(ownerVal);
    setSessionMeta(refreshSessionMeta()); // pick up enriched session written by EntrySequence
    setStage('astral-flyby');
  };

  // AstralFlyby onComplete — destination is a stage name or vault planet id
  const handleAstralComplete = (dest) => {
    if (VAULT_IDS.has(dest)) {
      setActiveNode({ id: dest });
      setStage('vault-open');
    } else {
      setStage(dest);
    }
  };

  // Parking experiences (GalleryDrift / SaturnAtrium / SurveyRing) vault select
  const handleParkingVaultSelect = (planetId) => {
    setActiveNode({ id: planetId });
    setStage('vault-open');
  };

  // Click-to-EXPLORE from 3D SpaceWindow raycasting
  const handleSpaceWindowClick = (planetId) => {
    setActiveMoon(null);
    setShowWelcome(false);
    setPendingVaultNode({ id: planetId });
    const tone = PLANET_TONES[(typeof planetId === 'string' && planetId.startsWith(MOON_PREFIX)) ? 'saturn' : planetId];
    if (tone) playChakraTone(tone);
  };

  const closeVault = () => setActiveNode(null);

  const handlePowerDown = () => {
    try { localStorage.removeItem(SESSION_KEY); } catch (_) {}
    setSessionMeta(null);
    setStage('entry');
  };

  const handleNodeSelect = (node) => {
    setActiveMoon(null);
    setShowWelcome(false);
    if (isVaultId(node.id)) {
      // Trigger 3D approach sequence before opening the vault
      setPendingVaultNode(node);
      // Play chakra tone for the planet
      const tone = PLANET_TONES[(typeof node.id === 'string' && node.id.startsWith(MOON_PREFIX)) ? 'saturn' : node.id];
      if (tone) playChakraTone(tone);
    } else {
      setActiveNode(node);
      // Play chakra tone for binary cores
      if (node.id === 'sun' || node.id === 'binary-core') playChakraTone(528);
    }
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
    setShowWelcome(false);
  };

  const handleBroadcast = () => {
    setIsBroadcasting(true);
    setTimeout(() => setIsBroadcasting(false), BROADCAST_DURATION_MS);
  };

  const handleIntake = () => {
    intakeInputRef.current?.click();
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
      setPendingVaultNode({ id: node.targetPlanet });
    }
  };

  const handleArchitectExplore = (planetId) => {
    if (!planetId || !VAULT_IDS.has(planetId)) return;
    setPendingVaultNode({ id: planetId });
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

  // ── STAGE: ENTRY ──────────────────────────────────────────────────────────
  if (stage === 'entry') {
    return (
      <>
        {!online && <div className="offline-banner" role="status">SIGNAL LOST — ARCHIVE CACHED LOCALLY</div>}
        <a href="#main-content" className="skip-nav">Skip to archive</a>
        <EntrySequence onIgnite={handleIgnite} />
      </>
    );
  }

  // ── STAGE: SUN IGNITION ───────────────────────────────────────────────────
  if (stage === 'ignition') {
    return (
      <Suspense fallback={null}>
        <IgnitionSequence onComplete={() => setStage('console')} />
      </Suspense>
    );
  }

  // ── STAGE: ASTRAL FLYBY — cinematic entry for all tiers ──────────────────
  if (stage === 'astral-flyby') {
    return (
      <Suspense fallback={null}>
        <AstralFlyby sessionMeta={sessionMeta} owner={owner} onComplete={handleAstralComplete} />
      </Suspense>
    );
  }

  // ── STAGE: GALLERY DRIFT — Tier G eternal drift, browse + select ─────────
  if (stage === 'gallery-drift') {
    return (
      <Suspense fallback={null}>
        <GalleryDrift onVaultSelect={handleParkingVaultSelect} onPowerDown={handlePowerDown} />
      </Suspense>
    );
  }

  // ── STAGE: SATURN ATRIUM — Tier C moon artist lobby ──────────────────────
  if (stage === 'saturn-atrium') {
    return (
      <Suspense fallback={null}>
        <SaturnAtrium sessionMeta={sessionMeta} onVaultSelect={handleParkingVaultSelect} onPowerDown={handlePowerDown} />
      </Suspense>
    );
  }

  // ── STAGE: SURVEY RING — Tier B (no planet) top-down system survey ───────
  if (stage === 'survey-ring') {
    return (
      <Suspense fallback={null}>
        <SurveyRing onVaultSelect={handleParkingVaultSelect} onPowerDown={handlePowerDown} />
      </Suspense>
    );
  }

  // ── STAGE: ARCHITECT CONSOLE (L's Cold Tactical Bridge — 7677) ──────────
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

  // ── STAGE: VAULT OPEN (from parking experiences) ──────────────────────────
  if (stage === 'vault-open' && activeNode && isVaultId(activeNode.id)) {
    return (
      <>
        {!online && <div className="offline-banner" role="status">SIGNAL LOST — ARCHIVE CACHED LOCALLY</div>}
        <div className="universe god-mode-mainframe state-create" id="main-content">
          <div className="glitter-grain" />
          <div className="receded-logo">dp</div>
          {renderVault(activeNode.id)}
        </div>
      </>
    );
  }

  const stateClass = isProtected ? 'state-protected' : 'state-create';

  // ── STAGE: PLANET APPROACH — 3D flyby to vault entry ─────────────────────
  if (pendingVaultNode) {
    return (
      <Suspense fallback={<VaultSkeleton />}>
        <PlanetApproach
          planetId={pendingVaultNode.id}
          onComplete={() => {
            setActiveNode(pendingVaultNode);
            setPendingVaultNode(null);
          }}
        />
      </Suspense>
    );
  }

  // ── STAGE: VAULT TAKEOVER ─────────────────────────────────────────────────
  if (activeNode && isVaultId(activeNode.id)) {
    return (
      <>
        {!online && <div className="offline-banner" role="status">SIGNAL LOST — ARCHIVE CACHED LOCALLY</div>}
        <div className={`universe god-mode-mainframe ${stateClass}`} id="main-content">
          <div className="glitter-grain" />
          <div className="receded-logo">dp</div>
          {renderVault(activeNode.id)}
          {isMobile && (
            <BottomNav
              activeId={activeNode.id}
              onSelect={(id) => {
                setPendingVaultNode({ id });
                setActiveNode(null);
              }}
            />
          )}
        </div>
      </>
    );
  }

  // ── STAGE: D's GOD MODE CONSOLE ───────────────────────────────────────────
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
            <Viewscreen
              activeNode={activeNode}
              activeMoon={activeMoon}
              isBroadcasting={isBroadcasting}
              showWelcome={showWelcome}
              onPlanetClick={handleSpaceWindowClick}
            />
          </Suspense>
          <Suspense fallback={null}>
            <AnalogConsole
              activeNode={activeNode}
              onNodeSelect={handleNodeSelect}
              onNodeLongPress={handleNodeLongPress}
              onClaimNode={handleClaimNode}
              onBroadcast={handleBroadcast}
              onIntake={handleIntake}
              isBroadcasting={isBroadcasting}
              latentNodes={latentNodes}
              saturnMoons={SATURN_MOONS}
              onMoonSync={handleMoonSync}
              onPowerDown={handlePowerDown}
            />
          </Suspense>
        </motion.div>

        {isMobile && (
          <BottomNav
            activeId={activeNode?.id}
            onSelect={(id) => {
              setPendingVaultNode({ id });
              setActiveNode(null);
            }}
          />
        )}
      </div>
    </>
  );
}

export default App;
