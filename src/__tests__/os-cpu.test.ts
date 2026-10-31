import { resolve } from '../core/resolve';
import type { ClientHints } from '../input';
import { parse } from '../parse';

function hints(overrides: Partial<ClientHints>): ClientHints {
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

const windowsUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36';

describe('OS from the User-Agent', () => {
  it.each([
    ['Windows NT 10.0', '10'],
    ['Windows NT 6.3', '8.1'],
    ['Windows NT 6.2', '8'],
    ['Windows NT 6.1', '7'],
    ['Windows NT 99.1', '99.1'],
  ])('maps %s to marketing version %s', (part, full) => {
    expect(parse(`Mozilla/5.0 (${part}; Win64; x64)`).os).toMatchObject({ name: 'windows', version: { full } });
  });

  it.each(['Windows NT 6.0', 'Windows NT 5.1', 'Windows NT 5.0'])('reports %s as Windows without a version', (part) => {
    expect(parse(`Mozilla/5.0 (${part})`).os).toEqual({ name: 'windows', version: null });
  });

  it('reads Windows Phone before the Android token it carries', () => {
    const ua = 'Mozilla/5.0 (Windows Phone 10.0; Android 6.0.1; Microsoft; Lumia 950) AppleWebKit/537.36';
    expect(parse(ua).os).toMatchObject({ name: 'windows', version: { full: '10' } });
  });

  it('reads iPadOS before iOS for an iPad that says iPhone OS', () => {
    expect(parse('Mozilla/5.0 (iPad; CPU iPhone OS 3_2 like Mac OS X)').os).toMatchObject({ name: 'ipados' });
    expect(parse('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X)').os).toMatchObject({
      name: 'ios',
      version: { full: '17.5.1', major: 17 },
    });
  });

  it('keeps a decimal macOS version', () => {
    expect(parse('Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:132.0)').os.version?.full).toBe('10.15');
  });

  it('reports Android without a version and prefers it to Linux', () => {
    expect(parse('Opera/9.80 (Android; Opera Mini/36.2.2254/119.132; U; id)').os).toEqual({ name: 'android', version: null });
  });

  it('reports HarmonyOS with or without a version', () => {
    expect(parse('Mozilla/5.0 (Linux; Android 10; HarmonyOS; ELS-AN00)').os.name).toBe('harmonyos');
    expect(parse('Mozilla/5.0 HarmonyOS/4.2').os).toMatchObject({ name: 'harmonyos', version: { full: '4.2' } });
  });

  it('falls back to Linux only when nothing more specific is present', () => {
    expect(parse('Mozilla/5.0 (X11; Linux x86_64)').os).toEqual({ name: 'linux', version: null });
    expect(parse('Mozilla/5.0 (X11; Linux x86_64; Tizen 8.0)').os.name).toBe('tizen');
  });

  it('reads the Chrome OS version after the architecture word', () => {
    expect(parse('Mozilla/5.0 (X11; CrOS x86_64 16000.0.0)').os).toMatchObject({
      name: 'chromeos',
      version: { full: '16000.0.0' },
    });
  });
});

describe('OS from Client Hints', () => {
  it('maps Windows platform versions to the same marketing scale as the User-Agent', () => {
    const noOSUA = 'Mozilla/5.0 AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36';
    const version = (platformVersion: string) =>
      resolve(noOSUA, hints({ platform: 'Windows', platformVersion }), null).os.version?.full ?? null;

    expect(version('15.0.0')).toBe('11');
    expect(version('13.0.0')).toBe('11');
    expect(version('10.0.0')).toBe('10');
    expect(version('0.3.0')).toBeNull();
    expect(resolve(windowsUA, hints({ platform: 'Windows', platformVersion: '0.3.0' }), null).os.version?.full).toBe('10');
  });

  it('keeps HarmonyOS and its version when a hint says Android', () => {
    const ua = 'Mozilla/5.0 (Linux; Android 10; HarmonyOS 4.2; ELS-AN00) AppleWebKit/537.36';
    const result = resolve(ua, hints({ platform: 'Android', platformVersion: '10.0.0' }), null);

    expect(result.os).toMatchObject({ name: 'harmonyos', version: { full: '4.2' } });
  });

  it('keeps iPadOS when a hint says iOS', () => {
    const ua = 'Mozilla/5.0 (iPad; CPU OS 18_7 like Mac OS X) AppleWebKit/605.1.15';
    expect(resolve(ua, hints({ platform: 'iOS' }), null).os.name).toBe('ipados');
  });

  it('lets a stronger hint replace an unrelated UA OS and takes its version', () => {
    const ua = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36';
    const result = resolve(ua, hints({ platform: 'Android', platformVersion: '14.0.0' }), null);

    expect(result.os).toMatchObject({ name: 'android', version: { full: '14.0.0' } });
  });

  it('ignores an unknown platform', () => {
    expect(resolve(windowsUA, hints({ platform: 'MysteryOS', platformVersion: '9.9' }), null).os).toEqual(parse(windowsUA).os);
  });
});

describe('CPU', () => {
  it.each([
    ['Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'x86_64', 64],
    ['Mozilla/5.0 (Windows NT 10.0; WOW64)', 'x86_64', 64],
    ['Mozilla/5.0 (X11; Linux i686)', 'x86', 32],
    ['Mozilla/5.0 (Linux; Android 14; Pixel 8) arm64', 'arm64', 64],
    ['Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)', 'arm64', 64],
    ['Mozilla/5.0 (Linux; U; armv7l)', null, null],
  ] as const)('reads %s', (ua, architecture, bitness) => {
    expect(parse(ua).cpu).toEqual({ architecture, bitness });
  });

  it('lets a 64-bit ARM token beat a 32-bit family it extends', () => {
    expect(parse('Mozilla/5.0 (Windows NT 10.0; ARM64; x64; arm)').cpu).toEqual({ architecture: 'arm64', bitness: 64 });
  });
});
