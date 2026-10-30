import * as check from '../check';
import { BrowserId, ContextId, EngineId, OSId } from '../constants';
import { parse } from '../parse';
import { detectClient } from '../parser/client';
import { detectDevice } from '../parser/device';
import type { UAInfo } from '../types';

const empty = parse('');

function withBrowser(name: UAInfo['browser']['name'], family: UAInfo['browser']['family'] = null, mode: UAInfo['browser']['mode'] = 'browser'): UAInfo {
  return { ...empty, browser: { ...empty.browser, name, family, mode } };
}

function withOS(name: UAInfo['os']['name']): UAInfo {
  return { ...empty, os: { ...empty.os, name } };
}

function withDevice(type: UAInfo['device']['type']): UAInfo {
  return { ...empty, device: { ...empty.device, type } };
}

function withClient(type: UAInfo['client']['type']): UAInfo {
  return { ...empty, client: { type, name: type, version: null } };
}

function withContext(
  type: UAInfo['context']['type'],
  name: UAInfo['context']['name'],
  hostName: string | null = name,
): UAInfo {
  return {
    ...empty,
    context: {
      type,
      name,
      host: hostName === null ? null : { name: hostName, version: null },
    },
  };
}

describe('supported predicate catalog', () => {
  it.each([
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
  ] as const)('exposes the %s browser predicate', (name, predicate) => {
    expect(predicate(withBrowser(name))).toBe(true);
  });

  it.each([
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
  ] as const)('exposes the %s OS predicate', (name, predicate) => {
    expect(predicate(withOS(name))).toBe(true);
  });

  it.each([
    ['mobile', check.isMobile],
    ['tablet', check.isTablet],
    ['desktop', check.isDesktop],
    ['smart-tv', check.isSmartTV],
    ['console', check.isConsole],
    ['wearable', check.isWearable],
    ['xr', check.isXR],
    ['embedded', check.isEmbeddedDevice],
  ] as const)('exposes the %s device predicate', (type, predicate) => {
    expect(predicate(withDevice(type))).toBe(true);
  });

  it('covers generic engine/mode/client/context predicates', () => {
    expect(check.isEngine({ ...empty, engine: { name: EngineId.Blink, version: null } }, EngineId.Blink)).toBe(true);
    expect(check.isBrowserMode(withBrowser(BrowserId.Chrome, 'chromium', 'headless'), 'headless')).toBe(true);
    expect(check.isClient(withClient('library'), 'library')).toBe(true);
    expect(check.isContext(withContext('in-app-browser', ContextId.Line), ContextId.Line)).toBe(true);
  });

  it('covers named client predicates and umbrella membership', () => {
    expect(check.isBot(withClient('bot'))).toBe(true);
    expect(check.isBot(withClient('crawler'))).toBe(true);
    expect(check.isBot(withClient('ai-crawler'))).toBe(true);
    expect(check.isBot(withClient('automation'))).toBe(false);

    expect(check.isCrawler(withClient('crawler'))).toBe(true);
    expect(check.isCrawler(withClient('ai-crawler'))).toBe(true);
    expect(check.isCrawler(withClient('bot'))).toBe(false);

    expect(check.isAICrawler(withClient('ai-crawler'))).toBe(true);
    expect(check.isAIAssistant(withClient('ai-assistant'))).toBe(true);
    expect(check.isAutomation(withClient('automation'))).toBe(true);
    expect(check.isHttpClient(withClient('http-client'))).toBe(true);
    expect(check.isEmailClient(withClient('email-client'))).toBe(true);
    expect(check.isMediaPlayer(withClient('media-player'))).toBe(true);
  });

  it('covers named runtime/context predicates', () => {
    expect(check.isWebView(withBrowser(BrowserId.Chrome, 'chromium', 'webview'))).toBe(true);
    expect(check.isHeadless(withBrowser(BrowserId.Chrome, 'chromium', 'headless'))).toBe(true);
    expect(check.isInAppBrowser(withContext('in-app-browser', ContextId.Line))).toBe(true);
    expect(check.isPWA(withContext('pwa', ContextId.PWA, null))).toBe(true);

    expect(check.isLine(withContext('in-app-browser', ContextId.Line))).toBe(true);
    expect(check.isLine(withContext('mini-app', ContextId.Liff, ContextId.Line))).toBe(true);
    expect(check.isLine(withContext('in-app-browser', ContextId.Facebook))).toBe(false);

    expect(check.isLiff(withContext('mini-app', ContextId.Liff, ContextId.Line))).toBe(true);
    expect(check.isLiff(withContext('in-app-browser', ContextId.Liff, ContextId.Line))).toBe(false);

    expect(check.isFacebook(withContext('in-app-browser', ContextId.Facebook))).toBe(true);
    expect(check.isInstagram(withContext('in-app-browser', ContextId.Instagram))).toBe(true);
    expect(check.isMessenger(withContext('in-app-browser', ContextId.Messenger))).toBe(true);
    expect(check.isWeChat(withContext('in-app-browser', ContextId.WeChat))).toBe(true);
  });
});

