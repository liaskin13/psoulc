import React, { useState } from 'react';
import { motion } from 'framer-motion';
import RecordShelf from '../components/RecordShelf';
import StuderTransportBar from '../components/StuderTransportBar';
import TuneModal from '../components/TuneModal';
import VaultWindow from '../components/VaultWindow';
import VoidStreakOverlay from '../components/VoidStreakOverlay';
import { useVaultVoid } from '../hooks/useVaultVoid';
import { useVaultFileCells } from '../hooks/useVaultFileCells';
import { SATURN_TRACKS } from '../data/saturn';
import { VOID_CHAKRA_COLORS, MEMBER_CHAKRA_COLORS, D_CHAKRA_COLOR } from '../config';
import { useSystem } from '../state/SystemContext';
import { canComment, canEdit } from '../utils/permissions';

// Saturn spine palette — metallic gold, warm light from the left (Sun).
const GOLD = { highlight: '#fff0b0', base: '#c89030', shadow: '#3a1e00', glow: 'rgba(220,160,40,0.7)' };

const TRACK_ITEMS = SATURN_TRACKS.map(t => ({
  id: `track-${t.id}`, label: t.name,
  sublabel: `${t.bpm} BPM · ${t.frequency}`,
  metadata: t,
  createdBy: t.createdBy || 'D',
  chakraColor: MEMBER_CHAKRA_COLORS[t.createdBy] || MEMBER_CHAKRA_COLORS.D,
  ...GOLD,
}));

const parseFrequency = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const m = value.match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 528;
  }
  return 528;
};

function SaturnVault({ onVoid, onBack, onExitSystem, readOnly = false }) {
  const [pitchMultiplier, setPitchMultiplier] = useState(1.0);
  const [voidLog,         setVoidLog]    = useState([]);
  const [tuneItem,        setTuneItem]   = useState(null);
  const { addComment, sessionMeta, getTuneOverride, saveTuneOverride } = useSystem();

  const initialTrackItems = TRACK_ITEMS.map((item) => {
    const override = getTuneOverride('saturn', item.id);
    if (!override) return item;
    const bpm = override.bpm ?? item.metadata?.bpm ?? 120;
    const frequency = override.frequency ?? parseFrequency(item.metadata?.frequency);
    return {
      ...item,
      label: override.label ?? item.label,
      sublabel: `${bpm} BPM · ${frequency}Hz`,
      metadata: { ...item.metadata, bpm, frequency: `${frequency}Hz` },
    };
  });

  const {
    cells: trackItems,
    activeId,
    activeTrack,
    transportState,
    selectCell,
    findCellById,
    updateCell,
    clearSelection,
    setTransport,
  } = useVaultFileCells(initialTrackItems);

  const {
    vaultWindowRef,
    voidProps,
    inverseBloom,
    isVoidArmed,
    armedVoidLabel,
    cancelArmedVoid,
    confirmArmedVoid,
    handleShelfVoid,
    handleVoidButton,
  } =
    useVaultVoid({
      voidColor: VOID_CHAKRA_COLORS.saturn,
      onVoid: (item) => {
        setVoidLog(prev => [...prev, item]);
        if (activeId === item.id) clearSelection();
        onVoid?.(item);
      },
    });

  const handleComment = (item, body) => addComment('saturn', item.id, item.label, sessionMeta?.owner || 'member', body);
  const canAdmin = canEdit(sessionMeta, 'saturn');

  const handleSelect = item => {
    selectCell(item);
  };

  const handleTune = () => {
    if (!activeId) return;
    const item = findCellById(activeId);
    if (item) setTuneItem(item);
  };

  const handleTuneSave = (updates) => {
    saveTuneOverride('saturn', tuneItem.id, updates);
    updateCell(tuneItem.id, (cell) => ({
      ...cell,
      label: updates.label,
      sublabel: `${updates.bpm} BPM · ${updates.frequency}Hz`,
      metadata: { ...cell.metadata, bpm: updates.bpm, frequency: `${updates.frequency}Hz` },
    }));
    setTuneItem(null);
  };

  return (
    <motion.div
      className="vault-screen saturn-vault"
      style={{ '--vault-owner-glow': `${D_CHAKRA_COLOR}1a` }}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.08, 0, 0.3, 1] }}
    >
      <div className="vault-header">
        <h1 className="vault-title">SATURN</h1>
        <p className="vault-subtitle">ORIGINAL MUSIC · BRUSHED STEEL ARCHIVE</p>
      </div>

      <div className="vault-commands">
        <button className="god-btn" onClick={onBack}>SEAL VAULT</button>
        <button className="god-btn" onClick={onExitSystem}>EXIT SYSTEM</button>
        {!readOnly && (
          <>
            <button className="god-btn" onClick={handleTune} disabled={!activeId} style={{ opacity: activeId ? 1 : 0.4 }}>TUNE</button>
            <button
              className="god-btn"
              onClick={() => activeId && handleVoidButton(findCellById(activeId))}
              disabled={!activeId}
              style={{ opacity: activeId ? 1 : 0.4 }}
            >
              VOID
            </button>
          </>
        )}
      </div>

      {tuneItem && (
        <TuneModal
          item={{ label: tuneItem.label, bpm: tuneItem.metadata?.bpm, frequency: parseInt(tuneItem.metadata?.frequency) || 528 }}
          onSave={handleTuneSave}
          onClose={() => setTuneItem(null)}
        />
      )}

      <div className="vault-main-grid">
        <div className="vault-top-band">
          <VaultWindow
            ref={vaultWindowRef}
            inverseBloom={inverseBloom}
            voidArmed={isVoidArmed}
            armedLabel={armedVoidLabel}
            onCancelVoid={cancelArmedVoid}
            onConfirmVoid={confirmArmedVoid}
          />
        </div>

        <div className="vault-library-band">
          <div className="shelf-section">
            <div className="shelf-section-label">MASTERS</div>
            <RecordShelf
              items={trackItems}
              activeId={activeId}
              onSelect={handleSelect}
              onVoid={readOnly ? undefined : handleShelfVoid}
              onComment={canComment(sessionMeta) ? handleComment : undefined}
            />
          </div>

          <StuderTransportBar
            activeTrack={activeTrack}
            transportState={transportState}
            pitchMultiplier={pitchMultiplier}
            onPlay={()   => setTransport('play')}
            onStop={()   => setTransport('stop')}
            onRewind={()  => setTransport('rewind')}
            onFastForward={() => setTransport('ff')}
            onPause={()  => setTransport('pause')}
            onRecord={()  => setTransport('record')}
            showAdminCommands={!readOnly}
            isAdmin={canAdmin}
            onAdminArm={()    => activeId && handleVoidButton(findCellById(activeId))}
            onAdminCommit={confirmArmedVoid}
            onAdminSeal={()   => { cancelArmedVoid(); setTransport('stop'); }}
            onAdminClear={clearSelection}
            onPitchChange={setPitchMultiplier}
          />

          {voidLog.length > 0 && (
            <div className="void-log">
              {voidLog.map((item, i) => (
                <div key={i} className="voided-item">
                  <span className="void-icon">●</span> {item.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {!readOnly && <VoidStreakOverlay {...voidProps} />}
    </motion.div>
  );
}

export default SaturnVault;
