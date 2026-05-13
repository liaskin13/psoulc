import React from "react";
import VaultView from "../components/VaultView";
import "../components/VaultView.css";

function SaturnVault({ onBack, onExitSystem, onVoid, readOnly = false }) {
  return (
    <VaultView
      vault="saturn"
      authenticated={!readOnly}
      onBack={onBack}
      onExitSystem={onExitSystem}
      readOnly={readOnly}
    />
  );
}

export default SaturnVault;
