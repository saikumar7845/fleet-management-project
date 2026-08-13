import express from 'express';
import Trip from '../models/Trip.js';
import Vehicle from '../models/Vehicle.js';
import { auth, allow } from '../middleware/auth.js';

const router = express.Router();
router.use(auth);

router.get('/', async (req, res) => {
  const filter = req.user.role === 'driver' ? { driver: req.user._id } : {};
  const trips = await Trip.find(filter).populate('driver', 'name').populate('vehicle', 'registrationNumber type').sort({ startTime: -1 });
  res.json(trips);
});

router.post('/', auth, async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.user.role === 'driver') data.driver = req.user._id;
    const vehicle = await Vehicle.findById(data.vehicle);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    if (req.user.role === 'driver' && String(vehicle.assignedDriver) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Vehicle is not assigned to you' });
    }
    data.returnedVehicle = true;
    const trip = await Trip.create(data);
    await Vehicle.findByIdAndUpdate(vehicle._id, {
      $inc: { currentOdometer: Number(data.distanceKm) || 0 },
      assignedDriver: null,
      status: 'available',
      loadStatus: 'unloaded',
      currentLoad: 'Empty / Unloaded',
      loadWeightKg: 0
    });
    res.status(201).json(await trip.populate([{ path: 'driver', select: 'name' }, { path: 'vehicle', select: 'registrationNumber type' }]));
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.get('/vehicle/:vehicleId', async (req, res) => {
  const trips = await Trip.find({ vehicle: req.params.vehicleId }).populate('driver', 'name').sort({ startTime: -1 });
  res.json(trips);
});

export default router;
