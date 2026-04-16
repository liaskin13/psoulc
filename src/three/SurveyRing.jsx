import React, { useRef, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { keplerPos, PLANET_DEFS } from '../utils/kepler';
import { orbitalClock } from '../utils/orbitalClock';
import { VOID_CHAKRA_COLORS } from '../config';
import PresenceOrbs from '../components/PresenceOrbs';

// ── Live planet with orbit ring + selection ───────────────────────────────────
function SurveyPlanet({ p, selected, onSelect }) {
  const groupRef = useRef();
  const meshRef  = useRef();
  const chakra   = VOID_CHAKRA_COLORS[p.id] || '#ffbf00';

  useFrame(() => {
    if (!groupRef.current) return;
    const t = orbitalClock.t;
    const M = ((2 * Math.PI / p.period) * t) % (Math.PI * 2);
    const [x, z] = keplerPos(p.a, p.e, M);
    groupRef.current.position.set(x, 0, z);
    if (meshRef.current) meshRef.current.rotation.y += 0.001;
  });

  return (
    <group ref={groupRef}>
      {/* Selection ring */}
      {selected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[p.size * 2.2, 0.06, 4, 48]} />
          <meshBasicMaterial color={chakra} transparent opacity={0.8} />
        </mesh>
      )}
      {/* Planet body */}
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onSelect(p.id); }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'default'; }}
      >
        <sphereGeometry args={[p.size * (selected ? 1.3 : 1), 32, 32]} />
        <meshStandardMaterial
          color={p.color}
          emissive={chakra}
          emissiveIntensity={selected ? 0.45 : 0.12}
          roughness={0.6} metalness={0.1}
        />
      </mesh>
      {/* Label — always visible from above */}
      <Billboard>
        <Text
          position={[0, p.size * 2.6 * (selected ? 1.3 : 1), 0]}
          fontSize={selected ? 1.4 : 0.9}
          color={selected ? chakra : '#c8b89a'}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.04}
          outlineColor="#000"
        >
          {p.name}
        </Text>
      </Billboard>
    </group>
  );
}

// ── Orbit trace rings (chakra-tinted, viewed from above) ─────────────────────
function OrbitRings() {
  const rings = useMemo(() => PLANET_DEFS.map(p => {
    const pts = [];
    for (let i = 0; i <= 256; i++) {
      const M = (i / 256) * Math.PI * 2;
      const [x, z] = keplerPos(p.a, p.e, M);
      pts.push(new THREE.Vector3(x, 0, z));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({
      color: VOID_CHAKRA_COLORS[p.id] || '#c5a025',
      transparent: true,
      opacity: 0.2,
    });
    return new THREE.Line(geo, mat);
  }), []);

  return <>{rings.map((line, i) => <primitive key={i} object={line} />)}</>;
}

// ── Slowly rotating survey camera ────────────────────────────────────────────
function SurveyCamera() {
  useFrame(({ clock, camera }) => {
    const rot = clock.getElapsedTime() * 0.04;
    camera.position.set(Math.sin(rot) * 30, 110, Math.cos(rot) * 40);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

// ── Export ────────────────────────────────────────────────────────────────────
export default function SurveyRing({ onVaultSelect, onPowerDown, users = [] }) {
  const planetIds = useMemo(() => PLANET_DEFS.map(p => p.id), []);
  const [selected, setSelected] = useState('saturn');
  const [fading, setFading]     = useState(false);

  const handleSelect = useCallback((id) => setSelected(id), []);

  const handleEnter = useCallback(() => {
    setFading(true);
    setTimeout(() => onVaultSelect(selected), 500);
  }, [selected, onVaultSelect]);

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
        camera={{ position: [0, 110, 40], fov: 42, near: 0.1, far: 600 }}
        style={{ position: 'absolute', inset: 0 }}
        gl={{ antialias: true }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 1)}
      >
        <Stars radius={250} depth={80} count={2000} factor={3.5} saturation={0.06} fade speed={0.1} />
        <ambientLight color="#1a1208" intensity={0.5} />
        <pointLight color="#ffea00" intensity={2} distance={120} position={[0, 0, 0]} />

        <OrbitRings />

        {PLANET_DEFS.map(p => (
          <SurveyPlanet key={p.id} p={p} selected={selected === p.id} onSelect={handleSelect} />
        ))}

        <PresenceOrbs users={users} />
        <SurveyCamera />
      </Canvas>

      {/* HUD bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.5rem 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem',
        background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
      }}>
        <div style={{ fontFamily: 'Comfortaa, sans-serif', fontWeight: 700, letterSpacing: '0.25em', fontSize: '0.7rem', color: '#ffbf0055' }}>
          ← →
        </div>
        <div style={{
          fontFamily: 'Comfortaa, sans-serif', fontWeight: 700,
          fontSize: 'clamp(0.9rem, 2.5vw, 1.4rem)',
          color: VOID_CHAKRA_COLORS[selected] || '#ffbf00', letterSpacing: '0.3em',
        }}>
          {PLANET_DEFS.find(p => p.id === selected)?.name || ''}
        </div>
        <button
          onClick={handleEnter}
          style={{
            fontFamily: 'Comfortaa, sans-serif', fontWeight: 700, fontSize: '0.7rem',
            letterSpacing: '0.25em', color: '#000',
            background: VOID_CHAKRA_COLORS[selected] || '#ffbf00',
            border: 'none', padding: '0.55rem 1.4rem', cursor: 'pointer', borderRadius: '2px',
          }}
          aria-label={`Enter ${selected} vault`}
        >
          ENTER
        </button>
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
