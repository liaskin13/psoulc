import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { INBOX_KEY, MEMBERS_KEY, LISTENERS_KEY, COMMENTS_KEY, SESSION_KEY, AMETHYST_CODE, MARS_CODE } from '../config';
import { fetchVaultTracks } from '../lib/tracks';
import { getResidencySplit, isMaintenanceDue } from '../utils/sovereignFinance';
import { RESIDENT_REGISTRY, findResidentByCode } from '../data/residentBlueprint';
import {
  COLLABORATORS_KEY,
  makeCollaborator,
  memberToCollaborator,
  listenerToCollaborator,
  migrateToCollaborators,
  canCollaboratorAccess,
  isCollaboratorActive,
} from '../data/collaborators';

// ─── Command Registry ─────────────────────────────────────────────────────────
export const CMD = {
  EXPLORE_VAULT:  'EXPLORE_VAULT',
  TUNE_VAULT:     'TUNE_VAULT',
  VOID_ITEM:      'VOID_ITEM',
  RESTORE_ITEM:   'RESTORE_ITEM',
  BROADCAST:      'BROADCAST',
  INTAKE_ASSET:   'INTAKE_ASSET',
  CLAIM_NODE:     'CLAIM_NODE',
  UPLOAD_TRACK:   'UPLOAD_TRACK',    // upload audio track to vault (D and L only)
};

// ─── Authorization ────────────────────────────────────────────────────────────
function checkAuthorization(cmd, owner) {
  switch (cmd) {
    case CMD.EXPLORE_VAULT:
      return !!owner;                        // any authenticated user
    case CMD.RESTORE_ITEM:
      return owner === 'L';                  // Architect only
    case CMD.VOID_ITEM:
    case CMD.TUNE_VAULT:
    case CMD.CLAIM_NODE:
    case CMD.INTAKE_ASSET:
    case CMD.BROADCAST:
    case CMD.UPLOAD_TRACK:                   // D and L only
      return owner === 'D' || owner === 'L';
    default:
      return false;
  }
}

// Global system state — Binary Sovereignty v3
// Adds: dynamic member/listener registries, enriched session metadata,
// per-record comment system, and two-stage L→D inbox vetting pipeline.

const REGISTRY_KEY = 'psc_eternal_registry';
const TUNE_OVERRIDES_KEY = 'psc_tune_overrides';
const ANIMATIONS_KEY = 'psc_animations_enabled';

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

function loadAnimationsEnabled() {
  try {
    const raw = localStorage.getItem(ANIMATIONS_KEY);
    return raw === null ? true : JSON.parse(raw); // default on
  } catch (_) { return true; }
}

function loadCollaborators(members, listeners) {
  try {
    const raw = localStorage.getItem(COLLABORATORS_KEY);
    if (raw) return JSON.parse(raw);
    // First load — migrate legacy records
    const migrated = migrateToCollaborators(members, listeners);
    localStorage.setItem(COLLABORATORS_KEY, JSON.stringify(migrated));
    return migrated;
  } catch (_) { return []; }
}

// Seed founding residents if registry is empty.
function loadMembers() {
  try {
    const raw = localStorage.getItem(MEMBERS_KEY);
    if (raw) return JSON.parse(raw);
    // Seed directly from the Blueprint Registry
    const seed = RESIDENT_REGISTRY.map(r => ({
      ...r,
      id: `res-${r.residentId}`,
      createdAt: new Date().toISOString()
    }));
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(seed));
    return seed;
  } catch (_) { return []; }
}


