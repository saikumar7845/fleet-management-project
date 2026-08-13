import mongoose from 'mongoose';

const hotelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  city: { type: String, required: true },
  address: { type: String, required: true },
  totalRooms: { type: Number, required: true, default: 50 },
  availableRooms: { type: Number, required: true, default: 50 },
  pricePerNight: { type: Number, required: true },
  rating: { type: Number, default: 4.5 },
  status: { type: String, enum: ['Active', 'Renovation', 'Closed'], default: 'Active' },
  image: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Hotel', hotelSchema);
