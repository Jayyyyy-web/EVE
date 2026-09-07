const Vehicle = require('../models/Vehicle');

// @route POST /api/vehicles
const createVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.create({ ...req.body, owner: req.user.id });
    res.status(201).json(vehicle);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @route GET /api/vehicles  (public vehicles + your own)
const getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({
      $or: [{ isPublic: true }, { owner: req.user.id }],
    }).populate('owner', 'username');
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @route GET /api/vehicles/:id
const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate('owner', 'username');
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    if (!vehicle.isPublic && String(vehicle.owner._id) !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this vehicle' });
    }

    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @route PUT /api/vehicles/:id
const updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    if (String(vehicle.owner) !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to edit this vehicle' });
    }

    Object.assign(vehicle, req.body);
    await vehicle.save();
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @route DELETE /api/vehicles/:id
const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    if (String(vehicle.owner) !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this vehicle' });
    }

    await vehicle.deleteOne();
    res.json({ message: 'Vehicle deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
};