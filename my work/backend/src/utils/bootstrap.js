import bcrypt from 'bcryptjs';
import Admin from '../models/Admin.js';
import Profile from '../models/Profile.js';
import Project from '../models/Project.js';

export const SAMPLE_UNFAZED_PROJECT = {
  name: 'UNFAZED',
  slug: 'unfazed',
  date: new Date('2026-10-01T00:00:00.000Z'),
  shortDescription:
    'A therapist and client management platform with appointment scheduling, client management, session notes, payments, and related functionality.',
  detailedDescription:
    'UNFAZED is a therapist and client management platform built to streamline practice workflows including appointment scheduling, client management, structured session notes, and payment tracking.',
  technologies: ['React', 'Node.js', 'Express.js', 'MongoDB'],
  status: 'Completed',
  notes: 'Sample starter project. You can edit or delete it anytime from the Admin Dashboard.',
};

/**
 * Ensures initial Admin account and default Profile exist in MongoDB.
 * Reads admin credentials strictly from environment variables.
 */
export async function bootstrapDatabase() {
  const adminCount = await Admin.countDocuments();
  if (adminCount === 0) {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const username = process.env.ADMIN_USERNAME?.trim().toLowerCase() || 'admin';
    const password = process.env.ADMIN_PASSWORD;

    if (email && password) {
      const passwordHash = await bcrypt.hash(password, 12);
      await Admin.create({ email, username, passwordHash });
      console.log(`Initial administrator account created for ${email}`);
    } else {
      console.warn(
        'No admin exists in database and ADMIN_EMAIL / ADMIN_PASSWORD are not set. Admin login will remain disabled until configured.'
      );
    }
  }

  const profileCount = await Profile.countDocuments();
  if (profileCount === 0) {
    await Profile.create({
      name: 'Project Vault Owner',
      introduction:
        'Engineering builder archiving projects, experiments, and technical milestones.',
    });
  }

  if (process.env.SEED_SAMPLE_PROJECT === 'true') {
    const projectCount = await Project.countDocuments();
    if (projectCount === 0) {
      await Project.create(SAMPLE_UNFAZED_PROJECT);
      console.log('Seeded optional UNFAZED sample project.');
    }
  }
}
