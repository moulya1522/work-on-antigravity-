import express from 'express';
import slugify from 'slugify';
import Project from '../models/Project.js';
import { requireAdmin } from '../middleware/auth.js';
import { uploadImageMiddleware, uploadPdfMiddleware } from '../middleware/upload.js';
import { deleteFromCloudinary, uploadBufferToCloudinary } from '../config/cloudinary.js';
import { generateUniqueSlug } from '../utils/slug.js';
import {
  normalizeOptionalHttpUrl,
  normalizeStatus,
  parseOptionalDate,
  parseTechnologies,
} from '../utils/validation.js';
import { SAMPLE_UNFAZED_PROJECT } from '../utils/bootstrap.js';

const router = express.Router();

function buildProjectPayload(body) {
  const name = String(body.name || '').trim();
  if (!name) {
    const err = new Error('Project name is required.');
    err.statusCode = 400;
    throw err;
  }

  return {
    name,
    date: parseOptionalDate(body.date),
    shortDescription: String(body.shortDescription || '').trim(),
    detailedDescription: String(body.detailedDescription || '').trim(),
    mainLink: normalizeOptionalHttpUrl(body.mainLink, 'Main Project Link'),
    githubUrl: normalizeOptionalHttpUrl(body.githubUrl, 'GitHub Repository Link'),
    frontendUrl: normalizeOptionalHttpUrl(body.frontendUrl, 'Frontend Deployment Link'),
    backendUrl: normalizeOptionalHttpUrl(body.backendUrl, 'Backend Deployment Link'),
    mongoClusterUrl: normalizeOptionalHttpUrl(body.mongoClusterUrl, 'MongoDB Cluster Link'),
    technologies: parseTechnologies(body.technologies),
    status: normalizeStatus(body.status),
    notes: String(body.notes || '').trim(),
  };
}

async function computeProjectStats() {
  const allProjects = await Project.find().select('status technologies').lean();
  const stats = {
    total: allProjects.length,
    completed: 0,
    inProgress: 0,
    planned: 0,
    onHold: 0,
  };
  const techMap = new Map();

  for (const project of allProjects) {
    if (project.status === 'Completed') stats.completed += 1;
    else if (project.status === 'In Progress') stats.inProgress += 1;
    else if (project.status === 'Planned') stats.planned += 1;
    else if (project.status === 'On Hold') stats.onHold += 1;

    for (const tech of project.technologies || []) {
      const key = tech.toLowerCase();
      if (!techMap.has(key)) {
        techMap.set(key, tech);
      }
    }
  }

  return {
    stats,
    technologies: Array.from(techMap.values()).sort((a, b) => a.localeCompare(b)),
  };
}

