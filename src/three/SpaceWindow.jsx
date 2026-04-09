import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

const ORBITAL_TILT = Math.PI * 23 / 180;

// ── 5 MAJOR PLANETS with 23.5° axial tilt ────────────────────────────────
const PLANETS = [
  { id: 'mercury', a: 8, e: 0.2, period: 3, size: 0.4, color: '#8898bb' },
  { id: 'venus', a: 12, e: 0.006, period: 7, size: 0.6, color: '#cc9966' },
  { id: 'earth', a: 16, e: 0.017, period: 10, size: 0.63, color: '#2d8659' },
  { id: 'mars', a: 22, e: 0.09, period: 19, size: 0.42, color: '#cc5533' },
  { id: 'jupiter', a: 35, e: 0.048, period: 40, size: 1.1, color: '#cc8833' },
];

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

// ── ORBIT RING — White, faint, undeniable ────────────────────────────────
function OrbitRing({ a, e }) {
  const line = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 512; i++) {
      const M = (i / 512) * Math.PI * 2;
      const [x, z] = keplerPos(a, e, M);
      pts.push(new THREE.Vector3(x, 0, z));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    return new THREE.Line(
      geo,
      new THREE.LineBasicMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0.18,
        fog: false,
      })
    );
  }, [a, e]);

  return <primitive object={line} />;
}

// ── PLANET with 23.5° AXIAL TILT ─────────────────────────────────────────
function Planet({ p, onPlanetClick }) {
  const groupRef = useRef();
  const meshRef = useRef();

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime() * 0.4;
    const M = ((2 * Math.PI / p.period) * t) % (Math.PI * 2);
    const [x, z] = keplerPos(p.a, p.e, M);
    groupRef.current.position.set(x, 0, z);
    if (meshRef.current) meshRef.current.rotation.y += 0.003;
  });

  return (
    <group ref={groupRef}>
      {/* 23.5° Axial tilt group */}
      <group rotation={[ORBITAL_TILT, 0, 0]}>
        <mesh
          ref={meshRef}
          onClick={(e) => { e.stopPropagation(); onPlanetClick?.(p.id); }}
          onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { document.body.style.cursor = 'default'; }}
        >
          <sphereGeometry args={[p.size, 64, 64]} />
          <meshStandardMaterial
            color={p.color}
            metalness={0.2}
            roughness={0.8}
            emissive={p.color}
            emissiveIntensity={0.15}
          />
        </mesh>
      </group>
    </group>
  );
}

// ── SCENE ─────────────────────────────────────────────────────────────────
function OrreryScene({ onPlanetClick }) {
  return (
    <>
      {/* Starfield backdrop */}
      <Stars radius={300} depth={150} count={5000} factor={4} saturation={0.1} fade speed={0.2} />

      {/* Massive Sun Light at origin */}
      <pointLight color="#ffeeaa" intensity={4} distance={120} decay={1.5} />
      <pointLight color="#ff6644" intensity={1.5} distance={100} decay={1.5} position={[0, 0, -20]} />

      {/* Ambient light for fill */}
      <ambientLight color="#0a0a2e" intensity={0.4} />

      {/* Sacred Geometry */}
      <group rotation={[ORBITAL_TILT, 0, 0]}>
        {/* Glowing orbit rings */}
        {PLANETS.map((p) => (
          <OrbitRing key={`orbit-${p.id}`} a={p.a} e={p.e} />
        ))}

        {/* 5 Tilted Planets */}
        {PLANETS.map((p) => (
          <Planet key={p.id} p={p} onPlanetClick={onPlanetClick} />
        ))}
      </group>

      {/* Empire Glow: Bloom with threshold 0.2, intensity 1.5 */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.2}
          luminanceSmoothing={0.95}
          intensity={1.5}
          mipmapBlur={true}
          radius={0.9}
        />
      </EffectComposer>
    </>
  );
}

// ── EXPORT ────────────────────────────────────────────────────────────────
export default function SpaceWindow({ onPlanetClick }) {
  return (
    <Canvas
      camera={{ position: [100, 100, 200], fov: 45, near: 0.1, far: 1000 }}
      style={{ position: 'absolute', inset: 0, zIndex: 0 }}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        outputColorSpace: THREE.SRGBColorSpace,
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
      onCreated={({ gl, camera }) => {
        gl.setClearColor(0x000000, 1);
        gl.toneMappingExposure = 1.2;
        camera.lookAt(0, 0, 0);
      }}
    >
      <OrreryScene onPlanetClick={onPlanetClick} />
    </Canvas>
  );
}
