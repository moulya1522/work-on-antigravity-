import express from 'express';
import Profile from '../models/Profile.js';
import { requireAdmin } from '../middleware/auth.js';
import {
  uploadImageMiddleware,
  uploadRateLimiter,
  validateUploadedImages,
} from '../middleware/upload.js';
import {
  deleteFromCloudinary,
  rollbackCloudinaryAssets,
  uploadBufferToCloudinary,
} from '../config/cloudinary.js';
import { normalizeOptionalHttpUrl } from '../utils/validation.js';

const router = express.Router();

async function getOrCreateProfile() {
  let profile = await Profile.findOne();
  if (!profile) {
    profile = await Profile.create({});
  }
  return profile;
}

router.get('/', async (_req, res, next) => {
  try {
    const profile = await getOrCreateProfile();
    res.json({ profile });
  } catch (err) {
    next(err);
  }
});

router.put('/', requireAdmin, async (req, res, next) => {
  try {
    const profile = await getOrCreateProfile();
    const { name, introduction, linkedinUrl, githubUrl } = req.body;

    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (!trimmedName) {
        return res.status(400).json({ message: 'Profile name cannot be empty.' });
      }
      profile.name = trimmedName;
    }

    if (introduction !== undefined) {
      profile.introduction = String(introduction).trim();
    }

    if (linkedinUrl !== undefined) {
      profile.linkedinUrl = normalizeOptionalHttpUrl(linkedinUrl, 'LinkedIn URL');
    }

    if (githubUrl !== undefined) {
      profile.githubUrl = normalizeOptionalHttpUrl(githubUrl, 'GitHub URL');
    }

    await profile.save();
    return res.json({ profile, message: 'Profile updated successfully.' });
  } catch (err) {
    return next(err);
  }
});

router.post(
  '/photo',
  requireAdmin,
  uploadRateLimiter,
  uploadImageMiddleware.single('photo'),
  validateUploadedImages,
  async (req, res, next) => {
    let uploaded = null;
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Please select an image file to upload.' });
      }

      const profile = await getOrCreateProfile();
      const previousPublicId = profile.photoPublicId;

      uploaded = await uploadBufferToCloudinary(req.file.buffer, {
        folder: 'project-vault/profile',
        resourceType: 'image',
        originalFilename: req.file.safeOriginalName,
        formatHint: req.file.detectedFormat,
      });

      profile.photoUrl = uploaded.url;
      profile.photoPublicId = uploaded.publicId;
      await profile.save();

      // Delete old photo only after DB save succeeds
      if (previousPublicId && previousPublicId !== uploaded.publicId) {
        await deleteFromCloudinary(previousPublicId, 'image');
      }

      return res.json({ profile, message: 'Profile photo updated successfully.' });
    } catch (err) {
      await rollbackCloudinaryAssets([uploaded]);
      return next(err);
    }
  }
);

router.delete('/photo', requireAdmin, async (_req, res, next) => {
  try {
    const profile = await getOrCreateProfile();
    const previousPublicId = profile.photoPublicId;

    profile.photoUrl = '';
    profile.photoPublicId = '';
    await profile.save();

    if (previousPublicId) {
      await deleteFromCloudinary(previousPublicId, 'image');
    }

    return res.json({ profile, message: 'Profile photo removed.' });
  } catch (err) {
    return next(err);
  }
});

export default router;
