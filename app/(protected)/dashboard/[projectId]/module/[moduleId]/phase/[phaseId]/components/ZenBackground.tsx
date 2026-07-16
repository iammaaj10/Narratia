"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

// Function to generate random points in a sphere
const generateParticles = (count: number) => {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Random spherical coordinates
    const r = 15 * Math.cbrt(Math.random());
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);
    
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  return positions;
};

type ParticleProps = {
  speed: number;
  color: string;
};

function ParticleSystem({ speed, color }: ParticleProps) {
  const ref = useRef<THREE.Points>(null);
  
  // Generate 4000 particles
  const positions = useMemo(() => generateParticles(4000), []);
  
  // Create a target color based on the string
  const targetColor = useMemo(() => new THREE.Color(color), [color]);
  const currentColor = useRef(new THREE.Color(color));

  useFrame((state, delta) => {
    if (!ref.current) return;
    
    // Rotate slowly by default, speed up when typing
    const baseSpeed = 0.02;
    const activeSpeed = baseSpeed + speed * 0.15; // speed is 0 to 1
    
    ref.current.rotation.x -= delta * (activeSpeed / 2);
    ref.current.rotation.y += delta * (activeSpeed);
    
    // Float up and down based on time
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.5;
    
    // Smoothly transition colors
    currentColor.current.lerp(targetColor, delta * 1.5);
    
    // Update material color
    const material = ref.current.material as THREE.PointsMaterial;
    if (material) {
      material.color = currentColor.current;
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={currentColor.current}
        size={0.08}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

type ZenBackgroundProps = {
  typingSpeed: number; // 0 to 1
  emotionColor: string; // hex color
};

export default function ZenBackground({ typingSpeed, emotionColor }: ZenBackgroundProps) {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-1000">
      <Canvas camera={{ position: [0, 0, 12], fov: 60 }}>
        <color attach="background" args={["#030008"]} /> {/* Deep purple-black */}
        <ambientLight intensity={0.5} />
        <ParticleSystem speed={typingSpeed} color={emotionColor} />
      </Canvas>
    </div>
  );
}
