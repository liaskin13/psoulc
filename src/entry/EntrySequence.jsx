import React, { useState, useEffect, useRef } from 'react';
import {
  ENTRY_CODE,
  BLACK_STAR_CODE,
  AMETHYST_CODE,
  MARS_CODE,
  LISTENER_CODE,
  SOLAR_FLARE_DURATION_MS,
  SESSION_KEY,
  SESSION_TTL_MS,
  GATE_LOCK_KEY,
  GATE_MAX_ATTEMPTS,
  GATE_LOCKOUT_MS,
  MEMBERS_KEY,
} from '../config';
import RequestAccessModal from './RequestAccessModal';
import SolarFlare from './SolarFlare';
import ArchitectFlare from './ArchitectFlare';
import AmethystFlare from './AmethystFlare';
import DPWallpaper from './DPWallpaper';
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

// ── Gate lock helpers ────────────────────────────────────────────────────
function readLock() {
  try { return JSON.parse(localStorage.getItem(GATE_LOCK_KEY)) || { count: 0, lockedUntil: 0 }; }
  catch (_) { return { count: 0, lockedUntil: 0 }; }
}
function writeLock(lock) {
  try { localStorage.setItem(GATE_LOCK_KEY, JSON.stringify(lock)); } catch (_) {}
}
function clearLock() {
  try { localStorage.removeItem(GATE_LOCK_KEY); } catch (_) {}
}
// Write enriched session — { owner, planet, tier, expires }
function writeSession(owner, planet = null, tier = 'LISTENER') {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ owner, planet, tier, expires: Date.now() + SESSION_TTL_MS }));
  } catch (_) {}
}
// Load dynamic member registry for code lookup at the gate
function loadMembersFromStorage() {
  try { return JSON.parse(localStorage.getItem(MEMBERS_KEY)) || []; } catch (_) { return []; }
}

