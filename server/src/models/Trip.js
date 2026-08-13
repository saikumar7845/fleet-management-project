import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  startLocation: { type: String, required: true, trim: true },
  endLocation: { type: String, required: true, trim: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  distanceKm: { type: Number, required: true, min: 0 },
  fuelUsedLitres: { type: Number, required: true, min: 0 },
  notes: String,
  cargoDetails: String,
  returnedVehicle: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Trip', tripSchema);
