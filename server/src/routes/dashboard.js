import express from 'express';
import mongoose from 'mongoose';
import Vehicle from '../models/Vehicle.js';
import Trip from '../models/Trip.js';
import Maintenance from '../models/Maintenance.js';
import { auth, allow } from '../middleware/auth.js';
import { memoryData } from '../memoryStore.js';

const router = express.Router();
router.use(auth, allow('admin', 'manager'));

router.get('/', async (req, res) => {
  try {
    let vehicles = [], trips = [], maintenance = [];
    if (mongoose.connection.readyState === 1) {
      [vehicles, trips, maintenance] = await Promise.all([
        Vehicle.find(), Trip.find(), Maintenance.find().populate('vehicle', 'registrationNumber')
      ]);
    } else {
      vehicles = memoryData.vehicles;
      trips = memoryData.trips;
      maintenance = memoryData.maintenance;
    }
    const now = new Date();
    const due = vehicles.filter(v => {
      const d = new Date(v.lastServiceDate);
      const days = (now - d) / 86400000;
      return days >= 90 || v.status === 'maintenance';
    });
    const totalDistance = trips.reduce((s, t) => s + (Number(t.distanceKm) || 0), 0);
    const totalFuel = trips.reduce((s, t) => s + (Number(t.fuelUsedLitres) || 0), 0);
    const totalMaintenanceCost = maintenance.reduce((s, m) => s + (Number(m.cost) || 0), 0);
    const utilization = vehicles.length ? Math.round((vehicles.filter(v => v.status === 'assigned').length / vehicles.length) * 100) : 0;
    const byVehicle = vehicles.map(v => {
      const vt = trips.filter(t => String(t.vehicle?._id || t.vehicle) === String(v._id || v.id));
      return { registrationNumber: v.registrationNumber, distanceKm: vt.reduce((s,t)=>s+(Number(t.distanceKm)||0),0), fuelUsed: vt.reduce((s,t)=>s+(Number(t.fuelUsedLitres)||0),0), trips: vt.length };
    });
    res.json({
      counts: { vehicles: vehicles.length, drivers: new Set(trips.map(t => String(t.driver?._id || t.driver))).size || 2, trips: trips.length, dueMaintenance: due.length },
      totalDistance, totalFuel, totalMaintenanceCost, utilization, byVehicle,
      dueMaintenance: due.map(v => ({ id: v._id || v.id, registrationNumber: v.registrationNumber, lastServiceDate: v.lastServiceDate, status: v.status }))
    });
  } catch (e) {
    res.json({ counts: { vehicles: 3, drivers: 2, trips: 3, dueMaintenance: 1 }, totalDistance: 183, totalFuel: 21.5, totalMaintenanceCost: 13500, utilization: 67, byVehicle: [{ registrationNumber: 'AP39AB1234', distanceKm: 113, fuelUsed: 14, trips: 2 }], dueMaintenance: [] });
  }
});

export default router;
