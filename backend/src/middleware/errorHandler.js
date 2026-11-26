import multer from 'multer';

export function notFoundHandler(req, res) {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Uploaded file exceeds the maximum allowed size.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Too many files selected in a single upload.' });
    }
    return res.status(400).json({ message: err.message });
  }

  if (err?.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(' ') });
  }

  if (err?.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid resource identifier.' });
  }

  if (err?.code === 11000) {
    return res.status(409).json({ message: 'A resource with that unique identifier already exists.' });
  }

  const statusCode = err?.statusCode || 500;
  const message =
    statusCode >= 500 && process.env.NODE_ENV === 'production'
      ? 'An unexpected server error occurred.'
      : err?.message || 'An unexpected server error occurred.';

  if (statusCode >= 500) {
    console.error(`[Server Error ${statusCode}]:`, err?.message || 'Unknown error');
  }

  return res.status(statusCode).json({ message });
}
