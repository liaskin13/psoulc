import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchPublishedVaultTracks, getAudioUrl } from '../lib/tracks';
import * as audioEngine from '../lib/audioEngine';
import { getWaveformBars } from '../utils/waveform';
import './ListenerVaultView.css';

function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return '--:--';
  const s = Math.round(Number(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function parseWaveformBars(track, count = 80) {
  try {
    const raw = JSON.parse(track.waveform_data || 'null');
    if (raw?.high?.length > 0) {
      const arr = Array.from(raw.high);
      const samples = Array.from({ length: count }, (_, i) => {
        const idx = Math.floor(i * arr.length / count);
        return Math.abs(arr[idx] || 0);
      });
      const max = Math.max(...samples, 0.001);
      return samples.map(v => v / max);
    }
  } catch {}
  return getWaveformBars(track.id, count).map(v => v / 100);
}

function ThumbnailCanvas({ track }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = 52, H = 26;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const bars = parseWaveformBars(track, 13);
    const step = W / bars.length;
    const barW = Math.max(1, step * 0.6);
    ctx.fillStyle = 'rgba(240,237,232,0.55)';
    bars.forEach((amp, i) => {
      const h = Math.max(1, amp * H);
      ctx.fillRect(i * step, (H - h) / 2, barW, h);
    });
  }, [track.id, track.waveform_data]);

  return (
    <canvas
      ref={ref}
      className="lvv-thumb"
      width={52}
      height={26}
      aria-hidden="true"
    />
  );
}

function WaveformCanvas({ track, currentTime, duration, ghost = false }) {
  const ref = useRef(null);

  const draw = useCallback(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    if (!W || !H) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const bars = parseWaveformBars(track, 80);
    const step = W / bars.length;
    const barW = Math.max(1, step * 0.65);
    const progress = duration > 0 ? currentTime / duration : 0;
    const playheadX = Math.round(progress * W);

    bars.forEach((amp, i) => {
      const h = Math.max(2, amp * H * 0.85);
      const x = i * step;
      const y = (H - h) / 2;
      if (ghost) {
        ctx.fillStyle = 'rgba(240,237,232,0.11)';
      } else {
        ctx.fillStyle = (x + barW / 2) <= playheadX ? '#14dc14' : 'rgba(240,237,232,0.28)';
      }
      ctx.fillRect(x, y, barW, h);
    });

    if (!ghost && duration > 0) {
      ctx.save();
      ctx.fillStyle = '#14dc14';
      ctx.shadowColor = 'rgba(20,220,20,0.5)';
      ctx.shadowBlur = 6;
      ctx.fillRect(Math.min(playheadX, W - 1), 0, 1, H);
      ctx.restore();
    }
  }, [track, currentTime, duration, ghost]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    draw();
    return () => ro.disconnect();
  }, [draw]);

  return (
    <canvas
      ref={ref}
      className={`lvv-waveform-canvas${ghost ? ' lvv-waveform-ghost' : ''}`}
      aria-hidden="true"
    />
  );
}

