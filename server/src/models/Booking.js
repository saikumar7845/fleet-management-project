import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  guestName: { type: String, required: true },
  guestEmail: { type: String, required: true },
  guestPhone: { type: String, required: true },
  hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' },
  hotelName: { type: String, required: true },
  roomType: { type: String, required: true, default: 'Standard Room' },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ['Confirmed', 'Checked-in', 'Checked-out', 'Cancelled'], default: 'Confirmed' }
}, { timestamps: true });

export default mongoose.model('Booking', bookingSchema);
