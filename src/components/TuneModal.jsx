import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import './TuneModal.css';

// ── TUNE MODAL — Nixie Tube Metadata Editor ────────────────────────────────
// Opened by the < TUNE > command inside any vault.
// Renders Nixie-tube styled sliders for BPM, frequency, and label editing.
// onSave(updates) — caller decides what to do with the new values.
// onClose()       — dismiss without saving.

function NixieDigits({ value }) {
  // Display a number as individual Nixie-tube digits
  const str = String(Math.round(value)).padStart(3, '0');
  return (
    <div className="nixie-digits">
      {str.split('').map((d, i) => (
        <span key={i} className="nixie-digit">{d}</span>
      ))}
    </div>
  );
}

function TuneModal({ item, onSave, onClose }) {
  const [label,     setLabel]     = useState(item?.label     || '');
  const [bpm,       setBpm]       = useState(item?.bpm       || 120);
  const [frequency, setFrequency] = useState(item?.frequency || 528);

  const handleSave = () => {
    onSave({ label, bpm: parseInt(bpm), frequency: parseInt(frequency) });
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="tune-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          className="tune-modal"
          initial={{ scale: 0.88, opacity: 0, y: 24 }}
          animate={{ scale: 1,    opacity: 1, y: 0  }}
          exit={{ scale: 0.88, opacity: 0, y: 24 }}
          transition={{ duration: 0.3, ease: [0.12, 0, 0.2, 1] }}
        >
          {/* Nixie phosphor header */}
          <div className="tune-modal-header">
            <span className="tune-modal-title">TUNE</span>
            <span className="tune-modal-sub">FREQUENCY EDITOR · NIXIE CALIBRATION</span>
          </div>

          {/* Label field */}
          <div className="tune-field">
            <label className="tune-field-label">TITLE</label>
            <input
              className="tune-label-input"
              value={label}
              onChange={e => setLabel(e.target.value)}
              maxLength={48}
              spellCheck={false}
            />
          </div>

          {/* BPM slider */}
          <div className="tune-field">
            <label className="tune-field-label">BPM</label>
            <div className="tune-slider-row">
              <NixieDigits value={bpm} />
              <input
                type="range"
                className="tune-slider"
                min="60" max="200" step="1"
                value={bpm}
                onChange={e => setBpm(e.target.value)}
              />
            </div>
          </div>

          {/* Hz slider */}
          <div className="tune-field">
            <label className="tune-field-label">FREQUENCY (Hz)</label>
            <div className="tune-slider-row">
              <NixieDigits value={frequency} />
              <input
                type="range"
                className="tune-slider"
                min="100" max="1000" step="1"
                value={frequency}
                onChange={e => setFrequency(e.target.value)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="tune-modal-actions">
            <button className="tune-btn tune-btn-cancel" onClick={onClose}>CANCEL</button>
            <button className="tune-btn tune-btn-save"   onClick={handleSave}>COMMIT</button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default TuneModal;
