import { CPUArchitecture } from './constants';
import type { BrandVersion, ClientHints } from './input';
import type { CPUArchitecture as CPUArchitectureType } from './constants';

export interface NormalizedArchitecture {
  readonly architecture: CPUArchitectureType;
  readonly bitness: 32 | 64 | null;
}

export function normalizeArchitecture(
  architecture: string | null,
  bitness: ClientHints['bitness'],
): NormalizedArchitecture | null {
  if (!architecture) return null;
  switch (architecture.trim().toLowerCase()) {
    case 'arm64':
    case 'aarch64':
      return { architecture: CPUArchitecture.ARM64, bitness: 64 };
    case 'arm':
      if (bitness === 64) return { architecture: CPUArchitecture.ARM64, bitness: 64 };
      return { architecture: CPUArchitecture.ARM, bitness };
    case 'armv7':
    case 'armv8':
      return { architecture: CPUArchitecture.ARM, bitness: bitness ?? 32 };
    case 'x86_64':
    case 'x64':
    case 'amd64':
      return { architecture: CPUArchitecture.X86_64, bitness: 64 };
    case 'x86':
      if (bitness === 64) return { architecture: CPUArchitecture.X86_64, bitness: 64 };
      return { architecture: CPUArchitecture.X86, bitness };
    case 'i386':
    case 'i686':
      return { architecture: CPUArchitecture.X86, bitness: bitness ?? 32 };
    default:
      return null;
  }
}

export type HeaderReader = (name: string) => string | null;

function stripQuotes(value: string | null): string | null {
  if (value === null) return null;
  const trimmed = value.trim();
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }
  return trimmed || null;
}

export function isGreaseBrand(brand: string): boolean {
  const normalized = brand.toLowerCase();
  return normalized.includes('not') && normalized.includes('brand');
}

export function isValidBrandVersion(value: string): boolean {
  let digitsInSegment = 0;
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index);
    if (code >= 48 && code <= 57) {
      digitsInSegment++;
    } else if (code === 46 && digitsInSegment > 0) {
      digitsInSegment = 0;
    } else {
      return false;
    }
  }
  return digitsInSegment > 0;
}

const MAX_HEADER_LENGTH = 1024;

// Reads `"Brand";v="123", "Other";v="4"`. An entry that does not fit is skipped up to the next comma.
export function parseBrandList(value: string | null): readonly BrandVersion[] {
  if (!value) return [];
  const text = value.length > MAX_HEADER_LENGTH ? value.slice(0, MAX_HEADER_LENGTH) : value;
  const brands: BrandVersion[] = [];
  let index = 0;

  const skipSpaces = (): void => {
    while (index < text.length && (text[index] === ' ' || text[index] === '\t')) index++;
  };
  const readQuoted = (): string | null => {
    if (text[index] !== '"') return null;
    const end = text.indexOf('"', index + 1);
    if (end < 0) return null;
    const quoted = text.slice(index + 1, end);
    index = end + 1;
    return quoted;
  };
  const expect = (char: string): boolean => {
    skipSpaces();
    if (text[index] !== char) return false;
    index++;
    skipSpaces();
    return true;
  };

  while (index < text.length) {
    skipSpaces();
    const brand = readQuoted();
    let version: string | null = null;
    if (brand !== null && expect(';') && expect('v') && expect('=')) version = readQuoted();
    if (brand && version && isValidBrandVersion(version) && !isGreaseBrand(brand)) brands.push({ brand, version });
    const comma = text.indexOf(',', index);
    index = comma < 0 ? text.length : comma + 1;
  }
  return brands;
}

function parseMobile(value: string | null): boolean | null {
  const normalized = value?.trim();
  if (normalized === '?1') return true;
  if (normalized === '?0') return false;
  return null;
}

function parseBitness(value: string | null): 32 | 64 | null {
  const normalized = stripQuotes(value);
  if (normalized === '32') return 32;
  if (normalized === '64') return 64;
  return null;
}

export function decodeClientHints(rawReader: HeaderReader): ClientHints {
  const readHeader: HeaderReader = (name) => {
    const value = rawReader(name);
    return value !== null && value.length > MAX_HEADER_LENGTH ? value.slice(0, MAX_HEADER_LENGTH) : value;
  };
  const significant = parseBrandList(readHeader('sec-ch-ua'));
  const full = parseBrandList(readHeader('sec-ch-ua-full-version-list'));
  return {
    brands: full.length > 0 ? full : significant,
    mobile: parseMobile(readHeader('sec-ch-ua-mobile')),
    platform: stripQuotes(readHeader('sec-ch-ua-platform')),
    platformVersion: stripQuotes(readHeader('sec-ch-ua-platform-version')),
    architecture: stripQuotes(readHeader('sec-ch-ua-arch')),
    bitness: parseBitness(readHeader('sec-ch-ua-bitness')),
    model: stripQuotes(readHeader('sec-ch-ua-model')),
  };
}
