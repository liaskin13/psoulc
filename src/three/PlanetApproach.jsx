import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

// ── APPROACH TIMING ───────────────────────────────────────────────────────
const APPROACH_DURATION = 3.0; // seconds

// ── PLANET VISUAL SPECS — match SpaceWindow sizes, scaled up for close-up ─
const APPROACH_DEFS = {
  saturn:   { color: '#c09030', emissive: '#301800', ei: 0.3, chakra: '#ffbf00', size: 1.8, rings: true },
  mercury:  { color: '#8098c0', emissive: '#0a1828', ei: 0.5, chakra: '#00d4ff', size: 0.9 },
  venus:    { color: '#c88860', emissive: '#301008', ei: 0.3, chakra: '#ffb7b7', size: 1.3 },
  earth:    { color: '#3d6844', emissive: '#082010', ei: 0.3, chakra: '#87ceeb', size: 1.3 },
  amethyst: { color: '#7040a0', emissive: '#180430', ei: 0.5, chakra: '#cc44ff', size: 1.1 },
};

// ── CAMERA — rushes from far to very close (ease-in-cubic for urgency) ────
function ApproachCamera() {
  useFrame((state) => {
    const t = Math.min(state.clock.getElapsedTime() / APPROACH_DURATION, 1.0);
    const s = 1 - Math.pow(1 - t, 3); // ease-in-cubic — slow start, rapid finish

    state.camera.position.set(
      Math.sin(t * 1.2) * 0.4,
      Math.cos(t * 0.8) * 0.25,
      THREE.MathUtils.lerp(18, 0.6, s),
    );
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

// ── PLANET MESH ───────────────────────────────────────────────────────────
function ApproachPlanet({ def }) {
  const meshRef = useRef();

  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.y += 0.003;
  });

  return (
    <group>
      {/* Atmosphere glow */}
      <mesh>
        <sphereGeometry args={[def.size * 1.5, 16, 16]} />
        <meshBasicMaterial
          color={def.chakra}
          transparent
          opacity={0.055}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
      {/* Outer nebula */}
      <mesh>
        <sphereGeometry args={[def.size * 2.5, 12, 12]} />
        <meshBasicMaterial
          color={def.chakra}
          transparent
          opacity={0.02}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Planet body — high segment count for close-up quality */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[def.size, 64, 64]} />
        <meshStandardMaterial
          color={def.color}
          emissive={def.emissive}
          emissiveIntensity={def.ei}
          roughness={0.65}
          metalness={0.05}
        />
      </mesh>

      {/* Saturn — double ring system */}
      {def.rings && (
        <>
          <mesh rotation={[1.4, 0, 0.4]}>
            <torusGeometry args={[def.size * 1.85, def.size * 0.09, 3, 80]} />
            <meshBasicMaterial
              color="#c8a040"
              transparent
              opacity={0.8}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          <mesh rotation={[1.4, 0, 0.4]}>
            <torusGeometry args={[def.size * 2.2, def.size * 0.04, 3, 80]} />
            <meshBasicMaterial
              color="#9a7830"
              transparent
              opacity={0.5}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        </>
      )}
    </group>
  );
}

// ── SCENE ─────────────────────────────────────────────────────────────────
function ApproachScene({ def }) {
  return (
    <>
      {/* Stars stream past at high speed — conveys velocity */}
      <Stars radius={50} depth={40} count={2500} factor={3} saturation={0.15} fade speed={6} />
      <ambientLight color="#0a0a14" intensity={0.25} />
      {/* Sun is off-screen, lighting the planet from above-left */}
      <directionalLight color="#ffee88" intensity={1.4} position={[4, 3, 6]} />
      <ApproachCamera />
      <ApproachPlanet def={def} />
    </>
  );
}

// ── EXPORT — full-screen approach; black overlay fades in, then onComplete ─
export default function PlanetApproach({ planetId, onComplete }) {
  const def = APPROACH_DEFS[planetId] || APPROACH_DEFS.earth;

  useEffect(() => {
    const timer = setTimeout(onComplete, APPROACH_DURATION * 1000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
      <Canvas
        camera={{ position: [0, 0, 18], fov: 55, near: 0.1, far: 200 }}
        style={{ position: 'absolute', inset: 0 }}
        gl={{ antialias: true }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 1)}
      >
        <ApproachScene def={def} />
      </Canvas>

      {/* Black fade-in overlay — triggers at 65% of the approach */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#000',
          pointerEvents: 'none',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          delay: APPROACH_DURATION * 0.65,
          duration: APPROACH_DURATION * 0.35,
          ease: 'easeIn',
        }}
      />
    </div>
  );
}
