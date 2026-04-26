import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { hasHover } from '../utils/device';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { getWaveformBars } from '../utils/waveform';

function WaveformThumb({ seed, chakra }) {
  const bars = getWaveformBars(String(seed));
  const barW = 3, gap = 2, H = 22;
  const W = bars.length * (barW + gap) - gap;
  return (
    <svg
      className="file-cell-waveform"
      aria-hidden="true"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
    >
      {bars.map((pct, i) => {
        const h = (pct / 100) * H;
        return (
          <rect
            key={i}
            x={i * (barW + gap)}
            y={H - h}
            width={barW}
            height={h}
            rx="1"
            fill={chakra || 'rgba(255,191,0,0.4)'}
          />
        );
      })}
    </svg>
  );
}

function RecordShelf({ items, activeId, onSelect, onVoid, onComment, onVoiceComment, capacity = 20 }) {
  const [commentingId, setCommentingId] = useState(null);
  const [commentText,  setCommentText]  = useState('');
  const [recordingId,  setRecordingId]  = useState(null);

  const handleVoiceCommit = useCallback((audioDataUrl) => {
    if (!recordingId) return;
    const item = items.find(i => i.id === recordingId);
    if (item) onVoiceComment?.(item, audioDataUrl);
    setRecordingId(null);
  }, [recordingId, items, onVoiceComment]);

  const { isRecording, startRecording, stopRecording, cancelRecording, error: recError } =
    useVoiceRecorder({ onCommit: handleVoiceCommit });

  const handleCommentSubmit = (e, item) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onComment(item, commentText.trim());
    setCommentText('');
    setCommentingId(null);
  };

  // Pad to `capacity` with empty placeholder slots
  const emptyCount = Math.max(0, capacity - items.length);

  return (
    <div className="record-shelf" role="list" aria-label="Track archive">
      {items.map(item => (
        <motion.div
          key={item.id}
          role="listitem"
          className={`file-cell file-cell-occupied ${activeId === item.id ? 'file-cell-active' : ''} ${item.playState ? `file-cell-${item.playState}` : ''}`}
          style={{
            '--spine-highlight': item.highlight,
            '--spine-base':      item.base,
            '--spine-shadow':    item.shadow,
            '--spine-glow':      item.glow,
            '--cell-chakra':     item.chakraColor || 'rgba(255,200,100,0.3)',
          }}
          tabIndex={0}
          aria-label={`${item.label}${item.sublabel ? ` — ${item.sublabel}` : ''}`}
          aria-pressed={activeId === item.id}
          animate={activeId === item.id ? { y: -4 } : { y: 0 }}
          whileHover={hasHover ? { y: -3, filter: 'brightness(1.15)' } : undefined}
          transition={{ duration: 0.16, ease: [0.2, 0, 0.3, 1] }}
          onClick={() => onSelect(item)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelect(item);
            }
          }}
        >
          <div className="file-cell-specular" aria-hidden="true" />
          <div className="file-cell-chakra-rail" aria-hidden="true" />
          <WaveformThumb seed={item.id} chakra={item.chakraColor} />

          {/* Centered 'dp' mark — occupied indicator (C) */}
          <div className="file-cell-dp-mark" aria-hidden="true">dp</div>

          {/* Hover-reveal content */}
          <div className="file-cell-content">
            <div className="file-cell-header">
              <div className="file-cell-label">{item.label}</div>
              <div className={`file-cell-state file-cell-state-${item.playState || 'idle'}`}>
                {(item.playState || 'idle').toUpperCase()}
              </div>
            </div>
            {item.sublabel && <div className="file-cell-meta">{item.sublabel}</div>}
          </div>

          {/* VOID handle */}
          {onVoid && (
            <motion.div
              role="button"
              tabIndex={0}
              className="file-cell-void-handle"
              aria-label={`Void ${item.label} to the Black Star`}
              onClick={e => {
                e.stopPropagation();
                const cellEl = e.currentTarget.closest('.file-cell');
                const rect = cellEl ? cellEl.getBoundingClientRect() : null;
                const pos  = rect
                  ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
                  : null;
                onVoid(item, pos);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  onVoid(item, null);
                }
              }}
              whileHover={{ scale: 1.4, backgroundColor: 'rgba(80,0,200,0.8)' }}
            />
          )}

          {/* COMMENT handle */}
          {onComment && (
            <motion.div
              role="button"
              tabIndex={0}
              className="file-cell-comment-handle"
              aria-label={`Leave a transmission for ${item.label}`}
              aria-expanded={commentingId === item.id}
              onClick={e => {
                e.stopPropagation();
                setCommentingId(commentingId === item.id ? null : item.id);
                setCommentText('');
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  setCommentingId(commentingId === item.id ? null : item.id);
                  setCommentText('');
                }
              }}
              whileHover={{ scale: 1.4, backgroundColor: 'rgba(0,180,216,0.8)' }}
            />
          )}

          {/* VOICE handle — arms MediaRecorder for this cell */}
          {onVoiceComment && (
            <motion.div
              role="button"
              tabIndex={0}
              className={`file-cell-voice-handle ${recordingId === item.id && isRecording ? 'recording' : ''}`}
              aria-label={recordingId === item.id && isRecording ? `Stop voice transmission for ${item.label}` : `Record voice transmission for ${item.label}`}
              aria-pressed={recordingId === item.id && isRecording}
              onClick={e => {
                e.stopPropagation();
                if (recordingId === item.id && isRecording) {
                  stopRecording();
                } else {
                  setRecordingId(item.id);
                  startRecording();
                }
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  if (recordingId === item.id && isRecording) stopRecording();
                  else { setRecordingId(item.id); startRecording(); }
                }
              }}
              whileHover={{ scale: 1.4 }}
              animate={recordingId === item.id && isRecording
                ? { backgroundColor: ['rgba(220,0,0,0.7)', 'rgba(220,0,0,0.4)', 'rgba(220,0,0,0.7)'], scale: [1, 1.2, 1] }
                : { backgroundColor: 'rgba(180,60,0,0.5)' }
              }
              transition={recordingId === item.id && isRecording
                ? { repeat: Infinity, duration: 0.9 }
                : { duration: 0.16 }
              }
            >
              {recordingId === item.id && isRecording ? '■' : '⏺'}
            </motion.div>
          )}
        </motion.div>
      ))}

      {/* Empty slots — dark recesses, no glow, no sigil */}
      {Array.from({ length: emptyCount }, (_, i) => (
        <div
          key={`empty-${i}`}
          role="listitem"
          aria-label="Empty slot"
          className="file-cell file-cell-empty"
        >
          <div className="file-cell-specular" aria-hidden="true" />
        </div>
      ))}

      {/* Recording error banner */}
      {recError && (
        <div className="spine-comment-form" role="alert" style={{ color: 'rgba(255,80,80,0.9)', fontSize: '0.65rem', letterSpacing: '0.1em', padding: '8px 10px' }}>
          ⚠ {recError.toUpperCase()}
          <button className="spine-comment-cancel" style={{ marginLeft: 12 }} onClick={cancelRecording}>DISMISS</button>
        </div>
      )}

      {/* Inline comment form */}
      {commentingId && onComment && (() => {
        const item = items.find(i => i.id === commentingId);
        if (!item) return null;
        return (
          <form
            className="spine-comment-form"
            onSubmit={e => handleCommentSubmit(e, item)}
            onClick={e => e.stopPropagation()}
            aria-label={`Transmission for ${item.label}`}
          >
            <div className="spine-comment-label" id="comment-label">
              TRANSMISSION · {item.label}
            </div>
            <textarea
              className="spine-comment-textarea"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="your signal..."
              maxLength={280}
              rows={3}
              autoFocus
              aria-labelledby="comment-label"
              aria-describedby="comment-char-count"
            />
            <div id="comment-char-count" className="spine-comment-label" style={{ opacity: 0.4, fontSize: '0.65rem' }}>
              {commentText.length}/280
            </div>
            <div className="spine-comment-actions">
              <button
                type="submit"
                className="spine-comment-submit"
                disabled={!commentText.trim()}
                aria-disabled={!commentText.trim()}
              >
                TRANSMIT
              </button>
              <button
                type="button"
                className="spine-comment-cancel"
                onClick={() => { setCommentingId(null); setCommentText(''); }}
              >
                CANCEL
              </button>
            </div>
          </form>
        );
      })()}

      <div className="shelf-floor" aria-hidden="true" />
    </div>
  );
}

export default RecordShelf;
