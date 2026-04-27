import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import RecordShelf from '../components/RecordShelf';
import StuderTransportBar from '../components/StuderTransportBar';
import TuneModal from '../components/TuneModal';
import VaultWindow from '../components/VaultWindow';
import VoidStreakOverlay from '../components/VoidStreakOverlay';
import { useVaultVoid } from '../hooks/useVaultVoid';
import { useVaultFileCells } from '../hooks/useVaultFileCells';
import { ARTIST_LOCKBOXES } from '../data/saturn';
import { D_CHAKRA_COLOR, MEMBER_CHAKRA_COLORS, VOID_CHAKRA_COLORS, LOCKBOX_PREFIX } from '../config';
import { useSystem } from '../state/SystemContext';
import { canComment, canEdit } from '../utils/permissions';

const LOCKBOX_SKIN = {
  highlight: '#f5ddff',
  base: '#6f3f9c',
  shadow: '#1b0728',
  glow: 'rgba(137, 79, 193, 0.65)',
};

function titleFromLockboxId(lockboxId) {
  if (!lockboxId) return 'LOCKBOX';
  return lockboxId.replace(LOCKBOX_PREFIX, '').replace(/_/g, ' ').toUpperCase();
}

function LockboxVault({ lockboxId, onBack, onExitSystem, onVoid, readOnly = false }) {
  const [pitchMultiplier, setPitchMultiplier] = useState(1.0);
  const [tuneItem, setTuneItem] = useState(null);
  const [voidLog, setVoidLog] = useState([]);
  const { addComment, sessionMeta, getTuneOverride, saveTuneOverride } = useSystem();

  const lockboxKey = (lockboxId || '').replace(LOCKBOX_PREFIX, '');
  const lockboxData = ARTIST_LOCKBOXES.find((m) => m.id === lockboxKey);
  const lockboxName = lockboxData?.name || titleFromLockboxId(lockboxId);
  const lockboxHz = lockboxData?.frequency || 528;

  const baseItems = useMemo(() => {
    const stems = lockboxData?.stems || ['VOCAL', 'MUSIC', 'ALT'];
    const bpms = [112, 124, 98];
    const base = stems.map((stem, idx) => ({
      id: `lockbox-${lockboxKey}-${idx + 1}`,
      label: `${lockboxName} ${stem} CUT ${idx + 1}`,
      sublabel: `${bpms[idx % bpms.length]} BPM · ${lockboxHz}Hz`,
      metadata: { bpm: bpms[idx % bpms.length], frequency: `${lockboxHz}Hz`, stem },
      createdBy: 'D',
      chakraColor: MEMBER_CHAKRA_COLORS.D,
      ...LOCKBOX_SKIN,
    }));

    const remix = stems.map((stem, idx) => ({
      id: `lockbox-${lockboxKey}-rx-${idx + 1}`,
      label: `${lockboxName} ${stem} REMIX ${idx + 1}`,
      sublabel: `${bpms[(idx + 1) % bpms.length] + 6} BPM · ${lockboxHz}Hz`,
      metadata: { bpm: bpms[(idx + 1) % bpms.length] + 6, frequency: `${lockboxHz}Hz`, stem },
      createdBy: 'D',
      chakraColor: MEMBER_CHAKRA_COLORS.D,
      ...LOCKBOX_SKIN,
    }));

    return [...base, ...remix];
  }, [lockboxData, lockboxHz, lockboxKey, lockboxName]);

  const initialItems = baseItems.map((item) => {
    const override = getTuneOverride(lockboxId, item.id);
    if (!override) return item;
    return {
      ...item,
      label: override.label ?? item.label,
      sublabel: `${override.bpm ?? item.metadata?.bpm ?? 120} BPM · ${override.frequency ?? lockboxHz}Hz`,
      metadata: {
        ...item.metadata,
        bpm: override.bpm ?? item.metadata?.bpm ?? 120,
        frequency: `${override.frequency ?? lockboxHz}Hz`,
      },
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
    voidColor: VOID_CHAKRA_COLORS.saturn,
    onVoid: (item) => {
      setVoidLog((prev) => [...prev, item]);
      if (activeId === item.id) clearSelection();
      onVoid?.(item);
    },
  });

  const canAdmin = canEdit(sessionMeta, lockboxId);
  const handleComment = (item, body) => addComment(lockboxId, item.id, item.label, sessionMeta?.owner || 'member', body);
  const handleVoiceComment = (item, audioData) => addComment(lockboxId, item.id, item.label, sessionMeta?.owner || 'member', null, audioData);

  const handleTuneSave = (updates) => {
    saveTuneOverride(lockboxId, tuneItem.id, updates);
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
      className="vault-screen lockbox-vault"
      style={{ '--vault-owner-glow': `${D_CHAKRA_COLOR}1a` }}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.08, 0, 0.3, 1] }}
    >
      <div className="vault-header">
        <h1 className="vault-title">{lockboxName}</h1>
        <p className="vault-subtitle">LOCKBOX VAULT · ORIGINALS + D REMIXES</p>
      </div>

      <div className="vault-commands">
        <button className="god-btn" onClick={onBack}>SEAL VAULT</button>
        <button className="god-btn" onClick={onExitSystem}>EXIT SYSTEM</button>
        {!readOnly && (
          <>
            <button className="god-btn" onClick={() => activeId && setTuneItem(findCellById(activeId))} disabled={!activeId} style={{ opacity: activeId ? 1 : 0.4 }}>
              TUNE
            </button>
            <button className="god-btn" onClick={() => activeId && handleVoidButton(findCellById(activeId))} disabled={!activeId} style={{ opacity: activeId ? 1 : 0.4 }}>
              VOID
            </button>
          </>
        )}
      </div>

      {tuneItem && (
        <TuneModal
          item={{ label: tuneItem.label, bpm: tuneItem.metadata?.bpm, frequency: parseInt(tuneItem.metadata?.frequency, 10) || lockboxHz }}
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
            <div className="shelf-section-label">LOCKBOX LIBRARY</div>
            <RecordShelf
              items={cells}
              activeId={activeId}
              onSelect={selectCell}
              onVoid={readOnly ? undefined : handleShelfVoid}
              onComment={canComment(sessionMeta) ? handleComment : undefined}
              onVoiceComment={canComment(sessionMeta) ? handleVoiceComment : undefined}
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

export default LockboxVault;
