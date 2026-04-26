// Collaborator schema — D7
// A collaborator is a person granted partial access to one or more vaults by D or L.
// Tier mapping:  co-owner (A) / editor (B) / featured-artist (C) / listener (G)

export const COLLABORATORS_KEY = 'psc_collaborators';

export const COLLABORATOR_ROLES = ['listener', 'featured-artist', 'editor', 'co-owner'];

// Vault IDs that can appear in vaultAccess
export const VAULT_IDS = ['saturn', 'mercury', 'venus', 'earth', 'amethyst', 'mars'];

// Role → tier mapping used by permissions.js
export const ROLE_TO_TIER = {
  'co-owner':       'A',
  'editor':         'B',
  'featured-artist': 'C',
  'listener':       'G',
};

/**
 * makeCollaborator — factory for a new collaborator record.
 */
export function makeCollaborator({ name, role, grantedBy, vaultAccess = [], expiresAt = null, code = null, planet = null }) {
  if (!COLLABORATOR_ROLES.includes(role)) {
    throw new Error(`Invalid collaborator role: "${role}". Must be one of: ${COLLABORATOR_ROLES.join(', ')}`);
  }
  return {
    id: `collab-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    role,
    grantedBy,
    vaultAccess: vaultAccess.filter(v => VAULT_IDS.includes(v)),
    planet: planet ?? null,
    code: code ?? null,
    grantedAt: new Date().toISOString(),
    expiresAt: expiresAt ?? null,
    isActive: true,
  };
}

/**
 * isCollaboratorActive — checks whether a collaborator's grant is still valid.
 */
export function isCollaboratorActive(collab) {
  if (!collab.isActive) return false;
  if (collab.expiresAt && new Date(collab.expiresAt) < new Date()) return false;
  return true;
}

/**
 * canCollaboratorAccess — checks vault access for a specific collaborator.
 * co-owners have access everywhere; others check their explicit vaultAccess list.
 */
export function canCollaboratorAccess(collab, vaultId) {
  if (!isCollaboratorActive(collab)) return false;
  if (collab.role === 'co-owner') return true;
  return collab.vaultAccess.includes(vaultId);
}

// ── Migration helpers ──────────────────────────────────────────────────────────
// Convert legacy member/listener records into collaborator objects.
// Safe to call multiple times — idempotent on the same source id.

export function memberToCollaborator(member) {
  const role = member.tier === 'A' ? 'co-owner' : member.tier === 'C' ? 'featured-artist' : 'editor';
  return {
    id: `collab-${member.id}`,
    name: member.name,
    role,
    grantedBy: member.createdBy || 'D',
    vaultAccess: member.planet ? [member.planet] : [],
    planet: member.planet ?? null,
    code: member.code ?? null,
    grantedAt: member.createdAt || new Date().toISOString(),
    expiresAt: null,
    isActive: true,
    legacyId: member.id,
  };
}

export function listenerToCollaborator(listener) {
  return {
    id: `collab-${listener.id}`,
    name: listener.name,
    role: 'listener',
    grantedBy: 'D',
    vaultAccess: [],
    planet: null,
    code: '0000',
    grantedAt: listener.joinedAt || new Date().toISOString(),
    expiresAt: null,
    isActive: true,
    legacyId: listener.id,
  };
}

/**
 * migrateToCollaborators — build collaborator list from legacy members + listeners.
 * Called once when collaborators localStorage is empty.
 */
export function migrateToCollaborators(members, listeners) {
  const fromMembers   = (members   || []).map(memberToCollaborator);
  const fromListeners = (listeners || []).map(listenerToCollaborator);
  return [...fromMembers, ...fromListeners];
}
