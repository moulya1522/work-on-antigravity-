import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/db.js';
import { bootstrapDatabase, SAMPLE_UNFAZED_PROJECT } from '../utils/bootstrap.js';
import Project from '../models/Project.js';

async function runSeed() {
  await connectDatabase();
  await bootstrapDatabase();

  const existing = await Project.findOne({ slug: SAMPLE_UNFAZED_PROJECT.slug });
  if (!existing) {
    await Project.create(SAMPLE_UNFAZED_PROJECT);
    console.log('Seeded sample project: UNFAZED');
  } else {
    console.log('Sample project UNFAZED already exists.');
  }

  await mongoose.disconnect();
}

runSeed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
