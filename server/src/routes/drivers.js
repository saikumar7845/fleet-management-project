import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import { auth, allow } from '../middleware/auth.js';

const router = express.Router();
router.use(auth);

import { memoryData } from '../memoryStore.js';

router.get('/', allow('admin', 'manager'), async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const drivers = await User.find({ role: 'driver' }).select('-password').lean();
      const vehicles = await Vehicle.find({ assignedDriver: { $ne: null } }).select('assignedDriver registrationNumber');
      const map = Object.fromEntries(vehicles.map(v => [String(v.assignedDriver), v.registrationNumber]));
      return res.json(drivers.map(d => ({ ...d, assignedVehicle: map[String(d._id)] || null })));
    }
    res.json(memoryData.drivers);
  } catch {
    res.json(memoryData.drivers);
  }
});

router.post('/', allow('admin', 'manager'), async (req, res) => {
  try {
    const { name, email, password = 'Driver@123', phone } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const driver = await User.create({ name, email, password: hash, phone, role: 'driver' });
    res.status(201).json({ id: driver._id, name: driver.name, email: driver.email, phone: driver.phone, role: driver.role });
  } catch (e) { res.status(400).json({ message: e.code === 11000 ? 'Email already exists' : e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const isSelf = String(req.user._id || req.user.id) === String(req.params.id);
    if (!['admin', 'manager'].includes(req.user.role) && !isSelf) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const driver = await User.findOneAndDelete({ _id: req.params.id, role: 'driver' });
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    await Vehicle.updateMany({ assignedDriver: req.params.id }, {
      assignedDriver: null,
      status: 'available',
      loadStatus: 'unloaded',
      currentLoad: 'Empty / Unloaded',
      loadWeightKg: 0
    });
    res.json({ message: 'Driver deleted successfully', id: req.params.id });
  } catch (e) { res.status(400).json({ message: e.message }); }
});

export default router;
