import React, { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

const FLYBY_DURATION = 3.5;

const SLINGSHOT_PLANETS = [
  { color: '#c88860', chakra: '#ffb7b7', size: 0.18, tx: -6.5, ty: -4.0, tz: -4.0 },
  { color: '#3d6844', chakra: '#87ceeb', size: 0.20, tx:  0.0, ty: -7.0, tz: -5.0 },
  { color: '#c09030', chakra: '#ffbf00', size: 0.30, tx:  6.5, ty: -4.0, tz: -3.5 },
  { color: '#7040a0', chakra: '#cc44ff', size: 0.16, tx:  6.0, ty:  4.5, tz: -4.5 },
  { color: '#8098c0', chakra: '#00d4ff', size: 0.12, tx:  0.0, ty:  7.0, tz: -4.0 },
  { color: '#555555', chakra: '#888888', size: 0.14, tx: -6.0, ty:  4.0, tz: -3.0 },
];

// ── CAMERA — rushes from z=12 through system to z=-6 ──────────────────────
function FlybyCamera() {
  useFrame((state) => {
    const t = Math.min(state.clock.getElapsedTime() / FLYBY_DURATION, 1.0);
    const s = t * t * (3 - 2 * t);
    state.camera.position.set(
      Math.sin(t * Math.PI * 0.6) * 1.5,
      Math.cos(t * Math.PI * 0.4) * 0.8,
      THREE.MathUtils.lerp(12, -6, s),
    );
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

// ── BINARY PAIR — Sun + Black Star orbiting barycenter ───────────────────
function BinaryPair() {
  const sunRef = useRef();
  const bsRef = useRef();
  const torusRef = useRef();

  useFrame((state) => {
    const theta = state.clock.getElapsedTime() * 1.4;
    if (sunRef.current) {
      sunRef.current.position.set(
        -0.85 * Math.cos(theta),
        0.1 * Math.sin(theta * 0.3),
        0.85 * Math.sin(theta),
      );
    }
    if (bsRef.current) {
      bsRef.current.position.set(
        1.2 * Math.cos(theta),
        -0.1 * Math.sin(theta * 0.3),
        -1.2 * Math.sin(theta),
      );
    }
    if (torusRef.current) torusRef.current.rotation.z = state.clock.getElapsedTime() * 0.6;
  });

  return (
    <>
      <group ref={sunRef}>
        <pointLight color="#ffea00" intensity={3} distance={18} decay={2} />
        <mesh>
          <sphereGeometry args={[0.42, 32, 32]} />
          <meshStandardMaterial color="#ffea00" emissive="#ffbf00" emissiveIntensity={2.5} roughness={0.2} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.7, 16, 16]} />
          <meshBasicMaterial color="#ff8800" transparent opacity={0.08} side={THREE.BackSide} depthWrite={false} />
        </mesh>
      </group>

      <group ref={bsRef}>
        <mesh>
          <sphereGeometry args={[0.32, 32, 32]} />
          <meshStandardMaterial color="#050505" roughness={1.0} emissiveIntensity={0} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.45, 16, 16]} />
          <meshBasicMaterial color="#8b0000" transparent opacity={0.35} side={THREE.BackSide} depthWrite={false} />
        </mesh>
        <mesh ref={torusRef} rotation={[Math.PI / 2.3, 0, 0]}>
          <torusGeometry args={[0.6, 0.045, 8, 48]} />
          <meshBasicMaterial color="#ffbf00" transparent opacity={0.5} depthWrite={false} />
        </mesh>
      </group>
    </>
  );
}

// ── SLINGSHOT PLANET — launches outward with particle trail behind it ────
function SlingshotPlanet({ def, delay }) {
  const groupRef = useRef();
  const matRef = useRef();
  const historyRef = useRef([]);
  const N_TRAIL = 28;

  const trailGeo = useMemo(() => {
    const positions = new Float32Array(N_TRAIL * 3);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, []);

  useFrame((state) => {
    const elapsed = Math.max(0, state.clock.getElapsedTime() - delay);
    const t = Math.min(elapsed / (FLYBY_DURATION * 0.85), 1.0);
    const s = t * t * (3 - 2 * t);

    const pos = [
      def.tx * s,
      def.ty * s,
      THREE.MathUtils.lerp(0, def.tz, s),
    ];

    if (groupRef.current) {
      groupRef.current.position.set(...pos);
      groupRef.current.rotation.y += 0.025;
    }

    if (matRef.current) {
      matRef.current.opacity = t < 0.55 ? 1 : Math.max(0, 1 - (t - 0.55) / 0.45);
    }

    // Trail history
    historyRef.current.push(pos);
    if (historyRef.current.length > N_TRAIL) historyRef.current.shift();

    const attr = trailGeo.attributes.position;
    const arr = attr.array;
    for (let i = 0; i < N_TRAIL; i++) {
      const h = historyRef.current[Math.max(0, historyRef.current.length - 1 - i)];
      if (h) {
        arr[i * 3] = h[0];
        arr[i * 3 + 1] = h[1];
        arr[i * 3 + 2] = h[2];
      }
    }
    attr.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
      {/* Trailing particle streak */}
      <points geometry={trailGeo}>
        <pointsMaterial
          color={def.chakra} size={0.05} transparent opacity={0.48}
          depthWrite={false} sizeAttenuation
        />
      </points>

      {/* Planet glow */}
      <mesh>
        <sphereGeometry args={[def.size * 2, 12, 12]} />
        <meshBasicMaterial color={def.chakra} transparent opacity={0.055} side={THREE.BackSide} depthWrite={false} />
      </mesh>

      {/* Planet body */}
      <mesh>
        <sphereGeometry args={[def.size, 24, 24]} />
        <meshStandardMaterial
          ref={matRef}
          color={def.color}
          emissive={def.color}
          emissiveIntensity={0.2}
          roughness={0.6}
          transparent
        />
      </mesh>
    </group>
  );
}

function FlybyScene() {
  return (
    <>
      <Stars radius={60} depth={40} count={2000} factor={4} saturation={0.2} fade speed={3} />
      <ambientLight color="#111122" intensity={0.1} />
      <FlybyCamera />
      <BinaryPair />
      {SLINGSHOT_PLANETS.map((def, i) => (
        <SlingshotPlanet key={i} def={def} delay={i * 0.08} />
      ))}
    </>
  );
}

export default function BinaryFlyby({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, FLYBY_DURATION * 1000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <Canvas
      camera={{ position: [0, 0, 12], fov: 60, near: 0.1, far: 200 }}
      style={{ position: 'fixed', inset: 0, zIndex: 100 }}
      gl={{ antialias: true }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 1)}
    >
      <FlybyScene />
    </Canvas>
  );
}

