import { resolve } from '../core/resolve';
import type { ClientHints, DetectionInput } from '../input';
import { parse } from '../parse';
import type { UAInfo } from '../types';

function enrich(_base: UAInfo, input: DetectionInput): UAInfo {
  return resolve(input.ua, input.clientHints, input.runtime);
}

const chromeUA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';
const miBrowserUA =
  'Mozilla/5.0 (Linux; U; Android 14; en-us; 23127PN0CG) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Version/4.0 Chrome/120.0.0.0 Mobile Safari/537.36 XiaoMi/MiuiBrowser/18.4.110316';

function hints(overrides: Partial<ClientHints> = {}): ClientHints {
  return {
    brands: [],
    mobile: null,
    platform: null,
    platformVersion: null,
    architecture: null,
    bitness: null,
    model: null,
    ...overrides,
  };
}

describe('Client Hints enrichment', () => {
  it('does not let generic Chromium hints erase Mi Browser', () => {
    const result = enrich(parse(miBrowserUA), {
      ua: miBrowserUA,
      clientHints: hints({
        brands: [{ brand: 'Chromium', version: '150' }],
        mobile: true,
        platform: 'Android',
      }),
      runtime: null,
    });
    expect(result.browser.name).toBe('mi-browser');
    expect(result.browser.family).toBe('chromium');
  });

  it('refines Chrome-like UA to Brave from a specific brand', () => {
    const result = enrich(parse(chromeUA), {
      ua: chromeUA,
      clientHints: hints({
        brands: [
          { brand: 'Brave', version: '150.0.7339.80' },
          { brand: 'Chromium', version: '150' },
        ],
        mobile: false,
        platform: 'macOS',
      }),
      runtime: null,
    });
    expect(result.browser).toMatchObject({
      name: 'brave',
      family: 'chromium',
      version: { full: '150.0.7339.80', major: 150 },
    });
  });

  it('prefers a specific Edge brand over Chrome-compatible UA evidence', () => {
    const result = enrich(parse(chromeUA), {
      ua: chromeUA,
      clientHints: hints({
        brands: [
          { brand: 'Microsoft Edge', version: '151.0.0.0' },
          { brand: 'Google Chrome', version: '151' },
          { brand: 'Chromium', version: '151' },
        ],
      }),
      runtime: null,
    });
    expect(result.browser.name).toBe('edge');
    expect(result.browser.version?.full).toBe('151.0.0.0');
  });

  it('enriches the same product with a full version', () => {
    const result = enrich(parse(chromeUA), {
      ua: chromeUA,
      clientHints: hints({ brands: [{ brand: 'Google Chrome', version: '150.0.7339.80' }] }),
      runtime: null,
    });
    expect(result.browser.name).toBe('chrome');
    expect(result.browser.version).toEqual({ full: '150.0.7339.80', major: 150 });
  });

  it('does not apply a Chrome version to an incompatible Edge identity', () => {
    const edge = parse(`${chromeUA} Edg/150.0.0.0`);
    const result = enrich(edge, {
      ua: edge.ua,
      clientHints: hints({ brands: [{ brand: 'Google Chrome', version: '151.0.1.0' }] }),
      runtime: null,
    });
    expect(result.browser.name).toBe('edge');
    expect(result.browser.version?.full).toBe('150.0.0.0');
  });

  it('drops a previous browser version when Client Hints change product without a version', () => {
    const result = enrich(parse(chromeUA), {
      ua: chromeUA,
      clientHints: hints({ brands: [{ brand: 'Brave', version: '' }] }),
      runtime: null,
    });
    expect(result.browser.name).toBe('brave');
    expect(result.browser.version).toBeNull();
  });

  it('does not infer desktop from a non-mobile hint alone', () => {
    const base = parse('CustomAgent/1.0');
    const result = enrich(base, {
      ua: base.ua,
      clientHints: hints({ mobile: false, platform: 'Android' }),
      runtime: null,
    });
    expect(result.os.name).toBe('android');
    expect(result.device.type).toBeNull();
  });

  it('preserves a tablet when mobile is false', () => {
    const ipad = parse(
      'Mozilla/5.0 (iPad; CPU OS 18_7 like Mac OS X) AppleWebKit/605.1.15 ' +
      '(KHTML, like Gecko) Version/18.7 Mobile/15E148 Safari/604.1',
    );
    const result = enrich(ipad, {
      ua: ipad.ua,
      clientHints: hints({ mobile: false }),
      runtime: null,
    });
    expect(result.device.type).toBe('tablet');
  });

  it('preserves the base OS for an unknown platform', () => {
    const base = parse(miBrowserUA);
    const result = enrich(base, {
      ua: base.ua,
      clientHints: hints({ platform: 'MysteryOS', platformVersion: '99.1' }),
      runtime: null,
    });
    expect(result.os).toEqual(base.os);
  });

  it.each([
    ['arm64', 'arm64', 64],
    ['aarch64', 'arm64', 64],
    ['x86_64', 'x86_64', 64],
    ['amd64', 'x86_64', 64],
  ] as const)('normalizes %s architecture as %s/%s', (raw, architecture, bitness) => {
    const base = parse(chromeUA);
    const result = enrich(base, {
      ua: base.ua,
      clientHints: hints({ architecture: raw }),
      runtime: null,
    });
    expect(result.cpu).toEqual({ architecture, bitness });
  });

  it.each([
    ['arm', 'arm64'],
    ['x86', 'x86_64'],
  ] as const)('uses 64-bit Client Hints bitness to canonicalize %s as %s', (raw, architecture) => {
    const base = parse(chromeUA);
    const result = enrich(base, {
      ua: base.ua,
      clientHints: hints({ architecture: raw, bitness: 64 }),
      runtime: null,
    });
    expect(result.cpu).toEqual({ architecture, bitness: 64 });
  });

  it('preserves stronger compatible CPU evidence when an architecture hint omits bitness', () => {
    const base = parse(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150.0.0.0 Safari/537.36',
    );
    const result = enrich(base, {
      ua: base.ua,
      clientHints: hints({ architecture: 'x86' }),
      runtime: null,
    });
    expect(result.cpu).toEqual({ architecture: 'x86_64', bitness: 64 });
  });

  it('keeps generic architecture bitness unknown without stronger evidence', () => {
    const base = parse('CustomAgent/1.0');
    const result = enrich(base, {
      ua: base.ua,
      clientHints: hints({ architecture: 'x86' }),
      runtime: null,
    });
    expect(result.cpu).toEqual({ architecture: 'x86', bitness: null });
  });

  it('preserves bitness when architecture remains unknown', () => {
    const base = parse('CustomAgent/1.0');
    const result = enrich(base, {
      ua: base.ua,
      clientHints: hints({ bitness: 64 }),
      runtime: null,
    });
    expect(result.cpu).toEqual({ architecture: null, bitness: 64 });
  });

  it('enriches an established Chromium product from matching Chromium hints', () => {
    const ua =
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chromium/150.0.0.0 Safari/537.36';
    const base = parse(ua);
    const result = enrich(base, {
      ua,
      clientHints: hints({ brands: [{ brand: 'Chromium', version: '150.0.7339.80' }] }),
      runtime: null,
    });
    expect(result.browser.name).toBe('chromium');
    expect(result.browser.version).toEqual({ full: '150.0.7339.80', major: 150 });
  });

  it('generic Chromium evidence can establish family without inventing a product', () => {
    const base = parse('CustomAgent/1.0');
    const result = enrich(base, {
      ua: base.ua,
      clientHints: hints({ brands: [{ brand: 'Chromium', version: '150' }] }),
      runtime: null,
    });
    expect(result.browser.name).toBeNull();
    expect(result.browser.family).toBe('chromium');
  });
});
