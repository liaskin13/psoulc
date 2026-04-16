import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { keplerPos, PLANET_DEFS } from '../utils/kepler';
import { orbitalClock } from '../utils/orbitalClock';
import { VOID_CHAKRA_COLORS, MOON_PREFIX } from '../config';
import { useSystem } from '../state/SystemContext';
import PresenceOrbs from '../components/PresenceOrbs';

const SATURN_DEF = PLANET_DEFS.find(p => p.id === 'saturn');
const MOON_RADII = [1.6, 2.2, 2.8, 3.5]; // orbit radii relative to Saturn

// ── Saturn rendered up close ──────────────────────────────────────────────────
function SaturnClose() {
  const meshRef = useRef();
  useFrame(() => { if (meshRef.current) meshRef.current.rotation.y += 0.001; });

  return (
    <group position={[0, 0, 0]}>
      {/* Planet body */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[SATURN_DEF.size * 3.5, 64, 64]} />
        <meshStandardMaterial color="#9d8b7a" emissive="#3a2a10" emissiveIntensity={0.2} roughness={0.7} metalness={0.3} />
      </mesh>
      {/* Rings — 2 bands */}
      <mesh rotation={[1.4, 0, 0.25]}>
        <torusGeometry args={[SATURN_DEF.size * 5.5, SATURN_DEF.size * 0.4, 3, 120]} />
        <meshBasicMaterial color="#c8a040" transparent opacity={0.75} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh rotation={[1.4, 0, 0.25]}>
        <torusGeometry args={[SATURN_DEF.size * 7.2, SATURN_DEF.size * 0.18, 3, 120]} />
        <meshBasicMaterial color="#9a7830" transparent opacity={0.45} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* Ambient violet glow */}
      <mesh>
        <sphereGeometry args={[SATURN_DEF.size * 4.8, 16, 16]} />
        <meshBasicMaterial color="#9b59b6" transparent opacity={0.04} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      <pointLight color="#9b59b6" intensity={0.5} distance={25} position={[0, 2, 0]} />
    </group>
  );
}

// ── A single moon orb orbiting Saturn ────────────────────────────────────────
function MoonOrb({ moon, index, isOwn, onSelect, selected }) {
  const ref   = useRef();
  const color = '#6600cc';
  const speed = 0.18 + index * 0.07;
  const r     = MOON_RADII[index % MOON_RADII.length];
  const name  = moon.planet.replace(MOON_PREFIX, '').toUpperCase();

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * speed;
    ref.current.position.set(Math.cos(t) * r * 3.5, Math.sin(t * 0.3) * 0.6, Math.sin(t) * r * 3.5);
  });

  return (
    <group ref={ref}>
      {/* Glow shell — brighter for own moon */}
      <mesh>
        <sphereGeometry args={[0.22 * (isOwn ? 2.2 : 1.4), 10, 10]} />
        <meshBasicMaterial color={color} transparent opacity={isOwn ? 0.14 : 0.05} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      {/* Tier C double-corona for own moon */}
      {isOwn && (
        <MoonPulseRing color={color} radius={0.5} />
      )}
      {/* Body */}
      <mesh
        onClick={(e) => { e.stopPropagation(); onSelect(moon.planet); }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'default'; }}
      >
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial emissive={color} emissiveIntensity={isOwn ? 2.8 : 1.4} color={color} roughness={0.2} />
      </mesh>
      {/* Name label */}
      <Billboard>
        <Text
          position={[0, 0.45, 0]}
          fontSize={isOwn ? 0.35 : 0.25}
          color={isOwn ? color : '#c0a8e0'}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor="#000"
        >
          {name}
        </Text>
      </Billboard>
    </group>
  );
}

// Pulsing outer ring for the owned moon
function MoonPulseRing({ color, radius }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) ref.current.material.opacity = 0.08 + Math.sin(clock.getElapsedTime() * 2.5) * 0.05;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[radius, 8, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.1} side={THREE.BackSide} depthWrite={false} />
    </mesh>
  );
}

