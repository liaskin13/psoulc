import React, { useState } from 'react';
import './SystemMap2D.css';

const PLANETS_2D = [
  { id: 'mercury', name: 'MERCURY', a: 60, e: 0.2, size: 8, color: '#b8a68f', vaultLabel: 'LIVE SETS' },
  { id: 'venus', name: 'VENUS', a: 90, e: 0.006, size: 12, color: '#8b7a69', vaultLabel: 'CURATED' },
  { id: 'earth', name: 'EARTH', a: 120, e: 0.017, size: 12, color: '#2a2a2a', vaultLabel: 'PROPOSALS' },
  { id: 'saturn', name: 'SATURN', a: 160, e: 0.09, size: 16, color: '#9d8b7a', hasRings: true, vaultLabel: 'ORIGINALS' },
  { id: 'amethyst', name: 'ANGI', a: 210, e: 0.05, size: 18, color: '#9b7aa8', vaultLabel: 'CRYSTAL' },
];

function PlanetNode({ planet, angle, isActive, onClick }) {
  const M = angle;
  const a = planet.a;
  const e = planet.e;

  // Kepler orbit: approximate position
  const nu = 2 * Math.atan2(
    Math.sqrt(1 + e) * Math.sin(M / 2),
    Math.sqrt(1 - e) * Math.cos(M / 2)
  );
  const r = (a * (1 - e * e)) / (1 + e * Math.cos(nu));
  const x = r * Math.cos(nu);
  const y = r * Math.sin(nu);

  return (
    <g key={planet.id}>
      {/* Orbit trace segment */}
      <circle
        cx="250"
        cy="250"
        r={a}
        fill="none"
        stroke="#c5a025"
        strokeWidth="0.5"
        opacity="0.1"
      />

      {/* Planet dot */}
      <g
        className={`planet-node ${isActive ? 'active' : ''}`}
        transform={`translate(${250 + x}, ${250 + y})`}
        onClick={() => onClick(planet.id)}
        style={{ cursor: 'pointer' }}
      >
        {/* Main sphere */}
        <circle
          r={planet.size}
          fill={planet.color}
          opacity="0.9"
          className="planet-dot"
        />

        {/* Glow ring on hover/active */}
        <circle
          r={planet.size + 3}
          fill="none"
          stroke="#c5a025"
          strokeWidth="1"
          opacity="0"
          className="planet-glow"
        />

        {/* Saturn rings indicator */}
        {planet.hasRings && (
          <ellipse
            rx={planet.size * 1.8}
            ry={planet.size * 0.4}
            fill="none"
            stroke="#d4c5a8"
            strokeWidth="1"
            opacity="0.6"
          />
        )}

        {/* Label on hover */}
        <text
          x="0"
          y={planet.size + 12}
          textAnchor="middle"
          fontSize="8"
          fill="#f5f1e8"
          opacity="0"
          className="planet-label"
        >
          {planet.name}
        </text>
      </g>
    </g>
  );
}

export default function SystemMap2D({ onPlanetSelect, activePlanet }) {
  const [hoveredAngle, setHoveredAngle] = useState(0);

  // Animate angle over time
  React.useEffect(() => {
    const interval = setInterval(() => {
      setHoveredAngle((prev) => (prev + 0.02) % (Math.PI * 2));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="system-map-2d">
      <div className="map-header">
        <span className="map-label">SOLAR ARRAY</span>
        <span className="map-mode">2D CONTROL</span>
      </div>

      <svg className="map-svg" viewBox="0 0 500 500" style={{ width: '100%', aspectRatio: '1' }}>
        {/* Grid background */}
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#5d4037" strokeWidth="0.25" opacity="0.2" />
          </pattern>
        </defs>
        <rect width="500" height="500" fill="url(#grid)" />

        {/* Sun at center (warmth indicator) */}
        <circle cx="250" cy="250" r="8" fill="#ffea00" opacity="0.8" />
        <circle cx="250" cy="250" r="12" fill="none" stroke="#c5a025" strokeWidth="1" opacity="0.3" />
        <text x="250" y="275" textAnchor="middle" fontSize="9" fill="#f5f1e8" fontWeight="bold">
          THE SUN
        </text>

        {/* Planets animating around */}
        {PLANETS_2D.map((planet, idx) => {
          const baseAngle = (idx / PLANETS_2D.length) * Math.PI * 2;
          const angle = (hoveredAngle + baseAngle) % (Math.PI * 2);
          return (
            <PlanetNode
              key={planet.id}
              planet={planet}
              angle={angle}
              isActive={activePlanet === planet.id}
              onClick={onPlanetSelect}
            />
          );
        })}
      </svg>

      <div className="map-footer">
        <div className="vault-status">
          {activePlanet && (
            <>
              {PLANETS_2D.find((p) => p.id === activePlanet)?.vaultLabel}
              {' '}
              <span className="status-active">●</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