// onIgnite(owner) — 'D' routes to Sun console, 'L' routes to Black Star console
function EntrySequence({ onIgnite }) {
  const [input, setInput]                   = useState('');
  const [showFlare, setShowFlare]           = useState(false);
  const [showArchFlare, setShowArchFlare]   = useState(false);
  const [showAmethystFlare, setShowAmethystFlare] = useState(false);
  const [owner, setOwner]                   = useState(null);
  const [shakeActive, setShakeActive]           = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const [requestModal, setRequestModal] = useState(null); // null | 'listen' | 'collaborate'
  const inputRef = useRef(null);

  // Lockout countdown ticker
  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const id = setInterval(() => {
      setLockoutRemaining(prev => {
        if (prev <= 1000) { clearInterval(id); return 0; }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [lockoutRemaining]);

  const triggerSunEntry = () => {
    // D — Solar Flare pulse at gate, then hand off to AstralFlyby in App
    setOwner('D');
    setShowFlare(true);
    setTimeout(() => {
      setShowFlare(false);
      onIgnite('D');
    }, SOLAR_FLARE_DURATION_MS);
  };

  const triggerArchitectEntry = () => {
    // L — Architect darkness flood at gate, then hand off to AstralFlyby in App
    setOwner('L');
    setShowArchFlare(true);
    setTimeout(() => onIgnite('L'), 800);
  };

  const triggerAmethystEntry = () => {
    setOwner('ANGI');
    setShowAmethystFlare(true);
    setTimeout(() => onIgnite('ANGI'), 900);
  };

  const triggerMarsEntry = () => {
    setOwner('MARS');
    setShowFlare(true);
    setTimeout(() => {
      setShowFlare(false);
      onIgnite('MARS');
    }, SOLAR_FLARE_DURATION_MS);
  };

  const triggerListenerEntry = () => {
    // Tier G — generic listener
    setOwner('LISTENER');
    setTimeout(() => onIgnite('LISTENER'), 600);
  };

  const triggerIgnition = (code) => {
    // Lockout check
    const lock = readLock();
    if (lock.lockedUntil > Date.now()) {
      setInput('');
      setLockoutRemaining(lock.lockedUntil - Date.now());
      return;
    }

    if (code === ENTRY_CODE) {
      clearLock();
      writeSession('D', null, 'A');
      triggerSunEntry();
    } else if (code === BLACK_STAR_CODE) {
      clearLock();
      writeSession('L', null, 'A');
      triggerArchitectEntry();
    } else if (code === AMETHYST_CODE) {
      clearLock();
      writeSession('ANGI', 'amethyst', 'B');
      triggerAmethystEntry();
    } else if (code === MARS_CODE) {
      clearLock();
      writeSession('MARS', 'mars', 'B');
      triggerMarsEntry();
    } else if (code === LISTENER_CODE) {
      clearLock();
      writeSession('LISTENER', null, 'G');
      triggerListenerEntry();
    } else {
      // Dynamic member lookup — check registry before failing
      const member = loadMembersFromStorage().find(m => m.code === code);
      if (member) {
        clearLock();
        writeSession(member.name, member.planet || null, member.tier || 'B');
        if (member.tier === 'C') {
          // Moon artist — brief flare then astral flyby to Saturn Atrium
          setOwner(member.name);
          setShowFlare(true);
          setTimeout(() => { setShowFlare(false); onIgnite(member.name); }, SOLAR_FLARE_DURATION_MS);
        } else if (member.planet === 'amethyst') {
          setOwner('ANGI');
          setShowAmethystFlare(true);
          setTimeout(() => onIgnite('ANGI'), 900);
        } else if (member.planet === 'mars') {
          setOwner('MARS');
          setShowFlare(true);
          setTimeout(() => { setShowFlare(false); onIgnite('MARS'); }, SOLAR_FLARE_DURATION_MS);
        } else {
          // B-tier member with or without planet → astral flyby
          setOwner('member');
          setTimeout(() => onIgnite('member'), 600);
        }
        return;
      }
      // Wrong code
      const newCount = lock.count + 1;
      const newLock = newCount >= GATE_MAX_ATTEMPTS
        ? { count: 0, lockedUntil: Date.now() + GATE_LOCKOUT_MS }
        : { count: newCount, lockedUntil: 0 };
      writeLock(newLock);
      if (newLock.lockedUntil) setLockoutRemaining(GATE_LOCKOUT_MS);
      setShakeActive(true);
      setTimeout(() => setShakeActive(false), 450);
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

  const isActive = showFlare || showArchFlare || showAmethystFlare;

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
        <div className={`entry-cluster ${shakeActive ? 'entry-shake' : ''}`}>
          <div className="entry-top-rail" aria-hidden="true" />

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

          {/* Lockout display or hint */}
          {lockoutRemaining > 0 ? (
            <div
              className="entry-hint entry-locked"
              role="timer"
              aria-live="polite"
              aria-label={`Access locked for ${Math.ceil(lockoutRemaining / 1000)} seconds`}
            >
              LOCKED · {Math.ceil(lockoutRemaining / 1000)}s
            </div>
          ) : (
            <div className="entry-hint">ENTER ACCESS CODE</div>
          )}

          {/* Access request links — below the hint */}
          <div className="entry-sublinks">
            <button
              className="entry-sublink"
              onClick={() => setRequestModal('listen')}
              type="button"
            >
              REQUEST LISTENER ACCESS
            </button>
            <span className="entry-sublink-divider">·</span>
            <button
              className="entry-sublink"
              onClick={() => setRequestModal('collaborate')}
              type="button"
            >
              COLLABORATE WITH THE COLLECTIVE
            </button>
          </div>
        </div>
      )}

      {/* Request Access / Membership Modal */}
      {requestModal && (
        <RequestAccessModal
          mode={requestModal}
          onClose={() => setRequestModal(null)}
        />
      )}

    </div>
  );
}

export default EntrySequence;
