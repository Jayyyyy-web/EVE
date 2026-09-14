// Built-in models are bundled with the frontend and served from its own
// public/ folder as relative paths (e.g. "/assets/vehicles/x.glb").
// This is a thin pass-through kept as its own module in case a future
// model source needs different resolution logic.
export function toFullModelUrl(path) {
  return path || '';
}
