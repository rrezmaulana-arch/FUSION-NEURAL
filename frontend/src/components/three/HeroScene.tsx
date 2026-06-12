/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Sparkles, MeshDistortMaterial } from '@react-three/drei';
import { useRef, Suspense, useState } from 'react';
import * as THREE from 'three';

/* ─── Core Pulsing Engine Sphere ─────────────────────── */
function NeuralCore() {
  const outerRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (outerRef.current) {
      outerRef.current.rotation.y = t * 0.12;
      outerRef.current.rotation.x = Math.sin(t * 0.25) * 0.04;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y = -t * 0.5;
      innerRef.current.rotation.z = t * 0.3;
      const s = 1 + Math.sin(t * 2) * 0.07;
      innerRef.current.scale.setScalar(s);
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = t * 0.18;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = t * 0.22;
      ring2Ref.current.rotation.z = -t * 0.1;
    }
    if (coreRef.current) {
      const s = 1 + Math.sin(t * 3) * 0.12;
      coreRef.current.scale.setScalar(s);
    }
  });

  return (
    <Float speed={1.8} rotationIntensity={0.2} floatIntensity={0.7}>
      <group>
        {/* Outer glass-like shell using MeshDistortMaterial */}
        <mesh ref={outerRef}>
          <sphereGeometry args={[1.6, 64, 64]} />
          <MeshDistortMaterial
            color="#e5d4f5"
            transparent
            opacity={0.18}
            distort={0.15}
            speed={2}
            roughness={0.05}
            metalness={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Outer shell wireframe */}
        <mesh>
          <sphereGeometry args={[1.62, 32, 32]} />
          <meshBasicMaterial
            color="#760EFF"
            wireframe
            transparent
            opacity={0.08}
          />
        </mesh>

        {/* Inner neural net icosahedron */}
        <mesh ref={innerRef}>
          <icosahedronGeometry args={[0.9, 2]} />
          <meshStandardMaterial
            color="#760EFF"
            emissive="#760EFF"
            emissiveIntensity={1.4}
            wireframe
            transparent
            opacity={0.85}
          />
        </mesh>

        {/* Blue inner core glow */}
        <mesh ref={coreRef}>
          <sphereGeometry args={[0.35, 32, 32]} />
          <meshStandardMaterial
            color="#A855F7"
            emissive="#A855F7"
            emissiveIntensity={2.5}
            transparent
            opacity={0.95}
          />
        </mesh>

        {/* (White core removed as requested) */}

        {/* Orbital ring 1 — purple */}
        <mesh ref={ring1Ref} rotation={[Math.PI / 2.2, 0.3, 0]}>
          <torusGeometry args={[2.05, 0.018, 16, 120]} />
          <meshStandardMaterial
            color="#760EFF"
            emissive="#760EFF"
            emissiveIntensity={1.8}
            transparent
            opacity={0.65}
          />
        </mesh>

        {/* Orbital ring 2 — blue */}
        <mesh ref={ring2Ref} rotation={[Math.PI / 3.5, Math.PI / 4, 0.2]}>
          <torusGeometry args={[1.75, 0.012, 16, 100]} />
          <meshStandardMaterial
            color="#A855F7"
            emissive="#A855F7"
            emissiveIntensity={1.4}
            transparent
            opacity={0.5}
          />
        </mesh>

        {/* Sparkles — purple */}
        <Sparkles
          count={80}
          scale={3.5}
          size={2}
          speed={0.35}
          color="#760EFF"
          opacity={0.8}
        />
        {/* Sparkles — blue */}
        <Sparkles
          count={40}
          scale={2.5}
          size={1.2}
          speed={0.6}
          color="#d8b4fe"
          opacity={0.6}
        />
      </group>
    </Float>
  );
}

/* ─── Floating ambient particles ─────────────────────── */
function AmbientParticles() {
  const count = 150;

  const [{ positions, colors }] = useState(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const purple = new THREE.Color('#760EFF');
    const blue = new THREE.Color('#A855F7');
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
      const c = Math.random() > 0.5 ? purple : blue;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    return { positions, colors };
  });

  const ref = useRef<THREE.Points>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.025;
      ref.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.1) * 0.05;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        vertexColors
        transparent
        opacity={0.55}
        sizeAttenuation
      />
    </points>
  );
}

/* ─── Main Scene Canvas ───────────────────────────────── */
export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.5], fov: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
      style={{ background: 'transparent', width: '100%', height: '100%' }}
    >
      <Suspense fallback={null}>
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1.0} color="#ffffff" />
        <pointLight position={[-4, 3, 3]} intensity={3} color="#760EFF" distance={10} />
        <pointLight position={[4, -3, -3]} intensity={2} color="#A855F7" distance={10} />
        <pointLight position={[0, 0, 5]} intensity={1} color="#ffffff" />
        <pointLight position={[0, -4, 0]} intensity={0.5} color="#760EFF" />

        <NeuralCore />
        <AmbientParticles />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.6}
        />
      </Suspense>
    </Canvas>
  );
}

