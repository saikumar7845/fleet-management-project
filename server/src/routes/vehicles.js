import express from 'express';
import mongoose from 'mongoose';
import Vehicle from '../models/Vehicle.js';
import User from '../models/User.js';
import { auth, allow } from '../middleware/auth.js';

const router = express.Router();
router.use(auth);

import { memoryData } from '../memoryStore.js';

router.get('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const filter = req.user.role === 'driver' ? { assignedDriver: req.user._id } : {};
      const vehicles = await Vehicle.find(filter).populate('assignedDriver', 'name email phone');
      return res.json(vehicles);
    }
    const filterVehicles = req.user.role === 'driver' 
      ? memoryData.vehicles.filter(v => v.assignedDriver?.email === req.user.email || v.assignedDriver?.id === req.user.id || v.assignedDriver?._id === req.user.id)
      : memoryData.vehicles;
    res.json(filterVehicles);
  } catch {
    res.json(memoryData.vehicles);
  }
});

router.post('/', allow('admin', 'manager'), async (req, res) => {
  try {
    const vehicle = await Vehicle.create(req.body);
    res.status(201).json(vehicle);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.put('/:id', allow('admin', 'manager'), async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(vehicle);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.post('/:id/assign', allow('admin', 'manager'), async (req, res) => {
  try {
    const { driverId } = req.body;
    const driver = await User.findOne({ _id: driverId, role: 'driver', active: true });
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, { assignedDriver: driverId, status: 'assigned' }, { new: true })
      .populate('assignedDriver', 'name email phone');
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(vehicle);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.post('/:id/unassign', allow('admin', 'manager'), async (req, res) => {
  const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, { assignedDriver: null, status: 'available', loadStatus: 'unloaded', currentLoad: 'Empty / Unloaded', loadWeightKg: 0 }, { new: true });
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
  res.json(vehicle);
});

router.post('/:id/return', async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    if (req.user.role === 'driver' && vehicle.assignedDriver?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only return a vehicle assigned to you' });
    }
    vehicle.assignedDriver = null;
    vehicle.status = 'available';
    vehicle.loadStatus = 'unloaded';
    vehicle.currentLoad = 'Empty / Unloaded';
    vehicle.loadWeightKg = 0;
    await vehicle.save();
    res.json({ message: 'Vehicle successfully returned', vehicle });
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.post('/:id/load', async (req, res) => {
  try {
    const cargoDesc = (req.body.currentLoad || req.body.cargoDescription || '').trim();
    const weight = Number(req.body.loadWeightKg) || 0;
    if (!cargoDesc) return res.status(400).json({ message: 'Cargo description is required for loading' });
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, {
      currentLoad: cargoDesc,
      loadWeightKg: weight,
      loadStatus: 'loaded'
    }, { new: true });
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json({ message: 'Vehicle loaded successfully', vehicle });
  } catch (e) { res.status(400).json({ message: e.message }); }
});

export default router;
