import React, { useEffect, useMemo, useState } from 'react';
import './DirectLinePanel.css';

const DIRECT_LINE_KEY = 'psc_direct_line';

function loadDirectMessages() {
  try {
    return JSON.parse(localStorage.getItem(DIRECT_LINE_KEY) || '[]');
  } catch (_) {
    return [];
  }
}

function saveDirectMessages(messages) {
  try {
    localStorage.setItem(DIRECT_LINE_KEY, JSON.stringify(messages));
  } catch (_) {}
}

export default function DirectLinePanel({ viewer, variant = 'architect' }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState(loadDirectMessages);

  const peer = viewer === 'L' ? 'D' : 'L';

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== DIRECT_LINE_KEY) return;
      setMessages(loadDirectMessages());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (!open) return;
    const next = messages.map((msg) => {
      if (msg.to !== viewer) return msg;
      if (Array.isArray(msg.readBy) && msg.readBy.includes(viewer)) return msg;
      return { ...msg, readBy: [...(msg.readBy || []), viewer] };
    });
    setMessages(next);
    saveDirectMessages(next);
  }, [open, messages, viewer]);

  const thread = useMemo(() => {
    return messages
      .filter((m) => (m.from === viewer && m.to === peer) || (m.from === peer && m.to === viewer))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messages, peer, viewer]);

  const unreadCount = useMemo(() => {
    return messages.filter((m) => m.to === viewer && !(m.readBy || []).includes(viewer)).length;
  }, [messages, viewer]);

  const sendMessage = () => {
    const body = draft.trim();
    if (!body) return;
    const next = [
      ...messages,
      {
        id: `direct-${Date.now()}`,
        from: viewer,
        to: peer,
        body,
        createdAt: new Date().toISOString(),
        readBy: [viewer],
      },
    ];
    setMessages(next);
    saveDirectMessages(next);
    setDraft('');
  };

  return (
    <>
      <button
        className={`direct-line-trigger ${variant === 'architect' ? 'architect' : 'analog'}`}
        onClick={() => setOpen(true)}
        aria-expanded={open}
      >
        DIRECT
        {unreadCount > 0 && <span className="direct-line-badge">{unreadCount}</span>}
      </button>

      {open && (
        <div className="direct-line-overlay" role="dialog" aria-modal="true" aria-label="Direct line">
          <div className={`direct-line-panel ${variant === 'architect' ? 'architect' : 'analog'}`}>
            <div className="direct-line-head">
              <span className="direct-line-title">DIRECT LINE · {viewer} ↔ {peer}</span>
              <button className="direct-line-close" onClick={() => setOpen(false)} aria-label="Close direct line">✕</button>
            </div>

            <div className="direct-line-thread">
              {thread.length === 0 ? (
                <div className="direct-line-empty">NO TRANSMISSIONS YET</div>
              ) : (
                thread.map((msg) => (
                  <div key={msg.id} className={`direct-line-msg ${msg.from === viewer ? 'outbound' : 'inbound'}`}>
                    <div className="direct-line-meta">{msg.from} · {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="direct-line-body">{msg.body}</div>
                  </div>
                ))
              )}
            </div>

            <div className="direct-line-compose">
              <textarea
                className="direct-line-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`Message ${peer}`}
                maxLength={800}
              />
              <button className="direct-line-send" onClick={sendMessage}>SEND</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
