import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  registrationNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
  type: { type: String, required: true },
  purchaseDate: { type: Date, required: true },
  lastServiceDate: { type: Date, required: true },
  serviceIntervalKm: { type: Number, default: 10000 },
  currentOdometer: { type: Number, default: 0 },
  status: { type: String, enum: ['available', 'assigned', 'maintenance'], default: 'available' },
  assignedDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  currentLoad: { type: String, default: 'Empty / Unloaded' },
  loadWeightKg: { type: Number, default: 0 },
  loadStatus: { type: String, enum: ['unloaded', 'loaded', 'in_transit'], default: 'unloaded' }
}, { timestamps: true });

export default mongoose.model('Vehicle', vehicleSchema);
