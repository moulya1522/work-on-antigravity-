import slugify from 'slugify';
import Project from '../models/Project.js';

/**
 * Generates a unique URL-safe slug from a project name.
 * If a slug collision occurs, appends -2, -3, etc.
 */
export async function generateUniqueSlug(name, excludeProjectId = null) {
  const base =
    slugify(String(name || ''), {
      lower: true,
      strict: true,
      trim: true,
    }) || 'project';

  let candidate = base;
  let counter = 2;

  while (true) {
    const query = { slug: candidate };
    if (excludeProjectId) {
      query._id = { $ne: excludeProjectId };
    }
    const existing = await Project.findOne(query).select('_id').lean();
    if (!existing) {
      return candidate;
    }
    candidate = `${base}-${counter}`;
    counter += 1;
  }
}
