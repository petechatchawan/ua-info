import type { Version } from './types';

export function parseVersion(raw: string): Version {
  const full = raw;
  const match = /^(\d+)/.exec(raw);
  const major = match ? Number.parseInt(match[1], 10) : null;
  return { full, major: Number.isSafeInteger(major) ? major : null };
}
