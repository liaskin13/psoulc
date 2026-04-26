import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { VOID_CHAKRA_COLORS } from '../config';

// ── Deterministic hash helpers ────────────────────────────────────────────────
function fracHash(owner, salt = 0) {
  let h = salt;
  for (let i = 0; i < owner.length; i++) {
    h = (h * 31 + owner.charCodeAt(i)) >>> 0;
  }
  return (h % 10000) / 10000;
}

// Stable home position for each user — spread across mid-system space
function homePos(owner) {
  const angle  = fracHash(owner, 0) * Math.PI * 2;
  const radius = 15 + fracHash(owner, 42) * 22; // 15–37 units from core
  const height = (fracHash(owner, 99) - 0.5) * 12; // ±6 units vertical
  return [Math.cos(angle) * radius, height, Math.sin(angle) * radius];
}

function orbColor(user) {
  if (user.tier === 'A') return '#ffe8a0';
  if (user.tier === 'C') return '#6600cc';
  if (user.tier === 'G') return '#b0b0b0';
  return VOID_CHAKRA_COLORS[user.planet] || '#ffbf00';
}

function orbRadius(user) {
  if (user.tier === 'A') return 0.30;
  if (user.tier === 'C') return 0.25;
  if (user.tier === 'G') return 0.13;
  return 0.20;
}

// ── Single orb mesh ───────────────────────────────────────────────────────────
function OrbMesh({ user }) {
  const groupRef = useRef();
  const [bx, by, bz] = useMemo(() => homePos(user.owner), [user.owner]);
  const color   = useMemo(() => orbColor(user), [user.tier, user.planet]);
  const r       = orbRadius(user);
  const seed    = useMemo(() => fracHash(user.owner, 7) * Math.PI * 2, [user.owner]);
  const arcR    = useMemo(() => 4 + fracHash(user.owner, 13) * 7, [user.owner]);
  const arcSpd  = useMemo(() => 0.08 + fracHash(user.owner, 21) * 0.15, [user.owner]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    const g = groupRef.current;

    switch (user.behavior) {
      case 'float':
        g.position.set(bx, by + Math.sin(t * 0.55 + seed) * 0.9, bz);
        break;
      case 'fly': {
        const a = t * arcSpd + seed;
        g.position.set(bx + Math.cos(a) * arcR, by + Math.sin(a * 0.45) * 3, bz + Math.sin(a) * arcR);
        break;
      }
      case 'jump': {
        const cycle = t % 3;
        const y = cycle < 1.2 ? Math.sin((cycle / 1.2) * Math.PI) * 4 : 0;
        g.position.set(bx, by + y, bz);
        break;
      }
      case 'vibe':
        g.position.set(
          bx + Math.sin(t * 12 + seed) * 0.22,
          by + Math.sin(t * 11 + seed * 1.3) * 0.22,
          bz + Math.sin(t * 13 + seed * 0.7) * 0.22,
        );
        break;
      default:
        g.position.set(bx, by, bz);
    }
  });

  const coronaScale = user.tier === 'A' ? 3.5 : user.tier === 'C' ? 3.0 : 2.0;

  return (
    <group ref={groupRef}>
      {/* Main orb body */}
      <mesh>
        <sphereGeometry args={[r, 16, 16]} />
        <meshStandardMaterial emissive={color} emissiveIntensity={2.2} color={color} roughness={0.25} metalness={0.1} />
      </mesh>

      {/* Inner corona (all except Tier G) */}
      {user.tier !== 'G' && (
        <mesh>
          <sphereGeometry args={[r * coronaScale, 10, 10]} />
          <meshBasicMaterial color={color} transparent opacity={0.07} side={THREE.BackSide} depthWrite={false} />
        </mesh>
      )}

      {/* Tier C — outer double-corona pulse */}
      {user.tier === 'C' && (
        <mesh>
          <sphereGeometry args={[r * 5.5, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.03} side={THREE.BackSide} depthWrite={false} />
        </mesh>
      )}

      {/* Tier A — point light aura */}
      {user.tier === 'A' && <pointLight color={color} intensity={0.9} distance={10} decay={2} />}
    </group>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────
export default function PresenceOrbs({ users = [] }) {
  if (!users.length) return null;
  return (
    <>
      {users.map(u => <OrbMesh key={u.id} user={u} />)}
    </>
  );
}
