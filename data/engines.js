// Generic engine/motor catalog for the swap simulator.
// Names and numbers are illustrative, not tied to any specific real product,
// so this stays simple to maintain and free of licensing concerns.
// hp/torqueNm are peak figures; weightKg is the engine/motor's own weight
// (used to recompute total vehicle weight on swap).

const ENGINES = [
  { id: 'stock', name: 'Stock (as configured)', type: 'stock', hp: null, torqueNm: null, weightKg: null },
  { id: 'i4_na_2_0', name: '2.0L Inline-4 (N/A)', type: 'gas', hp: 158, torqueNm: 200, weightKg: 140 },
  { id: 'i4_turbo_2_0', name: '2.0L Turbo Inline-4', type: 'gas', hp: 255, torqueNm: 370, weightKg: 155 },
  { id: 'v6_na_3_5', name: '3.5L V6 (N/A)', type: 'gas', hp: 300, torqueNm: 350, weightKg: 190 },
  { id: 'v6_twinturbo_3_0', name: '3.0L Twin-Turbo V6', type: 'gas', hp: 400, torqueNm: 480, weightKg: 200 },
  { id: 'v8_na_5_0', name: '5.0L V8 (N/A)', type: 'gas', hp: 460, torqueNm: 530, weightKg: 220 },
  { id: 'v8_super_6_2', name: '6.2L Supercharged V8', type: 'gas', hp: 650, torqueNm: 880, weightKg: 245 },
  { id: 'em_single_150', name: 'Single Electric Motor', type: 'electric', hp: 280, torqueNm: 430, weightKg: 90 },
  { id: 'em_dual_400', name: 'Dual Electric Motor (AWD)', type: 'electric', hp: 500, torqueNm: 830, weightKg: 160 },
  { id: 'em_tri_1000', name: 'Tri-Motor Performance', type: 'electric', hp: 1000, torqueNm: 1400, weightKg: 210 },
];

module.exports = ENGINES;
