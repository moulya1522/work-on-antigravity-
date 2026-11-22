const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/n_cafe_db';

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000
    });
    isConnected = true;
    console.log(`[MongoDB] Successfully connected to database: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    console.warn(`[MongoDB] Notice: Could not connect to MongoDB at "${mongoUri}".`);
    console.log(`[N CAFÉ Data Engine] Operating in High-Speed Local JSON Persistence Mode (backend/data/).`);
    console.log(`[N CAFÉ Data Engine] To connect to MongoDB Atlas, set MONGODB_URI in backend/.env`);
    isConnected = false;
  }
};

module.exports = connectDB;
