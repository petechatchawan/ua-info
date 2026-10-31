import { normalizeArchitecture, parseBrandList } from '../client-hints';
import { parse } from '../parse';

function androidUA(ua: string): string {
  return ua.startsWith('Mozilla') ? ua : `Mozilla/5.0 (Linux; ${ua.startsWith('Android') ? ua : ua}`;
}

describe('supported contract matrix', () => {
  it.each([
    ['Windows Phone OS 10.0', 'windows'],
    ['Windows NT 6.3', 'windows'],
    ['Windows NT 99.1', 'windows'],
    ['iPhone; CPU iPhone OS 18_0 like Mac OS X', 'ios'],
    ['HarmonyOS/4.0', 'harmonyos'],
    ['CrOS x86_64 16000.0.0', 'chromeos'],
    ['Macintosh; Intel Mac OS X 15_0', 'macos'],
    ['KaiOS/3.0', 'kaios'],
    ['Tizen/8.0', 'tizen'],
    ['X11; Linux x86_64', 'linux'],
  ] as const)('detects supported OS branch %s', (ua, name) => {
    expect(parse(ua).os.name).toBe(name);
  });

  it.each([
    ['Quest OculusBrowser/30.0', 'xr'],
    ['PlayStation 5', 'console'],
    ['SmartTV Tizen TV', 'smart-tv'],
    ['Wear OS Watch', 'wearable'],
    ['iPhone', 'mobile'],
    ['iPod', 'mobile'],
    ['ESP32 FreeRTOS', 'embedded'],
    ['Macintosh; Intel Mac OS X 15_0', 'desktop'],
  ] as const)('detects supported hardware class %s', (ua, type) => {
    expect(parse(ua).device.type).toBe(type);
  });

  it.each([
    ['Android 14; SM-S928B Build/UP1A.231005.007) Mobile', 'samsung'],
    ['Android 14; Redmi Note 13 Build/UP1A) Mobile', 'xiaomi'],
    ['Android 14; HUAWEI P60 Build/UP1A) Mobile', 'huawei'],
    ['Android 14; CPH2609 Build/UP1A) Mobile', 'oppo'],
    ['Android 14; V2309 Build/UP1A) Mobile', 'vivo'],
    ['Android 14; ONEPLUS A6013 Build/UP1A) Mobile', 'oneplus'],
    ['Android 14; moto g84 Build/UP1A) Mobile', 'motorola'],
  ] as const)('infers Android vendor for %s', (ua, vendor) => {
    expect(parse(androidUA(ua)).device.vendor).toBe(vendor);
  });

  it('keeps Android model unknown when all segments are metadata', () => {
    expect(parse('Mozilla/5.0 (Linux; Android 14; arm64; en-US; wv)').device).toMatchObject({
      type: 'tablet',
      vendor: null,
      model: null,
    });
  });

  it.each([
    ['armv7', 'arm', 32],
    ['Win32', 'x86', 32],
    ['mips64', 'mips', 64],
    ['mips', 'mips', 32],
    ['riscv64', 'riscv', 64],
    ['powerpc', 'powerpc', null],
    ['sparc', 'sparc', null],
  ] as const)('detects CPU branch %s', (ua, architecture, bitness) => {
    expect(parse(ua).cpu).toEqual({ architecture, bitness });
  });

  it.each([
    ['ChatGPT-User', 'ai-assistant', 'chatgpt-user'],
    ['OAI-AdsBot/1.0', 'crawler', 'oai-adsbot'],
    ['Googlebot-Image/1.0', 'crawler', 'googlebot-image'],
    ['Googlebot-Video/1.0', 'crawler', 'googlebot-video'],
    ['CCBot/2.0', 'crawler', 'ccbot'],
    ['bingbot/2.0', 'crawler', 'bingbot'],
    ['AhrefsBot/7.0', 'crawler', 'ahrefsbot'],
    ['SemrushBot/7.0', 'crawler', 'semrushbot'],
    ['Applebot/0.1', 'crawler', 'applebot'],
    ['Puppeteer/24.0', 'automation', 'puppeteer'],
    ['Selenium', 'automation', 'selenium'],
    ['Wget/1.21', 'http-client', 'wget'],
    ['PostmanRuntime/7.0', 'http-client', 'postman'],
    ['HTTPie/3.2', 'http-client', 'httpie'],
    ['python-requests/2.32', 'library', 'python-requests'],
    ['okhttp/5.0', 'library', 'okhttp'],
    ['FancySpider/2.5', 'bot', null],
    ['NovelBot', 'bot', null],
  ] as const)('detects client branch %s', (ua, type, name) => {
    expect(parse(ua).client).toMatchObject({ type, name: name ?? null });
  });

  it.each([
    ['FBAN/Orca-Android; FBAV/500.1.0', 'messenger'],
    ['Instagram 350.0.0', 'instagram'],
    ['MicroMessenger/8.0.50', 'wechat'],
    ['FBAV/500.1.0', 'facebook'],
  ] as const)('detects in-app context %s', (ua, name) => {
    expect(parse(ua).context).toMatchObject({
      type: 'in-app-browser',
      name,
      app: name,
    });
  });

  it('preserves headless browser mode when in-app context is also present', () => {
    expect(parse('HeadlessChrome/150.0.0.0 Line/26.11.0').browser.mode).toBe('headless');
  });

  it('normalizes supported Client Hints platform and architecture aliases', () => {

    expect(normalizeArchitecture(null, null)).toBeNull();
    expect(normalizeArchitecture('arm', null)).toEqual({ architecture: 'arm', bitness: null });
    expect(normalizeArchitecture('armv8', 64)).toEqual({ architecture: 'arm', bitness: 64 });
    expect(normalizeArchitecture('x86', null)).toEqual({ architecture: 'x86', bitness: null });
    expect(normalizeArchitecture('i386', 32)).toEqual({ architecture: 'x86', bitness: 32 });
    expect(normalizeArchitecture('m68k', null)).toBeNull();
  });

  it('handles empty brand lists and structural header fallbacks', () => {
    expect(parseBrandList(null)).toEqual([]);
    expect(parseBrandList('"Not A Brand";v="99", "Google Chrome";v="150"')).toEqual([
      { brand: 'Google Chrome', version: '150' },
    ]);
  });
});
