import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSystem } from "../state/SystemContext";
import "./ArchitectConsole.css";
import ConduitSlider from "./ConduitSlider";
import InboxPanel from "./InboxPanel";
import CommentPanel from "./CommentPanel";
import DirectLinePanel from "./DirectLinePanel";
import DeckWaveform from "../components/DeckWaveform";
import { LOCKBOX_PREFIX, VAULT_DISPLAY_NAMES, VAULT_ACCENT_COLORS } from "../config";
import {
  tierDefaultsForMember,
  resolveMatrixPerm,
  toggleMatrixPerm,
  commitMatrixState,
  rollbackMatrixState,
} from "./matrixState";
import { fetchAllTracks, getAudioUrl } from "../lib/tracks";
import { getWaveformBars } from "../utils/waveform";
import {
  generateAndSaveWaveform,
  SERATO_COLORS,
} from "../lib/waveformAnalyzer";
import * as audioEngine from "../lib/audioEngine";
import AdminSettings from "../admin/AdminSettings";
import PSCWordmark from "../components/PSCWordmark";

const VAULT_ROUTES = [
  { id: "venus",   label: VAULT_DISPLAY_NAMES.venus,    color: VAULT_ACCENT_COLORS.venus   },
  { id: "saturn",  label: VAULT_DISPLAY_NAMES.saturn,   color: VAULT_ACCENT_COLORS.saturn  },
  { id: "mercury", label: VAULT_DISPLAY_NAMES.mercury,  color: VAULT_ACCENT_COLORS.mercury },
  { id: "earth",   label: VAULT_DISPLAY_NAMES.earth,    color: VAULT_ACCENT_COLORS.earth   },
];

