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

const android = (segments: string, tail = 'Mobile Safari/537.36') =>
  `Mozilla/5.0 (Linux; Android 14; ${segments}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 ${tail}`;

describe('device model', () => {
  it.each([
    ['SM-S928B Build/UP1A.231005.007', 'SM-S928B'],
    ['Pixel 8 Pro', 'Pixel 8 Pro'],
    ['wv; moto g84', 'moto g84'],
    ['en-US; V2312', 'V2312'],
    ['arm64; SM-X716B', 'SM-X716B'],
  ])('reads the model from %s', (segments, model) => {
    expect(parse(android(segments)).device.model).toBe(model);
  });

  it.each(['K', 'wv', 'rv:126.0', 'HarmonyOS', 'en-US', 'arm64', 'Mobile', 'HMSCore 6.13.0.302'])(
    'never reports %s as a model',
    (segment) => {
      expect(parse(android(segment)).device.model).toBeNull();
    },
  );

  it('stays inside the comment group that holds the OS', () => {
    expect(parse('Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko)').device.model).toBeNull();
  });

  it('keeps the original letter case', () => {
    expect(parse(android('sm-s928b')).device.model).toBe('sm-s928b');
  });

  it('reads the model of a Huawei HarmonyOS device past the OS segments', () => {
    const ua = 'Mozilla/5.0 (Linux; Android 10; HarmonyOS; ELS-AN00; HMSCore 6.13.0.302) AppleWebKit/537.36';
    expect(parse(ua).device).toMatchObject({ vendor: 'Huawei', model: 'ELS-AN00' });
  });
});

describe('device vendor', () => {
  it.each([
    ['SAMSUNG SM-G960F', 'Samsung', 'SM-G960F'],
    ['SM-S928B', 'Samsung', 'SM-S928B'],
    ['Redmi Note 13', 'Xiaomi', 'Redmi Note 13'],
    ['RMX3511', 'Realme', 'RMX3511'],
    ['ONEPLUS A6013', 'OnePlus', 'ONEPLUS A6013'],
    ['XT2201-2', 'Motorola', 'XT2201-2'],
    ['Primo RX8', null, 'Primo RX8'],
    ['M5 Note', null, 'M5 Note'],
    ['PHPG50', null, 'PHPG50'],
  ])('maps %s to %s', (segment, vendor, model) => {
    expect(parse(android(segment)).device).toMatchObject({ vendor, model });
  });

  it('names Apple hardware from the device word', () => {
    expect(parse('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)').device).toEqual({
      type: 'mobile',
      vendor: 'Apple',
      model: 'iPhone',
    });
    expect(parse('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)').device).toEqual({
      type: 'desktop',
      vendor: 'Apple',
      model: null,
    });
  });
});

describe('device type', () => {
  it.each([
    ['Mozilla/5.0 (Linux; Android 14; Pixel 8) Mobile Safari/537.36', 'mobile'],
    ['Mozilla/5.0 (Linux; Android 14; SM-X716B) Safari/537.36', 'tablet'],
    ['Mozilla/5.0 (Linux; Android 9; AFTKA) Mobile Safari/537.36', 'smart-tv'],
    ['Mozilla/5.0 (Linux; Android 9; BRAVIA 4K GB) Safari/537.36', 'smart-tv'],
    ['Mozilla/5.0 (Linux; Android 11; KFTRWI) Safari/537.36', 'tablet'],
    ['Mozilla/5.0 (X11; Linux x86_64; CrKey/1.56)', 'smart-tv'],
    ['Mozilla/5.0 (SMART-TV; Linux; Tizen 6.0) TV Safari/537.36', 'smart-tv'],
    ['Mozilla/5.0 (Linux; Android 12; Quest 2) Mobile Safari/537.36 OculusBrowser/30.0', 'xr'],
    ['Mozilla/5.0 (Windows Phone 10.0; Android 6.0.1; Lumia 950) Mobile Safari/537.36', 'mobile'],
    ['Mozilla/5.0 (X11; Linux x86_64)', 'desktop'],
    ['CustomAgent/1.0', null],
  ])('classifies %s as %s', (ua, type) => {
    expect(parse(ua).device.type).toBe(type);
  });
});

describe('device from Client Hints', () => {
  const pixel = android('Pixel 8');
  const ipad = 'Mozilla/5.0 (iPad; CPU OS 18_7 like Mac OS X) AppleWebKit/605.1.15 Version/18.7 Mobile/15E148 Safari/604.1';

  it('does not let a mobile hint turn a tablet into mobile', () => {
    expect(resolve(ipad, hints({ mobile: true }), null).device.type).toBe('tablet');
  });

  it('lets a mobile hint replace a generic guess', () => {
    const androidTablet = 'Mozilla/5.0 (Linux; Android 14; SM-X716B) Safari/537.36';
    expect(resolve(androidTablet, hints({ mobile: true }), null).device.type).toBe('mobile');
    expect(resolve('CustomAgent/1.0', hints({ mobile: true }), null).device.type).toBe('mobile');
    expect(resolve('CustomAgent/1.0', hints({ mobile: false }), null).device.type).toBeNull();
  });

  it('gives the hint model its own vendor and never keeps the UA vendor', () => {
    expect(resolve(pixel, hints({ model: 'SM-S928B' }), null).device).toMatchObject({ vendor: 'Samsung', model: 'SM-S928B' });
    expect(resolve(pixel, hints({ model: 'Mystery 1' }), null).device).toMatchObject({ vendor: null, model: 'Mystery 1' });
    expect(resolve(pixel, hints({ model: 'SAMSUNG SM-S928B' }), null).device).toMatchObject({ vendor: 'Samsung', model: 'SM-S928B' });
  });

  it('keeps the UA model when the hint model is empty', () => {
    expect(resolve(pixel, hints({ model: '  ' }), null).device).toMatchObject({ vendor: 'Google', model: 'Pixel 8' });
  });
});
