import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoMemoryServer } from 'mongodb-memory-server-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

let mongod = null;

export const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;
    
    if (!uri) {
      console.log('MONGODB_URI not found in .env, starting Memory Server...');
      mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
    }

    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      if (mongod) {
        console.log('Using in-memory MongoDB. Data will NOT persist across restarts.');
      } else {
        console.log('Data will now persist after closing the server!');
      }
    } catch (err) {
      if (!mongod) {
        console.warn(`Failed to connect to local MongoDB (${err.message}). Falling back to Memory Server...`);
        mongod = await MongoMemoryServer.create();
        uri = mongod.getUri();
        const conn = await mongoose.connect(uri);
        console.log(`MongoDB Connected (Memory): ${conn.connection.host}`);
      } else {
        throw err;
      }
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};
