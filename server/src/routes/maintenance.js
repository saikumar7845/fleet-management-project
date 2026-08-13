import express from 'express';
import mongoose from 'mongoose';
import Maintenance from '../models/Maintenance.js';
import Vehicle from '../models/Vehicle.js';
import { auth, allow } from '../middleware/auth.js';
import { memoryData } from '../memoryStore.js';

const router = express.Router();
router.use(auth);

router.get('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const records = await Maintenance.find().populate('vehicle', 'registrationNumber type').sort({ serviceDate: -1 });
      return res.json(records);
    }
    res.json(memoryData.maintenance);
  } catch {
    res.json(memoryData.maintenance);
  }
});

router.post('/', allow('admin', 'manager'), async (req, res) => {
  try {
    const { vehicle, serviceDate, serviceType, cost, nextServiceDate, notes } = req.body;
    if (!vehicle || !serviceDate || !serviceType || cost === undefined || cost === null || cost === '' || !nextServiceDate) {
      return res.status(400).json({ message: 'Missing required maintenance fields' });
    }

    if (mongoose.connection.readyState === 1) {
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
      return res.status(201).json(populated);
    }

    // Serverless memory fallback
    const targetVehicle = memoryData.vehicles.find(v => v._id === vehicle || v.id === vehicle || String(v._id || v.id) === String(vehicle));
    if (targetVehicle) {
      targetVehicle.status = 'maintenance';
      targetVehicle.lastServiceDate = serviceDate;
    }
    const newRecord = {
      _id: 'm-' + Date.now(),
      id: 'm-' + Date.now(),
      vehicle: targetVehicle || { _id: vehicle, registrationNumber: 'Vehicle' },
      serviceDate,
      serviceType,
      cost: Number(cost),
      nextServiceDate,
      notes: notes || '',
      status: 'in_maintenance'
    };
    memoryData.maintenance.unshift(newRecord);
    res.status(201).json(newRecord);
  } catch (e) {
    res.status(400).json({ message: e.message || 'Failed to save maintenance record' });
  }
});

router.post('/:id/release', allow('admin', 'manager'), async (req, res) => {
  try {
    const maintId = req.params.id;

    if (mongoose.connection.readyState === 1) {
      const record = await Maintenance.findById(maintId);
      if (!record) return res.status(404).json({ message: 'Maintenance record not found' });

      record.status = 'released';
      await record.save();

      const vehicle = await Vehicle.findByIdAndUpdate(record.vehicle, {
        status: 'available',
        lastServiceDate: new Date(),
        currentOdometer: 0
      }, { new: true });

      return res.json({
        message: `Vehicle ${vehicle?.registrationNumber || ''} successfully released from maintenance and ready for operations`,
        maintenance: record,
        vehicle
      });
    }

    // Serverless memory fallback
    const record = memoryData.maintenance.find(m => m._id === maintId || m.id === maintId || String(m._id || m.id) === String(maintId));
    const targetVId = record?.vehicle?._id || record?.vehicle?.id || record?.vehicle;
    const targetVehicle = memoryData.vehicles.find(v => v._id === targetVId || v.id === targetVId || String(v._id || v.id) === String(targetVId));

    if (record) {
      record.status = 'released';
    }
    if (targetVehicle) {
      targetVehicle.status = 'available';
      targetVehicle.lastServiceDate = new Date().toISOString().split('T')[0];
    }

    res.json({
      message: `Vehicle ${targetVehicle?.registrationNumber || ''} successfully released from maintenance and ready for operations`,
      maintenance: record || { id: maintId, status: 'released' },
      vehicle: targetVehicle
    });
  } catch (e) {
    res.status(400).json({ message: e.message || 'Failed to release vehicle from maintenance' });
  }
});

router.delete('/:id', allow('admin', 'manager'), async (req, res) => {
  try {
    const maintId = req.params.id;
    if (mongoose.connection.readyState === 1) {
      const record = await Maintenance.findByIdAndDelete(maintId);
      if (!record) return res.status(404).json({ message: 'Maintenance record not found' });
      return res.json({ message: 'Maintenance record deleted successfully', id: maintId });
    }

    // Memory fallback
    const idx = memoryData.maintenance.findIndex(m => m._id === maintId || m.id === maintId || String(m._id || m.id) === String(maintId));
    if (idx !== -1) {
      memoryData.maintenance.splice(idx, 1);
    }
    res.json({ message: 'Maintenance record deleted successfully', id: maintId });
  } catch (e) {
    res.status(400).json({ message: e.message || 'Failed to delete maintenance record' });
  }
});

export default router;
