import { useMemo } from 'react';
import { buildCarGeometry, carExtras, carHardpoints } from '../utils/carGenerator';
import WheelSet from './WheelSet';
import { WHEEL_MODELS } from '../data/wheelModels';

const EXTRA_MATERIALS = {
  headlight: { color: '#e8eeff', emissive: '#cfd9ff', emissiveIntensity: 2.6, metalness: 0.1, roughness: 0.1 },
  taillight: { color: '#c01010', emissive: '#ff1a10', emissiveIntensity: 2.2, metalness: 0.1, roughness: 0.2 },
  mirror: { color: '#0b0c10', metalness: 0.3, roughness: 0.3 },
  exhaust: { color: '#9a9da3', metalness: 0.95, roughness: 0.2 },
  trim: { color: '#0b0c10', metalness: 0.3, roughness: 0.35 },
};

// A car built at runtime from a catalog row. Wheels come from the swappable
// wheel catalog, mounted at hardpoints derived from the same row.
export default function ProceduralCar({ car, color = '#7c5cff', wheelModelUrl }) {
  const geometry = useMemo(() => buildCarGeometry(car), [car]);
  const extras = useMemo(() => carExtras(car), [car]);
  const hardpoints = useMemo(() => carHardpoints(car), [car]);
  const wheelUrl = wheelModelUrl || WHEEL_MODELS[0].path;

  return (
    <group>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          attach="material-0"
          color={color}
          metalness={0.55}
          roughness={0.32}
          clearcoat={1}
          clearcoatRoughness={0.08}
        />
        <meshPhysicalMaterial attach="material-1" color="#0a1118" metalness={0.7} roughness={0.06} />
      </mesh>

      {extras.map((e, i) => (
        <mesh key={i} position={e.pos} castShadow>
          <boxGeometry args={e.size} />
          <meshStandardMaterial {...EXTRA_MATERIALS[e.kind]} />
        </mesh>
      ))}

      <WheelSet wheelUrl={wheelUrl} hardpoints={hardpoints} />
    </group>
  );
}
