import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { startTapeHiss, stopTapeHiss, play528HzGlow } from '../audio/vaultAudio';
import { hasHover } from '../utils/device';

/**
 * RecordShelf — Sovereign Library display.
 *
 * Props:
 *   items      — array of { id, label, sublabel?, highlight, base, shadow, glow }
 *   activeId   — currently selected item id
 *   onSelect   — (item) => void
 *   onVoid     — (item, pos) => void  — if undefined, VOID handle hidden
 *   onComment  — (item, body) => void — if undefined, COMMENT handle hidden
 */
function RecordShelf({ items, activeId, onSelect, onVoid, onComment }) {
  const [commentingId, setCommentingId] = useState(null);
  const [commentText,  setCommentText]  = useState('');

  const handleCommentSubmit = (e, item) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onComment(item, commentText.trim());
    setCommentText('');
    setCommentingId(null);
  };

  return (
    <div className="record-shelf" role="list" aria-label="Track archive">
      {items.map(item => (
        <motion.div
          key={item.id}
          role="listitem"
          className={`file-cell ${activeId === item.id ? 'file-cell-active' : ''} ${item.playState ? `file-cell-${item.playState}` : ''}`}
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
          whileHover={hasHover ? { y: -6, filter: 'brightness(1.2)' } : undefined}
          transition={{ duration: 0.16, ease: [0.2, 0, 0.3, 1] }}
          onClick={() => onSelect(item)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelect(item);
            }
          }}
          onHoverStart={() => { if (hasHover) { startTapeHiss(); play528HzGlow(); } }}
          onHoverEnd={() => { if (hasHover) stopTapeHiss(); }}
        >
          {/* Soul-chakra ownership rail — left edge, colored by authorship */}
          <div className="file-cell-chakra-rail" aria-hidden="true" />

          <div className="file-cell-specular" aria-hidden="true" />

          {/* Member sigil — initials badge, visible in top-right corner */}
          {item.createdBy && (
            <div className="file-cell-sigil" title={item.createdBy} aria-label={`Created by ${item.createdBy}`}>
              {item.createdBy.slice(0, 2).toUpperCase()}
            </div>
          )}

          <div className="file-cell-header">
            <div className="file-cell-label">{item.label}</div>
            <div className={`file-cell-state file-cell-state-${item.playState || 'idle'}`}>
              {(item.playState || 'idle').toUpperCase()}
            </div>
          </div>

          {item.sublabel && <div className="file-cell-meta">{item.sublabel}</div>}

          {/* VOID handle — top edge dot, visible on hover */}
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

          {/* COMMENT handle — bottom edge dot, visible on hover */}
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
        </motion.div>
      ))}

      {/* Inline comment form — appears when a spine is in commenting mode */}
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

      {/* Walnut shelf floor */}
      <div className="shelf-floor" aria-hidden="true" />
    </div>
  );
}

export default RecordShelf;
