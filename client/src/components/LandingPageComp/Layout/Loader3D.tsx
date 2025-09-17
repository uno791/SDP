import React, { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import styles from "./Loader3D.module.css";

const MODEL_URL = "/football.glb";

function RotatingBall() {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF(MODEL_URL);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 1.2;
      group.current.position.y = Math.sin(state.clock.elapsedTime * 3) * 2; // bounce higher
    }
  });

  // ⬅️ Scale bumped from 1.5 → 15 (≈ 10× bigger)
  return <primitive ref={group} object={scene} scale={1} />;
}

function Fallback() {
  return (
    <Html center>
      <div style={{ color: "white", fontSize: "1.2rem" }}>Loading…</div>
    </Html>
  );
}

export default function Loader3D() {
  return (
    <div className={styles.overlay}>
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 25], fov: 40 }} // pulled camera back
        className={styles.canvas}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 5, 3]} intensity={1.2} />
        <Suspense fallback={<Fallback />}>
          <RotatingBall />
        </Suspense>
      </Canvas>
      <div className={styles.text}>FootBook — loading live data…</div>
    </div>
  );
}
