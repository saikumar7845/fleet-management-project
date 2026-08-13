import mongoose from 'mongoose';

const maintenanceSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  serviceDate: { type: Date, required: true },
  serviceType: { type: String, required: true },
  cost: { type: Number, required: true, min: 0 },
  nextServiceDate: { type: Date, required: true },
  notes: String,
  status: { type: String, enum: ['in_maintenance', 'released'], default: 'in_maintenance' }
}, { timestamps: true });

export default mongoose.model('Maintenance', maintenanceSchema);
