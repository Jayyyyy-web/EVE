// Real engine/motor catalog for the swap simulator.
// hp/torqueNm are peak figures from published manufacturer specs (stock
// tune, no aftermarket modification assumed). weightKg is the engine/motor's
// dry weight, used to recompute total vehicle weight on a swap. These are
// well-known enthusiast reference numbers, not exact to the decimal for
// every production year — treat them as "close enough for a fun build
// simulator," not a spec sheet for real engineering work.

const ENGINES = [
  { id: 'stock', name: 'Stock (as configured)', type: 'stock', hp: null, torqueNm: null, weightKg: null },

  // Inline-4 / small displacement
  { id: 'k20a', name: 'Honda K20A (Civic Type R)', type: 'gas', hp: 220, torqueNm: 215, weightKg: 130 },
  { id: 'sr20det', name: 'Nissan SR20DET', type: 'gas', hp: 227, torqueNm: 274, weightKg: 145 },
  { id: 'ea888', name: 'VW/Audi 2.0T EA888', type: 'gas', hp: 268, torqueNm: 370, weightKg: 150 },

  // Inline-6
  { id: '2jzgte', name: 'Toyota 2JZ-GTE (Twin-Turbo I6)', type: 'gas', hp: 320, torqueNm: 440, weightKg: 195 },
  { id: '1jzgte', name: 'Toyota 1JZ-GTE (Turbo I6)', type: 'gas', hp: 280, torqueNm: 363, weightKg: 180 },
  { id: 'b58', name: 'BMW B58 (3.0L Turbo I6, Supra MK5)', type: 'gas', hp: 382, torqueNm: 500, weightKg: 178 },
  { id: 'rb26dett', name: 'Nissan RB26DETT (Skyline GT-R)', type: 'gas', hp: 320, torqueNm: 392, weightKg: 224 },

  // V6
  { id: 'vr38dett', name: 'Nissan VR38DETT (GT-R Twin-Turbo V6)', type: 'gas', hp: 565, torqueNm: 633, weightKg: 227 },
  { id: 'ecoboost_35', name: 'Ford 3.5L EcoBoost Twin-Turbo V6', type: 'gas', hp: 450, torqueNm: 691, weightKg: 215 },

  // V8
  { id: 'coyote_50', name: 'Ford Coyote 5.0L V8 (Mustang GT)', type: 'gas', hp: 480, torqueNm: 570, weightKg: 210 },
  { id: 'ls3', name: 'Chevrolet LS3 6.2L V8', type: 'gas', hp: 430, torqueNm: 570, weightKg: 195 },
  { id: 'ls7', name: 'Chevrolet LS7 7.0L V8 (Z06)', type: 'gas', hp: 505, torqueNm: 637, weightKg: 210 },
  { id: 'hellcat_62', name: 'Dodge 6.2L Supercharged Hemi (Hellcat)', type: 'gas', hp: 717, torqueNm: 881, weightKg: 256 },
  { id: 'lt4', name: 'Chevrolet LT4 6.2L Supercharged V8 (ZR1/Z06)', type: 'gas', hp: 650, torqueNm: 875, weightKg: 220 },

  // V10 / V12
  { id: 'viper_v10', name: 'Dodge 8.4L V10 (Viper)', type: 'gas', hp: 645, torqueNm: 813, weightKg: 280 },

  // Electric
  { id: 'tesla_single', name: 'Tesla Single Motor (Long Range RWD)', type: 'electric', hp: 283, torqueNm: 420, weightKg: 90 },
  { id: 'tesla_dual', name: 'Tesla Dual Motor AWD (Model 3 Performance)', type: 'electric', hp: 510, torqueNm: 660, weightKg: 165 },
  { id: 'tesla_plaid', name: 'Tesla Tri-Motor Plaid', type: 'electric', hp: 1020, torqueNm: 1420, weightKg: 215 },
];

module.exports = ENGINES;
