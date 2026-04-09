import React from 'react';
import { motion } from 'framer-motion';

// Studer Transport Bar — 1974 A-807 style.
// Controls: REW / PLAY / STOP / FF / REC
// Active track is displayed in the amber phosphor readout above the controls.
function StuderTransportBar({
  onPlay, onStop, onRewind, onFastForward, onRecord,
  onPitchChange, pitchMultiplier,
  activeTrack,   // { label, sublabel } or null
  transportState // 'play' | 'stop' | 'rewind' | 'ff' | 'record' | null
}) {
  const buttons = [
    { id: 'rewind', symbol: '◀◀', label: 'REW',  action: onRewind },
    { id: 'play',   symbol: '▶',  label: 'PLAY', action: onPlay   },
    { id: 'stop',   symbol: '■',  label: 'STOP', action: onStop   },
    { id: 'ff',     symbol: '▶▶', label: 'FF',   action: onFastForward },
    { id: 'record', symbol: '●',  label: 'REC',  action: onRecord },
  ];

  return (
    <motion.div
      className="studer-transport"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 18 }}
    >
      {/* Amber phosphor track readout */}
      <div className={`transport-readout ${activeTrack ? 'loaded' : 'idle'}`}>
        {activeTrack ? (
          <>
            <span className="readout-arrow">▶</span>
            <span className="readout-title">{activeTrack.label}</span>
            {activeTrack.sublabel && (
              <span className="readout-meta">{activeTrack.sublabel}</span>
            )}
            {transportState && (
              <span className={`readout-state state-${transportState}`}>
                {transportState === 'record' ? '● REC' : transportState.toUpperCase()}
              </span>
            )}
          </>
        ) : (
          <span className="readout-idle">— NO SELECTION —</span>
        )}
      </div>

      {/* Chrome transport buttons */}
      <div className="transport-controls">
        {buttons.map(btn => (
          <button
            key={btn.id}
            className={`transport-btn btn-${btn.id} ${transportState === btn.id ? 'transport-active' : ''}`}
            onClick={btn.action}
            title={btn.label}
          >
            <span className="btn-symbol">{btn.symbol}</span>
            <span className="btn-label">{btn.label}</span>
          </button>
        ))}
      </div>

      {/* Master pitch varispeed */}
      <div className="pitch-control">
        <span className="pitch-label">VARISPEED</span>
        <input
          type="range"
          min="0.5" max="2.0" step="0.05"
          value={pitchMultiplier}
          onChange={e => onPitchChange(parseFloat(e.target.value))}
          className="pitch-slider"
        />
        <span className="pitch-value">{pitchMultiplier.toFixed(2)}×</span>
      </div>
    </motion.div>
  );
}

export default StuderTransportBar;
