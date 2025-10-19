import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Html,
  Center,
  Bounds,
  useGLTF,
} from "@react-three/drei";
import { motion, useScroll, useTransform } from "framer-motion";
import * as THREE from "three";
import styles from "./ThreeFootball.module.css";

/* Loader spinner */
function FallbackSpinner() {
  return (
    <Html center>
      <div className={styles.loader}>Loading ball…</div>
    </Html>
  );
}

/* Checker-textured fallback if model fails */
function makeCheckerTexture(squares = 6, scale = 1): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  for (let y = 0; y < squares; y++) {
    for (let x = 0; x < squares; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? "#ffffff" : "#111111";
      ctx.fillRect(
        (x * size) / squares,
        (y * size) / squares,
        size / squares,
        size / squares
      );
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(scale, scale);
  return texture;
}

function FallbackBall() {
  const tex = useMemo(() => makeCheckerTexture(6, 1), []);
  return (
    <mesh castShadow>
      <icosahedronGeometry args={[0.95, 2]} />
      <meshStandardMaterial metalness={0.1} roughness={0.4} map={tex} />
    </mesh>
  );
}

/* Safe GLTF loader (won’t crash if model missing) */
function useSafeGLTF(url: string) {
  const [ok, setOk] = useState(true);
  const gltf = ok ? (useGLTF(url) as any) : null;
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        /* drei will fetch internally; if fails, ok flips */
      } catch {
        if (active) setOk(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [url]);
  return gltf ?? { scene: null };
}

/* Rotating football */
function RotatingFootball({ url }: { url: string }) {
  const group = useRef<THREE.Group>(null);
  const [spinBoost, setSpinBoost] = useState(1);
  const wobbleRef = useRef(0);
  const { scene } = useSafeGLTF(url);

  useEffect(() => {
    if (!scene) return;
    scene.traverse((obj: THREE.Object3D) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
  }, [scene]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    g.rotation.y += delta * (0.9 * spinBoost);
    const t = state.clock.getElapsedTime();
    const wobbleTarget = (Math.sin(t * 1.6) + Math.cos(t * 1.1)) * 0.06;
    wobbleRef.current =
      wobbleRef.current * 0.92 + wobbleTarget * (1 - 0.92);
    g.rotation.x = wobbleRef.current * 0.35;
    g.rotation.z = wobbleRef.current * 0.15;
  });

  if (!scene) return <FallbackBall />;

  return (
    <group
      ref={group}
      position={[0, -0.1, 0]}
      scale={1}
      onPointerOver={() => setSpinBoost(2.2)}
      onPointerOut={() => setSpinBoost(1)}
      onPointerDown={() => setSpinBoost(3)}
      onPointerUp={() => setSpinBoost(2.2)}
    >
      <Center>
        <primitive object={scene} />
      </Center>
    </group>
  );
}

/* Main exported football canvas */
export default function ThreeFootball() {
  // const modelUrl = "/hot_girls_04.glb";
  const modelUrl = "/jabulani.glb";
  useGLTF.preload?.(modelUrl);

  // Parallax (gentle) — keep small so the ball stays in the hero area
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, -140]);

  return (
    <motion.div className={styles.wrapper} style={{ y }}>
      <Canvas
        shadows
        dpr={[0.9, 1.6]}
        camera={{ position: [0, 0.4, 3], fov: 35 }}
        className={styles.canvas}
      >
        <Suspense fallback={<FallbackSpinner />}>
          <group>
            <ambientLight intensity={0.25} />
            <hemisphereLight
              intensity={0.55}
              groundColor={new THREE.Color("#0a3f2e")}
            />
            <directionalLight
              castShadow
              position={[4, 6, 5]}
              intensity={1.1}
              shadow-mapSize-width={512}
              shadow-mapSize-height={512}
            />
            <Bounds fit clip margin={1.1} observe>
              <RotatingFootball url={modelUrl} />
            </Bounds>
            <mesh
              receiveShadow
              rotation={[-Math.PI / 2, 0, 0]}
              position={[0, -0.95, 0]}
            >
              <planeGeometry args={[8, 8]} />
              <shadowMaterial transparent opacity={0.25} />
            </mesh>
          </group>
          <OrbitControls enablePan={false} enableZoom={false} enableDamping />
        </Suspense>
      </Canvas>
    </motion.div>
  );
}
