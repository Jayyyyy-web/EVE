import { Suspense, useMemo, Component } from 'react';
import { useGLTF } from '@react-three/drei';
import CarModel from './CarModel';
import WheelSet from './WheelSet';
import { WHEEL_HARDPOINTS, modelIdFromUrl } from '../data/wheelHardpoints';

function GLTFCar({ url, color, wheelModelUrl }) {
  const { scene } = useGLTF(url);

  // Clone so multiple instances (if ever rendered twice) don't share state,
  // and so we don't mutate the cached original.
  const cloned = useMemo(() => scene.clone(true), [scene]);

  const hardpoints = useMemo(() => {
    const id = modelIdFromUrl(url);
    return id ? WHEEL_HARDPOINTS[id] : null;
  }, [url]);

  const swapWheels = Boolean(wheelModelUrl && hardpoints);

  // If a color is set, try to tint any material that looks like body paint.
  // This is a best-effort heuristic since real GLTF files vary wildly in
  // how they name/structure materials — some models won't respond to this.
  // While here, also hide the stock wheel/brake meshes when a wheel swap
  // is active, so the new wheel model doesn't render on top of the old one.
  useMemo(() => {
    cloned.traverse((child) => {
      if (color && child.isMesh && child.material) {
        const name = (child.material.name || '').toLowerCase();
        if (name.includes('body') || name.includes('paint') || name.includes('shell')) {
          child.material = child.material.clone();
          child.material.color.set(color);
        }
      }
      if (swapWheels && hardpoints.hideNodePrefixes.some((p) => child.name?.startsWith(p))) {
        child.visible = false;
      }
    });
  }, [cloned, color, swapWheels, hardpoints]);

  return (
    <>
      <primitive object={cloned} />
      {swapWheels && <WheelSet wheelUrl={wheelModelUrl} hardpoints={hardpoints} />}
    </>
  );
}

// Wrapper that tries to load a real GLTF model if a URL is provided,
// and falls back to the procedural generic shape otherwise (or on error).
export default function VehicleModel({ modelUrl, color, model, wheelStyle, wheelModelUrl }) {
  if (!modelUrl) {
    return <CarModel color={color} model={model} wheelStyle={wheelStyle} wheelModelUrl={wheelModelUrl} />;
  }

  return (
    <ModelErrorBoundary fallback={<CarModel color={color} model={model} wheelStyle={wheelStyle} />}>
      <Suspense fallback={<CarModel color={color} model={model} wheelStyle={wheelStyle} />}>
        <GLTFCar url={modelUrl} color={color} wheelModelUrl={wheelModelUrl} />
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
