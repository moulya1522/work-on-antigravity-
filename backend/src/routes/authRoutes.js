import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import Admin from '../models/Admin.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
});

function validatePasswordStrength(password) {
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return 'New password must be between 8 and 128 characters.';
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'New password must include at least one uppercase letter, one lowercase letter, and one number.';
  }
  return null;
}

function signAdminToken(admin) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const err = new Error('Server JWT configuration is missing.');
    err.statusCode = 500;
    throw err;
  }

  return jwt.sign(
    {
      sub: admin._id.toString(),
      email: admin.email,
      role: 'admin',
      tv: admin.tokenVersion ?? 0,
    },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const rawEmail = req.body.email ?? req.body.identifier ?? '';
    const email = String(rawEmail).trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({ message: 'Authorized email and password are required.' });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    // Single authorized administrator email enforcement
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: 'Unauthorized email or invalid credentials.' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Unauthorized email or invalid credentials.' });
    }

    const token = signAdminToken(admin);

    return res.json({
      token,
      admin: admin.toJSON(),
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/me', requireAdmin, (req, res) => {
  res.json({ admin: req.admin });
});

router.put('/change-email', requireAdmin, async (req, res, next) => {
  try {
    const currentPassword = String(req.body.currentPassword || '');
    const newEmail = String(req.body.newEmail || '').trim().toLowerCase();
    const confirmEmail = String(req.body.confirmEmail || '').trim().toLowerCase();

    if (!currentPassword || !newEmail || !confirmEmail) {
      return res.status(400).json({
        message: 'Current password, new email, and confirmation email are required.',
      });
    }

    if (!EMAIL_REGEX.test(newEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    if (newEmail !== confirmEmail) {
      return res.status(400).json({ message: 'New email and confirmation email do not match.' });
    }

    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      return res.status(401).json({ message: 'Administrator account not found.' });
    }

    const isPasswordValid = await admin.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    if (newEmail === admin.email.toLowerCase()) {
      return res.status(400).json({
        message: 'New email must be different from the current authorized email.',
      });
    }

    admin.email = newEmail;
    await admin.save();

    const token = signAdminToken(admin);

    return res.json({
      token,
      admin: admin.toJSON(),
      message: 'Authorized admin email updated successfully. Use the new email for future logins.',
    });
  } catch (err) {
    return next(err);
  }
});

router.put('/change-password', requireAdmin, async (req, res, next) => {
  try {
    const currentPassword = String(req.body.currentPassword || '');
    const newPassword = String(req.body.newPassword || '');
    const confirmPassword = String(req.body.confirmPassword || '');

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: 'Current password, new password, and password confirmation are required.',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New password and confirmation password do not match.' });
    }

    const strengthError = validatePasswordStrength(newPassword);
    if (strengthError) {
      return res.status(400).json({ message: strengthError });
    }

    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      return res.status(401).json({ message: 'Administrator account not found.' });
    }

    const isCurrentValid = await admin.comparePassword(currentPassword);
    if (!isCurrentValid) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    if (newPassword === currentPassword) {
      return res.status(400).json({
        message: 'New password must be different from your current password.',
      });
    }

    admin.passwordHash = await bcrypt.hash(newPassword, 12);
    admin.tokenVersion = (admin.tokenVersion ?? 0) + 1;
    await admin.save();

    return res.json({
      message: 'Password updated successfully. Please sign in with your new password.',
    });
  } catch (err) {
    return next(err);
  }
});

router.post('/logout', (_req, res) => {
  res.json({ message: 'Logged out successfully.' });
});

export default router;
