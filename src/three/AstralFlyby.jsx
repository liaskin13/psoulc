import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { VOID_CHAKRA_COLORS } from '../config';
import PresenceOrbs from '../components/PresenceOrbs';
import { usePresence } from '../hooks/usePresence';

const DURATION_SLINGSHOT = 5.5; // Tier A + B-planet
const DURATION_DRIFT     = 4.5; // Tier C, G, B-no-planet

// ── Destination resolution ────────────────────────────────────────────────────
function resolveDestination(sessionMeta, owner) {
  if (!sessionMeta || sessionMeta.tier === 'G') return 'gallery-drift';
  if (owner === 'D' || (sessionMeta.tier === 'A' && owner !== 'L')) return 'ignition';
  if (owner === 'L' || sessionMeta.tier === 'A') return 'architect';
  if (sessionMeta.tier === 'C') return 'saturn-atrium';
  if (sessionMeta.tier === 'B' && sessionMeta.planet) return sessionMeta.planet;
  return 'survey-ring';
}

function isOuterDest(dest) {
  return dest === 'saturn' || dest === 'amethyst' || dest === 'saturn-atrium';
}

// ── CatmullRom path ───────────────────────────────────────────────────────────
function buildPath(dest) {
  const outer = isOuterDest(dest);
  const sz    = outer ? -1 : 1;   // Z-sign of origin side

  const TERMINI = {
    ignition:        [new THREE.Vector3(2, 2, -6),   new THREE.Vector3(0, 0, -18)],
    architect:       [new THREE.Vector3(-9, 3, -14), new THREE.Vector3(-20, 5, -28)],
    'survey-ring':   [new THREE.Vector3(0, 60, 65),  new THREE.Vector3(0, 110, 40)],
    'saturn-atrium': [new THREE.Vector3(30, 14, 30), new THREE.Vector3(45, 22, 45)],
    'gallery-drift': [new THREE.Vector3(0, 18, 42),  new THREE.Vector3(0, 25, 55)],
    saturn:          [new THREE.Vector3(20, 4, 20),  new THREE.Vector3(32, 2, 0)],
    mercury:         [new THREE.Vector3(0, 2, 10),   new THREE.Vector3(0, 0, 5)],
    venus:           [new THREE.Vector3(10, 3, 14),  new THREE.Vector3(18, 1, 0)],
    earth:           [new THREE.Vector3(14, 3, 18),  new THREE.Vector3(24, 1, 0)],
    mars:            [new THREE.Vector3(16, 3, 20),  new THREE.Vector3(28, 1, 0)],
    amethyst:        [new THREE.Vector3(25, 6, 32),  new THREE.Vector3(42, 2, 0)],
  };

  const [t4, t5] = TERMINI[dest] || TERMINI['gallery-drift'];

  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(8,        15,  sz * 82),   // outermost opposite
    new THREE.Vector3(sz * -30, 22,  sz * 50),   // wide arc
    new THREE.Vector3(sz * -14,  8,  sz * 20),   // descend
    new THREE.Vector3(0,         6,  0),          // binary core flyby
    t4,
    t5,
  ], false, 'catmullrom', 0.5);
}

// ── HUD labels ────────────────────────────────────────────────────────────────
const HUD = {
  ignition:        { name: 'THE SUN',       sub: 'GOD MODE CONSOLE' },
  architect:       { name: 'THE BLACK STAR',sub: 'ARCHITECT CONSOLE' },
  'survey-ring':   { name: 'THE SYSTEM',    sub: 'COLLECTIVE SURVEY' },
  'saturn-atrium': { name: 'SATURN',        sub: 'CRYSTAL MOONS' },
  'gallery-drift': { name: 'THE FREQUENCY', sub: 'OPEN ARCHIVE' },
  saturn:          { name: 'SATURN',        sub: 'ORIGINAL MUSIC' },
  mercury:         { name: 'MERCURY',       sub: 'LIVE SETS · STREAMING' },
  venus:           { name: 'VENUS',         sub: 'CURATED MIXES' },
  earth:           { name: 'EARTH',         sub: 'SONIC ARCHITECTURE' },
  mars:            { name: 'MARS',          sub: 'SONIC ARCHIVES' },
  amethyst:        { name: 'AMETHYST',      sub: 'CRYSTAL VAULT' },
};

