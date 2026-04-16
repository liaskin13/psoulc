import React, { createContext, useContext, useState, useEffect } from 'react';
import { INBOX_KEY, MEMBERS_KEY, LISTENERS_KEY, COMMENTS_KEY, SESSION_KEY, AMETHYST_CODE, MARS_CODE } from '../config';

// Global system state — Binary Sovereignty v3
// Adds: dynamic member/listener registries, enriched session metadata,
// per-record comment system, and two-stage L→D inbox vetting pipeline.

const REGISTRY_KEY = 'psc_eternal_registry';
const TUNE_OVERRIDES_KEY = 'psc_tune_overrides';

// ─── Loaders ─────────────────────────────────────────────────────────────────

function loadRegistry() {
  try { return JSON.parse(localStorage.getItem(REGISTRY_KEY)) || []; } catch (_) { return []; }
}

function loadInbox() {
  try { return JSON.parse(localStorage.getItem(INBOX_KEY)) || []; } catch (_) { return []; }
}

function loadComments() {
  try { return JSON.parse(localStorage.getItem(COMMENTS_KEY)) || []; } catch (_) { return []; }
}

function loadListeners() {
  try { return JSON.parse(localStorage.getItem(LISTENERS_KEY)) || []; } catch (_) { return []; }
}

function loadTuneOverrides() {
  try { return JSON.parse(localStorage.getItem(TUNE_OVERRIDES_KEY)) || {}; } catch (_) { return {}; }
}

// Seed founding members (Angi + Jess B) if registry is empty.
// Migrates the two hardcoded codes into the dynamic registry.
function loadMembers() {
  try {
    const raw = localStorage.getItem(MEMBERS_KEY);
    if (raw) return JSON.parse(raw);
    const seed = [
      { id: 'mem-angi', name: 'Angi',   code: AMETHYST_CODE, planet: 'amethyst', tier: 'B', createdBy: 'D', createdAt: new Date().toISOString() },
      { id: 'mem-jess', name: 'Jess B', code: MARS_CODE,     planet: 'mars',     tier: 'B', createdBy: 'D', createdAt: new Date().toISOString() },
    ];
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(seed));
    return seed;
  } catch (_) { return []; }
}

// Derive session metadata from localStorage once on mount.
// { owner, planet, tier, expires } — written by EntrySequence on successful auth.
function readSessionMeta() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || Date.now() > s.expires) return null;
    return { owner: s.owner, planet: s.planet ?? null, tier: s.tier ?? 'G' };
  } catch (_) { return null; }
}

