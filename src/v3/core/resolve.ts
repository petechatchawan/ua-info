import { BROWSERS, NEUTRAL_PRODUCTS, type BrowserSignal } from '../catalog/browsers';
import { CLIENTS, GENERIC_BOT_SUFFIXES } from '../catalog/clients';
import { CONTEXTS, type UserAgentContextId } from '../catalog/contexts';
import { CPUS, type CPUSignal } from '../catalog/cpus';
import { OPERATING_SYSTEMS } from '../catalog/os';
import type { BrowserId, CPUArchitecture, EngineId, OSId } from '../constants';
import { ContextId, EngineId as Engines } from '../constants';
import { normalizeArchitecture } from '../client-hints';
import type { ClientHints, RuntimeEvidence } from '../input';
import type {
  BrowserFamily,
  BrowserInfo,
  BrowserMode,
  ClientInfo,
  ContextInfo,
  CPUInfo,
  EngineInfo,
  OSInfo,
  UAInfo,
  Version,
} from '../types';
import { resolveDevice } from './device';
import { compileMatcher, pick, strongestVersion, type Candidate } from './match';
import { MAX_UA_LENGTH, readVersion, scan, type Scan } from './scan';

const BROWSER_MATCHER = compileMatcher<BrowserId, BrowserSignal>(BROWSERS);
const CONTEXT_MATCHER = compileMatcher<UserAgentContextId>(CONTEXTS);
const CLIENT_MATCHER = compileMatcher<string>(CLIENTS);
const OS_MATCHER = compileMatcher<OSId>(OPERATING_SYSTEMS);
const CPU_MATCHER = compileMatcher<CPUArchitecture, CPUSignal>(CPUS);

const ACCOUNTED_PRODUCTS: ReadonlySet<string> = new Set([
  ...BROWSER_MATCHER.productNames(),
  ...CONTEXT_MATCHER.productNames(),
  ...NEUTRAL_PRODUCTS,
]);

const PLATFORM_TO_OS = new Map<string, OSId>();
for (const id of Object.keys(OPERATING_SYSTEMS) as OSId[]) {
  for (const platform of OPERATING_SYSTEMS[id].platforms) PLATFORM_TO_OS.set(platform.toLowerCase(), id);
}

const BRAND_TO_BROWSER = new Map<string, BrowserId>();
for (const id of Object.keys(BROWSERS) as BrowserId[]) {
  for (const brand of BROWSERS[id].brands) BRAND_TO_BROWSER.set(brand.toLowerCase(), id);
}

function hasUnaccountedProduct(scanned: Scan): boolean {
  return scanned.products.some((product) => product.top && !ACCOUNTED_PRODUCTS.has(product.name));
}

function isWebViewUserAgent(scanned: Scan): boolean {
  if (scanned.parts.includes('wv')) return true;
  const firstChrome = scanned.products.findIndex((product) => product.name === 'chrome');
  if (firstChrome < 0) return false;
  return scanned.products
    .slice(0, firstChrome)
    .some((product) => product.name === 'version' && (product.version ?? '').startsWith('4.0'));
}

function hintCandidates(hints: ClientHints | null): Candidate<BrowserId, BrowserSignal>[] {
  const found: Candidate<BrowserId, BrowserSignal>[] = [];
  for (const { brand, version } of hints?.brands ?? []) {
    const id = BRAND_TO_BROWSER.get(brand.toLowerCase());
    if (id === undefined) continue;
    found.push({
      id,
      source: 'hints',
      version: readVersion(version),
      fallback: BROWSERS[id].brandIsFallback === true,
      signal: null,
    });
  }
  return found;
}

interface BrowserResolution {
  readonly browser: BrowserInfo;
  readonly engine: EngineId | null | undefined;
}

