import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadTrack } from '../lib/tracks';
import { useSystem, CMD } from '../state/SystemContext';

const FREQ_OPTIONS = [396, 432, 528, 741, 852];

// ── Lightweight ID3v2 parser ────────────────────────────────────────────────
// Reads only TBPM and TIT2 frames from ID3v2.3/2.4 tags embedded in audio files.
// Operates on the first 16KB of the file — enough for any typical ID3 header.

function syncsafeToInt(bytes, offset) {
  return ((bytes[offset] & 0x7f) << 21)
       | ((bytes[offset+1] & 0x7f) << 14)
       | ((bytes[offset+2] & 0x7f) <<  7)
       |  (bytes[offset+3] & 0x7f);
}

function readId3Frame(bytes, offset, version) {
  const id = String.fromCharCode(bytes[offset], bytes[offset+1], bytes[offset+2], bytes[offset+3]);
  const size = version >= 4
    ? syncsafeToInt(bytes, offset + 4)
    : (bytes[offset+4] << 24) | (bytes[offset+5] << 16) | (bytes[offset+6] << 8) | bytes[offset+7];
  const dataStart = offset + 10;
  const dataEnd   = dataStart + size;
  return { id, size, dataStart, dataEnd };
}

function decodeTextFrame(bytes, start, end) {
  const enc = bytes[start];
  const raw = bytes.slice(start + 1, end);
  try {
    if (enc === 1 || enc === 2) return new TextDecoder('utf-16').decode(raw);
    return new TextDecoder('utf-8').decode(raw);
  } catch (_) {
    return null;
  }
}

async function readId3Tags(file) {
  const slice = file.slice(0, 16384);
  const buf = await slice.arrayBuffer();
  const bytes = new Uint8Array(buf);

  // Check for ID3v2 magic
  if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) return {};
  const version = bytes[3];
  if (version < 2 || version > 4) return {};

  const tagSize = syncsafeToInt(bytes, 6) + 10;
  const result  = {};
  let offset    = 10;

  while (offset + 10 < tagSize && offset + 10 < bytes.length) {
    if (bytes[offset] === 0) break;
    const frame = readId3Frame(bytes, offset, version);
    if (frame.size <= 0 || frame.dataEnd > bytes.length) break;

    if (frame.id === 'TIT2') {
      result.title = decodeTextFrame(bytes, frame.dataStart, frame.dataEnd)
        ?.replace(/\0/g, '').trim() || null;
    }
    if (frame.id === 'TPE1') {
      result.artist = decodeTextFrame(bytes, frame.dataStart, frame.dataEnd)
        ?.replace(/\0/g, '').trim() || null;
    }
    if (frame.id === 'TBPM') {
      const raw = decodeTextFrame(bytes, frame.dataStart, frame.dataEnd)?.replace(/\0/g, '').trim();
      const bpm = parseInt(raw, 10);
      if (bpm > 0 && bpm <= 300) result.bpm = bpm;
    }
    offset = frame.dataEnd;
  }
  return result;
}

function NixieDigits({ value }) {
  const str = String(Math.round(value)).padStart(3, '0');
  return (
    <div className="nixie-digits">
      {str.split('').map((d, i) => (
        <span key={i} className="nixie-digit">{d}</span>
      ))}
    </div>
  );
}

