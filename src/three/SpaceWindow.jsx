import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Text, Billboard } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

const ORBITAL_TILT = Math.PI * 23 / 180;

// ── PLANET DEFINITIONS with Established Skins ──────────────────────────
const PLANETS = [
  {
    id: 'mercury',
    name: 'MERCURY',
    a: 12,
    e: 0.2,
    period: 3,
    size: 0.5,
    color: '#b8a68f',            // VU Meter Chrome (Liquid Silver)
    texture: 'chrome-liquid',
  },
  {
    id: 'venus',
    name: 'VENUS',
    a: 18,
    e: 0.006,
    period: 8,
    size: 0.7,
    color: '#8b7a69',            // Smoked Glass
    texture: 'smoked-glass',
  },
  {
    id: 'earth',
    name: 'EARTH',
    a: 24,
    e: 0.017,
    period: 12,
    size: 0.75,
    color: '#2a2a2a',            // Honed Stone (Black Marble)
    texture: 'honed-stone',
  },
  {
    id: 'saturn',
    name: 'SATURN',
    a: 32,
    e: 0.09,
    period: 20,
    size: 1.0,
    color: '#9d8b7a',            // Brushed Steel/MPC
    texture: 'brushed-steel',
    hasRings: true,
  },
  {
    id: 'amethyst',
    name: 'AMETHYST',
    a: 42,
    e: 0.05,
    period: 28,
    size: 1.2,
    color: '#9b7aa8',            // Raw Amethyst Quartz
    texture: 'amethyst-quartz',
    glow: '#c b7aa8',            // Violet tube-amp glow
  },
];

// ── KEPLER ORBIT CALCULATIONS ──────────────────────────────────────
function keplerPos(a, e, M) {
  let E = M + e * Math.sin(M);
  E = M + e * Math.sin(E);
  const nu = 2 * Math.atan2(
    Math.sqrt(1 + e) * Math.sin(E / 2),
    Math.sqrt(1 - e) * Math.cos(E / 2),
  );
  const r = (a * (1 - e * e)) / (1 + e * Math.cos(nu));
  return [r * Math.cos(nu), r * Math.sin(nu)];
}

// ── ORBIT RING (Faint Trace) ────────────────────────────────────────
function OrbitRing({ a, e }) {
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
        color: '#c5a025',          // Mustard/warm trace
        transparent: true,
        opacity: 0.15,
        fog: false,
        linewidth: 1,
      })
    );
  }, [a, e]);
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
function Planet({ p, onPlanetClick }) {
  const groupRef = useRef();
  const meshRef = useRef();

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime() * 0.3;
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
          onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { document.body.style.cursor = 'default'; }}
        >
          <sphereGeometry args={[p.size, 64, 64]} />
          <meshStandardMaterial
            color={p.color}
            metalness={p.texture === 'chrome-liquid' ? 0.85 : p.texture === 'brushed-steel' ? 0.6 : 0.2}
            roughness={p.texture === 'chrome-liquid' ? 0.1 : p.texture === 'brushed-steel' ? 0.4 : 0.8}
            emissive={p.glow || p.color}
            emissiveIntensity={p.glow ? 0.2 : 0.08}
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
function BinarySolarScene({ onPlanetClick }) {
  return (
    <>
      {/* Starfield — warm vintage film tint */}
      <Stars
        radius={200}
        depth={100}
        count={4000}
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
        {/* Orbit traces */}
        {PLANETS.map((p) => (
          <OrbitRing key={`orbit-${p.id}`} a={p.a} e={p.e} />
        ))}

        {/* 5 Established-Skin Planets */}
        {PLANETS.map((p) => (
          <Planet key={p.id} p={p} onPlanetClick={onPlanetClick} />
        ))}
      </group>

      {/* 70s Studio Warmth Pass */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.3}
          luminanceSmoothing={0.9}
          intensity={1.2}
          mipmapBlur={true}
          radius={0.8}
        />
      </EffectComposer>
    </>
  );
}

// ── EXPORT ────────────────────────────────────────────────────────
export default function SpaceWindow({ onPlanetClick }) {
  return (
    <Canvas
      camera={{ position: [80, 80, 150], fov: 40, near: 0.1, far: 800 }}
      style={{ position: 'absolute', inset: 0, zIndex: 0 }}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        outputColorSpace: THREE.SRGBColorSpace,
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
      onCreated={({ gl, camera }) => {
        gl.setClearColor(0x050505, 1);
        gl.toneMappingExposure = 1.1;
        camera.lookAt(0, 0, 0);
      }}
    >
      <BinarySolarScene onPlanetClick={onPlanetClick} />
    </Canvas>
  );
}