function resolveBrowser(scanned: Scan, os: OSId | null, hints: ClientHints | null): BrowserResolution {
  const candidates = [...BROWSER_MATCHER.find(scanned, os), ...hintCandidates(hints)];
  const chromiumBrand = hints?.brands.find((item) => item.brand.toLowerCase() === 'chromium') ?? null;
  const { id: picked, survivors } = pick(candidates, BROWSER_MATCHER.beats);

  const row = picked ? BROWSERS[picked] : null;
  const signal = survivors.find((candidate) => candidate.id === picked && candidate.signal)?.signal ?? null;
  const dropped = picked !== null && survivors.every((c) => c.fallback) && hasUnaccountedProduct(scanned);
  const id = dropped ? null : picked;

  let family: BrowserFamily | null = null;
  let engine: EngineId | null | undefined;
  if (row) {
    family = signal?.family !== undefined ? signal.family : row.family;
    engine = signal?.engine !== undefined ? signal.engine : row.engine;
  } else {
    const families = new Set(survivors.map((candidate) => BROWSERS[candidate.id].family));
    if (families.size === 1) family = [...families][0];
  }
  if (family === null && chromiumBrand) family = 'chromium';

  let version = id ? strongestVersion(candidates, id) : null;
  if (id === 'chromium' && chromiumBrand) version = readVersion(chromiumBrand.version) ?? version;

  let mode: BrowserMode | null = null;
  if (signal?.mode) {
    mode = signal.mode;
  } else if (id !== null || family !== null) {
    const generic = id === null ? family === 'chromium' : id === 'chrome' || id === 'chromium';
    mode = generic && isWebViewUserAgent(scanned) ? 'webview' : 'browser';
  }
  return { browser: { name: id, version, family, mode }, engine };
}

function resolveEngine(
  scanned: Scan,
  os: OSId | null,
  declared: EngineId | null | undefined,
): EngineInfo {
  const webKitVersion = (): EngineInfo => ({
    name: Engines.WebKit,
    version: readVersion(scanned.products.find((product) => product.name === 'applewebkit')?.version ?? null),
  });
  const geckoVersion = (): EngineInfo => {
    const rv = scanned.parts.find((part) => part.startsWith('rv:'));
    return { name: Engines.Gecko, version: readVersion(rv ? rv.slice(3) : null) };
  };

  if (os === 'ios' || os === 'ipados') return webKitVersion();
  if (declared === Engines.Blink) return { name: Engines.Blink, version: null };
  if (declared === Engines.Gecko) return geckoVersion();
  if (declared === Engines.WebKit) return webKitVersion();
  if (declared === null) return { name: null, version: null };

  const gecko = scanned.products.find((product) => product.name === 'gecko');
  if (gecko && readVersion(gecko.version)) return geckoVersion();
  if (readVersion(scanned.products.find((product) => product.name === 'applewebkit')?.version ?? null)) {
    return webKitVersion();
  }
  return { name: null, version: null };
}

const NO_CONTEXT: ContextInfo = { type: null, name: null, host: null };

function resolveContext(scanned: Scan, runtime: RuntimeEvidence | null): ContextInfo {
  const candidates = CONTEXT_MATCHER.find(scanned, null);
  const { id } = pick(candidates, CONTEXT_MATCHER.beats);
  let context: ContextInfo = NO_CONTEXT;
  if (id !== null) {
    context = {
      type: CONTEXTS[id].type,
      name: id,
      host: { name: id, version: strongestVersion(candidates, id) },
    };
  }

  if (runtime?.liffInClient === true) {
    const lineVersion = context.host?.name === ContextId.Line ? context.host.version : null;
    return {
      type: 'mini-app',
      name: ContextId.Liff,
      host: { name: ContextId.Line, version: lineVersion },
    };
  }
  if (runtime?.standalonePWA === true && context.type === null) {
    return { type: 'pwa', name: ContextId.PWA, host: null };
  }
  return context;
}

