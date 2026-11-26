import { PROJECT_STATUSES } from '../models/Project.js';

/**
 * Validates an optional web URL (must start with http:// or https://).
 * Returns trimmed empty string if blank, or throws a 400 validation error.
 */
export function normalizeOptionalHttpUrl(value, fieldLabel) {
  if (value === undefined || value === null) {
    return '';
  }
  const trimmed = String(value).trim();
  if (!trimmed) {
    return '';
  }

  // Explicitly block MongoDB connection strings or credentials in URL fields
  if (/^mongodb(\+srv)?:\/\//i.test(trimmed)) {
    const err = new Error(
      `${fieldLabel} must be a web dashboard URL (https://...), never a MongoDB connection string or password.`
    );
    err.statusCode = 400;
    throw err;
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    const err = new Error(`${fieldLabel} must be a valid URL starting with https:// or http://.`);
    err.statusCode = 400;
    throw err;
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    const err = new Error(`${fieldLabel} must use http:// or https://.`);
    err.statusCode = 400;
    throw err;
  }

  return trimmed;
}

/**
 * Parses technologies from either an array or a comma-separated string,
 * deduplicating case-insensitively while preserving order.
 */
export function parseTechnologies(input) {
  if (input === undefined || input === null) {
    return [];
  }

  const rawList = Array.isArray(input)
    ? input
    : String(input)
        .split(',')
        .map((item) => item.trim());

  const seen = new Set();
  const result = [];
  for (const item of rawList) {
    const clean = String(item).trim();
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(clean);
    }
  }
  return result;
}

/**
 * Validates and normalizes project status.
 */
export function normalizeStatus(status) {
  if (!status) {
    return 'Completed';
  }
  const match = PROJECT_STATUSES.find((s) => s.toLowerCase() === String(status).trim().toLowerCase());
  if (!match) {
    const err = new Error(`Invalid status. Allowed values: ${PROJECT_STATUSES.join(', ')}.`);
    err.statusCode = 400;
    throw err;
  }
  return match;
}

/**
 * Parses an optional date string into a Date object or null.
 */
export function parseOptionalDate(value) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    const err = new Error('Project date must be a valid date.');
    err.statusCode = 400;
    throw err;
  }
  return parsed;
}
