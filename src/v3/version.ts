import type { Version } from './types';

export function parseVersion(raw: string): Version {
  let major = 0;
  let digits = 0;
  while (digits < raw.length && raw.charCodeAt(digits) >= 48 && raw.charCodeAt(digits) <= 57) {
    major = major * 10 + (raw.charCodeAt(digits) - 48);
    digits++;
  }
  return { full: raw, major: digits > 0 && Number.isSafeInteger(major) ? major : null };
}
