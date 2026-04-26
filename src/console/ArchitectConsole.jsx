import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSystem } from '../state/SystemContext';
import GodModePullCord from './GodModePullCord';
import MasterClock from './MasterClock';
import SystemMap2D from './SystemMap2D';
import ConduitSlider from './ConduitSlider';
import InboxPanel from './InboxPanel';
import CommentPanel from './CommentPanel';
import { VOID_CHAKRA_COLORS, MOON_PREFIX } from '../config';
import {
  tierDefaultsForMember,
  resolveMatrixPerm,
  toggleMatrixPerm,
  commitMatrixState,
  rollbackMatrixState,
} from './matrixState';

const PLANETS = ['mercury', 'venus', 'earth', 'mars', 'saturn', 'amethyst'];

const SR_ONLY_STYLE = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

// ── EVENT HORIZON SUB-PANEL ───────────────────────────────────────────────
// The Black Star archive — accessible as a sub-panel within the Architect's bridge.
function EventHorizonPanel({ architectArchive, onRestore }) {
  return (
    <motion.div
      id="arch-event-horizon-panel"
      role="dialog"
      aria-modal="false"
      aria-labelledby="arch-archive-title"
      aria-describedby="arch-archive-sub"
      className="arch-event-horizon-panel"
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0,     opacity: 1 }}
      exit={{ x: '100%',   opacity: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 22 }}
    >
      <div className="arch-panel-header">
        <span className="arch-panel-dot" />
        <span id="arch-archive-title" className="arch-panel-title">EVENT HORIZON ARCHIVE</span>
        <span id="arch-archive-sub" className="arch-panel-sub">Gravitational stasis — Architect access only</span>
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