// Public: List all projects with optional search, filter, and sort
router.get('/', async (req, res, next) => {
  try {
    const { search = '', status = '', technology = '', sort = 'newest' } = req.query;

    const filter = {};
    if (status && status !== 'All') {
      filter.status = normalizeStatus(status);
    }
    if (technology && technology !== 'All') {
      filter.technologies = {
        $regex: `^${String(technology).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
        $options: 'i',
      };
    }
    if (String(search).trim()) {
      const escaped = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [{ name: regex }, { technologies: regex }];
    }

    let sortSpec = { date: -1, createdAt: -1 };
    if (sort === 'oldest') {
      sortSpec = { date: 1, createdAt: 1 };
    } else if (sort === 'alpha') {
      sortSpec = { name: 1 };
    } else if (sort === 'alpha_desc') {
      sortSpec = { name: -1 };
    }

    const [projects, summary] = await Promise.all([
      Project.find(filter).sort(sortSpec).collation({ locale: 'en', strength: 2 }),
      computeProjectStats(),
    ]);

    res.json({
      projects,
      stats: summary.stats,
      technologies: summary.technologies,
    });
  } catch (err) {
    next(err);
  }
});

// Admin: Dashboard overview
router.get('/admin/overview', requireAdmin, async (_req, res, next) => {
  try {
    const [{ stats, technologies }, recentProjects, allProjects] = await Promise.all([
      computeProjectStats(),
      Project.find().sort({ createdAt: -1 }).limit(5),
      Project.find().sort({ updatedAt: -1 }),
    ]);

    res.json({
      stats,
      technologies,
      recentProjects,
      projects: allProjects,
    });
  } catch (err) {
    next(err);
  }
});

// Admin: Get project by MongoDB ID for editing
router.get('/admin/:id', requireAdmin, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }
    return res.json({ project });
  } catch (err) {
    return next(err);
  }
});

// Admin: Seed optional UNFAZED sample project
router.post('/seed-sample', requireAdmin, async (_req, res, next) => {
  try {
    const existing = await Project.findOne({ slug: SAMPLE_UNFAZED_PROJECT.slug });
    if (existing) {
      return res.status(409).json({ message: 'Sample project UNFAZED already exists.' });
    }
    const project = await Project.create(SAMPLE_UNFAZED_PROJECT);
    return res.status(201).json({ project, message: 'Sample project UNFAZED added.' });
  } catch (err) {
    return next(err);
  }
});

// Public: Get single project by slug
router.get('/:slug', async (req, res, next) => {
  try {
    const project = await Project.findOne({ slug: req.params.slug.toLowerCase() });
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }
    return res.json({ project });
  } catch (err) {
    return next(err);
  }
});

// Public: Get project documents
router.get('/:slug/documents', async (req, res, next) => {
  try {
    const project = await Project.findOne({ slug: req.params.slug.toLowerCase() }).select(
      'name slug documents'
    );
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }
    return res.json({
      projectName: project.name,
      slug: project.slug,
      documents: project.documents,
    });
  } catch (err) {
    return next(err);
  }
});

// Public: Stream PDF for reliable preview or download with original filename
router.get('/:slug/documents/:docId/file', async (req, res, next) => {
  try {
    const project = await Project.findOne({ slug: req.params.slug.toLowerCase() }).select('documents');
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }
    const doc = project.documents.id(req.params.docId);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    const upstream = await fetch(doc.url);
    if (!upstream.ok) {
      return res.status(502).json({ message: 'Unable to retrieve document from cloud storage.' });
    }

    const isDownload = req.query.download === '1' || req.query.download === 'true';
    const safeFilename = (doc.originalFilename || `${doc.title || 'document'}.pdf`).replace(
      /["\r\n]/g,
      '_'
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `${isDownload ? 'attachment' : 'inline'}; filename="${safeFilename}"`
    );

    const arrayBuffer = await upstream.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    return next(err);
  }
});

// Admin: Create project
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const payload = buildProjectPayload(req.body);
    const customSlug = req.body.slug
      ? slugify(String(req.body.slug), { lower: true, strict: true, trim: true })
      : '';
    const slug = await generateUniqueSlug(customSlug || payload.name);

    const project = await Project.create({
      ...payload,
      slug,
    });

    return res.status(201).json({
      project,
      message: 'Project created successfully.',
    });
  } catch (err) {
    return next(err);
  }
});

// Admin: Update project metadata
router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const payload = buildProjectPayload(req.body);

    if (req.body.slug !== undefined && String(req.body.slug).trim() !== '') {
      const requested = slugify(String(req.body.slug), { lower: true, strict: true, trim: true });
      if (requested && requested !== project.slug) {
        project.slug = await generateUniqueSlug(requested, project._id);
      }
    } else if (req.body.regenerateSlug === true) {
      project.slug = await generateUniqueSlug(payload.name, project._id);
    }

    Object.assign(project, payload);
    await project.save();

    return res.json({
      project,
      message: 'Project updated successfully.',
    });
  } catch (err) {
    return next(err);
  }
});

// Admin: Delete project and clean up all cloud files
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const deletions = [];
    if (project.thumbnail?.publicId) {
      deletions.push(deleteFromCloudinary(project.thumbnail.publicId, 'image'));
    }
    for (const shot of project.screenshots || []) {
      if (shot.publicId) {
        deletions.push(deleteFromCloudinary(shot.publicId, 'image'));
      }
    }
    for (const doc of project.documents || []) {
      if (doc.publicId) {
        deletions.push(deleteFromCloudinary(doc.publicId, doc.resourceType || 'raw'));
      }
    }

    await Promise.allSettled(deletions);
    await project.deleteOne();

    return res.json({ message: 'Project and associated files deleted successfully.' });
  } catch (err) {
    return next(err);
  }
});

// Admin: Upload/replace project thumbnail
router.post(
  '/:id/thumbnail',
  requireAdmin,
  uploadImageMiddleware.single('thumbnail'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Please select a thumbnail image to upload.' });
      }
      const project = await Project.findById(req.params.id);
      if (!project) {
        return res.status(404).json({ message: 'Project not found.' });
      }

      const uploaded = await uploadBufferToCloudinary(req.file.buffer, {
        folder: `project-vault/projects/${project._id}/thumbnail`,
        resourceType: 'image',
      });

      if (project.thumbnail?.publicId) {
        await deleteFromCloudinary(project.thumbnail.publicId, 'image');
      }

      project.thumbnail = {
        url: uploaded.url,
        publicId: uploaded.publicId,
      };
      await project.save();

      return res.json({ project, message: 'Thumbnail uploaded successfully.' });
    } catch (err) {
      return next(err);
    }
  }
);

// Admin: Remove project thumbnail
router.delete('/:id/thumbnail', requireAdmin, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    if (project.thumbnail?.publicId) {
      await deleteFromCloudinary(project.thumbnail.publicId, 'image');
    }

    project.thumbnail = { url: '', publicId: '' };
    await project.save();

    return res.json({ project, message: 'Thumbnail removed.' });
  } catch (err) {
    return next(err);
  }
});

// Admin: Upload multiple screenshots
router.post(
  '/:id/screenshots',
  requireAdmin,
  uploadImageMiddleware.array('screenshots', 10),
  async (req, res, next) => {
    try {
      const files = req.files || [];
      if (files.length === 0) {
        return res.status(400).json({ message: 'Please select at least one screenshot image.' });
      }

      const project = await Project.findById(req.params.id);
      if (!project) {
        return res.status(404).json({ message: 'Project not found.' });
      }

      let captions = [];
      if (req.body.captions) {
        try {
          captions = JSON.parse(req.body.captions);
        } catch {
          captions = Array.isArray(req.body.captions) ? req.body.captions : [req.body.captions];
        }
      }

      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        const uploaded = await uploadBufferToCloudinary(file.buffer, {
          folder: `project-vault/projects/${project._id}/screenshots`,
          resourceType: 'image',
        });
        project.screenshots.push({
          url: uploaded.url,
          publicId: uploaded.publicId,
          caption: String(captions[i] || '').trim(),
          uploadedAt: new Date(),
        });
      }

      await project.save();
      return res.json({ project, message: 'Screenshots uploaded successfully.' });
    } catch (err) {
      return next(err);
    }
  }
);

// Admin: Delete a screenshot
router.delete('/:id/screenshots/:screenshotId', requireAdmin, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const screenshot = project.screenshots.id(req.params.screenshotId);
    if (!screenshot) {
      return res.status(404).json({ message: 'Screenshot not found.' });
    }

    if (screenshot.publicId) {
      await deleteFromCloudinary(screenshot.publicId, 'image');
    }

    screenshot.deleteOne();
    await project.save();

    return res.json({ project, message: 'Screenshot deleted.' });
  } catch (err) {
    return next(err);
  }
});

// Admin: Upload one or more PDF documents
router.post(
  '/:id/documents',
  requireAdmin,
  uploadPdfMiddleware.array('documents', 10),
  async (req, res, next) => {
    try {
      const files = req.files || [];
      if (files.length === 0) {
        return res.status(400).json({ message: 'Please select at least one PDF document.' });
      }

      const project = await Project.findById(req.params.id);
      if (!project) {
        return res.status(404).json({ message: 'Project not found.' });
      }

      let titles = [];
      if (req.body.titles) {
        try {
          titles = JSON.parse(req.body.titles);
        } catch {
          titles = Array.isArray(req.body.titles) ? req.body.titles : [req.body.titles];
        }
      } else if (req.body.title) {
        titles = [req.body.title];
      }

      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        const uploaded = await uploadBufferToCloudinary(file.buffer, {
          folder: `project-vault/projects/${project._id}/documents`,
          resourceType: 'raw',
          originalFilename: file.originalname,
        });

        const fallbackTitle = file.originalname.replace(/\.pdf$/i, '');
        const customTitle = String(titles[i] || '').trim() || fallbackTitle;

        project.documents.push({
          title: customTitle,
          originalFilename: file.originalname,
          url: uploaded.url,
          publicId: uploaded.publicId,
          resourceType: uploaded.resourceType || 'raw',
          bytes: uploaded.bytes || file.size,
          uploadedAt: new Date(),
        });
      }

      await project.save();
      return res.json({ project, message: 'Document(s) uploaded successfully.' });
    } catch (err) {
      return next(err);
    }
  }
);

// Admin: Update document title and/or replace PDF file
router.put(
  '/:id/documents/:docId',
  requireAdmin,
  uploadPdfMiddleware.single('document'),
  async (req, res, next) => {
    try {
      const project = await Project.findById(req.params.id);
      if (!project) {
        return res.status(404).json({ message: 'Project not found.' });
      }

      const doc = project.documents.id(req.params.docId);
      if (!doc) {
        return res.status(404).json({ message: 'Document not found.' });
      }

      if (req.body.title !== undefined) {
        const trimmedTitle = String(req.body.title).trim();
        if (!trimmedTitle) {
          return res.status(400).json({ message: 'Document title cannot be empty.' });
        }
        doc.title = trimmedTitle;
      }

      if (req.file) {
        const uploaded = await uploadBufferToCloudinary(req.file.buffer, {
          folder: `project-vault/projects/${project._id}/documents`,
          resourceType: 'raw',
          originalFilename: req.file.originalname,
        });

        if (doc.publicId) {
          await deleteFromCloudinary(doc.publicId, doc.resourceType || 'raw');
        }

        doc.originalFilename = req.file.originalname;
        doc.url = uploaded.url;
        doc.publicId = uploaded.publicId;
        doc.resourceType = uploaded.resourceType || 'raw';
        doc.bytes = uploaded.bytes || req.file.size;
        doc.uploadedAt = new Date();
      }

      await project.save();
      return res.json({ project, message: 'Document updated successfully.' });
    } catch (err) {
      return next(err);
    }
  }
);

// Admin: Delete a PDF document
router.delete('/:id/documents/:docId', requireAdmin, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const doc = project.documents.id(req.params.docId);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    if (doc.publicId) {
      await deleteFromCloudinary(doc.publicId, doc.resourceType || 'raw');
    }

    doc.deleteOne();
    await project.save();

    return res.json({ project, message: 'Document deleted successfully.' });
  } catch (err) {
    return next(err);
  }
});

export default router;
