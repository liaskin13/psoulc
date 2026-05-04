import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import RecordShelf from './RecordShelf';
import StuderTransportBar from './StuderTransportBar';
import TuneModal from './TuneModal';
import VaultWindow from './VaultWindow';
import VoidStreakOverlay from './VoidStreakOverlay';
import DeckWaveform from './DeckWaveform';
import { useVaultVoid } from '../hooks/useVaultVoid';
import { useVaultFileCells } from '../hooks/useVaultFileCells';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { fetchVaultTracks, saveTrackHotCues, saveTrackWaveform } from '../lib/tracks';
import { reanalyzeFromUrl } from '../lib/audioPreprocessor';
import { getAudioUrl } from '../lib/tracks';
import { VOID_CHAKRA_COLORS, MEMBER_CHAKRA_COLORS, D_CHAKRA_COLOR, VAULT_DISPLAY_NAMES, VAULT_ACCENT_COLORS } from '../config';
import { SERATO_COLORS } from '../lib/waveformAnalyzer';
import { useSystem } from '../state/SystemContext';
import { canComment, canEdit } from '../utils/permissions';

const CELL_PALETTE = {
  highlight: '#e8e8e8',
  base:      '#888888',
  shadow:    '#111111',
  glow:      'rgba(180,180,180,0.5)',
};

function trackToCell(t) {
  const parsedHotCues = t.hot_cues
    ? (typeof t.hot_cues === 'string' ? JSON.parse(t.hot_cues) : t.hot_cues)
    : {};
  const durationLabel = t.duration ? formatTime(t.duration) : null;
  const bpmLabel = t.bpm ? `${Math.round(t.bpm)} BPM` : '— BPM';
  const keyLabel = t.musical_key ? ` · ${t.musical_key}` : '';
  const durLabel = durationLabel ? ` · ${durationLabel}` : '';
  return {
    id:          `track-${t.id}`,
    _dbId:       t.id,
    label:       t.title,
    sublabel:    `${bpmLabel}${keyLabel}${durLabel}`,
    metadata:    {
      bpm:       t.bpm ?? 120,
      frequency: `${t.frequency_hz ?? 528}Hz`,
      audioPath: t.audio_path,
      duration:  t.duration ?? null,
      musicalKey: t.musical_key ?? null,
      createdAt: t.created_at ?? null,
      waveformData: t.waveform_data
        ? (typeof t.waveform_data === 'string' ? JSON.parse(t.waveform_data) : t.waveform_data)
        : null,
      hotCues:   parsedHotCues,
    },
    createdBy:   t.uploaded_by || 'D',
    chakraColor: MEMBER_CHAKRA_COLORS?.[t.uploaded_by] ?? D_CHAKRA_COLOR,
    ...CELL_PALETTE,
  };
}

