// PSC Permission Utilities
// Tier A: D + L — full admin everywhere
// Tier B: Collective members — admin of own planet only
// Tier C: Moon artists — read-only everywhere (including their own moon)
// Tier G: Generic listeners — browse only, no comments

export const canVoid = (sessionMeta, planetId) =>
  sessionMeta?.tier === 'A' ||
  (sessionMeta?.tier === 'B' && !!sessionMeta?.planet && sessionMeta.planet === planetId);

export const canEdit = (sessionMeta, planetId) =>
  sessionMeta?.tier === 'A' ||
  (sessionMeta?.tier === 'B' && !!sessionMeta?.planet && sessionMeta.planet === planetId);

// Tier A, B, and C can comment. Tier G cannot.
export const canComment = (sessionMeta) =>
  sessionMeta?.tier === 'A' || sessionMeta?.tier === 'B' || sessionMeta?.tier === 'C';
