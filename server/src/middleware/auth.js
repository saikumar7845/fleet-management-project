import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';

export async function auth(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Authentication required' });
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'change_this_for_demo');

    let user = null;
    if (mongoose.connection.readyState === 1) {
      try {
        user = await User.findById(payload.id).select('-password');
      } catch (err) {
        console.error('Auth DB fetch error:', err.message);
      }
    }
    if (!user) {
      user = { _id: payload.id, role: payload.role || 'admin', active: true, name: payload.name || 'User', email: payload.email || 'user@fleet.com' };
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function allow(...roles) {
  return (req, res, next) => roles.includes(req.user.role)
    ? next()
    : res.status(403).json({ message: 'Access denied for this role' });
}
