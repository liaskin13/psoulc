import React from 'react';
import { motion } from 'framer-motion';
import { useSystem } from '../state/SystemContext';

// ── COMMENT PANEL — D + L Console ─────────────────────────────────────────
// Shows all comments from Tier B members across all vaults.
// Grouped chronologically. Mark-read on open.

const PLANET_COLORS = {
  mercury:  '#a0c4ff',
  venus:    '#ffb7b7',
  earth:    '#87ceeb',
  mars:     '#c1440e',
  saturn:   '#c5a059',
  amethyst: '#9d65c9',
};

function CommentPanel({ onClose, viewer = 'D' }) {
  const { comments, markCommentRead, unreadCommentCount } = useSystem();
  const isL = viewer === 'L';

  // Mark all unread as read when panel opens
  React.useEffect(() => {
    comments.filter(c => !c.read).forEach(c => markCommentRead(c.id));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      className={`inbox-panel comment-panel ${isL ? 'members-panel-arch' : ''}`}
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
    >
      <div className="inbox-panel-header">
        <span className="inbox-panel-title">TRANSMISSIONS</span>
        <span className="inbox-panel-count">
          {unreadCommentCount > 0 ? `${unreadCommentCount} NEW` : 'ALL READ'}
        </span>
        <button className="inbox-close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="inbox-panel-body">
        {comments.length === 0 ? (
          <div className="inbox-empty">
            <div className="inbox-empty-glyph">◎</div>
            <div className="inbox-empty-text">NO TRANSMISSIONS</div>
          </div>
        ) : (
          comments.map(c => (
            <div key={c.id} className={`inbox-card comment-card ${c.read ? 'inbox-card-read' : 'inbox-card-unread'}`}>
              <div className="inbox-card-header">
                <span
                  className="inbox-type-badge"
                  style={{ backgroundColor: PLANET_COLORS[c.planetId] || '#888', color: '#111' }}
                >
                  {c.planetId?.toUpperCase() || 'SYSTEM'}
                </span>
                {!c.read && <span className="inbox-unread-dot" />}
                <span className="inbox-timestamp">
                  {new Date(c.timestamp).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="inbox-card-name">{c.from}</div>
              <div className="comment-track-name">{c.trackName}</div>
              <div className="comment-body">{c.body}</div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}

export default CommentPanel;
