import path from 'node:path';
import multer from 'multer';
import rateLimit from 'express-rate-limit';

const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const ALLOWED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const ALLOWED_PDF_MIME_TYPES = new Set(['application/pdf']);

const storage = multer.memoryStorage();

export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many file uploads. Please wait a few minutes and try again.' },
});

/**
 * Sanitizes client-supplied filenames to prevent path traversal and unsafe characters.
 */
export function sanitizeFilename(rawName, fallbackExt = '') {
  const base = path.basename(String(rawName || 'file').replace(/\0/g, ''));
  const ext = path.extname(base).toLowerCase().replace(/[^.a-z0-9]/g, '') || fallbackExt;
  const stem =
    path
      .basename(base, path.extname(base))
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^[._-]+|[._-]+$/g, '')
      .slice(0, 80) || 'document';
  return `${stem}${ext}`;
}

function detectImageSignature(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'png';
  }

  // WEBP: "RIFF" .... "WEBP"
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'webp';
  }

  return null;
}

function isPdfSignature(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 5) return false;
  // Allow optional UTF-8 BOM or leading whitespace before %PDF-
  const headerSlice = buffer.subarray(0, 32).toString('latin1');
  return headerSlice.includes('%PDF-');
}

export const uploadImageMiddleware = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 10,
  },
  fileFilter(_req, file, cb) {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const mime = String(file.mimetype || '').toLowerCase();
    if (!ALLOWED_IMAGE_MIME_TYPES.has(mime) || !ALLOWED_IMAGE_EXTENSIONS.has(ext)) {
      const err = new Error('Only JPG, JPEG, PNG, and WEBP image files are allowed.');
      err.statusCode = 400;
      return cb(err);
    }
    cb(null, true);
  },
});

export const uploadPdfMiddleware = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB
    files: 10,
  },
  fileFilter(_req, file, cb) {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const mime = String(file.mimetype || '').toLowerCase();
    if (!ALLOWED_PDF_MIME_TYPES.has(mime) || ext !== '.pdf') {
      const err = new Error('Only valid PDF files (.pdf) are allowed for documents.');
      err.statusCode = 400;
      return cb(err);
    }
    cb(null, true);
  },
});

/**
 * Validates actual file magic bytes and sanitizes filenames for uploaded images.
 */
export function validateUploadedImages(req, _res, next) {
  const files = req.file ? [req.file] : Array.isArray(req.files) ? req.files : [];
  for (const file of files) {
    const detectedFormat = detectImageSignature(file.buffer);
    if (!detectedFormat) {
      const err = new Error(
        'Invalid or corrupted image file. Only genuine JPG, JPEG, PNG, and WEBP images are accepted.'
      );
      err.statusCode = 400;
      return next(err);
    }
    file.detectedFormat = detectedFormat;
    file.safeOriginalName = sanitizeFilename(file.originalname, `.${detectedFormat}`);
  }
  return next();
}

/**
 * Validates actual %PDF- signature and sanitizes filenames for uploaded PDFs.
 */
export function validateUploadedPdfs(req, _res, next) {
  const files = req.file ? [req.file] : Array.isArray(req.files) ? req.files : [];
  for (const file of files) {
    if (!isPdfSignature(file.buffer)) {
      const err = new Error(
        'Invalid or corrupted PDF file. File content does not match a valid PDF document.'
      );
      err.statusCode = 400;
      return next(err);
    }
    file.detectedFormat = 'pdf';
    file.safeOriginalName = sanitizeFilename(file.originalname, '.pdf');
  }
  return next();
}