function formatTime(s) {
  if (!s || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = String(Math.floor(s % 60)).padStart(2, '0');
  return `${m}:${sec}`;
}

function TheVault({ vault, onBack, onExitSystem, onVoid, readOnly = false }) {
  const { addComment, sessionMeta, getTuneOverride, saveTuneOverride } = useSystem();
  const [loading,       setLoading]       = useState(true);
  const [rawTracks,     setRawTracks]     = useState([]);
  const [sourceVersion, setSourceVersion] = useState(0);
  const [tuneItem,      setTuneItem]      = useState(null);
  const [voidLog,       setVoidLog]       = useState([]);
  const [pitchMultiplier, setPitchMultiplier] = useState(1.0);
  const [hotCues,          setHotCues]          = useState({});
  const [searchQuery,      setSearchQuery]      = useState('');
  const [sortBy,           setSortBy]           = useState('date');
  const [isReanalyzing,    setIsReanalyzing]    = useState(false);
  const [reanalyzeProgress, setReanalyzeProgress] = useState(0);

  const {
    isPlaying, duration, currentTime, isLoading: audioLoading,
    loadedPath, loadAndPlay, togglePlay, stop, rewind, fastForward, seek,
  } = useAudioPlayer();

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
    activeCell,
    activeTrack,
    transportState,
    selectCell,
    findCellById,
    updateCell,
    clearSelection,
    setTransport,
  } = useVaultFileCells(initialCells, sourceVersion);

  // Active cell's waveform, audio path, and hot cues
  const activeWaveform = activeCell?.metadata?.waveformData?.high ?? null;
  const activeAudioPath = activeCell?.metadata?.audioPath ?? null;

  // Sync hot cues from active cell's DB data whenever selection changes
  useEffect(() => {
    setHotCues(activeCell?.metadata?.hotCues ?? {});
  }, [activeId]);

  const handleSetCue = (num) => {
    if (!activeId || !activeCell) return;
    const dbId = activeCell._dbId;
    if (hotCues[num]) {
      // Already set — jump to it
      seek(hotCues[num].time);
    } else {
      // Set new cue at current time
      const updated = { ...hotCues, [num]: { time: currentTime } };
      setHotCues(updated);
      saveTrackHotCues(dbId, updated).catch(console.error);
    }
  };

  const handleClearCue = (num) => {
    if (!activeId || !activeCell) return;
    const dbId = activeCell._dbId;
    const updated = { ...hotCues };
    delete updated[num];
    setHotCues(updated);
    saveTrackHotCues(dbId, updated).catch(console.error);
  };

  const handleReanalyze = async () => {
    if (!activeCell || isReanalyzing) return;
    const { _dbId, metadata } = activeCell;
    const url = getAudioUrl(metadata?.audioPath);
    if (!url) return;
    setIsReanalyzing(true);
    setReanalyzeProgress(0);
    try {
      const { waveformData } = await reanalyzeFromUrl(url, setReanalyzeProgress);
      await saveTrackWaveform(_dbId, waveformData);
      // Update the cell in local state so waveform renders immediately
      updateCell(activeId, (cell) => ({
        ...cell,
        metadata: { ...cell.metadata, waveformData },
      }));
    } catch (err) {
      console.error('Reanalyze failed:', err);
    } finally {
      setIsReanalyzing(false);
      setReanalyzeProgress(0);
    }
  };

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

  // ── Transport handlers — wire to audioEngine ──────────────────────────────
  const handlePlay = () => {
    if (!activeAudioPath) return;
    if (loadedPath !== activeAudioPath) {
      loadAndPlay(activeAudioPath);
    } else {
      togglePlay();
    }
    setTransport('play');
  };

  const handlePause = () => {
    togglePlay();
    setTransport(isPlaying ? 'pause' : 'play');
  };

  const handleStop = () => {
    stop();
    setTransport('stop');
  };

  const handleRewind = () => {
    rewind();
    setTransport('play');
  };

  const handleFastForward = () => {
    fastForward();
  };

  const vaultLabel    = VAULT_DISPLAY_NAMES[vault] ?? vault.toUpperCase();
  const vaultSubLabel = `SOUL PLEASANT · ${vaultLabel}`;

  const displayItems = (() => {
    let items = trackItems;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      items = items.filter(item =>
        item.label?.toLowerCase().includes(q) ||
        item.sublabel?.toLowerCase().includes(q)
      );
    }
    const sorted = [...items];
    if (sortBy === 'bpm') {
      sorted.sort((a, b) => (a.metadata?.bpm ?? 0) - (b.metadata?.bpm ?? 0));
    } else if (sortBy === 'duration') {
      sorted.sort((a, b) => (a.metadata?.duration ?? 0) - (b.metadata?.duration ?? 0));
    } else if (sortBy === 'title') {
      sorted.sort((a, b) => (a.label ?? '').localeCompare(b.label ?? ''));
    } else {
      // date — newest first (default, server already returns DESC but apply locally too)
      sorted.sort((a, b) => {
        const da = a.metadata?.createdAt ? new Date(a.metadata.createdAt).getTime() : 0;
        const db = b.metadata?.createdAt ? new Date(b.metadata.createdAt).getTime() : 0;
        return db - da;
      });
    }
    return sorted;
  })();

  return (
    <motion.div
      className={`vault-screen vault-${vault}`}
      style={{
        '--vault-owner-glow': `${D_CHAKRA_COLOR}1a`,
        '--vault-color': VAULT_ACCENT_COLORS[vault] ?? 'rgba(255,255,255,0.5)',
      }}
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
            <button
              className="god-btn"
              onClick={handleReanalyze}
              disabled={!activeId || isReanalyzing}
              style={{ opacity: activeId && !isReanalyzing ? 1 : 0.4 }}
              title="Re-generate waveform from audio file"
            >
              {isReanalyzing ? `ANALYZING ${reanalyzeProgress}%` : 'REANALYZE'}
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

        {/* Deck waveform — full width, shown when a track is active */}
        {activeId && (
          <div className="vault-deck-waveform">
            <div className="vault-deck-waveform-meta">
              <span className="vault-deck-time">{formatTime(currentTime)}</span>
              <span className="vault-deck-title">
                {activeCell?.label}
                {activeCell?.metadata?.musicalKey && (
                  <span className="vault-deck-key"> · {activeCell.metadata.musicalKey}</span>
                )}
              </span>
              <span className="vault-deck-duration">{formatTime(duration || activeCell?.metadata?.duration)}</span>
            </div>
            <DeckWaveform
              waveformData={activeWaveform}
              currentTime={currentTime}
              duration={duration || activeCell?.metadata?.duration || 1}
              onSeek={seek}
              trackId={activeId}
              width={Math.min(window.innerWidth - 48, 960)}
              height={80}
              hotCues={hotCues}
              cueColors={SERATO_COLORS}
            />
            {/* Hot cue pad strip — 8 pads, Serato-style */}
            <div className="vault-hot-cues" aria-label="Hot cues">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => {
                const cue = hotCues[num];
                const color = SERATO_COLORS[num - 1] || '#ffffff';
                return (
                  <button
                    key={num}
                    className={`vault-cue-pad ${cue ? 'is-set' : ''}`}
                    style={{ '--cue-color': color }}
                    onClick={() => handleSetCue(num)}
                    onContextMenu={(e) => { e.preventDefault(); handleClearCue(num); }}
                    title={cue ? `CUE ${num} @ ${formatTime(cue.time)} — click to jump · right-click to clear` : `Set CUE ${num} at ${formatTime(currentTime)}`}
                    aria-label={cue ? `Jump to cue ${num}` : `Set cue ${num}`}
                  >
                    <span className="vault-cue-num">{num}</span>
                    {cue && <span className="vault-cue-time">{formatTime(cue.time)}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="vault-library-band">
          <div className="shelf-section">
            <div className="vault-library-controls">
              <input
                className="vault-search-input"
                type="search"
                placeholder="SEARCH TRACKS"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                aria-label="Search tracks"
                spellCheck={false}
              />
              <div className="vault-sort-pills" role="group" aria-label="Sort by">
                {[
                  { id: 'date',     label: 'DATE' },
                  { id: 'bpm',      label: 'BPM' },
                  { id: 'duration', label: 'TIME' },
                  { id: 'title',    label: 'A–Z' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    className={`vault-sort-pill ${sortBy === opt.id ? 'is-active' : ''}`}
                    onClick={() => setSortBy(opt.id)}
                    aria-pressed={sortBy === opt.id}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="vault-track-count" aria-live="polite">
                {loading ? '—' : `${displayItems.length}${searchQuery ? `/${trackItems.length}` : ''}`}
              </div>
            </div>
            {!loading && (
              <RecordShelf
                items={displayItems}
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
            transportState={isPlaying ? 'play' : transportState}
            pitchMultiplier={pitchMultiplier}
            onPlay={handlePlay}
            onStop={handleStop}
            onRewind={handleRewind}
            onFastForward={handleFastForward}
            onPause={handlePause}
            onRecord={() => setTransport('record')}
            showAdminCommands={!readOnly}
            isAdmin={canAdmin}
            onAdminArm={()     => activeId && handleVoidButton(findCellById(activeId))}
            onAdminCommit={confirmArmedVoid}
            onAdminSeal={()    => { cancelArmedVoid(); handleStop(); }}
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
