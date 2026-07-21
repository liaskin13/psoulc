import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSystem } from "../state/SystemContext";
import { VAULT_DISPLAY_NAMES, VAULT_IDS, UPLOAD_WORKER_URL } from "../config";
import { BatchUploadQueue } from "./BatchUploadQueue";

const isDevMode = UPLOAD_WORKER_URL.includes("localhost");

function UploadModal({
  onClose,
  vault,
  setVault,
  queue,
  addFiles,
  retry,
  dismiss,
  duplicateCount,
  isDraggingOver,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
}) {
  const { consoleOwner } = useSystem();

  return (
    <AnimatePresence>
      <motion.div
        className="tune-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => e.preventDefault()}
      >
        <motion.div
          className={`tune-modal upload-modal ${
            consoleOwner === "D" ? "tune-modal--d" : "tune-modal--cyan"
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
          {isDevMode && (
            <div className="upload-devmode-banner">
              DEV MODE — LOCAL ONLY — NOT UPLOADED TO VAULT
            </div>
          )}

          <div className="tune-field">
            <label className="tune-field-label">DESTINATION</label>
            <select
              className="tune-label-input"
              value={vault}
              onChange={(e) => setVault(e.target.value)}
              style={{ cursor: "pointer" }}
            >
              {VAULT_IDS.map((id) => (
                <option key={id} value={id}>
                  {VAULT_DISPLAY_NAMES[id]}
                </option>
              ))}
            </select>
          </div>

          {/* Drop zone */}
          <div className="tune-field">
            <label className="tune-field-label">AUDIO FILES</label>
            <div
              className={`upload-dropzone ${isDraggingOver ? "is-dragging-over" : ""}`}
              onDragEnter={onDragEnter}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() =>
                document.getElementById("upload-modal-file-input")?.click()
              }
            >
              <input
                id="upload-modal-file-input"
                type="file"
                multiple
                accept="audio/*"
                style={{ display: "none" }}
                onChange={(e) => addFiles(e.target.files)}
              />
              <span className="upload-drop-hint">
                DROP AUDIO FILES · OR CLICK TO SELECT · MULTIPLE OK
              </span>
            </div>
            {duplicateCount > 0 && (
              <div
                className="upload-meta-status"
                role="status"
                aria-live="polite"
              >
                {duplicateCount} DUPLICATE{duplicateCount === 1 ? "" : "S"}{" "}
                SKIPPED — ALREADY IN QUEUE
              </div>
            )}
          </div>

          <BatchUploadQueue queue={queue} onRetry={retry} onDismiss={dismiss} />

          <div className="tune-modal-actions">
            <button className="tune-btn tune-btn-cancel" onClick={onClose}>
              CLOSE
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default UploadModal;
