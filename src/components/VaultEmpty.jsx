import React from "react";

/**
 * VaultEmpty — Shown when all records in a vault have been voided.
 *
 * Props:
 *   planetName  — display name of the vault (e.g. "SATURN")
 *   chakraColor — hex / CSS color matching the planet's chakra
 */
function VaultEmpty({
  planetName = "ARCHIVE",
  chakraColor = "var(--identity)",
}) {
  return (
    <div className="vault-empty" role="status" aria-live="polite">
      <div
        className="vault-empty-accent"
        aria-hidden="true"
        style={{ background: chakraColor }}
      />
      <div className="vault-empty-title">VAULT EMPTY</div>
      <div className="vault-empty-sub">NO TRACKS HAVE BEEN LOADED</div>
    </div>
  );
}

export default VaultEmpty;
