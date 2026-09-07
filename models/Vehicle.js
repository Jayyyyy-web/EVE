const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    model: { type: String, required: true }, // e.g. "Sedan", "Coupe", "SUV"
    color: { type: String, default: '#ffffff' },
    wheels: { type: String, default: 'standard' },
    interior: { type: String, default: 'standard' },
    specs: {
      topSpeedKph: { type: Number, default: 0 },
      rangeKm: { type: Number, default: 0 },
      batteryKwh: { type: Number, default: 0 },
      accel0to100: { type: Number, default: 0 }, // seconds
    },
    modelUrl: { type: String }, // path/URL to 3D model asset (.glb, .gltf, etc.)
    thumbnailUrl: { type: String },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isPublic: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Vehicle', VehicleSchema);