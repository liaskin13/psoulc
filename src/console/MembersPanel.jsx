import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSystem } from '../state/SystemContext';
import { MOON_PREFIX } from '../config';

// ── MEMBERS PANEL — D + L Console ─────────────────────────────────────────
// Two tabs: MEMBERS (Tier B) + LISTENERS (registry of 0000 users).
// D and L can add members manually. Generated codes are shown once on creation.

const VAULTS = ['mercury', 'venus', 'earth', 'saturn'];

function MembersPanel({ onClose, viewer = 'D' }) {
  const { members, listeners, addMember } = useSystem();
  const [tab,          setTab]          = useState('members');
  const [showAdd,      setShowAdd]      = useState(false);
  const [newName,      setNewName]      = useState('');
  const [newPlanet,    setNewPlanet]    = useState('');
  const [newTier,      setNewTier]      = useState('B');
  const [newMoonName,  setNewMoonName]  = useState('');
  const [newCode,      setNewCode]      = useState('');
  const [flashCode,    setFlashCode]    = useState(null);
  const [revealId,     setRevealId]     = useState(null);

  const isL = viewer === 'L';
  const accentClass = isL ? 'members-panel-arch' : '';

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const planet = newTier === 'C'
      ? (newMoonName.trim() ? `${MOON_PREFIX}${newMoonName.trim().toLowerCase()}` : null)
      : (newPlanet || null);
    const code = addMember(newName.trim(), planet, viewer, newTier, isL ? newCode : null);
    setFlashCode({ name: newName.trim(), code });
    setNewName('');
    setNewPlanet('');
    setNewMoonName('');
    setNewCode('');
    setNewTier('B');
    setShowAdd(false);
  };

  return (
    <motion.div
      className={`inbox-panel members-panel ${accentClass}`}
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
    >
      <div className="inbox-panel-header">
        <span className="inbox-panel-title">COLLECTIVE</span>
        <span className="inbox-panel-count">{members.length} MEMBER{members.length !== 1 ? 'S' : ''}</span>
        <button className="inbox-close-btn" onClick={onClose}>✕</button>
      </div>

      {/* Tab bar */}
      <div className="members-tab-bar">
        <button
          className={`members-tab ${tab === 'members' ? 'members-tab-active' : ''}`}
          onClick={() => setTab('members')}
        >
          MEMBERS ({members.length})
        </button>
        <button
          className={`members-tab ${tab === 'listeners' ? 'members-tab-active' : ''}`}
          onClick={() => setTab('listeners')}
        >
          LISTENERS ({listeners.length})
        </button>
      </div>

      <div className="inbox-panel-body">
        {/* Flash code confirmation */}
        {flashCode && (
          <div className="inbox-code-flash" style={{ marginBottom: '12px' }}>
            <span className="inbox-code-label">{flashCode.name} — PERSONAL CODE</span>
            <span className="inbox-code-value">{flashCode.code}</span>
            <span className="inbox-code-sub">TRANSMIT TO MEMBER</span>
            <button className="inbox-action-btn inbox-action-cancel" onClick={() => setFlashCode(null)} style={{ marginTop: '8px' }}>DISMISS</button>
          </div>
        )}

        {/* MEMBERS tab */}
        {tab === 'members' && (
          <>
            {members.length === 0 ? (
              <div className="inbox-empty">
                <div className="inbox-empty-glyph">◎</div>
                <div className="inbox-empty-text">No members yet.</div>
              </div>
            ) : (
              members.map(m => (
                <div key={m.id} className="members-card">
                  <div className="members-card-name">{m.name}</div>
                  <div className="members-card-meta">
                    {m.tier === 'C' && m.planet?.startsWith(MOON_PREFIX) ? (
                      <span className="members-planet-badge members-moon-badge">
                        ◎ {m.planet.replace(MOON_PREFIX, '').toUpperCase()}
                      </span>
                    ) : m.planet ? (
                      <span className="members-planet-badge">{m.planet.toUpperCase()}</span>
                    ) : (
                      <span className="members-planet-badge members-planet-open">OPEN ACCESS</span>
                    )}
                    <span
                      className="members-code"
                      title="hover to reveal"
                      onMouseEnter={() => setRevealId(m.id)}
                      onMouseLeave={() => setRevealId(null)}
                    >
                      {revealId === m.id ? m.code : '••••'}
                    </span>
                    <span className="members-created-by">via {m.createdBy}</span>
                  </div>
                </div>
              ))
            )}

            {/* Add member */}
            {!showAdd ? (
              <button className="inbox-action-btn inbox-action-approve members-add-btn" onClick={() => setShowAdd(true)}>
                + ADD MEMBER
              </button>
            ) : (
              <form className="members-add-form" onSubmit={handleAdd}>
                <input
                  className="access-input"
                  placeholder="name"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  maxLength={64}
                  autoFocus
                  required
                />
                {/* Tier toggle */}
                <div className="members-tier-toggle">
                  <button
                    type="button"
                    className={`members-tier-btn ${newTier === 'B' ? 'members-tier-btn-active' : ''}`}
                    onClick={() => setNewTier('B')}
                  >
                    COLLECTIVE
                  </button>
                  <button
                    type="button"
                    className={`members-tier-btn members-tier-btn-moon ${newTier === 'C' ? 'members-tier-btn-active-moon' : ''}`}
                    onClick={() => setNewTier('C')}
                  >
                    MOON ARTIST
                  </button>
                </div>
                {/* Planet or Moon Name field */}
                {newTier === 'B' ? (
                  <select className="inbox-planet-select" value={newPlanet} onChange={e => setNewPlanet(e.target.value)}>
                    <option value="">— no planet assigned —</option>
                    {VAULTS.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                  </select>
                ) : (
                  <input
                    className="access-input"
                    placeholder="moon name (e.g. KENDRICK)"
                    value={newMoonName}
                    onChange={e => setNewMoonName(e.target.value.toUpperCase())}
                    maxLength={32}
                    required
                  />
                )}
                {/* SET CODE — L only: manual code entry */}
                {isL && (
                  <input
                    className="access-input"
                    placeholder="set code (e.g. 2112)"
                    value={newCode}
                    onChange={e => setNewCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    maxLength={8}
                  />
                )}
                <div className="inbox-card-actions">
                  <button type="submit" className="inbox-action-btn inbox-action-approve" disabled={!newName.trim() || (newTier === 'C' && !newMoonName.trim())}>
                    GENERATE CODE
                  </button>
                  <button type="button" className="inbox-action-btn inbox-action-cancel" onClick={() => setShowAdd(false)}>
                    CANCEL
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* LISTENERS tab */}
        {tab === 'listeners' && (
          listeners.length === 0 ? (
            <div className="inbox-empty">
              <div className="inbox-empty-glyph">◎</div>
              <div className="inbox-empty-text">No listeners registered.</div>
            </div>
          ) : (
            listeners.map(l => (
              <div key={l.id} className="members-card">
                <div className="members-card-name">{l.name}</div>
                <div className="members-card-meta">
                  <span className="inbox-card-contact">{l.contact}</span>
                  <span className="members-created-by">
                    {new Date(l.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </motion.div>
  );
}

export default MembersPanel;
