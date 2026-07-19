"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

export type ZenScene = "cosmic" | "snow" | "galaxy" | "ember";

// ─── COSMIC VOID ──────────────────────────────────────────────
// Stars rotating slowly in a sphere — the universe of your story
function CosmicScene({ speed, color }: { speed: number; color: string }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(5000 * 3);
    for (let i = 0; i < 5000; i++) {
      const r = 18 * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  const targetColor = useMemo(() => new THREE.Color(color), [color]);
  const currentColor = useRef(new THREE.Color(color));

  useFrame((state, delta) => {
    if (!ref.current) return;
    const s = 0.02 + speed * 0.12;
    ref.current.rotation.x -= delta * (s / 2);
    ref.current.rotation.y += delta * s;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.5;
    currentColor.current.lerp(targetColor, delta * 1.5);
    const mat = ref.current.material as THREE.PointsMaterial;
    if (mat) mat.color = currentColor.current;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={currentColor.current}
        size={0.07}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

// ─── SNOWFALL ──────────────────────────────────────────────────
// Gentle white/blue particles falling softly — peaceful writing atmosphere
function SnowScene({ speed }: { speed: number }) {
  const count = 3500;
  const ref = useRef<THREE.Points>(null);

  const { positions, offsets, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const offsets = new Float32Array(count);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 28;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 14;
      offsets[i] = Math.random() * Math.PI * 2;
      speeds[i]  = 0.3 + Math.random() * 0.5;
    }
    return { positions, offsets, speeds };
  }, []);

  const posRef = useRef(positions.slice());

  useFrame((state, delta) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const boost = 1 + speed * 2;
    const posAttr = ref.current.geometry.attributes.position as THREE.BufferAttribute;

    for (let i = 0; i < count; i++) {
      // Fall downward
      posRef.current[i * 3 + 1] -= delta * speeds[i] * boost;
      // Gentle sway left/right
      posRef.current[i * 3] += Math.sin(t * 0.4 + offsets[i]) * delta * 0.08;

      // Reset to top when fallen off bottom
      if (posRef.current[i * 3 + 1] < -12) {
        posRef.current[i * 3 + 1] = 12;
        posRef.current[i * 3] = (Math.random() - 0.5) * 28;
      }

      posAttr.setXYZ(i, posRef.current[i * 3], posRef.current[i * 3 + 1], posRef.current[i * 3 + 2]);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#dde8ff"
        size={0.06}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.85}
      />
    </Points>
  );
}

// ─── GALAXY SPIRAL ─────────────────────────────────────────────
// Classic rotating galaxy spiral — majestic and epic
function GalaxyScene({ speed }: { speed: number }) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const count = 7000;
    const arr = new Float32Array(count * 3);
    const arms = 3;
    const spread = 0.35;

    for (let i = 0; i < count; i++) {
      const radius = Math.random() * 12;
      const armAngle = ((i % arms) / arms) * Math.PI * 2;
      const spin = radius * 0.6; // tighter spiral for inner, looser outer
      const angle = armAngle + spin;

      arr[i * 3]     = Math.cos(angle) * radius + (Math.random() - 0.5) * spread * radius;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 0.5; // very flat
      arr[i * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * spread * radius;
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * (0.025 + speed * 0.08);
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#a78bfa"
        size={0.055}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.9}
      />
    </Points>
  );
}

// ─── EMBER STORM ───────────────────────────────────────────────
// Warm embers rising upward like sparks from a writer's fireplace
function EmberScene({ speed }: { speed: number }) {
  const count = 3000;
  const ref = useRef<THREE.Points>(null);

  const { positions, offsets } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const offsets = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      offsets[i] = Math.random() * Math.PI * 2;
    }
    return { positions, offsets };
  }, []);

  const posRef = useRef(positions.slice());

  useFrame((state, delta) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const boost = 1 + speed * 4;
    const posAttr = ref.current.geometry.attributes.position as THREE.BufferAttribute;

    for (let i = 0; i < count; i++) {
      // Rise upward
      posRef.current[i * 3 + 1] += delta * (0.3 + Math.random() * 0.2) * boost;
      // Sway sideways like real embers
      posRef.current[i * 3] += Math.sin(t * 0.5 + offsets[i]) * delta * 0.3 * boost;

      // Reset when gone off top
      if (posRef.current[i * 3 + 1] > 12) {
        posRef.current[i * 3 + 1] = -12;
        posRef.current[i * 3] = (Math.random() - 0.5) * 20;
      }

      posAttr.setXYZ(
        i,
        posRef.current[i * 3],
        posRef.current[i * 3 + 1],
        posRef.current[i * 3 + 2]
      );
    }
    posAttr.needsUpdate = true;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#f97316"
        size={0.07}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.9}
      />
    </Points>
  );
}

// ─── MAIN EXPORT ────────────────────────────────────────────────
type ZenBackgroundProps = {
  typingSpeed: number;
  emotionColor: string;
  scene: ZenScene;
};

const BG_COLORS: Record<ZenScene, string> = {
  cosmic: "#020008",
  snow:   "#010510",
  galaxy: "#000008",
  ember:  "#0a0400",
};

export default function ZenBackground({ typingSpeed, emotionColor, scene }: ZenBackgroundProps) {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-1000">
      <Canvas camera={{ position: [0, 0, 12], fov: 60 }}>
        <color attach="background" args={[BG_COLORS[scene]]} />
        <ambientLight intensity={0.5} />
        {scene === "cosmic" && <CosmicScene speed={typingSpeed} color={emotionColor} />}
        {scene === "snow"   && <SnowScene   speed={typingSpeed} />}
        {scene === "galaxy" && <GalaxyScene speed={typingSpeed} />}
        {scene === "ember"  && <EmberScene  speed={typingSpeed} />}
      </Canvas>
    </div>
  );
}