function UploadModal({ onClose, defaultVault = 'saturn' }) {
  const { consoleOwner, loadVaultTracks, dispatchCommand } = useSystem();
  const [file,        setFile]        = useState(null);
  const [title,       setTitle]       = useState('');
  const [artist,      setArtist]      = useState('');
  const [tags,        setTags]        = useState('');
  const [bpm,         setBpm]         = useState(120);
  const [frequencyHz, setFrequencyHz] = useState(528);
  const [vault,       setVault]       = useState(defaultVault);
  const [uploading,   setUploading]   = useState(false);
  const [error,       setError]       = useState(null);
  const fileRef = useRef(null);

  const applyFile = async (f) => {
    if (!f || !f.type.startsWith('audio/')) return;
    setFile(f);
    const fallbackTitle = f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').toUpperCase();
    try {
      const id3 = await readId3Tags(f);
      if (!title)  setTitle(id3.title  ? id3.title.toUpperCase()  : fallbackTitle);
      if (id3.artist) setArtist(id3.artist.toUpperCase());
      if (id3.bpm) setBpm(id3.bpm);
    } catch (_) {
      if (!title) setTitle(fallbackTitle);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    applyFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    if (!file || !title.trim()) return;
    setUploading(true);
    setError(null);
    try {
      await uploadTrack(file, {
        vault,
        title:        title.trim(),
        artist:       artist.trim() || null,
        bpm:          parseInt(bpm),
        frequency_hz: parseInt(frequencyHz),
        uploaded_by:  consoleOwner,
      });
      dispatchCommand(CMD.UPLOAD_TRACK, { vault, title: title.trim() });
      await loadVaultTracks(vault);
      onClose();
    } catch (err) {
      setError(err.message || 'UPLOAD FAILED — CHECK SIGNAL');
    } finally {
      setUploading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="tune-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => { if (e.target === e.currentTarget && !uploading) onClose(); }}
      >
        <motion.div
          className="tune-modal upload-modal"
          initial={{ scale: 0.88, opacity: 0, y: 24 }}
          animate={{ scale: 1,    opacity: 1, y: 0  }}
          exit={{    scale: 0.88, opacity: 0, y: 24 }}
          transition={{ duration: 0.3, ease: [0.12, 0, 0.2, 1] }}
        >
          <div className="tune-modal-header">
            <span className="tune-modal-title">INTAKE</span>
            <span className="tune-modal-sub">ASSET UPLOAD · VAULT INGESTION PROTOCOL</span>
          </div>

          {/* Vault selector */}
          <div className="tune-field">
            <label className="tune-field-label">DESTINATION VAULT</label>
            <div className="upload-vault-toggle">
              <button className={`upload-vault-btn ${vault === 'saturn' ? 'active' : ''}`} onClick={() => setVault('saturn')}>
                SATURN
              </button>
              <button className={`upload-vault-btn ${vault === 'venus' ? 'active' : ''}`} onClick={() => setVault('venus')}>
                VENUS
              </button>
            </div>
          </div>

          {/* Drop zone */}
          <div className="tune-field">
            <label className="tune-field-label">AUDIO FILE</label>
            <div
              className={`upload-dropzone ${file ? 'has-file' : ''}`}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept="audio/*"
                style={{ display: 'none' }}
                onChange={(e) => applyFile(e.target.files[0])}
              />
              {file
                ? <span className="upload-filename">{file.name}</span>
                : <span className="upload-drop-hint">DROP AUDIO FILE · OR CLICK TO SELECT</span>
              }
            </div>
          </div>

          {/* Title */}
          <div className="tune-field">
            <label className="tune-field-label">TITLE</label>
            <input
              className="tune-label-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={64}
              spellCheck={false}
              placeholder="TRACK DESIGNATION"
            />
          </div>

          {/* Artist */}
          <div className="tune-field">
            <label className="tune-field-label">ARTIST</label>
            <input
              className="tune-label-input"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              maxLength={64}
              spellCheck={false}
              placeholder="PERFORMER / COLLECTIVE"
            />
          </div>

          {/* BPM */}
          <div className="tune-field">
            <label className="tune-field-label">BPM</label>
            <div className="tune-slider-row">
              <NixieDigits value={bpm} />
              <input
                type="range"
                className="tune-slider"
                min="60" max="200" step="1"
                value={bpm}
                onChange={(e) => setBpm(e.target.value)}
              />
            </div>
          </div>

          {/* Frequency */}
          <div className="tune-field">
            <label className="tune-field-label">FREQUENCY (Hz)</label>
            <div className="upload-freq-options">
              {FREQ_OPTIONS.map(hz => (
                <button
                  key={hz}
                  className={`upload-freq-btn ${frequencyHz === hz ? 'active' : ''}`}
                  onClick={() => setFrequencyHz(hz)}
                >{hz}</button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="tune-field">
            <label className="tune-field-label">TAGS</label>
            <input
              className="tune-label-input"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              maxLength={128}
              spellCheck={false}
              placeholder="COMMA-DELIMITED  ·  SOUL, BPM90, VOCALS"
            />
          </div>

          {error && <div className="upload-error">{error}</div>}

          <div className="tune-modal-actions">
            <button className="tune-btn tune-btn-cancel" onClick={onClose} disabled={uploading}>
              CANCEL
            </button>
            <button
              className="tune-btn tune-btn-save"
              onClick={handleSubmit}
              disabled={!file || !title.trim() || uploading}
            >
              {uploading ? 'TRANSMITTING…' : 'COMMIT TO VAULT'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default UploadModal;
