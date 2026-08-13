import express from 'express';
import mongoose from 'mongoose';
import Hotel from '../models/Hotel.js';
import { memoryData } from '../memoryStore.js';

const router = express.Router();

// GET all hotels (matching my-json-server / saikumar7845/hotel- endpoint structure)
router.get('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const hotels = await Hotel.find().sort({ createdAt: -1 });
      return res.json(hotels);
    }
    res.json(memoryData.hotels);
  } catch (e) {
    res.json(memoryData.hotels);
  }
});

// GET single hotel
router.get('/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const hotel = await Hotel.findById(req.params.id);
      if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
      return res.json(hotel);
    }
    const h = memoryData.hotels.find(item => item._id === req.params.id || item.id === req.params.id);
    if (!h) return res.status(404).json({ message: 'Hotel not found' });
    res.json(h);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST create hotel
router.post('/', async (req, res) => {
  try {
    const { name, city, address, totalRooms, pricePerNight, rating, image, status } = req.body;
    if (!name || !city || !pricePerNight) {
      return res.status(400).json({ message: 'Hotel name, city and price per night are required' });
    }

    if (mongoose.connection.readyState === 1) {
      const newHotel = await Hotel.create({
        name,
        city,
        address: address || `${city} Main Road`,
        totalRooms: Number(totalRooms) || 50,
        availableRooms: Number(totalRooms) || 50,
        pricePerNight: Number(pricePerNight),
        rating: Number(rating) || 4.5,
        status: status || 'Active',
        image: image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'
      });
      return res.status(201).json(newHotel);
    }

    // Memory fallback
    const memHotel = {
      _id: 'h-' + Date.now(),
      id: 'h-' + Date.now(),
      name,
      city,
      address: address || `${city} Main Road`,
      totalRooms: Number(totalRooms) || 50,
      availableRooms: Number(totalRooms) || 50,
      pricePerNight: Number(pricePerNight),
      rating: Number(rating) || 4.5,
      status: status || 'Active',
      image: image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'
    };
    memoryData.hotels.unshift(memHotel);
    res.status(201).json(memHotel);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// PUT update hotel
router.put('/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const updated = await Hotel.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!updated) return res.status(404).json({ message: 'Hotel not found' });
      return res.json(updated);
    }

    const idx = memoryData.hotels.findIndex(h => h._id === req.params.id || h.id === req.params.id);
    if (idx !== -1) {
      memoryData.hotels[idx] = { ...memoryData.hotels[idx], ...req.body };
      return res.json(memoryData.hotels[idx]);
    }
    res.status(404).json({ message: 'Hotel not found' });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// DELETE hotel
router.delete('/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const deleted = await Hotel.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ message: 'Hotel not found' });
      return res.json({ message: 'Hotel deleted successfully', id: req.params.id });
    }

    const idx = memoryData.hotels.findIndex(h => h._id === req.params.id || h.id === req.params.id);
    if (idx !== -1) {
      memoryData.hotels.splice(idx, 1);
      return res.json({ message: 'Hotel deleted successfully', id: req.params.id });
    }
    res.status(404).json({ message: 'Hotel not found' });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

export default router;
