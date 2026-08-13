import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';

const router = express.Router();

// Fallback in-memory users for serverless / zero-config environments
const memoryUsers = [];

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
    const cleanEmail = String(email).toLowerCase().trim();

    // 1. Try DB first if connected
    if (mongoose.connection.readyState === 1) {
      try {
        const user = await User.findOne({ email: cleanEmail });
        if (user && user.active && (await bcrypt.compare(password, user.password))) {
          const token = jwt.sign({ id: user._id, role: user.role, email: user.email, name: user.name }, process.env.JWT_SECRET || 'change_this_for_demo', { expiresIn: '8h' });
          return res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
        }
      } catch (dbErr) {
        console.error('DB query error, falling back to memory store:', dbErr.message);
      }
    }

    // 2. Memory store / Demo accounts fallback
    let memUser = memoryUsers.find(u => u.email === cleanEmail);
    if (!memUser) {
      if (cleanEmail === 'admin@fleet.com') {
        memUser = { id: 'admin-id-1', name: 'Fleet Admin', email: 'admin@fleet.com', passwordHash: await bcrypt.hash('Admin@123', 10), role: 'admin' };
        memoryUsers.push(memUser);
      } else if (cleanEmail === 'driver@fleet.com') {
        memUser = { id: 'driver-id-1', name: 'Ravi Kumar', email: 'driver@fleet.com', passwordHash: await bcrypt.hash('Driver@123', 10), role: 'driver' };
        memoryUsers.push(memUser);
      }
    }

    if (memUser) {
      const match = memUser.password ? await bcrypt.compare(password, memUser.password) : (memUser.passwordHash ? await bcrypt.compare(password, memUser.passwordHash) : false);
      if (match || (cleanEmail === 'admin@fleet.com' && password === 'Admin@123') || (cleanEmail === 'driver@fleet.com' && password === 'Driver@123')) {
        const token = jwt.sign({ id: memUser.id, role: memUser.role, email: memUser.email, name: memUser.name }, process.env.JWT_SECRET || 'change_this_for_demo', { expiresIn: '8h' });
        return res.json({ token, user: { id: memUser.id, name: memUser.name, email: memUser.email, role: memUser.role } });
      }
    }

    // Fallback direct check for demo accounts if DB or memory lookup didn't match
    if ((cleanEmail === 'admin@fleet.com' && password === 'Admin@123') || (cleanEmail === 'driver@fleet.com' && password === 'Driver@123')) {
      const role = cleanEmail.startsWith('admin') ? 'admin' : 'driver';
      const name = role === 'admin' ? 'Fleet Admin' : 'Ravi Kumar';
      const token = jwt.sign({ id: `${role}-id-1`, role, email: cleanEmail, name }, process.env.JWT_SECRET || 'change_this_for_demo', { expiresIn: '8h' });
      return res.json({ token, user: { id: `${role}-id-1`, name, email: cleanEmail, role } });
    }

    return res.status(401).json({ message: 'Invalid credentials' });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Internal server error' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    const cleanEmail = email.toLowerCase().trim();

    if (mongoose.connection.readyState === 1) {
      try {
        const existing = await User.findOne({ email: cleanEmail });
        if (existing) return res.status(400).json({ message: 'Email already registered' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
          name,
          email: cleanEmail,
          phone: phone || '',
          password: hashedPassword,
          role: 'driver'
        });
        const token = jwt.sign({ id: user._id, role: user.role, email: user.email, name: user.name }, process.env.JWT_SECRET || 'change_this_for_demo', { expiresIn: '8h' });
        return res.status(201).json({
          message: 'Registered successfully with restricted driver access',
          token,
          user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
      } catch (dbErr) {
        console.error('DB create error, falling back to memory store:', dbErr.message);
      }
    }

    // Memory store fallback
    if (memoryUsers.some(u => u.email === cleanEmail) || cleanEmail === 'admin@fleet.com' || cleanEmail === 'driver@fleet.com') {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: 'user-' + Date.now(), name, email: cleanEmail, phone: phone || '', password: hashedPassword, role: 'driver' };
    memoryUsers.push(newUser);

    const token = jwt.sign({ id: newUser.id, role: newUser.role, email: newUser.email, name: newUser.name }, process.env.JWT_SECRET || 'change_this_for_demo', { expiresIn: '8h' });
    res.status(201).json({
      message: 'Registered successfully with restricted driver access',
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