// ── ARCHITECT CONSOLE — Cold Tactical Bridge ──────────────────────────────
// Same command structure as D's console, but cold graphite/cyan aesthetic.
// No 70s warmth, no amber. Clean, precise, surgical.
function ArchitectConsole({ onPowerDown, onExplorePlanet, onBroadcast }) {
  const { isProtected, architectArchive, restoreItem, unreadCountL, members, unreadCommentCount, voidItem, addMember } = useSystem();
  const MATRIX_COMMITTED_KEY = 'psc_matrix_committed';
  const MATRIX_HISTORY_KEY = 'psc_matrix_history';
  const [showArchive,      setShowArchive]      = useState(false);
  const [showInbox,        setShowInbox]        = useState(false);
  const [showRoster,       setShowRoster]       = useState(false);
  const [showComments,     setShowComments]     = useState(false);
  const [activePlanet,     setActivePlanet]     = useState(null);
  const [isBroadcasting,   setIsBroadcasting]   = useState(false);
  const [showPowerConfirm, setShowPowerConfirm] = useState(false);
  const [showVoidConfirm,  setShowVoidConfirm]  = useState(false);
  // ROSTER add-member form state
  const [rosterShowAdd,  setRosterShowAdd]  = useState(false);
  const [rosterName,     setRosterName]     = useState('');
  const [rosterPlanet,   setRosterPlanet]   = useState('');
  const [rosterTier,     setRosterTier]     = useState('B');
  const [rosterMoon,     setRosterMoon]     = useState('');
  const [rosterCode,     setRosterCode]     = useState('');
  const [rosterFlash,    setRosterFlash]    = useState(null);
  const [rosterReveal,   setRosterReveal]   = useState(null);
  // CMD MATRIX state
  const [showMatrix,     setShowMatrix]     = useState(false);
  const [matrixArmed,    setMatrixArmed]    = useState(false);
  const [matrixPending,  setMatrixPending]  = useState({}); // { [memberId]: { void, tune, comment } }
  const [matrixCommitted, setMatrixCommitted] = useState({});
  const [matrixHistory, setMatrixHistory] = useState([]);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const announceTimerRef = useRef(null);

  const announce = (message) => {
    if (!message) return;
    if (announceTimerRef.current) clearTimeout(announceTimerRef.current);
    setLiveAnnouncement('');
    announceTimerRef.current = setTimeout(() => {
      setLiveAnnouncement(message);
    }, 20);
  };

  useEffect(() => {
    try {
      const committed = JSON.parse(localStorage.getItem(MATRIX_COMMITTED_KEY) || '{}');
      const history = JSON.parse(localStorage.getItem(MATRIX_HISTORY_KEY) || '[]');
      if (committed && typeof committed === 'object') setMatrixCommitted(committed);
      if (Array.isArray(history)) setMatrixHistory(history);
    } catch (_) {
      setMatrixCommitted({});
      setMatrixHistory([]);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(MATRIX_COMMITTED_KEY, JSON.stringify(matrixCommitted));
    } catch (_) {}
  }, [matrixCommitted]);

  useEffect(() => {
    try {
      localStorage.setItem(MATRIX_HISTORY_KEY, JSON.stringify(matrixHistory));
    } catch (_) {}
  }, [matrixHistory]);

  useEffect(() => () => {
    if (announceTimerRef.current) clearTimeout(announceTimerRef.current);
  }, []);

  const handlePlanetSelect = (planetId) => {
    const nextPlanet = planetId === activePlanet ? null : planetId;
    setActivePlanet(nextPlanet);
    announce(nextPlanet ? `${nextPlanet.toUpperCase()} selected.` : 'Planet selection cleared.');
  };

  const toggleArchive = () => {
    setShowArchive(prev => {
      const next = !prev;
      announce(`Event Horizon ${next ? 'opened' : 'closed'}.`);
      return next;
    });
  };

  const toggleInbox = () => {
    setShowInbox(prev => {
      const next = !prev;
      announce(`Vetting Queue ${next ? 'opened' : 'closed'}.`);
      return next;
    });
  };

  const toggleRoster = () => {
    setShowRoster(prev => {
      const next = !prev;
      announce(`Roster ${next ? 'opened' : 'closed'}.`);
      return next;
    });
  };

  const toggleMatrix = () => {
    setShowMatrix(prev => {
      const next = !prev;
      announce(`Command matrix ${next ? 'opened' : 'closed'}.`);
      return next;
    });
  };

  const toggleComments = () => {
    setShowComments(prev => {
      const next = !prev;
      announce(`Transmissions ${next ? 'opened' : 'closed'}.`);
      return next;
    });
  };

  const handleBroadcast = () => {
    setIsBroadcasting(true);
    onBroadcast?.();
    announce('Architect broadcast active for five seconds.');
    setTimeout(() => setIsBroadcasting(false), 5000);
  };

  const handleExplore = () => {
    if (!activePlanet) return;
    onExplorePlanet?.(activePlanet);
    announce(`Exploring ${activePlanet.toUpperCase()}.`);
  };

  const handleVoidProtocol = () => {
    if (!activePlanet) return;
    setShowVoidConfirm(true);
    announce(`Void protocol confirmation opened for ${activePlanet.toUpperCase()}.`);
  };

  const handleRosterAdd = (e) => {
    e.preventDefault();
    if (!rosterName.trim()) return;
    const planet = rosterTier === 'C'
      ? (rosterMoon.trim() ? `${MOON_PREFIX}${rosterMoon.trim().toLowerCase()}` : null)
      : (rosterPlanet || null);
    const code = addMember(rosterName.trim(), planet, 'L', rosterTier, rosterCode || null);
    setRosterFlash({ name: rosterName.trim(), code });
    setRosterName(''); setRosterPlanet(''); setRosterMoon('');
    setRosterCode(''); setRosterTier('B'); setRosterShowAdd(false);
    announce(`${rosterName.trim()} added to roster with tier ${rosterTier}.`);
  };

  const handleMatrixToggle = (memberId, perm) => {
    if (!matrixArmed) return;
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    const tierDefaults = tierDefaultsForMember(member.tier);
    const current = resolveMatrixPerm({
      pendingEntry: matrixPending[memberId],
      committedEntry: matrixCommitted[memberId],
      tierDefaults,
      perm,
    });
    const nextValue = !current;
    announce(`${member.name || 'Member'} ${perm} permission ${nextValue ? 'enabled' : 'disabled'} (pending).`);
    setMatrixPending(prev => {
      return toggleMatrixPerm({
        pending: prev,
        committed: matrixCommitted,
        memberId,
        perm,
        tierDefaults,
      });
    });
  };

  const handleMatrixArm = () => {
    setMatrixArmed(true);
    announce('Matrix armed. Permission cells unlocked.');
  };

  const handleMatrixCommit = () => {
    const pendingCount = Object.keys(matrixPending).length;
    const nextState = commitMatrixState({
      history: matrixHistory,
      committed: matrixCommitted,
      pending: matrixPending,
    });
    setMatrixHistory(nextState.history);
    setMatrixCommitted(nextState.committed);
    setMatrixPending(nextState.pending);
    setMatrixArmed(false);
    announce(`Matrix committed. ${pendingCount} member ${pendingCount === 1 ? 'change' : 'changes'} applied.`);
  };

  const handleMatrixDisarm = () => {
    setMatrixPending({});
    setMatrixArmed(false);
    announce('Matrix disarmed. Pending changes cleared.');
  };

  const handleMatrixRollback = () => {
    const nextState = rollbackMatrixState({ history: matrixHistory });
    if (!nextState.didRollback) {
      announce('No rollback snapshot available.');
      return;
    }
    setMatrixCommitted(nextState.committed);
    setMatrixHistory(nextState.history);
    setMatrixPending({});
    setMatrixArmed(false);
    announce('Matrix rolled back to previous committed state.');
  };

  // Effective permission for a member in the matrix (committed overrides tier defaults)
  const matrixPerm = (memberId, perm, tierDefault) => {
    return resolveMatrixPerm({
      pendingEntry: matrixPending[memberId],
      committedEntry: matrixCommitted[memberId],
      tierDefaults: { [perm]: tierDefault },
      perm,
    });
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
    announce(`${activePlanet.toUpperCase()} protocol transferred to Event Horizon.`);
  };

  const handlePowerDown = () => {
    setShowPowerConfirm(true);
    announce('Power down confirmation opened.');
  };

  const confirmPowerDown = () => {
    announce('Powering down Architect terminal.');
    onPowerDown?.();
  };

  useEffect(() => {
    const onEscape = (event) => {
      if (event.key !== 'Escape') return;
      if (showPowerConfirm) {
        setShowPowerConfirm(false);
        announce('Power down confirmation dismissed.');
        return;
      }
      if (showVoidConfirm) {
        setShowVoidConfirm(false);
        announce('Void protocol confirmation dismissed.');
        return;
      }
      if (showArchive) {
        setShowArchive(false);
        announce('Event Horizon closed.');
        return;
      }
      if (showInbox) {
        setShowInbox(false);
        announce('Vetting Queue closed.');
        return;
      }
      if (showComments) {
        setShowComments(false);
        announce('Transmissions closed.');
        return;
      }
      if (showMatrix) {
        setShowMatrix(false);
        announce('Command matrix closed.');
        return;
      }
      if (showRoster) {
        setShowRoster(false);
        announce('Roster closed.');
      }
    };

    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [showArchive, showComments, showInbox, showMatrix, showPowerConfirm, showRoster, showVoidConfirm]);

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

      {/* === CONSOLE STRIP — full surface === */}
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
            onClick={toggleArchive}
            aria-expanded={showArchive}
            aria-controls="arch-event-horizon-panel"
            aria-haspopup="dialog"
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
            onClick={toggleInbox}
            aria-expanded={showInbox}
            aria-controls="arch-inbox-panel"
            aria-haspopup="dialog"
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
            className={`arch-archive-toggle ${showRoster ? 'active' : ''}`}
            onClick={toggleRoster}
            aria-expanded={showRoster}
            aria-controls="arch-roster-zone"
          >
            <span className="arch-archive-icon">◎</span>
            <span className="arch-archive-btn-label">
              ROSTER
              <span className="arch-archive-badge">{members.length}</span>
            </span>
          </button>

          {/* CMD MATRIX */}
          <button
            className={`arch-archive-toggle ${showMatrix ? 'active' : ''} ${matrixArmed ? 'arch-toggle-armed' : ''}`}
            onClick={toggleMatrix}
            aria-expanded={showMatrix}
            aria-controls="arch-matrix-zone"
          >
            <span className="arch-archive-icon">⊞</span>
            <span className="arch-archive-btn-label">CMD MATRIX</span>
          </button>

          {/* Transmissions (comments) */}
          {unreadCommentCount > 0 && (
            <button
              className={`arch-archive-toggle ${showComments ? 'active' : ''}`}
              onClick={toggleComments}
              aria-expanded={showComments}
              aria-controls="arch-comments-panel"
              aria-haspopup="dialog"
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
      <div style={SR_ONLY_STYLE} role="status" aria-live="polite" aria-atomic="true">{liveAnnouncement}</div>

      {/* === ROSTER ZONE — inline dense phosphor table === */}
      <AnimatePresence>
        {showRoster && (
          <motion.div
            id="arch-roster-zone"
            className="arch-roster-zone"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="arch-roster-header">
              <span className="arch-roster-title">ROSTER</span>
              <span className="arch-roster-count">{members.length} MEMBERS</span>
            </div>

            {rosterFlash && (
              <div className="arch-roster-flash">
                <span className="arch-roster-flash-name">{rosterFlash.name}</span>
                <span className="arch-roster-flash-code">{rosterFlash.code}</span>
                <span className="arch-roster-flash-sub">TRANSMIT TO MEMBER — THEN DISMISS</span>
                <button className="arch-roster-flash-dismiss" onClick={() => setRosterFlash(null)}>DISMISS</button>
              </div>
            )}

            <table className="arch-roster-table">
              <thead>
                <tr>
                  <th>TIER</th>
                  <th>HANDLE</th>
                  <th>PLANET</th>
                  <th>CODE</th>
                  <th>REGISTERED</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr><td colSpan={5} className="arch-roster-empty">— NO MEMBERS REGISTERED —</td></tr>
                ) : members.map(m => (
                  <tr key={m.id}>
                    <td className="arch-roster-tier">{m.tier}</td>
                    <td className="arch-roster-handle">{m.name}</td>
                    <td className="arch-roster-planet">
                      {m.planet?.startsWith(MOON_PREFIX)
                        ? `◎ ${m.planet.replace(MOON_PREFIX, '').toUpperCase()}`
                        : (m.planet?.toUpperCase() || '—')}
                    </td>
                    <td
                      className="arch-roster-code"
                      onMouseEnter={() => setRosterReveal(m.id)}
                      onMouseLeave={() => setRosterReveal(null)}
                      onFocus={() => setRosterReveal(m.id)}
                      onBlur={() => setRosterReveal(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setRosterReveal(prev => (prev === m.id ? null : m.id));
                        }
                        if (e.key === 'Escape') {
                          setRosterReveal(null);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-pressed={rosterReveal === m.id}
                      aria-label={`Member ${m.name} access code`}
                    >
                      {rosterReveal === m.id ? m.code : '••••'}
                    </td>
                    <td className="arch-roster-date">
                      {new Date(m.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!rosterShowAdd ? (
              <button className="arch-roster-add-btn" onClick={() => setRosterShowAdd(true)}>+ ADD MEMBER</button>
            ) : (
              <form className="arch-roster-add-form" onSubmit={handleRosterAdd}>
                <input className="arch-roster-input" placeholder="HANDLE" value={rosterName}
                  onChange={e => setRosterName(e.target.value)} maxLength={64} autoFocus required />
                <div className="arch-roster-tier-toggle">
                  <button type="button" className={`arch-roster-tier-btn ${rosterTier === 'B' ? 'active' : ''}`}
                    onClick={() => setRosterTier('B')}>COLLECTIVE</button>
                  <button type="button" className={`arch-roster-tier-btn ${rosterTier === 'C' ? 'active' : ''}`}
                    onClick={() => setRosterTier('C')}>MOON ARTIST</button>
                </div>
                {rosterTier === 'B' ? (
                  <select className="arch-roster-select" value={rosterPlanet} onChange={e => setRosterPlanet(e.target.value)}>
                    <option value="">— NO PLANET —</option>
                    {PLANETS.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                  </select>
                ) : (
                  <input className="arch-roster-input" placeholder="MOON NAME" value={rosterMoon}
                    onChange={e => setRosterMoon(e.target.value.toUpperCase())} maxLength={32} required />
                )}
                <input className="arch-roster-input" placeholder="SET CODE (e.g. 2112)" value={rosterCode}
                  onChange={e => setRosterCode(e.target.value.replace(/\D/g, '').slice(0, 8))} maxLength={8} />
                <div className="arch-roster-form-actions">
                  <button type="submit" className="arch-roster-commit"
                    disabled={!rosterName.trim() || (rosterTier === 'C' && !rosterMoon.trim())}>COMMIT</button>
                  <button type="button" className="arch-roster-cancel" onClick={() => setRosterShowAdd(false)}>CANCEL</button>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* === CMD MATRIX ZONE — permission grid with ARM/COMMIT interlock === */}
      <AnimatePresence>
        {showMatrix && (
          <motion.div
            id="arch-matrix-zone"
            className="arch-matrix-zone"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="arch-matrix-header">
              <span className="arch-matrix-title">CMD MATRIX</span>
              <span className="arch-matrix-sub">PERMISSION GRID — ARM TO EDIT</span>
              <div className="arch-matrix-interlocks">
                {!matrixArmed ? (
                  <button className="arch-matrix-arm" onClick={handleMatrixArm}>ARM</button>
                ) : (
                  <>
                    <button className="arch-matrix-commit" onClick={handleMatrixCommit}
                      disabled={Object.keys(matrixPending).length === 0}>COMMIT</button>
                    <button className="arch-matrix-cancel" onClick={handleMatrixDisarm}>CANCEL</button>
                  </>
                )}
                <button
                  className="arch-matrix-rollback"
                  onClick={handleMatrixRollback}
                  disabled={matrixHistory.length === 0}
                >
                  ROLLBACK
                </button>
              </div>
            </div>

            <table className="arch-matrix-table">
              <thead>
                <tr>
                  <th>HANDLE</th>
                  <th>TIER</th>
                  <th>PLANET</th>
                  <th>VOID</th>
                  <th>TUNE</th>
                  <th>COMMENT</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr><td colSpan={6} className="arch-matrix-empty">— NO MEMBERS —</td></tr>
                ) : members.map(m => {
                  const tierVoid    = m.tier === 'A' || m.tier === 'B';
                  const tierTune    = m.tier === 'A' || m.tier === 'B';
                  const tierComment = m.tier === 'A' || m.tier === 'B' || m.tier === 'C';
                  return (
                    <tr key={m.id} className={matrixPending[m.id] ? 'arch-matrix-row-pending' : ''}>
                      <td className="arch-matrix-handle">{m.name}</td>
                      <td className="arch-matrix-tier">{m.tier}</td>
                      <td className="arch-matrix-planet">
                        {m.planet?.startsWith(MOON_PREFIX)
                          ? m.planet.replace(MOON_PREFIX, '').toUpperCase()
                          : (m.planet?.toUpperCase() || '—')}
                      </td>
                      {['void', 'tune', 'comment'].map((perm, i) => {
                        const defaults = [tierVoid, tierTune, tierComment];
                        const active = matrixPerm(m.id, perm, defaults[i]);
                        const hasPending = matrixPending[m.id]?.[perm] !== undefined;
                        return (
                          <td key={perm}>
                            <button
                              className={`arch-matrix-cell ${active ? 'arch-cell-on' : 'arch-cell-off'} ${hasPending ? 'arch-cell-pending' : ''} ${!matrixArmed ? 'arch-cell-locked' : ''}`}
                              onClick={() => handleMatrixToggle(m.id, perm)}
                              disabled={!matrixArmed}
                              title={matrixArmed ? `Toggle ${perm}` : 'ARM required'}
                              aria-pressed={active}
                              aria-label={`${m.name} ${perm} permission ${active ? 'enabled' : 'disabled'}`}
                            >
                              {active ? '●' : '○'}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>

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
        {showInbox    && <div id="arch-inbox-panel"><InboxPanel viewer="L" onClose={() => setShowInbox(false)} /></div>}
        {showComments && <div id="arch-comments-panel"><CommentPanel viewer="L" onClose={() => setShowComments(false)} /></div>}
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
            <div
              className="arch-confirm-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="arch-void-title"
              aria-describedby="arch-void-msg"
            >
              <div id="arch-void-title" className="arch-confirm-title">INITIATE VOID PROTOCOL?</div>
              <div id="arch-void-msg" className="arch-confirm-msg">Capture {activePlanet?.toUpperCase()} transfer event into the Eternal Registry.</div>
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
            <div
              className="arch-confirm-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="arch-power-title"
              aria-describedby="arch-power-msg"
            >
              <div id="arch-power-title" className="arch-confirm-title">POWER DOWN ARCHITECT TERMINAL?</div>
              <div id="arch-power-msg" className="arch-confirm-msg">Return to Gate. Binary lock will hold.</div>
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
