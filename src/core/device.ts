import { DEVICE_TYPES, type DeviceSignal } from '../catalog/devices';
import { VENDORS, type ModelRule } from '../catalog/vendors';
import type { OSId } from '../constants';
import type { ClientHints } from '../input';
import type { DeviceInfo, DeviceType } from '../types';
import { compileMatcher, pick, type Candidate } from './match';
import type { Scan } from './scan';

const MIN_MODEL_LENGTH = 2;
const MAX_MODEL_LENGTH = 48;
const BUILD_MARKER = ' build/';
const NOT_A_MODEL: ReadonlySet<string> = new Set([
  'wv', 'mobile', 'tablet', 'u', 'linux', 'harmonyos', 'arm', 'arm64', 'aarch64', 'x86', 'x86_64',
]);
const NOT_A_MODEL_PREFIXES: readonly string[] = ['rv:', 'hmscore', 'android'];

const DEVICE_MATCHER = compileMatcher<DeviceType, DeviceSignal>(DEVICE_TYPES);

interface ModelMatch {
  readonly vendor: string;
  readonly type: DeviceType | null;
}

const MODEL_PREFIXES = new Map<string, ModelMatch>();
const WORD_VENDORS = new Map<string, string>();
for (const row of Object.values(VENDORS)) {
  for (const word of row.words) WORD_VENDORS.set(word, row.label);
  for (const rule of row.models as readonly ModelRule[]) {
    const prefix = typeof rule === 'string' ? rule : rule.prefix;
    MODEL_PREFIXES.set(prefix.toLowerCase(), { vendor: row.label, type: typeof rule === 'string' ? null : rule.type });
  }
}
const PREFIX_LENGTHS: readonly number[] = [...new Set([...MODEL_PREFIXES.keys()].map((prefix) => prefix.length))].sort(
  (a, b) => b - a,
);

function isLetter(code: number): boolean {
  return code >= 97 && code <= 122;
}

function isLocale(lower: string): boolean {
  if (lower.length === 2) return isLetter(lower.charCodeAt(0)) && isLetter(lower.charCodeAt(1));
  if (lower.length !== 5 || (lower[2] !== '-' && lower[2] !== '_')) return false;
  return [0, 1, 3, 4].every((index) => isLetter(lower.charCodeAt(index)));
}

function cleanModel(raw: string): string | null {
  const build = raw.toLowerCase().indexOf(BUILD_MARKER);
  const text = (build >= 0 ? raw.slice(0, build) : raw).trim();
  const lower = text.toLowerCase();
  if (text.length < MIN_MODEL_LENGTH || text.length > MAX_MODEL_LENGTH) return null;
  if (NOT_A_MODEL.has(lower) || isLocale(lower)) return null;
  if (NOT_A_MODEL_PREFIXES.some((prefix) => lower.startsWith(prefix))) return null;
  if (text.indexOf(':') >= 0 || text.indexOf('/') >= 0) return null;
  return text;
}

/** The first part after the Android part, inside the same comment group, that is not metadata. */
function extractModel(scanned: Scan): string | null {
  const os = scanned.parts.findIndex((part) => part === 'android' || part.startsWith('android '));
  if (os < 0) return null;
  for (let index = os + 1; index < scanned.parts.length && scanned.partGroups[index] === scanned.partGroups[os]; index++) {
    const model = cleanModel(scanned.rawPart(index));
    if (model !== null) return model;
  }
  return null;
}

function vendorForModel(model: string): ModelMatch | null {
  const lower = model.toLowerCase();
  for (const length of PREFIX_LENGTHS) {
    if (lower.length < length) continue;
    const match = MODEL_PREFIXES.get(lower.slice(0, length));
    if (match) return match;
  }
  return null;
}

/** Splits a leading brand word off a model string: `SAMSUNG SM-G960F` is Samsung and `SM-G960F`. */
function splitBrand(model: string): { readonly vendor: string | null; readonly model: string } {
  const space = model.indexOf(' ');
  if (space > 0) {
    const vendor = WORD_VENDORS.get(model.slice(0, space).toLowerCase());
    const rest = model.slice(space + 1).trim();
    // Only a remainder that is itself one of the vendor's model codes drops the brand word.
    if (vendor !== undefined && rest.length >= MIN_MODEL_LENGTH && vendorForModel(rest)?.vendor === vendor) {
      return { vendor, model: rest };
    }
  }
  return { vendor: null, model };
}

export function resolveDevice(scanned: Scan, os: OSId | null, hints: ClientHints | null): DeviceInfo {
  const candidates: Candidate<DeviceType, DeviceSignal>[] = DEVICE_MATCHER.find(scanned, os);

  const extracted = extractModel(scanned);
  const split = extracted === null ? null : splitBrand(extracted);
  const vendorMatch = split === null ? null : vendorForModel(split.model);
  if (vendorMatch?.type) {
    candidates.push({ id: vendorMatch.type, source: 'ua', version: null, fallback: false, signal: null });
  }
  if (hints?.mobile === true) {
    candidates.push({ id: 'mobile', source: 'hints', version: null, fallback: true, signal: null });
  }

  const { id, survivors } = pick(candidates, DEVICE_MATCHER.beats);
  const seed = survivors.find((candidate) => candidate.id === id && candidate.signal?.vendor)?.signal ?? null;

  let vendor: string | null = split?.vendor ?? vendorMatch?.vendor ?? seed?.vendor ?? null;
  let model: string | null = split?.model ?? seed?.model ?? null;

  const hinted = hints?.model?.trim();
  if (hinted) {
    const hintSplit = splitBrand(hinted);
    model = hintSplit.model;
    vendor = hintSplit.vendor ?? labelOf(vendorForModel(hintSplit.model));
  }
  return { type: id, vendor, model };
}

function labelOf(match: ModelMatch | null): string | null {
  return match === null ? null : match.vendor;
}