function vaultLabel(id) {
  if (!id) return "—";
  if (id.startsWith(LOCKBOX_PREFIX))
    return `FEATURED · ${id.replace(LOCKBOX_PREFIX, "").toUpperCase()}`;
  return VAULT_DISPLAY_NAMES[id] || "—";
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

const SR_ONLY_STYLE = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

function EventHorizonPanel({ architectArchive, onRestore }) {
  return (
    <motion.div
      id="arch-event-horizon-panel"
      role="dialog"
      aria-modal="false"
      aria-labelledby="arch-archive-title"
      aria-describedby="arch-archive-sub"
      className="arch-event-horizon-panel"
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 22 }}
    >
      <div className="arch-panel-header">
        <span className="arch-panel-dot" />
        <span id="arch-archive-title" className="arch-panel-title">
          ARCHIVE LOG
        </span>
        <span id="arch-archive-sub" className="arch-panel-sub">
          Secure stasis layer — Architect access only
        </span>
      </div>

      <div className="arch-horizon-entries">
        {architectArchive.length === 0 ? (
          <div className="arch-horizon-empty">— Archive log is clear. —</div>
        ) : (
          architectArchive.map((item) => (
            <motion.div
              key={item.id}
              className={`arch-horizon-entry ${item.restored ? "restored" : ""}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: item.restored ? 0.35 : 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="arch-entry-name">
                {item.label || item.name || item.id}
              </div>
              <div className="arch-entry-meta">
                <span className="arch-entry-origin">
                  {vaultLabel(item.originPlanet)}
                </span>
                <span className="arch-entry-time">
                  {new Date(item.voidedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              {!item.restored && (
                <button
                  className="arch-restore-btn"
                  onClick={() => onRestore(item.id)}
                >
                  RESTORE
                </button>
              )}
              {item.restored && (
                <span className="arch-restored-badge">RESTORED</span>
              )}
            </motion.div>
          ))
        )}
      </div>

      <div className="arch-panel-footer">
        <span className="arch-count">
          {architectArchive.filter((i) => !i.restored).length} SECURED ITEMS
        </span>
        <span className="arch-count">
          {architectArchive.filter((i) => i.restored).length} RESTORED
        </span>
      </div>
    </motion.div>
  );
}

function ArchitectConsole({
  onPowerDown,
  onExplorePlanet,
  onBroadcast,
  onIntake,
  viewer = "L",
  accent = "cyan",
}) {
  const {
    architectArchive,
    restoreItem,
    unreadCountL,
    members,
    unreadCommentCount,
    voidItem,
    addMember,
  } = useSystem();
  const MATRIX_COMMITTED_KEY = "psc_matrix_committed";
  const MATRIX_HISTORY_KEY = "psc_matrix_history";
  const ARCH_PREFS_KEY = "psc_architect_prefs";
  const ARCH_RUNTIME_KEY = "psc_architect_runtime";
  const [showArchive, setShowArchive] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [showRoster, setShowRoster] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [activeVault, setActiveVault] = useState(null);
  const [activeLibVault, setActiveLibVault] = useState(VAULT_ROUTES[0].id);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [showPowerConfirm, setShowPowerConfirm] = useState(false);
  const [showVoidConfirm, setShowVoidConfirm] = useState(false);
  const [showTrackList, setShowTrackList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [trackListData, setTrackListData] = useState([]);
  const [trackListLoading, setTrackListLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [quantizeEnabled, setQuantizeEnabled] = useState(true);
  const [activePerfMode, setActivePerfMode] = useState("hotcue");
  const [sortMode, setSortMode] = useState("bpm");
  const [smartCrates, setSmartCrates] = useState(false);
  const [historyEnabled, setHistoryEnabled] = useState(true);
  const [prepareQueue, setPrepareQueue] = useState([]);
  const [selectedTrackId, setSelectedTrackId] = useState(null);
  const [loadedDeckId, setLoadedDeckId] = useState(null);
  const [trackPlayCounts, setTrackPlayCounts] = useState({});
  const [trackHistory, setTrackHistory] = useState([]);
  const [waveformDetail, setWaveformDetail] = useState("high");
  const [trackColorRows, setTrackColorRows] = useState(true);
  const [autoLoopDefault, setAutoLoopDefault] = useState(false);
  const [rosterShowAdd, setRosterShowAdd] = useState(false);
  const [rosterName, setRosterName] = useState("");
  const [rosterPlanet, setRosterPlanet] = useState("");
  const [rosterTier, setRosterTier] = useState("B");
  const [rosterMoon, setRosterMoon] = useState("");
  const [rosterCode, setRosterCode] = useState("");
  const [rosterFlash, setRosterFlash] = useState(null);
  const [rosterReveal, setRosterReveal] = useState(null);
  const [showMatrix, setShowMatrix] = useState(false);
  const [matrixArmed, setMatrixArmed] = useState(false);
  const [matrixPending, setMatrixPending] = useState({});
  const [matrixCommitted, setMatrixCommitted] = useState({});
  const [matrixHistory, setMatrixHistory] = useState([]);
  const [liveAnnouncement, setLiveAnnouncement] = useState("");
  const [libSearch, setLibSearch] = useState("");
  // Audio playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [volume, setVolume] = useState(audioEngine.getVolume());
  const [loadedTrack, setLoadedTrack] = useState(null);
  const [regeneratingWaveforms, setRegeneratingWaveforms] = useState({});

  // Hot cues: { trackId: { 1: { time: 10.5 }, 2: { time: 45.2 }, ... } }
  const [hotCues, setHotCues] = useState(() => {
    try {
      const stored = localStorage.getItem("psc_hotcues");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const rafRef = useRef(null);
  const announceTimerRef = useRef(null);
  const tabRefs = useRef([]);
  const gliderRef = useRef(null);
  const waveformBars = getWaveformBars("l-console-ambient", 80);
  const cursorRef = useRef(null);
  const cursorPos = useRef({ x: -200, y: -200 });

  // Auto-load tracks on mount + listen for upload events
  useEffect(() => {
    const loadTracks = () => {
      console.log("[PSC] Loading tracks from database...");
      fetchAllTracks()
        .then((tracks) => {
          console.log(`[PSC] Loaded ${tracks.length} tracks:`, tracks);
          setTrackListData(tracks);
        })
        .catch((err) => console.error("[PSC] Failed to load tracks:", err));
    };
    loadTracks();

    // Refresh when new track uploaded
    const handleUpload = (e) => {
      console.log("[PSC] Track uploaded event:", e.detail);
      loadTracks();
    };
    window.addEventListener("psc:track-uploaded", handleUpload);
    return () => window.removeEventListener("psc:track-uploaded", handleUpload);
  }, []);

  useEffect(() => {
    const move = (e) => {
      cursorPos.current = { x: e.clientX, y: e.clientY };
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);

  const announce = (message) => {
    if (!message) return;
    if (announceTimerRef.current) clearTimeout(announceTimerRef.current);
    setLiveAnnouncement("");
    announceTimerRef.current = setTimeout(() => {
      setLiveAnnouncement(message);
    }, 20);
  };

  // Magnetic glider — moves toward active tab
  const moveGlider = useCallback((idx) => {
    const tab = tabRefs.current[idx];
    const glider = gliderRef.current;
    if (!tab || !glider) return;
    const { offsetLeft, offsetWidth } = tab;
    glider.style.transform = `translateX(${offsetLeft}px)`;
    glider.style.width = `${offsetWidth}px`;
  }, []);

  const hoverGlider = useCallback(
    (idx) => {
      const activeIdx = VAULT_ROUTES.findIndex((v) => v.id === activeLibVault);
      const activTab = tabRefs.current[activeIdx];
      const hoverTab = tabRefs.current[idx];
      const glider = gliderRef.current;
      if (!activTab || !hoverTab || !glider) return;
      const from = activTab.offsetLeft;
      const to = hoverTab.offsetLeft;
      const pulled = from + (to - from) * 0.4;
      const fromW = activTab.offsetWidth;
      const toW = hoverTab.offsetWidth;
      const pulledW = fromW + (toW - fromW) * 0.4;
      glider.style.transform = `translateX(${pulled}px)`;
      glider.style.width = `${pulledW}px`;
    },
    [activeLibVault],
  );

  useEffect(() => {
    const idx = VAULT_ROUTES.findIndex((v) => v.id === activeLibVault);
    moveGlider(idx);
  }, [activeLibVault, moveGlider]);

  useEffect(() => {
    try {
      const committed = JSON.parse(
        localStorage.getItem(MATRIX_COMMITTED_KEY) || "{}",
      );
      const history = JSON.parse(
        localStorage.getItem(MATRIX_HISTORY_KEY) || "[]",
      );
      if (committed && typeof committed === "object")
        setMatrixCommitted(committed);
      if (Array.isArray(history)) setMatrixHistory(history);
    } catch (_) {
      setMatrixCommitted({});
      setMatrixHistory([]);
    }
  }, []);

  useEffect(() => {
    try {
      const prefs = JSON.parse(localStorage.getItem(ARCH_PREFS_KEY) || "{}");
      const runtime = JSON.parse(
        localStorage.getItem(ARCH_RUNTIME_KEY) || "{}",
      );
      if (prefs && typeof prefs === "object") {
        if (prefs.waveformDetail) setWaveformDetail(prefs.waveformDetail);
        if (typeof prefs.trackColorRows === "boolean")
          setTrackColorRows(prefs.trackColorRows);
        if (typeof prefs.quantizeEnabled === "boolean")
          setQuantizeEnabled(prefs.quantizeEnabled);
        if (typeof prefs.autoLoopDefault === "boolean")
          setAutoLoopDefault(prefs.autoLoopDefault);
        if (typeof prefs.smartCrates === "boolean")
          setSmartCrates(prefs.smartCrates);
        if (typeof prefs.historyEnabled === "boolean")
          setHistoryEnabled(prefs.historyEnabled);
      }
      if (runtime && typeof runtime === "object") {
        if (
          runtime.trackPlayCounts &&
          typeof runtime.trackPlayCounts === "object"
        )
          setTrackPlayCounts(runtime.trackPlayCounts);
        if (Array.isArray(runtime.trackHistory))
          setTrackHistory(runtime.trackHistory);
        if (Array.isArray(runtime.prepareQueue))
          setPrepareQueue(runtime.prepareQueue);
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        MATRIX_COMMITTED_KEY,
        JSON.stringify(matrixCommitted),
      );
    } catch (_) {}
  }, [matrixCommitted]);

  useEffect(() => {
    try {
      localStorage.setItem(MATRIX_HISTORY_KEY, JSON.stringify(matrixHistory));
    } catch (_) {}
  }, [matrixHistory]);

  useEffect(() => {
    try {
      localStorage.setItem(
        ARCH_PREFS_KEY,
        JSON.stringify({
          waveformDetail,
          trackColorRows,
          quantizeEnabled,
          autoLoopDefault,
          smartCrates,
          historyEnabled,
        }),
      );
    } catch (_) {}
  }, [
    autoLoopDefault,
    historyEnabled,
    quantizeEnabled,
    smartCrates,
    trackColorRows,
    waveformDetail,
  ]);

  useEffect(() => {
    try {
      localStorage.setItem(
        ARCH_RUNTIME_KEY,
        JSON.stringify({
          trackPlayCounts,
          trackHistory,
          prepareQueue,
        }),
      );
    } catch (_) {}
  }, [prepareQueue, trackHistory, trackPlayCounts]);

  useEffect(
    () => () => {
      if (announceTimerRef.current) clearTimeout(announceTimerRef.current);
    },
    [],
  );

  // Sync audio engine state → React (RAF loop while playing, listener otherwise)
  useEffect(() => {
    const unsub = audioEngine.onStateChange((state) => {
      setIsPlaying(state.isPlaying);
      setAudioDuration(state.duration);
      setCurrentTime(state.currentTime);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }
    const tick = () => {
      const s = audioEngine.getState();
      setCurrentTime(s.currentTime);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isPlaying]);

  const handleVaultSelect = (vaultId) => {
    const next = vaultId === activeVault ? null : vaultId;
    setActiveVault(next);
    announce(
      next ? `${vaultLabel(next)} selected.` : "Vault selection cleared.",
    );
  };

  // ── Audio handlers ──────────────────────────────────────────────────
  const loadAndPlay = async (track) => {
    const url = getAudioUrl(track.audio_path);
    console.log("[PSC] loadAndPlay:", {
      track,
      url,
      hasWaveform: !!track.waveform_data,
    });
    if (!url) {
      announce("No audio file for this track.");
      console.error("[PSC] No audio URL for track:", track);
      return;
    }
    setAudioError(null);
    setAudioLoading(true);
    announce(`Loading ${track.title || "track"}…`);
    try {
      await audioEngine.load(url);
      console.log("[PSC] Audio loaded successfully");
      setLoadedTrack(track);
      setLoadedDeckId(track.id);
      pushTrackHistory(track);
      setTrackPlayCounts((prev) => ({
        ...prev,
        [track.id]: (prev[track.id] || 0) + 1,
      }));
      audioEngine.play();
      console.log("[PSC] Audio playing");
      announce(`Playing ${track.title || "track"}.`);
    } catch (err) {
      console.error("[PSC] Audio load error:", err);
      setAudioError(err.message);
      announce("Audio load failed.");
    } finally {
      setAudioLoading(false);
    }
  };

  const loadToDeck = async (track) => {
    const url = getAudioUrl(track.audio_path);
    if (!url) {
      announce("No audio file for this track.");
      return;
    }
    setAudioError(null);
    setAudioLoading(true);
    announce(`Loading ${track.title || "track"} to deck…`);
    try {
      audioEngine.stop();
      await audioEngine.load(url);
      setLoadedTrack(track);
      setLoadedDeckId(track.id);
      announce(`${track.title || "Track"} loaded to deck. Press PLAY.`);
    } catch (err) {
      setAudioError(err.message);
      announce("Audio load failed.");
    } finally {
      setAudioLoading(false);
    }
  };

  const handlePlayPause = () => {
    if (!audioEngine.isLoaded()) {
      // Load selected track if deck is empty
      const track = trackListData.find((t) => t.id === selectedTrackId);
      if (track) {
        loadAndPlay(track);
        return;
      }
      announce("No track loaded. Select a track first.");
      return;
    }
    if (isPlaying) {
      audioEngine.pause();
      announce("Paused.");
    } else {
      audioEngine.play();
      announce(`Playing ${loadedTrack?.title || "track"}.`);
    }
  };

  const handleSeek = (seconds) => {
    if (!audioEngine.isLoaded()) return;
    audioEngine.seek(seconds);
    announce(`Seek to ${formatTime(seconds)}.`);
  };

  const handleCue = () => {
    if (!audioEngine.isLoaded()) {
      announce("No track loaded.");
      return;
    }
    audioEngine.seek(0);
    audioEngine.play();
    announce("Cue.");
  };

  const handleVolumeChange = (e) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    audioEngine.setVolume(v);
  };

  const toggleArchive = () => {
    setShowArchive((prev) => {
      const next = !prev;
      announce(`Archive log ${next ? "opened" : "closed"}.`);
      return next;
    });
  };

  const toggleInbox = () => {
    setShowInbox((prev) => {
      const next = !prev;
      announce(`Vetting Queue ${next ? "opened" : "closed"}.`);
      return next;
    });
  };

  const toggleRoster = () => {
    setShowRoster((prev) => {
      const next = !prev;
      announce(`Roster ${next ? "opened" : "closed"}.`);
      return next;
    });
  };

  const toggleMatrix = () => {
    setShowMatrix((prev) => {
      const next = !prev;
      announce(`Command matrix ${next ? "opened" : "closed"}.`);
      return next;
    });
  };

  const toggleComments = () => {
    setShowComments((prev) => {
      const next = !prev;
      announce(`Transmissions ${next ? "opened" : "closed"}.`);
      return next;
    });
  };

  const toggleTrackList = async () => {
    const next = !showTrackList;
    setShowTrackList(next);
    announce(`Track registry ${next ? "opened" : "closed"}.`);
    if (next) {
      setTrackListLoading(true);
      const tracks = await fetchAllTracks();
      setTrackListData(tracks);
      setTrackListLoading(false);
    }
  };

  const toggleSettings = () => {
    setShowSettings((prev) => {
      const next = !prev;
      announce(`Settings ${next ? "opened" : "closed"}.`);
      return next;
    });
  };

  const [showSignalPanel, setShowSignalPanel]   = useState(false);
  const [signalTitle,     setSignalTitle]       = useState('');
  const [signalLive,      setSignalLive]        = useState(false);
  const [signalWorking,   setSignalWorking]     = useState(false);

  const SIGNAL_WORKER = 'https://psc-upload-worker.psoulc.workers.dev';

  const handleGoLive = async () => {
    setSignalWorking(true);
    try {
      await fetch(`${SIGNAL_WORKER}/signal`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_live: 1, title: signalTitle.trim() || 'THE SIGNAL' }),
      });
      setSignalLive(true);
      setIsBroadcasting(true);
      onBroadcast?.();
      announce('The Signal is live.');
    } catch (_) {} finally { setSignalWorking(false); }
  };

  const handleEndSignal = async () => {
    setSignalWorking(true);
    try {
      await fetch(`${SIGNAL_WORKER}/signal`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_live: 0, title: null }),
      });
      setSignalLive(false);
      setIsBroadcasting(false);
      announce('The Signal ended.');
    } catch (_) {} finally { setSignalWorking(false); }
  };

  const handleBroadcast = () => setShowSignalPanel(true);

  const handleRecordToggle = () => {
    setIsRecording((prev) => {
      const next = !prev;
      announce(`Record ${next ? "armed" : "stopped"}.`);
      return next;
    });
  };

  const handleQuantizeToggle = () => {
    setQuantizeEnabled((prev) => {
      const next = !prev;
      announce(`Quantize ${next ? "enabled" : "disabled"}.`);
      return next;
    });
  };

  const handleTrackSelect = (track) => {
    setSelectedTrackId(track.id);
    setActiveVault(track.vault || null);
    announce(`${track.title || "Track"} selected.`);
  };

  const handleTrackDoubleClick = (track) => {
    setSelectedTrackId(track.id);
    setActiveVault(track.vault || null);
    loadAndPlay(track);
  };

  const pushTrackHistory = (track) => {
    if (!historyEnabled) return;
    setTrackHistory((prev) => {
      const next = [track.id, ...prev.filter((id) => id !== track.id)].slice(
        0,
        50,
      );
      return next;
    });
  };

  const handlePreviewTrack = (track) => {
    loadAndPlay(track);
  };

  const handlePrepareSelected = () => {
    if (!selectedTrackId) {
      announce("Select a track before adding to prepare queue.");
      return;
    }
    setPrepareQueue((prev) =>
      prev.includes(selectedTrackId) ? prev : [...prev, selectedTrackId],
    );
    announce("Track added to prepare queue.");
  };

  const handleLoadDeck = () => {
    if (!selectedTrackId) {
      announce("Select a track before loading deck.");
      return;
    }
    const track = trackListData.find((t) => t.id === selectedTrackId);
    if (track) loadToDeck(track);
  };

  const handleTrackAction = (track) => {
    const inPrepare = prepareQueue.includes(track.id);
    if (inPrepare) {
      setPrepareQueue((prev) => prev.filter((id) => id !== track.id));
      announce(`${track.title || "Track"} removed from prepare queue.`);
    } else {
      setPrepareQueue((prev) => [...prev, track.id]);
      announce(`${track.title || "Track"} added to prepare queue.`);
    }
  };

  const handleRegenerateWaveform = async (track) => {
    if (regeneratingWaveforms[track.id]) return;
    const url = getAudioUrl(track.audio_path);
    if (!url) {
      announce("No audio file for this track.");
      return;
    }
    setRegeneratingWaveforms((prev) => ({ ...prev, [track.id]: true }));
    announce(`Analyzing waveform for ${track.title || "track"}…`);
    try {
      await generateAndSaveWaveform(track.id, url);
      const refreshed = await fetchAllTracks();
      setTrackListData(refreshed);
      if (loadedDeckId === track.id) {
        const updated = refreshed.find((t) => t.id === track.id);
        if (updated) setLoadedTrack(updated);
      }
      announce(`Waveform generated for ${track.title || "track"}.`);
    } catch (err) {
      announce(`Waveform generation failed: ${err.message}`);
    } finally {
      setRegeneratingWaveforms((prev) => {
        const next = { ...prev };
        delete next[track.id];
        return next;
      });
    }
  };

  const handleHotCueClick = (num) => {
    if (!loadedTrack) {
      announce("Load a track before setting hot cues.");
      return;
    }
    const trackId = loadedTrack.id;
    const trackCues = hotCues[trackId] || {};
    const existingCue = trackCues[num];

    if (existingCue) {
      // Jump to existing cue
      handleSeek(existingCue.time);
      announce(`Jumped to hot cue ${num}.`);
    } else {
      // Set new cue at current time
      const time = currentTime;
      const updated = {
        ...hotCues,
        [trackId]: {
          ...trackCues,
          [num]: { time },
        },
      };
      setHotCues(updated);
      localStorage.setItem("psc_hotcues", JSON.stringify(updated));
      announce(
        `Hot cue ${num} set at ${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, "0")}.`,
      );
    }
  };

  const clearHotCue = (num, e) => {
    e.stopPropagation();
    if (!loadedTrack) return;
    const trackId = loadedTrack.id;
    const trackCues = hotCues[trackId] || {};
    if (!trackCues[num]) return;

    const { [num]: removed, ...remaining } = trackCues;
    const updated = { ...hotCues, [trackId]: remaining };
    setHotCues(updated);
    localStorage.setItem("psc_hotcues", JSON.stringify(updated));
    announce(`Hot cue ${num} cleared.`);
  };

  const filteredTracks = trackListData
    .filter((t) => t.vault === activeLibVault)
    .filter(
      (t) =>
        !libSearch ||
        t.title?.toLowerCase().includes(libSearch.toLowerCase()) ||
        t.artist?.toLowerCase().includes(libSearch.toLowerCase()),
    )
    .filter((t) => !smartCrates || (Number(t.bpm) || 0) >= 120);

  const visibleTracks = [...filteredTracks].sort((a, b) => {
    if (sortMode === "recent") {
      return (
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
      );
    }
    return (Number(b.bpm) || 0) - (Number(a.bpm) || 0);
  });

  const handleExplore = () => {
    if (!activeVault) return;
    onExplorePlanet?.(activeVault);
    announce(`Opening ${vaultLabel(activeVault)}.`);
  };

  const handleVoidProtocol = () => {
    if (!activeVault) return;
    setShowVoidConfirm(true);
    announce(
      `Void protocol confirmation opened for ${vaultLabel(activeVault)}.`,
    );
  };

  const handleRosterAdd = (e) => {
    e.preventDefault();
    if (!rosterName.trim()) return;
    const planet =
      rosterTier === "C"
        ? rosterMoon.trim()
          ? `${LOCKBOX_PREFIX}${rosterMoon.trim().toLowerCase()}`
          : null
        : rosterPlanet || null;
    const code = addMember(
      rosterName.trim(),
      planet,
      "L",
      rosterTier,
      rosterCode || null,
    );
    setRosterFlash({ name: rosterName.trim(), code });
    setRosterName("");
    setRosterPlanet("");
    setRosterMoon("");
    setRosterCode("");
    setRosterTier("B");
    setRosterShowAdd(false);
    announce(`${rosterName.trim()} added to roster with tier ${rosterTier}.`);
  };
  const handleMatrixToggle = (memberId, perm) => {
    if (!matrixArmed) return;
    const member = members.find((m) => m.id === memberId);
    if (!member) return;
    const tierDefaults = tierDefaultsForMember(member.tier);
    const current = resolveMatrixPerm({
      pendingEntry: matrixPending[memberId],
      committedEntry: matrixCommitted[memberId],
      tierDefaults,
      perm,
    });
    const nextValue = !current;
    announce(
      `${member.name || "Member"} ${perm} permission ${nextValue ? "enabled" : "disabled"} (pending).`,
    );
    setMatrixPending((prev) => {
      return toggleMatrixPerm({
        pending: prev,
        committed: matrixCommitted,
        memberId,
        perm,
        tierDefaults,
      });
    });
  };

  const handleMatrixArm = () => {
    setMatrixArmed(true);
    announce("Matrix armed. Permission cells unlocked.");
  };

  const handleMatrixCommit = () => {
    const pendingCount = Object.keys(matrixPending).length;
    const nextState = commitMatrixState({
      history: matrixHistory,
      committed: matrixCommitted,
      pending: matrixPending,
    });
    setMatrixHistory(nextState.history);
    setMatrixCommitted(nextState.committed);
    setMatrixPending(nextState.pending);
    setMatrixArmed(false);
    announce(
      `Matrix committed. ${pendingCount} member ${pendingCount === 1 ? "change" : "changes"} applied.`,
    );
  };

  const handleMatrixDisarm = () => {
    setMatrixPending({});
    setMatrixArmed(false);
    announce("Matrix disarmed. Pending changes cleared.");
  };

  const handleMatrixRollback = () => {
    const nextState = rollbackMatrixState({ history: matrixHistory });
    if (!nextState.didRollback) {
      announce("No rollback snapshot available.");
      return;
    }
    setMatrixCommitted(nextState.committed);
    setMatrixHistory(nextState.history);
    setMatrixPending({});
    setMatrixArmed(false);
    announce("Matrix rolled back to previous committed state.");
  };

  // Effective permission for a member in the matrix (committed overrides tier defaults)
  const matrixPerm = (memberId, perm, tierDefault) => {
    return resolveMatrixPerm({
      pendingEntry: matrixPending[memberId],
      committedEntry: matrixCommitted[memberId],
      tierDefaults: { [perm]: tierDefault },
      perm,
    });
  };

  const confirmVoidProtocol = () => {
    if (!activeVault) return;
    const record = {
      id: `protocol-${Date.now()}`,
      label: `${vaultLabel(activeVault)} PROTOCOL`,
      name: `${vaultLabel(activeVault)} PROTOCOL`,
      metadata: { type: "void-protocol" },
    };
    voidItem(record, activeVault);
    setShowArchive(true);
    setShowVoidConfirm(false);
    announce(`${vaultLabel(activeVault)} protocol moved to archive log.`);
  };

  const handlePowerDown = () => {
    setShowPowerConfirm(true);
    announce("Power down confirmation opened.");
  };

  const confirmPowerDown = () => {
    announce("Powering down Architect terminal.");
    onPowerDown?.();
  };

  useEffect(() => {
    const onEscape = (event) => {
      if (event.key !== "Escape") return;
      if (showPowerConfirm) {
        setShowPowerConfirm(false);
        announce("Power down confirmation dismissed.");
        return;
      }
      if (showVoidConfirm) {
        setShowVoidConfirm(false);
        announce("Void protocol confirmation dismissed.");
        return;
      }
      if (showArchive) {
        setShowArchive(false);
        announce("Archive log closed.");
        return;
      }
      if (showInbox) {
        setShowInbox(false);
        announce("Vetting Queue closed.");
        return;
      }
      if (showComments) {
        setShowComments(false);
        announce("Transmissions closed.");
        return;
      }
      if (showMatrix) {
        setShowMatrix(false);
        announce("Command matrix closed.");
        return;
      }
      if (showRoster) {
        setShowRoster(false);
        announce("Roster closed.");
        return;
      }
      if (showTrackList) {
        setShowTrackList(false);
        announce("Track registry closed.");
        return;
      }
      if (showSettings) {
        setShowSettings(false);
        announce("Settings closed.");
      }
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [
    showArchive,
    showComments,
    showInbox,
    showMatrix,
    showPowerConfirm,
    showRoster,
    showSettings,
    showTrackList,
    showVoidConfirm,
  ]);

  return (
    <motion.div
      className="architect-console"
      initial={{ opacity: 0, filter: "brightness(0) blur(8px)" }}
      animate={{ opacity: 1, filter: "brightness(1) blur(0px)" }}
      transition={{ duration: 1.8, ease: [0.05, 0.9, 0.2, 1] }}
    >
      <div className="arch-grain-layer" />
      <PSCWordmark />
      <div className="arch-cursor-ball" ref={cursorRef} aria-hidden="true" />
      <div
        style={SR_ONLY_STYLE}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {liveAnnouncement}
      </div>

      {/* ── TOP RAIL ─────────────────────────────────────────────────── */}
      <header className="arch-top-rail">
        <div className="arch-top-identity">
          <span className="arch-top-dot" />
          <span className="arch-top-name">
            {viewer} · {viewer === "D" ? "SOVEREIGN" : "ARCHITECT"}
          </span>
          <span className="arch-top-tier">GOD MODE PLUS</span>
        </div>

        <div className="arch-top-system" aria-label="System status">
          <span className="arch-mode-tag">PERFORMANCE MODE</span>
          <div className="arch-vu-block" aria-label="Master meter">
            <span className="arch-vu-label">MASTER</span>
            <span className="arch-vu-meter">
              <i className="arch-vu-seg on" />
              <i className="arch-vu-seg on" />
              <i className="arch-vu-seg on" />
              <i className="arch-vu-seg" />
              <i className="arch-vu-seg" />
              <i className="arch-vu-seg" />
            </span>
          </div>
          <span className="arch-status-pill">SYSTEM LOCK: SECURE</span>
        </div>

        <nav className="arch-top-actions" aria-label="Architect controls">
          <button
            className={`arch-rail-btn ${isRecording ? "active" : ""}`}
            aria-label="Record"
            onClick={handleRecordToggle}
          >
            REC
          </button>
          <DirectLinePanel
            viewer={viewer}
            variant={viewer === "D" ? "analog" : "architect"}
          />
          <button className="arch-rail-btn arch-intake-btn" onClick={onIntake}>
            INTAKE
          </button>

          <ConduitSlider
            onBroadcast={handleBroadcast}
            isBroadcasting={isBroadcasting}
          />

          {unreadCountL > 0 && (
            <button
              className="arch-rail-btn arch-badge-btn"
              onClick={toggleInbox}
              aria-expanded={showInbox}
            >
              QUEUE <span className="arch-badge">{unreadCountL}</span>
            </button>
          )}

          {unreadCommentCount > 0 && (
            <button
              className="arch-rail-btn arch-badge-btn"
              onClick={toggleComments}
              aria-expanded={showComments}
            >
              TRANSMISSIONS{" "}
              <span className="arch-badge">{unreadCommentCount}</span>
            </button>
          )}

          <button
            className="arch-rail-btn arch-exit-btn"
            onClick={handlePowerDown}
          >
            EXIT SYSTEM
          </button>
          <button
            className="arch-rail-btn"
            onClick={toggleSettings}
            aria-expanded={showSettings}
          >
            SETUP
          </button>
        </nav>
      </header>

      {/* ── DECK ZONE ────────────────────────────────────────────────── */}
      <section className="arch-deck-zone" aria-label="Deck">
        <div className="arch-deck-meta">
          <div className="arch-deck-title">
            {loadedTrack ? loadedTrack.title : "—"}
          </div>
          <div className="arch-deck-artist">
            {loadedTrack ? loadedTrack.artist || "—" : "—"}
          </div>
          <div className="arch-deck-stats">
            <span className="arch-stat">
              BPM <strong>{loadedTrack?.bpm || "—"}</strong>
            </span>
            <span className="arch-stat">
              KEY <strong>—</strong>
            </span>
            <span
              className={`arch-stat arch-elapsed${isPlaying ? " arch-elapsed--playing" : ""}`}
            >
              {formatTime(currentTime)}
            </span>
            <span className="arch-stat-sep">/</span>
            <span className="arch-stat arch-remaining">
              {audioDuration > 0
                ? `-${formatTime(audioDuration - currentTime)}`
                : "—:——"}
            </span>
            {audioLoading && (
              <span className="arch-stat arch-loading-tag">LOADING…</span>
            )}
            {audioError && (
              <span className="arch-stat arch-error-tag" title={audioError}>
                ERR
              </span>
            )}
          </div>
        </div>

        <div
          className="arch-deck-tools"
          role="group"
          aria-label="Deck state controls"
        >
          <button
            className={`arch-deck-tool-btn ${quantizeEnabled ? "active" : ""}`}
            onClick={handleQuantizeToggle}
          >
            QUANTIZE
          </button>
          <button className="arch-deck-tool-btn">RELOAD</button>
        </div>

        {/* Main waveform — real audio analysis with playhead */}
        <div className="arch-waveform-main" aria-hidden="true">
          {!loadedTrack ? (
            <div className="arch-deck-empty-state">
              NO TRACK LOADED · SELECT FROM LIBRARY
            </div>
          ) : (
            <DeckWaveform
              waveformData={
                loadedTrack?.waveform_data
                  ? JSON.parse(loadedTrack.waveform_data).high
                  : null
              }
              currentTime={currentTime}
              duration={audioDuration}
              onSeek={handleSeek}
              trackId={loadedTrack?.id || "default"}
              width={800}
              height={120}
              hotCues={loadedTrack ? hotCues[loadedTrack.id] || {} : {}}
              cueColors={SERATO_COLORS}
            />
          )}
        </div>

        {/* Track metadata display */}
        {loadedTrack && (
          <div className="arch-deck-metadata">
            <span className="arch-meta-title">
              {loadedTrack.title || "UNTITLED"}
            </span>
            {loadedTrack.artist && (
              <>
                <span className="arch-meta-sep"> · </span>
                <span className="arch-meta-artist">{loadedTrack.artist}</span>
              </>
            )}
            {loadedTrack.bpm && (
              <>
                <span className="arch-meta-sep"> · </span>
                <span className="arch-meta-bpm">
                  {Math.round(loadedTrack.bpm)} BPM
                </span>
              </>
            )}
            {loadedTrack.uploaded_by && (
              <>
                <span className="arch-meta-sep"> · </span>
                <span className="arch-meta-uploader">
                  UPLOADED BY {loadedTrack.uploaded_by}
                </span>
              </>
            )}
          </div>
        )}

        {/* Overview strip — low-res waveform */}
        <div className="arch-waveform-overview" aria-hidden="true">
          {(() => {
            const overviewData = loadedTrack?.waveform_data
              ? JSON.parse(loadedTrack.waveform_data).low
              : null;
            if (overviewData && Array.isArray(overviewData)) {
              return overviewData.map((d, i) => (
                <span
                  key={i}
                  className="arch-overview-bar"
                  style={{
                    "--bar-h": `${d.peak * 100}%`,
                    backgroundColor: d.freq,
                  }}
                />
              ));
            }
            // Fallback to placeholder
            return waveformBars.map((h, i) => (
              <span
                key={i}
                className="arch-overview-bar"
                style={{ "--bar-h": `${h}%` }}
              />
            ));
          })()}
          <div
            className="arch-playhead"
            style={{
              left: `${audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0}%`,
            }}
          />
        </div>

        <div
          className="arch-deck-edit"
          role="group"
          aria-label="Waveform edit controls"
        >
          <div className="arch-cue-markers">
            <span className="arch-cue-tag">CUE</span>
            <button className="arch-deck-mini-btn">A</button>
            <button className="arch-deck-mini-btn">B</button>
            <button className="arch-deck-mini-btn">C</button>
            <button className="arch-deck-mini-btn">D</button>
          </div>
          <div className="arch-loop-region">
            <span className="arch-cue-tag">LOOP REGION</span>
            <button className="arch-deck-mini-btn">SET START</button>
            <button className="arch-deck-mini-btn">SET END</button>
            <button className="arch-deck-mini-btn">CLEAR</button>
          </div>
          <div className="arch-needle-zoom">
            <button className="arch-deck-mini-btn">NEEDLE DROP</button>
            <button className="arch-deck-mini-btn">ZOOM -</button>
            <button className="arch-deck-mini-btn">ZOOM +</button>
          </div>
        </div>
      </section>

      {/* ── TRANSPORT BAR ───────────────────────────────────────────── */}
      <div
        className="arch-transport"
        role="toolbar"
        aria-label="Transport controls"
      >
        <div
          className="arch-transport-cluster"
          role="group"
          aria-label="Playback"
        >
          <button
            className={`arch-transport-btn arch-play-btn${isPlaying ? " active" : ""}${audioLoading ? " loading" : ""}`}
            aria-label={isPlaying ? "Pause" : "Play"}
            aria-pressed={isPlaying}
            onClick={handlePlayPause}
            disabled={audioLoading}
          >
            <span className="arch-play-icon">{isPlaying ? "⏸" : "▶"}</span>{" "}
            {isPlaying ? "PAUSE" : "PLAY"}
          </button>
          <button
            className="arch-transport-btn arch-cue-btn"
            aria-label="Cue"
            onClick={handleCue}
            disabled={audioLoading || !audioEngine.isLoaded()}
          >
            ■ CUE
          </button>
        </div>

        <div className="arch-hotcues" role="group" aria-label="Hot cues">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => {
            const trackCues = loadedTrack ? hotCues[loadedTrack.id] || {} : {};
            const cue = trackCues[n];
            const color = SERATO_COLORS[n - 1];
            return (
              <button
                key={n}
                className={`arch-hotcue ${cue ? "has-cue" : ""}`}
                aria-label={`Hot cue ${n}`}
                onClick={() => handleHotCueClick(n)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  clearHotCue(n, e);
                }}
                style={{
                  "--cue-color": color,
                  backgroundColor: cue ? color : "transparent",
                  borderColor: color,
                }}
              >
                {n}
              </button>
            );
          })}
        </div>

        <div
          className="arch-loop-controls"
          role="group"
          aria-label="Loop controls"
        >
          <button className="arch-loop-btn">AUTO 8</button>
          <button className="arch-loop-btn">½</button>
          <button className="arch-loop-btn arch-loop-in">IN</button>
          <button className="arch-loop-btn arch-loop-out">OUT</button>
          <button className="arch-loop-btn">×2</button>
          <button className="arch-loop-btn">RELOOP</button>
        </div>

        <div className="arch-transport-spacer" />

        <div
          className="arch-transport-cluster"
          role="group"
          aria-label="Performance modes"
        >
          <button
            className={`arch-mode-btn ${activePerfMode === "hotcue" ? "active" : ""}`}
            onClick={() => setActivePerfMode("hotcue")}
          >
            HOT CUE
          </button>
          <button
            className={`arch-mode-btn ${activePerfMode === "loop" ? "active" : ""}`}
            onClick={() => setActivePerfMode("loop")}
          >
            LOOP
          </button>
        </div>
      </div>

      <div className="arch-monitor-strip" role="group" aria-label="Monitoring">
        <div className="arch-monitor-vu">
          <span className="arch-monitor-label">VU</span>
          <span className="arch-monitor-meter">
            <i className="arch-vu-seg on" />
            <i className="arch-vu-seg on" />
            <i className="arch-vu-seg on" />
            <i className="arch-vu-seg on" />
            <i className="arch-vu-seg" />
            <i className="arch-vu-seg" />
          </span>
        </div>
        <div className="arch-monitor-eq">
          <button className="arch-monitor-btn">EQ HI</button>
          <button className="arch-monitor-btn">EQ MID</button>
          <button className="arch-monitor-btn">EQ LOW</button>
          <button className="arch-monitor-btn">FILTER</button>
          <button className="arch-monitor-btn">GAIN</button>
          <button className="arch-monitor-btn">MASTER</button>
          <button className="arch-monitor-btn">HEADPHONE</button>
        </div>
        <div className="arch-monitor-vol" role="group" aria-label="Volume">
          <span className="arch-monitor-label">VOL</span>
          <input
            type="range"
            className="arch-vol-slider"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            aria-label="Master volume"
          />
          <span className="arch-vol-val">{Math.round(volume * 100)}</span>
        </div>
      </div>

      {/* ── LOWER ZONE ──────────────────────────────────────────────── */}
      <div className="arch-lower-zone">
        {/* ARCHITECT RAIL — sovereign controls */}
        <aside className="arch-rail" aria-label="Architect controls">
          <div className="arch-rail-section-label">SOVEREIGN</div>

          <button
            className={`arch-rail-toggle ${showArchive ? "active" : ""}`}
            onClick={toggleArchive}
            aria-expanded={showArchive}
          >
            <span className="arch-rail-icon">◉</span>
            ARCHIVE LOG
            {architectArchive.filter((i) => !i.restored).length > 0 && (
              <span className="arch-badge">
                {architectArchive.filter((i) => !i.restored).length}
              </span>
            )}
          </button>

          <button
            className={`arch-rail-toggle ${showRoster ? "active" : ""}`}
            onClick={toggleRoster}
            aria-expanded={showRoster}
          >
            <span className="arch-rail-icon">◎</span>
            ROSTER
            <span className="arch-badge">{members.length}</span>
          </button>

          <button
            className={`arch-rail-toggle ${showMatrix ? "active" : ""} ${matrixArmed ? "arch-armed" : ""}`}
            onClick={toggleMatrix}
            aria-expanded={showMatrix}
          >
            <span className="arch-rail-icon">⊞</span>
            CMD MATRIX
          </button>

          <button
            className={`arch-rail-toggle ${showInbox ? "active" : ""}`}
            onClick={toggleInbox}
            aria-expanded={showInbox}
          >
            <span className="arch-rail-icon">◈</span>
            VETTING QUEUE
            {unreadCountL > 0 && (
              <span className="arch-badge">{unreadCountL}</span>
            )}
          </button>

          <div className="arch-rail-divider" />
          <div className="arch-rail-section-label">VAULT</div>

          <button
            className={`arch-rail-toggle ${showTrackList ? "active" : ""}`}
            onClick={toggleTrackList}
            aria-expanded={showTrackList}
          >
            <span className="arch-rail-icon">▤</span>
            TRACK REGISTRY
            {trackListData.length > 0 && (
              <span className="arch-badge">{trackListData.length}</span>
            )}
          </button>

          <div className="arch-rail-divider" />
          <div className="arch-rail-section-label">COMMAND</div>

          <button
            className="arch-rail-cmd"
            disabled={!activeVault}
            onClick={handleExplore}
          >
            OPEN {activeVault ? `→ ${vaultLabel(activeVault)}` : "VAULT"}
          </button>
          <button
            className="arch-rail-cmd arch-rail-void"
            disabled={!activeVault}
            onClick={handleVoidProtocol}
          >
            VOID PROTOCOL
          </button>
        </aside>

        {/* LIBRARY PANEL */}
        <main className="arch-library" aria-label="Vault library">
          {/* Vault tab selector — magnetic glider (Animation 3) */}
          <div
            className="arch-vault-tabs"
            role="tablist"
            aria-label="Vault selector"
          >
            <span
              className="arch-tab-glider"
              ref={gliderRef}
              aria-hidden="true"
            />
            {VAULT_ROUTES.map((v, i) => (
              <button
                key={v.id}
                ref={(el) => (tabRefs.current[i] = el)}
                role="tab"
                className={`arch-vault-tab ${activeLibVault === v.id ? "active" : ""}`}
                style={{ "--vault-color": v.color }}
                aria-selected={activeLibVault === v.id}
                onClick={() => {
                  onExplorePlanet?.({ id: v.id });
                  announce(`Opening ${v.label}.`);
                }}
                onMouseEnter={() => hoverGlider(i)}
                onMouseLeave={() =>
                  moveGlider(
                    VAULT_ROUTES.findIndex((r) => r.id === activeLibVault),
                  )
                }
              >
                <span className="arch-vault-pip" aria-hidden="true" />
                {v.label}
              </button>
            ))}
          </div>

          <div
            className="arch-browser-utility"
            role="toolbar"
            aria-label="Library controls"
          >
            <div className="arch-browser-group">
              <button className="arch-browser-btn">BACK</button>
              <button className="arch-browser-btn">FWD</button>
              <button className="arch-browser-btn">FILES</button>
              <button className="arch-browser-btn active">CRATES</button>
            </div>
            <div className="arch-browser-group">
              <button
                className={`arch-browser-btn ${sortMode === "bpm" ? "active" : ""}`}
                onClick={() => setSortMode("bpm")}
              >
                SORT: BPM
              </button>
              <button
                className={`arch-browser-btn ${smartCrates ? "active" : ""}`}
                onClick={() => setSmartCrates((prev) => !prev)}
              >
                SMART CRATES
              </button>
              <button
                className={`arch-browser-btn ${historyEnabled ? "active" : ""}`}
                onClick={() => setHistoryEnabled((prev) => !prev)}
              >
                HISTORY
              </button>
              <button
                className="arch-browser-btn"
                onClick={handlePrepareSelected}
              >
                PREPARE{" "}
                {prepareQueue.length > 0 ? `(${prepareQueue.length})` : ""}
              </button>
              <button
                className={`arch-browser-btn ${loadedDeckId && selectedTrackId === loadedDeckId ? "active" : ""}`}
                onClick={handleLoadDeck}
              >
                LOAD DECK
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="arch-lib-search-row">
            <input
              className="arch-lib-search"
              placeholder="SEARCH VAULT"
              value={libSearch}
              onChange={(e) => setLibSearch(e.target.value)}
              aria-label="Search tracks"
            />
            {libSearch && (
              <button
                className="arch-lib-clear"
                onClick={() => setLibSearch("")}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Track list — phosphor scan animation (Animation 1) */}
          <div className="arch-track-list" role="table" aria-label="Track list">
            <div className="arch-track-list-head" role="row">
              <span role="columnheader">TITLE</span>
              <span role="columnheader">ARTIST</span>
              <span role="columnheader">BPM</span>
              <span role="columnheader">KEY</span>
              <span role="columnheader">LENGTH</span>
              <span role="columnheader">ADDED</span>
              <span role="columnheader">PLAYS</span>
              <span role="columnheader">STATE</span>
              <span role="columnheader">PREVIEW</span>
              <span role="columnheader">ACTIONS</span>
            </div>
            <div className="arch-track-list-body">
              {trackListLoading ? (
                <div className="arch-lib-empty">QUERYING VAULT…</div>
              ) : visibleTracks.length === 0 ? (
                <div className="arch-lib-empty">
                  — NO TRACKS IN {vaultLabel(activeLibVault)} —
                </div>
              ) : (
                visibleTracks.map((t, i) => {
                  // Get waveform preview data (low-res)
                  let previewData = null;
                  if (t.waveform_data) {
                    try {
                      const parsed = JSON.parse(t.waveform_data);
                      previewData = parsed.low;
                    } catch (_) {
                      // Invalid JSON, use placeholder
                    }
                  }
                  const previewBars =
                    previewData ||
                    getWaveformBars(String(t.id || t.title || i), 8).map(
                      (h) => ({ peak: h / 100, freq: "#666666" }),
                    );

                  return (
                    <div
                      key={t.id}
                      className={`arch-track-row arch-track-row-${trackColorRows ? t.vault || "generic" : "generic"} ${selectedTrackId === t.id ? "selected" : ""} ${loadedDeckId === t.id ? "loaded" : ""}`}
                      role="row"
                      style={{ "--row-i": i }}
                      onClick={() => handleTrackSelect(t)}
                      onDoubleClick={() => handleTrackDoubleClick(t)}
                    >
                      <span className="arch-track-title" role="cell">
                        {t.title || "—"}
                      </span>
                      <span className="arch-track-artist" role="cell">
                        {t.artist || "—"}
                      </span>
                      <span className="arch-track-bpm" role="cell">
                        {t.bpm || "—"}
                      </span>
                      <span className="arch-track-key" role="cell">
                        —
                      </span>
                      <span className="arch-track-len" role="cell">
                        —:——
                      </span>
                      <span className="arch-track-date" role="cell">
                        {t.created_at
                          ? new Date(t.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "2-digit",
                            })
                          : "—"}
                      </span>
                      <span className="arch-track-plays" role="cell">
                        {trackPlayCounts[t.id] || 0}
                      </span>
                      <span className="arch-track-state" role="cell">
                        <i className="arch-state-dot" />
                        {(trackPlayCounts[t.id] || 0) > 0
                          ? "PLAYED"
                          : "UNPLAYED"}
                      </span>
                      <span className="arch-track-preview" role="cell">
                        <span
                          className="arch-track-wave-mini"
                          aria-hidden="true"
                        >
                          {previewBars.map((d, pi) => {
                            const height =
                              typeof d === "object" ? d.peak * 100 : d;
                            const color =
                              typeof d === "object" ? d.freq : "#666666";
                            return (
                              <i
                                key={`${t.id}-${pi}`}
                                style={{
                                  height: `${Math.max(12, height)}%`,
                                  backgroundColor: color,
                                }}
                              />
                            );
                          })}
                        </span>
                      </span>
                      <span className="arch-track-actions" role="cell">
                        <button
                          className="arch-track-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewTrack(t);
                          }}
                        >
                          ▶
                        </button>
                        <button
                          className="arch-track-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTrackAction(t);
                          }}
                        >
                          {prepareQueue.includes(t.id) ? "−Q" : "+Q"}
                        </button>
                        {!t.waveform_data && (
                          <button
                            className="arch-track-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRegenerateWaveform(t);
                            }}
                            disabled={regeneratingWaveforms[t.id]}
                            title="Generate frequency-colored waveform"
                          >
                            {regeneratingWaveforms[t.id] ? "⏳" : "🌈"}
                          </button>
                        )}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ── PANELS (overlays from right) ──────────────────────────────── */}
      <AnimatePresence>
        {showRoster && (
          <motion.div
            id="arch-roster-zone"
            className="arch-panel-overlay"
            role="dialog"
            aria-label="Roster"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 22 }}
          >
            <div className="arch-panel-header">
              <span className="arch-panel-dot" />
              <span className="arch-panel-title">ROSTER</span>
              <span className="arch-panel-sub">{members.length} MEMBERS</span>
              <button
                className="arch-panel-close"
                onClick={toggleRoster}
                aria-label="Close roster"
              >
                ✕
              </button>
            </div>

            {rosterFlash && (
              <div className="arch-roster-flash">
                <span className="arch-roster-flash-name">
                  {rosterFlash.name}
                </span>
                <span className="arch-roster-flash-code">
                  {rosterFlash.code}
                </span>
                <span className="arch-roster-flash-sub">
                  TRANSMIT TO MEMBER — THEN DISMISS
                </span>
                <button
                  className="arch-roster-flash-dismiss"
                  onClick={() => setRosterFlash(null)}
                >
                  DISMISS
                </button>
              </div>
            )}

            <div className="arch-panel-body">
              <table className="arch-data-table">
                <thead>
                  <tr>
                    <th>TIER</th>
                    <th>HANDLE</th>
                    <th>DOMAIN</th>
                    <th>CODE</th>
                    <th>REGISTERED</th>
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="arch-table-empty">
                        — NO MEMBERS REGISTERED —
                      </td>
                    </tr>
                  ) : (
                    members.map((m) => (
                      <tr key={m.id}>
                        <td className="arch-cell-tier">{m.tier}</td>
                        <td className="arch-cell-handle">{m.name}</td>
                        <td className="arch-cell-domain">
                          {vaultLabel(m.planet)}
                        </td>
                        <td
                          className="arch-cell-code"
                          onMouseEnter={() => setRosterReveal(m.id)}
                          onMouseLeave={() => setRosterReveal(null)}
                          onFocus={() => setRosterReveal(m.id)}
                          onBlur={() => setRosterReveal(null)}
                          tabIndex={0}
                          role="button"
                          aria-pressed={rosterReveal === m.id}
                          aria-label={`Member ${m.name} access code`}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setRosterReveal((p) =>
                                p === m.id ? null : m.id,
                              );
                            }
                            if (e.key === "Escape") setRosterReveal(null);
                          }}
                        >
                          {rosterReveal === m.id ? m.code : "••••"}
                        </td>
                        <td className="arch-cell-date">
                          {new Date(m.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "2-digit",
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="arch-panel-footer-actions">
              {!rosterShowAdd ? (
                <button
                  className="arch-panel-action-btn"
                  onClick={() => setRosterShowAdd(true)}
                >
                  + ADD MEMBER
                </button>
              ) : (
                <form className="arch-add-form" onSubmit={handleRosterAdd}>
                  <input
                    className="arch-form-input"
                    placeholder="HANDLE"
                    value={rosterName}
                    onChange={(e) => setRosterName(e.target.value)}
                    maxLength={64}
                    autoFocus
                    required
                  />
                  <div className="arch-tier-toggle">
                    <button
                      type="button"
                      className={`arch-tier-btn ${rosterTier === "B" ? "active" : ""}`}
                      onClick={() => setRosterTier("B")}
                    >
                      COLLECTIVE
                    </button>
                    <button
                      type="button"
                      className={`arch-tier-btn ${rosterTier === "C" ? "active" : ""}`}
                      onClick={() => setRosterTier("C")}
                    >
                      FEATURED ARTIST
                    </button>
                  </div>
                  {rosterTier === "B" ? (
                    <select
                      className="arch-form-select"
                      value={rosterPlanet}
                      onChange={(e) => setRosterPlanet(e.target.value)}
                    >
                      <option value="">— NO DOMAIN —</option>
                      {VAULT_ROUTES.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="arch-form-input"
                      placeholder="FEATURED TAG"
                      value={rosterMoon}
                      onChange={(e) =>
                        setRosterMoon(e.target.value.toUpperCase())
                      }
                      maxLength={32}
                      required
                    />
                  )}
                  <input
                    className="arch-form-input"
                    placeholder="SET CODE (e.g. 2112)"
                    value={rosterCode}
                    onChange={(e) =>
                      setRosterCode(
                        e.target.value.replace(/\D/g, "").slice(0, 8),
                      )
                    }
                    maxLength={8}
                  />
                  <div className="arch-form-actions">
                    <button
                      type="submit"
                      className="arch-form-commit"
                      disabled={
                        !rosterName.trim() ||
                        (rosterTier === "C" && !rosterMoon.trim())
                      }
                    >
                      COMMIT
                    </button>
                    <button
                      type="button"
                      className="arch-form-cancel"
                      onClick={() => setRosterShowAdd(false)}
                    >
                      CANCEL
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMatrix && (
          <motion.div
            id="arch-matrix-zone"
            className="arch-panel-overlay"
            role="dialog"
            aria-label="CMD Matrix"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 22 }}
          >
            <div className="arch-panel-header">
              <span className="arch-panel-dot" />
              <span className="arch-panel-title">CMD MATRIX</span>
              <span className="arch-panel-sub">
                PERMISSION GRID — ARM TO EDIT
              </span>
              <div className="arch-matrix-interlocks">
                {!matrixArmed ? (
                  <button className="arch-matrix-arm" onClick={handleMatrixArm}>
                    ARM
                  </button>
                ) : (
                  <>
                    <button
                      className="arch-matrix-commit"
                      onClick={handleMatrixCommit}
                      disabled={Object.keys(matrixPending).length === 0}
                    >
                      COMMIT
                    </button>
                    <button
                      className="arch-matrix-cancel"
                      onClick={handleMatrixDisarm}
                    >
                      CANCEL
                    </button>
                  </>
                )}
                <button
                  className="arch-matrix-rollback"
                  onClick={handleMatrixRollback}
                  disabled={matrixHistory.length === 0}
                >
                  ROLLBACK
                </button>
              </div>
              <button
                className="arch-panel-close"
                onClick={toggleMatrix}
                aria-label="Close matrix"
              >
                ✕
              </button>
            </div>

            <div className="arch-panel-body">
              <table className="arch-data-table">
                <thead>
                  <tr>
                    <th>HANDLE</th>
                    <th>TIER</th>
                    <th>DOMAIN</th>
                    <th>VOID</th>
                    <th>TUNE</th>
                    <th>COMMENT</th>
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="arch-table-empty">
                        — NO MEMBERS —
                      </td>
                    </tr>
                  ) : (
                    members.map((m) => {
                      const tierVoid = m.tier === "A" || m.tier === "B";
                      const tierTune = m.tier === "A" || m.tier === "B";
                      const tierComment =
                        m.tier === "A" || m.tier === "B" || m.tier === "C";
                      return (
                        <tr
                          key={m.id}
                          className={
                            matrixPending[m.id] ? "arch-row-pending" : ""
                          }
                        >
                          <td className="arch-cell-handle">{m.name}</td>
                          <td className="arch-cell-tier">{m.tier}</td>
                          <td className="arch-cell-domain">
                            {vaultLabel(m.planet)}
                          </td>
                          {["void", "tune", "comment"].map((perm, i) => {
                            const defaults = [tierVoid, tierTune, tierComment];
                            const active = resolveMatrixPerm({
                              pendingEntry: matrixPending[m.id],
                              committedEntry: matrixCommitted[m.id],
                              tierDefaults: { [perm]: defaults[i] },
                              perm,
                            });
                            const hasPending =
                              matrixPending[m.id]?.[perm] !== undefined;
                            return (
                              <td key={perm}>
                                <button
                                  className={`arch-matrix-cell ${active ? "arch-cell-on" : "arch-cell-off"} ${hasPending ? "arch-cell-pending" : ""} ${!matrixArmed ? "arch-cell-locked" : ""}`}
                                  onClick={() => handleMatrixToggle(m.id, perm)}
                                  disabled={!matrixArmed}
                                  aria-pressed={active}
                                  aria-label={`${m.name} ${perm} ${active ? "enabled" : "disabled"}`}
                                >
                                  {active ? "●" : "○"}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && viewer !== "D" && (
          <AdminSettings
            onClose={toggleSettings}
            members={members}
            waveformDetail={waveformDetail}
            setWaveformDetail={setWaveformDetail}
            trackColorRows={trackColorRows}
            setTrackColorRows={setTrackColorRows}
            quantizeEnabled={quantizeEnabled}
            handleQuantizeToggle={handleQuantizeToggle}
            autoLoopDefault={autoLoopDefault}
            setAutoLoopDefault={setAutoLoopDefault}
            smartCrates={smartCrates}
            setSmartCrates={setSmartCrates}
            historyEnabled={historyEnabled}
            setHistoryEnabled={setHistoryEnabled}
          />
        )}
        {showSettings && viewer === "D" && (
          <motion.div
            className="arch-panel-overlay"
            role="dialog"
            aria-label="Settings"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 22 }}
          >
            <div className="arch-panel-header">
              <span className="arch-panel-dot" />
              <span className="arch-panel-title">PREFERENCES</span>
              <span className="arch-panel-sub">DISPLAY · PLAYBACK · VAULT</span>
              <button className="arch-panel-close" onClick={toggleSettings} aria-label="Close settings">✕</button>
            </div>
            <div className="arch-panel-body arch-settings-body">
              <section className="arch-settings-section">
                <h4 className="arch-settings-title">DISPLAY</h4>
                <div className="arch-settings-row">
                  <span>Waveform Detail</span>
                  <button className={`arch-settings-toggle ${waveformDetail === "high" ? "active" : ""}`} onClick={() => setWaveformDetail(p => p === "high" ? "low" : "high")}>{waveformDetail.toUpperCase()}</button>
                </div>
                <div className="arch-settings-row">
                  <span>Track Color Rows</span>
                  <button className={`arch-settings-toggle ${trackColorRows ? "active" : ""}`} onClick={() => setTrackColorRows(p => !p)}>{trackColorRows ? "ON" : "OFF"}</button>
                </div>
              </section>
              <section className="arch-settings-section">
                <h4 className="arch-settings-title">PLAYBACK</h4>
                <div className="arch-settings-row">
                  <span>Quantize Default</span>
                  <button className={`arch-settings-toggle ${quantizeEnabled ? "active" : ""}`} onClick={handleQuantizeToggle}>{quantizeEnabled ? "ON" : "OFF"}</button>
                </div>
                <div className="arch-settings-row">
                  <span>Auto Loop Default</span>
                  <button className={`arch-settings-toggle ${autoLoopDefault ? "active" : ""}`} onClick={() => setAutoLoopDefault(p => !p)}>{autoLoopDefault ? "ON" : "OFF"}</button>
                </div>
              </section>
              <section className="arch-settings-section">
                <h4 className="arch-settings-title">VAULT</h4>
                <div className="arch-settings-row">
                  <span>Smart Crates</span>
                  <button className={`arch-settings-toggle ${smartCrates ? "active" : ""}`} onClick={() => setSmartCrates(p => !p)}>{smartCrates ? "ENABLED" : "DISABLED"}</button>
                </div>
                <div className="arch-settings-row">
                  <span>Track History</span>
                  <button className={`arch-settings-toggle ${historyEnabled ? "active" : ""}`} onClick={() => setHistoryEnabled(p => !p)}>{historyEnabled ? "ENABLED" : "DISABLED"}</button>
                </div>
              </section>
            </div>
          </motion.div>
        )}

        {showArchive && (
          <>
            <motion.div
              className="arch-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowArchive(false)}
            />
            <EventHorizonPanel
              architectArchive={architectArchive}
              onRestore={restoreItem}
            />
          </>
        )}
        {showInbox && (
          <div id="arch-inbox-panel">
            <InboxPanel viewer={viewer} onClose={() => setShowInbox(false)} />
          </div>
        )}
        {showComments && (
          <div id="arch-comments-panel">
            <CommentPanel
              viewer={viewer}
              onClose={() => setShowComments(false)}
            />
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTrackList && (
          <motion.div
            id="arch-track-list-zone"
            className="arch-panel-overlay"
            role="dialog"
            aria-label="Track Registry"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 22 }}
          >
            <div className="arch-panel-header">
              <span className="arch-panel-dot" />
              <span className="arch-panel-title">TRACK REGISTRY</span>
              <span className="arch-panel-sub">
                {trackListLoading ? "…" : `${trackListData.length} TRACKS`}
              </span>
              <button
                className="arch-panel-close"
                onClick={toggleTrackList}
                aria-label="Close track registry"
              >
                ✕
              </button>
            </div>
            <div className="arch-panel-body">
              <table className="arch-data-table">
                <thead>
                  <tr>
                    <th>TITLE</th>
                    <th>ARTIST</th>
                    <th>BPM</th>
                    <th>VAULT</th>
                    <th>INGESTED</th>
                  </tr>
                </thead>
                <tbody>
                  {trackListLoading ? (
                    <tr>
                      <td colSpan={5} className="arch-table-empty">
                        QUERYING VAULT…
                      </td>
                    </tr>
                  ) : trackListData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="arch-table-empty">
                        — NO TRACKS IN VAULT —
                      </td>
                    </tr>
                  ) : (
                    trackListData.map((t) => (
                      <tr key={t.id}>
                        <td className="arch-cell-handle">{t.title}</td>
                        <td className="arch-cell-domain">{t.artist || "—"}</td>
                        <td className="arch-cell-tier">{t.bpm || "—"}</td>
                        <td className="arch-cell-domain">
                          {vaultLabel(t.vault)}
                        </td>
                        <td className="arch-cell-date">
                          {t.created_at
                            ? new Date(t.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "2-digit",
                                },
                              )
                            : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CONFIRM DIALOGS ───────────────────────────────────────────── */}
      <AnimatePresence>
        {showVoidConfirm && (
          <motion.div
            className="arch-confirm-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="arch-confirm-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="arch-void-title"
              aria-describedby="arch-void-msg"
            >
              <div id="arch-void-title" className="arch-confirm-title">
                INITIATE VOID PROTOCOL?
              </div>
              <div id="arch-void-msg" className="arch-confirm-msg">
                Move {vaultLabel(activeVault)} protocol record into secured
                archive.
              </div>
              <div className="arch-confirm-btns">
                <button
                  className="arch-confirm-yes"
                  onClick={confirmVoidProtocol}
                >
                  CONFIRM
                </button>
                <button
                  className="arch-confirm-no"
                  onClick={() => setShowVoidConfirm(false)}
                >
                  CANCEL
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {showPowerConfirm && (
          <motion.div
            className="arch-confirm-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="arch-confirm-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="arch-power-title"
              aria-describedby="arch-power-msg"
            >
              <div id="arch-power-title" className="arch-confirm-title">
                POWER DOWN ARCHITECT TERMINAL?
              </div>
              <div id="arch-power-msg" className="arch-confirm-msg">
                Return to Gate. Sovereign lock will hold.
              </div>
              <div className="arch-confirm-btns">
                <button className="arch-confirm-yes" onClick={confirmPowerDown}>
                  CONFIRM
                </button>
                <button
                  className="arch-confirm-no"
                  onClick={() => setShowPowerConfirm(false)}
                >
                  CANCEL
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The Signal panel */}
      <AnimatePresence>
        {showSignalPanel && (
          <motion.div
            className="signal-panel-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={e => { if (e.target === e.currentTarget) setShowSignalPanel(false); }}
          >
            <motion.div
              className="signal-panel"
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 16 }}
              transition={{ duration: 0.25 }}
            >
              <div className="signal-panel-header">
                <span className="signal-panel-title">THE SIGNAL</span>
                {signalLive && (
                  <span className="signal-panel-live-badge">
                    <span className="signal-live-dot" aria-hidden="true" /> LIVE
                  </span>
                )}
              </div>

              <div className="signal-panel-field">
                <label className="signal-panel-label">BROADCAST TITLE</label>
                <input
                  className="signal-panel-input"
                  value={signalTitle}
                  onChange={e => setSignalTitle(e.target.value)}
                  placeholder="SOUL PLEASANT LIVE SESSION"
                  maxLength={64}
                  disabled={signalLive}
                  spellCheck={false}
                />
              </div>

              <div className="signal-panel-field">
                <label className="signal-panel-label">OBS SETTINGS (D ONLY)</label>
                <div className="signal-panel-mono">
                  <div>SERVER: rtmps://live.cloudflare.com:443/live/</div>
                  <div>KEY: dede7aa1a5039f9d121f59e924369990</div>
                </div>
              </div>

              <div className="signal-panel-actions">
                {!signalLive ? (
                  <button
                    className="signal-panel-go"
                    onClick={handleGoLive}
                    disabled={signalWorking}
                  >
                    {signalWorking ? 'CONNECTING…' : 'GO LIVE'}
                  </button>
                ) : (
                  <button
                    className="signal-panel-end"
                    onClick={handleEndSignal}
                    disabled={signalWorking}
                  >
                    {signalWorking ? 'ENDING…' : 'END SIGNAL'}
                  </button>
                )}
                <button
                  className="signal-panel-close"
                  onClick={() => setShowSignalPanel(false)}
                >
                  {signalLive ? 'MINIMISE' : 'CANCEL'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isBroadcasting && !showSignalPanel && (
        <button
          className="arch-broadcast-pulse"
          role="status"
          onClick={() => setShowSignalPanel(true)}
          aria-label="The Signal is live — click to manage"
        >
          <span className="signal-live-dot" aria-hidden="true" /> THE SIGNAL IS LIVE
        </button>
      )}
    </motion.div>
  );
}

export default ArchitectConsole;
