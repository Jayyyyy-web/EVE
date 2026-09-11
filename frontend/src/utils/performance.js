// Rough performance projection from chassis weight + engine choice.
//
// The 0-60 estimate is a power-law fit calibrated against a couple of known
// real-world reference points (a ~160hp economy car and a ~650hp muscle
// car), NOT a physics simulation. It ignores traction limits, aerodynamics,
// gearing, and drivetrain losses, so it gets increasingly optimistic at the
// very high end (it won't capture that a car can be too powerful for its
// tires to put power down). Treat this as a directional "more power / less
// weight = faster" indicator, not a dyno-accurate number.
export function projectPerformance({ chassisWeightKg, engine }) {
  if (!engine || engine.type === 'stock' || !engine.hp || !engine.weightKg) {
    return null;
  }

  const totalWeightKg = chassisWeightKg + engine.weightKg;
  const powerToWeight = engine.hp / totalWeightKg; // hp per kg

  const rawAccel = 1.41 * Math.pow(powerToWeight, -0.852);
  const accel0to100 = Math.min(20, Math.max(1.8, rawAccel));

  return {
    totalWeightKg: Math.round(totalWeightKg),
    hp: engine.hp,
    torqueNm: engine.torqueNm,
    powerToWeight: Math.round(powerToWeight * 1000) / 1000,
    accel0to100: Math.round(accel0to100 * 10) / 10,
  };
}
