import { useMemo } from 'react';

// Body-type presets: rough proportions only, not real vehicle dimensions.
// width/length/height are in arbitrary 3D units, tuned to look reasonable.
const PRESETS = {
  sedan: { length: 4.6, width: 1.8, height: 1.1, cabinHeight: 0.55, cabinOffset: -0.1, wheelR: 0.34 },
  coupe: { length: 4.4, width: 1.8, height: 1.0, cabinHeight: 0.45, cabinOffset: -0.15, wheelR: 0.34 },
  suv: { length: 4.8, width: 1.95, height: 1.5, cabinHeight: 0.85, cabinOffset: 0, wheelR: 0.4 },
  truck: { length: 5.5, width: 1.95, height: 1.5, cabinHeight: 0.7, cabinOffset: 0.9, wheelR: 0.42 },
  hatchback: { length: 4.0, width: 1.75, height: 1.15, cabinHeight: 0.7, cabinOffset: 0.2, wheelR: 0.32 },
};

function resolvePreset(modelString = '') {
  const key = modelString.toLowerCase();
  if (key.includes('suv')) return PRESETS.suv;
  if (key.includes('truck') || key.includes('pickup')) return PRESETS.truck;
  if (key.includes('coupe')) return PRESETS.coupe;
  if (key.includes('hatch')) return PRESETS.hatchback;
  return PRESETS.sedan;
}

function Wheel({ x, z, radius }) {
  return (
    <mesh position={[x, radius, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[radius, radius, 0.28, 20]} />
      <meshStandardMaterial color="#161616" roughness={0.85} metalness={0.1} />
    </mesh>
  );
}

export default function CarModel({ color = '#7c5cff', model = 'sedan', wheelStyle = 'standard' }) {
  const preset = useMemo(() => resolvePreset(model), [model]);
  const { length, width, height, cabinHeight, cabinOffset, wheelR } = preset;

  const wheelInset = 0.15;
  const axleZ = length / 2 - wheelR - wheelInset;
  const trackX = width / 2 + 0.02;

  const rimColor = wheelStyle?.toLowerCase().includes('chrome') ? '#dfe3e8' : '#3a3f4d';

  return (
    <group>
      {/* Main body */}
      <mesh position={[0, height / 2, 0]} castShadow>
        <boxGeometry args={[width, height * 0.6, length]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.55} />
      </mesh>

      {/* Cabin */}
      <mesh
        position={[0, height * 0.6 + cabinHeight / 2, cabinOffset]}
        castShadow
      >
        <boxGeometry args={[width * 0.86, cabinHeight, length * 0.46]} />
        <meshStandardMaterial color="#12151f" roughness={0.15} metalness={0.2} transparent opacity={0.85} />
      </mesh>

      {/* Wheels */}
      <Wheel x={-trackX} z={axleZ} radius={wheelR} />
      <Wheel x={trackX} z={axleZ} radius={wheelR} />
      <Wheel x={-trackX} z={-axleZ} radius={wheelR} />
      <Wheel x={trackX} z={-axleZ} radius={wheelR} />

      {/* Rim accents (simple flat discs to hint at wheel style) */}
      {[[-trackX, axleZ], [trackX, axleZ], [-trackX, -axleZ], [trackX, -axleZ]].map(
        ([x, z], i) => (
          <mesh key={i} position={[x, wheelR, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[wheelR * 0.55, wheelR * 0.55, 0.3, 16]} />
            <meshStandardMaterial color={rimColor} roughness={0.3} metalness={0.8} />
          </mesh>
        )
      )}
    </group>
  );
}
