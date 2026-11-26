import multer from 'multer';

const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const PDF_MIME_TYPES = new Set(['application/pdf']);

const storage = multer.memoryStorage();

export const uploadImageMiddleware = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 10,
  },
  fileFilter(_req, file, cb) {
    if (!IMAGE_MIME_TYPES.has(file.mimetype)) {
      const err = new Error('Only JPG, PNG, WebP, or GIF image files are allowed.');
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
    const isPdfMime = PDF_MIME_TYPES.has(file.mimetype);
    const isPdfExt = /\.pdf$/i.test(file.originalname || '');
    if (!isPdfMime && !isPdfExt) {
      const err = new Error('Only PDF files (.pdf) are allowed for documents.');
      err.statusCode = 400;
      return cb(err);
    }
    cb(null, true);
  },
});
