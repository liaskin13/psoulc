import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './App.css';

import { useSystem } from './state/SystemContext';
import EntrySequence     from './entry/EntrySequence';
import IgnitionSequence  from './entry/IgnitionSequence';
import Viewscreen        from './console/Viewscreen';
import AnalogConsole     from './console/AnalogConsole';
import BlackStarConsole  from './black-star/BlackStarConsole';

import SaturnVault    from './saturn/SaturnVault';
import MercuryStream  from './mercury/MercuryStream';
import VenusArchive   from './venus/VenusArchive';
import EarthSafe      from './earth/EarthSafe';
import AmethystVault  from './amethyst/AmethystVault';

import PlanetApproach from './three/PlanetApproach';
import { SATURN_MOONS } from './data/saturn';
import { BROADCAST_DURATION_MS } from './config';

// ── CHAKRA FREQUENCY TONES ────────────────────────────────────────────────
const PLANET_TONES = {
  mercury:  480,  // transformation
  venus:    528,  // connecting relationships
  earth:    432,  // liberating guilt
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

const VAULT_IDS = new Set(['saturn', 'mercury', 'venus', 'earth', 'amethyst']);

// Stages:
//   'entry'           — code input portal
//   'ignition'        — Sun ignition sequence (D's 0528 path)
//   'console'         — D's God Mode Console (Sun)
//   'architect'       — L's Black Star Console (7677 path)
//   'amethyst-direct' — Angi's direct vault access (4096 path)

function App() {
  const { isProtected, setConsoleOwner, voidItem } = useSystem();

  const [stage, setStage]                       = useState('entry');
  const [activeNode, setActiveNode]             = useState(null);
  const [pendingVaultNode, setPendingVaultNode] = useState(null);
  const [activeMoon, setActiveMoon]             = useState(null);
  const [isBroadcasting, setIsBroadcasting]     = useState(false);
  const [showWelcome, setShowWelcome]           = useState(true);

  useEffect(() => {
    console.log('📍 APP STAGE:', stage);
  }, [stage]);

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

  // Entry dispatch — owner is 'D' (Sun), 'L' (Black Star), or 'ANGI' (Amethyst direct)
  const handleIgnite = (owner) => {
    setConsoleOwner(owner);
    if (owner === 'D') {
      setStage('ignition');
    } else if (owner === 'ANGI') {
      setStage('amethyst-direct');
    } else {
      setStage('architect');
    }
  };

  // Click-to-EXPLORE from 3D SpaceWindow raycasting
  const handleSpaceWindowClick = (planetId) => {
    setActiveMoon(null);
    setShowWelcome(false);
    setPendingVaultNode({ id: planetId });
    const tone = PLANET_TONES[planetId];
    if (tone) playChakraTone(tone);
  };

  const closeVault = () => setActiveNode(null);

  const handleNodeSelect = (node) => {
    setActiveMoon(null);
    setShowWelcome(false);
    if (VAULT_IDS.has(node.id)) {
      // Trigger 3D approach sequence before opening the vault
      setPendingVaultNode(node);
      // Play chakra tone for the planet
      const tone = PLANET_TONES[node.id];
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

  const handleVoid = (item, planet) => {
    voidItem(item, planet);
  };

  const renderVault = (id) => {
    switch (id) {
      case 'saturn':  return <SaturnVault  onVoid={(item) => handleVoid(item, 'saturn')}  onExplore={() => {}} onTune={() => {}} onBack={closeVault} />;
      case 'mercury': return <MercuryStream onBack={closeVault} />;
      case 'venus':   return <VenusArchive  onVoid={(item) => handleVoid(item, 'venus')}  onBack={closeVault} />;
      case 'earth':   return <EarthSafe     onVoid={(item) => handleVoid(item, 'earth')}  onBack={closeVault} />;
      case 'amethyst': return <AmethystVault onBack={closeVault} />;
      default:         return null;
    }
  };

  // ── STAGE: ENTRY ──────────────────────────────────────────────────────────
  if (stage === 'entry') {
    return <EntrySequence onIgnite={handleIgnite} />;
  }

  // ── STAGE: SUN IGNITION ───────────────────────────────────────────────────
  if (stage === 'ignition') {
    return <IgnitionSequence onComplete={() => setStage('console')} />;
  }

  // ── STAGE: BLACK STAR CONSOLE (L's Architect View) ────────────────────────
  if (stage === 'architect') {
    return <BlackStarConsole onExit={() => setStage('entry')} />;
  }

  // ── STAGE: AMETHYST DIRECT (Angi's 4096 path) ────────────────────────────
  if (stage === 'amethyst-direct') {
    return (
      <div className="universe god-mode-mainframe state-create">
        <div className="glitter-grain" />
        <div className="receded-logo">dp</div>
        <AmethystVault onBack={() => setStage('entry')} />
      </div>
    );
  }

  const stateClass = isProtected ? 'state-protected' : 'state-create';

  // ── STAGE: PLANET APPROACH — 3D flyby to vault entry ─────────────────────
  if (pendingVaultNode) {
    return (
      <PlanetApproach
        planetId={pendingVaultNode.id}
        onComplete={() => {
          setActiveNode(pendingVaultNode);
          setPendingVaultNode(null);
        }}
      />
    );
  }

  // ── STAGE: VAULT TAKEOVER ─────────────────────────────────────────────────
  if (activeNode && VAULT_IDS.has(activeNode.id)) {
    return (
      <div className={`universe god-mode-mainframe ${stateClass}`}>
        <div className="glitter-grain" />
        <div className="receded-logo">dp</div>
        {renderVault(activeNode.id)}
      </div>
    );
  }

  // ── STAGE: D's GOD MODE CONSOLE ───────────────────────────────────────────
  return (
    <div className={`universe god-mode-mainframe ${stateClass}`}>
      <div className="glitter-grain" />
      <div className="receded-logo">dp</div>

      <motion.div
        className="cockpit"
        initial={{ opacity: 0, scale: 1.06, filter: 'brightness(5) blur(6px)' }}
        animate={{ opacity: 1, scale: 1,    filter: 'brightness(1) blur(0px)' }}
        transition={{ duration: 2, ease: [0.08, 0, 0.3, 1] }}
      >
        <Viewscreen
          activeNode={activeNode}
          activeMoon={activeMoon}
          isBroadcasting={isBroadcasting}
          showWelcome={showWelcome}
          onPlanetClick={handleSpaceWindowClick}
        />
        <AnalogConsole
          activeNode={activeNode}
          onNodeSelect={handleNodeSelect}
          onNodeLongPress={handleNodeLongPress}
          onClaimNode={(node) => console.log('Claiming:', node.label)}
          onBroadcast={handleBroadcast}
          onIntake={() => console.log('Asset intake — stealth wealth mode')}
          isBroadcasting={isBroadcasting}
          saturnMoons={SATURN_MOONS}
          onMoonSync={handleMoonSync}
        />
      </motion.div>
    </div>
  );
}

export default App;
