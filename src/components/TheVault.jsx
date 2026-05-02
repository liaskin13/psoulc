import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import RecordShelf from './RecordShelf';
import StuderTransportBar from './StuderTransportBar';
import TuneModal from './TuneModal';
import VaultWindow from './VaultWindow';
import VoidStreakOverlay from './VoidStreakOverlay';
import { useVaultVoid } from '../hooks/useVaultVoid';
import { useVaultFileCells } from '../hooks/useVaultFileCells';
import { fetchVaultTracks } from '../lib/tracks';
import { VOID_CHAKRA_COLORS, MEMBER_CHAKRA_COLORS, D_CHAKRA_COLOR, VAULT_DISPLAY_NAMES } from '../config';
import { useSystem } from '../state/SystemContext';
import { canComment, canEdit } from '../utils/permissions';

const CELL_PALETTE = {
  highlight: '#e8e8e8',
  base:      '#888888',
  shadow:    '#111111',
  glow:      'rgba(180,180,180,0.5)',
};

function trackToCell(t) {
  return {
    id:         `track-${t.id}`,
    _dbId:      t.id,
    label:      t.title,
    sublabel:   `${t.bpm ?? '—'} BPM · ${t.frequency_hz ?? 528}Hz`,
    metadata:   { bpm: t.bpm ?? 120, frequency: `${t.frequency_hz ?? 528}Hz`, audioPath: t.audio_path },
    createdBy:  t.uploaded_by || 'D',
    chakraColor: MEMBER_CHAKRA_COLORS?.[t.uploaded_by] ?? D_CHAKRA_COLOR,
    ...CELL_PALETTE,
  };
}

function TheVault({ vault, onBack, onExitSystem, onVoid, readOnly = false }) {
  const { addComment, sessionMeta, getTuneOverride, saveTuneOverride } = useSystem();
  const [loading,     setLoading]     = useState(true);
  const [rawTracks,   setRawTracks]   = useState([]);
  const [sourceVersion, setSourceVersion] = useState(0);
  const [tuneItem,    setTuneItem]    = useState(null);
  const [voidLog,     setVoidLog]     = useState([]);
  const [pitchMultiplier, setPitchMultiplier] = useState(1.0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchVaultTracks(vault).then((data) => {
      if (!cancelled) {
        setRawTracks(data);
        setSourceVersion((prev) => prev + 1);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [vault]);

  const initialCells = rawTracks.map((t) => {
    const cell = trackToCell(t);
    const override = getTuneOverride(vault, cell.id);
    if (!override) return cell;
    const bpm = override.bpm ?? t.bpm ?? 120;
    const freq = override.frequency ?? (t.frequency_hz ?? 528);
    return {
      ...cell,
      label:    override.label ?? cell.label,
      sublabel: `${bpm} BPM · ${freq}Hz`,
      metadata: { ...cell.metadata, bpm, frequency: `${freq}Hz` },
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
  } = useVaultFileCells(initialCells, sourceVersion);

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
    voidColor: VOID_CHAKRA_COLORS[vault] ?? VOID_CHAKRA_COLORS.moon,
    onVoid: (item) => {
      setVoidLog(prev => [...prev, item]);
      if (activeId === item.id) clearSelection();
      onVoid?.(item);
    },
  });

  const handleComment      = (item, body) =>
    addComment(vault, item.id, item.label, sessionMeta?.owner || 'member', body);
  const handleVoiceComment = (item, audioData) =>
    addComment(vault, item.id, item.label, sessionMeta?.owner || 'member', null, audioData);
  const canAdmin = canEdit(sessionMeta, vault);

  const handleTune = () => {
    if (!activeId) return;
    const item = findCellById(activeId);
    if (item) setTuneItem(item);
  };

  const handleTuneSave = (updates) => {
    saveTuneOverride(vault, tuneItem.id, updates);
    updateCell(tuneItem.id, (cell) => ({
      ...cell,
      label:    updates.label,
      sublabel: `${updates.bpm} BPM · ${updates.frequency}Hz`,
      metadata: { ...cell.metadata, bpm: updates.bpm, frequency: `${updates.frequency}Hz` },
    }));
    setTuneItem(null);
  };

  const vaultLabel    = VAULT_DISPLAY_NAMES[vault] ?? vault.toUpperCase();
  const vaultSubLabel = vault === 'saturn' ? 'MASTER TRACKS · SOUL PLEASANT' : `${vaultLabel} · PSC ARCHIVE`;

  return (
    <motion.div
      className={`vault-screen vault-${vault}`}
      style={{ '--vault-owner-glow': `${D_CHAKRA_COLOR}1a` }}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.08, 0, 0.3, 1] }}
    >
      <div className="vault-header">
        <h1 className="vault-title">{vaultLabel}</h1>
        <p className="vault-subtitle">{vaultSubLabel}</p>
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
            activeTrack={activeTrack}
          />
        </div>

        <div className="vault-library-band">
          <div className="shelf-section">
            <div className="shelf-section-label">
              {loading ? 'LOADING…' : `${trackItems.length} TRACK${trackItems.length !== 1 ? 'S' : ''}`}
            </div>
            {!loading && (
              <RecordShelf
                items={trackItems}
                activeId={activeId}
                onSelect={selectCell}
                onVoid={readOnly ? undefined : handleShelfVoid}
                onComment={canComment(sessionMeta) ? handleComment : undefined}
                onVoiceComment={canComment(sessionMeta) ? handleVoiceComment : undefined}
              />
            )}
          </div>

          <StuderTransportBar
            activeTrack={activeTrack}
            transportState={transportState}
            pitchMultiplier={pitchMultiplier}
            onPlay={()         => setTransport('play')}
            onStop={()         => setTransport('stop')}
            onRewind={()       => setTransport('rewind')}
            onFastForward={()  => setTransport('ff')}
            onPause={()        => setTransport('pause')}
            onRecord={()       => setTransport('record')}
            showAdminCommands={!readOnly}
            isAdmin={canAdmin}
            onAdminArm={()     => activeId && handleVoidButton(findCellById(activeId))}
            onAdminCommit={confirmArmedVoid}
            onAdminSeal={()    => { cancelArmedVoid(); setTransport('stop'); }}
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

      <VoidStreakOverlay {...voidProps} />
    </motion.div>
  );
}

export default TheVault;
