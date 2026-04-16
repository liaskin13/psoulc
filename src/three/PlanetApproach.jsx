import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

// ── PLANET APPROACH TIMING ───────────────────────────────────────────────────────
const APPROACH_DURATION = 3.0; // seconds

// ── PLANET VISUAL SPECS — match SpaceWindow sizes, scaled up for close-up ─
const APPROACH_DEFS = {
  saturn:   { color: '#c09030', emissive: '#301800', ei: 0.3, chakra: '#9b59b6', size: 1.8, rings: true },
  mercury:  { color: '#8098c0', emissive: '#0a1828', ei: 0.5, chakra: '#8B0000', size: 0.9 },
  venus:    { color: '#c88860', emissive: '#301008', ei: 0.3, chakra: '#ff7c00', size: 1.3 },
  earth:    { color: '#3d6844', emissive: '#082010', ei: 0.3, chakra: '#00cc44', size: 1.3 },
  amethyst: { color: '#7040a0', emissive: '#180430', ei: 0.5, chakra: '#6600cc', size: 1.1 },
  mars:     { color: '#a0380a', emissive: '#280800', ei: 0.4, chakra: '#c1440e', size: 1.0 },
};

// ── PLANET HUD LABELS ──────────────────────────────────────────────────────
const PLANET_LABELS = {
  saturn:   { name: 'SATURN',   vault: 'ORIGINAL MUSIC' },
  mercury:  { name: 'MERCURY',  vault: 'LIVE SETS · STREAMING' },
  venus:    { name: 'VENUS',    vault: 'CURATED MIXES' },
  earth:    { name: 'EARTH',    vault: 'SONIC ARCHITECTURE' },
  amethyst: { name: 'AMETHYST', vault: 'CRYSTAL VAULT' },
  mars:     { name: 'MARS',     vault: 'SONIC ARCHIVES' },
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
  const def    = APPROACH_DEFS[planetId]    || APPROACH_DEFS.earth;
  const labels = PLANET_LABELS[planetId]    || PLANET_LABELS.earth;
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = performance.now();
    let frame;

    const tick = () => {
      const next = Math.min((performance.now() - start) / 1000, APPROACH_DURATION);
      setElapsed(next);
      if (next < APPROACH_DURATION) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const timer = setTimeout(onComplete, APPROACH_DURATION * 1000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const hudFadeOut = {
    delay: APPROACH_DURATION * 0.55,
    duration: APPROACH_DURATION * 0.2,
    ease: 'easeIn',
  };

  const progress = Math.min(elapsed / APPROACH_DURATION, 1);
  const approachAu = (4.2 - 4.1 * progress).toFixed(2);
  const relativeVelocity = Math.round(18400 - (18400 - 2100) * progress);
  const insertionCountdown = Math.max(0, Math.ceil(APPROACH_DURATION - elapsed));

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

      {/* ── HUD OVERLAY — planet identity reveal ─────────────────── */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        gap: '0.5rem',
      }}>
        {/* Planet name */}
        <motion.div
          initial={{ opacity: 0, letterSpacing: '0.15em' }}
          animate={{ opacity: [0, 1, 1, 0], letterSpacing: ['0.15em', '0.4em', '0.4em', '0.4em'] }}
          transition={{
            times: [0, 0.15, 0.8, 1],
            duration: APPROACH_DURATION * 0.85,
            delay: 0.35,
            ease: 'easeOut',
          }}
          style={{
            fontFamily: 'Comfortaa, sans-serif',
            fontWeight: 700,
            fontSize: 'clamp(2rem, 8vw, 5rem)',
            color: def.chakra,
            textShadow: `0 0 30px ${def.chakra}88, 0 0 80px ${def.chakra}33`,
            lineHeight: 1,
          }}
        >
          {labels.name}
        </motion.div>

        {/* Vault type */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.8, 0.8, 0] }}
          transition={{
            times: [0, 0.15, 0.8, 1],
            duration: APPROACH_DURATION * 0.8,
            delay: 0.65,
            ease: 'easeOut',
          }}
          style={{
            fontFamily: 'Comfortaa, sans-serif',
            fontWeight: 700,
            fontSize: 'clamp(0.625rem, 2vw, 0.875rem)',
            color: '#ffbf00',
            letterSpacing: '0.3em',
          }}
        >
          {labels.vault}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: [0, 0.95, 0.95, 0], y: [8, 0, 0, -4] }}
          transition={{ times: [0, 0.12, 0.85, 1], duration: APPROACH_DURATION, ease: 'easeOut' }}
          style={{
            marginTop: '0.8rem',
            minWidth: '320px',
            padding: '10px 14px',
            border: '1px solid rgba(255,191,0,0.4)',
            background: 'rgba(8,6,2,0.78)',
            fontFamily: 'Space Mono, monospace',
            fontSize: '11px',
            letterSpacing: '0.08em',
            color: 'rgba(255,191,0,0.9)',
            textTransform: 'uppercase',
            lineHeight: 1.6,
          }}
        >
          <div>APPROACH VECTOR: 4.20 AU → {approachAu} AU</div>
          <div>RELATIVE VELOCITY: {relativeVelocity.toLocaleString()} m/s</div>
          <div>ORBIT INSERTION: T-{insertionCountdown}s</div>
        </motion.div>
      </div>

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
