import type { BrowserFixture, FixtureSource } from './fixture-types';

const REGRESSION_SOURCE: FixtureSource = Object.freeze({
  kind: 'regression',
  authority: 'ua-info regression suite',
  reference: 'browser-catalog-v3',
  observedAt: '2026-09-09',
  notes: 'Representative UA strings used to lock product precedence and browser semantics.',
});

const CHROME_DESKTOP =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';
const CHROME_ANDROID =
  'Mozilla/5.0 (Linux; Android 16; Pixel 10 Pro) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36';

export const BROWSER_FIXTURES: readonly BrowserFixture[] = Object.freeze([
  {
    id: 'chrome-desktop',
    userAgent: CHROME_DESKTOP,
    expected: { name: 'chrome', family: 'chromium', mode: 'browser' },
    source: REGRESSION_SOURCE,
  },
  {
    id: 'safari-ios',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 ' +
      '(KHTML, like Gecko) Version/18.7 Mobile/15E148 Safari/604.1',
    expected: { name: 'safari', family: 'safari', mode: 'browser' },
    source: REGRESSION_SOURCE,
  },
  {
    id: 'firefox-desktop',
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:142.0) Gecko/20100101 Firefox/142.0',
    expected: { name: 'firefox', family: 'firefox', mode: 'browser' },
    source: REGRESSION_SOURCE,
  },
  {
    id: 'edge-before-chrome',
    userAgent: `${CHROME_DESKTOP} Edg/150.0.0.0`,
    expected: { name: 'edge', family: 'chromium', mode: 'browser' },
    source: REGRESSION_SOURCE,
  },
  {
    id: 'opera-before-chrome',
    userAgent: `${CHROME_DESKTOP} OPR/121.0.0.0`,
    expected: { name: 'opera', family: 'chromium', mode: 'browser' },
    source: REGRESSION_SOURCE,
  },
  {
    id: 'samsung-internet-before-chrome',
    userAgent: `${CHROME_ANDROID} SamsungBrowser/28.0`,
    expected: { name: 'samsung-internet', family: 'chromium', mode: 'browser' },
    source: REGRESSION_SOURCE,
  },
  {
    id: 'vivaldi-before-chrome',
    userAgent: `${CHROME_DESKTOP} Vivaldi/7.5.3735.66`,
    expected: { name: 'vivaldi', family: 'chromium', mode: 'browser' },
    source: REGRESSION_SOURCE,
  },
  {
    id: 'mi-browser-before-chrome',
    userAgent:
      'Mozilla/5.0 (Linux; U; Android 14; en-us; 23127PN0CG) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Version/4.0 Chrome/120.0.0.0 Mobile Safari/537.36 XiaoMi/MiuiBrowser/18.4.110316',
    expected: { name: 'mi-browser', family: 'chromium', mode: 'browser' },
    source: REGRESSION_SOURCE,
  },
  {
    id: 'huawei-browser-before-chrome',
    userAgent: `${CHROME_ANDROID} HuaweiBrowser/16.0.7.300`,
    expected: { name: 'huawei-browser', family: 'chromium', mode: 'browser' },
    source: REGRESSION_SOURCE,
  },
  {
    id: 'uc-browser-before-chrome',
    userAgent: `${CHROME_ANDROID} UCBrowser/15.0.0.0`,
    expected: { name: 'uc-browser', family: 'chromium', mode: 'browser' },
    source: REGRESSION_SOURCE,
  },
  {
    id: 'yandex-before-chrome',
    userAgent: `${CHROME_DESKTOP} YaBrowser/25.8.3.106`,
    expected: { name: 'yandex-browser', family: 'chromium', mode: 'browser' },
    source: REGRESSION_SOURCE,
  },
  {
    id: 'arc-before-chrome',
    userAgent: `${CHROME_DESKTOP} Arc/1.63.0`,
    expected: { name: 'arc', family: 'chromium', mode: 'browser' },
    source: REGRESSION_SOURCE,
  },
  {
    id: 'chromium-product',
    userAgent:
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chromium/150.0.0.0 Safari/537.36',
    expected: { name: 'chromium', family: 'chromium', mode: 'browser' },
    source: REGRESSION_SOURCE,
  },
  {
    id: 'android-webview',
    userAgent:
      'Mozilla/5.0 (Linux; Android 16; Pixel 10 Pro Build/BP2A; wv) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Version/4.0 Chrome/150.0.0.0 Mobile Safari/537.36',
    expected: { name: 'chrome', family: 'chromium', mode: 'webview' },
    source: REGRESSION_SOURCE,
  },
  {
    id: 'headless-chrome',
    userAgent:
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) HeadlessChrome/150.0.0.0 Safari/537.36',
    expected: { name: 'chrome', family: 'chromium', mode: 'headless' },
    source: REGRESSION_SOURCE,
  },
]);
