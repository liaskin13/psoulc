import React from 'react';

/**
 * VaultSkeleton — Loading placeholder shown while a vault lazy-loads.
 * Matches the basic RecordShelf anatomy so layout doesn't shift on load.
 */
function VaultSkeleton() {
  return (
    <div className="vault-screen vault-skeleton" aria-busy="true" aria-label="Loading archive…">
      <div className="skeleton-header" />
      <div className="record-shelf" style={{ pointerEvents: 'none' }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="spine skeleton-spine"
            style={{ animationDelay: `${i * 0.07}s` }}
          />
        ))}
      </div>
    </div>
  );
}

export default VaultSkeleton;