function ListenerVaultView({ vault, onBack, onExitSystem }) {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playerState, setPlayerState] = useState(null); // null | 'paused' | 'playing'
  const [activeTrack, setActiveTrack] = useState(null);
  const [audioState, setAudioState] = useState(() => audioEngine.getState());

  useEffect(() => {
    setLoading(true);
    fetchPublishedVaultTracks(vault)
      .then(data => setTracks(Array.isArray(data) ? data : []))
      .catch(() => setTracks([]))
      .finally(() => setLoading(false));
  }, [vault]);

  useEffect(() => {
    return audioEngine.onStateChange(state => {
      setAudioState(state);
      if (state.isPlaying) setPlayerState('playing');
    });
  }, []);

  useEffect(() => {
    return () => { audioEngine.stop(); };
  }, []);

  const handleTrackSelect = useCallback(async (track) => {
    const url = getAudioUrl(track.audio_path);
    if (!url) return;
    audioEngine.prewarm();
    setActiveTrack(track);
    setPlayerState('paused');
    try {
      await audioEngine.load(url);
      audioEngine.play();
    } catch (e) {
      console.warn('[LVV] load failed:', e.message);
    }
  }, []);

  const handlePlayPause = useCallback(() => {
    if (audioState.isPlaying) {
      audioEngine.pause();
    } else {
      audioEngine.play();
    }
  }, [audioState.isPlaying]);

  const handleStop = useCallback(() => {
    audioEngine.stop();
    setPlayerState(null);
    setActiveTrack(null);
  }, []);

  const handlePlayerBack = useCallback(() => {
    audioEngine.stop();
    setPlayerState(null);
    setActiveTrack(null);
  }, []);

  const header = (
    <header className="lvv-header">
      <div className="lvv-header-id">
        <span className="lvv-header-kicker">LISTENING ROOM</span>
        <span className="lvv-header-owner">CURATED BY D</span>
      </div>
      <button
        className="lvv-exit god-btn"
        onClick={onExitSystem}
        aria-label="Exit system"
      >
        EXIT
      </button>
    </header>
  );

  // PAUSED — ghost waveform + pulsing play triangle
  if (playerState === 'paused') {
    return (
      <div className="lvv-screen">
        {header}
        <button
          className="lvv-back god-btn"
          onClick={handlePlayerBack}
          aria-label="Back to track list"
        >
          ← BACK
        </button>
        <div className="lvv-player-stage">
          <WaveformCanvas
            track={activeTrack}
            currentTime={0}
            duration={audioState.duration}
            ghost
          />
          <button
            className="lvv-play-btn"
            onClick={handlePlayPause}
            aria-label="Play"
          >
            <span className="lvv-play-track-title">{activeTrack?.title}</span>
            <span className="lvv-play-triangle" aria-hidden="true">▶</span>
          </button>
        </div>
      </div>
    );
  }

  // PLAYING — live waveform + transport bar
  if (playerState === 'playing') {
    const isPlaying = audioState.isPlaying;
    return (
      <div className="lvv-screen">
        {header}
        <button
          className="lvv-back god-btn"
          onClick={handlePlayerBack}
          aria-label="Back to track list"
        >
          ← BACK
        </button>
        <div className="lvv-player-stage">
          <WaveformCanvas
            track={activeTrack}
            currentTime={audioState.currentTime}
            duration={audioState.duration}
          />
        </div>
        <div className="lvv-transport">
          <button
            className="lvv-transport-toggle"
            onClick={handlePlayPause}
            aria-label={isPlaying ? 'Pause' : 'Resume'}
          >
            <span className={`lvv-transport-status${isPlaying ? '' : ' is-paused'}`}>
              {isPlaying ? '▶ PLAYING' : '▮▮ PAUSED'}
            </span>
            <span className="lvv-transport-dot" aria-hidden="true">·</span>
            <span className="lvv-transport-title">{activeTrack?.title}</span>
          </button>
          <button
            className="lvv-transport-stop"
            onClick={handleStop}
            aria-label="Stop playback"
          >
            STOP
          </button>
        </div>
      </div>
    );
  }

  // TRACK LIST
  return (
    <div className="lvv-screen">
      {header}
      <button
        className="lvv-back god-btn"
        onClick={onBack}
        aria-label="Back to vault landing"
      >
        ← BACK
      </button>
      <div className="lvv-list" role="list">
        {loading && (
          <div className="lvv-state">
            <span className="lvv-state-dot" aria-hidden="true" />
            <span>LOADING</span>
          </div>
        )}
        {!loading && tracks.length === 0 && (
          <div className="lvv-state">NO TRACKS PUBLISHED</div>
        )}
        {!loading && tracks.map((track, i) => (
          <button
            key={track.id}
            className="lvv-track-row"
            onClick={() => handleTrackSelect(track)}
            role="listitem"
          >
            <span className="lvv-track-num">{String(i + 1).padStart(2, '0')}</span>
            <span className="lvv-track-info">
              <span className="lvv-track-title">{track.title || 'UNTITLED'}</span>
              {track.duration != null && (
                <span className="lvv-track-dur">{formatDuration(track.duration)}</span>
              )}
            </span>
            <ThumbnailCanvas track={track} />
          </button>
        ))}
      </div>
    </div>
  );
}

export default ListenerVaultView;
