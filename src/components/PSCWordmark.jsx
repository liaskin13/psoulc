import React, { useState, useCallback } from "react";
import "./PSCWordmark.css";

export default function PSCWordmark() {
  const [pulsing, setPulsing] = useState(false);

  const handleClick = useCallback(() => {
    if (pulsing) return;
    setPulsing(true);
    window.setTimeout(() => setPulsing(false), 900);
  }, [pulsing]);

  return (
    <button
      className={`psc-wordmark${pulsing ? " psc-wordmark--pulse" : ""}`}
      onClick={handleClick}
      aria-label="Pleasant Soul Collective"
      tabIndex={0}
    >
      dp
    </button>
  );
}
