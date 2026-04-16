import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSystem } from '../state/SystemContext';
import GodModePullCord from './GodModePullCord';
import MasterClock from './MasterClock';
import SystemMap2D from './SystemMap2D';
import ConduitSlider from './ConduitSlider';
import InboxPanel from './InboxPanel';
import MembersPanel from './MembersPanel';
import CommentPanel from './CommentPanel';
import { VOID_CHAKRA_COLORS } from '../config';

// ── EVENT HORIZON SUB-PANEL ───────────────────────────────────────────────
// The Black Star archive — accessible as a sub-panel within the Architect's bridge.
function EventHorizonPanel({ architectArchive, onRestore }) {
  return (
    <motion.div
      className="arch-event-horizon-panel"
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0,     opacity: 1 }}
      exit={{ x: '100%',   opacity: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 22 }}
    >
      <div className="arch-panel-header">
        <span className="arch-panel-dot" />
        <span className="arch-panel-title">EVENT HORIZON ARCHIVE</span>
        <span className="arch-panel-sub">Gravitational stasis — Architect access only</span>
      </div>

      <div className="arch-horizon-entries">
        {architectArchive.length === 0 ? (
          <div className="arch-horizon-empty">— Archive holds nothing. The void is clear. —</div>
        ) : (
          architectArchive.map(item => (
            <motion.div
              key={item.id}
              className={`arch-horizon-entry ${item.restored ? 'restored' : ''}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: item.restored ? 0.35 : 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="arch-entry-name">{item.label || item.name || item.id}</div>
              <div className="arch-entry-meta">
                <span
                  className="arch-entry-origin"
                  style={{ color: VOID_CHAKRA_COLORS[item.originPlanet] || '#00b4d8' }}
                >
                  {item.originPlanet?.toUpperCase()}
                </span>
                <span className="arch-entry-time">
                  {new Date(item.voidedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {!item.restored && (
                <button
                  className="arch-restore-btn"
                  onClick={() => onRestore(item.id)}
                >
                  RESTORE
                </button>
              )}
              {item.restored && (
                <span className="arch-restored-badge">RESTORED</span>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Archive count */}
      <div className="arch-panel-footer">
        <span className="arch-count">
          {architectArchive.filter(i => !i.restored).length} ITEMS IN STASIS
        </span>
        <span className="arch-count">
          {architectArchive.filter(i => i.restored).length} RESTORED
        </span>
      </div>
    </motion.div>
  );
}

// ── ARCHITECT VIEWSCREEN ──────────────────────────────────────────────────
function ArchitectViewscreen() {
  return (
    <div className="arch-viewscreen">
      <div className="arch-scanline-overlay" />
      <div className="arch-grid-overlay" />
      <div className="arch-event-horizon-glow" />

      <div className="arch-viewscreen-text">
        <div className="arch-vs-title">ARCHITECT TERMINAL</div>
        <div className="arch-vs-code">ACCESS LEVEL: SOVEREIGN</div>
        <div className="arch-vs-code">BINARY CORE: LOCKED</div>
        <div className="arch-vs-code arch-vs-blink">SYSTEM OPERATIONAL ●</div>
      </div>
    </div>
  );
}

// ── ARCHITECT CONSOLE — Cold Tactical Bridge ──────────────────────────────
// Same command structure as D's console, but cold graphite/cyan aesthetic.
// No 70s warmth, no amber. Clean, precise, surgical.
function ArchitectConsole({ onPowerDown, onExplorePlanet, onBroadcast }) {
  const { isProtected, architectArchive, restoreItem, unreadCountL, members, unreadCommentCount, voidItem } = useSystem();
  const [showArchive,      setShowArchive]      = useState(false);
  const [showInbox,        setShowInbox]        = useState(false);
  const [showMembers,      setShowMembers]      = useState(false);
  const [showComments,     setShowComments]     = useState(false);
  const [activePlanet,     setActivePlanet]     = useState(null);
  const [isBroadcasting,   setIsBroadcasting]   = useState(false);
  const [showPowerConfirm, setShowPowerConfirm] = useState(false);
  const [showVoidConfirm,  setShowVoidConfirm]  = useState(false);

  const handlePlanetSelect = (planetId) => {
    setActivePlanet(planetId === activePlanet ? null : planetId);
  };

  const handleBroadcast = () => {
    setIsBroadcasting(true);
    onBroadcast?.();
    setTimeout(() => setIsBroadcasting(false), 5000);
  };

  const handleExplore = () => {
    if (!activePlanet) return;
    onExplorePlanet?.(activePlanet);
  };

  const handleVoidProtocol = () => {
    if (!activePlanet) return;
    setShowVoidConfirm(true);
  };

  const confirmVoidProtocol = () => {
    if (!activePlanet) return;
    const record = {
      id: `protocol-${Date.now()}`,
      label: `${activePlanet.toUpperCase()} PROTOCOL`,
      name: `${activePlanet.toUpperCase()} PROTOCOL`,
      metadata: { type: 'void-protocol' },
    };
    voidItem(record, activePlanet);
    setShowArchive(true);
    setShowVoidConfirm(false);
  };

  const handlePowerDown = () => {
    setShowPowerConfirm(true);
  };

  const confirmPowerDown = () => {
    onPowerDown?.();
  };

  return (
    <motion.div
      className={`architect-console ${isProtected ? 'arch-protected' : 'arch-active'}`}
      initial={{ opacity: 0, filter: 'brightness(0) blur(8px)' }}
      animate={{ opacity: 1, filter: 'brightness(1) blur(0px)' }}
      transition={{ duration: 1.8, ease: [0.05, 0.9, 0.2, 1] }}
    >
      {/* Architect grain — subtle scanlines */}
      <div className="arch-grain-layer" />

      {/* Receded identity mark */}
      <div className="arch-bg-mark">L</div>

      {/* === VIEWSCREEN — top 60% === */}
      <div className="arch-viewscreen-zone">
        <ArchitectViewscreen />
      </div>

      {/* === CONSOLE STRIP — bottom 40% === */}
      <div className="arch-console-strip">

        {/* LEFT — Pull Cord + Identity */}
        <div className="arch-strip-left">
          <GodModePullCord onPowerDown={handlePowerDown} />
          <div className="arch-identity-block">
            <div className="arch-identity-label">L · ARCHITECT</div>
            <div className="arch-identity-status">
              <span className="arch-status-dot" />
              BLACK STAR ONLINE
            </div>
            <div className="arch-identity-tier">SOVEREIGN ACCESS</div>
          </div>
        </div>

        {/* CENTER — System Map + Clock */}
        <div className="arch-strip-center">
          <MasterClock />
          <div className="arch-map-pit">
            <SystemMap2D
              onPlanetSelect={handlePlanetSelect}
              activePlanet={activePlanet}
            />
          </div>
        </div>

        {/* RIGHT — Archive toggle + Conduit + Panel badges */}
        <div className="arch-strip-right">
          {/* Archive toggle button */}
          <button
            className={`arch-archive-toggle ${showArchive ? 'active' : ''}`}
            onClick={() => setShowArchive(prev => !prev)}
          >
            <span className="arch-archive-icon">◉</span>
            <span className="arch-archive-btn-label">
              EVENT HORIZON
              {architectArchive.length > 0 && (
                <span className="arch-archive-badge">
                  {architectArchive.filter(i => !i.restored).length}
                </span>
              )}
            </span>
          </button>

          {/* Vetting queue — L's inbox */}
          <button
            className={`arch-archive-toggle ${showInbox ? 'active' : ''}`}
            onClick={() => setShowInbox(prev => !prev)}
          >
            <span className="arch-archive-icon">◈</span>
            <span className="arch-archive-btn-label">
              VETTING QUEUE
              {unreadCountL > 0 && (
                <span className="arch-archive-badge">{unreadCountL}</span>
              )}
            </span>
          </button>

          {/* Collective members */}
          <button
            className={`arch-archive-toggle ${showMembers ? 'active' : ''}`}
            onClick={() => setShowMembers(prev => !prev)}
          >
            <span className="arch-archive-icon">◎</span>
            <span className="arch-archive-btn-label">
              COLLECTIVE
              <span className="arch-archive-badge">{members.length}</span>
            </span>
          </button>

          {/* Transmissions (comments) */}
          {unreadCommentCount > 0 && (
            <button
              className={`arch-archive-toggle ${showComments ? 'active' : ''}`}
              onClick={() => setShowComments(prev => !prev)}
            >
              <span className="arch-archive-icon">◌</span>
              <span className="arch-archive-btn-label">
                TRANSMISSIONS
                <span className="arch-archive-badge">{unreadCommentCount}</span>
              </span>
            </button>
          )}

          {/* Broadcast conduit */}
          <ConduitSlider onBroadcast={handleBroadcast} isBroadcasting={isBroadcasting} />

          {/* Planet navigation commands */}
          <div className="arch-command-block">
            <div className="arch-cmd-label">COMMANDS</div>
            <button className="arch-cmd-btn" disabled={!activePlanet} onClick={handleExplore}>
              EXPLORE {activePlanet ? `→ ${activePlanet.toUpperCase()}` : ''}
            </button>
            <button className="arch-cmd-btn arch-cmd-void" disabled={!activePlanet} onClick={handleVoidProtocol}>
              VOID PROTOCOL
            </button>
          </div>
        </div>
      </div>

      {isBroadcasting && <div className="arch-broadcast-pulse">ARCHITECT BROADCAST ACTIVE</div>}

      {/* Event Horizon Archive sub-panel */}
      <AnimatePresence>
        {showArchive && (
          <>
            <motion.div
              className="arch-panel-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowArchive(false)}
            />
            <EventHorizonPanel
              architectArchive={architectArchive}
              onRestore={restoreItem}
            />
          </>
        )}
        {showInbox    && <InboxPanel   viewer="L" onClose={() => setShowInbox(false)} />}
        {showMembers  && <MembersPanel viewer="L" onClose={() => setShowMembers(false)} />}
        {showComments && <CommentPanel viewer="L" onClose={() => setShowComments(false)} />}
      </AnimatePresence>

      {/* Power-down confirmation modal */}
      <AnimatePresence>
        {showVoidConfirm && (
          <motion.div
            className="arch-confirm-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="arch-confirm-dialog">
              <div className="arch-confirm-title">INITIATE VOID PROTOCOL?</div>
              <div className="arch-confirm-msg">Capture {activePlanet?.toUpperCase()} transfer event into the Eternal Registry.</div>
              <div className="arch-confirm-btns">
                <button className="arch-confirm-yes" onClick={confirmVoidProtocol}>CONFIRM</button>
                <button className="arch-confirm-no" onClick={() => setShowVoidConfirm(false)}>CANCEL</button>
              </div>
            </div>
          </motion.div>
        )}

        {showPowerConfirm && (
          <motion.div
            className="arch-confirm-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="arch-confirm-dialog">
              <div className="arch-confirm-title">POWER DOWN ARCHITECT TERMINAL?</div>
              <div className="arch-confirm-msg">Return to Gate. Binary lock will hold.</div>
              <div className="arch-confirm-btns">
                <button className="arch-confirm-yes" onClick={confirmPowerDown}>CONFIRM</button>
                <button className="arch-confirm-no"  onClick={() => setShowPowerConfirm(false)}>CANCEL</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default ArchitectConsole;
