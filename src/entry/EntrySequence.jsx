import React, { useState, useEffect, useRef } from 'react';
import {
  ENTRY_CODE,
  BLACK_STAR_CODE,
  AMETHYST_CODE,
  SOLAR_FLARE_DURATION_MS,
} from '../config';
import SolarFlare from './SolarFlare';
import ArchitectFlare from './ArchitectFlare';
import AmethystFlare from './AmethystFlare';
import DPWallpaper from './DPWallpaper';
import BinaryFlyby from '../three/BinaryFlyby';
import WarpDrive from '../three/WarpDrive';

// Six vault planets fly outward as the binary cores claim the center.
const W = typeof window !== 'undefined' ? window.innerWidth  : 1200;
const H = typeof window !== 'undefined' ? window.innerHeight : 800;

const SLINGSHOT_PLANETS = [
  { id: 'venus',    label: 'VENUS',    color: '#ffb7b7', tx: -W * 0.42, ty: -H * 0.32 },
  { id: 'earth',    label: 'EARTH',    color: '#87ceeb', tx: 0,         ty: -H * 0.44 },
  { id: 'saturn',   label: 'SATURN',   color: '#c5a059', tx:  W * 0.42, ty: -H * 0.32 },
  { id: 'amethyst', label: 'AMETHYST', color: '#9d65c9', tx:  W * 0.42, ty:  H * 0.32 },
  { id: 'mercury',  label: 'MERCURY',  color: '#a0c4ff', tx: 0,         ty:  H * 0.44 },
  { id: 'px09',     label: 'PX-09',    color: '#555',    tx: -W * 0.42, ty:  H * 0.32 },
];

// onIgnite(owner) — 'D' routes to Sun console, 'L' routes to Black Star console
function EntrySequence({ onIgnite }) {
  const [input, setInput]                   = useState('');
  const [showFlare, setShowFlare]           = useState(false);
  const [showArchFlare, setShowArchFlare]   = useState(false);
  const [showAmethystFlare, setShowAmethystFlare] = useState(false);
  const [showFlyby, setShowFlyby]           = useState(false);
  const [owner, setOwner]                   = useState(null);
  const inputRef = useRef(null);

  const triggerSunEntry = () => {
    // D's console — Solar Flare white-out → 3D binary flyby → ignition
    setOwner('D');
    setShowFlare(true);
    setTimeout(() => {
      setShowFlare(false);
      setShowFlyby(true);
      // onIgnite('D') is called by BinaryFlyby's onComplete
    }, SOLAR_FLARE_DURATION_MS);
  };

  const triggerArchitectEntry = () => {
    // L's console — Architect Flare darkness → implosion → Black Star console
    setOwner('L');
    setShowArchFlare(true);
    setTimeout(() => {
      onIgnite('L');
    }, SOLAR_FLARE_DURATION_MS + 200);
  };

  const triggerAmethystEntry = () => {
    // Angi's vault — crystal bloom → direct Amethyst vault
    setOwner('ANGI');
    setShowAmethystFlare(true);
    // AmethystFlare duration matches its animation (0.7s) + buffer
    setTimeout(() => {
      onIgnite('ANGI');
    }, 900);
  };

  const triggerIgnition = (code) => {
    console.log('🔐 Code entered:', code, 'Expected:', ENTRY_CODE, BLACK_STAR_CODE, AMETHYST_CODE);
    if (code === ENTRY_CODE) {
      console.log('✓ SUN ACCESS GRANTED');
      triggerSunEntry();
    } else if (code === BLACK_STAR_CODE) {
      console.log('✓ ARCHITECT ACCESS GRANTED');
      triggerArchitectEntry();
    } else if (code === AMETHYST_CODE) {
      console.log('✓ AMETHYST ACCESS GRANTED');
      triggerAmethystEntry();
    } else {
      console.log('✗ INVALID CODE');
      setInput('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && input.length === 4) {
      e.preventDefault();
      triggerIgnition(input);
    } else if (e.key.match(/[0-9]/) && input.length < 4) {
      e.preventDefault();
      setInput(prev => {
        const next = prev + e.key;
        if (next.length === 4) triggerIgnition(next);
        return next;
      });
    }
  };

  // Mobile: capture numeric input from the hidden input element
  const handleInputChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setInput(val);
    if (val.length === 4) triggerIgnition(val);
  };

  useEffect(() => {
    const tap = () => inputRef.current?.focus();
    document.addEventListener('touchstart', tap, { once: true });
    return () => document.removeEventListener('touchstart', tap);
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [input]);

  const isActive = showFlare || showFlyby || showArchFlare || showAmethystFlare;

  return (
    <div className="entry-sequence" onClick={() => inputRef.current?.focus()}>
      {/* Cinematic Warp Drive background */}
      <WarpDrive />

      {/* Hidden numeric input — surfaces iOS/Android numeric keyboard on tap */}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={4}
        value={input}
        onChange={handleInputChange}
        className="entry-hidden-input"
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
        aria-hidden="true"
      />

      {/* DP Monogram Wallpaper — Comfortaa canvas, dissolves on code entry */}
      <DPWallpaper opacity={isActive ? 0 : 1} />

      {/* Sun entry — Solar Flare white-out bridge */}
      {showFlare && <SolarFlare />}

      {/* Black Star entry — Architect Flare darkness flood */}
      {showArchFlare && <ArchitectFlare />}

      {/* Amethyst entry — crystal violet bloom */}
      {showAmethystFlare && <AmethystFlare />}

      {/* Phase 1 — Singularity input */}
      {!isActive && (
        <div className="entry-cluster">
          {/* Amber singularity dot — gravitational anchor */}
          <div className="singularity-point" />

          {/* 4-digit PIN display — each digit in its own Nixie cell */}
          <div className="entry-digit-row">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={`entry-digit-cell ${i < input.length ? 'filled' : ''}`}>
                <span className="entry-digit-char">
                  {i < input.length ? '●' : '·'}
                </span>
              </div>
            ))}
          </div>

          {/* Subtle hint */}
          <div className="entry-hint">ENTER ACCESS CODE</div>
        </div>
      )}

      {/* Phase 2 — 3D Binary Slingshot (Sun entry only) */}
      {showFlyby && (
        <BinaryFlyby onComplete={() => onIgnite('D')} />
      )}
    </div>
  );
}

export default EntrySequence;