describe('supported detector matrix', () => {
  it.each([
    ['Windows Phone OS 10.0', OSId.Windows],
    ['Mozilla/5.0 (Windows NT 6.3; Win64; x64)', OSId.Windows],
    ['Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X)', OSId.IOS],
    ['Mozilla/5.0 HarmonyOS/4.2', OSId.HarmonyOS],
    ['Mozilla/5.0 (X11; CrOS x86_64 16000.0.0)', OSId.ChromeOS],
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X 15_0)', OSId.MacOS],
    ['Mozilla/5.0 Mobile KaiOS/3.0', OSId.KaiOS],
    ['Mozilla/5.0 Tizen/8.0', OSId.Tizen],
    ['Mozilla/5.0 (X11; Linux x86_64)', OSId.Linux],
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
    expect(detectDevice(ua).type).toBe(expected);
  });

  it.each([
    ['Mozilla/5.0 (Linux; Android 14; SM-S928B Build/UP1A) Mobile', 'Samsung'],
    ['Mozilla/5.0 (Linux; Android 14; Redmi Note 13 Build/UP1A) Mobile', 'Xiaomi'],
    ['Mozilla/5.0 (Linux; Android 14; HUAWEI Pura 70 Build/HUAWEI) Mobile', 'Huawei'],
    ['Mozilla/5.0 (Linux; Android 14; CPH2609 Build/UP1A) Mobile', 'Oppo'],
    ['Mozilla/5.0 (Linux; Android 14; V2312 Build/UP1A) Mobile', 'Vivo'],
    ['Mozilla/5.0 (Linux; Android 14; ONEPLUS A6013 Build/UP1A) Mobile', 'OnePlus'],
    ['Mozilla/5.0 (Linux; Android 14; moto g84 Build/UP1A) Mobile', 'Motorola'],
  ] as const)('infers Android vendor %s', (ua, expected) => {
    expect(detectDevice(ua).vendor).toBe(expected);
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
    ['ChatGPT-User/1.0', 'ai-assistant', 'ai-assistant'],
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
    ['ExampleSpider/2.5', 'bot', 'examplespider'],
    ['ExampleCrawler', 'bot', 'examplecrawler'],
  ] as const)('detects client %s', (ua, type, name) => {
    expect(detectClient(ua)).toMatchObject({ type, name });
  });

  it.each([
    ['FBAN/Orca-Android FBAV/500.0.0', ContextId.Messenger],
    ['Instagram 350.0.0', ContextId.Instagram],
    ['MicroMessenger/8.0.50', ContextId.WeChat],
    ['FBAV/500.0.0', ContextId.Facebook],
  ] as const)('detects context %s', (ua, name) => {
    expect(parse(ua).context.name).toBe(name);
  });

  it.each([
    ['Mozilla/5.0 rv:145.0 Firefox/145.0', 'gecko', EngineId.Gecko],
    ['Mozilla/5.0 AppleWebKit/605.1.15', 'webkit', EngineId.WebKit],
    ['Mozilla/5.0 Chrome/150.0.0.0', 'blink', EngineId.Blink],
    ['custom-client', null, null],
  ] as const)('detects engine from %s', (ua, _hint, name) => {
    expect(parse(ua).engine.name).toBe(name);
  });
});
