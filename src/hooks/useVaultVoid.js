import { useState, useCallback } from "react";
// ── useVaultVoid ───────────────────────────────────────────────────────────
// Shared void animation state for all vaults.
// Handles spaghettification animation, inverse bloom, and archive callback.
//
// Usage:
//   const { voidProps, handleShelfVoid, handleVoidButton } =
//     useVaultVoid({ onVoid, voidColor });
//
// voidProps      → animation payload for void transitions
// handleShelfVoid(item, sourcePos) → pass as RecordShelf onVoid
// handleVoidButton(item)          → call from VOID button click

export function useVaultVoid({ onVoid, voidColor }) {
  const [voidActive, setVoidActive] = useState(false);
  const [voidSource, setVoidSource] = useState(null);
  const [voidTarget, setVoidTarget] = useState(null);
  const [inverseBloom, setInverseBloom] = useState(false);
  const [pendingVoid, setPendingVoid] = useState(null);
  const [armedVoid, setArmedVoid] = useState(null);

  const getTarget = () => ({
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.28,
  });

  const triggerVoidAnimation = useCallback((item, sourcePos) => {
    const source = sourcePos ?? {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };
    const target = getTarget();
    setPendingVoid(item);
    setVoidSource(source);
    setVoidTarget(target);
    setVoidActive(true);
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
    active: voidActive,
    source: voidSource,
    target: voidTarget,
    color: voidColor,
    onComplete: handleVoidComplete,
  };

  return {
    voidProps,
    inverseBloom,
    isVoidArmed: Boolean(armedVoid),
    armedVoidLabel: armedVoid?.item?.label || "SELECTED FILE",
    cancelArmedVoid,
    confirmArmedVoid,
    handleShelfVoid,
    handleVoidButton,
  };
}
