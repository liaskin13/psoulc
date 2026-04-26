import assert from 'node:assert/strict';
import {
  tierDefaultsForMember,
  resolveMatrixPerm,
  toggleMatrixPerm,
  commitMatrixState,
  rollbackMatrixState,
} from '../src/console/matrixState.js';

const memberId = 'res-1';
const tierDefaults = tierDefaultsForMember('A');

let pending = {};
let committed = {};
let history = [];

assert.equal(
  resolveMatrixPerm({ pendingEntry: pending[memberId], committedEntry: committed[memberId], tierDefaults, perm: 'void' }),
  true,
  'Tier A default void should be enabled'
);

pending = toggleMatrixPerm({ pending, committed, memberId, perm: 'void', tierDefaults });
assert.equal(pending[memberId].void, false, 'First toggle should disable default-enabled permission');

({ history, committed, pending } = commitMatrixState({ history, committed, pending }));
assert.equal(committed[memberId].void, false, 'Commit should persist pending disable');
assert.equal(history.length, 1, 'History should capture snapshot before commit');

pending = toggleMatrixPerm({ pending, committed, memberId, perm: 'void', tierDefaults });
assert.equal(pending[memberId].void, true, 'Second toggle should enable permission');

({ history, committed, pending } = commitMatrixState({ history, committed, pending }));
assert.equal(committed[memberId].void, true, 'Second commit should persist enabled state');
assert.equal(history.length, 2, 'History should keep both commit snapshots');

const rolledBack = rollbackMatrixState({ history });
assert.equal(rolledBack.didRollback, true, 'Rollback should succeed with history');
assert.equal(rolledBack.committed[memberId].void, false, 'Rollback should restore prior committed state');
assert.equal(rolledBack.history.length, 1, 'Rollback should remove only latest snapshot');

console.log('matrix rollback smoke: PASS');
