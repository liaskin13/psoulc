import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSystem } from '../state/SystemContext';
import { SATURN_TRACKS } from '../data/saturn';
import { VENUS_MIXES } from '../data/venus';
import { EARTH_DOCUMENTS } from '../data/earth';
import { MARS_TRACKS } from '../data/mars';
import { MERCURY_TRACKS } from '../data/mercury';
import { AMETHYST_BOWLS, AMETHYST_SESSIONS } from '../data/amethyst';

const TOTAL_TRACKS =
  SATURN_TRACKS.length +
  VENUS_MIXES.length +
  EARTH_DOCUMENTS.length +
  MARS_TRACKS.length +
  MERCURY_TRACKS.length +
  AMETHYST_BOWLS.length +
  AMETHYST_SESSIONS.length;
import GodModePullCord from './GodModePullCord';
import MasterClock from './MasterClock';
import ReadoutNavigator from './ReadoutNavigator';
import ConduitSlider from './ConduitSlider';
import AssetIntakeSlot from './AssetIntakeSlot';
import LatentTray from './LatentTray';
import InboxPanel from './InboxPanel';
import MembersPanel from './MembersPanel';
import CommentPanel from './CommentPanel';

// ── Vault pad bank — left AKAI zone ────────────────────────────────────────
// Each pad maps to a planet vault. Chakra-lit when active.
const VAULT_PADS = [
  { id: 'venus',    abbr: 'MIX',  label: 'MIXES',          color: '#ff7c00' },
  { id: 'saturn',   abbr: 'OG',   label: 'ORIGINAL MUSIC', color: '#9b59b6' },
  { id: 'mercury',  abbr: 'LST',  label: 'LIVE SETS',      color: '#8B0000' },
  { id: 'earth',    abbr: 'ARC',  label: 'SONIC ARCH',     color: '#00cc44' },
  { id: 'mars',     abbr: 'JB',   label: 'JESS B',         color: '#c1440e' },
  { id: 'amethyst', abbr: 'AGI',  label: 'ANGI',           color: '#6600cc' },
];

// ── LED meter strip — Neve-style visual indicator ────────────────────────────
function LedStrip({ color = '#ffbf00', segments = 8, level = 0 }) {
  return (
    <div className="console-led-strip" aria-hidden="true">
      {Array.from({ length: segments }, (_, i) => {
        const lit = i < level;
        const red = i >= segments - 2;
        const yellow = i >= segments - 4 && !red;
        const segColor = lit ? (red ? '#ff2020' : yellow ? '#ffcc00' : color) : 'rgba(40,30,20,0.6)';
        return (
          <div
            key={i}
            className="console-led-segment"
            style={{ backgroundColor: segColor, boxShadow: lit ? `0 0 4px ${segColor}80` : 'none' }}
          />
        );
      })}
    </div>
  );
}

// ── Vault pad ────────────────────────────────────────────────────────────────
function VaultPad({ pad, isActive, onClick }) {
  return (
    <motion.button
      className={`console-pad vault-pad ${isActive ? 'pad-active' : ''}`}
      style={{
        '--pad-color': pad.color,
        '--pad-glow': pad.color + '60',
      }}
      onClick={() => onClick(pad)}
      aria-label={`Open ${pad.label} vault`}
      aria-pressed={isActive}
      whileTap={{ scale: 0.92 }}
    >
      <span className="pad-abbr">{pad.abbr}</span>
      {isActive && <span className="pad-active-dot" aria-hidden="true" />}
    </motion.button>
  );
}

// ── Action pad ───────────────────────────────────────────────────────────────
function ActionPad({ label, color = '#ffbf00', badge, armed, disabled, onClick, ariaLabel }) {
  return (
    <motion.button
      className={`console-pad action-pad ${armed ? 'pad-armed' : ''} ${disabled ? 'pad-disabled' : ''}`}
      style={{ '--pad-color': color, '--pad-glow': color + '60' }}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel || label}
      aria-pressed={armed}
      whileTap={disabled ? undefined : { scale: 0.92 }}
    >
      <span className="pad-abbr">{label}</span>
      {badge > 0 && <span className="pad-badge">{badge}</span>}
    </motion.button>
  );
}

// ── Console topbar — live clock + vault health ────────────────────────────────
function ConsoleTopbar() {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hh = String(time.getHours()).padStart(2, '0');
  const mm = String(time.getMinutes()).padStart(2, '0');
  const ss = String(time.getSeconds()).padStart(2, '0');

  return (
    <div className="console-topbar">
      <div className="topbar-clock">
        <span className="topbar-clock-digits">{hh}:{mm}:{ss}</span>
        <span className="topbar-clock-label">LOCAL</span>
      </div>
      <div className="topbar-divider" />
      <div className="topbar-vault-health">
        <span className="topbar-health-count">{TOTAL_TRACKS}</span>
        <span className="topbar-health-label">TRK · ALL VAULTS</span>
      </div>
      <div className="topbar-divider" />
      <div className="topbar-status">
        <span className="topbar-status-dot" aria-hidden="true" />
        <span className="topbar-status-label">VAULT ONLINE</span>
      </div>
    </div>
  );
}

