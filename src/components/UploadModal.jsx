import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSystem, CMD } from "../state/SystemContext";
import {
  VAULT_DISPLAY_NAMES,
  UPLOAD_WORKER_URL,
  UPLOAD_SECRET,
} from "../config";
import "./TuneModal.css";

const VAULT_IDS = ["saturn", "venus", "mercury", "earth"];

const AUDIO_EXTENSIONS = new Set([
  "mp3",
  "wav",
  "aif",
  "aiff",
  "flac",
  "m4a",
  "aac",
  "ogg",
]);

// ── Lightweight ID3v2 parser ────────────────────────────────────────────────
// Reads only TBPM and TIT2 frames from ID3v2.3/2.4 tags embedded in audio files.
// Operates on the first 16KB of the file — enough for any typical ID3 header.

function syncsafeToInt(bytes, offset) {
  return (
    ((bytes[offset] & 0x7f) << 21) |
    ((bytes[offset + 1] & 0x7f) << 14) |
    ((bytes[offset + 2] & 0x7f) << 7) |
    (bytes[offset + 3] & 0x7f)
  );
}

function readId3Frame(bytes, offset, version) {
  const id = String.fromCharCode(
    bytes[offset],
    bytes[offset + 1],
    bytes[offset + 2],
    bytes[offset + 3],
  );
  const size =
    version >= 4
      ? syncsafeToInt(bytes, offset + 4)
      : (bytes[offset + 4] << 24) |
        (bytes[offset + 5] << 16) |
        (bytes[offset + 6] << 8) |
        bytes[offset + 7];
  const dataStart = offset + 10;
  const dataEnd = dataStart + size;
  return { id, size, dataStart, dataEnd };
}

function decodeTextFrame(bytes, start, end) {
  const enc = bytes[start];
  const raw = bytes.slice(start + 1, end);
  try {
    if (enc === 1 || enc === 2) return new TextDecoder("utf-16").decode(raw);
    return new TextDecoder("utf-8").decode(raw);
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
  const result = {};
  let offset = 10;

  while (offset + 10 < tagSize && offset + 10 < bytes.length) {
    if (bytes[offset] === 0) break;
    const frame = readId3Frame(bytes, offset, version);
    if (frame.size <= 0 || frame.dataEnd > bytes.length) break;

    if (frame.id === "TIT2") {
      result.title =
        decodeTextFrame(bytes, frame.dataStart, frame.dataEnd)
          ?.replace(/\0/g, "")
          .trim() || null;
    }
    if (frame.id === "TPE1") {
      result.artist =
        decodeTextFrame(bytes, frame.dataStart, frame.dataEnd)
          ?.replace(/\0/g, "")
          .trim() || null;
    }
    if (frame.id === "TBPM") {
      const raw = decodeTextFrame(bytes, frame.dataStart, frame.dataEnd)
        ?.replace(/\0/g, "")
        .trim();
      const bpm = Number.parseFloat(raw);
      if (bpm > 0 && bpm <= 300) result.bpm = bpm;
    }
    offset = frame.dataEnd;
  }
  return result;
}

function withTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`${label} TIMEOUT — CHECK STORAGE POLICY OR NETWORK`));
    }, ms);

    promise
      .then((value) => {
        clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        reject(err);
      });
  });
}

function NixieDigits({ value }) {
  const str = String(Math.round(value)).padStart(3, "0");
  return (
    <div className="nixie-digits">
      {str.split("").map((d, i) => (
        <span key={i} className="nixie-digit">
          {d}
        </span>
      ))}
    </div>
  );
}

function isAudioFileCandidate(file) {
  if (!file) return false;
  if (typeof file.type === "string" && file.type.startsWith("audio/"))
    return true;
  const ext = file.name?.split(".").pop()?.toLowerCase();
  return Boolean(ext && AUDIO_EXTENSIONS.has(ext));
}

