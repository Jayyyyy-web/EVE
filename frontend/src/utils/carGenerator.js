import * as THREE from 'three';

// Runtime parametric car body. Given a catalog row (real dimensions + body
// type) this builds a lofted shell: a sequence of cross-section rings from
// nose to tail. Ring shape comes from smooth profile curves (hood height,
// cabin width, roof height...), and wheel arches are cut into the rings
// around each axle so wheels never sit inside solid body.
//
// Axes match the wheel hardpoints: X left(+)/right(-), Y up, Z front(+)/rear(-).

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (x) => x * x * (3 - 2 * x);

// Cubic Hermite through keypoints [t, a, b, ...] using Catmull-Rom tangents.
function curve(kps, t, col) {
  const n = kps.length;
  if (t <= kps[0][0]) return kps[0][col];
  if (t >= kps[n - 1][0]) return kps[n - 1][col];
  let i = 0;
  while (i < n - 2 && t > kps[i + 1][0]) i++;
  const [t0, t1] = [kps[i][0], kps[i + 1][0]];
  const y0 = kps[i][col];
  const y1 = kps[i + 1][col];
  const tan = (j) => {
    const a = Math.max(0, j - 1);
    const b = Math.min(n - 1, j + 1);
    return (kps[b][col] - kps[a][col]) / (kps[b][0] - kps[a][0]);
  };
  const h = t1 - t0;
  const u = (t - t0) / h;
  const u2 = u * u;
  const u3 = u2 * u;
  return (
    (2 * u3 - 3 * u2 + 1) * y0 +
    (u3 - 2 * u2 + u) * h * tan(i) +
    (-2 * u3 + 3 * u2) * y1 +
    (u3 - u2) * h * tan(i + 1)
  );
}

// Per-body proportions. t = fraction of length from the nose; heights are
// fractions of overall height; w* are fractions of half-width.
const BODIES = {
  coupe:     { cowl: 0.31, roofF: 0.45, roofR: 0.6,  deck: 0.8,  hNose: 0.38, hHood: 0.64, hRoof: 1, hRoofR: 0.92, hDeck: 0.66, hTail: 0.6,  wCab: 0.7,  wDeck: 0.92, gc: 0.11, belt: 0.62 },
  fastback:  { cowl: 0.3,  roofF: 0.44, roofR: 0.7,  deck: 0.9,  hNose: 0.4,  hHood: 0.62, hRoof: 1, hRoofR: 0.86, hDeck: 0.64, hTail: 0.58, wCab: 0.72, wDeck: 0.94, gc: 0.12, belt: 0.6 },
  midengine: { cowl: 0.27, roofF: 0.39, roofR: 0.57, deck: 0.8,  hNose: 0.32, hHood: 0.56, hRoof: 1, hRoofR: 0.9,  hDeck: 0.7,  hTail: 0.6,  wCab: 0.66, wDeck: 0.97, gc: 0.1,  belt: 0.58 },
  sedan:     { cowl: 0.29, roofF: 0.43, roofR: 0.61, deck: 0.77, hNose: 0.42, hHood: 0.66, hRoof: 1, hRoofR: 0.97, hDeck: 0.69, hTail: 0.66, wCab: 0.73, wDeck: 0.9,  gc: 0.13, belt: 0.64 },
  hatch:     { cowl: 0.27, roofF: 0.41, roofR: 0.84, deck: 0.93, hNose: 0.42, hHood: 0.62, hRoof: 1, hRoofR: 0.96, hDeck: 0.68, hTail: 0.64, wCab: 0.78, wDeck: 0.94, gc: 0.13, belt: 0.62 },
  suv:       { cowl: 0.27, roofF: 0.4,  roofR: 0.89, deck: 0.96, hNose: 0.52, hHood: 0.66, hRoof: 1, hRoofR: 1,    hDeck: 0.78, hTail: 0.72, wCab: 0.86, wDeck: 0.96, gc: 0.2,  belt: 0.66 },
  pickup:    { cowl: 0.27, roofF: 0.38, roofR: 0.55, deck: 0.58, hNose: 0.55, hHood: 0.7,  hRoof: 1, hRoofR: 0.98, hDeck: 0.6,  hTail: 0.58, wCab: 0.88, wDeck: 0.96, gc: 0.22, belt: 0.68 },
  roadster:  { cowl: 0.34, roofF: 0.45, roofR: 0.52, deck: 0.7,  hNose: 0.4,  hHood: 0.6,  hRoof: 0.8, hRoofR: 0.66, hDeck: 0.62, hTail: 0.58, wCab: 0.86, wDeck: 0.93, gc: 0.12, belt: 0.58, openTop: true },
};

