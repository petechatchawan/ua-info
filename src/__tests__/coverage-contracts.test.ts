import { BrowserId, CPUArchitecture, EngineId, OSId, type UAInfo } from '../index';
import * as check from '../check';
import { normalizeArchitecture, parseBrandList } from '../client-hints';
import { parse } from '../parse';
import { readHeader } from '../server';

function makeInfo(overrides: Partial<UAInfo>): UAInfo {
  return { ...parse(''), ...overrides };
}

function androidUA(ua: string): string {
  return ua.startsWith('Mozilla') ? ua : `Mozilla/5.0 (Linux; ${ua.startsWith('Android') ? ua : ua}`;
}

describe('supported contract matrix', () => {
  it('exercises every named browser predicate as an exact identity check', () => {
    const cases: readonly [UAInfo['browser']['name'], (info: UAInfo) => boolean][] = [
      [BrowserId.Chrome, check.isChrome],
      [BrowserId.Chromium, check.isChromium],
      [BrowserId.Safari, check.isSafari],
      [BrowserId.Firefox, check.isFirefox],
      [BrowserId.Edge, check.isEdge],
      [BrowserId.Opera, check.isOpera],
      [BrowserId.SamsungInternet, check.isSamsungInternet],
      [BrowserId.Brave, check.isBrave],
      [BrowserId.Vivaldi, check.isVivaldi],
      [BrowserId.MiBrowser, check.isMiBrowser],
      [BrowserId.HuaweiBrowser, check.isHuaweiBrowser],
      [BrowserId.UCBrowser, check.isUCBrowser],
      [BrowserId.YandexBrowser, check.isYandexBrowser],
      [BrowserId.Arc, check.isArc],
    ];

    for (const [name, predicate] of cases) {
      expect(predicate(makeInfo({
        browser: { name, version: null, family: null, mode: null },
      }))).toBe(true);
    }

    expect(check.isEngine(makeInfo({
      engine: { name: EngineId.Blink, version: null },
    }), EngineId.Blink)).toBe(true);
  });

  it('exercises every named OS and device predicate', () => {
    const osCases: readonly [UAInfo['os']['name'], (info: UAInfo) => boolean][] = [
      [OSId.Android, check.isAndroid],
      [OSId.IOS, check.isIOS],
      [OSId.IPadOS, check.isIPadOS],
      [OSId.Windows, check.isWindows],
      [OSId.MacOS, check.isMacOS],
      [OSId.Linux, check.isLinux],
      [OSId.ChromeOS, check.isChromeOS],
      [OSId.HarmonyOS, check.isHarmonyOS],
      [OSId.KaiOS, check.isKaiOS],
      [OSId.Tizen, check.isTizen],
    ];
    for (const [name, predicate] of osCases) {
      expect(predicate(makeInfo({ os: { name, version: null } }))).toBe(true);
    }

    const deviceCases: readonly [NonNullable<UAInfo['device']['type']>, (info: UAInfo) => boolean][] = [
      ['mobile', check.isMobile],
      ['tablet', check.isTablet],
      ['desktop', check.isDesktop],
      ['smart-tv', check.isSmartTV],
      ['console', check.isConsole],
      ['wearable', check.isWearable],
      ['xr', check.isXR],
      ['embedded', check.isEmbeddedDevice],
    ];
    for (const [type, predicate] of deviceCases) {
      expect(predicate(makeInfo({ device: { type, vendor: null, model: null } }))).toBe(true);
    }
  });

  it('exercises client, mode, and context predicate variants', () => {
    const clientCases: readonly [NonNullable<UAInfo['client']['type']>, (info: UAInfo) => boolean][] = [
      ['ai-crawler', check.isAICrawler],
      ['ai-assistant', check.isAIAssistant],
      ['automation', check.isAutomation],
      ['http-client', check.isHttpClient],
      ['email-client', check.isEmailClient],
      ['media-player', check.isMediaPlayer],
    ];
    for (const [type, predicate] of clientCases) {
      expect(predicate(makeInfo({ client: { type, name: type, version: null } }))).toBe(true);
    }

    const bot = makeInfo({ client: { type: 'bot', name: 'samplebot', version: null } });
    const crawler = makeInfo({ client: { type: 'crawler', name: 'crawler', version: null } });
    const aiCrawler = makeInfo({ client: { type: 'ai-crawler', name: 'gptbot', version: null } });
    const automation = makeInfo({ client: { type: 'automation', name: 'playwright', version: null } });
    expect(check.isBot(bot)).toBe(true);
    expect(check.isBot(crawler)).toBe(true);
    expect(check.isBot(aiCrawler)).toBe(true);
    expect(check.isBot(automation)).toBe(false);
    expect(check.isCrawler(crawler)).toBe(true);
    expect(check.isCrawler(aiCrawler)).toBe(true);
    expect(check.isCrawler(bot)).toBe(false);

    expect(check.isHeadless(makeInfo({
      browser: { name: BrowserId.Chrome, version: null, family: 'chromium', mode: 'headless' },
    }))).toBe(true);
    expect(check.isWebView(makeInfo({
      browser: { name: BrowserId.Chrome, version: null, family: 'chromium', mode: 'webview' },
    }))).toBe(true);

    expect(check.isInAppBrowser(makeInfo({
      context: { type: 'in-app-browser', name: 'facebook', host: null },
    }))).toBe(true);
    expect(check.isPWA(makeInfo({
      context: { type: 'pwa', name: 'pwa', host: null },
    }))).toBe(true);
    expect(check.isFacebook(makeInfo({
      context: { type: 'in-app-browser', name: 'facebook', host: null },
    }))).toBe(true);
    expect(check.isInstagram(makeInfo({
      context: { type: 'in-app-browser', name: 'instagram', host: null },
    }))).toBe(true);
    expect(check.isMessenger(makeInfo({
      context: { type: 'in-app-browser', name: 'messenger', host: null },
    }))).toBe(true);
    expect(check.isWeChat(makeInfo({
      context: { type: 'in-app-browser', name: 'wechat', host: null },
    }))).toBe(true);

    expect(check.isLine(makeInfo({
      context: { type: 'mini-app', name: 'liff', host: { name: 'line', version: null } },
    }))).toBe(true);
    expect(check.isLine(makeInfo({
      context: { type: null, name: null, host: null },
    }))).toBe(false);
    expect(check.isLiff(makeInfo({
      context: { type: 'mini-app', name: 'liff', host: { name: 'line', version: null } },
    }))).toBe(true);
    expect(check.isLiff(makeInfo({
      context: { type: 'in-app-browser', name: 'liff', host: null },
    }))).toBe(false);
    expect(check.isLiff(makeInfo({
      context: { type: 'mini-app', name: 'line', host: null },
    }))).toBe(false);
  });

  it.each([
    ['Windows Phone OS 10.0', OSId.Windows],
    ['Windows NT 6.3', OSId.Windows],
    ['Windows NT 99.1', OSId.Windows],
    ['iPhone; CPU iPhone OS 18_0 like Mac OS X', OSId.IOS],
    ['HarmonyOS/4.0', OSId.HarmonyOS],
    ['CrOS x86_64 16000.0.0', OSId.ChromeOS],
    ['Macintosh; Intel Mac OS X 15_0', OSId.MacOS],
    ['KaiOS/3.0', OSId.KaiOS],
    ['Tizen/8.0', OSId.Tizen],
    ['X11; Linux x86_64', OSId.Linux],
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
    ['Android 14; SM-S928B Build/UP1A.231005.007) Mobile', 'Samsung'],
    ['Android 14; Redmi Note 13 Build/UP1A) Mobile', 'Xiaomi'],
    ['Android 14; HUAWEI P60 Build/UP1A) Mobile', 'Huawei'],
    ['Android 14; CPH2609 Build/UP1A) Mobile', 'Oppo'],
    ['Android 14; V2309 Build/UP1A) Mobile', 'Vivo'],
    ['Android 14; ONEPLUS A6013 Build/UP1A) Mobile', 'OnePlus'],
    ['Android 14; moto g84 Build/UP1A) Mobile', 'Motorola'],
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
    ['armv7', CPUArchitecture.ARM, 32],
    ['Win32', CPUArchitecture.X86, 32],
    ['mips64', CPUArchitecture.MIPS, 64],
    ['mips', CPUArchitecture.MIPS, 32],
    ['riscv64', CPUArchitecture.RISCV, 64],
    ['powerpc', CPUArchitecture.PowerPC, null],
    ['sparc', CPUArchitecture.SPARC, null],
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
    ['FancySpider/2.5', 'bot', 'fancyspider'],
    ['NovelBot', 'bot', 'novelbot'],
  ] as const)('detects client branch %s', (ua, type, name) => {
    expect(parse(ua).client).toMatchObject({ type, name });
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
      host: { name },
    });
  });

  it('preserves headless browser mode when in-app context is also present', () => {
    expect(parse('HeadlessChrome/150.0.0.0 Line/26.11.0').browser.mode).toBe('headless');
  });

  it('normalizes supported Client Hints platform and architecture aliases', () => {

    expect(normalizeArchitecture(null, null)).toBeNull();
    expect(normalizeArchitecture('arm', null)).toEqual({ architecture: CPUArchitecture.ARM, bitness: null });
    expect(normalizeArchitecture('armv8', 64)).toEqual({ architecture: CPUArchitecture.ARM, bitness: 64 });
    expect(normalizeArchitecture('x86', null)).toEqual({ architecture: CPUArchitecture.X86, bitness: null });
    expect(normalizeArchitecture('i386', 32)).toEqual({ architecture: CPUArchitecture.X86, bitness: 32 });
    expect(normalizeArchitecture('m68k', null)).toBeNull();
  });

  it('handles empty brand lists and structural header fallbacks', () => {
    expect(parseBrandList(null)).toEqual([]);
    expect(parseBrandList('"Not A Brand";v="99", "Google Chrome";v="150"')).toEqual([
      { brand: 'Google Chrome', version: '150' },
    ]);
    expect(readHeader({ 'x-values': ['a', 'b'] }, 'x-values')).toBe('a, b');
    expect(readHeader({ other: 'value' }, 'missing')).toBeNull();
  });
});
