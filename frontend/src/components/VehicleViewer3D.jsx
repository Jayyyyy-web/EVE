import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import VehicleModel from './VehicleModel';
import { toFullModelUrl } from '../api/models';

export default function VehicleViewer3D({
  color,
  model,
  wheelStyle,
  modelUrl,
  wheelModelUrl,
  height = 380,
  interactive = true,
}) {
  const fullModelUrl = toFullModelUrl(modelUrl);

  return (
    <div className="viewer-3d" style={{ height }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [4.5, 2.4, 5.5], fov: 35 }}
        gl={{
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
          antialias: true,
        }}
      >
        {/* Low ambient — NFS garage scenes are moody, not evenly lit */}
        <ambientLight intensity={0.12} />

        {/* Key light — a single hard spotlight, like an overhead garage rig */}
        <spotLight
          position={[3, 7, 4]}
          angle={0.4}
          penumbra={0.5}
          intensity={3.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0004}
          color="#f4f6ff"
        />

        {/* Cool rim light — signature blue/violet edge glow */}
        <directionalLight position={[-6, 2.5, -3]} intensity={2.4} color="#5b7dff" />

        {/* Warm rim light — amber counter-glow for that complementary contrast */}
        <directionalLight position={[5, 1.5, -6]} intensity={1.8} color="#ff8a3d" />

        {/* Dark, moody environment instead of a bright studio */}
        <Environment preset="night" environmentIntensity={0.4} />

        <group position={[0, -0.4, 0]}>
          <VehicleModel
            modelUrl={fullModelUrl}
            color={color}
            model={model}
            wheelStyle={wheelStyle}
            wheelModelUrl={wheelModelUrl}
          />
        </group>

        <ContactShadows position={[0, -0.4, 0]} opacity={0.75} scale={10} blur={2.4} far={2} />

        <EffectComposer>
          <Bloom
            intensity={0.55}
            luminanceThreshold={0.55}
            luminanceSmoothing={0.2}
            mipmapBlur
          />
          <Vignette eskil={false} offset={0.15} darkness={0.6} />
        </EffectComposer>

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
