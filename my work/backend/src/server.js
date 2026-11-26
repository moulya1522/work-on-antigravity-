import 'dotenv/config';
import { createApp } from './app.js';
import { connectDatabase } from './config/db.js';
import { bootstrapDatabase } from './utils/bootstrap.js';

const PORT = Number(process.env.PORT) || 5000;

async function start() {
  try {
    await connectDatabase();
    console.log('Connected to MongoDB.');
    await bootstrapDatabase();

    const app = createApp();
    app.listen(PORT, () => {
      console.log(`PROJECT VAULT API running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
