import React from 'react';
import { motion } from 'framer-motion';

// SolarFlare — Fixed-position white-out that bridges code validation → flyby.
// z-index: 9999 ensures it burns over everything.
function SolarFlare({ onComplete }) {
  return (
    <motion.div
      className="solar-flare"
      initial={{ opacity: 0, scale: 0.4, filter: 'blur(40px) brightness(1)' }}
      animate={{ opacity: [0, 1, 1, 0], scale: [0.4, 1.2, 1.4, 2], filter: 'blur(20px) brightness(2)' }}
      transition={{ duration: 0.6, times: [0, 0.3, 0.6, 1], ease: 'easeOut' }}
      onAnimationComplete={onComplete}
    />
  );
}

export default SolarFlare;
