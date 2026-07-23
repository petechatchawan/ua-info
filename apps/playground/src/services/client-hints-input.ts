import type { ClientHintsInputError } from '../app/playground-state';
import type { ClientHintHeaders } from './ua-detection-service';

const MAX_CLIENT_HINTS_LENGTH = 32_768;
const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

export type ParseClientHintsResult =
  | { readonly ok: true; readonly headers: ClientHintHeaders | null }
  | { readonly ok: false; readonly error: ClientHintsInputError };

function failure(
  code: ClientHintsInputError['code'],
  message: string,
): ParseClientHintsResult {
  return { ok: false, error: { code, message } };
}

export function parseClientHintsInput(text: string): ParseClientHintsResult {
  if (text.trim().length === 0) return { ok: true, headers: null };
  if (text.length > MAX_CLIENT_HINTS_LENGTH) {
    return failure('too-large', 'Client Hints JSON must not exceed 32 KiB.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return failure(
      'invalid-json',
      error instanceof Error ? error.message : 'Client Hints JSON is invalid.',
    );
  }

  if (parsed === null || Array.isArray(parsed) || typeof parsed !== 'object') {
    return failure('invalid-root', 'Client Hints must be a JSON object.');
  }

  const headers: Record<string, string | readonly string[]> = Object.create(null);
  for (const [rawKey, value] of Object.entries(parsed)) {
    const key = rawKey.toLowerCase();
    if (DANGEROUS_KEYS.has(key)) {
      return failure('dangerous-key', `Client Hints key "${rawKey}" is not allowed.`);
    }
    if (typeof value === 'string') {
      headers[key] = value;
      continue;
    }
    if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
      headers[key] = Object.freeze([...value]);
      continue;
    }
    return failure(
      'invalid-value',
      `Header "${rawKey}" must be a string or an array of strings.`,
    );
  }

  return { ok: true, headers: Object.freeze(headers) };
}
