import express from 'express';
import Maintenance from '../models/Maintenance.js';
import Vehicle from '../models/Vehicle.js';
import { auth, allow } from '../middleware/auth.js';

const router = express.Router();
router.use(auth);

router.get('/', async (req, res) => {
  const records = await Maintenance.find().populate('vehicle', 'registrationNumber type').sort({ serviceDate: -1 });
  res.json(records);
});

router.post('/', allow('admin', 'manager'), async (req, res) => {
  try {
    const { vehicle, serviceDate, serviceType, cost, nextServiceDate, notes } = req.body;
    if (!vehicle || !serviceDate || !serviceType || cost === undefined || cost === null || cost === '' || !nextServiceDate) {
      return res.status(400).json({ message: 'Missing required maintenance fields' });
    }
    const record = await Maintenance.create({
      vehicle,
      serviceDate,
      serviceType,
      cost: Number(cost),
      nextServiceDate,
      notes: notes || '',
      status: 'in_maintenance'
    });
    await Vehicle.findByIdAndUpdate(vehicle, { lastServiceDate: serviceDate, status: 'maintenance' });
    const populated = await record.populate('vehicle', 'registrationNumber type');
    res.status(201).json(populated);
  } catch (e) {
    res.status(400).json({ message: e.message || 'Failed to save maintenance record' });
  }
});

router.post('/:id/release', allow('admin', 'manager'), async (req, res) => {
  try {
    const record = await Maintenance.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Maintenance record not found' });

    record.status = 'released';
    await record.save();

    const vehicle = await Vehicle.findByIdAndUpdate(record.vehicle, {
      status: 'available',
      lastServiceDate: new Date(),
      currentOdometer: 0
    }, { new: true });

    res.json({
      message: `Vehicle ${vehicle?.registrationNumber || ''} successfully released from maintenance and ready for operations`,
      maintenance: record,
      vehicle
    });
  } catch (e) {
    res.status(400).json({ message: e.message || 'Failed to release vehicle from maintenance' });
  }
});

router.delete('/:id', allow('admin', 'manager'), async (req, res) => {
  try {
    const record = await Maintenance.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ message: 'Maintenance record not found' });
    res.json({ message: 'Maintenance record deleted successfully', id: req.params.id });
  } catch (e) {
    res.status(400).json({ message: e.message || 'Failed to delete maintenance record' });
  }
});

export default router;

