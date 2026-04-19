import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { seed } from './seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

let mongod = null;

export const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;
    
    // Check if we should use memory server
    if (!uri || uri.includes('127.0.0.1:27017')) {
      console.log('No external MongoDB URI found or using default local. Starting MongoMemoryServer...');
      mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      console.log(`MongoMemoryServer started at: ${uri}`);
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Seed data if using memory server
    if (mongod) {
      console.log('Seeding initial data to memory server...');
      await seed();
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    if (mongod) await mongod.stop();
    process.exit(1);
  }
};
