import { Suspense, useMemo, Component } from 'react';
import { useGLTF } from '@react-three/drei';
import CarModel from './CarModel';

function GLTFCar({ url, color }) {
  const { scene } = useGLTF(url);

  // Clone so multiple instances (if ever rendered twice) don't share state,
  // and so we don't mutate the cached original.
  const cloned = useMemo(() => scene.clone(true), [scene]);

  // If a color is set, try to tint any material that looks like body paint.
  // This is a best-effort heuristic since real GLTF files vary wildly in
  // how they name/structure materials — some models won't respond to this.
  useMemo(() => {
    if (!color) return;
    cloned.traverse((child) => {
      if (child.isMesh && child.material) {
        const name = (child.material.name || '').toLowerCase();
        if (name.includes('body') || name.includes('paint') || name.includes('shell')) {
          child.material = child.material.clone();
          child.material.color.set(color);
        }
      }
    });
  }, [cloned, color]);

  return <primitive object={cloned} />;
}

// Wrapper that tries to load a real GLTF model if a URL is provided,
// and falls back to the procedural generic shape otherwise (or on error).
export default function VehicleModel({ modelUrl, color, model, wheelStyle }) {
  if (!modelUrl) {
    return <CarModel color={color} model={model} wheelStyle={wheelStyle} />;
  }

  return (
    <ModelErrorBoundary fallback={<CarModel color={color} model={model} wheelStyle={wheelStyle} />}>
      <Suspense fallback={<CarModel color={color} model={model} wheelStyle={wheelStyle} />}>
        <GLTFCar url={modelUrl} color={color} />
      </Suspense>
    </ModelErrorBoundary>
  );
}

// Minimal error boundary: if the GLTF fails to load (bad URL, corrupt file,
// unsupported format), silently fall back to the procedural shape instead
// of crashing the whole viewer.
class ModelErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err) {
    console.warn('3D model failed to load, falling back to procedural shape:', err.message);
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
