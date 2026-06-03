import React, { useState, useEffect, lazy, Suspense } from "react";
import { motion, useReducedMotion } from "framer-motion";
import "./App.css";

import { useSystem } from "./state/SystemContext";
import { SESSION_KEY } from "./config";
import { useNetworkStatus } from "./hooks/useNetworkStatus";
import { useBreakpoint } from "./hooks/useBreakpoint";

// ── STATIC IMPORTS ───────────────────────────────────────────────────────────
import EntrySequence from "./entry/EntrySequence";
import CommandPalette from "./components/CommandPalette";

// ── LAZY IMPORTS ─────────────────────────────────────────────────────────────
const ArchitectConsole = lazy(() => import("./console/ArchitectConsole"));
const ListenerShell = lazy(() => import("./listener/ListenerShell"));
const WaveformSandbox = lazy(() => import("./components/WaveformSandbox"));

const UploadModal = lazy(() => import("./components/UploadModal"));

import BottomNav from "./components/BottomNav";

import { BROADCAST_DURATION_MS } from "./config";

function refreshSessionMeta() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || Date.now() > s.expires) return null;
    return {
      owner: s.owner,
      vault: s.vault ?? s.planet ?? null,
      tier: s.tier ?? "G",
      residentId: s.residentId ?? null,
    };
  } catch (_) {
    return null;
  }
}

