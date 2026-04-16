import React, { useRef, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { keplerPos, PLANET_DEFS } from '../utils/kepler';
import { VOID_CHAKRA_COLORS } from '../config';
import PresenceOrbs from '../components/PresenceOrbs';

const PLANETS = PLANET_DEFS;
const DRIFT_RADIUS = 28;
const DRIFT_SPEED  = 0.08; // radians per second

// ── Planet glows + labels visible from drift ─────────────────────────────────
function DriftPlanet({ p, selected, onSelect }) {
  const groupRef = useRef();
  const glowRef  = useRef();
  const chakra   = VOID_CHAKRA_COLORS[p.id] || '#ffbf00';

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime() * 0.3;
    const M = ((2 * Math.PI / p.period) * t) % (Math.PI * 2);
    const [x, z] = keplerPos(p.a, p.e, M);
    groupRef.current.position.set(x, 0, z);

    // selected planet glow pulses
    if (glowRef.current && selected) {
      glowRef.current.material.opacity = 0.12 + Math.sin(clock.getElapsedTime() * 3) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Chakra halo */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[p.size * 2.8, 12, 12]} />
        <meshBasicMaterial color={chakra} transparent opacity={selected ? 0.14 : 0.05} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      {/* Planet body */}
      <mesh
        onClick={(e) => { e.stopPropagation(); onSelect(p.id); }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'default'; }}
      >
        <sphereGeometry args={[p.size, 32, 32]} />
        <meshStandardMaterial color={p.color} emissive={chakra} emissiveIntensity={selected ? 0.35 : 0.1} roughness={0.7} metalness={0.1} />
      </mesh>
      {/* Selection ring */}
      {selected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[p.size * 1.8, 0.04, 4, 48]} />
          <meshBasicMaterial color={chakra} transparent opacity={0.7} />
        </mesh>
      )}
      {/* Label */}
      <Billboard>
        <Text
          position={[0, p.size * 2.4, 0]}
          fontSize={selected ? 1.2 : 0.9}
          color={selected ? chakra : '#f5f1e8'}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.04}
          outlineColor="#1a0a00"
        >
          {p.name}
        </Text>
      </Billboard>
    </group>
  );
}

// ── Drifting camera ───────────────────────────────────────────────────────────
function DriftCamera() {
  useFrame(({ clock, camera }) => {
    const t  = clock.getElapsedTime() * DRIFT_SPEED;
    camera.position.set(Math.cos(t) * DRIFT_RADIUS, 8, Math.sin(t) * DRIFT_RADIUS);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

// ── Exit power-down button ────────────────────────────────────────────────────
function PowerDownBtn({ onPowerDown }) {
  return (
    <button
      onClick={onPowerDown}
      style={{
        position: 'absolute', top: '1.2rem', left: '1.5rem',
        fontFamily: 'Comfortaa, sans-serif', fontWeight: 700,
        fontSize: '0.65rem', letterSpacing: '0.2em',
        color: '#ffbf0088', background: 'transparent', border: 'none',
        cursor: 'pointer', padding: '0.5rem',
      }}
      aria-label="Exit system"
    >
      EXIT SYSTEM
    </button>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────
export default function GalleryDrift({ onVaultSelect, onPowerDown, users = [] }) {
  const [selected, setSelected] = useState('saturn');
  const [fading, setFading]     = useState(false);

  const handleSelect = useCallback((planetId) => {
    setSelected(planetId);
  }, []);

  const handleEnter = useCallback(() => {
    setFading(true);
    setTimeout(() => onVaultSelect(selected), 500);
  }, [selected, onVaultSelect]);

  // Arrow key navigation
  const planetIds = useMemo(() => PLANETS.map(p => p.id), []);
  const handleKey = useCallback((e) => {
    if (e.key === 'ArrowRight') {
      setSelected(prev => {
        const i = planetIds.indexOf(prev);
        return planetIds[(i + 1) % planetIds.length];
      });
    } else if (e.key === 'ArrowLeft') {
      setSelected(prev => {
        const i = planetIds.indexOf(prev);
        return planetIds[(i - 1 + planetIds.length) % planetIds.length];
      });
    } else if (e.key === 'Enter') {
      handleEnter();
    }
  }, [planetIds, handleEnter]);

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: '#000', outline: 'none' }}
      tabIndex={0}
      onKeyDown={handleKey}
      autoFocus
    >
      <Canvas
        camera={{ position: [28, 8, 0], fov: 50, near: 0.1, far: 500 }}
        style={{ position: 'absolute', inset: 0 }}
        gl={{ antialias: true }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 1)}
      >
        <Stars radius={200} depth={80} count={2200} factor={4} saturation={0.08} fade speed={0.2} />
        <ambientLight color="#2a1a08" intensity={0.4} />
        <pointLight color="#ffea00" intensity={1.5} distance={80} position={[0, 0, 0]} />

        {PLANETS.map(p => (
          <DriftPlanet key={p.id} p={p} selected={selected === p.id} onSelect={handleSelect} />
        ))}

        <PresenceOrbs users={users} />
        <DriftCamera />
      </Canvas>

      {/* HUD bar — selected planet info + enter button */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.5rem 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem',
        background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
      }}>
        <div style={{ fontFamily: 'Comfortaa, sans-serif', fontWeight: 700, letterSpacing: '0.25em', fontSize: '0.7rem', color: '#ffbf0066' }}>
          ← →
        </div>
        <div style={{ fontFamily: 'Comfortaa, sans-serif', fontWeight: 700, fontSize: 'clamp(0.9rem, 2.5vw, 1.4rem)', color: VOID_CHAKRA_COLORS[selected], letterSpacing: '0.3em' }}>
          {PLANETS.find(p => p.id === selected)?.name || ''}
        </div>
        <button
          onClick={handleEnter}
          style={{
            fontFamily: 'Comfortaa, sans-serif', fontWeight: 700, fontSize: '0.7rem',
            letterSpacing: '0.25em', color: '#000', background: VOID_CHAKRA_COLORS[selected] || '#ffbf00',
            border: 'none', padding: '0.55rem 1.4rem', cursor: 'pointer', borderRadius: '2px',
          }}
          aria-label={`Enter ${selected} vault`}
        >
          ENTER
        </button>
      </div>

      <PowerDownBtn onPowerDown={onPowerDown} />

      {/* Fade to black on vault entry */}
      <motion.div
        style={{ position: 'absolute', inset: 0, background: '#000', pointerEvents: 'none' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: fading ? 1 : 0 }}
        transition={{ duration: 0.5, ease: 'easeIn' }}
      />
    </div>
  );
}