const RING_HALF = 12; // points per half cross-section
const RING_N = RING_HALF * 2 - 2; // full ring (center points not duplicated)

export function resolveShape(car) {
  const base = BODIES[car.body] || BODIES.coupe;
  return { ...base, ...(car.opts?.shape || {}) };
}

export function carLayout(car) {
  const L = car.length;
  const foFrac = car.opts?.foFrac ?? 0.45;
  const frontAxleZ = L / 2 - (L - car.wheelbase) * foFrac;
  const rearAxleZ = frontAxleZ - car.wheelbase;
  const hubY = car.wheelR;
  const hwAtAxle = (car.width / 2) * 0.96;
  const hubX = hwAtAxle - 0.1;
  return { L, frontAxleZ, rearAxleZ, hubY, hubX };
}

// Hardpoints in the shape WheelSet expects.
export function carHardpoints(car) {
  const { frontAxleZ, rearAxleZ, hubY, hubX } = carLayout(car);
  return {
    nativeRadius: 0.43,
    stockWheelRadius: car.wheelR,
    points: {
      frontLeft: { x: hubX, y: hubY, z: frontAxleZ, facing: 1 },
      frontRight: { x: -hubX, y: hubY, z: frontAxleZ, facing: -1 },
      rearLeft: { x: hubX, y: hubY, z: rearAxleZ, facing: 1 },
      rearRight: { x: -hubX, y: hubY, z: rearAxleZ, facing: -1 },
    },
  };
}

function stationZs(car, shape, layout) {
  const { L, frontAxleZ, rearAxleZ } = layout;
  const Rc = car.wheelR * 1.2;
  const zs = [];
  for (let i = 0; i <= 18; i++) zs.push(L / 2 - (L * i) / 18);
  [shape.cowl, shape.roofF, shape.roofR, shape.deck].forEach((t) => zs.push(L / 2 - L * t));
  [frontAxleZ, rearAxleZ].forEach((az) => {
    for (let k = -8; k <= 8; k++) zs.push(az + (k * Rc) / 6);
  });
  zs.sort((a, b) => b - a);
  const out = [];
  zs.forEach((z) => {
    if (z > L / 2 + 1e-6 || z < -L / 2 - 1e-6) return;
    if (out.length === 0 || out[out.length - 1] - z > 0.035) out.push(z);
  });
  if (out[0] < L / 2 - 1e-6) out.unshift(L / 2);
  if (out[out.length - 1] > -L / 2 + 1e-6) out.push(-L / 2);
  return out;
}

