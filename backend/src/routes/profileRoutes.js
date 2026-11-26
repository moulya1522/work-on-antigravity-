import express from 'express';
import Profile from '../models/Profile.js';
import { requireAdmin } from '../middleware/auth.js';
import { uploadImageMiddleware } from '../middleware/upload.js';
import { deleteFromCloudinary, uploadBufferToCloudinary } from '../config/cloudinary.js';
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

router.post('/photo', requireAdmin, uploadImageMiddleware.single('photo'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please select an image file to upload.' });
    }

    const profile = await getOrCreateProfile();
    const uploaded = await uploadBufferToCloudinary(req.file.buffer, {
      folder: 'project-vault/profile',
      resourceType: 'image',
    });

    if (profile.photoPublicId) {
      await deleteFromCloudinary(profile.photoPublicId, 'image');
    }

    profile.photoUrl = uploaded.url;
    profile.photoPublicId = uploaded.publicId;
    await profile.save();

    return res.json({ profile, message: 'Profile photo updated successfully.' });
  } catch (err) {
    return next(err);
  }
});

router.delete('/photo', requireAdmin, async (_req, res, next) => {
  try {
    const profile = await getOrCreateProfile();
    if (profile.photoPublicId) {
      await deleteFromCloudinary(profile.photoPublicId, 'image');
    }
    profile.photoUrl = '';
    profile.photoPublicId = '';
    await profile.save();

    return res.json({ profile, message: 'Profile photo removed.' });
  } catch (err) {
    return next(err);
  }
});

export default router;
