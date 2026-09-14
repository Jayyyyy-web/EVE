import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei';
import VehicleModel from './VehicleModel';
import { toFullModelUrl } from '../api/models';

export default function VehicleViewer3D({
  color,
  model,
  wheelStyle,
  modelUrl,
  height = 380,
  interactive = true,
}) {
  const fullModelUrl = toFullModelUrl(modelUrl);

  return (
    <div className="viewer-3d" style={{ height }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [4.5, 2.6, 5.5], fov: 35 }}
        gl={{
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
          antialias: true,
        }}
      >
        {/* Soft overall fill so nothing goes fully black */}
        <ambientLight intensity={0.35} />

        {/* Key light — main directional light, casts the primary shadow */}
        <directionalLight
          position={[5, 8, 5]}
          intensity={2.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0004}
        />

        {/* Fill light — opposite side, softer, keeps shadows from going too harsh */}
        <directionalLight position={[-6, 3, -4]} intensity={0.6} color="#bcd4ff" />

        {/* Rim light — behind the car, helps edges read against the background */}
        <directionalLight position={[0, 4, -7]} intensity={0.9} color="#ffffff" />

        <Environment preset="studio" environmentIntensity={0.9} />

        <group position={[0, -0.4, 0]}>
          <VehicleModel modelUrl={fullModelUrl} color={color} model={model} wheelStyle={wheelStyle} />
        </group>

        <ContactShadows position={[0, -0.4, 0]} opacity={0.55} scale={10} blur={2.2} far={2} />

        {interactive && (
          <OrbitControls
            enablePan={false}
            minDistance={3.5}
            maxDistance={9}
            maxPolarAngle={Math.PI / 2.1}
          />
        )}
      </Canvas>
    </div>
  );
}
