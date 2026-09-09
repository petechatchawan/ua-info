import { BrowserId, CPUArchitecture, OSId } from './constants';
import type { BrandVersion, ClientHints } from './input';
import type { BrowserId as BrowserIdType, CPUArchitecture as CPUArchitectureType, OSId as OSIdType } from './constants';

const PRODUCT_BRANDS: readonly { readonly brand: string; readonly name: BrowserIdType }[] = [
  { brand: 'Brave', name: BrowserId.Brave },
  { brand: 'Microsoft Edge', name: BrowserId.Edge },
  { brand: 'Opera', name: BrowserId.Opera },
  { brand: 'Google Chrome', name: BrowserId.Chrome },
];

export interface SelectedBrowserBrand {
  readonly name: BrowserIdType;
  readonly version: string;
}

export function selectBrowserBrand(brands: readonly BrandVersion[]): SelectedBrowserBrand | null {
  for (const candidate of PRODUCT_BRANDS) {
    const match = brands.find((item) => item.brand.toLowerCase() === candidate.brand.toLowerCase());
    if (match) return { name: candidate.name, version: match.version };
  }
  return null;
}

export function hasChromiumBrand(brands: readonly BrandVersion[]): boolean {
  return brands.some((item) => item.brand.toLowerCase() === 'chromium');
}

export function normalizePlatform(platform: string | null): OSIdType | null {
  if (!platform) return null;
  switch (platform.trim().toLowerCase()) {
    case 'android': return OSId.Android;
    case 'chrome os':
    case 'chromeos': return OSId.ChromeOS;
    case 'ios': return OSId.IOS;
    case 'ipados': return OSId.IPadOS;
    case 'linux': return OSId.Linux;
    case 'macos': return OSId.MacOS;
    case 'windows': return OSId.Windows;
    default: return null;
  }
}

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

function isGreaseBrand(brand: string): boolean {
  const normalized = brand.toLowerCase();
  return normalized.includes('not') && normalized.includes('brand');
}

export function isValidBrandVersion(value: string): boolean {
  return /^\d+(?:\.\d+)*$/.test(value);
}

export function parseBrandList(value: string | null): readonly BrandVersion[] {
  if (!value) return [];
  const brands: BrandVersion[] = [];
  const regex = /"([^"]+)"\s*;\s*v\s*=\s*"([^"]+)"/g;
  for (const match of value.matchAll(regex)) {
    const brand = match[1];
    const version = match[2];
    if (!brand || !isValidBrandVersion(version) || isGreaseBrand(brand)) continue;
    brands.push({ brand, version });
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

export function decodeClientHints(readHeader: HeaderReader): ClientHints {
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
