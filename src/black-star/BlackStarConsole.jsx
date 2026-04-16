import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSystem } from '../state/SystemContext';

// ── BLACK STAR CONSOLE ─────────────────────────────────────────────────────
// L's Architect View — the silent gravitational anchor.
// Sees all voided items as Ghost Shadows. Can restore or permanently remove.
// Color: Architect Black (#000000), Event Horizon Red (#8B0000), Amber edges.

function EventHorizonLog({ architectArchive, onRestore }) {
  return (
    <div className="event-horizon-log">
      <div className="arch-panel-label">EVENT HORIZON ARCHIVE</div>
      <div className="arch-panel-sub">Voided items held in gravitational stasis</div>

      <div className="horizon-entries">
        {architectArchive.length === 0 ? (
          <div className="horizon-empty">— Archive is empty. The void holds nothing. —</div>
        ) : (
          architectArchive.map((item) => (
            <motion.div
              key={item.id}
              className={`horizon-entry ${item.restored ? 'restored' : ''}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: item.restored ? 0.35 : 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="horizon-entry-name">{item.label || item.name || item.id}</div>
              <div className="horizon-entry-meta">
                <span className="horizon-origin" style={{ color: `var(--chakra-${item.originPlanet})` }}>
                  {item.originPlanet?.toUpperCase()}
                </span>
                <span className="horizon-time">
                  {new Date(item.voidedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {!item.restored && (
                <button
                  className="horizon-restore-btn"
                  onClick={() => onRestore(item.id)}
                  title="Restore to origin vault"
                >
                  RESTORE
                </button>
              )}
              {item.restored && (
                <span className="horizon-restored-badge">RESTORED</span>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

function ArchitectViewscreen() {
  return (
    <div className="architect-viewscreen">
      {/* Reversed, slower parallax — Black Star's perspective */}
      <div className="arch-starfield-far" />
      <div className="arch-starfield-mid" />
      <div className="arch-starfield-near" />

      {/* Event horizon corona at center */}
      <div className="arch-event-horizon" />

      <div className="arch-welcome">
        <div className="arch-welcome-text">ARCHITECT CONSOLE ONLINE</div>
        <div className="arch-welcome-sub">Binary Sovereignty · Black Star Portal · 7677</div>
      </div>
    </div>
  );
}

function BlackStarConsole({ onExit }) {
  const { architectArchive, restoreItem, voidedItems } = useSystem();
  const [selectedItem, setSelectedItem] = useState(null);
  const [showPowerDownConfirm, setShowPowerDownConfirm] = useState(false);

  const handlePowerDown = () => {
    setShowPowerDownConfirm(true);
  };

  const confirmPowerDown = () => {
    onExit();
  };

  const cancelPowerDown = () => {
    setShowPowerDownConfirm(false);
  };

  return (
    <motion.div
      className="black-star-console"
      initial={{ opacity: 0, scale: 0.96, filter: 'brightness(0)' }}
      animate={{ opacity: 1, scale: 1, filter: 'brightness(1)' }}
      transition={{ duration: 1.8, ease: [0.05, 0.9, 0.2, 1] }}
    >
      {/* Architectural grain */}
      <div className="arch-grain" />

      {/* Receded dp mark */}
      <div className="arch-receded-logo">dp</div>

      {/* Viewscreen — reversed starfield */}
      <ArchitectViewscreen />

      {/* Ghost Shadows overlay — voided items as spectral outlines */}
      <div className="ghost-shadows-layer">
        {voidedItems.filter(i => !i.restored).map((item, idx) => (
          <motion.div
            key={item.id}
            className="ghost-shadow"
            style={{
              '--ghost-color': `var(--chakra-${item.originPlanet}, #ffffff)`,
              left: `${20 + (idx % 6) * 12}%`,
              top: `${30 + Math.floor(idx / 6) * 15}%`,
            }}
            animate={{
              opacity: [0.04, 0.10, 0.04],
              scale: [0.95, 1.02, 0.95],
            }}
            transition={{ duration: 4, delay: idx * 0.3, repeat: Infinity }}
          >
            {item.label || item.name}
          </motion.div>
        ))}
      </div>

      {/* Console strip */}
      <div className="arch-console-strip">
        {/* Left — identity */}
        <div className="arch-identity">
          <div className="arch-owner-label">L · ARCHITECT</div>
          <div className="arch-status-dot" />
          <div className="arch-status-text">BLACK STAR ONLINE</div>
        </div>

        {/* Center — Event Horizon Archive */}
        <EventHorizonLog
          architectArchive={architectArchive}
          onRestore={restoreItem}
        />

        {/* Right — controls */}
        <div className="arch-controls">
          <div className="arch-panel-label">CONTROLS</div>
          <div className="arch-archive-count">
            <span className="arch-count-num">{architectArchive.length}</span>
            <span className="arch-count-label">ITEMS IN ARCHIVE</span>
          </div>
          <div className="arch-archive-count">
            <span className="arch-count-num">
              {architectArchive.filter(i => !i.restored).length}
            </span>
            <span className="arch-count-label">ACTIVE HOLD</span>
          </div>

          <button className="arch-exit-btn" onClick={handlePowerDown}>
            POWER DOWN
          </button>
        </div>
      </div>

      {/* Power-down confirmation modal */}
      <AnimatePresence>
        {showPowerDownConfirm && (
          <motion.div
            className="black-star-confirm-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="confirm-dialog">
              <div className="confirm-title">POWER DOWN BLACK STAR?</div>
              <div className="confirm-message">Return to New Silence login.</div>
              <div className="confirm-buttons">
                <button className="confirm-btn confirm-yes" onClick={confirmPowerDown}>
                  CONFIRM
                </button>
                <button className="confirm-btn confirm-no" onClick={cancelPowerDown}>
                  CANCEL
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default BlackStarConsole;
