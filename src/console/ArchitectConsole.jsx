import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSystem } from "../state/SystemContext";
import "./ArchitectConsole.css";
import InboxPanel from "./InboxPanel";
import DirectLinePanel from "./DirectLinePanel";
import DeckWaveform from "../components/DeckWaveform";
import {
  LOCKBOX_PREFIX,
  VAULT_DISPLAY_NAMES,
  VAULT_ACCENT_COLORS,
  UPLOAD_WORKER_URL,
  UPLOAD_SECRET,
} from "../config";
import {
  tierDefaultsForMember,
  resolveMatrixPerm,
  toggleMatrixPerm,
  commitMatrixState,
  rollbackMatrixState,
} from "./matrixState";
import { fetchAllTracks, getAudioUrl } from "../lib/tracks";
import { getWaveformBars } from "../utils/waveform";
import { generateAndSaveWaveform } from "../lib/waveformAnalyzer";

const ALL_CUE_COLORS = [
  // Bank A (1–8) — Serato canonical
  "#e52020", "#e56020", "#e5a020", "#14dc14",
  "#00c8dc", "#1464dc", "#8c14dc", "#e5e5e5",
  // Bank B (9–16) — Extended palette
  "#ff2d78", "#ff7700", "#e8ff14", "#00ff66",
  "#0099ff", "#cc00ff", "#ff88bb", "#44ffee",
  // Bank C (17–24)
  "#ff4444", "#ff8844", "#ffcc44", "#44ff88",
  "#44ccff", "#4488ff", "#aa44ff", "#ffffff",
  // Bank D (25–32)
  "#cc1111", "#cc5511", "#cc9911", "#11cc55",
  "#11aacc", "#1155cc", "#7711cc", "#aaaaaa",
];

const LOOP_LENGTH_OPTIONS = [
  { id: "1-32", label: "1/32", type: "note", denominator: 32 },
  { id: "1-16", label: "1/16", type: "note", denominator: 16 },
  {
    id: "1-16-d",
    label: "1/16 D",
    type: "note",
    denominator: 16,
    dotted: true,
  },
  {
    id: "1-16-t",
    label: "1/16 T",
    type: "note",
    denominator: 16,
    triplet: true,
  },
  { id: "1-8", label: "1/8", type: "note", denominator: 8 },
  { id: "1-8-d", label: "1/8 D", type: "note", denominator: 8, dotted: true },
  { id: "1-8-t", label: "1/8 T", type: "note", denominator: 8, triplet: true },
  { id: "1-4", label: "1/4", type: "note", denominator: 4 },
  { id: "1-4-d", label: "1/4 D", type: "note", denominator: 4, dotted: true },
  { id: "1-4-t", label: "1/4 T", type: "note", denominator: 4, triplet: true },
  { id: "1-2", label: "1/2", type: "note", denominator: 2 },
  { id: "0-bar", label: "0 BAR", type: "beats", beats: 4 },
  { id: "1-bar", label: "1 BAR", type: "bars", bars: 1 },
  { id: "2-bars", label: "2 BARS", type: "bars", bars: 2 },
  { id: "4-bars", label: "4 BARS", type: "bars", bars: 4 },
  { id: "8-bars", label: "8 BARS", type: "bars", bars: 8 },
];
import * as audioEngine from "../lib/audioEngine";
import useAudioAnalyzer from "./useAudioAnalyzer";
import AdminSettings from "../admin/AdminSettings";
import PSCWordmark from "../components/PSCWordmark";