// Stages: 'entry' | 'console' | 'architect' | 'room' | 'code-entry'
function App() {
  const { setConsoleOwner, sessionMeta, setSessionMeta } = useSystem();
  const online = useNetworkStatus();
  const { isMobile } = useBreakpoint();
  const prefersReduced = useReducedMotion();

  const pendingCode = new URLSearchParams(window.location.search).get("code");
  const [stage, setStage] = useState(pendingCode ? "code-entry" : "entry");
  const [accessCode] = useState(pendingCode);
  const [owner, setOwner] = useState(null);
  const [activeNode, setActiveNode] = useState(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Apply identity theme to <body> based on authenticated owner
  useEffect(() => {
    const themeMap = { D: "d-soul", L: "l-architect" };
    const theme = owner ? (themeMap[owner] ?? null) : null;
    if (theme) {
      document.body.setAttribute("data-theme", theme);
    } else {
      document.body.removeAttribute("data-theme");
    }
  }, [owner]);

  // Auto-login: skip entry gate if a valid session exists
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const session = JSON.parse(raw);
      if (session?.owner && session.expires > Date.now()) {
        handleIgnite(session.owner, session.tier);
      }
    } catch (_) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isMobile && (stage === "console" || stage === "architect")) {
      setStage("room");
    }
  }, [isMobile, stage]);

  useEffect(() => {
    const handleOpenUploadModal = () => setShowUploadModal(true);
    window.addEventListener("psc:open-upload-modal", handleOpenUploadModal);
    return () =>
      window.removeEventListener(
        "psc:open-upload-modal",
        handleOpenUploadModal,
      );
  }, []);

  const handleIgnite = (ownerVal, tier = "G") => {
    const meta = refreshSessionMeta();
    setOwner(ownerVal);
    setConsoleOwner(ownerVal);
    setSessionMeta(meta);

    // Tier-based routing — Masters on mobile go to room (listener mode)
    if (tier === "A" && !isMobile) {
      if (ownerVal === "L") setStage("architect");
      else setStage("console");
    } else {
      setStage("room");
      // Auto-focus vault if assigned
      if (meta?.vault) setActiveNode({ id: meta.vault });
    }
  };

  const handlePowerDown = () => {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (_) {}
    setSessionMeta(null);
    setStage("entry");
  };

  const handleBroadcast = () => {
    setIsBroadcasting(true);
    setTimeout(() => setIsBroadcasting(false), BROADCAST_DURATION_MS);
  };

  const handleArchitectExplore = (planetRef) => {
    const planetId = typeof planetRef === "string" ? planetRef : planetRef?.id;
    if (!planetId) return;
    setActiveNode({ id: planetId });
  };

  const offlineBanner = !online && (
    <div className="offline-banner" role="status">
      SIGNAL LOST — ARCHIVE CACHED LOCALLY
    </div>
  );

  // ── SANDBOX — dev-only waveform engine prototype ─────────────────────────
  if (new URLSearchParams(window.location.search).has("sandbox")) {
    return <Suspense fallback={null}><WaveformSandbox /></Suspense>;
  }

  // ── CODE ENTRY — listener arriving via access code link ─────────────────
  if (stage === "code-entry") {
    return (
      <Suspense fallback={null}>
        <ListenerShell code={accessCode} />
      </Suspense>
    );
  }

  // ── ENTRY ────────────────────────────────────────────────────────────────
  if (stage === "entry") {
    return (
      <>
        {offlineBanner}
        <a href="#main-content" className="skip-nav">
          Skip to archive
        </a>
        <main id="main-content">
          <EntrySequence onIgnite={handleIgnite} />
        </main>
      </>
    );
  }

  // ── LISTENER SHELL — guest / member listening room ───────────────────────
  if (stage === "room" && !activeNode) {
    return (
      <Suspense fallback={null}>
        <ListenerShell
          onPowerDown={handlePowerDown}
          sessionMeta={sessionMeta}
        />
      </Suspense>
    );
  }

  // ── CONSOLE MOBILE GUARD — safety net, routing handles this at login ─────
  if (isMobile && (stage === "console" || stage === "architect")) {
    return null;
  }

  // ── L's CONSOLE — GOD MODE PLUS (sovereign root) ──────────────────────────
  if (stage === "architect") {
    return (
      <>
        {offlineBanner}
        <a href="#main-content" className="skip-nav">
          Skip to archive
        </a>
        <div
          className="universe god-mode-mainframe state-create"
          id="main-content"
        >
          <CommandPalette />
          <div className="glitter-grain" />
          {isBroadcasting && (
            <div className="system-broadcast-pulse" aria-live="polite">
              SYSTEM BROADCAST ACTIVE
            </div>
          )}
          <Suspense fallback={null}>
            <ArchitectConsole
              onPowerDown={handlePowerDown}
              onExplorePlanet={handleArchitectExplore}
              onBroadcast={handleBroadcast}
              onIntake={() => setShowUploadModal(true)}
            />
          </Suspense>
          {showUploadModal && (
            <Suspense fallback={null}>
              <UploadModal onClose={() => setShowUploadModal(false)} />
            </Suspense>
          )}
          <div className="psc-wordmark-footer" aria-hidden="true">
            UOYnI
          </div>
        </div>
      </>
    );
  }

  // ── D's CONSOLE — ARTIST VIEW ──────────────────────────────────────────────
  return (
    <>
      {offlineBanner}
      <a href="#main-content" className="skip-nav">
        Skip to archive
      </a>
      <div className="universe god-mode-mainframe state-create">
        <CommandPalette />
        <div className="glitter-grain" />
        <div className="receded-logo">dp</div>
        <div className="psc-wordmark-footer" aria-hidden="true">
          UOYnI
        </div>
        {isBroadcasting && (
          <div className="system-broadcast-pulse" aria-live="polite">
            SYSTEM BROADCAST ACTIVE
          </div>
        )}

        <motion.div
          id="main-content"
          className="cockpit"
          initial={
            prefersReduced ? { opacity: 1 } : { opacity: 0, scale: 1.04 }
          }
          animate={{ opacity: 1, scale: 1 }}
          transition={
            prefersReduced
              ? { duration: 0.15 }
              : { duration: 1.6, ease: [0.08, 0, 0.3, 1] }
          }
        >
          <Suspense fallback={null}>
            <ArchitectConsole
              viewer="D"
              onExplorePlanet={handleArchitectExplore}
              onBroadcast={handleBroadcast}
              onIntake={() => setShowUploadModal(true)}
              onPowerDown={handlePowerDown}
            />
          </Suspense>
        </motion.div>

        {showUploadModal && (
          <Suspense fallback={null}>
            <UploadModal onClose={() => setShowUploadModal(false)} defaultVault="venus" />
          </Suspense>
        )}

        {isMobile && (
          <BottomNav
            activeId={activeNode?.id}
            onSelect={(id) => setActiveNode({ id })}
          />
        )}
      </div>
    </>
  );
}

export default App;
