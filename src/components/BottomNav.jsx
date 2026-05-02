import React from 'react';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { id: 'saturn',  label: 'ORIGINAL COMPOSITIONS', glyph: '◉' },
  { id: 'venus',   label: 'CURATED MIXES',    glyph: '◈' },
  { id: 'earth',   label: 'SONIC ARCHITECTURE',  glyph: '◧' },
  { id: 'mercury', label: 'LIVE SETS',     glyph: '▶' },
];

/**
 * BottomNav — Mobile-only vault switcher.
 * Renders as a fixed bottom bar; hidden via CSS at ≥768px.
 *
 * Props:
 *   activeId   — currently open planet/vault id
 *   onSelect   — (id) => void
 */
function BottomNav({ activeId, onSelect }) {
  return (
    <nav className="bottom-nav" aria-label="Vault navigation">
      {NAV_ITEMS.map(item => (
        <motion.button
          key={item.id}
          className={`bottom-nav-item ${activeId === item.id ? 'active' : ''}`}
          onClick={() => onSelect(item.id)}
          whileTap={{ scale: 0.9 }}
          aria-label={`Open ${item.label} vault`}
          aria-current={activeId === item.id ? 'page' : undefined}
        >
          <span className="bottom-nav-glyph" aria-hidden="true">{item.glyph}</span>
          <span>{item.label}</span>
        </motion.button>
      ))}
    </nav>
  );
}

export default BottomNav;
