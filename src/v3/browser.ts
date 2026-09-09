import { isValidBrandVersion } from './client-hints';
import { enrich } from './enrich';
import type { BrandVersion, ClientHints, RuntimeEvidence } from './input';
import { parse } from './parse';
import type { UAInfo } from './types';

export interface LiffAdapter {
  isInClient(): boolean;
}

export interface DetectOptions {
  readonly highEntropy?: boolean;
  readonly liff?: LiffAdapter;
}

interface UserAgentDataLike {
  readonly brands?: readonly BrandVersion[];
  readonly mobile?: boolean;
  readonly platform?: string;
  getHighEntropyValues?(hints: readonly string[]): Promise<Record<string, unknown>>;
}

interface NavigatorLike {
  readonly userAgent?: string;
  readonly userAgentData?: UserAgentDataLike;
  readonly standalone?: boolean;
}

const HIGH_ENTROPY_HINTS = [
  'architecture',
  'bitness',
  'fullVersionList',
  'model',
  'platformVersion',
] as const;

function normalizeBitness(value: unknown): 32 | 64 | null {
  if (value === 32 || value === '32') return 32;
  if (value === 64 || value === '64') return 64;
  return null;
}

function normalizeBrands(value: unknown): readonly BrandVersion[] | null {
  if (!Array.isArray(value)) return null;
  const brands = value.filter((item): item is BrandVersion => {
    if (!item || typeof item !== 'object') return false;
    const candidate = item as { brand?: unknown; version?: unknown };
    return (
      typeof candidate.brand === 'string' &&
      typeof candidate.version === 'string' &&
      isValidBrandVersion(candidate.version)
    );
  });
  return brands.length > 0 ? brands : null;
}

async function readClientHints(data: UserAgentDataLike | undefined, highEntropy: boolean): Promise<ClientHints | null> {
  if (!data) return null;

  let values: Record<string, unknown> | null = null;
  if (highEntropy && typeof data.getHighEntropyValues === 'function') {
    try {
      values = await data.getHighEntropyValues([...HIGH_ENTROPY_HINTS]);
    } catch {
      values = null;
    }
  }

  const fullBrands = normalizeBrands(values?.fullVersionList);
  const lowEntropyBrands = normalizeBrands(data.brands);
  return {
    brands: fullBrands ?? lowEntropyBrands ?? [],
    mobile: typeof data.mobile === 'boolean' ? data.mobile : null,
    platform: typeof data.platform === 'string' ? data.platform : null,
    platformVersion: typeof values?.platformVersion === 'string' ? values.platformVersion : null,
    architecture: typeof values?.architecture === 'string' ? values.architecture : null,
    bitness: normalizeBitness(values?.bitness),
    model: typeof values?.model === 'string' && values.model.length > 0 ? values.model : null,
  };
}

function readLiff(options: DetectOptions): boolean | null {
  if (!options.liff) return null;
  try {
    return options.liff.isInClient();
  } catch {
    return null;
  }
}

function readStandalonePWA(navigatorValue: NavigatorLike): boolean | null {
  if (navigatorValue.standalone === true) return true;
  const media = (globalThis as typeof globalThis & {
    matchMedia?: (query: string) => { readonly matches: boolean };
  }).matchMedia;
  if (typeof media === 'function') return media('(display-mode: standalone)').matches;
  return null;
}

export async function detect(options: DetectOptions = {}): Promise<UAInfo> {
  const navigatorValue = (globalThis as typeof globalThis & { navigator?: NavigatorLike }).navigator;
  if (!navigatorValue) {
    throw new Error('detect() requires a browser navigator. Use parse() or parseRequest() outside the browser.');
  }

  const ua = navigatorValue.userAgent ?? '';
  const clientHints = await readClientHints(navigatorValue.userAgentData, options.highEntropy === true);
  const runtime: RuntimeEvidence = {
    standalonePWA: readStandalonePWA(navigatorValue),
    liffInClient: readLiff(options),
  };
  return enrich(parse(ua), { ua, clientHints, runtime });
}
