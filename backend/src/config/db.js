import mongoose from 'mongoose';

/**
 * Connects to MongoDB using MONGODB_URI.
 */
export async function connectDatabase(uri = process.env.MONGODB_URI) {
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not defined.');
  }

  mongoose.set('strictQuery', true);
  const conn = await mongoose.connect(uri);
  return conn;
}
