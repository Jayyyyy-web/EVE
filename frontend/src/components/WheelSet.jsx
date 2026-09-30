import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';

// Loads one wheel model and places four clones at the given hardpoints,
// scaled to the host car's real wheel radius and rotated 180 degrees on
// the wheels that face the opposite side (wheels are radially symmetric
// around their own axle, so this reuses one geometry with no mirroring
// artifacts).
export default function WheelSet({ wheelUrl, hardpoints }) {
  const { scene } = useGLTF(wheelUrl);

  const clones = useMemo(() => {
    if (!hardpoints) return [];
    return Object.entries(hardpoints.points).map(([key, p]) => ({
      key,
      object: scene.clone(true),
      position: [p.x, p.y, p.z],
      rotation: [0, p.facing < 0 ? Math.PI : 0, 0],
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, hardpoints]);

  if (!hardpoints) return null;

  const scale =
    hardpoints.stockWheelRadius && hardpoints.nativeRadius
      ? hardpoints.stockWheelRadius / hardpoints.nativeRadius
      : 1;

  return (
    <group>
      {clones.map(({ key, object, position, rotation }) => (
        <primitive key={key} object={object} position={position} rotation={rotation} scale={scale} />
      ))}
    </group>
  );
}
