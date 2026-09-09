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
    case 'armv7':
    case 'armv8':
      return { architecture: CPUArchitecture.ARM, bitness: bitness ?? 32 };
    case 'x86_64':
    case 'x64':
    case 'amd64':
      return { architecture: CPUArchitecture.X86_64, bitness: 64 };
    case 'x86':
    case 'i386':
    case 'i686':
      return { architecture: CPUArchitecture.X86, bitness: bitness ?? 32 };
    default:
      return null;
  }
}
