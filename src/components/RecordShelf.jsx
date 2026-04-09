import React from 'react';
import { motion } from 'framer-motion';

/**
 * RecordShelf — Sovereign Library display.
 *
 * Renders items as 40×250 vertical spines with:
 *   - Sun-facing left-edge specular gradient (bright face → dark trailing edge)
 *   - Framer Motion pop-out on hover (x: 30px toward viewer)
 *   - Comfortaa uppercase vertical label
 *   - Optional VOID handle on top edge
 *
 * Item shape:
 *   { id, label, sublabel?, highlight, base, shadow, glow, metadata? }
 */
function RecordShelf({ items, activeId, onSelect, onVoid }) {
  return (
    <div className="record-shelf">
      {items.map(item => (
        <motion.div
          key={item.id}
          className={`spine ${activeId === item.id ? 'spine-active' : ''}`}
          style={{
            '--spine-highlight': item.highlight,
            '--spine-base':      item.base,
            '--spine-shadow':    item.shadow,
            '--spine-glow':      item.glow,
          }}
          animate={activeId === item.id ? { x: 12 } : { x: 0 }}
          whileHover={{ x: 30, filter: 'brightness(1.35)' }}
          transition={{ duration: 0.16, ease: [0.2, 0, 0.3, 1] }}
          onClick={() => onSelect(item)}
        >
          {/* Left-edge specular — sun-lit face */}
          <div className="spine-specular" />

          {/* Vertical primary label — reads bottom-to-top */}
          <div className="spine-label">{item.label}</div>

          {/* Vertical sub-label — BPM / Hz / year */}
          {item.sublabel && (
            <div className="spine-sublabel">{item.sublabel}</div>
          )}

          {/* VOID handle — top edge dot, visible on hover */}
          {onVoid && (
            <motion.div
              className="spine-void-handle"
              title="VOID to Black Star"
              onClick={e => { e.stopPropagation(); onVoid(item); }}
              whileHover={{ scale: 1.4, backgroundColor: 'rgba(80,0,200,0.8)' }}
            />
          )}
        </motion.div>
      ))}

      {/* Walnut shelf floor */}
      <div className="shelf-floor" />
    </div>
  );
}

export default RecordShelf;
