import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSystem } from '../state/SystemContext';

// ── INBOX PANEL — Two-Stage Vetting Pipeline ───────────────────────────────
// viewer='L' → shows pending_L queue (L vets first)
// viewer='D' → shows approved_L queue (D gives final approval + assigns code)

const VAULTS = ['mercury', 'venus', 'earth', 'saturn', '— none —'];

function LCard({ request, onApprove, onDecline }) {
  const [open,          setOpen]          = useState(false);
  const [planet,        setPlanet]        = useState(request.suggestedPlanet || '— none —');
  const [confirming,    setConfirming]    = useState(false);

  const handleApprove = () => {
    setConfirming(false);
    onApprove(request.id, planet === '— none —' ? null : planet);
  };

  return (
    <div className={`inbox-card ${request.read ? 'inbox-card-read' : 'inbox-card-unread'}`}>
      <div className="inbox-card-header">
        <span className="inbox-type-badge inbox-type-collaborate">COLLABORATE</span>
        {!request.read && <span className="inbox-unread-dot" />}
        <span className="inbox-timestamp">
          {new Date(request.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div className="inbox-card-name">{request.name}</div>
      <div className="inbox-card-contact">{request.contact}</div>

      {request.answers && (
        <div className="inbox-card-answers">
          {Object.values(request.answers).map((a, i) => (
            <div key={i} className="inbox-answer-row"><span className="inbox-answer-text">{a}</span></div>
          ))}
          {request.filename && <div className="inbox-file-row">▶ {request.filename}</div>}
        </div>
      )}

      {!confirming ? (
        <div className="inbox-card-actions">
          <button className="inbox-action-btn inbox-action-approve" onClick={() => setConfirming(true)}>APPROVE</button>
          <button className="inbox-action-btn inbox-action-decline" onClick={() => onDecline(request.id)}>DECLINE</button>
        </div>
      ) : (
        <div className="inbox-approve-form">
          <label className="inbox-planet-label">SUGGEST PLANET (optional)</label>
          <select className="inbox-planet-select" value={planet} onChange={e => setPlanet(e.target.value)}>
            {VAULTS.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
          </select>
          <div className="inbox-card-actions">
            <button className="inbox-action-btn inbox-action-approve" onClick={handleApprove}>CONFIRM → SEND TO D</button>
            <button className="inbox-action-btn inbox-action-cancel" onClick={() => setConfirming(false)}>CANCEL</button>
          </div>
        </div>
      )}
    </div>
  );
}

function DCard({ request, onFinalApprove, onDecline }) {
  const [confirming,  setConfirming]  = useState(false);
  const [planet,      setPlanet]      = useState(request.suggestedPlanet || '— none —');
  const [generatedCode, setGeneratedCode] = useState(null);

  const handleApprove = () => {
    const code = onFinalApprove(request.id, planet === '— none —' ? null : planet);
    setGeneratedCode(code);
    setConfirming(false);
  };

  if (generatedCode) {
    return (
      <div className="inbox-card inbox-card-approved">
        <div className="inbox-card-name">{request.name}</div>
        <div className="inbox-code-flash">
          <span className="inbox-code-label">PERSONAL CODE</span>
          <span className="inbox-code-value">{generatedCode}</span>
          <span className="inbox-code-sub">TRANSMIT TO MEMBER</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`inbox-card ${request.read ? 'inbox-card-read' : 'inbox-card-unread'}`}>
      <div className="inbox-card-header">
        <span className="inbox-type-badge inbox-type-collaborate">COLLABORATE</span>
        {!request.read && <span className="inbox-unread-dot" />}
        <span className="inbox-timestamp">
          {new Date(request.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div className="inbox-card-name">{request.name}</div>
      <div className="inbox-card-contact">{request.contact}</div>
      {request.suggestedPlanet && (
        <div className="inbox-suggested-planet">L suggests: {request.suggestedPlanet.toUpperCase()}</div>
      )}

      {request.answers && (
        <div className="inbox-card-answers">
          {Object.values(request.answers).map((a, i) => (
            <div key={i} className="inbox-answer-row"><span className="inbox-answer-text">{a}</span></div>
          ))}
          {request.filename && <div className="inbox-file-row">▶ {request.filename}</div>}
        </div>
      )}

      {!confirming ? (
        <div className="inbox-card-actions">
          <button className="inbox-action-btn inbox-action-approve" onClick={() => setConfirming(true)}>APPROVE</button>
          <button className="inbox-action-btn inbox-action-decline" onClick={() => onDecline(request.id)}>DECLINE</button>
        </div>
      ) : (
        <div className="inbox-approve-form">
          <label className="inbox-planet-label">ASSIGN PLANET (optional)</label>
          <select className="inbox-planet-select" value={planet} onChange={e => setPlanet(e.target.value)}>
            {VAULTS.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
          </select>
          <div className="inbox-card-actions">
            <button className="inbox-action-btn inbox-action-approve" onClick={handleApprove}>CONFIRM · GENERATE CODE</button>
            <button className="inbox-action-btn inbox-action-cancel" onClick={() => setConfirming(false)}>CANCEL</button>
          </div>
        </div>
      )}
    </div>
  );
}

function InboxPanel({ onClose, viewer = 'D' }) {
  const { inboxRequests, markRead, unreadCount, unreadCountL, approveRequest, declineRequest, finalApproveRequest } = useSystem();

  const isL = viewer === 'L';
  const filtered = isL
    ? inboxRequests.filter(r => r.status === 'pending_L')
    : inboxRequests.filter(r => r.status === 'approved_L');

  const pendingCount = isL ? unreadCountL : unreadCount;

  return (
    <motion.div
      className="inbox-panel"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
    >
      <div className="inbox-panel-header">
        <span className="inbox-panel-title">{isL ? 'VETTING QUEUE' : 'CONSOLE INBOX'}</span>
        <span className="inbox-panel-count">
          {pendingCount > 0 ? `${pendingCount} PENDING` : 'ALL CLEAR'}
        </span>
        <button className="inbox-close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="inbox-panel-body">
        {filtered.length === 0 ? (
          <div className="inbox-empty">
            <div className="inbox-empty-glyph">◎</div>
            <div className="inbox-empty-text">{isL ? 'No submissions awaiting vetting.' : 'No approved submissions to review.'}</div>
          </div>
        ) : (
          filtered.map(req => isL ? (
            <LCard
              key={req.id}
              request={req}
              onApprove={(id, planet) => { approveRequest(id, planet); markRead(id); }}
              onDecline={(id) => { declineRequest(id); markRead(id); }}
            />
          ) : (
            <DCard
              key={req.id}
              request={req}
              onFinalApprove={(id, planet) => { const code = finalApproveRequest(id, planet); markRead(id); return code; }}
              onDecline={(id) => { declineRequest(id); markRead(id); }}
            />
          ))
        )}
      </div>

      <div className="inbox-panel-footer">
        <span className="inbox-footer-note">
          {isL ? 'Approved submissions move to D\'s queue' : 'Approved members receive a personal access code'}
        </span>
      </div>
    </motion.div>
  );
}

export default InboxPanel;
