import React, { useEffect, useMemo, useState } from 'react';
import { PLANET_DEFS, keplerPos } from '../utils/kepler';
import { orbitalClock } from '../utils/orbitalClock';
import { VOID_CHAKRA_COLORS } from '../config';

function getPlanetMetrics(planetId) {
  const planet = PLANET_DEFS.find((p) => p.id === planetId);
  if (!planet) return null;

  const t = orbitalClock.t || 0;
  const M = ((2 * Math.PI / planet.period) * t) % (Math.PI * 2);
  const [x, z] = keplerPos(planet.a, planet.e, M);
  const distance = Math.sqrt(x * x + z * z);
  const angleDeg = ((Math.atan2(z, x) * 180) / Math.PI + 360) % 360;

  return {
    ...planet,
    angleDeg,
    distance,
    etaPerihelionSec: Math.max(0, ((2 * Math.PI - M) / (2 * Math.PI)) * planet.period * 10),
  };
}

export default function TelemetryHUD({ hoveredPlanetId, activePlanetId }) {
  const [, setTick] = useState(0);
  const planetId = hoveredPlanetId || activePlanetId;
  const metrics = useMemo(() => getPlanetMetrics(planetId), [planetId, hoveredPlanetId, activePlanetId]);

  useEffect(() => {
    if (!planetId) return undefined;
    const timer = setInterval(() => setTick((v) => v + 1), 1000);
    return () => clearInterval(timer);
  }, [planetId]);

  if (!metrics) return null;

  const chakra = VOID_CHAKRA_COLORS[metrics.id] || '#ffbf00';

  return (
    <div className="telemetry-hud" aria-live="polite">
      <div className="telemetry-leader" aria-hidden="true" />
      <div className="telemetry-card" style={{ '--telemetry-accent': chakra }}>
        <div className="telemetry-name">{metrics.name}</div>
        <div className="telemetry-line">ORBIT PERIOD: {metrics.period.toFixed(1)}y</div>
        <div className="telemetry-line">MEAN ANGLE: {metrics.angleDeg.toFixed(1)}°</div>
        <div className="telemetry-line">RADIUS: {metrics.distance.toFixed(2)} AU</div>
        <div className="telemetry-line">ETA PERIHELION: T-{Math.ceil(metrics.etaPerihelionSec)}s</div>
      </div>
    </div>
  );
}