function scaleVersion(id: OSId, version: Version | null, source: 'ua' | 'hints'): Version | null {
  if (version === null) return null;
  const scale = OPERATING_SYSTEMS[id].scale;
  if (source === 'hints') {
    const mapped = scale?.hint?.(version);
    return mapped === undefined ? version : readVersion(mapped);
  }
  const table = scale?.ua;
  if (table && Object.prototype.hasOwnProperty.call(table, version.full)) return readVersion(table[version.full]);
  return version;
}

function resolveOS(scanned: Scan, hints: ClientHints | null): OSInfo {
  const candidates = OS_MATCHER.find(scanned, null).map((candidate) => ({
    ...candidate,
    version: scaleVersion(candidate.id, candidate.version, 'ua'),
  }));
  const hintOS = hints?.platform ? PLATFORM_TO_OS.get(hints.platform.trim().toLowerCase()) : undefined;
  if (hintOS !== undefined) {
    const platformVersion = hints?.platformVersion ? readVersion(hints.platformVersion) : null;
    candidates.push({
      id: hintOS,
      source: 'hints',
      version: scaleVersion(hintOS, platformVersion, 'hints'),
      fallback: false,
      signal: null,
    });
  }
  const { id } = pick(candidates, OS_MATCHER.beats);
  return { name: id, version: id ? strongestVersion(candidates, id) : null };
}

function resolveCPU(scanned: Scan, hints: ClientHints | null): CPUInfo {
  const candidates = CPU_MATCHER.find(scanned, null);
  const { id, survivors } = pick(candidates, CPU_MATCHER.beats);
  const base: CPUInfo =
    id === null ? { architecture: null, bitness: null } : { architecture: id, bitness: survivors[0].signal?.bitness ?? null };
  if (!hints) return base;

  const hinted = normalizeArchitecture(hints.architecture, hints.bitness);
  if (hinted) {
    const weakerCompatible =
      hinted.bitness === null &&
      (hinted.architecture === base.architecture ||
        (hinted.architecture === 'arm' && base.architecture === 'arm64') ||
        (hinted.architecture === 'x86' && base.architecture === 'x86_64'));
    return weakerCompatible ? base : hinted;
  }
  return hints.bitness !== null ? { ...base, bitness: hints.bitness } : base;
}

const NO_CLIENT: ClientInfo = { type: null, name: null, version: null };

function resolveClient(scanned: Scan): ClientInfo {
  const candidates = CLIENT_MATCHER.find(scanned, null);
  const { id } = pick(candidates, CLIENT_MATCHER.beats);
  if (id !== null) return { type: CLIENTS[id].type, name: id, version: strongestVersion(candidates, id) };

  const generic = scanned.products.find((product) =>
    GENERIC_BOT_SUFFIXES.some((suffix) => product.name.endsWith(suffix)),
  );
  if (generic) return { type: 'bot', name: generic.name, version: readVersion(generic.version) };
  return NO_CLIENT;
}

export function resolve(ua: string, hints: ClientHints | null, runtime: RuntimeEvidence | null): UAInfo {
  const text = ua.length > MAX_UA_LENGTH ? ua.slice(0, MAX_UA_LENGTH) : ua;
  const scanned = scan(text);
  const os = resolveOS(scanned, hints);
  const uaOS = hints ? resolveOS(scanned, null) : os;
  const { browser, engine } = resolveBrowser(scanned, uaOS.name, hints);
  const context = resolveContext(scanned, runtime);

  const embedded = context.type === 'in-app-browser' || context.type === 'mini-app';
  const mode = embedded ? (browser.mode === 'headless' ? 'headless' : 'webview') : browser.mode;

  return {
    ua,
    browser: { ...browser, mode },
    engine: resolveEngine(scanned, uaOS.name, engine),
    os,
    device: resolveDevice(scanned, uaOS.name, hints),
    cpu: resolveCPU(scanned, hints),
    client: resolveClient(scanned),
    context,
  };
}
