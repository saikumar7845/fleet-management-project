import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import { auth, allow } from '../middleware/auth.js';
import { memoryData } from '../memoryStore.js';

const router = express.Router();
router.use(auth);

router.get('/', allow('admin', 'manager'), async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const drivers = await User.find({ role: 'driver' }).select('-password').lean();
      const vehicles = await Vehicle.find({ assignedDriver: { $ne: null } }).select('assignedDriver registrationNumber');
      const map = Object.fromEntries(vehicles.map(v => [String(v.assignedDriver), v.registrationNumber]));
      return res.json(drivers.map(d => ({ ...d, assignedVehicle: map[String(d._id)] || null })));
    }
    res.json(memoryData.drivers);
  } catch (e) {
    res.json(memoryData.drivers);
  }
});

router.post('/', allow('admin', 'manager'), async (req, res) => {
  try {
    const { name, email, password = 'Driver@123', phone } = req.body || {};
    const cleanEmail = email ? String(email).toLowerCase().trim() : '';

    if (!name || !cleanEmail) {
      return res.status(400).json({ message: 'Driver name and email are required' });
    }

    if (mongoose.connection.readyState === 1) {
      const hash = await bcrypt.hash(password, 10);
      const driver = await User.create({ name, email: cleanEmail, password: hash, phone: phone || '', role: 'driver' });
      return res.status(201).json({ id: driver._id, _id: driver._id, name: driver.name, email: driver.email, phone: driver.phone, role: driver.role });
    }

    // Memory fallback
    if (memoryData.drivers.some(d => d.email === cleanEmail)) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 10);
    const newDriver = {
      _id: 'd-' + Date.now(),
      id: 'd-' + Date.now(),
      name,
      email: cleanEmail,
      passwordHash: hash,
      password: hash,
      plainPassword: password,
      phone: phone || '',
      role: 'driver',
      active: true,
      assignedVehicle: null
    };
    memoryData.drivers.unshift(newDriver);
    res.status(201).json(newDriver);
  } catch (e) {
    res.status(400).json({ message: e.code === 11000 ? 'Email already exists' : e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const isSelf = String(req.user._id || req.user.id) === String(req.params.id);
    if (!['admin', 'manager'].includes(req.user.role) && !isSelf) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (mongoose.connection.readyState === 1) {
      const driver = await User.findOneAndDelete({ _id: req.params.id, role: 'driver' });
      if (!driver) return res.status(404).json({ message: 'Driver not found' });
      await Vehicle.updateMany({ assignedDriver: req.params.id }, {
        assignedDriver: null,
        status: 'available',
        loadStatus: 'unloaded',
        currentLoad: 'Empty / Unloaded',
        loadWeightKg: 0
      });
      return res.json({ message: 'Driver deleted successfully', id: req.params.id });
    }

    // Memory fallback
    const idx = memoryData.drivers.findIndex(d => d._id === req.params.id || d.id === req.params.id || String(d._id || d.id) === String(req.params.id));
    if (idx !== -1) {
      const d = memoryData.drivers[idx];
      memoryData.vehicles.forEach(v => {
        if (v.assignedDriver && (v.assignedDriver._id === d._id || v.assignedDriver.id === d.id || v.assignedDriver.email === d.email)) {
          v.assignedDriver = null;
          v.status = 'available';
          v.loadStatus = 'unloaded';
          v.currentLoad = 'Empty / Unloaded';
          v.loadWeightKg = 0;
        }
      });
      memoryData.drivers.splice(idx, 1);
    }
    res.json({ message: 'Driver deleted successfully', id: req.params.id });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

export default router;
