import React from 'react';
import { motion } from 'framer-motion';

// AmethystFlare — crystal bloom that bridges 4096 validation → Angi's vault.
// Inverse colour of SolarFlare: deep violet pulse expanding outward.
function AmethystFlare({ onComplete }) {
  return (
    <motion.div
      className="amethyst-flare"
      initial={{ opacity: 0, scale: 0.3, filter: 'blur(50px) brightness(0.5)' }}
      animate={{ opacity: [0, 1, 1, 0], scale: [0.3, 1.1, 1.4, 2.2], filter: 'blur(20px) brightness(1.4)' }}
      transition={{ duration: 0.7, times: [0, 0.3, 0.65, 1], ease: 'easeOut' }}
      onAnimationComplete={onComplete}
    />
  );
}

export default AmethystFlare;
