import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PLANET_DEFS, keplerPos } from '../utils/kepler';
import { orbitalClock } from '../utils/orbitalClock';
import { VOID_CHAKRA_COLORS } from '../config';

function getReadout(planetId, sessionMeta) {
  const planet = PLANET_DEFS.find((p) => p.id === planetId);
  if (!planet) return null;

  const t = orbitalClock.t || 0;
  const M = ((2 * Math.PI / planet.period) * t) % (Math.PI * 2);
  const [x, z] = keplerPos(planet.a, planet.e, M);
  const distance = Math.sqrt(x * x + z * z);

  return {
    ...planet,
    distance,
    angleDeg: ((Math.atan2(z, x) * 180) / Math.PI + 360) % 360,
    assigned: sessionMeta?.planet === planet.id ? sessionMeta.owner : 'UNASSIGNED',
  };
}

export default function PlanetReadout({ planetId, sessionMeta, onApproach, onTune, onVoid }) {
  const [, setTick] = useState(0);
  const data = useMemo(() => getReadout(planetId, sessionMeta), [planetId, sessionMeta]);

  useEffect(() => {
    if (!planetId) return undefined;
    const timer = setInterval(() => setTick((v) => v + 1), 1000);
    return () => clearInterval(timer);
  }, [planetId]);

  return (
    <AnimatePresence>
      {data && (
        <motion.aside
          className="planet-readout"
          initial={{ x: 240, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 240, opacity: 0 }}
          transition={{ duration: 0.24, ease: [0.2, 0, 0.2, 1] }}
        >
          <div className="planet-readout-title" style={{ '--readout-accent': VOID_CHAKRA_COLORS[data.id] || '#ffbf00' }}>
            {data.name} · {data.id.toUpperCase()}
          </div>
          <div className="planet-readout-line">VAULT CLASS: FREQUENCY ARCHIVE</div>
          <div className="planet-readout-line">SEMI-MAJOR AXIS: {data.a.toFixed(2)} AU</div>
          <div className="planet-readout-line">ECCENTRICITY: {data.e.toFixed(4)}</div>
          <div className="planet-readout-line">ANGLE: {data.angleDeg.toFixed(1)}°</div>
          <div className="planet-readout-line">DISTANCE: {data.distance.toFixed(2)} AU</div>
          <div className="planet-readout-line">ASSIGNED: {data.assigned}</div>

          <div className="planet-readout-actions">
            <button type="button" className="planet-readout-btn" onClick={() => onApproach?.(data.id)}>APPROACH</button>
            <button type="button" className="planet-readout-btn" onClick={() => onTune?.(data.id)}>TUNE</button>
            <button type="button" className="planet-readout-btn void" onClick={() => onVoid?.(data.id)}>VOID</button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
