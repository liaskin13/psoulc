import React, {
  useState,
  lazy,
  Suspense,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import VaultSkeleton from "../components/VaultSkeleton";
import { getWaveformBars } from "../utils/waveform";
import TheSignal from "../signal/TheSignal";
import { VAULT_ACCENT_COLORS, UPLOAD_WORKER_URL } from "../config";
import PSCWordmark from "../components/PSCWordmark";

const WORKER_URL = UPLOAD_WORKER_URL;
const SIGNAL_POLL_MS = 10000;

function ListenerWatermark() {
  const bars = getWaveformBars("listener-ambient", 48);
  const barW = 4,
    gap = 3,
    H = 80;
  const W = bars.length * (barW + gap) - gap;
  return (
    <svg
      className="listener-waveform-watermark"
      aria-hidden="true"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {bars.map((pct, i) => {
        const h = (pct / 100) * H;
        return (
          <rect
            key={i}
            x={i * (barW + gap)}
            y={H - h}
            width={barW}
            height={h}
            rx="1"
            fill="rgba(240,237,232,0.07)"
          />
        );
      })}
    </svg>
  );
}

const TheVault = lazy(() => import("../components/TheVault"));

// Active vaults only — in launch priority order.
// Crystal (Amethyst) and Mars excluded: no content to upload yet.
// Earth (Sonic Architecture) exists but is not a listener priority yet.
const LISTENER_VAULTS = [
  { id: "venus", label: "MIXES", color: VAULT_ACCENT_COLORS.venus },
  { id: "saturn", label: "ORIGINAL MUSIC", color: VAULT_ACCENT_COLORS.saturn },
  { id: "mercury", label: "LIVE SETS", color: VAULT_ACCENT_COLORS.mercury },
];

function renderVault(id, onBack) {
  if (!id) return null;
  return <TheVault vault={id} readOnly onBack={onBack} />;
}

function ListenerShell({ onPowerDown, sessionMeta }) {
  const [pendingSelection, setPendingSelection] = useState(null);
  const [activeVault, setActiveVault] = useState(null);
  const [lastPlayed, setLastPlayed] = useState(null);
  const [inSignal, setInSignal] = useState(false);
  const [signalState, setSignalState] = useState({ is_live: 0, title: null });
  const [handoffLabel, setHandoffLabel] = useState("");
  const [handoffKicker, setHandoffKicker] = useState("OPENING");
  const [isHandoffActive, setIsHandoffActive] = useState(false);
  const signalPollRef = useRef(null);
  const handoffTimerRef = useRef(null);
  const shellRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ container: shellRef });
  const heroYOffset = useTransform(scrollYProgress, [0, 1], ["0%", "-18%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0.35]);

  const fetchSignal = useCallback(async () => {
    try {
      const res = await fetch(`${WORKER_URL}/signal`);
      if (res.ok) setSignalState(await res.json());
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchSignal();
    signalPollRef.current = setInterval(fetchSignal, SIGNAL_POLL_MS);
    return () => clearInterval(signalPollRef.current);
  }, [fetchSignal]);

  const handleArchiveSelect = (id, label) => {
    const handoffDelay = prefersReducedMotion ? 0 : 330;
    setHandoffKicker("OPENING");
    setHandoffLabel(label);
    setIsHandoffActive(handoffDelay > 0);
    window.clearTimeout(handoffTimerRef.current);
    handoffTimerRef.current = window.setTimeout(() => {
      setPendingSelection(id);
      setIsHandoffActive(false);
    }, handoffDelay);
  };

  const handleVaultBack = () => {
    const returnDelay = prefersReducedMotion ? 0 : 260;
    if (returnDelay === 0) {
      setLastPlayed(activeVault);
      setActiveVault(null);
      return;
    }

    setHandoffKicker("RETURNING");
    setHandoffLabel("LISTENING ROOM");
    setIsHandoffActive(true);
    window.clearTimeout(handoffTimerRef.current);
    handoffTimerRef.current = window.setTimeout(() => {
      setLastPlayed(activeVault);
      setActiveVault(null);
      setIsHandoffActive(false);
    }, returnDelay);
  };

  // Resolve handoff to destination panel in effect, not render.
  useEffect(() => {
    if (!pendingSelection) return;
    setActiveVault(pendingSelection);
    setPendingSelection(null);
  }, [pendingSelection]);

  useEffect(
    () => () => {
      window.clearTimeout(handoffTimerRef.current);
    },
    [],
  );

  const handoffOverlay = (
    <AnimatePresence>
      {isHandoffActive && (
        <motion.div
          className="listener-shell-handoff"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          aria-hidden="true"
        >
          <motion.div
            className="listener-shell-handoff-core"
            initial={
              prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }
            }
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="listener-shell-handoff-kicker">
              {handoffKicker}
            </span>
            <span className="listener-shell-handoff-label">{handoffLabel}</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ── SIGNAL ROOM ─────────────────────────────────────────────────
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
            {renderVault(activeVault, handleVaultBack)}
          </Suspense>
        </div>
        {handoffOverlay}
      </>
    );
  }

  const lastVaultMeta = lastPlayed
    ? LISTENER_VAULTS.find((v) => v.id === lastPlayed)
    : null;

  // ── MAIN LISTENER SHELL ─────────────────────────────────────────
  return (
    <div className="listener-shell" ref={shellRef}>
      <PSCWordmark />
      <div className="listener-topbar">
        <button className="listener-powerdown" onClick={onPowerDown}>
          EXIT SYSTEM
        </button>
      </div>

      <motion.section
        className="listener-hero"
        style={
          prefersReducedMotion
            ? undefined
            : { y: heroYOffset, opacity: heroOpacity }
        }
      >
        <div className="listener-marquee" aria-hidden="true">
          D WORLD ACCESS D WORLD ACCESS D WORLD ACCESS D WORLD ACCESS
        </div>
        <h1 className="listener-hero-title">D'S ARCHIVE</h1>
        <p className="listener-hero-copy">You have access. Enter a vault.</p>
        <button
          className="listener-hero-enter"
          onClick={() => handleArchiveSelect("saturn", "ORIGINAL MUSIC")}
        >
          ENTER FEATURED ARCHIVE
        </button>
        <ListenerWatermark />
      </motion.section>

      <motion.div
        className="listener-progress-line"
        style={prefersReducedMotion ? undefined : { scaleX: scrollYProgress }}
      />

      <section className="listener-scroll-rail">
        {LISTENER_VAULTS.map((vault, index) => (
          <motion.article
            key={vault.id}
            className="listener-rail-panel"
            style={{ "--vault-color": vault.color }}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 40 }}
            whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="listener-panel-index">0{index + 1}</div>
            <div className="listener-panel-body">
              <div className="listener-panel-kicker">VAULT</div>
              <h2 className="listener-panel-title">{vault.label}</h2>
              <p className="listener-panel-copy">
                Curated sequencing, waveform-led browsing, and signal-rich
                metadata. Familiar to DJs, surprising to everyone else.
              </p>
              <button
                className="listener-panel-enter"
                onClick={() => handleArchiveSelect(vault.id, vault.label)}
              >
                OPEN {vault.label}
              </button>
            </div>
          </motion.article>
        ))}
      </section>

      <AnimatePresence>
        {lastVaultMeta && (
          <motion.div
            className="listener-now-playing"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <span
              className="listener-np-dot"
              style={{ background: lastVaultMeta.color }}
              aria-hidden="true"
            />
            <span className="listener-np-label">{lastVaultMeta.label}</span>
            <span className="listener-np-status">LAST OPENED</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {signalState.is_live === 1 && (
          <motion.button
            className="listener-signal-btn"
            onClick={() => setInSignal(true)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.4 }}
            aria-label="Enter The Signal — D is live"
          >
            <span className="listener-signal-dot" aria-hidden="true" />
            <span className="listener-signal-label">
              {signalState.title || "THE SIGNAL"}
            </span>
            <span className="listener-signal-tag">D IS LIVE</span>
          </motion.button>
        )}
      </AnimatePresence>

      <div className="listener-dock">
        {LISTENER_VAULTS.map((vault) => (
          <motion.button
            key={vault.id}
            className={`listener-vault-btn ${lastPlayed === vault.id ? "listener-vault-active" : ""}`}
            style={{ "--vault-color": vault.color }}
            onClick={() => handleArchiveSelect(vault.id, vault.label)}
            whileHover={prefersReducedMotion ? {} : { scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <span className="listener-vault-pip" aria-hidden="true" />
            <span className="listener-vault-label">{vault.label}</span>
          </motion.button>
        ))}
      </div>

      {handoffOverlay}
    </div>
  );
}

export default ListenerShell;
