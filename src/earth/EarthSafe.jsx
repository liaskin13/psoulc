import React, { useState } from 'react';
import { motion } from 'framer-motion';
import RecordShelf from '../components/RecordShelf';
import StuderTransportBar from '../components/StuderTransportBar';
import TuneModal from '../components/TuneModal';
import VaultWindow from '../components/VaultWindow';
import VoidStreakOverlay from '../components/VoidStreakOverlay';
import { useVaultVoid } from '../hooks/useVaultVoid';
import { useVaultFileCells } from '../hooks/useVaultFileCells';
import { EARTH_DOCUMENTS } from '../data/earth';
import { VOID_CHAKRA_COLORS, MEMBER_CHAKRA_COLORS } from '../config';
import { useSystem } from '../state/SystemContext';
import { canComment, canEdit } from '../utils/permissions';

// Earth spine palette — color by classification level.
const CLASS_PALETTE = {
  'top-secret':   { highlight: '#ff9090', base: '#cc2020', shadow: '#3a0000', glow: 'rgba(220,40,40,0.75)'  },
  'confidential': { highlight: '#ffcc88', base: '#c87820', shadow: '#3a2000', glow: 'rgba(200,130,30,0.75)' },
  'classified':   { highlight: '#88cc88', base: '#228840', shadow: '#001800', glow: 'rgba(40,160,60,0.75)'  },
};

const DOC_ITEMS = EARTH_DOCUMENTS.map(d => ({
  id:       `doc-${d.id}`,
  label:    d.title,
  sublabel: `${d.year} · ${d.classification.replace('-', ' ').toUpperCase()}`,
  metadata: d,
  createdBy: d.createdBy || 'D',
  chakraColor: MEMBER_CHAKRA_COLORS[d.createdBy] || MEMBER_CHAKRA_COLORS.D,
  ...(CLASS_PALETTE[d.classification] || CLASS_PALETTE.classified),
}));

const parseFrequency = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const m = value.match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 528;
  }
  return 528;
};

function EarthSafe({ onBack, onExitSystem, onVoid, readOnly = false }) {
  const [pitchMultiplier, setPitchMultiplier] = useState(1.0);
  const [tuneItem,        setTuneItem]        = useState(null);
  const { addComment, sessionMeta, getTuneOverride, saveTuneOverride } = useSystem();

  const initialDocItems = DOC_ITEMS.map((item) => {
    const override = getTuneOverride('earth', item.id);
    if (!override) return item;
    const bpm = override.bpm ?? item.metadata?.bpm ?? 120;
    const frequency = override.frequency ?? parseFrequency(item.metadata?.frequency);
    return {
      ...item,
      label: override.label ?? item.label,
      metadata: { ...item.metadata, bpm, frequency: `${frequency}Hz` },
    };
  });

  const {
    cells: docItems,
    activeId,
    activeTrack,
    transportState,
    selectCell,
    findCellById,
    updateCell,
    removeCell,
    setTransport,
  } = useVaultFileCells(initialDocItems);

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
      voidColor: VOID_CHAKRA_COLORS.earth,
      onVoid: (item) => {
        removeCell(item.id);
        onVoid?.(item);
      },
    });

  const handleComment = (item, body) => addComment('earth', item.id, item.label, sessionMeta?.owner || 'member', body);
  const handleVoiceComment = (item, audioData) => addComment('earth', item.id, item.label, sessionMeta?.owner || 'member', null, audioData);
  const canAdmin = canEdit(sessionMeta, 'earth');

  const handleSelect = item => {
    selectCell(item);
  };

  const handleTune = () => {
    if (!activeId) return;
    const item = findCellById(activeId);
    if (item) setTuneItem(item);
  };

  const handleTuneSave = (updates) => {
    saveTuneOverride('earth', tuneItem.id, updates);
    updateCell(tuneItem.id, (cell) => ({
      ...cell,
      label: updates.label,
      metadata: { ...cell.metadata, bpm: updates.bpm, frequency: `${updates.frequency}Hz` },
    }));
    setTuneItem(null);
  };

  return (
    <motion.div
      className="vault-screen earth-safe"
      style={{ '--vault-owner-glow': 'rgba(139,0,0,0.09)' }}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.08, 0, 0.3, 1] }}
    >
      <div className="vault-header">
        <h1 className="vault-title">SONIC ARCHITECTURE</h1>
        <p className="vault-subtitle">PROPOSALS · EYES ONLY</p>
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
            <button className="god-btn">SEAL</button>
          </>
        )}
      </div>

      {tuneItem && (
        <TuneModal
          item={{ label: tuneItem.label, bpm: 120, frequency: 528 }}
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
            activeTrack={activeTrack}
          />
        </div>

        <div className="vault-library-band">
          <div className="shelf-section">
            <div className="shelf-section-label">CLASSIFIED FILES</div>
            <RecordShelf
              items={docItems}
              activeId={activeId}
              onSelect={handleSelect}
              onVoid={readOnly ? undefined : handleShelfVoid}
              onComment={canComment(sessionMeta) ? handleComment : undefined}
              onVoiceComment={canComment(sessionMeta) ? handleVoiceComment : undefined}
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
        </div>
      </div>

      {!readOnly && <VoidStreakOverlay {...voidProps} />}
    </motion.div>
  );
}

export default EarthSafe;
