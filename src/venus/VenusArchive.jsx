import React from "react";
import VaultView from "../components/VaultView";
import "../components/VaultView.css";

function VenusArchive({ onBack, onExitSystem, onVoid, readOnly = false }) {
  return (
    <VaultView
      vault="venus"
      authenticated={!readOnly}
      onBack={onBack}
      onExitSystem={onExitSystem}
      readOnly={readOnly}
    />
  );
}

export default VenusArchive;