// Derive session metadata from localStorage once on mount.
// { owner, vault, tier, residentId, expires }
function readSessionMeta() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || Date.now() > s.expires) return null;
    return { 
      owner: s.owner, 
      vault: s.vault ?? s.planet ?? null, 
      tier: s.tier ?? 'G',
      residentId: s.residentId ?? null 
    };
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
  // D7: unified collaborator registry — lazy-init after members/listeners are loaded
  const [collaborators,     setCollaborators]      = useState(() => loadCollaborators(loadMembers(), loadListeners()));
  const [comments,          setComments]           = useState(loadComments);
  const [tuneOverrides,     setTuneOverrides]      = useState(loadTuneOverrides);
  const [animationsEnabled, setAnimationsEnabled]  = useState(loadAnimationsEnabled);
  const [commandLog,        setCommandLog]          = useState(() => {
    try { return JSON.parse(localStorage.getItem('psc_command_log')) || []; } catch (_) { return []; }
  });
  // A3: Live vault tracks (keyed by vault id)
  const [tracks,            setTracks]             = useState({ saturn: [], venus: [] });

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

  useEffect(() => {
    try { localStorage.setItem(COLLABORATORS_KEY, JSON.stringify(collaborators)); } catch (_) {}
  }, [collaborators]);

  useEffect(() => {
    try { localStorage.setItem(ANIMATIONS_KEY, JSON.stringify(animationsEnabled)); } catch (_) {}
  }, [animationsEnabled]);

  // ─── Pull Cord ────────────────────────────────────────────────────────────
  const toggleProtected = () => setIsProtected(prev => !prev);

  // sealSystem: set isProtected + evict non-Tier-A sessions.
  // Tier A (D/L) keeps their console; Tier B/C/G/D are kicked to entry.
  const sealSystem = () => {
    setIsProtected(true);
    const meta = sessionMeta;
    if (meta && meta.tier !== 'A') {
      try { localStorage.removeItem(SESSION_KEY); } catch (_) {}
      setSessionMeta(null);
    }
  };

  // unsealSystem: restore open state without touching sessions.
  const unsealSystem = () => setIsProtected(false);

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

  // D final approve → creates member + collaborator, returns generated code
  const finalApproveRequest = (id, planet = null) => {
    let code = null;
    setInboxRequests(prev => prev.map(r => {
      if (r.id !== id) return r;
      code = generateCode(members);
      return { ...r, status: 'approved', reviewedBy: 'D', reviewedAt: new Date().toISOString(), assignedCode: code };
    }));
    const req = inboxRequests.find(r => r.id === id);
    if (req) {
      const newMember = { id: `mem-${Date.now()}`, name: req.name, code, planet, tier: 'B', createdBy: 'D', createdAt: new Date().toISOString() };
      setMembers(prev => [...prev, newMember]);
      // D7: create matching collaborator record
      const collab = makeCollaborator({ name: req.name, role: 'editor', grantedBy: 'D', vaultAccess: planet ? [planet] : [], code, planet });
      setCollaborators(prev => [...prev, { ...collab, legacyId: newMember.id }]);
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
    // D7: create matching collaborator record
    setCollaborators(prev => [...prev, listenerToCollaborator(record)]);
  };

  // ─── Member management ────────────────────────────────────────────────────
  // tier defaults to 'B'; pass 'C' for Saturn moon artists
  const addMember = (name, planet = null, createdBy = 'D', tier = 'B', manualCode = null) => {
    const code = manualCode?.trim() || generateCode(members);
    const newMember = { id: `mem-${Date.now()}`, name, code, planet, tier, createdBy, createdAt: new Date().toISOString() };
    setMembers(prev => [...prev, newMember]);
    // D7: create matching collaborator record
    const role = tier === 'A' ? 'co-owner' : tier === 'C' ? 'featured-artist' : 'editor';
    const collab = makeCollaborator({ name, role, grantedBy: createdBy, vaultAccess: planet ? [planet] : [], code, planet });
    setCollaborators(prev => [...prev, { ...collab, legacyId: newMember.id }]);
    return code;
  };

  // ─── D7: Collaborator management ─────────────────────────────────────────
  const revokeCollaborator = (collaboratorId) => {
    setCollaborators(prev => prev.map(c => c.id === collaboratorId ? { ...c, isActive: false } : c));
  };

  const grantVaultAccess = (collaboratorId, vaultId) => {
    setCollaborators(prev => prev.map(c =>
      c.id === collaboratorId && !c.vaultAccess.includes(vaultId)
        ? { ...c, vaultAccess: [...c.vaultAccess, vaultId] }
        : c
    ));
  };

  const revokeVaultAccess = (collaboratorId, vaultId) => {
    setCollaborators(prev => prev.map(c =>
      c.id === collaboratorId
        ? { ...c, vaultAccess: c.vaultAccess.filter(v => v !== vaultId) }
        : c
    ));
  };

  // Look up the collaborator record for the current session by code or owner name.
  const getCollaboratorForSession = (meta = sessionMeta) => {
    if (!meta) return null;
    return collaborators.find(c =>
      isCollaboratorActive(c) && (c.name === meta.owner || c.planet === meta.planet)
    ) ?? null;
  };

  // D7.4: runtime vault-entry check — combines tier and explicit grant list.
  const canEnterVault = (meta, vaultId) => {
    if (!meta) return false;
    if (meta.tier === 'A') return true;                    // co-owners: everywhere
    const collab = getCollaboratorForSession(meta);
    if (collab) return canCollaboratorAccess(collab, vaultId);
    // Fallback: Tier B can access their own planet
    return meta.tier === 'B' && meta.planet === vaultId;
  };

  // ─── Comment system ───────────────────────────────────────────────────────
  // body is text or null; audioData is a base64 data-URL for voice comments (optional).
  const addComment = (planetId, recordId, trackName, from, body, audioData = null) => {
    const collaboratorId = getCollaboratorForSession()?.id ?? null;
    const record = {
      id: `cmt-${Date.now()}`,
      planetId, recordId, trackName, from, body,
      audioData: audioData ?? null,
      collaboratorId,
      timestamp: new Date().toISOString(),
      read: false,
    };
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

  // A3: Load vault tracks from Supabase
  const loadVaultTracks = useCallback(async (vault) => {
    const data = await fetchVaultTracks(vault);
    setTracks(prev => ({ ...prev, [vault]: data }));
  }, []);

  // ─── Command dispatcher ───────────────────────────────────────────────────
  const dispatchCommand = useCallback((cmd, payload = {}) => {
    // 1. Tier-based authorization
    if (!checkAuthorization(cmd, consoleOwner)) {
      console.warn(`[PSC] CMD "${cmd}" denied for owner "${consoleOwner}"`);
      return { success: false, error: 'UNAUTHORIZED' };
    }
    // 2. Collaborator cross-check — if session is a collaborator, verify vault access
    const collab = collaborators.find(c => isCollaboratorActive(c) && (c.name === sessionMeta?.owner || c.planet === sessionMeta?.planet)) ?? null;
    if (collab && payload.vaultId && !canCollaboratorAccess(collab, payload.vaultId)) {
      console.warn(`[PSC] CMD "${cmd}" denied — collaborator lacks access to vault "${payload.vaultId}"`);
      return { success: false, error: 'VAULT_ACCESS_DENIED' };
    }
    // 3. Handler map
    const handlers = {
      [CMD.VOID_ITEM]:    () => { if (payload.item && payload.vaultId) { voidItem(payload.item, payload.vaultId); return payload.item; } },
      [CMD.RESTORE_ITEM]: () => { if (payload.id) { restoreItem(payload.id); return payload.id; } },
      [CMD.BROADCAST]:    () => payload,
      [CMD.EXPLORE_VAULT]: () => payload,
      [CMD.TUNE_VAULT]:   () => { if (payload.vaultId && payload.itemId) { saveTuneOverride(payload.vaultId, payload.itemId, payload.override); return payload; } },
      [CMD.UPLOAD_TRACK]: () => payload,
      [CMD.INTAKE_ASSET]: () => payload,
      [CMD.CLAIM_NODE]:   () => payload,
    };
    const handler = handlers[cmd];
    let result = null;
    try {
      result = handler ? handler() : null;
    } catch (err) {
      console.error(`[PSC] CMD "${cmd}" handler threw:`, err);
      return { success: false, error: err.message };
    }
    // 4. Append to commandLog, cap at 500
    const entry = { cmd, payload, ts: new Date().toISOString(), by: consoleOwner };
    setCommandLog(prev => {
      const next = [...prev, entry].slice(-500);
      try { localStorage.setItem('psc_command_log', JSON.stringify(next)); } catch (_) {}
      return next;
    });
    console.info(`[PSC] CMD "${cmd}"`, payload);
    return { success: true, result };
  }, [consoleOwner, sessionMeta, collaborators, voidItem, restoreItem, saveTuneOverride]);

  return (
    <SystemContext.Provider value={{
      // Pull Cord
      isProtected, toggleProtected, sealSystem, unsealSystem,
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
      // Live vault tracks (A3)
      tracks,
      loadVaultTracks,
      // Command dispatch
      CMD,
      dispatchCommand,
      commandLog,
      // Animation toggle (D console setting)
      animationsEnabled,
      setAnimationsEnabled,
      // D7: Collaborator registry
      collaborators,
      revokeCollaborator,
      grantVaultAccess,
      revokeVaultAccess,
      getCollaboratorForSession,
      canEnterVault,
    }}>
      {children}
    </SystemContext.Provider>
  );
}

export function useSystem() {
  return useContext(SystemContext);
}
