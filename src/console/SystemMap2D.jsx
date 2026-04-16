import React, { useState, useEffect, useRef } from 'react';
import './SystemMap2D.css';
import { useSystem } from '../state/SystemContext';
import { VOID_CHAKRA_COLORS } from '../config';
import { keplerPos } from '../utils/kepler';
import { orbitalClock } from '../utils/orbitalClock';

// 2D pixel-scaled orbital radii (same proportions as SpaceWindow, scaled to SVG 500×500)
// Period and eccentricity match SpaceWindow exactly — positions sync frame-perfect.
const PLANETS_2D = [
  { id: 'mercury', name: 'MERCURY', a: 60,  e: 0.2,    period: 3,  size: 8,  color: '#b8a68f', vaultLabel: 'LIVE SETS'  },
  { id: 'venus',   name: 'VENUS',   a: 90,  e: 0.006,  period: 8,  size: 12, color: '#8b7a69', vaultLabel: 'CURATED'    },
  { id: 'earth',   name: 'EARTH',   a: 120, e: 0.017,  period: 12, size: 12, color: '#2a2a2a', vaultLabel: 'PROPOSALS'  },
  { id: 'mars',    name: 'MARS',    a: 140, e: 0.0934, period: 16, size: 13, color: '#c1440e', vaultLabel: 'JESS B'     },
  { id: 'saturn',  name: 'SATURN',  a: 160, e: 0.09,   period: 20, size: 16, color: '#9d8b7a', hasRings: true, vaultLabel: 'ORIGINALS' },
  { id: 'amethyst',name: 'ANGI',    a: 210, e: 0.05,   period: 28, size: 18, color: '#9b7aa8', vaultLabel: 'CRYSTAL'    },
];

// planet.x and planet.y are pre-computed by the RAF loop in SystemMap2D
function PlanetNode({ planet, isActive, onClick }) {
  const { x, y } = planet;
  const px = 250 + x;
  const py = 250 + y;

  return (
    <g key={planet.id}>
      {/* Orbit trace — approximate circle for visual reference */}
      <circle
        cx="250" cy="250"
        r={planet.a}
        fill="none"
        stroke="#c5a025"
        strokeWidth="0.5"
        opacity="0.1"
      />

      {/* Planet dot */}
      <g
        className={`planet-node ${isActive ? 'active' : ''}`}
        transform={`translate(${px}, ${py})`}
        onClick={() => onClick(planet.id)}
        style={{ cursor: 'pointer' }}
      >
        <circle r={planet.size} fill={planet.color} opacity="0.9" className="planet-dot" />
        <circle r={planet.size + 3} fill="none" stroke="#c5a025" strokeWidth="1" opacity="0" className="planet-glow" />

        {planet.hasRings && (
          <ellipse rx={planet.size * 1.8} ry={planet.size * 0.4} fill="none" stroke="#d4c5a8" strokeWidth="1" opacity="0.6" />
        )}

        <text x="0" y={planet.size + 12} textAnchor="middle" fontSize="8" fill="#f5f1e8" opacity="0" className="planet-label">
          {planet.name}
        </text>
      </g>

      {isActive && (
        <g className="planet-reticle" transform={`translate(${px}, ${py})`}>
          <line x1={-14} y1={0} x2={14} y2={0} />
          <line x1={0} y1={-14} x2={0} y2={14} />
          <circle r={planet.size + 6} fill="none" />
        </g>
      )}

      <text
        x="250"
        y={250 - planet.a + 10}
        textAnchor="middle"
        className="orbit-micro-label"
      >
        {planet.name} · a={planet.a} · P={planet.period}y
      </text>
    </g>
  );
}

// ── Ghost Light Nebula ────────────────────────────────────────────────────
// Multi-colored radial gradients representing each planet's voided frequencies.
// Appears when hovering the Black Star indicator.
function GhostLightNebula({ archive, cx, cy }) {
  if (!archive || archive.length === 0) return null;

  // Tally count per origin planet
  const planetCounts = {};
  archive.forEach(item => {
    const p = item.originPlanet;
    if (p) planetCounts[p] = (planetCounts[p] || 0) + 1;
  });

  const totalItems = archive.length;

  // Render one nebula ring per planet that has items in the archive
  return (
    <g style={{ pointerEvents: 'none' }}>
      <defs>
        {Object.entries(planetCounts).map(([planet, count]) => {
          const color = VOID_CHAKRA_COLORS[planet] || '#9b59b6';
          const opacity = Math.min(0.7, 0.2 + (count / totalItems) * 0.5);
          const gradId = `nebula-${planet}`;
          return (
            <radialGradient key={gradId} id={gradId} cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor={color} stopOpacity={opacity} />
              <stop offset="60%"  stopColor={color} stopOpacity={opacity * 0.4} />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </radialGradient>
          );
        })}
      </defs>

      {/* Nebula halos — stacked at slightly different radii per planet */}
      {Object.entries(planetCounts).map(([planet, count], idx) => {
        const angle  = (idx / Object.keys(planetCounts).length) * Math.PI * 2;
        const radius = 18 + idx * 8;
        const offX   = Math.cos(angle) * 6;
        const offY   = Math.sin(angle) * 6;
        const gradId = `nebula-${planet}`;
        return (
          <ellipse
            key={planet}
            cx={cx + offX}
            cy={cy + offY}
            rx={radius}
            ry={radius * 0.7}
            fill={`url(#${gradId})`}
            style={{ animation: `nebula-pulse-${idx} 2s ease-in-out infinite alternate` }}
          />
        );
      })}

      {/* Central white core */}
      <circle cx={cx} cy={cy} r={4} fill="rgba(255,255,255,0.15)" />
    </g>
  );
}