// Generate a unique 4-digit code not already in the member registry.
function generateCode(members) {
  const used = new Set(members.map(m => m.code));
  let code;
  do { code = String(Math.floor(1000 + Math.random() * 9000)); } while (used.has(code));
  return code;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const SystemContext = createContext(null);

export function SystemProvider({ children }) {
  const [isProtected,       setIsProtected]       = useState(false);
  const [consoleOwner,      setConsoleOwner]       = useState(null);
  const [sessionMeta,       setSessionMeta]        = useState(readSessionMeta);   // { owner, planet, tier }
  const [voidedItems,       setVoidedItems]        = useState([]);
  const [architectArchive,  setArchitectArchive]   = useState(loadRegistry);
  const [inboxRequests,     setInboxRequests]      = useState(loadInbox);
  const [members,           setMembers]            = useState(loadMembers);
  const [listeners,         setListeners]          = useState(loadListeners);
  const [comments,          setComments]           = useState(loadComments);
  const [tuneOverrides,     setTuneOverrides]      = useState(loadTuneOverrides);

  // ─── Persistence effects ───────────────────────────────────────────────────
  useEffect(() => {
    try { localStorage.setItem(REGISTRY_KEY, JSON.stringify(architectArchive)); } catch (_) {}
  }, [architectArchive]);

  useEffect(() => {
    try { localStorage.setItem(INBOX_KEY, JSON.stringify(inboxRequests)); } catch (_) {}
  }, [inboxRequests]);

  useEffect(() => {
    try { localStorage.setItem(MEMBERS_KEY, JSON.stringify(members)); } catch (_) {}
  }, [members]);

  useEffect(() => {
    try { localStorage.setItem(LISTENERS_KEY, JSON.stringify(listeners)); } catch (_) {}
  }, [listeners]);

  useEffect(() => {
    try { localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments)); } catch (_) {}
  }, [comments]);

  useEffect(() => {
    try { localStorage.setItem(TUNE_OVERRIDES_KEY, JSON.stringify(tuneOverrides)); } catch (_) {}
  }, [tuneOverrides]);

  // ─── Pull Cord ────────────────────────────────────────────────────────────
  const toggleProtected = () => setIsProtected(prev => !prev);

  // ─── Void / Restore ───────────────────────────────────────────────────────
  const voidItem = (item, originPlanet) => {
    const record = { ...item, originPlanet, voidedAt: new Date().toISOString(), id: item.id || `void-${Date.now()}` };
    setVoidedItems(prev => [...prev, record]);
    setArchitectArchive(prev => [...prev, record]);
  };

  const restoreItem = (itemId) => {
    setArchitectArchive(prev => prev.map(item =>
      item.id === itemId ? { ...item, restored: true, restoredAt: new Date().toISOString() } : item
    ));
    setVoidedItems(prev => prev.filter(item => item.id !== itemId));
  };

  // ─── Inbox pipeline (two-stage: L → D) ───────────────────────────────────
  // All "collaborate" submissions start at pending_L.
  const addInboxRequest = (request) => {
    const record = {
      ...request,
      id: `req-${Date.now()}`,
      submittedAt: new Date().toISOString(),
      read: false,
      status: 'pending_L',         // L reviews first
      suggestedPlanet: null,
      reviewedBy: null,
      reviewedAt: null,
    };
    setInboxRequests(prev => [record, ...prev]);
  };

  // L approves → moves to D's queue
  const approveRequest = (id, suggestedPlanet = null) => {
    setInboxRequests(prev => prev.map(r =>
      r.id === id ? { ...r, status: 'approved_L', suggestedPlanet, reviewedBy: 'L', reviewedAt: new Date().toISOString(), read: false } : r
    ));
  };

  // L or D declines
  const declineRequest = (id) => {
    setInboxRequests(prev => prev.map(r =>
      r.id === id ? { ...r, status: 'declined', reviewedBy: r.reviewedBy || 'L', reviewedAt: new Date().toISOString() } : r
    ));
  };

  // D final approve → creates member, returns generated code
  const finalApproveRequest = (id, planet = null) => {
    let code = null;
    setInboxRequests(prev => prev.map(r => {
      if (r.id !== id) return r;
      code = generateCode(members);
      return { ...r, status: 'approved', reviewedBy: 'D', reviewedAt: new Date().toISOString(), assignedCode: code };
    }));
    // Capture name from the request to create the member
    const req = inboxRequests.find(r => r.id === id);
    if (req) {
      const newMember = { id: `mem-${Date.now()}`, name: req.name, code, planet, tier: 'B', createdBy: 'D', createdAt: new Date().toISOString() };
      setMembers(prev => [...prev, newMember]);
    }
    return code;
  };

  // Mark inbox request as read
  const markRead = (requestId) => {
    setInboxRequests(prev => prev.map(r => r.id === requestId ? { ...r, read: true } : r));
  };

  // Unread counts per viewer
  const unreadCount       = inboxRequests.filter(r => !r.read && r.status === 'approved_L').length; // D sees approved_L
  const unreadCountL      = inboxRequests.filter(r => !r.read && r.status === 'pending_L').length;   // L sees pending_L

  // ─── Listener registry (auto-approved, code 0000) ─────────────────────────
  const addListener = (name, contact) => {
    const record = { id: `lst-${Date.now()}`, name, contact, joinedAt: new Date().toISOString() };
    setListeners(prev => [record, ...prev]);
  };

  // ─── Member management ────────────────────────────────────────────────────
  // tier defaults to 'B'; pass 'C' for Saturn moon artists
  const addMember = (name, planet = null, createdBy = 'D', tier = 'B') => {
    const code = generateCode(members);
    const newMember = { id: `mem-${Date.now()}`, name, code, planet, tier, createdBy, createdAt: new Date().toISOString() };
    setMembers(prev => [...prev, newMember]);
    return code;
  };

  // ─── Comment system ───────────────────────────────────────────────────────
  const addComment = (planetId, recordId, trackName, from, body) => {
    const record = { id: `cmt-${Date.now()}`, planetId, recordId, trackName, from, body, timestamp: new Date().toISOString(), read: false };
    setComments(prev => [record, ...prev]);
  };

  const markCommentRead = (commentId) => {
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, read: true } : c));
  };

  const unreadCommentCount = comments.filter(c => !c.read).length;

  // ─── Tune metadata persistence ───────────────────────────────────────────
  const saveTuneOverride = (vaultId, itemId, updates) => {
    setTuneOverrides(prev => ({
      ...prev,
      [vaultId]: {
        ...(prev[vaultId] || {}),
        [itemId]: {
          label: updates.label,
          bpm: updates.bpm,
          frequency: updates.frequency,
        },
      },
    }));
  };

  const getTuneOverride = (vaultId, itemId) => {
    return tuneOverrides?.[vaultId]?.[itemId] || null;
  };

  return (
    <SystemContext.Provider value={{
      // Pull Cord
      isProtected, toggleProtected,
      // Identity
      consoleOwner, setConsoleOwner,
      sessionMeta,  setSessionMeta,
      // Void archive
      voidedItems,
      architectArchive,
      voidItem,
      restoreItem,
      // Inbox pipeline
      inboxRequests,
      addInboxRequest,
      approveRequest,
      declineRequest,
      finalApproveRequest,
      markRead,
      unreadCount,
      unreadCountL,
      // Member registry
      members,
      addMember,
      // Listener registry
      listeners,
      addListener,
      // Comments
      comments,
      addComment,
      markCommentRead,
      unreadCommentCount,
      // Tune persistence
      saveTuneOverride,
      getTuneOverride,
    }}>
      {children}
    </SystemContext.Provider>
  );
}

export function useSystem() {
  return useContext(SystemContext);
}
