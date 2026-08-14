import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDB } from './db.js';
import User from './models/User.js';
import Vehicle from './models/Vehicle.js';
import Trip from './models/Trip.js';
import Maintenance from './models/Maintenance.js';

export async function seedInitialData(force = false) {
  if (!force) {
    const count = await User.countDocuments();
    if (count > 0) return;
  }
  await Promise.all([User.deleteMany({}), Vehicle.deleteMany({}), Trip.deleteMany({}), Maintenance.deleteMany({})]);
  const admin = await User.create({ name: 'Fleet Admin', email: 'admin@fleet.com', password: await bcrypt.hash('Admin@123',10), role: 'admin', phone: '9000000001' });
  const driver = await User.create({ name: 'Ravi Kumar', email: 'driver@fleet.com', password: await bcrypt.hash('Driver@123',10), role: 'driver', phone: '9000000002' });
  const d2 = await User.create({ name: 'Priya Sharma', email: 'priya@fleet.com', password: await bcrypt.hash('Driver@123',10), role: 'driver', phone: '9000000003' });
  const today = new Date();
  const daysAgo = n => new Date(Date.now() - n*86400000);
  const v1 = await Vehicle.create({ registrationNumber:'AP39AB1234', type:'Delivery Van', purchaseDate:daysAgo(900), lastServiceDate:daysAgo(25), currentOdometer:45200, status:'available', assignedDriver:null });
  const v2 = await Vehicle.create({ registrationNumber:'AP40CD5678', type:'Field Service Car', purchaseDate:daysAgo(600), lastServiceDate:daysAgo(105), currentOdometer:38100, status:'available', assignedDriver:null });
  const v3 = await Vehicle.create({ registrationNumber:'AP41EF9012', type:'Pickup Truck', purchaseDate:daysAgo(1200), lastServiceDate:daysAgo(45), currentOdometer:67000, status:'available' });
  await Trip.create([
   { driver:driver._id, vehicle:v1._id, startLocation:'Vijayawada', endLocation:'Guntur', startTime:daysAgo(2), endTime:new Date(Date.now()-2*86400000+2*3600000), distanceKm:65, fuelUsedLitres:8 },
   { driver:driver._id, vehicle:v1._id, startLocation:'Guntur', endLocation:'Tenali', startTime:daysAgo(1), endTime:new Date(Date.now()-86400000+90*60000), distanceKm:48, fuelUsedLitres:6 },
   { driver:d2._id, vehicle:v2._id, startLocation:'Visakhapatnam', endLocation:'Anakapalle', startTime:daysAgo(3), endTime:new Date(Date.now()-3*86400000+2*3600000), distanceKm:70, fuelUsedLitres:7.5 }
  ]);
  await Maintenance.create([
   { vehicle:v1._id, serviceDate:daysAgo(25), serviceType:'Oil & Filter', cost:3200, nextServiceDate:new Date(Date.now()+65*86400000), notes:'Routine service' },
   { vehicle:v2._id, serviceDate:daysAgo(105), serviceType:'Full Service', cost:8500, nextServiceDate:today, notes:'Service overdue' },
   { vehicle:v3._id, serviceDate:daysAgo(45), serviceType:'Brake Inspection', cost:1800, nextServiceDate:new Date(Date.now()+45*86400000) }
  ]);
  console.log('Seed complete');
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  await connectDB();
  await seedInitialData(true);
  process.exit(0);
}

