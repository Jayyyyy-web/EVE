// Built-in swappable wheel models. These are generated procedurally
// (see blender_scripts/generate_wheels.py) rather than sourced from a
// download — wheels are radially symmetric, so a generated model holds up
// well without needing a scanned/modeled real-world part.

export const WHEEL_MODELS = [
  {
    id: 'gt_5spoke',
    name: 'GT 5-Spoke',
    path: '/assets/wheels/gt_5spoke.glb',
    style: '5-spoke',
    finish: 'Gunmetal',
  },
  {
    id: 'mesh_10spoke',
    name: 'Mesh 10-Spoke',
    path: '/assets/wheels/mesh_10spoke.glb',
    style: 'Mesh',
    finish: 'Polished',
  },
  {
    id: 'deep_dish_6spoke',
    name: 'Deep Dish 6-Spoke',
    path: '/assets/wheels/deep_dish_6spoke.glb',
    style: 'Deep dish',
    finish: 'Gloss black',
  },
  {
    id: 'turbine_12spoke',
    name: 'Turbine 12-Spoke',
    path: '/assets/wheels/turbine_12spoke.glb',
    style: 'Turbine',
    finish: 'Bronze',
  },
];
