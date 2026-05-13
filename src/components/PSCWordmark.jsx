import React, { useState, useCallback } from "react";
import "./PSCWordmark.css";

export default function PSCWordmark({ onToggle, railOpen }) {
  const [pulsing, setPulsing] = useState(false);

  const handleClick = useCallback(() => {
    if (pulsing) return;
    setPulsing(true);
    window.setTimeout(() => setPulsing(false), 900);
    onToggle?.();
  }, [pulsing, onToggle]);

  return (
    <button
      className={`psc-wordmark${pulsing ? " psc-wordmark--pulse" : ""}${railOpen ? " psc-wordmark--open" : ""}`}
      onClick={handleClick}
      aria-label={railOpen ? "Close architect rail" : "Open architect rail"}
      aria-expanded={railOpen}
      tabIndex={0}
    >
      dp
    </button>
  );
}
