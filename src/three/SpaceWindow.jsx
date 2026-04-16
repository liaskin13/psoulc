import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Text, Billboard } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { isLowEnd, clampedDPR } from '../utils/device';
import { keplerPos, PLANET_DEFS } from '../utils/kepler';
import { orbitalClock } from '../utils/orbitalClock';
import { VOID_CHAKRA_COLORS } from '../config';
import { SATURN_MOONS } from '../data/saturn';

const LOW_END = isLowEnd();

const ORBITAL_TILT = Math.PI * 23 / 180;

// ── PLANET DEFINITIONS with Established Skins ──────────────────────────
// Visual properties layered on top of the shared PLANET_DEFS orbital mechanics
const PLANET_VISUALS = {
  mercury:  { texture: 'chrome-liquid',   hasRings: false, glow: null },
  venus:    { texture: 'smoked-glass',    hasRings: false, glow: null },
  earth:    { texture: 'honed-stone',     hasRings: false, glow: null },
  mars:     { texture: 'iron-oxide',      hasRings: false, glow: '#ff4500' },
  saturn:   { texture: 'brushed-steel',   hasRings: true,  glow: null },
  amethyst: { texture: 'amethyst-quartz', hasRings: false, glow: '#9b7aa8' },
};

const PLANETS = PLANET_DEFS.map(p => ({ ...p, ...PLANET_VISUALS[p.id] }));
const SATURN_DEF = PLANETS.find((p) => p.id === 'saturn');
const SATURN_MOON_RADII = [4.4, 5.3, 6.2, 7.0];

function SaturnMoonNodes({ onPlanetClick, onPlanetHover }) {
  const refs = useRef([]);

  useFrame(({ clock }) => {
    if (!SATURN_DEF) return;
    const t = clock.getElapsedTime() * 0.3;
    const saturnM = ((2 * Math.PI / SATURN_DEF.period) * t) % (Math.PI * 2);
    const [sx, sz] = keplerPos(SATURN_DEF.a, SATURN_DEF.e, saturnM);

    SATURN_MOONS.forEach((moon, index) => {
      const ref = refs.current[index];
      if (!ref) return;
      const orbitR = SATURN_MOON_RADII[index % SATURN_MOON_RADII.length];
      const speed = 0.95 + index * 0.22;
      const localT = clock.getElapsedTime() * speed;
      const mx = sx + Math.cos(localT) * orbitR;
      const mz = sz + Math.sin(localT) * orbitR;
      const my = Math.sin(localT * 0.7) * 0.65;
      ref.position.set(mx, my, mz);
    });
  });

  return (
    <>
      {SATURN_MOONS.map((moon, index) => (
        <group key={`saturn-moon-${moon.id}`} ref={(el) => { refs.current[index] = el; }}>
          <mesh>
            <sphereGeometry args={[0.95, 10, 10]} />
            <meshBasicMaterial color="#e8a020" transparent opacity={0.12} side={THREE.BackSide} depthWrite={false} />
          </mesh>
          <mesh
            onClick={(e) => { e.stopPropagation(); onPlanetClick?.(`moon_${moon.id}`); }}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = 'pointer';
              onPlanetHover?.(`moon_${moon.id}`);
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'default';
              onPlanetHover?.(null);
            }}
          >
            <sphereGeometry args={[0.32, 20, 20]} />
            <meshStandardMaterial color="#9d66c9" emissive="#6600cc" emissiveIntensity={0.6} roughness={0.35} metalness={0.15} />
          </mesh>
          <Billboard>
            <Text
              position={[0, 0.56, 0]}
              font-size={0.34}
              color="#cfa7f2"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.035}
              outlineColor="#120510"
            >
              {moon.name}
            </Text>
          </Billboard>
        </group>
      ))}
    </>
  );
}

// ── ORBIT RING (Chakra-tinted Trace) ───────────────────────────────
function OrbitRing({ a, e, color = '#c5a025' }) {
  const line = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 256; i++) {
      const M = (i / 256) * Math.PI * 2;
      const [x, z] = keplerPos(a, e, M);
      pts.push(new THREE.Vector3(x, 0, z));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    return new THREE.Line(
      geo,
      new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.18,
        fog: false,
        linewidth: 1,
      })
    );
  }, [a, e, color]);
  return <primitive object={line} />;
}

