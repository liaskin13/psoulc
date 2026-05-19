import { useState, useEffect } from "react";
import DirectLinePanel from "./DirectLinePanel.jsx";
import "./ContextStrip.css";

export default function ContextStrip({
  viewer = "D",
  reachMessages = [],
  onIntake,
  onVaults,
  onRoster,
  loopSizeOptions = [],
  selectedLoopSizeId = null,
  onSelectLoopSize,
  externalLoopOpen = 0,
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
        {/* LEFT: PSC logo → nav portal */}
        <button
          className={`arch-context-logo${activeContext === "nav" ? " active" : ""}`}
          onClick={() => toggle("nav")}
          aria-label="PSC navigation"
        >
          PSC
        </button>

        {/* REACH preview — flex 1, right-aligned */}
        <button
          className={`arch-context-reach-preview${hasUnread ? " has-unread" : ""}`}
          onClick={handleReach}
          aria-label={latestMsg ? "Open REACH thread" : "DIRECT LINE"}
        >
          {latestMsg
            ? `${latestMsg.from} ▸ ${(latestMsg.body || "").split("\n")[0]}`
            : "DIRECT LINE"}
        </button>

        {/* RIGHT triggers — viewer=L only */}
        {viewer === "L" && (
          <>
            <button
              className="arch-context-trigger"
              onClick={() => onIntake?.()}
            >
              INTAKE
            </button>
            <button
              className={`arch-context-trigger${activeContext === "access" ? " active" : ""}`}
              onClick={() => toggle("access")}
            >
              ACCESS CODES
            </button>
          </>
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
