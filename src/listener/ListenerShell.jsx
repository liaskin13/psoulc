import React, {
  useState,
  lazy,
  Suspense,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import VaultSkeleton from "../components/VaultSkeleton";
import DPWallpaper from "../components/DPWallpaper";
import TheSignal from "../signal/TheSignal";
import { VAULT_ACCENT_COLORS, UPLOAD_WORKER_URL } from "../config";
import PSCWordmark from "../components/PSCWordmark";

const WORKER_URL = UPLOAD_WORKER_URL;
const SIGNAL_POLL_MS = 10000;

const TheVault = lazy(() => import("../components/TheVault"));

const LISTENER_VAULTS = [
  {
    id: "venus",
    label: "MIXES",
    color: VAULT_ACCENT_COLORS.venus,
    copy: "EXTENDED SETS · FULL SEQUENCES · NO INTERRUPTIONS",
  },
  {
    id: "saturn",
    label: "ORIGINAL MUSIC",
    color: VAULT_ACCENT_COLORS.saturn,
    copy: "STUDIO RECORDINGS · STEMS · UNRELEASED CUTS",
  },
  {
    id: "mercury",
    label: "LIVE SETS",
    color: VAULT_ACCENT_COLORS.mercury,
    copy: "RAW FROM THE ROOM · CAPTURED · MASTERED FOR THE ARCHIVE",
  },
];

function ListenerShell({ onPowerDown, sessionMeta }) {
  const [selectedVault, setSelectedVault] = useState(LISTENER_VAULTS[0]);
  const [activeVault, setActiveVault] = useState(null);
  const [inSignal, setInSignal] = useState(false);
  const [signalState, setSignalState] = useState({ is_live: 0, title: null });
  const [isHandoff, setIsHandoff] = useState(false);
  const [handoffLabel, setHandoffLabel] = useState("");
  const handoffTimerRef = useRef(null);
  const prefersReduced = useReducedMotion();

  const fetchSignal = useCallback(async () => {
    try {
      const res = await fetch(`${WORKER_URL}/signal`);
      if (res.ok) setSignalState(await res.json());
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchSignal();
    const poll = setInterval(fetchSignal, SIGNAL_POLL_MS);
    return () => clearInterval(poll);
  }, [fetchSignal]);

  useEffect(() => () => window.clearTimeout(handoffTimerRef.current), []);

  const openVault = (vault) => {
    const delay = prefersReduced ? 0 : 300;
    setHandoffLabel(vault.label);
    setIsHandoff(delay > 0);
    window.clearTimeout(handoffTimerRef.current);
    handoffTimerRef.current = window.setTimeout(() => {
      setActiveVault(vault.id);
      setIsHandoff(false);
    }, delay);
  };

  const handleVaultBack = () => {
    const delay = prefersReduced ? 0 : 240;
    if (delay === 0) { setActiveVault(null); return; }
    setHandoffLabel("LISTENING ROOM");
    setIsHandoff(true);
    window.clearTimeout(handoffTimerRef.current);
    handoffTimerRef.current = window.setTimeout(() => {
      setActiveVault(null);
      setIsHandoff(false);
    }, delay);
  };

  const handoffOverlay = (
    <AnimatePresence>
      {isHandoff && (
        <motion.div
          className="listener-handoff"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          aria-hidden="true"
        >
          <motion.span
            className="listener-handoff-kicker"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ duration: 0.15, delay: 0.04 }}
          >OPENING</motion.span>
          <motion.span
            className="listener-handoff-label"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.1, ease: [0.25, 1, 0.5, 1] }}
          >{handoffLabel}</motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ── SIGNAL ROOM ──────────────────────────────────────────────────
  if (inSignal) {
    return (
      <TheSignal
        signalTitle={signalState.title}
        onBack={() => setInSignal(false)}
        sessionMeta={sessionMeta}
      />
    );
  }

  // ── VAULT VIEW ───────────────────────────────────────────────────
  if (activeVault) {
    return (
      <>
        <div className="universe listener-mainframe">
          <div className="glitter-grain" />
          <div className="receded-logo">dp</div>
          <Suspense fallback={<VaultSkeleton />}>
            <TheVault vault={activeVault} readOnly onBack={handleVaultBack} />
          </Suspense>
        </div>
        {handoffOverlay}
      </>
    );
  }

  // ── MAIN SHELL ───────────────────────────────────────────────────
  return (
    <div className="listener-shell">
      <DPWallpaper opacity={1} />
      <PSCWordmark />

      <header className="listener-header">
        <button
          className="listener-exit"
          onClick={onPowerDown}
          aria-label="Exit system"
        >
          EXIT
        </button>
      </header>

      <AnimatePresence>
        {signalState.is_live === 1 && (
          <motion.button
            className="listener-signal-banner"
            onClick={() => setInSignal(true)}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28 }}
            aria-label="Enter The Signal — D is live"
          >
            <span className="listener-signal-dot" aria-hidden="true" />
            <span className="listener-signal-text">
              {signalState.title || "THE SIGNAL"}
            </span>
            <span className="listener-signal-live">D IS LIVE</span>
            <span className="listener-signal-enter" aria-hidden="true">ENTER →</span>
          </motion.button>
        )}
      </AnimatePresence>

      <main className="listener-stage" id="main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedVault.id}
            className="listener-stage-content"
            initial={prefersReduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
          >
            <span className="listener-stage-kicker">VAULT</span>
            <h1 className="listener-stage-title">{selectedVault.label}</h1>
            <div className="listener-stage-rule" aria-hidden="true" />
            <p className="listener-stage-copy">{selectedVault.copy}</p>
            <button
              className="listener-stage-cta"
              onClick={() => openVault(selectedVault)}
            >
              OPEN {selectedVault.label}
            </button>
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="listener-dock" aria-label="Vault navigation">
        {LISTENER_VAULTS.map((vault) => (
          <button
            key={vault.id}
            className={`listener-dock-btn${selectedVault.id === vault.id ? " listener-dock-active" : ""}`}
            style={{ "--vault-color": vault.color }}
            onClick={() => setSelectedVault(vault)}
            aria-pressed={selectedVault.id === vault.id}
          >
            <span className="listener-dock-pip" aria-hidden="true" />
            <span className="listener-dock-label">{vault.label}</span>
          </button>
        ))}
      </nav>

      {handoffOverlay}
    </div>
  );
}

export default ListenerShell;
