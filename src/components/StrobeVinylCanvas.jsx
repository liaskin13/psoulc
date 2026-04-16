import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ── STROBE VINYL SHADER ────────────────────────────────────────────────────
// Simulates 70s film capture of spinning vinyl under a stroboscopic light.
// The shutter fires at BPM-synced intervals, creating authentic frame-aliasing
// moiré patterns that blur() cannot replicate.
//
// uniforms:
//   uTime     — elapsed seconds
//   uBPM      — track BPM (drives rotation speed + shutter frequency)
//   uPitch    — pitch multiplier from varispeed (affects both)

const VINYL_VERT = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const VINYL_FRAG = /* glsl */`
  precision highp float;
  uniform float uTime;
  uniform float uBPM;
  uniform float uPitch;
  varying vec2 vUv;

  // Smooth HSV to RGB
  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  void main() {
    // Center the UV
    vec2 uv = vUv - 0.5;
    float r  = length(uv);
    float theta = atan(uv.y, uv.x);

    // ── Record spin: BPM → RPM → rad/sec ────────────────────
    // 33⅓ RPM = one rotation every 1.8s. Scale by BPM ratio.
    float rps      = (uBPM * uPitch / 60.0) * (1.0 / 33.333);
    float rotation = uTime * rps * 6.2831853; // radians per second
    float rotTheta = theta + rotation;

    // ── 70s Stroboscopic Shutter ─────────────────────────────
    // Shutter fires at 1× BPM rate. When closed, vinyl goes near-black.
    // shutterOpen = 0.62 → shutter is open for 62% of each BPM cycle.
    float shutterHz    = uBPM * uPitch / 60.0;
    float shutterPhase = fract(uTime * shutterHz);
    float shutterOpen  = 0.62;
    float strobe       = step(shutterPhase, shutterOpen);

    // ── Vinyl record surface ──────────────────────────────────
    // Grooves: concentric rings with micro-shimmer
    float groove = fract(r * 40.0);
    float grooveShin  = smoothstep(0.05, 0.0, groove) + smoothstep(0.9, 1.0, groove);

    // Groove reflection — warm amber glint, direction-dependent
    float glintAngle = mod(rotTheta, 6.2831853);
    float glint = pow(max(0.0, cos(glintAngle * 12.0)), 18.0) * grooveShin;

    // Base vinyl color — very dark with warm tint
    vec3 vinylBase = vec3(0.04, 0.035, 0.032);
    vinylBase += glint * vec3(0.18, 0.13, 0.06);  // amber groove shimmer

    // ── Label area (inner circle r < 0.20) ───────────────────
    // Amber/gold color with radial stripe pattern
    float isLabel    = 1.0 - step(0.21, r);
    float labelStripe = step(0.5, fract(rotTheta * 4.0 / 6.2831853));  // 4 stripes
    vec3 labelAmber   = vec3(0.78, 0.50, 0.08);
    vec3 labelDark    = vec3(0.45, 0.28, 0.04);
    vec3 labelColor   = mix(labelDark, labelAmber, labelStripe * 0.4 + 0.6);

    // Spindle hole
    float isSpindle  = step(r, 0.04);

    // ── Assemble final color ──────────────────────────────────
    vec3 color = mix(vinylBase, labelColor, isLabel);
    color      = mix(color, vec3(0.0), isSpindle);

    // Apply stroboscopic shutter
    // When closed (strobe=0): record drops to ~8% brightness (still visible as dark disc)
    color = mix(color * 0.08, color, strobe);

    // Honey Amber point light — rim highlight at top-left
    float rimAngle = mod(theta - 2.4, 6.2831853);
    float rim = pow(max(0.0, 1.0 - abs(rimAngle - 3.14159) / 2.5), 2.5) * (1.0 - r);
    color += rim * vec3(0.22, 0.14, 0.03) * strobe;

    // Record boundary — sharp edge at r=0.49
    float isRecord = 1.0 - step(0.49, r);
    float alpha    = isRecord;

    gl_FragColor = vec4(color, alpha);
  }
`;

// ── The Three.js spinning disc with the shader ────────────────────────────
function StrobeDisk({ bpm, pitchMultiplier }) {
  const matRef = useRef();

  const uniforms = useRef({
    uTime:  { value: 0 },
    uBPM:   { value: bpm || 98 },
    uPitch: { value: pitchMultiplier || 1.0 },
  });

  useFrame((state) => {
    uniforms.current.uTime.value  = state.clock.getElapsedTime();
    uniforms.current.uBPM.value   = bpm || 98;
    uniforms.current.uPitch.value = pitchMultiplier || 1.0;
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      {/* Flat disc — segments high enough to look round */}
      <cylinderGeometry args={[1, 1, 0.04, 128, 1]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={VINYL_VERT}
        fragmentShader={VINYL_FRAG}
        uniforms={uniforms.current}
        transparent
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

// ── Export: drop-in Three.js canvas for the strobe vinyl visual ────────────
// Props:
//   bpm             — track BPM
//   pitchMultiplier — varispeed ratio (default 1.0)
//   size            — canvas pixel size (square, default 160)
//   chakraColor     — hex color for ownership soul-chakra overlay (optional)
function StrobeVinylCanvas({ bpm = 98, pitchMultiplier = 1.0, size = 160, chakraColor = null }) {
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <Canvas
        style={{ width: size, height: size, pointerEvents: 'none' }}
        camera={{ position: [0, 1.8, 0], fov: 45, near: 0.01, far: 10 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        onCreated={({ gl, camera }) => {
          gl.setClearColor(0x000000, 0);
          camera.lookAt(0, 0, 0);
        }}
      >
        {/* Honey Amber key light — upper-left, 70s studio lamp position */}
        <pointLight
          position={[-1.2, 2.5, 0.5]}
          color="#d4830a"
          intensity={3.5}
          distance={8}
          decay={1.5}
        />
        <ambientLight color="#200e00" intensity={0.4} />

        <StrobeDisk bpm={bpm} pitchMultiplier={pitchMultiplier} />
      </Canvas>

      {/* Soul-chakra color tint — ownership language overlay.
          mix-blend-mode: screen lets the vinyl grooves show through
          while the chakra hue bleeds into the label area. */}
      {chakraColor && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: chakraColor,
            opacity: 0.22,
            mixBlendMode: 'screen',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}

export default StrobeVinylCanvas;
