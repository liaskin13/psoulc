import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { useSystem } from '../state/SystemContext';
import { BINARY_CORES } from '../data/nodes';

const [SUN_NODE, BS_NODE] = BINARY_CORES;

// ── BINARY STAR PHYSICS CONSTANTS ──────────────────────────────────────────
// Newtonian two-body orbital mechanics (Decree: "physically accurate dual-core")
const M1 = 1.0;          // Sun mass (solar units)
const M2 = 0.72;         // Black Star mass — denser, slightly less massive
const SEPARATION = 2.2;  // Total distance between stars (scene units)
const G = 1.0;           // Gravitational constant (normalized)

// Barycenter (center of mass) offsets:
// r₁ = a × M₂/(M₁+M₂),  r₂ = a × M₁/(M₁+M₂)
const R1 = SEPARATION * M2 / (M1 + M2);  // Sun offset from barycenter = 0.916
const R2 = SEPARATION * M1 / (M1 + M2);  // Black Star offset          = 1.284

// Kepler's Third Law: T = 2π × √(a³ / G(M₁+M₂))
const T_ORBITAL = 2 * Math.PI * Math.sqrt(Math.pow(SEPARATION, 3) / (G * (M1 + M2)));
const OMEGA = (2 * Math.PI) / T_ORBITAL; // Angular velocity (rad/s, scene time)

// Shadow Gap — L1 Lagrange point (gravitational null between the two stars)
// L1 from M₁ = a × (1 - ∛(M₂ / 3M₁))
const L1_FROM_SUN = SEPARATION * (1 - Math.cbrt(M2 / (3 * M1))); // ≈ 0.982
// L1 ratio for lerp between Sun and Black Star positions
const L1_RATIO = L1_FROM_SUN / SEPARATION; // ≈ 0.447

// ── SUN MESH ───────────────────────────────────────────────────────────────
function SunStar({ sunRef, onSelect }) {
  const coronaRef = useRef();
  const glowRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    // Corona breathes on 4s cycle (Decree: "pulses 4s cycle")
    const pulse = 1.0 + 0.12 * Math.sin((2 * Math.PI * t) / 4);
    if (coronaRef.current) coronaRef.current.scale.setScalar(pulse);
    if (glowRef.current) {
      glowRef.current.material.opacity = 0.18 + 0.08 * Math.sin((2 * Math.PI * t) / 4);
    }
  });

  return (
    <group ref={sunRef}>
      {/* Point light — Sun is the light source */}
      <pointLight color="#ffea00" intensity={2.5} distance={12} decay={2} />

      {/* Sun core sphere */}
      <mesh
        onClick={(e) => { e.stopPropagation(); onSelect(SUN_NODE); }}
      >
        <sphereGeometry args={[0.38, 32, 32]} />
        <meshStandardMaterial
          color="#ffea00"
          emissive="#ffbf00"
          emissiveIntensity={1.8}
          roughness={0.2}
          metalness={0.0}
        />
      </mesh>

      {/* Corona glow sphere */}
      <mesh ref={coronaRef}>
        <sphereGeometry args={[0.56, 24, 24]} />
        <meshBasicMaterial
          color="#ffbf00"
          transparent
          opacity={0.12}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Outer corona halo */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.78, 24, 24]} />
        <meshBasicMaterial
          color="#ff8800"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ── BLACK STAR MESH ────────────────────────────────────────────────────────
function BlackStarBody({ blackStarRef, onSelect }) {
  const ringRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    // Event horizon ring rotates
    if (ringRef.current) ringRef.current.rotation.z = t * 0.4;
  });

  return (
    <group ref={blackStarRef}>
      {/* Black Star core — absorbs light, near-zero emissive */}
      <mesh
        onClick={(e) => { e.stopPropagation(); onSelect(BS_NODE); }}
      >
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial
          color="#050505"
          emissive="#000000"
          emissiveIntensity={0}
          roughness={1.0}
          metalness={0.0}
        />
      </mesh>

      {/* Event horizon amber rim light */}
      <mesh>
        <sphereGeometry args={[0.34, 32, 32]} />
        <meshBasicMaterial
          color="#8B0000"
          transparent
          opacity={0.35}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Accretion ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2.2, 0, 0]}>
        <torusGeometry args={[0.52, 0.04, 8, 48]} />
        <meshBasicMaterial
          color="#ffbf00"
          transparent
          opacity={0.45}
          depthWrite={false}
        />
      </mesh>

      {/* Outer void shell */}
      <mesh>
        <sphereGeometry args={[0.46, 24, 24]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.55}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ── SHADOW GAP (L1 LAGRANGE POINT) ────────────────────────────────────────
