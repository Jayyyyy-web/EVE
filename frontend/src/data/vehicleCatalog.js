// Vehicle catalog. Each entry is a row of real-world dimensions plus a body
// type; the 3D car is generated at runtime from these numbers (see
// utils/carGenerator.js), so adding a car is adding a row — no model file.
//
// Dimensions are meters, weight is curb weight in kg. Shapes are stylized
// from the real proportions (length / width / height / wheelbase / wheel
// size), not scans — good enough to judge stance, wheel fitment and color.
//
// body: coupe | fastback | midengine | sedan | hatch | suv | pickup | roadster
// stockEngineId: id from backend data/engines.js when we have that engine;
//   otherwise omitted and the build starts on "Stock".
// opts: optional shape overrides / flags (spoiler, foFrac = front overhang
//   share of total overhang).

export const CATALOG = [
  // ---- Toyota
  { id: 'toyota-supra-a90', make: 'Toyota', model: 'GR Supra (A90)', years: '2020–', body: 'coupe', length: 4.38, width: 1.854, height: 1.292, wheelbase: 2.47, wheelR: 0.345, curbKg: 1540, stockEngineId: 'b58', opts: { spoiler: true } },
  { id: 'toyota-supra-a80', make: 'Toyota', model: 'Supra (A80)', years: '1993–2002', body: 'coupe', length: 4.514, width: 1.811, height: 1.271, wheelbase: 2.55, wheelR: 0.33, curbKg: 1500, stockEngineId: '2jzgte', opts: { spoiler: true } },
  { id: 'toyota-gr86', make: 'Toyota', model: 'GR86', years: '2022–', body: 'coupe', length: 4.265, width: 1.775, height: 1.31, wheelbase: 2.575, wheelR: 0.325, curbKg: 1270 },
  { id: 'toyota-gr-corolla', make: 'Toyota', model: 'GR Corolla', years: '2023–', body: 'hatch', length: 4.407, width: 1.85, height: 1.48, wheelbase: 2.64, wheelR: 0.335, curbKg: 1470 },
  { id: 'toyota-camry', make: 'Toyota', model: 'Camry', years: '2018–', body: 'sedan', length: 4.88, width: 1.84, height: 1.445, wheelbase: 2.825, wheelR: 0.33, curbKg: 1600 },
  { id: 'toyota-4runner', make: 'Toyota', model: '4Runner', years: '2010–', body: 'suv', length: 4.84, width: 1.925, height: 1.78, wheelbase: 2.79, wheelR: 0.385, curbKg: 2000 },

  // ---- Nissan
  { id: 'nissan-gtr-r35', make: 'Nissan', model: 'GT-R (R35)', years: '2009–', body: 'coupe', length: 4.71, width: 1.895, height: 1.37, wheelbase: 2.78, wheelR: 0.35, curbKg: 1740, stockEngineId: 'vr38dett' },
  { id: 'nissan-skyline-r34', make: 'Nissan', model: 'Skyline GT-R (R34)', years: '1999–2002', body: 'coupe', length: 4.6, width: 1.785, height: 1.36, wheelbase: 2.665, wheelR: 0.33, curbKg: 1560, stockEngineId: 'rb26dett', opts: { spoiler: true } },
  { id: 'nissan-240sx-s14', make: 'Nissan', model: '240SX / Silvia (S14)', years: '1994–1998', body: 'coupe', length: 4.52, width: 1.69, height: 1.29, wheelbase: 2.525, wheelR: 0.31, curbKg: 1250, stockEngineId: 'sr20det' },
  { id: 'nissan-370z', make: 'Nissan', model: '370Z', years: '2009–2020', body: 'coupe', length: 4.25, width: 1.845, height: 1.315, wheelbase: 2.55, wheelR: 0.33, curbKg: 1480 },

  // ---- Mazda / Honda / Subaru / Mitsubishi
  { id: 'mazda-rx7-fd', make: 'Mazda', model: 'RX-7 (FD)', years: '1992–2002', body: 'coupe', length: 4.285, width: 1.76, height: 1.23, wheelbase: 2.425, wheelR: 0.32, curbKg: 1280 },
  { id: 'mazda-mx5-nd', make: 'Mazda', model: 'MX-5 Miata (ND)', years: '2016–', body: 'roadster', length: 3.915, width: 1.735, height: 1.235, wheelbase: 2.31, wheelR: 0.31, curbKg: 1060 },
  { id: 'honda-s2000', make: 'Honda', model: 'S2000', years: '1999–2009', body: 'roadster', length: 4.135, width: 1.75, height: 1.285, wheelbase: 2.4, wheelR: 0.31, curbKg: 1250 },
  { id: 'honda-nsx-na1', make: 'Honda', model: 'NSX (NA1)', years: '1990–2005', body: 'midengine', length: 4.43, width: 1.81, height: 1.17, wheelbase: 2.53, wheelR: 0.32, curbKg: 1370 },
  { id: 'honda-civic-type-r', make: 'Honda', model: 'Civic Type R (FK8)', years: '2017–2021', body: 'hatch', length: 4.557, width: 1.877, height: 1.434, wheelbase: 2.699, wheelR: 0.34, curbKg: 1380, stockEngineId: 'k20a', opts: { spoiler: true } },
  { id: 'honda-civic-sedan', make: 'Honda', model: 'Civic Sedan', years: '2022–', body: 'sedan', length: 4.674, width: 1.802, height: 1.415, wheelbase: 2.735, wheelR: 0.32, curbKg: 1300 },
  { id: 'subaru-wrx-sti', make: 'Subaru', model: 'WRX STI', years: '2015–2021', body: 'sedan', length: 4.595, width: 1.795, height: 1.475, wheelbase: 2.65, wheelR: 0.33, curbKg: 1530, opts: { spoiler: true } },
  { id: 'mitsubishi-evo', make: 'Mitsubishi', model: 'Lancer Evolution X', years: '2008–2015', body: 'sedan', length: 4.51, width: 1.81, height: 1.48, wheelbase: 2.65, wheelR: 0.33, curbKg: 1500, opts: { spoiler: true } },

  // ---- American
  { id: 'ford-mustang-gt', make: 'Ford', model: 'Mustang GT (S550)', years: '2015–2023', body: 'coupe', length: 4.784, width: 1.916, height: 1.381, wheelbase: 2.72, wheelR: 0.35, curbKg: 1680, stockEngineId: 'coyote_50', opts: { foFrac: 0.42 } },
  { id: 'ford-f150', make: 'Ford', model: 'F-150', years: '2021–', body: 'pickup', length: 5.89, width: 2.029, height: 1.96, wheelbase: 3.7, wheelR: 0.4, curbKg: 2200, stockEngineId: 'ecoboost_35' },
  { id: 'chevy-camaro-ss', make: 'Chevrolet', model: 'Camaro SS', years: '2016–', body: 'coupe', length: 4.783, width: 1.897, height: 1.349, wheelbase: 2.811, wheelR: 0.35, curbKg: 1670 },
  { id: 'chevy-corvette-c8', make: 'Chevrolet', model: 'Corvette Stingray (C8)', years: '2020–', body: 'midengine', length: 4.63, width: 1.934, height: 1.225, wheelbase: 2.723, wheelR: 0.35, curbKg: 1530 },
  { id: 'dodge-challenger-hellcat', make: 'Dodge', model: 'Challenger SRT Hellcat', years: '2015–2023', body: 'coupe', length: 5.022, width: 1.923, height: 1.45, wheelbase: 2.946, wheelR: 0.36, curbKg: 2020, stockEngineId: 'hellcat_62', opts: { foFrac: 0.42 } },
  { id: 'dodge-charger-hellcat', make: 'Dodge', model: 'Charger SRT Hellcat', years: '2015–2023', body: 'sedan', length: 5.04, width: 1.905, height: 1.48, wheelbase: 3.053, wheelR: 0.36, curbKg: 2080, stockEngineId: 'hellcat_62' },
  { id: 'dodge-viper-acr', make: 'Dodge', model: 'Viper ACR', years: '2008–2017', body: 'coupe', length: 4.463, width: 1.941, height: 1.222, wheelbase: 2.51, wheelR: 0.36, curbKg: 1560, stockEngineId: 'viper_v10', opts: { spoiler: true, foFrac: 0.38 } },
  { id: 'jeep-wrangler', make: 'Jeep', model: 'Wrangler Rubicon', years: '2018–', body: 'suv', length: 4.882, width: 1.894, height: 1.848, wheelbase: 3.008, wheelR: 0.4, curbKg: 2100 },

  // ---- European
  { id: 'bmw-m3-e46', make: 'BMW', model: 'M3 (E46)', years: '2000–2006', body: 'coupe', length: 4.492, width: 1.781, height: 1.365, wheelbase: 2.731, wheelR: 0.32, curbKg: 1570 },
  { id: 'bmw-m3-g80', make: 'BMW', model: 'M3 (G80)', years: '2021–', body: 'sedan', length: 4.794, width: 1.903, height: 1.433, wheelbase: 2.857, wheelR: 0.35, curbKg: 1730 },
  { id: 'bmw-m2-g87', make: 'BMW', model: 'M2 (G87)', years: '2023–', body: 'coupe', length: 4.58, width: 1.887, height: 1.403, wheelbase: 2.747, wheelR: 0.35, curbKg: 1710 },
  { id: 'porsche-911-992', make: 'Porsche', model: '911 Carrera (992)', years: '2019–', body: 'fastback', length: 4.519, width: 1.852, height: 1.298, wheelbase: 2.45, wheelR: 0.34, curbKg: 1520, opts: { foFrac: 0.62 } },
  { id: 'porsche-718-gt4', make: 'Porsche', model: '718 Cayman GT4', years: '2020–', body: 'midengine', length: 4.456, width: 1.801, height: 1.269, wheelbase: 2.484, wheelR: 0.34, curbKg: 1420, opts: { spoiler: true } },
  { id: 'audi-r8-v10', make: 'Audi', model: 'R8 V10', years: '2016–2023', body: 'midengine', length: 4.426, width: 1.94, height: 1.24, wheelbase: 2.65, wheelR: 0.35, curbKg: 1640 },
  { id: 'vw-golf-r', make: 'Volkswagen', model: 'Golf R', years: '2014–', body: 'hatch', length: 4.289, width: 1.789, height: 1.457, wheelbase: 2.627, wheelR: 0.325, curbKg: 1520, stockEngineId: 'ea888' },
  { id: 'mercedes-amg-gt', make: 'Mercedes-AMG', model: 'AMG GT', years: '2015–2023', body: 'coupe', length: 4.546, width: 1.939, height: 1.288, wheelbase: 2.63, wheelR: 0.35, curbKg: 1615, opts: { foFrac: 0.34 } },
  { id: 'lamborghini-huracan', make: 'Lamborghini', model: 'Huracán', years: '2014–', body: 'midengine', length: 4.52, width: 1.933, height: 1.165, wheelbase: 2.62, wheelR: 0.35, curbKg: 1422 },
  { id: 'ferrari-488-gtb', make: 'Ferrari', model: '488 GTB', years: '2015–2019', body: 'midengine', length: 4.568, width: 1.952, height: 1.213, wheelbase: 2.65, wheelR: 0.35, curbKg: 1475 },

  // ---- Electric
  { id: 'tesla-model3-perf', make: 'Tesla', model: 'Model 3 Performance', years: '2018–', body: 'fastback', length: 4.72, width: 1.85, height: 1.441, wheelbase: 2.875, wheelR: 0.34, curbKg: 1850, stockEngineId: 'tesla_dual', opts: { foFrac: 0.5 } },
  { id: 'tesla-models-plaid', make: 'Tesla', model: 'Model S Plaid', years: '2021–', body: 'fastback', length: 4.979, width: 1.964, height: 1.445, wheelbase: 2.96, wheelR: 0.355, curbKg: 2190, stockEngineId: 'tesla_plaid', opts: { foFrac: 0.5 } },
];

export const MAKES = [...new Set(CATALOG.map((c) => c.make))].sort();

export function getCatalogCar(id) {
  return CATALOG.find((c) => c.id === id) || null;
}

export function catalogLabel(car) {
  return car ? `${car.make} ${car.model}` : '';
}
