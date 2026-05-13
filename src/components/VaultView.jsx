import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchVaultTracks, fetchPublishedVaultTracks, getAudioUrl } from "../lib/tracks";
import { VAULT_ACCENT_COLORS, VAULT_DISPLAY_NAMES } from "../config";

function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return "--:--";
  const s = Math.round(Number(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-CA"); // YYYY-MM-DD
  } catch {
    return iso;
  }
}

function TrackRow({ track, index, isActive, isPlaying, onClick, accentColor }) {
  return (
    <button
      className={`vv-track-row${isActive ? " vv-track-active" : ""}`}
      style={{ "--vault-color": accentColor }}
      onClick={() => onClick(track)}
      aria-current={isActive ? "true" : undefined}
    >
      <span className="vv-track-num">{String(index + 1).padStart(2, "0")}</span>
      <span className="vv-track-info">
        <span className="vv-track-title">{track.title || track.name || "UNTITLED"}</span>
        {track.artist && <span className="vv-track-artist">{track.artist}</span>}
      </span>
      <span className="vv-track-meta">
        {track.bpm_display || (track.bpm ? `${Math.round(track.bpm)} BPM` : "")}
        {track.bpm && track.duration ? <span className="vv-meta-sep" /> : null}
        <span className="vv-track-dur">{formatDuration(track.duration)}</span>
      </span>
      {isActive && (
        <span className="vv-track-playing" aria-label={isPlaying ? "playing" : "paused"}>
          {isPlaying ? "▶" : "▮▮"}
        </span>
      )}
    </button>
  );
}

function VaultView({
  vault,
  authenticated = false,
  onBack,
  onExitSystem,
  readOnly = false,
}) {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const vaultLabel = VAULT_DISPLAY_NAMES[vault] || vault.toUpperCase();
  const accentColor = VAULT_ACCENT_COLORS[vault] || "var(--identity)";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = authenticated
        ? await fetchVaultTracks(vault)
        : await fetchPublishedVaultTracks(vault);
      setTracks(data);
    } catch (e) {
      setError(e.message || "Failed to load tracks");
    } finally {
      setLoading(false);
    }
  }, [vault, authenticated]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const handler = () => load();
    window.addEventListener("psc:track-uploaded", handler);
    return () => window.removeEventListener("psc:track-uploaded", handler);
  }, [load]);

  const playTrack = useCallback((track) => {
    const url = getAudioUrl(track.audio_path);
    if (!url) return;

    if (activeId === track.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play().then(() => setIsPlaying(true)).catch(() => {});
      }
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.addEventListener("ended", () => setIsPlaying(false));
    audio.play().then(() => {
      setActiveId(track.id);
      setIsPlaying(true);
    }).catch(() => {});
    setActiveId(track.id);
  }, [activeId, isPlaying]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const activeTrack = tracks.find((t) => t.id === activeId);

  return (
    <motion.div
      className="vv-screen"
      style={{ "--vault-color": accentColor }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0, 0, 1] }}
    >
      {/* Header */}
      <header className="vv-header">
        <div className="vv-header-left">
          <button className="vv-back-btn" onClick={onBack} aria-label="Back">
            ← BACK
          </button>
        </div>
        <div className="vv-header-title">{vaultLabel}</div>
        {onExitSystem && (
          <button className="vv-exit-btn" onClick={onExitSystem}>
            EXIT
          </button>
        )}
      </header>

      {/* Track count kicker */}
      {!loading && !error && (
        <div className="vv-kicker">
          <span className="vv-kicker-vault" style={{ color: accentColor }}>
            {vaultLabel}
          </span>
          <span className="vv-kicker-sep">·</span>
          <span className="vv-kicker-count">
            {tracks.length} {tracks.length === 1 ? "TRACK" : "TRACKS"}
          </span>
        </div>
      )}

      {/* Track list */}
      <div className="vv-list">
        {loading && (
          <div className="vv-state vv-loading">
            <span className="vv-state-dot" />
            <span>LOADING</span>
          </div>
        )}

        {error && (
          <div className="vv-state vv-error">
            <span>ERROR · {error}</span>
            <button className="vv-retry" onClick={load}>RETRY</button>
          </div>
        )}

        {!loading && !error && tracks.length === 0 && (
          <div className="vv-state vv-empty">
            <span className="vv-empty-title">VAULT EMPTY</span>
            <span className="vv-empty-sub">
              {authenticated ? "Upload tracks to populate this vault." : "No published tracks yet."}
            </span>
          </div>
        )}

        {!loading && !error && tracks.map((track, i) => (
          <TrackRow
            key={track.id}
            track={track}
            index={i}
            isActive={activeId === track.id}
            isPlaying={isPlaying && activeId === track.id}
            onClick={playTrack}
            accentColor={accentColor}
          />
        ))}
      </div>

      {/* Now playing bar */}
      <AnimatePresence>
        {activeTrack && (
          <motion.div
            className="vv-now-playing"
            style={{ "--vault-color": accentColor }}
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            exit={{ y: 80 }}
            transition={{ duration: 0.22, ease: [0.25, 0, 0, 1] }}
          >
            <div className="vv-np-info">
              <span className="vv-np-label">{isPlaying ? "▶ NOW PLAYING" : "▮▮ PAUSED"}</span>
              <span className="vv-np-title">{activeTrack.title || activeTrack.name}</span>
            </div>
            <button
              className="vv-np-stop"
              onClick={() => {
                audioRef.current?.pause();
                setIsPlaying(false);
                setActiveId(null);
              }}
            >
              STOP
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default VaultView;
