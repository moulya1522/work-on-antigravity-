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
    format: opts.formatHint || (opts.resourceType === 'raw' ? 'pdf' : 'png'),
    bytes: buffer.length,
  })),
  deleteFromCloudinary: vi.fn(async () => {}),
  rollbackCloudinaryAssets: vi.fn(async () => {}),
}));

const VALID_PNG_BYTES = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.from('0000IHDRmockdata'),
]);
const VALID_JPG_BYTES = Buffer.concat([
  Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
  Buffer.from('0010JFIFmockdata'),
]);
const VALID_WEBP_BYTES = Buffer.concat([
  Buffer.from('RIFF'),
  Buffer.from([0x24, 0x00, 0x00, 0x00]),
  Buffer.from('WEBP'),
  Buffer.from('VP8 mockdata'),
]);

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

  it('allows authenticated admin to change password, invalidates old tokens, and persists across restarts', async () => {
    // Public visitor blocked
    const unauth = await request(app).put('/api/auth/change-password').send({
      currentPassword: 'StrongTestPassword123!',
      newPassword: 'NewStrongPassword123!',
      confirmPassword: 'NewStrongPassword123!',
    });
    expect(unauth.status).toBe(401);

    // Weak password rejected
    const weak = await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        currentPassword: 'StrongTestPassword123!',
        newPassword: 'weak',
        confirmPassword: 'weak',
      });
    expect(weak.status).toBe(400);

    // Wrong current password rejected
    const badCurrent = await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewStrongPassword123!',
        confirmPassword: 'NewStrongPassword123!',
      });
    expect(badCurrent.status).toBe(401);

    // Valid password change succeeds
    const okRes = await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        currentPassword: 'StrongTestPassword123!',
        newPassword: 'NewStrongPassword123!',
        confirmPassword: 'NewStrongPassword123!',
      });
    expect(okRes.status).toBe(200);

    // Old JWT is immediately invalidated
    const oldTokenMe = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(oldTokenMe.status).toBe(401);

    // Simulate server restart / redeploy calling bootstrapDatabase() again
    await bootstrapDatabase();

    // Old password still rejected after restart
    const oldPassLogin = await request(app).post('/api/auth/login').send({
      email: 'admin@test.local',
      password: 'StrongTestPassword123!',
    });
    expect(oldPassLogin.status).toBe(401);

    // New password works after restart
    const newPassLogin = await request(app).post('/api/auth/login').send({
      email: 'admin@test.local',
      password: 'NewStrongPassword123!',
    });
    expect(newPassLogin.status).toBe(200);

    // Restore initial password for subsequent tests
    await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${newPassLogin.body.token}`)
      .send({
        currentPassword: 'NewStrongPassword123!',
        newPassword: 'StrongTestPassword123!',
        confirmPassword: 'StrongTestPassword123!',
      });
  });

  it('returns 403 for disallowed CORS origins instead of 500', async () => {
    const blockedRes = await request(app)
      .get('/api/health')
      .set('Origin', 'https://untrusted-origin.example.com');
    expect(blockedRes.status).toBe(403);
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

  it('handles thumbnail, screenshots, multiple PDFs, preview/download, replace, delete, and security rejections', async () => {
    const createRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Doc Vault Test' });
    const projectId = createRes.body.project._id;
    const slug = createRes.body.project.slug;

    // Unauthorized upload & delete rejections
    const unauthUpload = await request(app)
      .post(`/api/projects/${projectId}/thumbnail`)
      .attach('thumbnail', VALID_PNG_BYTES, { filename: 'thumb.png', contentType: 'image/png' });
    expect(unauthUpload.status).toBe(401);

    const unauthDelete = await request(app).delete(`/api/projects/${projectId}/thumbnail`);
    expect(unauthDelete.status).toBe(401);

    // Reject spoofed image (HTML masquerading as PNG)
    const spoofedImg = await request(app)
      .post(`/api/projects/${projectId}/thumbnail`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('thumbnail', Buffer.from('<script>alert(1)</script>'), {
        filename: 'evil.png',
        contentType: 'image/png',
      });
    expect(spoofedImg.status).toBe(400);

    // Reject unsupported GIF extension
    const gifImg = await request(app)
      .post(`/api/projects/${projectId}/thumbnail`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('thumbnail', Buffer.from('GIF89a1234567890'), {
        filename: 'anim.gif',
        contentType: 'image/gif',
      });
    expect(gifImg.status).toBe(400);

    // Reject oversized image (> 5 MB)
    const oversizedImg = await request(app)
      .post(`/api/projects/${projectId}/thumbnail`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('thumbnail', Buffer.concat([VALID_PNG_BYTES, Buffer.alloc(5 * 1024 * 1024 + 100)]), {
        filename: 'huge.png',
        contentType: 'image/png',
      });
    expect(oversizedImg.status).toBe(400);

    // Upload valid PNG thumbnail
    const thumbRes = await request(app)
      .post(`/api/projects/${projectId}/thumbnail`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('thumbnail', VALID_PNG_BYTES, {
        filename: 'thumb.png',
        contentType: 'image/png',
      });
    expect(thumbRes.status).toBe(200);
    expect(thumbRes.body.project.thumbnail.url).toContain('https://res.cloudinary.com');
    expect(thumbRes.body.project.thumbnail.format).toBe('png');

    // Upload multiple valid screenshots (PNG, JPG, WEBP)
    const shotRes = await request(app)
      .post(`/api/projects/${projectId}/screenshots`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('screenshots', VALID_PNG_BYTES, {
        filename: 'shot1.png',
        contentType: 'image/png',
      })
      .attach('screenshots', VALID_JPG_BYTES, {
        filename: 'shot2.jpg',
        contentType: 'image/jpeg',
      })
      .attach('screenshots', VALID_WEBP_BYTES, {
        filename: 'shot3.webp',
        contentType: 'image/webp',
      });
    expect(shotRes.status).toBe(200);
    expect(shotRes.body.project.screenshots).toHaveLength(3);

    // Reject non-PDF and spoofed PDF uploads
    const badDoc = await request(app)
      .post(`/api/projects/${projectId}/documents`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('documents', Buffer.from('MZexecutable'), {
        filename: 'malware.exe',
        contentType: 'application/octet-stream',
      });
    expect(badDoc.status).toBe(400);

    const spoofedPdf = await request(app)
      .post(`/api/projects/${projectId}/documents`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('documents', Buffer.from('<html><script>evil()</script></html>'), {
        filename: 'fake.pdf',
        contentType: 'application/pdf',
      });
    expect(spoofedPdf.status).toBe(400);

    // Reject oversized PDF (> 15 MB)
    const oversizedPdf = await request(app)
      .post(`/api/projects/${projectId}/documents`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('documents', Buffer.concat([Buffer.from('%PDF-1.4 '), Buffer.alloc(15 * 1024 * 1024 + 100)]), {
        filename: 'huge.pdf',
        contentType: 'application/pdf',
      });
    expect(oversizedPdf.status).toBe(400);

    // Upload multiple valid PDFs including path traversal filename sanitization check
    const pdfRes = await request(app)
      .post(`/api/projects/${projectId}/documents`)
      .set('Authorization', `Bearer ${adminToken}`)
      .field('titles', JSON.stringify(['Project Report', 'Synopsis']))
      .attach('documents', Buffer.from('%PDF-1.4 sample 1'), {
        filename: '../../evil/report.pdf',
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
    expect(pdfRes.body.project.documents[0].format).toBe('pdf');

    const docId = pdfRes.body.project.documents[0]._id;

    // Preview and Download endpoint headers check (mocking upstream fetch)
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => new Response(Buffer.from('%PDF-1.4 sample bytes'), { status: 200 }));
    const previewRes = await request(app).get(`/api/projects/${slug}/documents/${docId}/file`);
    expect(previewRes.status).toBe(200);
    expect(previewRes.headers['content-type']).toContain('application/pdf');
    expect(previewRes.headers['content-disposition']).toContain('inline; filename="report.pdf"');
    expect(previewRes.headers['x-content-type-options']).toBe('nosniff');

    const downloadRes = await request(app).get(`/api/projects/${slug}/documents/${docId}/file?download=1`);
    expect(downloadRes.status).toBe(200);
    expect(downloadRes.headers['content-disposition']).toContain('attachment; filename="report.pdf"');
    fetchSpy.mockRestore();

    // Rollback safety check: if DB save fails during PDF replace, new Cloudinary upload is rolled back and old file is NOT deleted
    const cloudinaryMod = await import('../src/config/cloudinary.js');
    cloudinaryMod.deleteFromCloudinary.mockClear();
    cloudinaryMod.rollbackCloudinaryAssets.mockClear();
    const saveSpy = vi.spyOn(Project.prototype, 'save').mockRejectedValueOnce(new Error('Simulated DB failure'));
    const failedReplace = await request(app)
      .put(`/api/projects/${projectId}/documents/${docId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('document', Buffer.from('%PDF-1.4 rollback test'), {
        filename: 'rollback.pdf',
        contentType: 'application/pdf',
      });
    expect(failedReplace.status).toBe(500);
    expect(cloudinaryMod.rollbackCloudinaryAssets).toHaveBeenCalledTimes(1);
    expect(cloudinaryMod.deleteFromCloudinary).not.toHaveBeenCalled();
    saveSpy.mockRestore();

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
      .attach('photo', VALID_PNG_BYTES, {
        filename: 'avatar.png',
        contentType: 'image/png',
      });
    expect(profPhotoRes.status).toBe(200);
    expect(profPhotoRes.body.profile.photoUrl).toContain('https://res.cloudinary.com');
  });
});
