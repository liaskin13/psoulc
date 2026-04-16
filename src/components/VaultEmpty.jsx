import React from 'react';

/**
 * VaultEmpty — Shown when all records in a vault have been voided.
 *
 * Props:
 *   planetName  — display name of the vault (e.g. "SATURN")
 *   chakraColor — hex / CSS color matching the planet's chakra
 */
function VaultEmpty({ planetName = 'ARCHIVE', chakraColor = 'var(--amber-phosphor)' }) {
  return (
    <div className="vault-empty" role="status" aria-live="polite">
      <div className="vault-empty-glyph" aria-hidden="true" style={{ color: chakraColor }}>
        ◌
      </div>
      <div className="vault-empty-title">
        THE {planetName} ARCHIVE IS SILENT
      </div>
      <div className="vault-empty-sub">
        All frequencies have passed into the Black Star.
      </div>
    </div>
  );
}

export default VaultEmpty;
