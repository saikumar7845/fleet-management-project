import express from 'express';
import Vehicle from '../models/Vehicle.js';
import Trip from '../models/Trip.js';
import Maintenance from '../models/Maintenance.js';
import { auth, allow } from '../middleware/auth.js';

const router = express.Router();
router.use(auth, allow('admin', 'manager'));

router.get('/', async (req, res) => {
  const [vehicles, trips, maintenance] = await Promise.all([
    Vehicle.find(), Trip.find(), Maintenance.find().populate('vehicle', 'registrationNumber')
  ]);
  const now = new Date();
  const due = vehicles.filter(v => {
    const d = new Date(v.lastServiceDate);
    const days = (now - d) / 86400000;
    return days >= 90 || v.status === 'maintenance';
  });
  const totalDistance = trips.reduce((s, t) => s + t.distanceKm, 0);
  const totalFuel = trips.reduce((s, t) => s + t.fuelUsedLitres, 0);
  const totalMaintenanceCost = maintenance.reduce((s, m) => s + m.cost, 0);
  const utilization = vehicles.length ? Math.round((vehicles.filter(v => v.status === 'assigned').length / vehicles.length) * 100) : 0;
  const byVehicle = vehicles.map(v => {
    const vt = trips.filter(t => String(t.vehicle) === String(v._id));
    return { registrationNumber: v.registrationNumber, distanceKm: vt.reduce((s,t)=>s+t.distanceKm,0), fuelUsed: vt.reduce((s,t)=>s+t.fuelUsedLitres,0), trips: vt.length };
  });
  res.json({ counts: { vehicles: vehicles.length, drivers: new Set(trips.map(t => String(t.driver))).size, trips: trips.length, dueMaintenance: due.length }, totalDistance, totalFuel, totalMaintenanceCost, utilization, byVehicle, dueMaintenance: due.map(v => ({ id: v._id, registrationNumber: v.registrationNumber, lastServiceDate: v.lastServiceDate, status: v.status })) });
});

export default router;
