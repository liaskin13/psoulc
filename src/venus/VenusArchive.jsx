import React, { useState } from 'react';
import { motion } from 'framer-motion';
import RecordShelf from '../components/RecordShelf';
import StuderTransportBar from '../components/StuderTransportBar';
import TuneModal from '../components/TuneModal';
import VaultWindow from '../components/VaultWindow';
import VoidStreakOverlay from '../components/VoidStreakOverlay';
import { useVaultVoid } from '../hooks/useVaultVoid';
import { useVaultFileCells } from '../hooks/useVaultFileCells';
import { VENUS_MIXES } from '../data/venus';
import { VOID_CHAKRA_COLORS, MEMBER_CHAKRA_COLORS, D_CHAKRA_COLOR } from '../config';
import { useSystem } from '../state/SystemContext';
import { canComment, canEdit } from '../utils/permissions';

// Venus spine palette — dusty rose, warm light from the left.
const ROSE = { highlight: '#ffd8d8', base: '#b06060', shadow: '#4a0a0a', glow: 'rgba(200,100,100,0.7)' };

const MIX_ITEMS = VENUS_MIXES.map(m => ({
  id:       `mix-${m.id}`,
  label:    m.title,
  sublabel: `${m.duration} · ${m.frequency} · ${m.date}`,
  metadata: m,
  createdBy: m.createdBy || 'D',
  chakraColor: MEMBER_CHAKRA_COLORS[m.createdBy] || MEMBER_CHAKRA_COLORS.D,
  ...ROSE,
}));

const parseFrequency = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const m = value.match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 528;
  }
  return 528;
};

function VenusArchive({ onBack, onExitSystem, onVoid, readOnly = false }) {
  const [pitchMultiplier, setPitchMultiplier] = useState(1.0);
  const [tuneItem,        setTuneItem]        = useState(null);
  const { addComment, sessionMeta, getTuneOverride, saveTuneOverride } = useSystem();

  const initialMixItems = MIX_ITEMS.map((item) => {
    const override = getTuneOverride('venus', item.id);
    if (!override) return item;
    const bpm = override.bpm ?? item.metadata?.bpm ?? 120;
    const frequency = override.frequency ?? parseFrequency(item.metadata?.frequency);
    return {
      ...item,
      label: override.label ?? item.label,
      sublabel: `${item.metadata?.duration || ''} · ${frequency}Hz · ${item.metadata?.date || ''}`,
      metadata: { ...item.metadata, bpm, frequency: `${frequency}Hz` },
    };
  });

  const {
    cells: mixItems,
    activeId,
    activeTrack,
    transportState,
    selectCell,
    findCellById,
    updateCell,
    removeCell,
    clearSelection,
    setTransport,
  } = useVaultFileCells(initialMixItems);

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
      voidColor: VOID_CHAKRA_COLORS.venus,
      onVoid: (item) => {
        removeCell(item.id);
        onVoid?.(item);
      },
    });

  const handleComment = (item, body) => addComment('venus', item.id, item.label, sessionMeta?.owner || 'member', body);
  const handleVoiceComment = (item, audioData) => addComment('venus', item.id, item.label, sessionMeta?.owner || 'member', null, audioData);
  const canAdmin = canEdit(sessionMeta, 'venus');

  const handleSelect = item => {
    selectCell(item);
  };

  const handleTune = () => {
    if (!activeId) return;
    const item = findCellById(activeId);
    if (item) setTuneItem(item);
  };

  const handleTuneSave = (updates) => {
    saveTuneOverride('venus', tuneItem.id, updates);
    updateCell(tuneItem.id, (cell) => ({
      ...cell,
      label: updates.label,
      sublabel: `${cell.metadata?.duration || ''} · ${updates.frequency}Hz · ${cell.metadata?.date || ''}`,
      metadata: { ...cell.metadata, bpm: updates.bpm, frequency: `${updates.frequency}Hz` },
    }));
    setTuneItem(null);
  };

  return (
    <motion.div
      className="vault-screen venus-archive"
      style={{ '--vault-owner-glow': `${D_CHAKRA_COLOR}1a` }}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.08, 0, 0.3, 1] }}
    >
      <div className="vault-header">
        <h1 className="vault-title">VENUS</h1>
        <p className="vault-subtitle">CURATED MIXES · 120-MINUTE DEEP STORAGE</p>
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
          item={{ label: tuneItem.label, bpm: tuneItem.metadata?.bpm || 120, frequency: tuneItem.metadata?.frequency || 528 }}
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
            <div className="shelf-section-label">ARCHIVES</div>
            <RecordShelf
              items={mixItems}
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

export default VenusArchive;
