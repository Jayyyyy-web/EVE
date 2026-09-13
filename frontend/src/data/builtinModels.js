// Built-in 3D models shipped with the site itself. Anyone using the app
// gets these automatically — no upload required. Add an entry here once a
// .glb file has been placed in frontend/public/assets/vehicles/.
//
// This is intentionally separate from user uploads (which live on the
// backend under /uploads/models/ and are per-vehicle, per-user files).

export const BUILTIN_MODELS = [
  { id: 'supra_mk5', name: 'Toyota Supra MK5', path: '/assets/vehicles/supra_mk5.glb' },
];
