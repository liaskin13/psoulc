import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// ── BINARY CORE — Sun + Black Star orbiting their barycenter ──────────────
// Viewed through the vault porthole window, always facing the system center.
const OMEGA   = 0.35;  // orbital angular speed (rad/s)
const ORBIT_R = 1.8;   // barycentric separation

function BinaryPair({ onInverseBloom }) {
  const sunRef       = useRef();
  const blackStarRef = useRef();
  const rimRef       = useRef();

  useFrame((state) => {
    const t     = state.clock.getElapsedTime();
    const theta = t * OMEGA;

    if (sunRef.current) {
      sunRef.current.position.set(
        ORBIT_R * Math.cos(theta),
        0.2 * Math.sin(theta * 0.5),   // gentle wobble on y
        ORBIT_R * Math.sin(theta),
      );
    }
    if (blackStarRef.current) {
      blackStarRef.current.position.set(
        -ORBIT_R * Math.cos(theta),
        -0.2 * Math.sin(theta * 0.5),
        -ORBIT_R * Math.sin(theta),
      );
    }
    if (rimRef.current) {
      rimRef.current.position.copy(blackStarRef.current.position);
      rimRef.current.rotation.y += 0.01;
    }
  });

  return (
    <>
      {/* Ambient fill — cold and dark for vault context */}
      <ambientLight color="#1a1030" intensity={0.5} />

      {/* THE SUN — warm point light source */}
      <group ref={sunRef}>
        <pointLight color="#ffea00" intensity={4} distance={20} decay={1.8} />
        <mesh>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial
            color="#ffea00"
            emissive="#ffea00"
            emissiveIntensity={1.0}
            metalness={0}
            roughness={0.4}
          />
        </mesh>
        {/* Outer corona */}
        <mesh scale={1.4}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial
            color="#c5a025"
            transparent
            opacity={0.15}
            emissive="#c5a025"
            emissiveIntensity={0.4}
          />
        </mesh>
      </group>

      {/* THE BLACK STAR — event horizon with rim glow */}
      <group ref={blackStarRef}>
        {/* Absorbing core — darker than black */}
        <mesh>
          <sphereGeometry args={[0.55, 32, 32]} />
          <meshStandardMaterial
            color="#000000"
            emissive="#000000"
            emissiveIntensity={0}
            roughness={0}
            metalness={1}
          />
        </mesh>

        {/* Event horizon rim — deep crimson glow ring */}
        <mesh ref={rimRef} rotation={[Math.PI / 2.5, 0, 0]}>
          <torusGeometry args={[0.65, 0.06, 16, 80]} />
          <meshStandardMaterial
            color="#8B0000"
            emissive="#ff1111"
            emissiveIntensity={0.8}
            transparent
            opacity={0.85}
          />
        </mesh>

        {/* Accretion haze */}
        <mesh scale={1.7}>
          <sphereGeometry args={[0.55, 16, 16]} />
          <meshStandardMaterial
            color="#200010"
            transparent
            opacity={0.25}
            emissive="#500020"
            emissiveIntensity={0.2}
          />
        </mesh>
      </group>

      {/* Starfield backdrop */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={400}
            array={(() => {
              const arr = new Float32Array(400 * 3);
              for (let i = 0; i < 400; i++) {
                arr[i * 3]     = (Math.random() - 0.5) * 40;
                arr[i * 3 + 1] = (Math.random() - 0.5) * 40;
                arr[i * 3 + 2] = (Math.random() - 0.5) * 40;
              }
              return arr;
            })()}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial color="#9090a0" size={0.05} sizeAttenuation />
      </points>

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          intensity={1.8}
          mipmapBlur
          radius={0.9}
        />
      </EffectComposer>
    </>
  );
}

// ── VAULT WINDOW — the Binary Core porthole ───────────────────────────────
// Positioned as a fixed porthole in the vault corner.
// Exposes the DOM element via ref so voids can target the Black Star center.
const VaultWindow = forwardRef(function VaultWindow({
  inverseBloom,
  voidArmed = false,
  armedLabel = 'SELECTED FILE',
  onCancelVoid,
  onConfirmVoid,
}, ref) {
  const containerRef = useRef();

  // Expose the container's getBoundingClientRect so voids can calculate the target
  useImperativeHandle(ref, () => ({
    getBlackStarTarget: () => {
      if (!containerRef.current) return null;
      const rect = containerRef.current.getBoundingClientRect();
      // Black Star is roughly in the left-center of the window at any point in its orbit
      return {
        x: rect.left + rect.width  * 0.38,
        y: rect.top  + rect.height * 0.52,
      };
    },
    getRect: () => containerRef.current?.getBoundingClientRect() ?? null,
  }));

  return (
    <div
      ref={containerRef}
      className={`vault-window-porthole ${inverseBloom ? 'vault-window-inverse-bloom' : ''}`}
      title="Binary Core — Black Star Gravitational Anchor"
    >
      {/* Porthole label */}
      <div className="vault-window-label">
        <span className="vault-window-dot" />
        BINARY CORE
      </div>

      <Canvas
        camera={{ position: [0, 3, 8], fov: 38, near: 0.1, far: 200 }}
        style={{ width: '100%', height: '100%' }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          outputColorSpace: THREE.SRGBColorSpace,
          toneMapping: THREE.ACESFilmicToneMapping,
        }}
        onCreated={({ gl, camera }) => {
          gl.setClearColor(0x020005, 1);
          gl.toneMappingExposure = 1.0;
          camera.lookAt(0, 0, 0);
        }}
      >
        <BinaryPair />
      </Canvas>

      {/* Inverse Bloom — Flash of Darkness on void confirmation */}
      {inverseBloom && (
        <div className="inverse-bloom-flash" />
      )}

      {/* D3-B: Live orbit stays visible while void is armed; operator can cancel safely. */}
      {voidArmed && (
        <div className="vault-void-armed-overlay" role="dialog" aria-live="polite" aria-label="Void confirmation">
          <div className="vault-void-armed-title">VOID ARMED</div>
          <div className="vault-void-armed-file">{armedLabel}</div>
          <div className="vault-void-armed-actions">
            <button className="vault-void-cancel" onClick={onCancelVoid}>CANCEL</button>
            <button className="vault-void-confirm" onClick={onConfirmVoid}>COMMIT</button>
          </div>
        </div>
      )}
    </div>
  );
});

export default VaultWindow;