function OrbitAnnotations({ p }) {
  const velocityRef = useRef();

  const perihelionX = p.a * (1 - p.e);
  const aphelionX = -p.a * (1 + p.e);

  useFrame(() => {
    if (!velocityRef.current) return;
    const t = orbitalClock.t || 0;
    const M = ((2 * Math.PI / p.period) * t) % (Math.PI * 2);
    const [x1, z1] = keplerPos(p.a, p.e, M);
    const [x2, z2] = keplerPos(p.a, p.e, M + 0.02);
    const dir = new THREE.Vector3(x2 - x1, 0, z2 - z1).normalize();
    const start = new THREE.Vector3(x1, 0, z1);
    const end = start.clone().add(dir.multiplyScalar(5));
    velocityRef.current.geometry.setFromPoints([start, end]);
  });

  return (
    <group>
      <mesh position={[perihelionX, 0, 0]}>
        <sphereGeometry args={[0.24, 8, 8]} />
        <meshBasicMaterial color="#ffbf00" transparent opacity={0.9} />
      </mesh>
      <mesh position={[aphelionX, 0, 0]}>
        <ringGeometry args={[0.16, 0.28, 16]} />
        <meshBasicMaterial color="#ffbf00" side={THREE.DoubleSide} transparent opacity={0.7} />
      </mesh>

      <line ref={velocityRef}>
        <bufferGeometry />
        <lineBasicMaterial color="#ffbf00" transparent opacity={0.6} />
      </line>
    </group>
  );
}

function TrajectoryPreview({ planet }) {
  const line = useMemo(() => {
    if (!planet) return null;
    const pts = [];
    const t = orbitalClock.t || 0;
    const nowM = ((2 * Math.PI / planet.period) * t) % (Math.PI * 2);
    const step = (Math.PI) / 70;

    for (let i = 0; i <= 70; i++) {
      const M = nowM + i * step;
      const [x, z] = keplerPos(planet.a, planet.e, M);
      pts.push(new THREE.Vector3(x, 0, z));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(pts);
    const material = new THREE.LineDashedMaterial({
      color: '#ffbf00',
      dashSize: 2.2,
      gapSize: 1.4,
      transparent: true,
      opacity: 0.85,
    });
    const l = new THREE.Line(geometry, material);
    l.computeLineDistances();
    return l;
  }, [planet]);

  if (!line) return null;
  return <primitive object={line} />;
}

// ── SATURN RINGS ────────────────────────────────────────────────────
function SaturnRings() {
  return (
    <group>
      <mesh rotation={[ORBITAL_TILT, 0, 0.3]}>
        <torusGeometry args={[1.4, 0.3, 16, 100]} />
        <meshStandardMaterial
          color="#d4c5a8"
          metalness={0.7}
          roughness={0.3}
          emissive="#9d8b7a"
          emissiveIntensity={0.1}
        />
      </mesh>
    </group>
  );
}

// ── TEXTURED PLANET ────────────────────────────────────────────────
function Planet({ p, onPlanetClick, onPlanetHover, activePlanetId }) {
  const groupRef = useRef();
  const meshRef = useRef();
  const isActive = activePlanetId === p.id;

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime() * 0.3;
    // Publish shared time for SystemMap2D to consume (written once per frame by any planet)
    orbitalClock.t = t;
    const M = ((2 * Math.PI / p.period) * t) % (Math.PI * 2);
    const [x, z] = keplerPos(p.a, p.e, M);
    groupRef.current.position.set(x, 0, z);
    if (meshRef.current && p.texture !== 'honed-stone') {
      meshRef.current.rotation.y += 0.002;
    }
  });

  return (
    <group ref={groupRef}>
      <group rotation={[ORBITAL_TILT, 0, 0]}>
        {/* Main sphere */}
        <mesh
          ref={meshRef}
          onClick={(e) => { e.stopPropagation(); onPlanetClick?.(p.id); }}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'pointer';
            onPlanetHover?.(p.id);
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'default';
            onPlanetHover?.(null);
          }}
        >
          <sphereGeometry args={[p.size, 64, 64]} />
          <meshStandardMaterial
            color={p.color}
            metalness={p.texture === 'chrome-liquid' ? 0.85 : p.texture === 'brushed-steel' ? 0.6 : 0.2}
            roughness={p.texture === 'chrome-liquid' ? 0.1 : p.texture === 'brushed-steel' ? 0.4 : 0.8}
            emissive={p.glow || p.color}
            emissiveIntensity={isActive ? 0.34 : (p.glow ? 0.2 : 0.08)}
          />
        </mesh>

        {/* Saturn rings */}
        {p.hasRings && <SaturnRings />}

        {/* Amethyst quartz fractal glow */}
        {p.id === 'amethyst' && (
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[p.size * 1.15, 32, 32]} />
            <meshStandardMaterial
              color={p.glow}
              transparent
              opacity={0.2}
              emissive={p.glow}
              emissiveIntensity={0.3}
            />
          </mesh>
        )}
      </group>

      {/* Planet label */}
      <Billboard>
        <Text
          position={[0, p.size * 1.8, 0]}
          font-size={0.8}
          color="#f5f1e8"
          anchorX="center"
          anchorY="middle"
          maxWidth={3}
          outlineWidth={0.05}
          outlineColor="#3e2723"
        >
          {p.name}
        </Text>
      </Billboard>
    </group>
  );
}