function ShadowGap({ shadowGapRef }) {
  const haloRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    // Lagrange halo breathes faintly
    if (haloRef.current) {
      haloRef.current.material.opacity = 0.05 + 0.03 * Math.sin(t * 1.2);
    }
  });

  return (
    <group ref={shadowGapRef}>
      {/* Gravitational darkness at L1 */}
      <mesh>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.85}
          depthWrite={false}
        />
      </mesh>

      {/* Amber lensing halo — gravitational edge glow */}
      <mesh ref={haloRef}>
        <sphereGeometry args={[0.34, 16, 16]} />
        <meshBasicMaterial
          color="#ffbf00"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ── ORBITAL TRAIL ──────────────────────────────────────────────────────────
function OrbitalTrail({ radius, color, segments = 96 }) {
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(
        radius * Math.cos(angle),
        0,
        radius * Math.sin(angle)
      ));
    }
    return pts;
  }, [radius, segments]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, [points]);

  return (
    <line geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={0.12} depthWrite={false} />
    </line>
  );
}

// ── MAIN PHYSICS SCENE ─────────────────────────────────────────────────────
function BinarySystem({ onSelect, isProtected }) {
  const sunRef = useRef();
  const blackStarRef = useRef();
  const shadowGapRef = useRef();

  useFrame((state) => {
    if (isProtected) return; // Freeze on Pull Cord seal

    const t = state.clock.getElapsedTime();
    const theta = OMEGA * t;

    // Two-body orbital positions about shared barycenter
    if (sunRef.current) {
      sunRef.current.position.x = -R1 * Math.cos(theta);
      sunRef.current.position.z =  R1 * Math.sin(theta);
    }
    if (blackStarRef.current) {
      blackStarRef.current.position.x =  R2 * Math.cos(theta);
      blackStarRef.current.position.z = -R2 * Math.sin(theta);
    }

    // Shadow Gap tracks L1 Lagrange point dynamically between the two stars
    if (shadowGapRef.current && sunRef.current && blackStarRef.current) {
      shadowGapRef.current.position.x = THREE.MathUtils.lerp(
        sunRef.current.position.x,
        blackStarRef.current.position.x,
        L1_RATIO
      );
      shadowGapRef.current.position.z = THREE.MathUtils.lerp(
        sunRef.current.position.z,
        blackStarRef.current.position.z,
        L1_RATIO
      );
    }
  });

  return (
    <>
      {/* Ambient deep-space light */}
      <ambientLight color="#111122" intensity={0.15} />

      {/* Faint orbital guide paths */}
      <OrbitalTrail radius={R1} color="#ffbf00" />
      <OrbitalTrail radius={R2} color="#8B0000" />

      {/* The Sun */}
      <SunStar sunRef={sunRef} onSelect={onSelect} />

      {/* The Black Star */}
      <BlackStarBody blackStarRef={blackStarRef} onSelect={onSelect} />

      {/* Shadow Gap — L1 Lagrange gravitational null zone */}
      <ShadowGap shadowGapRef={shadowGapRef} />
    </>
  );
}

// ── COMPONENT WRAPPER ──────────────────────────────────────────────────────
function BinaryCore3D({ onSelect }) {
  const { isProtected } = useSystem();
  const handleSelectSun = () => onSelect(SUN_NODE);
  const handleSelectBlackStar = () => onSelect(BS_NODE);

  return (
    <div className="binary-core-3d">
      {/* Singularity collapse flash (Pull Cord) */}
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

      <Canvas
        camera={{ position: [0, 4.5, 0], fov: 38, near: 0.1, far: 100 }}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        <BinarySystem onSelect={onSelect} isProtected={isProtected} />
      </Canvas>

      <div className="binary-core-controls" role="group" aria-label="Binary core quick select">
        <button
          type="button"
          className="binary-core-control sun"
          onClick={handleSelectSun}
          aria-label="Select Sun core"
        >
          SUN
        </button>
        <button
          type="button"
          className="binary-core-control star"
          onClick={handleSelectBlackStar}
          aria-label="Select Black Star core"
        >
          BLACK STAR
        </button>
      </div>

      {/* Labels — rendered in DOM over the canvas */}
      <div className="binary-label-sun">SUN</div>
      <div className="binary-label-star">★</div>
      <div className="binary-label-gap">SHADOW GAP</div>
    </div>
  );
}

export default BinaryCore3D;
export { OMEGA, R1, R2, L1_RATIO, SEPARATION, M1, M2 };
