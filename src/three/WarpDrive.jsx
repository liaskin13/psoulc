import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

// ── WARP FIELD — Radial streaks toward camera ──────────────────────────────
function WarpStreaks() {
  const linesRef = useRef();

  const geometry = useMemo(() => {
    const lines = [];
    const N = 180; // radial lines
    for (let i = 0; i < N; i++) {
      const angle = (i / N) * Math.PI * 2;
      const line = [];

      // Create line stretching from far (z=100) to camera (z=0)
      for (let z = 100; z >= 0; z -= 5) {
        const r = (z / 100) * 12; // Radial expansion as it approaches
        line.push(
          new THREE.Vector3(
            Math.cos(angle) * r,
            Math.sin(angle) * r,
            -z
          )
        );
      }
      lines.push(...line);
    }

    const positions = new Float32Array(lines.length * 3);
    lines.forEach((p, i) => {
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame((state) => {
    if (linesRef.current) {
      linesRef.current.rotation.z += 0.0008;
    }
  });

  return (
    <lineSegments ref={linesRef} geometry={geometry}>
      <lineBasicMaterial
        color="#4466ff"
        transparent
        opacity={0.35}
        depthWrite={false}
        fog={false}
        linewidth={1}
      />
    </lineSegments>
  );
}

// ── GLOW PARTICLES — Violet/blue miracle tone ─────────────────────────────
function GlowParticles() {
  const geo = useMemo(() => {
    const N = 2000;
    const positions = new Float32Array(N * 3);
    const colors = new Float32Array(N * 3);

    const palette = [
      new THREE.Color('#4488ff'), // cyan
      new THREE.Color('#6644ff'), // violet
      new THREE.Color('#0066ff'), // deep blue
    ];

    for (let i = 0; i < N; i++) {
      // Radial distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 25 + Math.random() * 35;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi) - 15;

      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return g;
  }, []);

  return (
    <points geometry={geo}>
      <pointsMaterial
        size={0.15}
        transparent
        opacity={0.65}
        depthWrite={false}
        sizeAttenuation
        vertexColors
      />
    </points>
  );
}

// ── SCENE ──────────────────────────────────────────────────────────────────
function WarpScene() {
  return (
    <>
      <Stars radius={200} depth={100} count={8000} factor={6} saturation={0.08} fade speed={0.5} />
      <ambientLight color="#001144" intensity={0.15} />
      <WarpStreaks />
      <GlowParticles />
    </>
  );
}

// ── EXPORT ───────────────────────────────────────────────────────────────
export default function WarpDrive() {
  return (
    <Canvas
      camera={{ position: [0, 0, 0], fov: 75, near: 0.1, far: 500 }}
      style={{ position: 'fixed', inset: 0, zIndex: 0 }}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
      }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 1)}
    >
      <WarpScene />
    </Canvas>
  );
}
