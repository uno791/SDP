import React, { Suspense, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, OrbitControls, useGLTF, Html } from "@react-three/drei";
import * as THREE from "three";
import styles from "./ThreeFootball.module.css";

function CenteredLoader({ label }: { label?: string }) {
  return (
    <Html center>
      <div className={styles.loader}>{label ?? "Loading…"}</div>
    </Html>
  );
}

function AutoRotatingBall() {
  const gltf = useGLTF("/jabulani.glb", true);
  const groupRef = React.useRef<THREE.Group>(null);

  const scale = useMemo(() => 1.2, []);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.6;
      groupRef.current.rotation.x = Math.sin(Date.now() * 0.0004) * 0.08;
    }
  });

  return (
    <group ref={groupRef} scale={scale} position={[0, -0.1, 0]} dispose={null}>
      <primitive object={gltf.scene} />
      <mesh position={[0, -1.02, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[0.7, 32]} />
        <meshStandardMaterial transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

useGLTF.preload?.("/jabulani.glb");

export default function ThreeFootball() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 3.6], fov: 45, near: 0.1, far: 100 }}
      className={styles.canvas}
    >
      <color attach="background" args={["#00000000"]} />
      <hemisphereLight intensity={0.7} groundColor={"#222"} />
      <directionalLight position={[3, 5, 6]} intensity={1.6} castShadow />
      <directionalLight position={[-6, 2, -2]} intensity={0.6} />
      <pointLight position={[0, -2, 1]} intensity={0.4} />
      <Suspense fallback={<CenteredLoader label="Loading 3D ball…" />}>
        <AutoRotatingBall />
        <Environment preset="city" />
      </Suspense>
      <OrbitControls enableZoom={false} enablePan={false} />
    </Canvas>
  );
}
