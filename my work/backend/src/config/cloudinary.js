import { v2 as cloudinary } from 'cloudinary';

let configured = false;

/**
 * Checks whether all required Cloudinary credentials are set.
 */
export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

/**
 * Lazily configures the Cloudinary SDK from environment variables.
 */
export function ensureCloudinaryConfigured() {
  if (!isCloudinaryConfigured()) {
    const error = new Error(
      'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your environment variables.'
    );
    error.statusCode = 500;
    throw error;
  }

  if (!configured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    configured = true;
  }
}

/**
 * Uploads an in-memory file buffer to Cloudinary.
 * PDFs use resource_type 'raw' so exact bytes and public delivery work reliably across all Cloudinary tiers.
 */
export function uploadBufferToCloudinary(buffer, { folder, resourceType = 'image', originalFilename } = {}) {
  ensureCloudinaryConfigured();

  return new Promise((resolve, reject) => {
    const options = {
      folder: folder || 'project-vault',
      resource_type: resourceType,
      use_filename: true,
      unique_filename: true,
    };

    if (resourceType === 'raw' && originalFilename) {
      // Preserve .pdf extension in raw public_id so direct browser previews recognize it cleanly
      const sanitized = originalFilename
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/_{2,}/g, '_');
      options.public_id = `${Date.now()}_${sanitized}`;
      options.use_filename = false;
      options.unique_filename = false;
    }

    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve({
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type || resourceType,
        bytes: result.bytes || buffer.length,
      });
    });

    uploadStream.end(buffer);
  });
}

/**
 * Deletes an asset from Cloudinary if a publicId is provided.
 * Swallows non-fatal missing-asset errors so DB cleanup is never blocked.
 */
export async function deleteFromCloudinary(publicId, resourceType = 'image') {
  if (!publicId || !isCloudinaryConfigured()) {
    return;
  }

  ensureCloudinaryConfigured();
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.warn(`Failed to delete Cloudinary asset (${publicId}):`, err.message);
  }
}

export default cloudinary;