export function buildCarGeometry(car) {
  const shape = resolveShape(car);
  const layout = carLayout(car);
  const { L, frontAxleZ, rearAxleZ, hubY, hubX } = layout;
  const W2 = car.width / 2;
  const H = car.height;
  const Rc = car.wheelR * 1.2;

  const topKps = [
    [0, shape.hNose, 0.4],
    [0.025, shape.hNose + 0.06, 0.8],
    [shape.cowl * 0.5, lerp(shape.hNose, shape.hHood, 0.5) + 0.02, 0.88],
    [shape.cowl, shape.hHood, 0.86],
    [shape.roofF, shape.hRoof, shape.wCab],
    [(shape.roofF * 0.65 + shape.roofR * 0.35), lerp(shape.hRoof, shape.hRoofR, 0.12), shape.wCab],
    [(shape.roofF * 0.35 + shape.roofR * 0.65), lerp(shape.hRoof, shape.hRoofR, 0.45), shape.wCab],
    [shape.roofR, shape.hRoofR, shape.wCab * 1.02],
    [shape.deck, shape.hDeck, shape.wDeck],
    [0.965, shape.hTail, 0.88],
    [1, shape.hTail - 0.1, 0.45],
  ];
  const lowKps = [
    [0, 0.5],
    [0.025, 0.9],
    [0.12, 0.97],
    [0.5, 0.95],
    [0.88, 0.985],
    [0.975, 0.93],
    [1, 0.55],
  ];

  const zs = stationZs(car, shape, layout);
  const rings = [];
  const flagsPerRing = [];

  const upperIdxSides = [6, 7, 8, 9, 13, 14, 15, 16];
  const upperIdxAll = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

  zs.forEach((z) => {
    const t = clamp((L / 2 - z) / L, 0, 1);
    const top0 = H * curve(topKps, t, 1);
    const hwUp = W2 * curve(topKps, t, 2);
    const hwLow = W2 * curve(lowKps, t, 1);

    const endLift =
      0.14 * smooth(clamp((0.07 - t) / 0.07, 0, 1)) +
      0.12 * smooth(clamp((t - 0.93) / 0.07, 0, 1));
    const bot = shape.gc + endLift;

    // wheel arch: floor stays low in the middle, side sill lifts to an arc
    // over each axle.
    let yA = bot + 0.05;
    let xf = hwLow * 0.74;
    const dzF = z - frontAxleZ;
    const dzR = z - rearAxleZ;
    const dz = Math.abs(dzF) < Math.abs(dzR) ? dzF : dzR;
    if (Math.abs(dz) < Rc) {
      const arch = hubY + Math.sqrt(Rc * Rc - dz * dz);
      yA = Math.max(yA, arch);
      xf = Math.min(xf, hubX - 0.17);
    }
    yA = Math.min(yA, top0 - 0.12);

    const belt = Math.max(yA + 0.1, Math.min(H * shape.belt, top0 - 0.07));
    const top = Math.max(top0, belt + 0.05);

    const p = [
      [0, bot],
      [xf, bot],
      [xf, yA],
      [hwLow * 0.96, yA],
      [hwLow, yA + (belt - yA) * 0.25],
      [hwLow, yA + (belt - yA) * 0.7],
      [lerp(hwLow, hwUp, 0.15), belt],
      [lerp(hwLow, hwUp, 0.55), belt + (top - belt) * 0.45],
      [hwUp, belt + (top - belt) * 0.8],
      [hwUp * 0.7, top - (top - belt) * 0.06],
      [hwUp * 0.35, top],
      [0, top],
    ];
    const ring = [];
    for (let i = 0; i < RING_HALF; i++) ring.push([p[i][0], p[i][1], z]);
    for (let i = RING_HALF - 2; i >= 1; i--) ring.push([-p[i][0], p[i][1], z]);
    rings.push(ring);

    const flags = new Set();
    if (t >= shape.cowl - 1e-4 && t <= shape.roofF + 1e-4) upperIdxAll.forEach((i) => flags.add(i));
    if (!shape.openTop) {
      if (t >= shape.roofF - 1e-4 && t <= shape.roofR + 1e-4) upperIdxSides.forEach((i) => flags.add(i));
      if (t >= shape.roofR - 1e-4 && t <= shape.deck + 1e-4) upperIdxAll.forEach((i) => flags.add(i));
    }
    flagsPerRing.push(flags);
  });

  const verts = [];
  rings.forEach((r) => r.forEach((v) => verts.push(...v)));

  const paintIdx = [];
  const glassIdx = [];
  const addFace = (a, b, c, glass) => (glass ? glassIdx : paintIdx).push(a, b, c);
  const isGlass = (v) => flagsPerRing[Math.floor(v / RING_N)].has(v % RING_N);

  for (let r = 0; r < rings.length - 1; r++) {
    const A = r * RING_N;
    const B = (r + 1) * RING_N;
    for (let i = 0; i < RING_N; i++) {
      const j = (i + 1) % RING_N;
      const a0 = A + i;
      const a1 = A + j;
      const b0 = B + i;
      const b1 = B + j;
      addFace(a0, b0, a1, isGlass(a0) && isGlass(b0) && isGlass(a1));
      addFace(a1, b0, b1, isGlass(a1) && isGlass(b0) && isGlass(b1));
    }
  }
  // end caps
  const frontC = verts.length / 3;
  const rc = rings[0].reduce((s, v) => [s[0] + v[0], s[1] + v[1], s[2] + v[2]], [0, 0, 0]).map((x) => x / RING_N);
  verts.push(...rc);
  for (let i = 0; i < RING_N; i++) paintIdx.push(frontC, i, (i + 1) % RING_N);
  const rearC = verts.length / 3;
  const lastBase = (rings.length - 1) * RING_N;
  const lc = rings[rings.length - 1].reduce((s, v) => [s[0] + v[0], s[1] + v[1], s[2] + v[2]], [0, 0, 0]).map((x) => x / RING_N);
  verts.push(...lc);
  for (let i = 0; i < RING_N; i++) paintIdx.push(rearC, lastBase + ((i + 1) % RING_N), lastBase + i);

  // make sure faces point outward (signed volume must be positive)
  let vol = 0;
  const all = paintIdx.concat(glassIdx);
  for (let f = 0; f < all.length; f += 3) {
    const [a, b, c] = [all[f], all[f + 1], all[f + 2]].map((i) => verts.slice(i * 3, i * 3 + 3));
    vol += (a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0])) / 6;
  }
  const flip = (arr) => {
    for (let f = 0; f < arr.length; f += 3) [arr[f + 1], arr[f + 2]] = [arr[f + 2], arr[f + 1]];
  };
  if (vol < 0) {
    flip(paintIdx);
    flip(glassIdx);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setIndex(paintIdx.concat(glassIdx));
  geo.addGroup(0, paintIdx.length, 0);
  if (glassIdx.length) geo.addGroup(paintIdx.length, glassIdx.length, 1);
  geo.computeVertexNormals();
  return geo;
}

