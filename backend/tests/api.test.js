import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

vi.mock('../src/config/cloudinary.js', () => ({
  isCloudinaryConfigured: () => true,
  ensureCloudinaryConfigured: () => {},
  uploadBufferToCloudinary: vi.fn(async (buffer, opts = {}) => ({
    url: `https://res.cloudinary.com/demo/${opts.resourceType === 'raw' ? 'raw' : 'image'}/upload/mock_${Date.now()}`,
    publicId: `mock_public_id_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    resourceType: opts.resourceType || 'image',
    bytes: buffer.length,
  })),
  deleteFromCloudinary: vi.fn(async () => {}),
}));

import { createApp } from '../src/app.js';
import { bootstrapDatabase } from '../src/utils/bootstrap.js';
import Project from '../src/models/Project.js';

let mongod;
let app;
let adminToken;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test_jwt_secret_key_for_project_vault_tests_32chars';
  process.env.ADMIN_EMAIL = 'admin@test.local';
  process.env.ADMIN_USERNAME = 'admin';
  process.env.ADMIN_PASSWORD = 'StrongTestPassword123!';
  process.env.CLIENT_URL = 'http://localhost:5173';
  process.env.SEED_SAMPLE_PROJECT = 'false';

  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await bootstrapDatabase();
  app = createApp();
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
});

beforeEach(async () => {
  await Project.deleteMany({});
  const loginRes = await request(app).post('/api/auth/login').send({
    identifier: 'admin@test.local',
    password: 'StrongTestPassword123!',
  });
  adminToken = loginRes.body.token;
});

describe('PROJECT VAULT Backend API', () => {
  it('enforces single authorized email login and rejects unauthorized emails or usernames', async () => {
    const badPass = await request(app).post('/api/auth/login').send({
      email: 'admin@test.local',
      password: 'wrong-password',
    });
    expect(badPass.status).toBe(401);

    const badEmail = await request(app).post('/api/auth/login').send({
      email: 'someone-else@test.local',
      password: 'StrongTestPassword123!',
    });
    expect(badEmail.status).toBe(401);

    const usernameAttempt = await request(app).post('/api/auth/login').send({
      email: 'admin',
      password: 'StrongTestPassword123!',
    });
    expect(usernameAttempt.status).toBe(400);

    const emailRes = await request(app).post('/api/auth/login').send({
      email: 'admin@test.local',
      password: 'StrongTestPassword123!',
    });
    expect(emailRes.status).toBe(200);
    expect(emailRes.body.token).toBeTruthy();
    expect(emailRes.body.admin.email).toBe('admin@test.local');
    expect(emailRes.body.admin.passwordHash).toBeUndefined();
  });

  it('blocks public visitors from all protected admin endpoints including email change', async () => {
    const createRes = await request(app).post('/api/projects').send({ name: 'Unauthorized' });
    expect(createRes.status).toBe(401);

    const profileRes = await request(app).put('/api/profile').send({ name: 'Hacker' });
    expect(profileRes.status).toBe(401);

    const overviewRes = await request(app).get('/api/projects/admin/overview');
    expect(overviewRes.status).toBe(401);

    const changeEmailRes = await request(app).put('/api/auth/change-email').send({
      currentPassword: 'StrongTestPassword123!',
      newEmail: 'hacker@test.local',
      confirmEmail: 'hacker@test.local',
    });
    expect(changeEmailRes.status).toBe(401);
  });

  it('allows authenticated admin to change authorized email and immediately rejects old email', async () => {
    // Rejects wrong password
    const wrongPass = await request(app)
      .put('/api/auth/change-email')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        currentPassword: 'WrongPassword!',
        newEmail: 'newadmin@test.local',
        confirmEmail: 'newadmin@test.local',
      });
    expect(wrongPass.status).toBe(401);

    // Rejects mismatched confirmation
    const mismatch = await request(app)
      .put('/api/auth/change-email')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        currentPassword: 'StrongTestPassword123!',
        newEmail: 'newadmin@test.local',
        confirmEmail: 'other@test.local',
      });
    expect(mismatch.status).toBe(400);

    // Succeeds with valid verification
    const okRes = await request(app)
      .put('/api/auth/change-email')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        currentPassword: 'StrongTestPassword123!',
        newEmail: 'newadmin@test.local',
        confirmEmail: 'newadmin@test.local',
      });
    expect(okRes.status).toBe(200);
    expect(okRes.body.admin.email).toBe('newadmin@test.local');
    expect(okRes.body.token).toBeTruthy();

    // Old token is rejected
    const oldTokenCheck = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(oldTokenCheck.status).toBe(401);

    // Old email login is rejected
    const oldEmailLogin = await request(app).post('/api/auth/login').send({
      email: 'admin@test.local',
      password: 'StrongTestPassword123!',
    });
    expect(oldEmailLogin.status).toBe(401);

    // New email login works
    const newEmailLogin = await request(app).post('/api/auth/login').send({
      email: 'newadmin@test.local',
      password: 'StrongTestPassword123!',
    });
    expect(newEmailLogin.status).toBe(200);

    // Restore original email for subsequent tests
    await request(app)
      .put('/api/auth/change-email')
      .set('Authorization', `Bearer ${newEmailLogin.body.token}`)
      .send({
        currentPassword: 'StrongTestPassword123!',
        newEmail: 'admin@test.local',
        confirmEmail: 'admin@test.local',
      });
  });

  it('creates, fetches by unique slug, searches, filters, sorts, updates, and deletes projects', async () => {
    const p1 = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'UNFAZED',
        date: '2026-10-01',
        shortDescription: 'Therapist and client management platform.',
        technologies: ['React', 'Node.js', 'MongoDB'],
        status: 'Completed',
        mongoClusterUrl: 'https://cloud.mongodb.com/v2/sample-cluster',
      });
    expect(p1.status).toBe(201);
    expect(p1.body.project.slug).toBe('unfazed');

    // Duplicate project name generates unique slug
    const p2 = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'UNFAZED',
        date: '2026-09-01',
        technologies: ['Python', 'FastAPI'],
        status: 'In Progress',
      });
    expect(p2.status).toBe(201);
    expect(p2.body.project.slug).toBe('unfazed-2');

    // Rejects MongoDB connection string in MongoDB Cluster Link
    const badMongo = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Bad URL Test',
        mongoClusterUrl: 'mongodb+srv://user:pass@cluster.mongodb.net/db',
      });
    expect(badMongo.status).toBe(400);

    // Public list, search, filter, sort
    const searchRes = await request(app).get('/api/projects?search=FastAPI');
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.projects).toHaveLength(1);
    expect(searchRes.body.projects[0].slug).toBe('unfazed-2');
    expect(searchRes.body.stats.total).toBe(2);

    const statusRes = await request(app).get('/api/projects?status=Completed');
    expect(statusRes.status).toBe(200);
    expect(statusRes.body.projects).toHaveLength(1);
    expect(statusRes.body.projects[0].slug).toBe('unfazed');

    // Public single project by slug
    const detailRes = await request(app).get('/api/projects/unfazed');
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.project.name).toBe('UNFAZED');

    // Update project
    const updateRes = await request(app)
      .put(`/api/projects/${p1.body.project._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'UNFAZED Updated',
        status: 'In Progress',
        notes: 'Added notes',
      });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.project.name).toBe('UNFAZED Updated');
    expect(updateRes.body.project.status).toBe('In Progress');

    // Delete project
    const delRes = await request(app)
      .delete(`/api/projects/${p1.body.project._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(delRes.status).toBe(200);

    const missingRes = await request(app).get('/api/projects/unfazed');
    expect(missingRes.status).toBe(404);
  });

  it('handles thumbnail, screenshots, multiple PDFs, replacement, deletion, and profile updates', async () => {
    const createRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Doc Vault Test' });
    const projectId = createRes.body.project._id;

    // Upload thumbnail
    const thumbRes = await request(app)
      .post(`/api/projects/${projectId}/thumbnail`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('thumbnail', Buffer.from('fake-png-bytes'), {
        filename: 'thumb.png',
        contentType: 'image/png',
      });
    expect(thumbRes.status).toBe(200);
    expect(thumbRes.body.project.thumbnail.url).toContain('https://res.cloudinary.com');

    // Upload screenshots
    const shotRes = await request(app)
      .post(`/api/projects/${projectId}/screenshots`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('screenshots', Buffer.from('shot-1'), {
        filename: 'shot1.png',
        contentType: 'image/png',
      })
      .attach('screenshots', Buffer.from('shot-2'), {
        filename: 'shot2.jpg',
        contentType: 'image/jpeg',
      });
    expect(shotRes.status).toBe(200);
    expect(shotRes.body.project.screenshots).toHaveLength(2);

    // Reject non-PDF document upload
    const badDoc = await request(app)
      .post(`/api/projects/${projectId}/documents`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('documents', Buffer.from('not-a-pdf'), {
        filename: 'malware.exe',
        contentType: 'application/octet-stream',
      });
    expect(badDoc.status).toBe(400);

    // Upload multiple PDFs
    const pdfRes = await request(app)
      .post(`/api/projects/${projectId}/documents`)
      .set('Authorization', `Bearer ${adminToken}`)
      .field('titles', JSON.stringify(['Project Report', 'Synopsis']))
      .attach('documents', Buffer.from('%PDF-1.4 sample 1'), {
        filename: 'report.pdf',
        contentType: 'application/pdf',
      })
      .attach('documents', Buffer.from('%PDF-1.4 sample 2'), {
        filename: 'synopsis.pdf',
        contentType: 'application/pdf',
      });
    expect(pdfRes.status).toBe(200);
    expect(pdfRes.body.project.documents).toHaveLength(2);
    expect(pdfRes.body.project.documents[0].title).toBe('Project Report');
    expect(pdfRes.body.project.documents[0].originalFilename).toBe('report.pdf');

    const docId = pdfRes.body.project.documents[0]._id;

    // Replace PDF document
    const replaceRes = await request(app)
      .put(`/api/projects/${projectId}/documents/${docId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .field('title', 'Final Project Report')
      .attach('document', Buffer.from('%PDF-1.4 updated'), {
        filename: 'final-report.pdf',
        contentType: 'application/pdf',
      });
    expect(replaceRes.status).toBe(200);
    expect(replaceRes.body.project.documents[0].title).toBe('Final Project Report');
    expect(replaceRes.body.project.documents[0].originalFilename).toBe('final-report.pdf');

    // Delete PDF document
    const deleteDocRes = await request(app)
      .delete(`/api/projects/${projectId}/documents/${docId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deleteDocRes.status).toBe(200);
    expect(deleteDocRes.body.project.documents).toHaveLength(1);

    // Update profile & photo
    const profRes = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Alex Engineer',
        introduction: 'Full-stack developer.',
        linkedinUrl: 'https://linkedin.com/in/alex',
        githubUrl: 'https://github.com/alex',
      });
    expect(profRes.status).toBe(200);
    expect(profRes.body.profile.name).toBe('Alex Engineer');

    const profPhotoRes = await request(app)
      .post('/api/profile/photo')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('photo', Buffer.from('avatar'), {
        filename: 'avatar.png',
        contentType: 'image/png',
      });
    expect(profPhotoRes.status).toBe(200);
    expect(profPhotoRes.body.profile.photoUrl).toContain('https://res.cloudinary.com');
  });
});