function soulColor(tier, planet) {
  if (tier === 'A') return '#ffe8a0';
  if (tier === 'C') return '#cc88ff';
  if (tier === 'G') return '#c8c8c8';
  return VOID_CHAKRA_COLORS[planet] || '#ffbf00';
}

// ── Binary Core (Sun + Black Star) ───────────────────────────────────────────
function BinaryCore() {
  const sunRef = useRef();
  const bsRef  = useRef();

  useFrame(({ clock }) => {
    const θ = clock.getElapsedTime() * 1.4;
    sunRef.current?.position.set(-0.85 * Math.cos(θ), 0,  0.85 * Math.sin(θ));
    bsRef.current?.position.set( 1.2  * Math.cos(θ), 0, -1.2  * Math.sin(θ));
  });

  return (
    <group>
      <pointLight color="#ffea00" intensity={3} distance={35} decay={1.5} />
      <mesh ref={sunRef}>
        <sphereGeometry args={[0.42, 16, 16]} />
        <meshStandardMaterial color="#ffdd44" emissive="#ff8800" emissiveIntensity={1.8} />
      </mesh>
      <mesh ref={bsRef}>
        <sphereGeometry args={[0.32, 16, 16]} />
        <meshStandardMaterial color="#0a0a0a" emissive="#330000" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}

// ── Particle wake trail ───────────────────────────────────────────────────────
function WakeTrail() {
  const pointsRef = useRef();
  const buf       = useRef(new Float32Array(60 * 3));

  useFrame(({ camera }) => {
    const arr = buf.current;
    arr.copyWithin(3, 0, arr.length - 3);
    arr[0] = camera.position.x + (Math.random() - 0.5) * 0.4;
    arr[1] = camera.position.y + (Math.random() - 0.5) * 0.4;
    arr[2] = camera.position.z + (Math.random() - 0.5) * 0.4;
    if (pointsRef.current) {
      pointsRef.current.geometry.attributes.position.array.set(arr);
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(60 * 3), 3));
    return g;
  }, []);

  return (
    <points ref={pointsRef} geometry={geo}>
      <pointsMaterial color="#ffe8a0" size={0.1} transparent opacity={0.3} sizeAttenuation depthWrite={false} />
    </points>
  );
}

// ── Camera + soul-light driver ────────────────────────────────────────────────
function AstralCamera({ curve, duration, onDone, mouseRef, soulRef }) {
  const { camera } = useThree();
  const tRef       = useRef(0);
  const done       = useRef(false);

  useFrame((_, delta) => {
    if (done.current) return;
    tRef.current  = Math.min(tRef.current + delta / duration, 1);
    const t       = tRef.current;
    const camPos  = curve.getPoint(t);
    const mx      = mouseRef.current.x;
    const my      = mouseRef.current.y;
    const inf     = 1 - t * 0.75; // mouse influence fades near destination

    camera.position.set(camPos.x + mx * 0.7 * inf, camPos.y + my * 0.4 * inf, camPos.z);

    // Soul-light: slightly ahead on path + full mouse offset
    const soulT = Math.min(t + 0.06, 1);
    const sp    = curve.getPoint(soulT);
    const soulPos = new THREE.Vector3(sp.x + mx * 2.0 * inf, sp.y + my * 1.5 * inf, sp.z);
    soulRef.current?.position.copy(soulPos);
    camera.lookAt(soulPos);

    if (t >= 1 && !done.current) { done.current = true; onDone(); }
  });

  return null;
}

