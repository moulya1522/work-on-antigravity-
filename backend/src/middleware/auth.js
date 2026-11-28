import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

/**
 * Verifies Bearer JWT token and confirms the administrator exists in MongoDB.
 */
export async function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required. Please log in as administrator.' });
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return res.status(401).json({ message: 'Authentication token is missing.' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: 'Server JWT configuration is missing.' });
    }

    const decoded = jwt.verify(token, secret);
    const admin = await Admin.findById(decoded.sub).select('-passwordHash');
    if (!admin) {
      return res.status(401).json({ message: 'Administrator account no longer exists.' });
    }

    if (!decoded.email || decoded.email.toLowerCase() !== admin.email.toLowerCase()) {
      return res.status(401).json({ message: 'Authorized admin email changed. Please log in with the new email.' });
    }

    if ((decoded.tv ?? 0) !== (admin.tokenVersion ?? 0)) {
      return res.status(401).json({ message: 'Session invalidated after credentials update. Please log in again.' });
    }

    req.admin = admin;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ message: 'Invalid authentication token.' });
  }
}