// ── THE SUN (Center, at D's position) ──────────────────────────────
function TheSun() {
  return (
    <group position={[0, 0, 0]}>
      {/* Core warmth light */}
      <pointLight
        color="#ffea00"
        intensity={6}
        distance={80}
        decay={1.8}
      />
      <pointLight
        color="#d2691e"
        intensity={2}
        distance={60}
        decay={1.5}
        position={[0, 0, 0]}
      />

      {/* Sun visual (glow sphere) */}
      <mesh>
        <sphereGeometry args={[2, 32, 32]} />
        <meshStandardMaterial
          color="#ffea00"
          emissive="#ffea00"
          emissiveIntensity={0.8}
          metalness={0}
          roughness={0.4}
        />
      </mesh>

      {/* Outer halo */}
      <mesh position={[0, 0, 0]} scale={1.3}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshStandardMaterial
          color="#c5a025"
          transparent
          opacity={0.15}
          emissive="#c5a025"
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  );
}

// ── SCENE ──────────────────────────────────────────────────────────
function BinarySolarScene({ onPlanetClick, onPlanetHover, activePlanetId, hoveredPlanetId }) {
  const hoveredPlanet = PLANETS.find((p) => p.id === hoveredPlanetId) || null;

  return (
    <>
      {/* Starfield — warm vintage film tint; reduced on low-end devices */}
      <Stars
        radius={200}
        depth={100}
        count={isLowEnd() ? 1500 : 4000}
        factor={5}
        saturation={0.08}
        fade
        speed={0.3}
      />

      {/* Ambient — warm studio fill light */}
      <ambientLight color="#8b6f47" intensity={0.35} />

      {/* THE SUN — D at center */}
      <TheSun />

      {/* Sacred elliptical geometry */}
      <group rotation={[ORBITAL_TILT, 0, 0]}>
        {/* Orbit traces — per-planet chakra spectrum color */}
        {PLANETS.map((p) => (
          <OrbitRing key={`orbit-${p.id}`} a={p.a} e={p.e} color={VOID_CHAKRA_COLORS[p.id]} />
        ))}

        {PLANETS.map((p) => (
          <OrbitAnnotations key={`anno-${p.id}`} p={p} />
        ))}

        <TrajectoryPreview planet={hoveredPlanet} />

        {/* 5 Established-Skin Planets */}
        {PLANETS.map((p) => (
          <Planet
            key={p.id}
            p={p}
            onPlanetClick={onPlanetClick}
            onPlanetHover={onPlanetHover}
            activePlanetId={activePlanetId}
          />
        ))}

        {/* Saturn moons orbit with Saturn around the binary core */}
        <SaturnMoonNodes onPlanetClick={onPlanetClick} onPlanetHover={onPlanetHover} />
      </group>

      {/* 70s Studio Warmth Pass — skip on low-end devices */}
      {!LOW_END && (
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.3}
            luminanceSmoothing={0.9}
            intensity={1.2}
            mipmapBlur={true}
            radius={0.8}
          />
        </EffectComposer>
      )}
    </>
  );
}

// ── EXPORT ────────────────────────────────────────────────────────
export default function SpaceWindow({ onPlanetClick, onPlanetHover, activePlanetId }) {
  const [hoveredPlanetId, setHoveredPlanetId] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!hoveredPlanetId) return undefined;
    const timer = setInterval(() => setTick((v) => v + 1), 350);
    return () => clearInterval(timer);
  }, [hoveredPlanetId]);

  void tick;

  return (
    <Canvas
      camera={{ position: [80, 80, 150], fov: 40, near: 0.1, far: 800 }}
      dpr={LOW_END ? 1 : clampedDPR()}
      style={{ position: 'absolute', inset: 0, zIndex: 0 }}
      gl={{
        antialias: !LOW_END,
        powerPreference: LOW_END ? 'low-power' : 'high-performance',
        outputColorSpace: THREE.SRGBColorSpace,
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
      onCreated={({ gl, camera }) => {
        gl.setClearColor(0x050505, 1);
        gl.toneMappingExposure = 1.1;
        camera.lookAt(0, 0, 0);
      }}
    >
      <BinarySolarScene
        onPlanetClick={onPlanetClick}
        onPlanetHover={(id) => {
          setHoveredPlanetId(id);
          onPlanetHover?.(id);
        }}
        activePlanetId={activePlanetId}
        hoveredPlanetId={hoveredPlanetId}
      />
    </Canvas>
  );
}