// ── Export ────────────────────────────────────────────────────────────────────
export default function AstralFlyby({ sessionMeta, owner, onComplete }) {
  const dest     = useMemo(() => resolveDestination(sessionMeta, owner), [sessionMeta, owner]);
  const curve    = useMemo(() => buildPath(dest), [dest]);
  const isSling  = dest === 'ignition' || dest === 'architect' ||
                   (sessionMeta?.tier === 'B' && !!sessionMeta?.planet);
  const duration = isSling ? DURATION_SLINGSHOT : DURATION_DRIFT;
  const label    = HUD[dest] || HUD['gallery-drift'];
  const color    = soulColor(sessionMeta?.tier, sessionMeta?.planet);

  const mouseRef = useRef({ x: 0, y: 0 });
  const soulRef  = useRef();
  const [showHUD, setShowHUD] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  const handleMouseMove = useCallback((e) => {
    mouseRef.current = {
      x:  (e.clientX / window.innerWidth  - 0.5) * 2,
      y: -(e.clientY / window.innerHeight - 0.5) * 2,
    };
  }, []);

  const handleTouchMove = useCallback((e) => {
    const t = e.touches[0];
    mouseRef.current = {
      x:  (t.clientX / window.innerWidth  - 0.5) * 2,
      y: -(t.clientY / window.innerHeight - 0.5) * 2,
    };
  }, []);

  useEffect(() => {
    const hudTimer  = setTimeout(() => setShowHUD(true), duration * 600);
    const fadeTimer = setTimeout(() => setFadeOut(true),  duration * 880);
    return () => { clearTimeout(hudTimer); clearTimeout(fadeTimer); };
  }, [duration]);

  const onDone = useCallback(() => {
    setTimeout(() => onComplete(dest), 450);
  }, [dest, onComplete]);

  const onlineUsers = usePresence(sessionMeta);

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#000' }}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
    >
      <Canvas
        camera={{ position: [8, 15, 82], fov: 60, near: 0.1, far: 300 }}
        style={{ position: 'absolute', inset: 0 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 1)}
      >
        <Stars radius={180} depth={80} count={2500} factor={4} saturation={0.1} fade speed={0.4} />
        <ambientLight color="#080814" intensity={0.3} />
        <BinaryCore />

        {/* Soul-light — the user's astral guide */}
        <group ref={soulRef}>
          <mesh>
            <icosahedronGeometry args={[0.16, 1]} />
            <meshStandardMaterial emissive={color} emissiveIntensity={3} color={color} roughness={0} />
          </mesh>
          <pointLight color={color} intensity={1.2} distance={14} decay={2} />
        </group>

        <WakeTrail />
        <PresenceOrbs users={onlineUsers} />

        <AstralCamera
          curve={curve}
          duration={duration}
          onDone={onDone}
          mouseRef={mouseRef}
          soulRef={soulRef}
        />
      </Canvas>

      {/* Chromatic warp — peaks at mid-journey */}
      <motion.div
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backdropFilter: 'hue-rotate(15deg) saturate(1.4)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 0.85, 0.85, 0] }}
        transition={{ duration, times: [0, 0.2, 0.45, 0.7, 0.88], ease: 'linear' }}
      />

      {/* HUD — destination name */}
      <AnimatePresence>
        {showHUD && !fadeOut && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55 }}
            style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', gap: '0.5rem',
            }}
          >
            <div style={{
              fontFamily: 'Comfortaa, sans-serif', fontWeight: 700,
              fontSize: 'clamp(1.8rem, 7vw, 4.5rem)',
              color, letterSpacing: '0.35em', lineHeight: 1,
              textShadow: `0 0 30px ${color}88, 0 0 80px ${color}33`,
            }}>
              {label.name}
            </div>
            <div style={{
              fontFamily: 'Comfortaa, sans-serif', fontWeight: 700,
              fontSize: 'clamp(0.55rem, 1.6vw, 0.8rem)',
              color: '#ffbf00', letterSpacing: '0.28em', opacity: 0.8,
            }}>
              {label.sub}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Black fade-out */}
      <motion.div
        style={{ position: 'absolute', inset: 0, background: '#000', pointerEvents: 'none' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: fadeOut ? 1 : 0 }}
        transition={{ duration: 0.5, ease: 'easeIn' }}
      />
    </div>
  );
}
