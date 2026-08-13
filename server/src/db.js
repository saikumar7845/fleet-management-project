import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { seedInitialData } from './seed.js';

let mongoMemoryServer = null;

export async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fleet_management';
  try {
    await Promise.race([
      mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 3000))
    ]);
    console.log('MongoDB connected:', uri);
  } catch (err) {
    console.log('Local MongoDB not reachable. Starting In-Memory MongoDB Server...');
    try {
      mongoMemoryServer = await MongoMemoryServer.create({
        binary: { version: '6.0.14' }
      });
      const memUri = mongoMemoryServer.getUri();
      await mongoose.connect(memUri);
      console.log('In-Memory MongoDB connected at:', memUri);
    } catch (memErr) {
      console.error('Failed to start In-Memory MongoDB:', memErr.message);
      throw memErr;
    }
  }
  await seedInitialData(false);
}