const VAULT_ROUTES = [
  {
    id: "venus",
    label: VAULT_DISPLAY_NAMES.venus,
    color: VAULT_ACCENT_COLORS.venus,
  },
  {
    id: "saturn",
    label: VAULT_DISPLAY_NAMES.saturn,
    color: VAULT_ACCENT_COLORS.saturn,
  },
  {
    id: "mercury",
    label: VAULT_DISPLAY_NAMES.mercury,
    color: VAULT_ACCENT_COLORS.mercury,
  },
  {
    id: "earth",
    label: VAULT_DISPLAY_NAMES.earth,
    color: VAULT_ACCENT_COLORS.earth,
  },
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

function parseWaveformData(rawWaveform) {
  if (!rawWaveform) return null;
  try {
    return typeof rawWaveform === "string"
      ? JSON.parse(rawWaveform)
      : rawWaveform;
  } catch {
    return null;
  }
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
          <div className="arch-horizon-empty">— ARCHIVE CLEAR —</div>
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
    voidItem,
    addMember,
    tracks: vaultTracksState,
  } = useSystem();
  const MATRIX_COMMITTED_KEY = "psc_matrix_committed";
  const MATRIX_HISTORY_KEY = "psc_matrix_history";
  const ARCH_PREFS_KEY = "psc_architect_prefs";
  const ARCH_RUNTIME_KEY = "psc_architect_runtime";
  const [showArchive, setShowArchive] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [showRoster, setShowRoster] = useState(false);
  const [activeVault, setActiveVault] = useState(null);
  const [activeLibVault, setActiveLibVault] = useState(VAULT_ROUTES[0].id);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [showPowerConfirm, setShowPowerConfirm] = useState(false);
  const [showVoidConfirm, setShowVoidConfirm] = useState(false);
  const [showTrackList, setShowTrackList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [trackListData, setTrackListData] = useState([]);
  const [trackListLoading, setTrackListLoading] = useState(false);
  const [trackLoadError, setTrackLoadError] = useState(null);
  const [sortMode, setSortMode] = useState("recent");
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
  const [selectedTrackIds, setSelectedTrackIds] = useState(new Set());
  const [publishFilter, setPublishFilter] = useState("all");
  const [editingTrackId, setEditingTrackId] = useState(null);
  const [editingValues, setEditingValues] = useState({});
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
  const [activeCueBank, setActiveCueBank] = useState("A");
  const [loopRegion, setLoopRegion] = useState({ start: null, end: null });
  const [showLoopMenu, setShowLoopMenu] = useState(false);
  const [selectedLoopLengthId, setSelectedLoopLengthId] = useState("1-4");
  const loopActiveRef = useRef(false);
  const loopMenuRef = useRef(null);
  const rafRef = useRef(null);
  const announceTimerRef = useRef(null);
  const tabRefs = useRef([]);
  const gliderRef = useRef(null);
  const cursorRef = useRef(null);
  const cursorPos = useRef({ x: -200, y: -200 });
  const selectedTrack = useMemo(
    () => trackListData.find((t) => t.id === selectedTrackId) || null,
    [trackListData, selectedTrackId],
  );
  const deckTrack = selectedTrack || loadedTrack;
  const loadedWaveform = useMemo(
    () => parseWaveformData(loadedTrack?.waveform_data),
    [loadedTrack?.waveform_data],
  );
  const deckWaveform = useMemo(
    () => parseWaveformData(deckTrack?.waveform_data),
    [deckTrack?.waveform_data],
  );
  const loadedWaveformHighData = loadedWaveform?.high || null;
  const deckWaveformHighData = deckWaveform?.high || null;
  const deckWaveformLowData = deckWaveform?.low || null;
  const deckTrackHasWaveform =
    Array.isArray(deckWaveformHighData) && deckWaveformHighData.length > 0;
  const deckIsGenerating = !!(deckTrack && regeneratingWaveforms[deckTrack.id]);
  const deckCanSeek = !!(
    loadedTrack &&
    deckTrack &&
    loadedTrack.id === deckTrack.id &&
    audioDuration > 0
  );

  const { vuRef, specRef } = useAudioAnalyzer({
    isPlaying,
    waveformData: loadedWaveformHighData,
    currentTime,
    duration: audioDuration,
  });

  // Auto-load tracks on mount + listen for upload events
  useEffect(() => {
    const loadTracks = () => {
      fetchAllTracks()
        .then((tracks) => {
          setTrackListData(tracks);
          setTrackLoadError(null);
        })
        .catch((err) => {
          console.error("[PSC] Failed to load tracks:", err);
          setTrackLoadError("VAULT UNAVAILABLE");
        });
    };
    loadTracks();

    // Refresh when new track uploaded
    const handleUpload = () => {
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
    glider.style.transform = `translateX(${offsetLeft}px) scaleX(${offsetWidth})`;
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
      glider.style.transform = `translateX(${pulled}px) scaleX(${pulledW})`;
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
          autoLoopDefault,
          smartCrates,
          historyEnabled,
        }),
      );
    } catch (_) {}
  }, [
    autoLoopDefault,
    historyEnabled,
    smartCrates,
    trackColorRows,
    waveformDetail,
  ]);

  useEffect(() => {
    if (!showLoopMenu) return;
    const onPointerDown = (e) => {
      if (!loopMenuRef.current?.contains(e.target)) {
        setShowLoopMenu(false);
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [showLoopMenu]);

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
    audioEngine.prewarm(); // synchronous — creates AudioContext inside gesture scope
    const url = getAudioUrl(track.audio_path);
    if (!url) {
      announce("No audio file for this track.");
      return;
    }
    setAudioError(null);
    setAudioLoading(true);
    announce(`Loading ${track.title || "track"}…`);
    try {
      await audioEngine.load(url);
      setSelectedTrackId(track.id);
      setLoadedTrack(track);
      setLoadedDeckId(track.id);
      pushTrackHistory(track);
      setTrackPlayCounts((prev) => ({
        ...prev,
        [track.id]: (prev[track.id] || 0) + 1,
      }));
      audioEngine.play();
      announce(`Playing ${track.title || "track"}.`);
      if (!track.waveform_data) ensureWaveformForTrack(track);
    } catch (err) {
      console.error("[PSC] Audio load error:", err);
      setAudioError(err.message);
      announce("Audio load failed.");
    } finally {
      setAudioLoading(false);
    }
  };

  const loadToDeck = async (track) => {
    audioEngine.prewarm();
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
      setSelectedTrackId(track.id);
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
    audioEngine.prewarm();
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
      if (loadedTrack && !loadedTrack.waveform_data) {
        ensureWaveformForTrack(loadedTrack);
      }
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
      announce(`Vetting inbox ${next ? "opened" : "closed"}.`);
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

  const [showSignalPanel, setShowSignalPanel] = useState(false);
  const [signalTitle, setSignalTitle] = useState("");
  const [signalLive, setSignalLive] = useState(false);
  const [signalWorking, setSignalWorking] = useState(false);

  const SIGNAL_WORKER = "https://psc-upload-worker.psoulc.workers.dev";

  const handleGoLive = async () => {
    setSignalWorking(true);
    try {
      await fetch(`${SIGNAL_WORKER}/signal`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_live: 1,
          title: signalTitle.trim() || "THE SIGNAL",
        }),
      });
      setSignalLive(true);
      setIsBroadcasting(true);
      onBroadcast?.();
      announce("The Signal is live.");
    } catch (_) {
    } finally {
      setSignalWorking(false);
    }
  };

  const handleEndSignal = async () => {
    setSignalWorking(true);
    try {
      await fetch(`${SIGNAL_WORKER}/signal`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_live: 0, title: null }),
      });
      setSignalLive(false);
      setIsBroadcasting(false);
      announce("The Signal ended.");
    } catch (_) {
    } finally {
      setSignalWorking(false);
    }
  };

  const handleBroadcast = () => setShowSignalPanel(true);

  const ensureWaveformForTrack = async (track, shouldAnnounce = false) => {
    if (!track || track.waveform_data || regeneratingWaveforms[track.id])
      return;
    const url = getAudioUrl(track.audio_path);
    if (!url) return;

    setRegeneratingWaveforms((prev) => ({ ...prev, [track.id]: true }));
    if (shouldAnnounce) {
      announce(`Analyzing waveform for ${track.title || "track"}…`);
    }

    try {
      await generateAndSaveWaveform(track.id, url);
      const refreshed = await fetchAllTracks();
      setTrackListData(refreshed);
      const updated = refreshed.find((t) => t.id === track.id);
      if (updated && loadedDeckId === track.id) {
        setLoadedTrack(updated);
      }
      if (shouldAnnounce) {
        announce(`Waveform generated for ${track.title || "track"}.`);
      }
    } catch (err) {
      if (shouldAnnounce) {
        announce(`Waveform generation failed: ${err.message}`);
      }
    } finally {
      setRegeneratingWaveforms((prev) => {
        const next = { ...prev };
        delete next[track.id];
        return next;
      });
    }
  };

  const handleTrackSelect = (track) => {
    setSelectedTrackId(track.id);
    setActiveVault(track.vault || null);
    announce(`${track.title || "Track"} selected.`);
  };

  const handleTrackRowKeyDown = (event, track) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleTrackSelect(track);
    }
  };

  const handleTrackDoubleClick = (track) => {
    setSelectedTrackId(track.id);
    setActiveVault(track.vault || null);
    loadAndPlay(track);
  };

  const handleToggleTrackSelection = (e, trackId) => {
    e.stopPropagation();
    setSelectedTrackIds((prev) => {
      const next = new Set(prev);
      next.has(trackId) ? next.delete(trackId) : next.add(trackId);
      return next;
    });
  };

  const handlePublishSelected = async () => {
    const ids = [...selectedTrackIds];
    if (!ids.length) return;
    await Promise.all(
      ids.map((id) =>
        fetch(`${UPLOAD_WORKER_URL}/tracks/${id}/publish`, {
          method: "PUT",
          headers: { "PSC-Secret": UPLOAD_SECRET },
        }),
      ),
    );
    setTrackListData((prev) =>
      prev.map((t) =>
        selectedTrackIds.has(t.id) ? { ...t, is_published: 1 } : t,
      ),
    );
    setSelectedTrackIds(new Set());
    announce(
      `${ids.length} track${ids.length > 1 ? "s" : ""} published to vault.`,
    );
  };

  const handleRetractSelected = async () => {
    const ids = [...selectedTrackIds];
    if (!ids.length) return;
    await Promise.all(
      ids.map((id) =>
        fetch(`${UPLOAD_WORKER_URL}/tracks/${id}/retract`, {
          method: "PUT",
          headers: { "PSC-Secret": UPLOAD_SECRET },
        }),
      ),
    );
    setTrackListData((prev) =>
      prev.map((t) =>
        selectedTrackIds.has(t.id) ? { ...t, is_published: 0 } : t,
      ),
    );
    setSelectedTrackIds(new Set());
    announce(
      `${ids.length} track${ids.length > 1 ? "s" : ""} retracted from vault.`,
    );
  };

  const handleEditStart = (e, track) => {
    e.stopPropagation();
    setEditingTrackId(track.id);
    setEditingValues({ title: track.title || "", artist: track.artist || "" });
  };

  const handleEditSave = async (trackId) => {
    const vals = editingValues;
    await fetch(`${UPLOAD_WORKER_URL}/tracks/${trackId}`, {
      method: "PATCH",
      headers: {
        "PSC-Secret": UPLOAD_SECRET,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(vals),
    });
    setTrackListData((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, ...vals } : t)),
    );
    setEditingTrackId(null);
    setEditingValues({});
  };

  const handleEditKeyDown = (e, trackId) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleEditSave(trackId);
    }
    if (e.key === "Escape") {
      setEditingTrackId(null);
      setEditingValues({});
    }
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
    await ensureWaveformForTrack(track, true);
  };

  const handleNext = () => {
    if (!visibleTracks.length) return;
    const idx = loadedTrack
      ? visibleTracks.findIndex((t) => t.id === loadedTrack.id)
      : -1;
    const next = visibleTracks[idx + 1] ?? visibleTracks[0];
    loadAndPlay(next);
    announce(`Loading ${next.title || "next track"}.`);
  };

  const handlePrev = () => {
    if (!visibleTracks.length) return;
    const idx = loadedTrack
      ? visibleTracks.findIndex((t) => t.id === loadedTrack.id)
      : 0;
    const prev =
      visibleTracks[idx - 1] ?? visibleTracks[visibleTracks.length - 1];
    loadAndPlay(prev);
    announce(`Loading ${prev.title || "previous track"}.`);
  };

  const bankIndex = { A: 0, B: 1, C: 2, D: 3 }[activeCueBank];

  const handleHotCueClick = (displayNum) => {
    if (!loadedTrack) {
      announce("Load a track before setting hot cues.");
      return;
    }
    const trackId = loadedTrack.id;
    const trackCues = hotCues[trackId] || {};
    const internalNum = bankIndex * 8 + displayNum;
    const existingCue = trackCues[internalNum];

    if (existingCue) {
      // Jump to existing cue
      handleSeek(existingCue.time);
      announce(`Jumped to hot cue ${displayNum}.`);
    } else {
      // Set new cue at current time
      const time = currentTime;
      const updated = {
        ...hotCues,
        [trackId]: {
          ...trackCues,
          [internalNum]: { time },
        },
      };
      setHotCues(updated);
      localStorage.setItem("psc_hotcues", JSON.stringify(updated));
      announce(
        `Hot cue ${displayNum} set at ${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, "0")}.`,
      );

      // Auto-cycle bank if all 8 cues filled
      const newCues = updated[trackId];
      const filledInBank = Array.from(
        { length: 8 },
        (_, i) => newCues[bankIndex * 8 + i + 1],
      ).filter(Boolean).length;
      if (filledInBank === 8) {
        const banks = ["A", "B", "C", "D"];
        const nextBank = banks[(bankIndex + 1) % 4];
        setActiveCueBank(nextBank);
        announce(`Bank full. Advanced to bank ${nextBank}.`);
      }
    }
  };

  const clearHotCue = (displayNum, e) => {
    e.stopPropagation();
    if (!loadedTrack) return;
    const trackId = loadedTrack.id;
    const trackCues = hotCues[trackId] || {};
    const internalNum = bankIndex * 8 + displayNum;
    if (!trackCues[internalNum]) return;

    const { [internalNum]: removed, ...remaining } = trackCues;
    const updated = { ...hotCues, [trackId]: remaining };
    setHotCues(updated);
    localStorage.setItem("psc_hotcues", JSON.stringify(updated));
    announce(`Hot cue ${displayNum} cleared.`);
  };

  // Loop enforcement — seeks back to loopRegion.start when playhead passes loopRegion.end
  useEffect(() => {
    if (loopRegion.start === null || loopRegion.end === null) return;
    loopActiveRef.current = true;
    return audioEngine.onStateChange(
      ({ currentTime: ct, isPlaying: playing }) => {
        if (playing && loopActiveRef.current && ct >= loopRegion.end) {
          audioEngine.seek(loopRegion.start);
        }
      },
    );
  }, [loopRegion]);

  const handleClearBankCues = () => {
    if (!loadedTrack) {
      announce(`No cues to clear in bank ${activeCueBank}.`);
      return;
    }

    const trackId = loadedTrack.id;
    const trackCues = hotCues[trackId] || {};
    const cuesToClear = Array.from({ length: 8 }, (_, i) => bankIndex * 8 + i + 1);
    let hasChanges = false;
    const updated = { ...trackCues };
    cuesToClear.forEach((num) => {
      if (updated[num]) {
        delete updated[num];
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setHotCues({ ...hotCues, [trackId]: updated });
      localStorage.setItem("psc_hotcues", JSON.stringify({ ...hotCues, [trackId]: updated }));
      announce(`Bank ${activeCueBank} cleared.`);
    } else {
      announce(`No cues in bank ${activeCueBank}.`);
    }
  };

  const handleClearLoop = () => {
    setLoopRegion({ start: null, end: null });
    loopActiveRef.current = false;
    announce("Loop cleared.");
  };

  const resolveTrackBpm = (track) => {
    const source = track?.bpm_display || track?.bpm;
    const parsed = parseFloat(String(source || "").split("-")[0]);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  };

  const resolveLoopBeats = (option) => {
    if (option.type === "bars") return (option.bars || 0) * 4;
    if (option.type === "beats") return option.beats || 0;
    let beats = 4 / option.denominator;
    if (option.dotted) beats *= 1.5;
    if (option.triplet) beats *= 2 / 3;
    return beats;
  };

  const handleApplyLoopLength = (option) => {
    if (!audioEngine.isLoaded() || !loadedTrack) return;
    const bpm = resolveTrackBpm(loadedTrack);
    if (!bpm) {
      announce("BPM unavailable for loop length.");
      setShowLoopMenu(false);
      return;
    }
    const beats = resolveLoopBeats(option);
    if (!beats) {
      setShowLoopMenu(false);
      return;
    }
    const beatSeconds = 60 / bpm;
    const start = currentTime;
    const end = start + beats * beatSeconds;
    setLoopRegion({ start, end });
    loopActiveRef.current = true;
    setSelectedLoopLengthId(option.id);
    setShowLoopMenu(false);
    announce(`Loop ${option.label}.`);
  };

  const filteredTracks = trackListData
    .filter((t) => t.vault === activeLibVault)
    .filter(
      (t) =>
        !libSearch ||
        t.title?.toLowerCase().includes(libSearch.toLowerCase()) ||
        t.artist?.toLowerCase().includes(libSearch.toLowerCase()),
    )
    .filter((t) =>
      publishFilter === "all"
        ? true
        : publishFilter === "staged"
          ? !t.is_published
          : Boolean(t.is_published),
    );

  const visibleTracks = [...filteredTracks].sort((a, b) => {
    if (sortMode === "recent") {
      return (
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
      );
    }
    return (resolveTrackBpm(b) || 0) - (resolveTrackBpm(a) || 0);
  });

  const hasHotCuesForLoadedTrack = !!(
    loadedTrack && Object.keys(hotCues[loadedTrack.id] || {}).length
  );
  const hasCuesInCurrentBank = !!(
    loadedTrack &&
    Array.from(
      { length: 8 },
      (_, i) => hotCues[loadedTrack.id]?.[bankIndex * 8 + i + 1],
    ).some(Boolean)
  );

  const selectionHasStaged = [...selectedTrackIds].some(
    (id) => !trackListData.find((t) => t.id === id)?.is_published,
  );
  const selectionHasLive = [...selectedTrackIds].some((id) =>
    Boolean(trackListData.find((t) => t.id === id)?.is_published),
  );

  const mixLoudness =
    deckTrack?.lufs_integrated ?? deckTrack?.lufs ?? deckTrack?.loudness_lufs;
  const mixPeak =
    deckTrack?.true_peak_dbtp ?? deckTrack?.peak_db ?? deckTrack?.peak;
  const mixRange =
    deckTrack?.dynamic_range ?? deckTrack?.dr ?? deckTrack?.crest_factor;

  const commandVaultId = activeVault || activeLibVault;

  const handleExplore = () => {
    if (!commandVaultId) return;
    onExplorePlanet?.(commandVaultId);
    announce(`Opening ${vaultLabel(commandVaultId)}.`);
  };

  const handleVoidProtocol = () => {
    if (!commandVaultId) return;
    setShowVoidConfirm(true);
    announce(
      `Void protocol confirmation opened for ${vaultLabel(commandVaultId)}.`,
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

  const handleExitToVaultView = () => {
    setShowPowerConfirm(false);
    if (!commandVaultId) {
      announce("No vault selected.");
      return;
    }
    onExplorePlanet?.(commandVaultId);
    announce(`Opening ${vaultLabel(commandVaultId)}.`);
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
        announce("Vetting inbox closed.");
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
    showInbox,
    showMatrix,
    showPowerConfirm,
    showRoster,
    showSettings,
    showTrackList,
    showVoidConfirm,
  ]);

  const isD = viewer === "D";

  return (
    <motion.div
      className={`architect-console${isD ? " architect-console--d" : " architect-console--l"}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
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
            {viewer === "D" ? "D · GOD MODE" : "L · GOD MODE PLUS"}
          </span>
        </div>

        <nav className="arch-top-actions" aria-label="Architect controls">
          <button
            className={`arch-signal-btn ${isBroadcasting ? "is-live" : ""}`}
            onClick={handleBroadcast}
            aria-label="THE SIGNAL — go live"
          >
            <span className="arch-signal-dot">●</span> SIGNAL
          </button>

          <button
            className="arch-rail-btn arch-exit-btn"
            onClick={handlePowerDown}
          >
            EXIT
          </button>
        </nav>
      </header>

      {/* ── DECK ZONE ────────────────────────────────────────────────── */}
      <section className="arch-deck-zone" aria-label="Deck">
        <div className="arch-deck-meta">
          <div className="arch-deck-title">
            {deckTrack ? deckTrack.title : "NO OBJECT LOADED"}
          </div>
          <div className="arch-deck-artist">
            {deckTrack
              ? deckTrack.artist || "METADATA READY"
              : "SELECT AN OBJECT"}
          </div>
          <div className="arch-deck-stats">
            <span className="arch-stat">
              BPM{" "}
              <strong>
                {deckTrack?.bpm_display ||
                  (deckTrack?.bpm ? Math.round(deckTrack.bpm) : "--")}
              </strong>
            </span>
            <span
              className={`arch-stat arch-elapsed${isPlaying ? " arch-elapsed--playing" : ""}`}
            >
              {formatTime(deckCanSeek ? currentTime : 0)}
            </span>
            <span className="arch-stat-sep">/</span>
            <span className="arch-stat arch-remaining">
              {deckCanSeek
                ? `-${formatTime(audioDuration - currentTime)}`
                : "READY"}
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

        {/* Waveform row — VU left, waveform + spectrum right */}
        <div className="arch-waveform-row" aria-hidden="true">
          <canvas
            ref={vuRef}
            className="arch-vu-deck"
            width={220}
            height={156}
          />
          <div className="arch-waveform-col">
            <div className="arch-waveform-main">
              {!deckTrack ? (
                <div className="arch-deck-empty-state">SELECT AN OBJECT</div>
              ) : deckIsGenerating ? (
                <div className="arch-deck-empty-state">
                  GENERATING WAVEFORM…
                </div>
              ) : !deckTrackHasWaveform ? (
                <div className="arch-deck-empty-state">
                  NO WAVEFORM FOR SELECTED OBJECT
                </div>
              ) : (
                <DeckWaveform
                  waveformData={deckWaveformHighData}
                  currentTime={deckCanSeek ? currentTime : 0}
                  duration={
                    deckCanSeek ? audioDuration : deckTrack.duration || 1
                  }
                  onSeek={deckCanSeek ? handleSeek : null}
                  trackId={deckTrack.id}
                  width={800}
                  height={108}
                  hotCues={hotCues[deckTrack.id] || {}}
                  cueColors={ALL_CUE_COLORS}
                  zoom={1}
                  loopRegion={loopRegion}
                />
              )}
            </div>
            <canvas
              ref={specRef}
              className="arch-spectrum-deck"
              width={800}
              height={64}
            />
          </div>
        </div>

        {/* Overview strip — low-res waveform */}
        <div
          className="arch-waveform-overview"
          aria-hidden="true"
          style={{ cursor: "default" }}
        >
          {Array.isArray(deckWaveformLowData) &&
          deckWaveformLowData.length > 0 ? (
            <>
              {deckWaveformLowData.map((d, i) => (
                <span
                  key={i}
                  className="arch-overview-bar"
                  style={{
                    "--bar-h": `${d.peak * 100}%`,
                    backgroundColor: d.freq,
                  }}
                />
              ))}
              {deckCanSeek && (
                <div
                  className="arch-playhead"
                  style={{
                    left: `${audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0}%`,
                  }}
                />
              )}
            </>
          ) : (
            <div className="arch-overview-empty">
              NO REAL WAVEFORM AVAILABLE
            </div>
          )}
        </div>

        <div className="arch-deck-edit" role="group" aria-label="Waveform edit controls">
          <div className="arch-loop-region">
            <span className="arch-cue-tag">LOOP</span>
            <span className="arch-loop-readout">
              {loopRegion.start !== null && loopRegion.end !== null
                ? `${loopRegion.start.toFixed(1)}s → ${loopRegion.end.toFixed(1)}s`
                : "NONE"}
            </span>
            <button
              className="arch-deck-mini-btn"
              disabled={loopRegion.start === null}
              onClick={handleClearLoop}
            >
              CLEAR
            </button>
          </div>
        </div>
      </section>

      {/* ── TRANSPORT BAR ───────────────────────────────────────────── */}
      <div
        className="arch-transport"
        role="toolbar"
        aria-label="Transport controls"
      >
        {/* Left: hot cues (Serato standard position) */}
        <div className="arch-transport-left">
          <div
            className="arch-hotcues-cluster"
            role="group"
            aria-label="Hot cues"
          >
            <div className="arch-bank-selector-wrap">
              <span className="arch-cue-tag">BANK</span>
              <div className="arch-cue-bank-selector">
                {["A", "B", "C", "D"].map((bank) => (
                  <button
                    key={bank}
                    className={`arch-bank-btn${activeCueBank === bank ? " active" : ""}`}
                    onClick={() => setActiveCueBank(bank)}
                    aria-label={`Switch to cue bank ${bank}`}
                    aria-pressed={activeCueBank === bank}
                  >
                    {bank}
                  </button>
                ))}
              </div>
              <button
                className="arch-clr-bank-btn"
                disabled={!hasCuesInCurrentBank}
                onClick={handleClearBankCues}
                title={`Clear all hot cues in bank ${activeCueBank}`}
              >
                CLR
              </button>
            </div>
            <div
              className="arch-hotcues"
              role="group"
              aria-label={`Hot cues bank ${activeCueBank}`}
            >
              {Array.from({ length: 8 }, (_, i) => i + 1).map((displayNum) => {
                const trackCues = loadedTrack
                  ? hotCues[loadedTrack.id] || {}
                  : {};
                const internalNum = bankIndex * 8 + displayNum;
                const cue = trackCues[internalNum];
                const color = ALL_CUE_COLORS[internalNum - 1];
                return (
                  <button
                    key={displayNum}
                    className={`arch-hotcue${cue ? " has-cue" : ""}`}
                    aria-label={
                      cue
                        ? `Hot cue ${displayNum} — double-click to clear`
                        : `Hot cue ${displayNum}`
                    }
                    onClick={() => handleHotCueClick(displayNum)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      clearHotCue(displayNum, e);
                    }}
                    style={{ "--cue-color": color }}
                  >
                    {displayNum}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center: playback controls */}
        <div
          className="arch-transport-cluster"
          role="group"
          aria-label="Playback"
        >
          <button
            className="arch-transport-btn arch-skip-btn"
            aria-label="Previous track"
            onClick={handlePrev}
            disabled={!visibleTracks.length}
          >
            ⏮ PREV
          </button>
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
          <button
            className="arch-transport-btn arch-skip-btn"
            aria-label="Next track"
            onClick={handleNext}
            disabled={!visibleTracks.length}
          >
            NEXT ⏭
          </button>
        </div>

        {/* Right: loop controls */}
        <div className="arch-transport-right">
          <div
            className="arch-loop-controls"
            role="group"
            aria-label="Loop controls"
          >
            <div className="arch-loop-menu-wrap" ref={loopMenuRef}>
              <button
                className="arch-loop-btn arch-loop-trigger"
                disabled={!loadedTrack}
                onClick={() => setShowLoopMenu((prev) => !prev)}
              >
                LOOP{" "}
                {LOOP_LENGTH_OPTIONS.find((o) => o.id === selectedLoopLengthId)
                  ?.label || "1/4"}
              </button>
              {showLoopMenu && (
                <div
                  className="arch-loop-menu"
                  role="menu"
                  aria-label="Loop length"
                >
                  {LOOP_LENGTH_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      className={`arch-loop-menu-item ${selectedLoopLengthId === option.id ? "active" : ""}`}
                      onClick={() => handleApplyLoopLength(option)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              className="arch-loop-btn"
              disabled={loopRegion.start === null}
              onClick={handleClearLoop}
            >
              CLEAR
            </button>
          </div>
        </div>
      </div>

      <div className="arch-monitor-strip" role="group" aria-label="Monitoring">
        <div className="arch-monitor-eq" aria-label="Mix stats">
          <span className="arch-monitor-btn">
            LOUDNESS {mixLoudness ?? "N/A"}
          </span>
          <span className="arch-monitor-btn">PEAK {mixPeak ?? "N/A"}</span>
          <span className="arch-monitor-btn">RANGE {mixRange ?? "N/A"}</span>
          <span className="arch-monitor-btn">
            BPM{" "}
            {deckTrack?.bpm_display ||
              (deckTrack?.bpm ? Math.round(deckTrack.bpm) : "N/A")}
          </span>
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
          <div className="arch-ops-stack">
            <div className="arch-ops-box" aria-label="Direct line">
              <div className="arch-ops-body">
                <DirectLinePanel
                  viewer={viewer}
                  variant={viewer === "D" ? "d-mode" : "architect"}
                />
              </div>
            </div>
            <div className="arch-ops-box" aria-label="Settings">
              <div className="arch-rail-section-label">SETUP</div>
              <button
                className={`arch-rail-toggle arch-ops-toggle ${showSettings ? "active" : ""}`}
                onClick={toggleSettings}
                aria-expanded={showSettings}
              >
                <span className="arch-rail-icon">◌</span>
                SYSTEM SETTINGS
              </button>
            </div>
          </div>

          <div className="arch-rail-divider" />
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
            VETTING INBOX
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

          <button className="arch-rail-cmd" onClick={handleExplore}>
            OPEN {commandVaultId ? `→ ${vaultLabel(commandVaultId)}` : "VAULT"}
          </button>
          <button
            className="arch-rail-cmd arch-rail-void"
            disabled={!commandVaultId}
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
            {VAULT_ROUTES.map((v, i) => {
              const count = (vaultTracksState?.[v.id] || []).filter(
                (t) => !t.is_voided,
              ).length;
              return (
                <button
                  key={v.id}
                  ref={(el) => (tabRefs.current[i] = el)}
                  role="tab"
                  className={`arch-vault-tab ${activeLibVault === v.id ? "active" : ""}`}
                  style={{ "--vault-color": v.color }}
                  aria-selected={activeLibVault === v.id}
                  onClick={() => {
                    setActiveLibVault(v.id);
                    setActiveVault(v.id);
                    announce(`Vault folder ${v.label}.`);
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
                  {count > 0 && (
                    <span className="arch-vault-count">{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div
            className="arch-browser-utility"
            role="toolbar"
            aria-label="Library controls"
          >
            <div className="arch-browser-group">
              <button
                className={`arch-browser-btn ${sortMode === "bpm" ? "active" : ""}`}
                onClick={() => setSortMode("bpm")}
              >
                SORT: BPM
              </button>
              <button
                className={`arch-browser-btn ${publishFilter === "staged" ? "active" : ""}`}
                onClick={() =>
                  setPublishFilter((p) => (p === "staged" ? "all" : "staged"))
                }
              >
                STAGED
              </button>
              <button
                className={`arch-browser-btn ${publishFilter === "live" ? "active" : ""}`}
                onClick={() =>
                  setPublishFilter((p) => (p === "live" ? "all" : "live"))
                }
              >
                LIVE
              </button>
              <button
                className="arch-browser-btn arch-publish-btn"
                onClick={handlePublishSelected}
                disabled={!selectionHasStaged}
                title="Publish selected tracks to listener vault"
              >
                PUBLISH{" "}
                {selectedTrackIds.size > 0 ? `(${selectedTrackIds.size})` : ""}
              </button>
              <button
                className="arch-browser-btn arch-retract-btn"
                onClick={handleRetractSelected}
                disabled={!selectionHasLive}
                title="Retract selected tracks from listener vault"
              >
                RETRACT{" "}
                {selectedTrackIds.size > 0 ? `(${selectedTrackIds.size})` : ""}
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
              <button
                className="arch-browser-btn arch-intake-btn"
                onClick={() => onIntake?.()}
              >
                INTAKE
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
              <span
                role="columnheader"
                className="arch-track-col-check"
                aria-label="Select"
              />
              <span role="columnheader">TITLE</span>
              <span role="columnheader">ARTIST</span>
              <span role="columnheader">BPM</span>
              <span role="columnheader">KEY</span>
              <span role="columnheader">LENGTH</span>
              <span role="columnheader">ADDED</span>
              <span role="columnheader">PLAYS</span>
              <span role="columnheader">STATUS</span>
              <span role="columnheader">PREVIEW</span>
              <span role="columnheader">ACTIONS</span>
            </div>
            <div className="arch-track-list-body">
              {trackListLoading ? (
                <div className="arch-lib-empty">QUERYING VAULT…</div>
              ) : trackLoadError ? (
                <div className="arch-lib-empty arch-lib-error">
                  {trackLoadError} —{" "}
                  <button
                    className="arch-lib-retry"
                    onClick={() => {
                      setTrackLoadError(null);
                      fetchAllTracks()
                        .then(setTrackListData)
                        .catch((err) => {
                          console.error("[PSC] Failed to load tracks:", err);
                          setTrackLoadError("VAULT UNAVAILABLE");
                        });
                    }}
                  >
                    RETRY
                  </button>
                </div>
              ) : visibleTracks.length === 0 ? (
                <div className="arch-lib-empty">VAULT IS EMPTY</div>
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

                  const isLive = Boolean(t.is_published);
                  const isEditing = editingTrackId === t.id;
                  return (
                    <div
                      key={t.id}
                      className={`arch-track-row arch-track-row-${trackColorRows ? t.vault || "generic" : "generic"} ${selectedTrackId === t.id ? "selected" : ""} ${loadedDeckId === t.id ? "loaded" : ""} ${selectedTrackIds.has(t.id) ? "checked" : ""} ${isLive ? "arch-track-live" : "arch-track-staged"}`}
                      role="row"
                      tabIndex={0}
                      aria-selected={selectedTrackId === t.id}
                      style={{ "--row-i": i }}
                      onClick={() => handleTrackSelect(t)}
                      onDoubleClick={() => handleTrackDoubleClick(t)}
                      onKeyDown={(event) => handleTrackRowKeyDown(event, t)}
                    >
                      <span
                        className="arch-track-col-check"
                        role="cell"
                        onClick={(e) => handleToggleTrackSelection(e, t.id)}
                      >
                        <span
                          className={`arch-track-checkbox ${selectedTrackIds.has(t.id) ? "is-checked" : ""}`}
                          role="checkbox"
                          tabIndex={0}
                          aria-checked={selectedTrackIds.has(t.id)}
                          aria-label={
                            selectedTrackIds.has(t.id) ? "Deselect" : "Select"
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              handleToggleTrackSelection(event, t.id);
                            }
                          }}
                        />
                      </span>
                      <span className="arch-track-title" role="cell">
                        {isEditing ? (
                          <input
                            className="arch-track-edit-input"
                            value={editingValues.title ?? ""}
                            onChange={(e) =>
                              setEditingValues((v) => ({
                                ...v,
                                title: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => handleEditKeyDown(e, t.id)}
                            onBlur={() => handleEditSave(t.id)}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span
                            onDoubleClick={(e) => handleEditStart(e, t)}
                            title="Double-click to rename"
                          >
                            {t.title || "—"}
                          </span>
                        )}
                      </span>
                      <span className="arch-track-artist" role="cell">
                        {isEditing ? (
                          <input
                            className="arch-track-edit-input"
                            value={editingValues.artist ?? ""}
                            onChange={(e) =>
                              setEditingValues((v) => ({
                                ...v,
                                artist: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => handleEditKeyDown(e, t.id)}
                            onBlur={() => handleEditSave(t.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span onDoubleClick={(e) => handleEditStart(e, t)}>
                            {t.artist || "—"}
                          </span>
                        )}
                      </span>
                      <span className="arch-track-bpm" role="cell">
                        {t.bpm_display ||
                          (t.bpm ? Math.round(Number(t.bpm)) : "—")}
                      </span>
                      <span className="arch-track-key" role="cell">
                        {t.musical_key || "—"}
                      </span>
                      <span className="arch-track-len" role="cell">
                        {t.duration ? formatTime(t.duration) : "—:——"}
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
                        <i
                          className={`arch-state-dot arch-pub-dot ${isLive ? "is-live" : "is-staged"}`}
                        />
                        {isLive ? "LIVE" : "STAGED"}
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
                            {regeneratingWaveforms[t.id] ? "..." : "WVF"}
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
            trackColorRows={trackColorRows}
            setTrackColorRows={setTrackColorRows}
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
              <button
                className="arch-panel-close"
                onClick={toggleSettings}
                aria-label="Close settings"
              >
                ✕
              </button>
            </div>
            <div className="arch-panel-body arch-settings-body">
              <section className="arch-settings-section">
                <h4 className="arch-settings-title">DISPLAY</h4>
                <div className="arch-settings-row">
                  <span>Track Color Rows</span>
                  <button
                    className={`arch-settings-toggle ${trackColorRows ? "active" : ""}`}
                    onClick={() => setTrackColorRows((p) => !p)}
                  >
                    {trackColorRows ? "ON" : "OFF"}
                  </button>
                </div>
              </section>
              <section className="arch-settings-section">
                <h4 className="arch-settings-title">PLAYBACK</h4>
                <div className="arch-settings-row">
                  <span>Auto Loop Default</span>
                  <button
                    className={`arch-settings-toggle ${autoLoopDefault ? "active" : ""}`}
                    onClick={() => setAutoLoopDefault((p) => !p)}
                  >
                    {autoLoopDefault ? "ON" : "OFF"}
                  </button>
                </div>
              </section>
              <section className="arch-settings-section">
                <h4 className="arch-settings-title">VAULT</h4>
                <div className="arch-settings-row">
                  <span>Smart Crates</span>
                  <button
                    className={`arch-settings-toggle ${smartCrates ? "active" : ""}`}
                    onClick={() => setSmartCrates((p) => !p)}
                  >
                    {smartCrates ? "ENABLED" : "DISABLED"}
                  </button>
                </div>
                <div className="arch-settings-row">
                  <span>Track History</span>
                  <button
                    className={`arch-settings-toggle ${historyEnabled ? "active" : ""}`}
                    onClick={() => setHistoryEnabled((p) => !p)}
                  >
                    {historyEnabled ? "ENABLED" : "DISABLED"}
                  </button>
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
                  ) : trackLoadError ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="arch-table-empty arch-lib-error"
                      >
                        {trackLoadError} —{" "}
                        <button
                          className="arch-lib-retry"
                          onClick={() => {
                            setTrackLoadError(null);
                            fetchAllTracks()
                              .then(setTrackListData)
                              .catch((err) => {
                                console.error(
                                  "[PSC] Failed to load tracks:",
                                  err,
                                );
                                setTrackLoadError("VAULT UNAVAILABLE");
                              });
                          }}
                        >
                          RETRY
                        </button>
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
                EXIT OPTIONS
              </div>
              <div id="arch-power-msg" className="arch-confirm-msg">
                Choose a destination for this session.
              </div>
              <div className="arch-confirm-btns">
                <button
                  className="arch-confirm-no"
                  onClick={handleExitToVaultView}
                >
                  VAULT VIEW
                </button>
                <button className="arch-confirm-yes" onClick={confirmPowerDown}>
                  EXIT SYSTEM
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
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowSignalPanel(false);
            }}
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
                  onChange={(e) => setSignalTitle(e.target.value)}
                  placeholder="SOUL PLEASANT LIVE SESSION"
                  maxLength={64}
                  disabled={signalLive}
                  spellCheck={false}
                />
              </div>

              <div className="signal-panel-field">
                <label className="signal-panel-label">
                  OBS SETTINGS (D ONLY)
                </label>
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
                    {signalWorking ? "CONNECTING…" : "GO LIVE"}
                  </button>
                ) : (
                  <button
                    className="signal-panel-end"
                    onClick={handleEndSignal}
                    disabled={signalWorking}
                  >
                    {signalWorking ? "ENDING…" : "END SIGNAL"}
                  </button>
                )}
                <button
                  className="signal-panel-close"
                  onClick={() => setShowSignalPanel(false)}
                >
                  {signalLive ? "MINIMISE" : "CANCEL"}
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
          <span className="signal-live-dot" aria-hidden="true" /> THE SIGNAL IS
          LIVE
        </button>
      )}
    </motion.div>
  );
}

export default ArchitectConsole;