export default function SystemMap2D({ onPlanetSelect, activePlanet }) {
  const [blackStarHover, setBlackStarHover] = useState(false);
  const [planetPositions, setPlanetPositions] = useState(
    () => PLANETS_2D.map(p => ({ ...p, x: p.a, y: 0 }))
  );
  const rafRef = useRef(null);
  const { architectArchive } = useSystem();

  // Black Star position — offset from Sun center
  const BLACK_STAR_CX = 232;
  const BLACK_STAR_CY = 258;
  const normalizedActiveId = typeof activePlanet === 'string' ? activePlanet : activePlanet?.id;

  // RAF loop — reads orbitalClock.t (written by SpaceWindow's useFrame) each frame.
  // Falls back to performance.now() when SpaceWindow is not mounted (Architect console).
  useEffect(() => {
    let localT = 0;
    const tick = () => {
      const t = orbitalClock.t > 0 ? orbitalClock.t : (localT += 0.016);
      const updated = PLANETS_2D.map(p => {
        const M = ((2 * Math.PI / p.period) * t) % (Math.PI * 2);
        const [x, z] = keplerPos(p.a, p.e, M);
        return { ...p, x, y: z };
      });
      setPlanetPositions(updated);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
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
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,176,40,0.16)" strokeWidth="0.6" />
          </pattern>

          <linearGradient id="radar-sweep-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255, 191, 0, 0)" />
            <stop offset="65%" stopColor="rgba(255, 191, 0, 0.25)" />
            <stop offset="100%" stopColor="rgba(255, 191, 0, 0.75)" />
          </linearGradient>
        </defs>
        <rect width="500" height="500" fill="url(#grid)" />

        <g className="radar-sweep" transform="translate(250,250)">
          <line x1="0" y1="0" x2="220" y2="0" stroke="url(#radar-sweep-grad)" strokeWidth="2" />
        </g>

        {/* THE SUN — warm center */}
        <circle cx="250" cy="250" r="8"  fill="#ffea00" opacity="0.85" />
        <circle cx="250" cy="250" r="13" fill="none" stroke="#c5a025" strokeWidth="1" opacity="0.3" />
        <text x="250" y="275" textAnchor="middle" fontSize="9" fill="#f5f1e8" fontWeight="bold">
          THE SUN
        </text>

        {/* THE BLACK STAR — gravitational anchor */}
        <g
          style={{ cursor: 'pointer' }}
          onMouseEnter={() => setBlackStarHover(true)}
          onMouseLeave={() => setBlackStarHover(false)}
        >
          {/* Event horizon glow ring */}
          <circle
            cx={BLACK_STAR_CX}
            cy={BLACK_STAR_CY}
            r={blackStarHover ? 14 : 10}
            fill="none"
            stroke="#8B0000"
            strokeWidth={blackStarHover ? 1.5 : 1}
            opacity={blackStarHover ? 0.9 : 0.5}
            style={{ transition: 'all 0.3s ease' }}
          />
          {/* Core — absorbing black */}
          <circle cx={BLACK_STAR_CX} cy={BLACK_STAR_CY} r="6" fill="#000000" opacity="0.95" />
          {/* Rim shimmer */}
          <circle cx={BLACK_STAR_CX} cy={BLACK_STAR_CY} r="6" fill="none" stroke="#8B0000" strokeWidth="1.5" opacity={blackStarHover ? 0.8 : 0.35} />

          {/* Ghost Light Nebula — visible on hover */}
          {blackStarHover && (
            <GhostLightNebula
              archive={architectArchive}
              cx={BLACK_STAR_CX}
              cy={BLACK_STAR_CY}
            />
          )}

          {/* Label */}
          <text
            x={BLACK_STAR_CX}
            y={BLACK_STAR_CY - 14}
            textAnchor="middle"
            fontSize="7"
            fill="#8B0000"
            opacity={blackStarHover ? 1 : 0.6}
            style={{ transition: 'opacity 0.3s', letterSpacing: '0.1em' }}
          >
            BLACK STAR
          </text>

          {/* Archive count badge */}
          {architectArchive.length > 0 && (
            <text
              x={BLACK_STAR_CX + 10}
              y={BLACK_STAR_CY - 2}
              textAnchor="middle"
              fontSize="6"
              fill="#8B0000"
              opacity="0.8"
            >
              {architectArchive.length}
            </text>
          )}
        </g>

        {/* Planets — positions driven by orbitalClock (synced with SpaceWindow) */}
        {planetPositions.map(planet => (
          <PlanetNode
            key={planet.id}
            planet={planet}
            isActive={normalizedActiveId === planet.id}
            onClick={onPlanetSelect}
          />
        ))}
      </svg>

      <div className="map-footer">
        <div className="vault-status">
          {activePlanet && (
            <>
              {PLANETS_2D.find(p => p.id === activePlanet)?.vaultLabel}
              {' '}
              <span className="status-active">●</span>
            </>
          )}
          {blackStarHover && architectArchive.length === 0 && (
            <span style={{ color: '#8B0000', fontSize: '9px', opacity: 0.7 }}>
              BLACK STAR — ARCHIVE EMPTY
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
