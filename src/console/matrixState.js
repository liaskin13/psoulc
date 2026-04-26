export function tierDefaultsForMember(tier) {
  const isAorB = tier === 'A' || tier === 'B';
  return {
    void: isAorB,
    tune: isAorB,
    comment: isAorB || tier === 'C',
  };
}

export function resolveMatrixPerm({ pendingEntry, committedEntry, tierDefaults, perm }) {
  if (pendingEntry?.[perm] !== undefined) return pendingEntry[perm];
  if (committedEntry?.[perm] !== undefined) return committedEntry[perm];
  return Boolean(tierDefaults?.[perm]);
}

export function toggleMatrixPerm({ pending, committed, memberId, perm, tierDefaults }) {
  const pendingEntry = pending[memberId] || {};
  const committedEntry = committed[memberId] || {};
  const current = resolveMatrixPerm({ pendingEntry, committedEntry, tierDefaults, perm });
  return {
    ...pending,
    [memberId]: {
      ...pendingEntry,
      [perm]: !current,
    },
  };
}

export function commitMatrixState({ history, committed, pending }) {
  return {
    history: [...history.slice(-9), committed],
    committed: { ...committed, ...pending },
    pending: {},
  };
}

export function rollbackMatrixState({ history }) {
  if (history.length === 0) {
    return { didRollback: false, history, committed: null };
  }
  return {
    didRollback: true,
    history: history.slice(0, -1),
    committed: history[history.length - 1] || {},
  };
}
