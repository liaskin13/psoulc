import React from 'react';
import { motion, useAnimate } from 'framer-motion';
import { useEffect } from 'react';

// SolarFlare — White strobe → honey amber glow bridge before AstralFlyby.
// Phase 1 (~150ms): sharp white strobe
// Phase 2 (~650ms): amber flood fades out
function SolarFlare({ onComplete }) {
  const [scope, animate] = useAnimate();

  useEffect(() => {
    async function run() {
      // Phase 1: white strobe hit
      await animate(scope.current, { opacity: 1, backgroundColor: '#ffffff' }, { duration: 0.12, ease: 'easeIn' });
      // Phase 2: shift to honey amber, bloom out
      await animate(scope.current, { backgroundColor: '#ffbf00', opacity: [1, 0.85, 0] }, { duration: 0.65, times: [0, 0.4, 1], ease: 'easeOut' });
      onComplete?.();
    }
    run();
  }, []);

  return (
    <div
      ref={scope}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        backgroundColor: '#000', opacity: 0, pointerEvents: 'none',
      }}
    />
  );
}

export default SolarFlare;