// Small bolt-on pieces (lights, mirrors, spoiler, exhaust) as plain boxes.
export function carExtras(car) {
  const shape = resolveShape(car);
  const { L } = carLayout(car);
  const W2 = car.width / 2;
  const H = car.height;
  const out = [];
  const lightW = Math.max(0.22, car.width * 0.17);

  [1, -1].forEach((s) => {
    out.push({ kind: 'headlight', size: [lightW, 0.08, 0.1], pos: [s * W2 * 0.66, H * (shape.hNose + 0.045), L / 2 - 0.13] });
    out.push({ kind: 'mirror', size: [0.1, 0.07, 0.16], pos: [s * (W2 * shape.wCab + 0.09), H * shape.belt + 0.07, L / 2 - L * shape.cowl - 0.08] });
    out.push({ kind: 'exhaust', size: [0.1, 0.1, 0.12], pos: [s * W2 * 0.45, shape.gc + 0.12, -L / 2 + 0.04] });
  });
  out.push({ kind: 'taillight', size: [car.width * 0.76, 0.07, 0.07], pos: [0, H * (shape.hTail + 0.02), -L / 2 + 0.07] });

  if (car.opts?.spoiler) {
    const z = -L / 2 + L * 0.1;
    const y = H * shape.hDeck + 0.09;
    out.push({ kind: 'trim', size: [car.width * 0.7, 0.035, 0.3], pos: [0, y, z] });
    [1, -1].forEach((s) => out.push({ kind: 'trim', size: [0.04, 0.1, 0.06], pos: [s * car.width * 0.28, y - 0.06, z + 0.02] }));
  }
  return out;
}
