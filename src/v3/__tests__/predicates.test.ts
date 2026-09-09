import { BrowserId, type UAInfo } from '../index';
import {
  isAICrawler,
  isAndroid,
  isAutomation,
  isBot,
  isBrowser,
  isBrowserFamily,
  isChrome,
  isChromium,
  isCrawler,
  isDevice,
  isEdge,
  isLiff,
  isLine,
  isMiBrowser,
  isMobile,
  isOS,
  isTablet,
  isWebView,
} from '../check';
import { parse } from '../parse';

function assertNarrowing(info: UAInfo): void {
  if (isBrowser(info, BrowserId.Chrome)) {
    const name: typeof BrowserId.Chrome = info.browser.name;
    void name;
  }
  if (isDevice(info, 'mobile')) {
    const type: 'mobile' = info.device.type;
    void type;
  }
}
void assertNarrowing;

const chrome = parse(
  'Mozilla/5.0 (Linux; Android 16; Pixel 10 Pro) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',
);
const edge = parse(
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0',
);
const mi = parse(
  'Mozilla/5.0 (Linux; U; Android 14; en-us; 23127PN0CG) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Version/4.0 Chrome/120.0.0.0 Mobile Safari/537.36 XiaoMi/MiuiBrowser/18.4.110316',
);
const tablet = parse(
  'Mozilla/5.0 (iPad; CPU OS 18_7 like Mac OS X) AppleWebKit/605.1.15 ' +
  '(KHTML, like Gecko) Version/18.7 Mobile/15E148 Safari/604.1',
);
const gptBot = parse('GPTBot/1.2');
const playwright = parse('Playwright/1.57.0');
const line = parse(
  'Mozilla/5.0 (Linux; Android 16; Pixel 10 Pro; wv) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Version/4.0 Chrome/150.0.0.0 Mobile Safari/537.36 Line/26.11.0 LIFF',
);

describe('check predicates', () => {
  it('uses exact generic checks', () => {
    expect(isBrowser(chrome, 'chrome')).toBe(true);
    expect(isBrowserFamily(chrome, 'chromium')).toBe(true);
    expect(isOS(chrome, 'android')).toBe(true);
    expect(isDevice(chrome, 'mobile')).toBe(true);
  });

  it('distinguishes product identity from family', () => {
    expect(isChrome(chrome)).toBe(true);
    expect(isChromium(chrome)).toBe(false);
    expect(isEdge(edge)).toBe(true);
    expect(isChrome(edge)).toBe(false);
    expect(isMiBrowser(mi)).toBe(true);
    expect(isBrowserFamily(mi, 'chromium')).toBe(true);
  });

  it('keeps device predicates exact', () => {
    expect(isMobile(chrome)).toBe(true);
    expect(isTablet(chrome)).toBe(false);
    expect(isMobile(tablet)).toBe(false);
    expect(isTablet(tablet)).toBe(true);
  });

  it('keeps client umbrella membership explicit', () => {
    expect(isBot(gptBot)).toBe(true);
    expect(isCrawler(gptBot)).toBe(true);
    expect(isAICrawler(gptBot)).toBe(true);
    expect(isBot(playwright)).toBe(false);
    expect(isAutomation(playwright)).toBe(true);
  });

  it('keeps LINE and LIFF distinct during pure parsing', () => {
    expect(isLine(line)).toBe(true);
    expect(isLiff(line)).toBe(false);
    expect(isWebView(line)).toBe(true);
  });

  it('exposes named OS checks', () => {
    expect(isAndroid(chrome)).toBe(true);
  });
});