function UploadModal({ onClose, defaultVault = "saturn" }) {
  const { consoleOwner, sessionMeta, loadVaultTracks, dispatchCommand } =
    useSystem();
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [bpm, setBpm] = useState("120.00");
  const [vault, setVault] = useState(
    VAULT_IDS.includes(sessionMeta?.vault) ? sessionMeta.vault : defaultVault,
  );
  const [uploading, setUploading] = useState(false);
  const [uploadPhase, setUploadPhase] = useState("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [metadataStatus, setMetadataStatus] = useState("idle");
  const fileRef = useRef(null);
  const parsedBpm = Number.parseFloat(String(bpm));
  const bpmNumeric =
    Number.isFinite(parsedBpm) && parsedBpm > 0 ? parsedBpm : 120;

  useEffect(() => {
    if (!uploading) {
      setUploadProgress(0);
      setUploadPhase("idle");
      return;
    }
    setUploadProgress(10);
    const timer = setInterval(() => {
      setUploadProgress((prev) => {
        if (uploadPhase === "finalizing") {
          if (prev >= 99) return 99;
          return Math.min(99, prev + 1);
        }
        if (prev >= 95) return 95;
        const next = prev + Math.max(1, (95 - prev) * 0.08);
        return Math.min(95, next);
      });
    }, 180);

    return () => clearInterval(timer);
  }, [uploading, uploadPhase]);

  const applyFile = async (f) => {
    if (!f) return;
    if (!isAudioFileCandidate(f)) {
      setError("INVALID FILE TYPE — USE AUDIO FORMAT (MP3/WAV/AIFF/FLAC/M4A)");
      return;
    }
    setError(null);
    setSuccess(null);
    setMetadataStatus("scanning");
    setFile(f);
    const fallbackTitle = f.name
      .replace(/\.[^.]+$/, "")
      .replace(/[-_]/g, " ")
      .toUpperCase();
    try {
      const id3 = await readId3Tags(f);
      if (!title) setTitle(id3.title ? id3.title.toUpperCase() : fallbackTitle);
      if (id3.artist) setArtist(id3.artist.toUpperCase());
      if (id3.bpm) setBpm(id3.bpm.toFixed(2));
      setMetadataStatus(
        id3.title || id3.artist || id3.bpm ? "detected" : "filename-fallback",
      );
    } catch (_) {
      if (!title) setTitle(fallbackTitle);
      setMetadataStatus("scan-error");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    applyFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    if (!file || !title.trim()) return;
    setUploadPhase("uploading");
    setUploading(true);
    setError(null);
    try {
      // DEV MODE: Skip worker if localhost (worker not running)
      const isDevMode = UPLOAD_WORKER_URL.includes("localhost");

      if (isDevMode) {
        // Client-side upload for dev/beta testing
        setUploadPhase("finalizing");
        setUploadProgress(97);

        // Store in localStorage (tracks.js will handle it)
        const newTrack = {
          id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          vault,
          title: title.trim(),
          artist: artist.trim() || null,
          bpm: String(Math.round(bpmNumeric * 100) / 100),
          uploaded_by: consoleOwner,
          is_voided: false,
          created_at: new Date().toISOString(),
          audio_path: `dev/${vault}/${file.name}`,
          waveform_data: null, // Generated on playback if needed
        };

        const existing = JSON.parse(
          localStorage.getItem("psc_dev_tracks") || "[]",
        );
        existing.push(newTrack);
        localStorage.setItem("psc_dev_tracks", JSON.stringify(existing));

        dispatchCommand(CMD.UPLOAD_TRACK, { vault, title: title.trim() });
        window.dispatchEvent(
          new CustomEvent("psc:track-uploaded", { detail: newTrack }),
        );

        setUploadProgress(100);
        setSuccess({ title: title.trim(), vault });
      } else {
        // Production mode: use worker
        const formData = new FormData();
        formData.append("file", file);
        formData.append("vault", vault);
        formData.append("title", title.trim());
        formData.append("artist", artist.trim() || "");
        formData.append("bpm", String(Math.round(bpmNumeric * 100) / 100));
        formData.append("uploaded_by", consoleOwner);

        await withTimeout(
          fetch(`${UPLOAD_WORKER_URL}/upload`, {
            method: "POST",
            headers: { "PSC-Secret": UPLOAD_SECRET },
            body: formData,
          }).then(async (res) => {
            if (!res.ok) {
              const body = await res.json().catch(() => ({}));
              throw new Error(body.error || `HTTP ${res.status}`);
            }
            return res.json();
          }),
          60000,
          "UPLOAD",
        );
        setUploadPhase("finalizing");
        setUploadProgress(97);
        dispatchCommand(CMD.UPLOAD_TRACK, { vault, title: title.trim() });
        await withTimeout(
          Promise.all(VAULT_IDS.map((id) => loadVaultTracks(id))),
          25000,
          "LIBRARY REFRESH",
        );
        setUploadProgress(100);
        setSuccess({ title: title.trim(), vault });
      }
    } catch (err) {
      setError(err.message || "UPLOAD FAILED — CHECK SIGNAL");
    } finally {
      setUploading(false);
    }
  };

  const uploadStatusText =
    uploadPhase === "finalizing" ? "FINALIZING INDEX" : "TRANSMITTING";

  const handleBpmChange = (value) => {
    if (value === "") {
      setBpm("");
      return;
    }
    if (!/^\d+(\.\d{0,2})?$/.test(value)) return;
    const numeric = Number.parseFloat(value);
    if (!Number.isFinite(numeric)) return;
    if (numeric < 1 || numeric > 400) return;
    setBpm(value);
  };

  const resetForAnother = () => {
    setFile(null);
    setTitle("");
    setArtist("");
    setBpm("120.00");
    setError(null);
    setSuccess(null);
    setMetadataStatus("idle");
    setUploadPhase("idle");
    setUploadProgress(0);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="tune-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => {
          if (e.target === e.currentTarget && !uploading) onClose();
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => e.preventDefault()}
      >
        <motion.div
          className={`tune-modal upload-modal ${
            consoleOwner === "D" ? "tune-modal--amber" : "tune-modal--cyan"
          }`}
          initial={{ scale: 0.88, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.88, opacity: 0, y: 24 }}
          transition={{ duration: 0.3, ease: [0.12, 0, 0.2, 1] }}
        >
          <div className="tune-modal-header">
            <span className="tune-modal-title">INTAKE</span>
            <span className="tune-modal-sub">
              ASSET UPLOAD · VAULT INGESTION PROTOCOL
            </span>
          </div>

          <div className="tune-field">
            <label className="tune-field-label">DESTINATION</label>
            <select
              className="tune-label-input"
              value={vault}
              onChange={(e) => setVault(e.target.value)}
              style={{ cursor: "pointer" }}
            >
              <option value="saturn">{VAULT_DISPLAY_NAMES.saturn}</option>
              <option value="venus">{VAULT_DISPLAY_NAMES.venus}</option>
              <option value="mercury">{VAULT_DISPLAY_NAMES.mercury}</option>
              <option value="earth">{VAULT_DISPLAY_NAMES.earth}</option>
            </select>
          </div>

          {/* Drop zone */}
          <div className="tune-field">
            <label className="tune-field-label">AUDIO FILE</label>
            <div
              className={`upload-dropzone ${file ? "has-file" : ""}`}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept="audio/*"
                style={{ display: "none" }}
                onChange={(e) => applyFile(e.target.files[0])}
              />
              {file ? (
                <span className="upload-filename">{file.name}</span>
              ) : (
                <span className="upload-drop-hint">
                  DROP AUDIO FILE · OR CLICK TO SELECT
                </span>
              )}
            </div>
            {metadataStatus !== "idle" && (
              <div
                className="upload-meta-status"
                role="status"
                aria-live="polite"
              >
                {metadataStatus === "scanning" && "SCANNING TAGS..."}
                {metadataStatus === "detected" &&
                  "METADATA DETECTED · TITLE/ARTIST/BPM AUTO-FILLED"}
                {metadataStatus === "filename-fallback" &&
                  "NO EMBEDDED TAGS · USING FILENAME FALLBACK"}
                {metadataStatus === "scan-error" &&
                  "TAG SCAN FAILED · USING MANUAL/FILENAME DATA"}
              </div>
            )}
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
              <NixieDigits value={bpmNumeric} />
              <input
                type="text"
                inputMode="decimal"
                className="tune-label-input tune-bpm-number"
                value={bpm}
                onChange={(e) => handleBpmChange(e.target.value)}
                placeholder="ANY BPM (e.g. 127.43)"
                maxLength={7}
              />
            </div>
          </div>

          {uploading && (
            <div
              className="upload-progress-shell"
              aria-live="polite"
              role="status"
            >
              <div className="upload-progress-meta">
                <span>{uploadStatusText}</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <div className="upload-progress-track">
                <div
                  className={`upload-progress-fill ${
                    uploadPhase === "finalizing" ? "is-finalizing" : ""
                  }`}
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {error && <div className="upload-error">{error}</div>}
          {success && (
            <div className="upload-success" role="status" aria-live="polite">
              UPLOADED: {success.title} → {VAULT_DISPLAY_NAMES[success.vault]}
            </div>
          )}

          <div className="tune-modal-actions">
            {success ? (
              <>
                <button className="tune-btn tune-btn-cancel" onClick={onClose}>
                  CLOSE
                </button>
                <button
                  className="tune-btn tune-btn-save"
                  onClick={resetForAnother}
                >
                  UPLOAD ANOTHER
                </button>
              </>
            ) : (
              <>
                <button
                  className="tune-btn tune-btn-cancel"
                  onClick={onClose}
                  disabled={uploading}
                >
                  CANCEL
                </button>
                <button
                  className="tune-btn tune-btn-save"
                  onClick={handleSubmit}
                  disabled={!file || !title.trim() || uploading}
                >
                  {uploading ? `${uploadStatusText}...` : "COMMIT TO VAULT"}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default UploadModal;
