import React from 'react';
import { motion } from 'framer-motion';
import StrobeVinylCanvas from './StrobeVinylCanvas';

// Studer Transport Bar — 1974 A-807 style.
// Transport: REW / PLAY / STOP / PAUSE / FF
// Special: REC = voice-note transmission capture (arms recording on selected file).
// Admin row (optional): ARM / COMMIT / SEAL / CLEAR — role-gated.
function StuderTransportBar({
  onPlay, onStop, onRewind, onFastForward, onPause,
  onRecord,
  onPitchChange, pitchMultiplier = 1.0,
  activeTrack,
  transportState,
  showAdminCommands = false,
  isAdmin = false,
  onAdminArm,
  onAdminCommit,
  onAdminSeal,
  onAdminClear,
}) {
  // Extract BPM from sublabel "XX BPM · ..." if present
  const activeBpm = (() => {
    if (!activeTrack?.sublabel) return 98;
    const match = activeTrack.sublabel.match(/(\d+)\s*BPM/i);
    return match ? parseInt(match[1], 10) : 98;
  })();

  const handlePlay = () => { onPlay?.(); };
  const handleStop = () => { onStop?.(); };
  const handleRewind = () => { onRewind?.(); };
  const handleFastForward = () => { onFastForward?.(); };

  const handlePause = () => {
    onPause?.();
  };

  const handleRecord = () => {
    onRecord?.();
  };

  const handlePitchChange = (val) => { onPitchChange?.(val); };

  const transportButtons = [
    { id: 'rewind', symbol: '◀◀', label: 'REW',   action: handleRewind      },
    { id: 'play',   symbol: '▶',  label: 'PLAY',  action: handlePlay        },
    { id: 'stop',   symbol: '■',  label: 'STOP',  action: handleStop        },
    { id: 'pause',  symbol: '▮▮', label: 'PAUSE', action: handlePause       },
    { id: 'ff',     symbol: '▶▶', label: 'FF',    action: handleFastForward },
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
            {/* Soul-chakra vinyl disc — spins at BPM, tinted by authorship color */}
            <StrobeVinylCanvas
              bpm={activeBpm}
              pitchMultiplier={pitchMultiplier}
              size={52}
              chakraColor={activeTrack.chakraColor || null}
            />
            <div className="readout-text">
              <div className="readout-track-line">
                <span className="readout-arrow">▶</span>
                <span className="readout-title">{activeTrack.label}</span>
              </div>
              {activeTrack.sublabel && (
                <span className="readout-meta">{activeTrack.sublabel}</span>
              )}
              {transportState && (
                <span className={`readout-state state-${transportState}`}>
                  {transportState === 'pause'  ? '▮▮ PAUSE'
                   : transportState === 'record' ? '● VOICE NOTE ARMED'
                   : transportState.toUpperCase()}
                </span>
              )}
            </div>
          </>
        ) : (
          <span className="readout-idle">— NO SELECTION —</span>
        )}
      </div>

      {/* Chrome transport buttons */}
      <div className="transport-controls">
        {transportButtons.map(btn => (
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

        {/* REC — voice-note transmissions: arms recording on selected file */}
        <button
          className={`transport-btn btn-record voice-rec-btn ${transportState === 'record' ? 'transport-active' : ''}`}
          onClick={handleRecord}
          disabled={!activeTrack}
          title="Voice Transmission — record a note onto this file"
          aria-label="Arm voice note recording"
        >
          <span className="btn-symbol">●</span>
          <span className="btn-label">REC</span>
        </button>
      </div>

      {/* Admin command row — role-gated, only when showAdminCommands=true */}
      {showAdminCommands && (
        <div className="transport-admin" role="group" aria-label="Admin commands">
          <button className="transport-admin-btn" onClick={onAdminArm}    disabled={!isAdmin || !activeTrack} title="Arm void on selected file">ARM</button>
          <button className="transport-admin-btn" onClick={onAdminCommit} disabled={!isAdmin}               title="Commit armed void">COMMIT</button>
          <button className="transport-admin-btn" onClick={onAdminSeal}   disabled={!isAdmin}               title="Seal and cancel pending actions">SEAL</button>
          <button className="transport-admin-btn" onClick={onAdminClear}  disabled={!isAdmin}               title="Clear selection and reset">CLEAR</button>
        </div>
      )}

      {/* Master pitch varispeed */}
      <div className="pitch-control">
        <span className="pitch-label">VARISPEED</span>
        <input
          type="range"
          min="0.5" max="2.0" step="0.05"
          value={pitchMultiplier}
          onChange={e => handlePitchChange(parseFloat(e.target.value))}
          className="pitch-slider"
        />
        <span className="pitch-value">{pitchMultiplier.toFixed(2)}×</span>
      </div>
    </motion.div>
  );
}

export default StuderTransportBar;
