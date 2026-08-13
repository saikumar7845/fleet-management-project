import mongoose from 'mongoose';
import { seedInitialData } from './seed.js';

let mongoMemoryServer = null;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (uri) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
      console.log('MongoDB connected successfully');
      await seedInitialData(false);
      return;
    } catch (err) {
      console.error('MongoDB Atlas Connection Error:', err.message);
    }
  }

  // Local / Development in-memory fallback
  if (!process.env.VERCEL) {
    try {
      const localUri = 'mongodb://127.0.0.1:27017/fleet_management';
      await mongoose.connect(localUri, { serverSelectionTimeoutMS: 1500 });
      console.log('Local MongoDB connected');
      await seedInitialData(false);
      return;
    } catch (e) {
      console.log('Starting In-Memory MongoDB Server...');
      try {
        if (!mongoMemoryServer) {
          const { MongoMemoryServer } = await import('mongodb-memory-server');
          mongoMemoryServer = await MongoMemoryServer.create({
            binary: { version: '6.0.14' }
          });
        }
        const memUri = mongoMemoryServer.getUri();
        await mongoose.connect(memUri);
        console.log('In-Memory MongoDB connected at:', memUri);
        await seedInitialData(false);
      } catch (memErr) {
        console.error('In-Memory MongoDB start error:', memErr.message);
      }
    }
  }
}


