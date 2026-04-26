import React, { useState } from 'react';
import { motion } from 'framer-motion';
import RecordShelf from '../components/RecordShelf';
import StuderTransportBar from '../components/StuderTransportBar';
import TuneModal from '../components/TuneModal';
import VaultWindow from '../components/VaultWindow';
import VoidStreakOverlay from '../components/VoidStreakOverlay';
import { useVaultVoid } from '../hooks/useVaultVoid';
import { useVaultFileCells } from '../hooks/useVaultFileCells';
import { AMETHYST_BOWLS, AMETHYST_SESSIONS } from '../data/amethyst';
import { VOID_CHAKRA_COLORS } from '../config';
import { useSystem } from '../state/SystemContext';
import { canComment, canEdit } from '../utils/permissions';

// Amethyst spine palette — deep crystal indigo, violet glow.
const CRYSTAL = { highlight: '#e8d5ff', base: '#6f3f9c', shadow: '#1b0728', glow: 'rgba(137,79,193,0.7)' };

// Map bowls and sessions into unified file-cell items.
// Bowls: chakra frequency tone reference cells.
// Sessions: recorded healing sessions.
const BOWL_ITEMS = AMETHYST_BOWLS.map(b => ({
  id:         `bowl-${b.id}`,
  label:      b.label,
  sublabel:   `${b.frequency}Hz · ${b.note}`,
  metadata:   { bpm: null, frequency: `${b.frequency}Hz`, chakra: b.chakra, note: b.note },
  createdBy:  'Angi',
  chakraColor: b.color,
  highlight:  b.color,
  base:       '#4a1f78',
  shadow:     '#0e041a',
  glow:       b.glow,
}));

const SESSION_ITEMS = AMETHYST_SESSIONS.map(s => ({
  id:         `session-${s.id}`,
  label:      s.label,
  sublabel:   `${s.frequency}Hz · ${s.sublabel} · ${s.date}`,
  metadata:   { bpm: null, frequency: `${s.frequency}Hz`, duration: s.sublabel, date: s.date },
  createdBy:  s.createdBy || 'Angi',
  chakraColor: VOID_CHAKRA_COLORS.amethyst,
  ...CRYSTAL,
}));

const ALL_ITEMS = [...BOWL_ITEMS, ...SESSION_ITEMS];

const parseFrequency = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const m = value.match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 528;
  }
  return 528;
};

function AmethystVault({ onBack, onExitSystem, onVoid, readOnly = false }) {
  const [pitchMultiplier, setPitchMultiplier] = useState(1.0);
  const [tuneItem,        setTuneItem]        = useState(null);
  const { addComment, sessionMeta, getTuneOverride, saveTuneOverride } = useSystem();

  const initialItems = ALL_ITEMS.map((item) => {
    const override = getTuneOverride('amethyst', item.id);
    if (!override) return item;
    const freq = override.frequency ?? parseFrequency(item.metadata?.frequency);
    return {
      ...item,
      label: override.label ?? item.label,
      sublabel: `${freq}Hz · ${item.metadata?.duration || item.metadata?.note || ''}`,
      metadata: { ...item.metadata, frequency: `${freq}Hz` },
    };
  });

  const {
    cells,
    activeId,
    activeTrack,
    transportState,
    selectCell,
    findCellById,
    updateCell,
    removeCell,
    clearSelection,
    setTransport,
  } = useVaultFileCells(initialItems);

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
  } = useVaultVoid({
    voidColor: VOID_CHAKRA_COLORS.amethyst,
    onVoid: (item) => {
      removeCell(item.id);
      onVoid?.(item);
    },
  });

  const handleComment = (item, body) =>
    addComment('amethyst', item.id, item.label, sessionMeta?.owner || 'member', body);
  const handleVoiceComment = (item, audioData) =>
    addComment('amethyst', item.id, item.label, sessionMeta?.owner || 'member', null, audioData);
  const canAdmin = canEdit(sessionMeta, 'amethyst');

  const handleTune = () => {
    if (!activeId) return;
    const item = findCellById(activeId);
    if (item) setTuneItem(item);
  };

  const handleTuneSave = (updates) => {
    saveTuneOverride('amethyst', tuneItem.id, updates);
    updateCell(tuneItem.id, (cell) => ({
      ...cell,
      label: updates.label,
      sublabel: `${updates.frequency}Hz · ${cell.metadata?.duration || cell.metadata?.note || ''}`,
      metadata: { ...cell.metadata, frequency: `${updates.frequency}Hz` },
    }));
    setTuneItem(null);
  };

  return (
    <motion.div
      className="vault-screen amethyst-vault"
      initial={{ opacity: 0, scale: 0.93 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.12, 0, 0.2, 1] }}
    >
      {/* Crystal refraction overlay */}
      <div className="amethyst-refraction" />

      <div className="vault-header">
        <h1 className="vault-title">ANGI</h1>
        <p className="vault-subtitle">MEMBER VAULT · SOVEREIGN RESONANCE</p>
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
            >VOID</button>
          </>
        )}
      </div>

      {tuneItem && (
        <TuneModal
          item={{ label: tuneItem.label, bpm: 0, frequency: parseFrequency(tuneItem.metadata?.frequency) }}
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
            <div className="shelf-section-label">CHAKRA RESONANCE · SESSIONS</div>
            <RecordShelf
              items={cells}
              activeId={activeId}
              onSelect={selectCell}
              onVoid={readOnly ? undefined : handleShelfVoid}
              onComment={canComment(sessionMeta) ? handleComment : undefined}
              onVoiceComment={canComment(sessionMeta) ? handleVoiceComment : undefined}
              capacity={20}
            />
          </div>

          <StuderTransportBar
            activeTrack={activeTrack}
            transportState={transportState}
            pitchMultiplier={pitchMultiplier}
            onPlay={() => setTransport('play')}
            onStop={() => setTransport('stop')}
            onRewind={() => setTransport('rewind')}
            onFastForward={() => setTransport('ff')}
            onPause={() => setTransport('pause')}
            onRecord={() => setTransport('record')}
            showAdminCommands={!readOnly}
            isAdmin={canAdmin}
            onAdminArm={() => activeId && handleVoidButton(findCellById(activeId))}
            onAdminCommit={confirmArmedVoid}
            onAdminSeal={() => { cancelArmedVoid(); setTransport('stop'); }}
            onAdminClear={clearSelection}
            onPitchChange={setPitchMultiplier}
          />
        </div>
      </div>

      {!readOnly && <VoidStreakOverlay {...voidProps} />}
    </motion.div>
  );
}

export default AmethystVault;
