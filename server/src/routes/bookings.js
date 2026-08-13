import express from 'express';
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Hotel from '../models/Hotel.js';
import { memoryData } from '../memoryStore.js';

const router = express.Router();

// GET all bookings
router.get('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const bookings = await Booking.find().populate('hotel').sort({ createdAt: -1 });
      return res.json(bookings);
    }
    res.json(memoryData.bookings);
  } catch (e) {
    res.json(memoryData.bookings);
  }
});

// POST create booking
router.post('/', async (req, res) => {
  try {
    const { guestName, guestEmail, guestPhone, hotelId, hotelName, roomType, checkIn, checkOut, totalPrice } = req.body;
    if (!guestName || !guestEmail || (!hotelId && !hotelName) || !checkIn || !checkOut) {
      return res.status(400).json({ message: 'Missing required reservation fields' });
    }

    if (mongoose.connection.readyState === 1) {
      const newBooking = await Booking.create({
        guestName,
        guestEmail,
        guestPhone: guestPhone || '9999999999',
        hotel: mongoose.Types.ObjectId.isValid(hotelId) ? hotelId : undefined,
        hotelName: hotelName || 'Grand Hotel Suite',
        roomType: roomType || 'Standard Deluxe',
        checkIn,
        checkOut,
        totalPrice: Number(totalPrice) || 5000,
        status: 'Confirmed'
      });
      if (mongoose.Types.ObjectId.isValid(hotelId)) {
        await Hotel.findByIdAndUpdate(hotelId, { $inc: { availableRooms: -1 } });
      }
      return res.status(201).json(newBooking);
    }

    // Memory fallback
    const targetHotel = memoryData.hotels.find(h => h._id === hotelId || h.id === hotelId);
    if (targetHotel && targetHotel.availableRooms > 0) {
      targetHotel.availableRooms -= 1;
    }

    const memBooking = {
      _id: 'b-' + Date.now(),
      id: 'b-' + Date.now(),
      guestName,
      guestEmail,
      guestPhone: guestPhone || '9999999999',
      hotelId: hotelId || targetHotel?._id || 'h1',
      hotelName: hotelName || targetHotel?.name || 'Grand Hyatt Executive Resort',
      roomType: roomType || 'Standard Deluxe',
      checkIn,
      checkOut,
      totalPrice: Number(totalPrice) || 5000,
      status: 'Confirmed'
    };
    memoryData.bookings.unshift(memBooking);
    res.status(201).json(memBooking);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// PUT update status (Check-in, Check-out, Cancel)
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (mongoose.connection.readyState === 1) {
      const updated = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });
      if (!updated) return res.status(404).json({ message: 'Booking not found' });
      return res.json(updated);
    }

    const idx = memoryData.bookings.findIndex(b => b._id === req.params.id || b.id === req.params.id);
    if (idx !== -1) {
      memoryData.bookings[idx].status = status;
      return res.json(memoryData.bookings[idx]);
    }
    res.status(404).json({ message: 'Booking not found' });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// DELETE booking
router.delete('/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const deleted = await Booking.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ message: 'Booking not found' });
      return res.json({ message: 'Booking cancelled and deleted successfully', id: req.params.id });
    }

    const idx = memoryData.bookings.findIndex(b => b._id === req.params.id || b.id === req.params.id);
    if (idx !== -1) {
      memoryData.bookings.splice(idx, 1);
      return res.json({ message: 'Booking cancelled and deleted successfully', id: req.params.id });
    }
    res.status(404).json({ message: 'Booking not found' });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

export default router;
