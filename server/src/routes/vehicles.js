import express from 'express';
import mongoose from 'mongoose';
import Vehicle from '../models/Vehicle.js';
import User from '../models/User.js';
import { auth, allow } from '../middleware/auth.js';
import { memoryData } from '../memoryStore.js';

const router = express.Router();
router.use(auth);

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
  } catch (e) {
    res.json(memoryData.vehicles);
  }
});

router.post('/', allow('admin', 'manager'), async (req, res) => {
  try {
    const { registrationNumber, type, purchaseDate, currentOdometer } = req.body || {};
    if (!registrationNumber || !type) {
      return res.status(400).json({ message: 'Registration number and vehicle type are required' });
    }

    if (mongoose.connection.readyState === 1) {
      const vehicle = await Vehicle.create(req.body);
      return res.status(201).json(vehicle);
    }

    const newV = {
      _id: 'v-' + Date.now(),
      id: 'v-' + Date.now(),
      registrationNumber,
      type,
      purchaseDate: purchaseDate || new Date().toISOString().split('T')[0],
      lastServiceDate: new Date().toISOString().split('T')[0],
      currentOdometer: Number(currentOdometer) || 0,
      status: 'available',
      assignedDriver: null,
      loadStatus: 'unloaded',
      currentLoad: 'Empty / Unloaded',
      loadWeightKg: 0
    };
    memoryData.vehicles.unshift(newV);
    res.status(201).json(newV);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.put('/:id', allow('admin', 'manager'), async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
      return res.json(vehicle);
    }

    const idx = memoryData.vehicles.findIndex(v => v._id === req.params.id || v.id === req.params.id);
    if (idx !== -1) {
      memoryData.vehicles[idx] = { ...memoryData.vehicles[idx], ...req.body };
      return res.json(memoryData.vehicles[idx]);
    }
    res.status(404).json({ message: 'Vehicle not found' });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.post('/:id/assign', allow('admin', 'manager'), async (req, res) => {
  try {
    const { driverId } = req.body || {};
    if (mongoose.connection.readyState === 1) {
      const driver = await User.findOne({ _id: driverId, role: 'driver', active: true });
      if (!driver) return res.status(404).json({ message: 'Driver not found' });
      const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, { assignedDriver: driverId, status: 'assigned' }, { new: true })
        .populate('assignedDriver', 'name email phone');
      if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
      return res.json(vehicle);
    }

    const vIdx = memoryData.vehicles.findIndex(v => v._id === req.params.id || v.id === req.params.id);
    const dObj = memoryData.drivers.find(d => d._id === driverId || d.id === driverId);
    if (vIdx !== -1) {
      memoryData.vehicles[vIdx].assignedDriver = dObj || { _id: driverId, name: 'Driver', email: 'driver@fleet.com' };
      memoryData.vehicles[vIdx].status = 'assigned';
      return res.json(memoryData.vehicles[vIdx]);
    }
    res.status(404).json({ message: 'Vehicle not found' });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.post('/:id/unassign', allow('admin', 'manager'), async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, { assignedDriver: null, status: 'available', loadStatus: 'unloaded', currentLoad: 'Empty / Unloaded', loadWeightKg: 0 }, { new: true });
      if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
      return res.json(vehicle);
    }

    const vIdx = memoryData.vehicles.findIndex(v => v._id === req.params.id || v.id === req.params.id);
    if (vIdx !== -1) {
      memoryData.vehicles[vIdx].assignedDriver = null;
      memoryData.vehicles[vIdx].status = 'available';
      memoryData.vehicles[vIdx].loadStatus = 'unloaded';
      memoryData.vehicles[vIdx].currentLoad = 'Empty / Unloaded';
      memoryData.vehicles[vIdx].loadWeightKg = 0;
      return res.json(memoryData.vehicles[vIdx]);
    }
    res.status(404).json({ message: 'Vehicle not found' });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.post('/:id/return', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
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
      return res.json({ message: 'Vehicle successfully returned', vehicle });
    }

    const vIdx = memoryData.vehicles.findIndex(v => v._id === req.params.id || v.id === req.params.id);
    if (vIdx !== -1) {
      const targetV = memoryData.vehicles[vIdx];
      targetV.assignedDriver = null;
      targetV.status = 'available';
      targetV.loadStatus = 'unloaded';
      targetV.currentLoad = 'Empty / Unloaded';
      targetV.loadWeightKg = 0;
      return res.json({ message: 'Vehicle successfully returned', vehicle: targetV });
    }
    res.status(404).json({ message: 'Vehicle not found' });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.post('/:id/load', async (req, res) => {
  try {
    const cargoDesc = (req.body.currentLoad || req.body.cargoDescription || '').trim();
    const weight = Number(req.body.loadWeightKg) || 0;
    if (!cargoDesc) return res.status(400).json({ message: 'Cargo description is required for loading' });

    if (mongoose.connection.readyState === 1) {
      const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, {
        currentLoad: cargoDesc,
        loadWeightKg: weight,
        loadStatus: 'loaded'
      }, { new: true });
      if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
      return res.json({ message: 'Vehicle loaded successfully', vehicle });
    }

    const vIdx = memoryData.vehicles.findIndex(v => v._id === req.params.id || v.id === req.params.id);
    if (vIdx !== -1) {
      const targetV = memoryData.vehicles[vIdx];
      targetV.currentLoad = cargoDesc;
      targetV.loadWeightKg = weight;
      targetV.loadStatus = 'loaded';
      return res.json({ message: 'Vehicle loaded successfully', vehicle: targetV });
    }
    res.status(404).json({ message: 'Vehicle not found' });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

export default router;
