import React, { useState } from 'react';
import { motion } from 'framer-motion';
import RecordShelf from '../components/RecordShelf';
import StuderTransportBar from '../components/StuderTransportBar';
import TuneModal from '../components/TuneModal';
import VaultWindow from '../components/VaultWindow';
import VoidStreakOverlay from '../components/VoidStreakOverlay';
import { useVaultVoid } from '../hooks/useVaultVoid';
import { useVaultFileCells } from '../hooks/useVaultFileCells';
import { MARS_TRACKS } from '../data/mars';
import { VOID_CHAKRA_COLORS, MEMBER_CHAKRA_COLORS } from '../config';
import { useSystem } from '../state/SystemContext';
import { canComment, canEdit } from '../utils/permissions';

// Mars rust palette — volcanic iron oxide
const RUST = { highlight: '#ff9966', base: '#c1440e', shadow: '#3a0a00', glow: 'rgba(193,68,14,0.7)' };

const TRACK_ITEMS = MARS_TRACKS.map(t => ({
  id: `track-${t.id}`, label: t.name,
  sublabel: `${t.bpm} BPM · ${t.frequency}`,
  metadata: t,
  createdBy: t.createdBy || 'JessB',
  chakraColor: MEMBER_CHAKRA_COLORS[t.createdBy] || MEMBER_CHAKRA_COLORS.JessB,
  ...RUST,
}));

const parseFrequency = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const m = value.match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 432;
  }
  return 432;
};

function MarsVault({ onVoid, onBack, onExitSystem, readOnly = false }) {
  const [pitchMultiplier, setPitchMultiplier]  = useState(1.0);
  const [tuneItem,        setTuneItem]         = useState(null);
  const { addComment, sessionMeta, getTuneOverride, saveTuneOverride } = useSystem();

  const initialTrackItems = TRACK_ITEMS.map((item) => {
    const override = getTuneOverride('mars', item.id);
    if (!override) return item;
    const bpm = override.bpm ?? item.metadata?.bpm ?? 98;
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
      voidColor: VOID_CHAKRA_COLORS.mars || '#c1440e',
      onVoid: (item) => {
        if (activeId === item.id) clearSelection();
        onVoid?.(item);
      },
    });

  const handleComment = (item, body) => addComment('mars', item.id, item.label, sessionMeta?.owner || 'member', body);
  const canAdmin = canEdit(sessionMeta, 'mars');

  const handleSelect = item => {
    selectCell(item);
  };

  const handleTuneSave = (updates) => {
    saveTuneOverride('mars', tuneItem.id, updates);
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
      className="vault-screen mars-vault"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.08, 0, 0.3, 1] }}
    >
      <div className="vault-header">
        <h1 className="vault-title">MARS</h1>
        <p className="vault-subtitle">JESS B · IRON FREQUENCY ARCHIVE</p>
      </div>

      <div className="vault-commands">
        <button className="god-btn" onClick={onBack}>SEAL VAULT</button>
        <button className="god-btn" onClick={onExitSystem}>EXIT SYSTEM</button>
        {!readOnly && (
          <>
            <button
              className="god-btn"
              onClick={() => { if (activeId) { const item = findCellById(activeId); if (item) setTuneItem(item); }}}
              disabled={!activeId}
              style={{ opacity: activeId ? 1 : 0.4 }}
            >
              TUNE
            </button>
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

      {!readOnly && tuneItem && (
        <TuneModal
          item={{ label: tuneItem.label, bpm: tuneItem.metadata?.bpm, frequency: parseInt(tuneItem.metadata?.frequency) || 432 }}
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
            <div className="shelf-section-label">IRON ARCHIVE</div>
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
            onPlay={()          => setTransport('play')}
            onStop={()          => setTransport('stop')}
            onRewind={()        => setTransport('rewind')}
            onFastForward={()   => setTransport('ff')}
            onPause={()         => setTransport('pause')}
            onRecord={()        => setTransport('record')}
            showAdminCommands={!readOnly}
            isAdmin={canAdmin}
            onAdminArm={()    => activeId && handleVoidButton(findCellById(activeId))}
            onAdminCommit={confirmArmedVoid}
            onAdminSeal={()   => { cancelArmedVoid(); setTransport('stop'); }}
            onAdminClear={clearSelection}
            onPitchChange={setPitchMultiplier}
          />
        </div>
      </div>

      {!readOnly && <VoidStreakOverlay {...voidProps} />}
    </motion.div>
  );
}

export default MarsVault;