// ── Inner planets visible as dots in the distance ────────────────────────────
function DistantPlanet({ p, onSelect }) {
  const ref    = useRef();
  const chakra = VOID_CHAKRA_COLORS[p.id] || '#ffbf00';

  useFrame(() => {
    if (!ref.current) return;
    const t = orbitalClock.t;
    const M = ((2 * Math.PI / p.period) * t) % (Math.PI * 2);
    const [x, z] = keplerPos(p.a, p.e, M);
    // Offset so Saturn center maps to scene origin; scale down
    ref.current.position.set((x - SATURN_DEF.a) * 0.7, 0, z * 0.7);
  });

  return (
    <group ref={ref}>
      <mesh
        onClick={(e) => { e.stopPropagation(); onSelect(p.id); }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'default'; }}
      >
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshStandardMaterial emissive={chakra} emissiveIntensity={0.8} color={chakra} roughness={0.5} />
      </mesh>
    </group>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────
export default function SaturnAtrium({ sessionMeta, onVaultSelect, onPowerDown, users = [] }) {
  const { members: ctxMembers = [] } = useSystem();
  const members  = ctxMembers;
  const moonMembers = useMemo(
    () => members.filter(m => m.tier === 'C' && m.planet?.startsWith(MOON_PREFIX)),
    [members]
  );
  const innerPlanets = useMemo(
    () => PLANET_DEFS.filter(p => p.id !== 'saturn' && p.id !== 'amethyst'),
    []
  );

  const [selected, setSelected] = useState(sessionMeta?.planet || null);
  const [fading, setFading]     = useState(false);

  const handleSelect = useCallback((id) => setSelected(id), []);

  const handleEnter = useCallback(() => {
    if (!selected) return;
    setFading(true);
    setTimeout(() => onVaultSelect(selected), 500);
  }, [selected, onVaultSelect]);

  useEffect(() => {
    // Tier C: zero search friction. On entry, auto-flow directly to own moon vault.
    if (sessionMeta?.tier !== 'C') return;
    if (!sessionMeta?.planet || !sessionMeta.planet.startsWith(MOON_PREFIX)) return;
    const id = setTimeout(() => {
      setSelected(sessionMeta.planet);
      setFading(true);
      onVaultSelect(sessionMeta.planet);
    }, 450);
    return () => clearTimeout(id);
  }, [sessionMeta, onVaultSelect]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000' }}>
      <Canvas
        camera={{ position: [45, 22, 45], fov: 48, near: 0.1, far: 400 }}
        style={{ position: 'absolute', inset: 0 }}
        gl={{ antialias: true }}
        onCreated={({ gl, camera }) => { gl.setClearColor(0x000000, 1); camera.lookAt(0, 0, 0); }}
      >
        <Stars radius={200} depth={80} count={2000} factor={4} saturation={0.1} fade speed={0.15} />
        <ambientLight color="#1a0a2a" intensity={0.35} />

        <SaturnClose />

        {moonMembers.map((moon, i) => (
          <MoonOrb
            key={moon.id}
            moon={moon}
            index={i}
            isOwn={sessionMeta?.planet === moon.planet}
            onSelect={handleSelect}
            selected={selected === moon.planet}
          />
        ))}

        {innerPlanets.map(p => (
          <DistantPlanet key={p.id} p={p} onSelect={handleSelect} />
        ))}

        <PresenceOrbs users={users} />
      </Canvas>

      {/* HUD */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.5rem 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem',
        background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
      }}>
        <div style={{
          fontFamily: 'Comfortaa, sans-serif', fontWeight: 700,
          fontSize: 'clamp(0.9rem, 2.5vw, 1.4rem)',
          color: selected ? '#6600cc' : '#ffbf0044', letterSpacing: '0.3em',
        }}>
          {selected
            ? selected.startsWith(MOON_PREFIX) ? selected.replace(MOON_PREFIX, '').toUpperCase() : selected.toUpperCase()
            : 'SELECT A MOON'}
        </div>
        {selected && (
          <button
            onClick={handleEnter}
            style={{
              fontFamily: 'Comfortaa, sans-serif', fontWeight: 700, fontSize: '0.7rem',
              letterSpacing: '0.25em', color: '#fff', background: '#6600cc',
              border: 'none', padding: '0.55rem 1.4rem', cursor: 'pointer', borderRadius: '2px',
            }}
          >
            ENTER
          </button>
        )}
      </div>

      <button
        onClick={onPowerDown}
        style={{
          position: 'absolute', top: '1.2rem', left: '1.5rem',
          fontFamily: 'Comfortaa, sans-serif', fontWeight: 700,
          fontSize: '0.65rem', letterSpacing: '0.2em',
          color: '#ffbf0066', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem',
        }}
      >
        EXIT SYSTEM
      </button>

      <motion.div
        style={{ position: 'absolute', inset: 0, background: '#000', pointerEvents: 'none' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: fading ? 1 : 0 }}
        transition={{ duration: 0.5, ease: 'easeIn' }}
      />
    </div>
  );
}
