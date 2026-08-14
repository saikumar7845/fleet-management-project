import express from 'express';
import mongoose from 'mongoose';
import Trip from '../models/Trip.js';
import Vehicle from '../models/Vehicle.js';
import { auth, allow } from '../middleware/auth.js';
import { memoryData } from '../memoryStore.js';

const router = express.Router();
router.use(auth);

router.get('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const filter = req.user.role === 'driver' ? { driver: req.user._id } : {};
      const trips = await Trip.find(filter).populate('driver', 'name').populate('vehicle', 'registrationNumber type').sort({ startTime: -1 });
      return res.json(trips);
    }
    res.json(memoryData.trips);
  } catch (e) {
    res.json(memoryData.trips);
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.user.role === 'driver') data.driver = req.user._id || req.user.id;

    if (mongoose.connection.readyState === 1) {
      const vehicle = await Vehicle.findById(data.vehicle);
      if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
      if (req.user.role === 'driver' && String(vehicle.assignedDriver) !== String(req.user._id)) {
        return res.status(403).json({ message: 'Vehicle is not assigned to you' });
      }
      data.returnedVehicle = true;
      const trip = await Trip.create(data);
      await Vehicle.findByIdAndUpdate(vehicle._id, {
        $inc: { currentOdometer: Number(data.distanceKm) || 0 }
      });
      return res.status(201).json(await trip.populate([{ path: 'driver', select: 'name' }, { path: 'vehicle', select: 'registrationNumber type' }]));
    }

    // Memory fallback
    const targetV = memoryData.vehicles.find(v => v._id === data.vehicle || v.id === data.vehicle);
    if (targetV) {
      targetV.currentOdometer = (targetV.currentOdometer || 0) + (Number(data.distanceKm) || 0);
    }

    const newTrip = {
      _id: 't-' + Date.now(),
      id: 't-' + Date.now(),
      driver: { _id: req.user._id || req.user.id, name: req.user.name || 'Driver' },
      vehicle: targetV ? { _id: targetV._id, registrationNumber: targetV.registrationNumber } : { registrationNumber: 'Vehicle' },
      startLocation: data.startLocation || 'Vijayawada',
      endLocation: data.endLocation || 'Guntur',
      distanceKm: Number(data.distanceKm) || 50,
      fuelUsedLitres: Number(data.fuelUsedLitres) || 6,
      startTime: data.startTime || new Date().toISOString(),
      endTime: data.endTime || new Date().toISOString()
    };
    memoryData.trips.unshift(newTrip);
    res.status(201).json(newTrip);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.get('/vehicle/:vehicleId', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const trips = await Trip.find({ vehicle: req.params.vehicleId }).populate('driver', 'name').sort({ startTime: -1 });
      return res.json(trips);
    }
    const filtered = memoryData.trips.filter(t => t.vehicle?._id === req.params.vehicleId || t.vehicle?.id === req.params.vehicleId || String(t.vehicle) === String(req.params.id));
    res.json(filtered);
  } catch (e) {
    res.json([]);
  }
});

export default router;
