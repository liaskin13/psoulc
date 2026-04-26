import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { findResidentByCode } from '../data/residentBlueprint';
import {
  SESSION_KEY,
  SESSION_TTL_MS,
  GATE_LOCK_KEY,
  GATE_MAX_ATTEMPTS,
  GATE_LOCKOUT_MS
} from '../config';
import DPWallpaper from './DPWallpaper';

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

/**
 * THE VELVET ROPE (PSC Entry Sequence)
 * Aesthetic: AKAI x FENDI Luxury Aperture
 */
function EntrySequence({ onIgnite }) {
  const [input, setInput] = useState('');
  const [isIgnited, setIsIgnited] = useState(false);
  const [resident, setResident] = useState(null);
  const [shakeActive, setShakeActive] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const id = setInterval(() => {
      setLockoutRemaining(prev => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [lockoutRemaining]);

  const triggerIgnition = (code) => {
    const lock = readLock();
    if (lock.lockedUntil > Date.now()) {
      setInput('');
      setLockoutRemaining(lock.lockedUntil - Date.now());
      return;
    }

    const res = findResidentByCode(code);
    if (res) {
      clearLock();
      setResident(res);
      setIsIgnited(true);

      // Write Sovereign Session
      const session = {
        owner: res.name,
        vault: res.vaultId,
        tier: res.tier,
        residentId: res.residentId,
        expires: Date.now() + SESSION_TTL_MS
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));

      // Quiet Opening Delay
      setTimeout(() => onIgnite(res.name, res.tier), 1200);
    } else {
      // Failed attempt logic
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

  const handleInputChange = (e) => {
    const val = e.target.value.toUpperCase();
    setInput(val);
    if (val.length >= 4) {
      // Check for exact matches in the registry (codes vary in length)
      const possibleMatch = findResidentByCode(val);
      if (possibleMatch) triggerIgnition(val);
    }
  };

  const focusInput = () => inputRef.current?.focus();

  const handleApertureKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      focusInput();
    }
  };

  return (
    <div
      className="entry-aperture"
      onClick={focusInput}
      onKeyDown={handleApertureKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Focus master key input"
    >
      <DPWallpaper opacity={isIgnited ? 0 : 1} />

      <div className="entry-maison-mark" aria-hidden="true">
        <span className="entry-maison-line">PLEASANT SOUL COLLECTIVE</span>
        <span className="entry-maison-sub">EST. SOVEREIGN ARCHIVE</span>
      </div>

      <input
        ref={inputRef}
        type="text"
        maxLength={8}
        inputMode="numeric"
        autoComplete="one-time-code"
        value={input}
        onChange={handleInputChange}
        className="entry-hidden-input"
        autoFocus
        aria-label="Master key input"
        aria-describedby={lockoutRemaining > 0 ? 'aperture-lockout-status' : undefined}
      />

      {/* The Heavy Silence — Background split animation */}
      <motion.div 
        className="aperture-gate-upper"
        animate={isIgnited ? { y: '-100%' } : { y: 0 }}
        transition={{ duration: 1.2, ease: [0.8, 0, 0.2, 1] }}
      />
      <motion.div 
        className="aperture-gate-lower"
        animate={isIgnited ? { y: '100%' } : { y: 0 }}
        transition={{ duration: 1.2, ease: [0.8, 0, 0.2, 1] }}
      />

      {/* The Velvet Rope — Copper input line */}
      <AnimatePresence>
        {!isIgnited && (
          <motion.div 
            className={`aperture-controls ${shakeActive ? 'entry-shake' : ''}`}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
          >
            <div className="aperture-label">ENTER MASTER KEY</div>
            <div className="aperture-input-wrapper">
              <div className="aperture-line-left" />
              <div className="aperture-code-grid">
                {Array.from({ length: 4 }, (_, i) => (
                  <div
                    key={i}
                    className={[
                      'aperture-code-cell',
                      input[i] ? 'aperture-cell-filled' : '',
                      !input[i] && i === input.length ? 'aperture-cell-active' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    {input[i] || ''}
                  </div>
                ))}
              </div>
              <div className="aperture-line-right" />
            </div>
            {lockoutRemaining > 0 && (
              <div
                id="aperture-lockout-status"
                className="aperture-lockout"
                role="status"
                aria-live="polite"
              >
                LOCKED {Math.ceil(lockoutRemaining / 1000)}s
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default EntrySequence;

