import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSystem } from '../state/SystemContext';
import { BINARY_CORES } from '../data/nodes';

const [SUN_NODE, BS_NODE] = BINARY_CORES;

function BinaryCore({ onSelect }) {
  const { isProtected } = useSystem();

  return (
    <div className={`binary-heart ${isProtected ? 'collapsed' : ''}`}>
      {/* Faint orbital ellipse */}
      <div className="binary-orbit-ring" />

      {/* Orbiting pair — stops and light-sucks on Pull Cord */}
      <motion.div
        className="binary-pair"
        animate={isProtected
          ? { scale: 0.05, opacity: 0, rotate: 0 }
          : { rotate: 360 }
        }
        transition={isProtected
          ? { duration: 0.35, ease: [0.95, 0.05, 1, 1] }
          : { duration: 8, repeat: Infinity, ease: 'linear', repeatType: 'loop' }
        }
      >
        {/* The Sun */}
        <motion.div
          className="binary-body sun-body"
          whileHover={{ scale: 1.15, filter: 'brightness(1.4)' }}
          onClick={() => onSelect(SUN_NODE)}
          title="SUNSTAR — God Mode Console"
        >
          <div className="binary-label">SUN</div>
        </motion.div>

        {/* The Black Star */}
        <motion.div
          className="binary-body black-star-body"
          whileHover={{ scale: 1.15, filter: 'brightness(1.4)' }}
          onClick={() => onSelect(BS_NODE)}
          title="BLACK STAR — Architect's Void"
        >
          <div className="binary-label">★</div>
        </motion.div>
      </motion.div>

      {/* Collapse flash — light-suck singularity */}
      <AnimatePresence>
        {isProtected && (
          <motion.div
            className="singularity-flash"
            key="singularity"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 2.5, 0.1], opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.95, 0.05, 1, 1] }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default BinaryCore;
