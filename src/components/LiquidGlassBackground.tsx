'use client'

import { useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { MeshTransmissionMaterial, Float, Environment } from '@react-three/drei'
import * as THREE from 'three'

function LiquidBlob({ position, scale, color1, color2, speed }: {
  position: [number, number, number]
  scale: number
  color1: string
  color2: string
  speed: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<any>(null)

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * speed * 0.2
      meshRef.current.rotation.y += delta * speed * 0.3
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * speed) * 0.3
    }
  })

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <icosahedronGeometry args={[1, 8]} />
        <MeshTransmissionMaterial
          ref={materialRef}
          backside
          samples={16}
          resolution={512}
          transmission={0.95}
          roughness={0.05}
          thickness={0.5}
          ior={1.5}
          chromaticAberration={0.06}
          anisotropy={0.3}
          distortion={0.5}
          distortionScale={0.5}
          temporalDistortion={0.2}
          clearcoat={1}
          attenuationDistance={0.5}
          attenuationColor={color1}
          color={color2}
        />
      </mesh>
    </Float>
  )
}

function GradientBackground() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current && meshRef.current.material) {
      const material = meshRef.current.material as THREE.ShaderMaterial
      if (material.uniforms) {
        material.uniforms.time.value = state.clock.elapsedTime
      }
    }
  })

  return (
    <mesh ref={meshRef} position={[0, 0, -5]} scale={20}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        uniforms={{
          time: { value: 0 },
          color1: { value: new THREE.Color('#050505') },
          color2: { value: new THREE.Color('#0a1628') },
          color3: { value: new THREE.Color('#1a0a14') },
        }}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float time;
          uniform vec3 color1;
          uniform vec3 color2;
          uniform vec3 color3;
          varying vec2 vUv;
          
          void main() {
            vec2 uv = vUv;
            float noise = sin(uv.x * 3.0 + time * 0.2) * cos(uv.y * 3.0 + time * 0.3) * 0.5 + 0.5;
            vec3 color = mix(color1, color2, uv.y + noise * 0.3);
            color = mix(color, color3, uv.x * 0.3 + noise * 0.2);
            gl_FragColor = vec4(color, 1.0);
          }
        `}
      />
    </mesh>
  )
}

function AuroraParticles() {
  const pointsRef = useRef<THREE.Points>(null)
  const particleCount = 1000

  const positions = new Float32Array(particleCount * 3)
  const colors = new Float32Array(particleCount * 3)

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2

    // Blue to orange gradient
    const t = Math.random()
    colors[i * 3] = t < 0.5 ? 0.23 + t * 0.54 : 0.97
    colors[i * 3 + 1] = t < 0.5 ? 0.51 + t * 0.2 : 0.45 - t * 0.3
    colors[i * 3 + 2] = t < 0.5 ? 0.96 - t * 0.6 : 0.22
  }

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1
    }
  })

  return (
    <points ref={pointsRef}>
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
        size={0.03}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  )
}

export function LiquidGlassBackground() {
  return (
    <div className="liquid-canvas">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]}
      >
        <GradientBackground />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#3b82f6" />
        <pointLight position={[10, -10, 5]} intensity={0.5} color="#f97316" />
        
        <LiquidBlob 
          position={[-2, 0, 0]} 
          scale={1.5} 
          color1="#3b82f6" 
          color2="#1e3a5f" 
          speed={0.5} 
        />
        <LiquidBlob 
          position={[2, -0.5, -1]} 
          scale={1.2} 
          color1="#f97316" 
          color2="#5f2a1a" 
          speed={0.7} 
        />
        <LiquidBlob 
          position={[0, 1, -2]} 
          scale={0.8} 
          color1="#6366f1" 
          color2="#312e81" 
          speed={0.4} 
        />
        
        <AuroraParticles />
        
        <Environment preset="night" />
      </Canvas>
    </div>
  )
}
