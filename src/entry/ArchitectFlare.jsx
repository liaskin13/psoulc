import React from 'react';
import { motion } from 'framer-motion';

// Inverse of SolarFlare — darkness floods inward like a solar eclipse.
// Triggered when the Black Star code (7677) is accepted.
function ArchitectFlare() {
  return (
    <motion.div
      className="architect-flare"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0.95] }}
      transition={{ duration: 0.7, ease: [0.05, 0.95, 0.2, 1] }}
    />
  );
}

export default ArchitectFlare;