// ── Main console ─────────────────────────────────────────────────────────────
function AnalogConsole({
  activeNode,
  onNodeSelect,
  onNodeLongPress,
  onClaimNode,
  onBroadcast,
  onIntake,
  isBroadcasting,
  latentNodes = [],
  saturnMoons,
  onMoonSync,
  onPowerDown
}) {
  const { isProtected, unreadCount, members, unreadCommentCount, animationsEnabled, setAnimationsEnabled } = useSystem();
  const [showInbox,    setShowInbox]    = useState(false);
  const [showMembers,  setShowMembers]  = useState(false);
  const [showComments, setShowComments] = useState(false);

  const activeVaultId = activeNode?.id;

  const handleVaultPad = (pad) => {
    onNodeSelect?.({ id: pad.id, label: pad.label });
  };

  return (
    <div className={`analog-console ${isProtected ? 'protected' : 'create'}`}>
      <ConsoleTopbar />

      {/* ── LEFT ZONE — Vault pad grid ────────────────────────────────────── */}
      <div className="console-left console-pad-zone">
        <span className="console-zone-label">VAULTS</span>
        <LedStrip color="#ffbf00" segments={8} level={activeVaultId ? 4 : 1} />
        <div className="pad-grid pad-grid-2x3">
          {VAULT_PADS.map(pad => (
            <VaultPad
              key={pad.id}
              pad={pad}
              isActive={activeVaultId === pad.id}
              onClick={handleVaultPad}
            />
          ))}
        </div>
        {/* Power controls below pads */}
        <div className="console-power-row">
          <GodModePullCord onPowerDown={onPowerDown} />
          <button
            className="anim-toggle-btn"
            onClick={() => setAnimationsEnabled(v => !v)}
            aria-label={`Entry animations ${animationsEnabled ? 'on' : 'off'}`}
          >
            {animationsEnabled ? '◉' : '○'}
          </button>
        </div>
      </div>

      <div className="console-zone-divider" />

      {/* ── CENTER ZONE — Encoder readout ─────────────────────────────────── */}
      <div className="console-center">
        <span className="console-zone-label">NAVIGATION · SYSTEMS</span>
        <MasterClock />
        <div className="console-pit">
          <ReadoutNavigator
            activeNode={activeNode}
            onNodeSelect={onNodeSelect}
            onNodeLongPress={onNodeLongPress}
          />
        </div>
      </div>

      <div className="console-zone-divider" />

      {/* ── RIGHT ZONE — Action pad grid ──────────────────────────────────── */}
      <div className="console-right console-pad-zone">
        <span className="console-zone-label">OPERATIONS</span>
        <LedStrip color="#00aaff" segments={8} level={isBroadcasting ? 7 : (unreadCount + unreadCommentCount > 0 ? 3 : 1)} />
        <div className="pad-grid pad-grid-2x4">
          <ActionPad
            label="INBOX"
            color="#c87c2a"
            badge={unreadCount}
            onClick={() => setShowInbox(true)}
            ariaLabel={`Inbox — ${unreadCount} pending`}
          />
          <ActionPad
            label="CREW"
            color="#6f3f9c"
            badge={members.length}
            onClick={() => setShowMembers(true)}
            ariaLabel={`${members.length} collective members`}
          />
          <ActionPad
            label="TRANS"
            color="#00aaff"
            badge={unreadCommentCount}
            onClick={() => setShowComments(true)}
            ariaLabel={`Transmissions — ${unreadCommentCount} unread`}
          />
          <ActionPad
            label="INTAKE"
            color="#00cc44"
            onClick={onIntake}
            ariaLabel="Asset intake"
          />
          <ActionPad
            label={isBroadcasting ? '■ CAST' : '▶ CAST'}
            color="#00aaff"
            armed={isBroadcasting}
            onClick={onBroadcast}
            ariaLabel={isBroadcasting ? 'Stop broadcast' : 'Start broadcast'}
          />
          <ActionPad label="POWER" color="#cc2020" onClick={onPowerDown} ariaLabel="Power down" />
          <ActionPad
            label={animationsEnabled ? 'ANIM ●' : 'ANIM ○'}
            color="#ffbf00"
            armed={animationsEnabled}
            onClick={() => setAnimationsEnabled(v => !v)}
            ariaLabel={`Animations ${animationsEnabled ? 'on' : 'off'}`}
          />
          <ActionPad label="SPARE" color="#444" disabled ariaLabel="Reserved" />
        </div>

        {latentNodes.length > 0 && (
          <LatentTray latentNodes={latentNodes} onClaimNode={onClaimNode} />
        )}
      </div>

      {/* Slide-in panels */}
      <AnimatePresence>
        {showInbox    && <InboxPanel    viewer="D" onClose={() => setShowInbox(false)} />}
        {showMembers  && <MembersPanel  viewer="D" onClose={() => setShowMembers(false)} />}
        {showComments && <CommentPanel  viewer="D" onClose={() => setShowComments(false)} />}
      </AnimatePresence>
    </div>
  );
}

export default AnalogConsole;
