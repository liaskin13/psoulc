import { useState, useEffect } from "react";
import DirectLinePanel from "./DirectLinePanel.jsx";
import "./ContextStrip.css";

export default function ContextStrip({
  viewer = "D",
  reachMessages = [],
  onVaults,
  onRoster,
  loopSizeOptions = [],
  selectedLoopSizeId = null,
  onSelectLoopSize,
  externalLoopOpen = 0,
  libSearch = "",
  onSearchChange,
}) {
  const [activeContext, setActiveContext] = useState(null);
  const [reachTrigger, setReachTrigger] = useState(0);

  useEffect(() => {
    if (externalLoopOpen > 0) setActiveContext("loop");
  }, [externalLoopOpen]);

  const latestMsg = reachMessages.find((m) => !m.read) || reachMessages[0] || null;
  const hasUnread = reachMessages.some((m) => !m.read);

  function toggle(ctx) {
    setActiveContext((prev) => (prev === ctx ? null : ctx));
  }

  function handleReach() {
    setReachTrigger((n) => n + 1);
  }

  return (
    <div className="arch-context-strip">
      {/* Idle strip — 40px always visible */}
      <div className="arch-context-strip-idle">
        {/* LEFT: dp logo → nav portal */}
        <button
          className={`arch-context-logo${activeContext === "nav" ? " active" : ""}`}
          onClick={() => toggle("nav")}
          aria-label="PSC navigation"
        >
          dp
        </button>

        {/* SEARCH — flex:1, center of strip */}
        <div className="arch-context-search">
          <input
            className="arch-context-search-input"
            placeholder="SEARCH VAULT"
            value={libSearch}
            onChange={(e) => onSearchChange?.(e.target.value)}
            aria-label="Search tracks"
          />
          {libSearch && (
            <button
              className="arch-context-search-clear"
              onClick={() => onSearchChange?.("")}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* REACH LCD — fixed-window readout, MPC III / Pioneer style */}
        <button
          className={`arch-reach-lcd${hasUnread ? " has-unread" : ""}`}
          onClick={handleReach}
          aria-label={latestMsg ? "Open REACH thread" : "REACH — no messages yet"}
        >
          <span className="arch-reach-lcd-label">REACH</span>
          <span className="arch-reach-lcd-screen">
            {latestMsg ? (
              <span className="arch-reach-lcd-preview">
                {hasUnread && <span className="arch-reach-lcd-dot" aria-hidden="true" />}
                <span className="arch-reach-lcd-from">{latestMsg.from} ·</span>
                <span className="arch-reach-lcd-msg">
                  {latestMsg.audioData ? "◆ VOICE NOTE" : latestMsg.body}
                </span>
              </span>
            ) : (
              <span className="arch-reach-lcd-idle">——</span>
            )}
          </span>
        </button>

        {/* ACCESS CODES — viewer=L only */}
        {viewer === "L" && (
          <button
            className={`arch-context-trigger${activeContext === "access" ? " active" : ""}`}
            onClick={() => toggle("access")}
          >
            ACCESS CODES
          </button>
        )}
      </div>

      {/* Expandable body */}
      {activeContext && (
        <div className="arch-context-body is-open">
          {activeContext === "nav" && (
            <div className="arch-context-nav">
              <button
                className="arch-context-nav-item"
                onClick={() => { setActiveContext(null); onVaults?.(); }}
              >
                VAULTS
              </button>
              <button
                className="arch-context-nav-item"
                onClick={() => { setActiveContext(null); onRoster?.(); }}
              >
                ROSTER
              </button>
            </div>
          )}
          {activeContext === "loop" && (
            <div className="arch-context-loop">
              {loopSizeOptions.map((opt) => (
                <button
                  key={opt.id}
                  className={`arch-context-loop-btn${selectedLoopSizeId === opt.id ? " active" : ""}`}
                  onClick={() => {
                    onSelectLoopSize?.(opt);
                    setActiveContext(null);
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
          {activeContext === "access" && viewer === "L" && (
            <div className="arch-context-placeholder">
              <span>ACCESS CODE MANAGEMENT — COMING SOON</span>
            </div>
          )}
        </div>
      )}

      {/* DirectLinePanel — always mounted, triggered by reachTrigger */}
      <DirectLinePanel
        viewer={viewer}
        variant={viewer === "D" ? "d-mode" : "architect"}
        externalOpen={reachTrigger}
        hideTrigger
      />
    </div>
  );
}
