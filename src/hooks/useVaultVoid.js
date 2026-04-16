import { useState, useRef, useCallback } from 'react';
import { playGranularPitchDown, stopTapeHiss } from '../audio/vaultAudio';

// ── useVaultVoid ───────────────────────────────────────────────────────────
// Shared void animation state for all vaults.
// Handles spaghettification animation, inverse bloom, and archive callback.
//
// Usage:
//   const { vaultWindowRef, voidProps, handleShelfVoid, handleVoidButton } =
//     useVaultVoid({ onVoid, voidColor });
//
// vaultWindowRef → pass to <VaultWindow ref={vaultWindowRef} />
// voidProps      → spread onto <VoidStreakOverlay {...voidProps} />
// handleShelfVoid(item, sourcePos) → pass as RecordShelf onVoid
// handleVoidButton(item)          → call from VOID button click

export function useVaultVoid({ onVoid, voidColor }) {
  const vaultWindowRef = useRef();

  const [voidActive,   setVoidActive]   = useState(false);
  const [voidSource,   setVoidSource]   = useState(null);
  const [voidTarget,   setVoidTarget]   = useState(null);
  const [inverseBloom, setInverseBloom] = useState(false);
  const [pendingVoid,  setPendingVoid]  = useState(null);
  const [armedVoid,    setArmedVoid]    = useState(null);

  const getTarget = () =>
    vaultWindowRef.current?.getBlackStarTarget() ??
    { x: window.innerWidth - 128, y: window.innerHeight - 180 };

  const triggerVoidAnimation = useCallback((item, sourcePos) => {
    const source = sourcePos ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const target = getTarget();
    setPendingVoid(item);
    setVoidSource(source);
    setVoidTarget(target);
    setVoidActive(true);

    // Audio: stop tape hiss + fire granular pitch-down
    stopTapeHiss();
    playGranularPitchDown();
  }, []);

  const handleShelfVoid = useCallback((item, sourcePos) => {
    setArmedVoid({ item, sourcePos });
  }, []);

  const handleVoidButton = useCallback((item) => {
    setArmedVoid({ item, sourcePos: null });
  }, []);

  const cancelArmedVoid = useCallback(() => {
    setArmedVoid(null);
  }, []);

  const confirmArmedVoid = useCallback(() => {
    if (!armedVoid?.item) return;
    triggerVoidAnimation(armedVoid.item, armedVoid.sourcePos);
    setArmedVoid(null);
  }, [armedVoid, triggerVoidAnimation]);

  const handleVoidComplete = useCallback(() => {
    setVoidActive(false);
    if (!pendingVoid) return;
    const item = pendingVoid;
    setPendingVoid(null);

    // Inverse Bloom — Flash of Darkness at the Black Star porthole
    setInverseBloom(true);
    setTimeout(() => setInverseBloom(false), 500);

    onVoid?.(item);
  }, [pendingVoid, onVoid]);

  const voidProps = {
    active:     voidActive,
    source:     voidSource,
    target:     voidTarget,
    color:      voidColor,
    onComplete: handleVoidComplete,
  };

  return {
    vaultWindowRef,
    voidProps,
    inverseBloom,
    isVoidArmed: Boolean(armedVoid),
    armedVoidLabel: armedVoid?.item?.label || 'SELECTED FILE',
    cancelArmedVoid,
    confirmArmedVoid,
    handleShelfVoid,
    handleVoidButton,
  };
}
