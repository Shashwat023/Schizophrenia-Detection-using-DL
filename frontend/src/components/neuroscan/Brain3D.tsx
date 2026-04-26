import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Icosahedron, Sphere, Stars, Torus } from "@react-three/drei";
import * as THREE from "three";

function BrainCore({ scanning }: { scanning: boolean }) {
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Mesh>(null);
  const wire = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.35;
    if (wire.current) wire.current.rotation.x += delta * 0.15;
    if (inner.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * (scanning ? 4 : 1.5)) * 0.04;
      inner.current.scale.setScalar(s);
    }
  });

  return (
    <group ref={group}>
      {/* Glowing core */}
      <Sphere ref={inner} args={[1.05, 64, 64]}>
        <meshStandardMaterial
          color={"#00d4ff"}
          emissive={"#00d4ff"}
          emissiveIntensity={scanning ? 1.4 : 0.8}
          roughness={0.25}
          metalness={0.7}
        />
      </Sphere>
      {/* Wireframe shell */}
      <Icosahedron ref={wire as any} args={[1.45, 3]}>
        <meshBasicMaterial color={scanning ? "#ff3df0" : "#7c5cff"} wireframe transparent opacity={0.55} />
      </Icosahedron>
      {/* Outer rings */}
      <Torus args={[1.85, 0.012, 16, 100]} rotation={[Math.PI / 2.2, 0, 0]}>
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.7} />
      </Torus>
      <Torus args={[2.05, 0.008, 16, 100]} rotation={[Math.PI / 1.6, Math.PI / 4, 0]}>
        <meshBasicMaterial color="#ff3df0" transparent opacity={0.55} />
      </Torus>
    </group>
  );
}

function ScanBeam({ active }: { active: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = Math.sin(t * 2.2) * 1.6;
  });
  if (!active) return null;
  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[2.2, 2.2, 0.04, 64, 1, true]} />
      <meshBasicMaterial color="#00ffd5" transparent opacity={0.45} side={THREE.DoubleSide} />
    </mesh>
  );
}

export const Brain3D = ({ scanning = false }: { scanning?: boolean }) => {
  return (
    <div className="relative w-full h-[420px] md:h-[520px]">
      <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent blur-2xl pointer-events-none" />
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }} dpr={[1, 2]}>
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} intensity={1.2} color="#00d4ff" />
        <pointLight position={[-5, -3, 2]} intensity={0.9} color="#ff3df0" />
        <Suspense fallback={null}>
          <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.6}>
            <BrainCore scanning={scanning} />
          </Float>
          <ScanBeam active={scanning} />
          <Stars radius={40} depth={30} count={1500} factor={3} fade speed={0.6} />
        </Suspense>
      </Canvas>
      {/* Scan line overlay */}
      {scanning && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
          <div className="absolute left-0 right-0 h-24 bg-gradient-to-b from-transparent via-primary/30 to-transparent animate-scan-line" />
        </div>
      )}
      {/* Corner brackets */}
      <CornerBrackets />
    </div>
  );
};

const CornerBrackets = () => (
  <>
    {[
      "top-3 left-3 border-l-2 border-t-2",
      "top-3 right-3 border-r-2 border-t-2",
      "bottom-3 left-3 border-l-2 border-b-2",
      "bottom-3 right-3 border-r-2 border-b-2",
    ].map((c) => (
      <div key={c} className={`absolute h-6 w-6 border-primary/70 ${c} pointer-events-none`} />
    ))}
  </>
);