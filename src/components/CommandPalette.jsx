import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSystem, CMD } from '../state/SystemContext';

// ── COMMAND DEFINITIONS ───────────────────────────────────────────────────────
// Each entry: { id, label, description, authorizedFor, payload }
// authorizedFor: array of owners who can see + dispatch this command.
const ALL_COMMANDS = [
  {
    id: CMD.EXPLORE_VAULT,
    label: 'EXPLORE VAULT',
    description: 'Enter a planet vault',
    authorizedFor: ['D', 'L', 'ANGI'],
    payload: {},
  },
  {
    id: CMD.TUNE_VAULT,
    label: 'TUNE VAULT',
    description: 'Open metadata editor for selected reel',
    authorizedFor: ['D', 'L'],
    payload: {},
  },
  {
    id: CMD.VOID_ITEM,
    label: 'VOID ITEM',
    description: 'Send selected item to Black Star Archive',
    authorizedFor: ['D', 'L'],
    payload: {},
  },
  {
    id: CMD.RESTORE_ITEM,
    label: 'RESTORE ITEM',
    description: 'Restore a voided item from the Archive — Architect only',
    authorizedFor: ['L'],
    payload: {},
  },
  {
    id: CMD.BROADCAST,
    label: 'BROADCAST',
    description: 'Emit a signal to all connected nodes',
    authorizedFor: ['D', 'L'],
    payload: {},
  },
  {
    id: CMD.INTAKE_ASSET,
    label: 'INTAKE ASSET',
    description: 'Ingest a new asset into the active vault',
    authorizedFor: ['D', 'L'],
    payload: {},
  },
  {
    id: CMD.CLAIM_NODE,
    label: 'CLAIM NODE',
    description: 'Claim or rename an empire node',
    authorizedFor: ['D', 'L'],
    payload: {},
  },
  {
    id: CMD.UPLOAD_TRACK,
    label: 'UPLOAD TRACK',
    description: 'Upload audio track to vault',
    authorizedFor: ['D', 'L'],
    payload: {},
  },
];

// ── COMMAND PALETTE ───────────────────────────────────────────────────────────
export default function CommandPalette() {
  const { consoleOwner, dispatchCommand } = useSystem();
  const [open, setOpen]         = useState(false);
  const [query, setQuery]       = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);

  // Filter by owner authorization + live query
  const visible = ALL_COMMANDS.filter(cmd => {
    if (!consoleOwner) return false;
    if (!cmd.authorizedFor.includes(consoleOwner)) return false;
    if (!query) return true;
    return (
      cmd.label.toLowerCase().includes(query.toLowerCase()) ||
      cmd.description.toLowerCase().includes(query.toLowerCase())
    );
  });

  // Reset selection when list changes
  useEffect(() => { setSelected(0); }, [query]);

  // Hotkey: Cmd+K / Ctrl+K to open
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
        setQuery('');
        setSelected(0);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const handleDispatch = useCallback((cmd) => {
    dispatchCommand(cmd.id, cmd.payload);
    setOpen(false);
    setQuery('');
  }, [dispatchCommand]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown')  { e.preventDefault(); setSelected(s => Math.min(s + 1, visible.length - 1)); }
    if (e.key === 'ArrowUp')    { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && visible[selected]) { handleDispatch(visible[selected]); }
  };

  // Don't render at all when no console owner is active
  if (!consoleOwner) return null;

  return (
    <>
      {/* Keyboard hint — subtle, bottom-right */}
      <div className="cmd-palette-hint" onClick={() => setOpen(true)} title="Open command palette">
        ⌘K
      </div>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              className="cmd-palette-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            {/* Palette panel */}
            <motion.div
              className="cmd-palette"
              initial={{ opacity: 0, y: -16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0,   scale: 1    }}
              exit={{ opacity: 0,    y: -8,   scale: 0.97 }}
              transition={{ duration: 0.18, ease: [0.2, 0, 0.3, 1] }}
            >
              {/* Header */}
              <div className="cmd-palette-header">
                <span className="cmd-palette-owner">{consoleOwner}</span>
                <span className="cmd-palette-title">COMMAND PALETTE</span>
                <span className="cmd-palette-close" onClick={() => setOpen(false)}>ESC</span>
              </div>

              {/* Search input */}
              <input
                ref={inputRef}
                className="cmd-palette-input"
                placeholder="Search commands..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />

              {/* Command list */}
              <div className="cmd-palette-list">
                {visible.length === 0 ? (
                  <div className="cmd-palette-empty">No authorized commands match "{query}"</div>
                ) : (
                  visible.map((cmd, idx) => (
                    <div
                      key={cmd.id}
                      className={`cmd-palette-item ${idx === selected ? 'active' : ''}`}
                      onMouseEnter={() => setSelected(idx)}
                      onClick={() => handleDispatch(cmd)}
                    >
                      <span className="cmd-palette-item-label">{cmd.label}</span>
                      <span className="cmd-palette-item-desc">{cmd.description}</span>
                      {idx === selected && <span className="cmd-palette-item-enter">↵</span>}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
