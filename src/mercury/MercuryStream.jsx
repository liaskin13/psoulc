import React from "react";
import VaultView from "../components/VaultView";
import "../components/VaultView.css";

function MercuryStream({ onBack, onExitSystem, onVoid, readOnly = false }) {
  return (
    <VaultView
      vault="mercury"
      authenticated={!readOnly}
      onBack={onBack}
      onExitSystem={onExitSystem}
      readOnly={readOnly}
    />
  );
}

export default MercuryStream;
