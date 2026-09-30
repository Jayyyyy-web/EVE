// Per-car wheel hub positions, extracted from each model's own rig (world
// space, meters, Y-up — matches three.js/glTF convention) so a swapped
// wheel model lands exactly where the stock wheel sat, not an eyeballed
// guess. `hideNodePrefixes` names the stock wheel/brake mesh nodes to hide
// when a swap is active, so the new wheel doesn't render on top of the old
// one.
//
// nativeRadius is the radius our generated wheel models (see
// frontend/src/data/wheelModels.js) are built at; stockWheelRadius is the
// real car's own wheel radius (approximated from hub ride height), used to
// scale the swapped wheel to fit.

export const WHEEL_HARDPOINTS = {
  supra_mk5: {
    nativeRadius: 0.43,
    stockWheelRadius: 0.329,
    hideNodePrefixes: ['MKV.Wheel.', 'MKV.WheelBrake.'],
    points: {
      frontLeft: { x: 0.759, y: 0.3298, z: 1.3616, facing: 1 },
      frontRight: { x: -0.759, y: 0.3298, z: 1.3616, facing: -1 },
      rearLeft: { x: 0.7734, y: 0.3289, z: -1.227, facing: 1 },
      rearRight: { x: -0.7734, y: 0.3289, z: -1.227, facing: -1 },
    },
  },
};

// Best-effort: pull a model's catalog id out of its asset path
// (/assets/vehicles/supra_mk5.glb -> supra_mk5) so callers that only have
// the URL can still look up hardpoints.
export function modelIdFromUrl(url) {
  if (!url) return null;
  const match = url.match(/\/([^/]+)\.glb$/i);
  return match ? match[1] : null;
}
