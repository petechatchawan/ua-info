import { parse } from '../parse';

function androidUA(ua: string): string {
  return ua.startsWith('Mozilla') ? ua : `Mozilla/5.0 (Linux; ${ua.startsWith('Android') ? ua : ua}`;
}

describe('supported detector matrix', () => {
  it.each([
    ['Windows Phone OS 10.0', 'windows'],
    ['Mozilla/5.0 (Windows NT 6.3; Win64; x64)', 'windows'],
    ['Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X)', 'ios'],
    ['Mozilla/5.0 HarmonyOS/4.2', 'harmonyos'],
    ['Mozilla/5.0 (X11; CrOS x86_64 16000.0.0)', 'chromeos'],
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X 15_0)', 'macos'],
    ['Mozilla/5.0 Mobile KaiOS/3.0', 'kaios'],
    ['Mozilla/5.0 Tizen/8.0', 'tizen'],
    ['Mozilla/5.0 (X11; Linux x86_64)', 'linux'],
  ] as const)('detects OS from %s', (ua, expected) => {
    expect(parse(ua).os.name).toBe(expected);
  });

  it.each([
    ['Mozilla/5.0 OculusBrowser/40.0 Quest', 'xr'],
    ['Mozilla/5.0 PlayStation 5', 'console'],
    ['Mozilla/5.0 SmartTV', 'smart-tv'],
    ['Mozilla/5.0 Wear OS Watch', 'wearable'],
    ['Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X)', 'mobile'],
    ['Mozilla/5.0 (iPod; CPU iPhone OS 15_0 like Mac OS X)', 'mobile'],
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X 15_0)', 'desktop'],
    ['ESP32 FreeRTOS', 'embedded'],
  ] as const)('detects %s as %s', (ua, expected) => {
    expect(parse(ua).device.type).toBe(expected);
  });

  it.each([
    ['Mozilla/5.0 (Linux; Android 14; SM-S928B Build/UP1A) Mobile', 'samsung'],
    ['Mozilla/5.0 (Linux; Android 14; Redmi Note 13 Build/UP1A) Mobile', 'xiaomi'],
    ['Mozilla/5.0 (Linux; Android 14; HUAWEI Pura 70 Build/HUAWEI) Mobile', 'huawei'],
    ['Mozilla/5.0 (Linux; Android 14; CPH2609 Build/UP1A) Mobile', 'oppo'],
    ['Mozilla/5.0 (Linux; Android 14; V2312 Build/UP1A) Mobile', 'vivo'],
    ['Mozilla/5.0 (Linux; Android 14; ONEPLUS A6013 Build/UP1A) Mobile', 'oneplus'],
    ['Mozilla/5.0 (Linux; Android 14; moto g84 Build/UP1A) Mobile', 'motorola'],
  ] as const)('infers Android vendor %s', (ua, expected) => {
    expect(parse(androidUA(ua)).device.vendor).toBe(expected);
  });

  it.each([
    ['armv7', 'arm', 32],
    ['Win32', 'x86', 32],
    ['mips64', 'mips', 64],
    ['mips', 'mips', 32],
    ['riscv64', 'riscv', 64],
    ['powerpc', 'powerpc', null],
    ['sparc', 'sparc', null],
    ['unknown', null, null],
  ] as const)('detects CPU %s', (ua, architecture, bitness) => {
    expect(parse(ua).cpu).toEqual({ architecture, bitness });
  });

  it.each([
    ['ChatGPT-User/1.0', 'ai-assistant', 'chatgpt-user'],
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
    ['PostmanRuntime/7.43', 'http-client', 'postman'],
    ['HTTPie/3.2', 'http-client', 'httpie'],
    ['python-requests/2.32', 'library', 'python-requests'],
    ['okhttp/5.0', 'library', 'okhttp'],
    ['ExampleSpider/2.5', 'bot', null],
    ['ExampleCrawler', 'bot', null],
  ] as const)('detects client %s', (ua, type, name) => {
    expect(parse(ua).client).toMatchObject({ type, name: name ?? null });
  });

  it.each([
    ['FBAN/Orca-Android FBAV/500.0.0', 'messenger'],
    ['Instagram 350.0.0', 'instagram'],
    ['MicroMessenger/8.0.50', 'wechat'],
    ['FBAV/500.0.0', 'facebook'],
  ] as const)('detects context %s', (ua, name) => {
    expect(parse(ua).context.name).toBe(name);
  });

  it.each([
    ['Mozilla/5.0 rv:145.0 Firefox/145.0', 'gecko', 'gecko'],
    ['Mozilla/5.0 AppleWebKit/605.1.15', 'webkit', 'webkit'],
    ['Mozilla/5.0 Chrome/150.0.0.0', 'blink', 'blink'],
    ['custom-client', null, null],
  ] as const)('detects engine from %s', (ua, _hint, name) => {
    expect(parse(ua).engine.name).toBe(name);
  });
});
