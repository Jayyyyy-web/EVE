import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei';
import VehicleModel from './VehicleModel';
import { toFullModelUrl } from '../api/uploads';

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
      <Canvas shadows camera={{ position: [4.5, 2.6, 5.5], fov: 35 }}>
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.4}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <Environment preset="city" />

        <group position={[0, -0.4, 0]}>
          <VehicleModel modelUrl={fullModelUrl} color={color} model={model} wheelStyle={wheelStyle} />
        </group>

        <ContactShadows position={[0, -0.4, 0]} opacity={0.5} scale={10} blur={2.4} far={2} />

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
