import crypto from 'node:crypto';
import path from 'node:path';
import { v2 as cloudinary } from 'cloudinary';

let configuredSignature = '';

function isPlaceholder(value) {
  if (!value) return true;
  const trimmed = String(value).trim();
  if (!trimmed) return true;
  return (
    /^your_/i.test(trimmed) ||
    /^<.*>$/.test(trimmed) ||
    trimmed.toLowerCase().includes('replace_with')
  );
}

/**
 * Checks whether all required Cloudinary credentials are set and non-placeholder.
 */
export function isCloudinaryConfigured() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  return !isPlaceholder(cloudName) && !isPlaceholder(apiKey) && !isPlaceholder(apiSecret);
}

/**
 * Lazily configures the Cloudinary SDK from environment variables.
 */
export function ensureCloudinaryConfigured() {
  if (!isCloudinaryConfigured()) {
    const error = new Error(
      'Cloudinary cloud storage is not configured. Please set valid CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend environment variables.'
    );
    error.statusCode = 500;
    throw error;
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET.trim();
  const sig = `${cloudName}:${apiKey.slice(0, 4)}`;

  if (configuredSignature !== sig) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    configuredSignature = sig;
  }
}

function buildSafePublicId(originalFilename, includeExtension = false) {
  const base = path.basename(String(originalFilename || 'file'));
  const ext = path.extname(base).toLowerCase().replace(/[^.a-z0-9]/g, '');
  const stem = path
    .basename(base, ext)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48) || 'asset';
  const uid = crypto.randomUUID().slice(0, 12);
  return includeExtension && ext ? `${Date.now()}_${uid}_${stem}${ext}` : `${Date.now()}_${uid}_${stem}`;
}

/**
 * Uploads an in-memory file buffer to Cloudinary with unique safe identifiers.
 * PDFs use resource_type 'raw' so exact bytes and public delivery work reliably across Cloudinary tiers.
 */
export function uploadBufferToCloudinary(
  buffer,
  { folder, resourceType = 'image', originalFilename, formatHint = '' } = {}
) {
  ensureCloudinaryConfigured();

  return new Promise((resolve, reject) => {
    const options = {
      folder: folder || 'project-vault',
      resource_type: resourceType,
      public_id: buildSafePublicId(originalFilename, resourceType === 'raw'),
      use_filename: false,
      unique_filename: false,
      overwrite: false,
    };

    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error || !result?.secure_url) {
        const safeErr = new Error('Cloud storage upload failed. Please verify Cloudinary configuration and try again.');
        safeErr.statusCode = 502;
        return reject(safeErr);
      }

      resolve({
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type || resourceType,
        format: (result.format || formatHint || '').toLowerCase(),
        bytes: result.bytes || buffer.length,
      });
    });

    uploadStream.end(buffer);
  });
}

/**
 * Deletes an asset from Cloudinary if a publicId is provided.
 * Swallows non-fatal errors without printing secrets.
 */
export async function deleteFromCloudinary(publicId, resourceType = 'image') {
  if (!publicId || !isCloudinaryConfigured()) {
    return;
  }

  ensureCloudinaryConfigured();
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.warn(`Cloudinary cleanup warning for asset (${publicId}): ${err.message}`);
  }
}

/**
 * Best-effort rollback for newly uploaded Cloudinary assets when a subsequent operation fails.
 */
export async function rollbackCloudinaryAssets(assets = []) {
  if (!Array.isArray(assets) || assets.length === 0) return;
  await Promise.allSettled(
    assets
      .filter((a) => a && a.publicId)
      .map((a) => deleteFromCloudinary(a.publicId, a.resourceType || 'image'))
  );
}

export default cloudinary;
