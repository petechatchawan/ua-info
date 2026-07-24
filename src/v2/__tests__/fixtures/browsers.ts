import type { DetectionFixture, FixtureSource } from './fixture-types';

const REGRESSION_SOURCE: FixtureSource = Object.freeze({
    kind: 'regression',
    authority: 'ua-info regression suite',
    reference: 'browser-precedence-v2.1',
    observedAt: '2026-07-24',
    notes: 'Synthetic collision fixtures that lock product and engine precedence.',
});

const CHROME_DESKTOP =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';

const CHROME_ANDROID =
    'Mozilla/5.0 (Linux; Android 16; Pixel 10 Pro) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36';

export const BROWSER_FIXTURES: readonly DetectionFixture[] = Object.freeze([
    {
        id: 'chrome-desktop-browser',
        userAgent: CHROME_DESKTOP,
        expected: {
            browser: { id: 'chrome', family: 'chromium', mode: 'browser' },
            engine: { id: 'blink' },
        },
        source: REGRESSION_SOURCE,
    },
    {
        id: 'chromium-explicit-product',
        userAgent:
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ' +
            '(KHTML, like Gecko) Chromium/150.0.0.0 Safari/537.36',
        expected: {
            browser: { id: 'chromium', name: 'Chromium', family: 'chromium', mode: 'browser' },
            engine: { id: 'blink' },
        },
        source: REGRESSION_SOURCE,
    },
    {
        id: 'edge-before-chrome',
        userAgent: `${CHROME_DESKTOP} Edg/150.0.0.0`,
        expected: { browser: { id: 'edge' }, engine: { id: 'blink' } },
        source: REGRESSION_SOURCE,
    },
    {
        id: 'opera-before-chrome',
        userAgent: `${CHROME_DESKTOP} OPR/115.0.0.0`,
        expected: { browser: { id: 'opera' }, engine: { id: 'blink' } },
        source: REGRESSION_SOURCE,
    },
    {
        id: 'samsung-internet-before-chrome',
        userAgent: `${CHROME_ANDROID} SamsungBrowser/28.0`,
        expected: { browser: { id: 'samsung-internet' }, engine: { id: 'blink' } },
        source: REGRESSION_SOURCE,
    },
    {
        id: 'headless-chrome-before-chrome',
        userAgent:
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ' +
            '(KHTML, like Gecko) HeadlessChrome/150.0.0.0 Safari/537.36',
        expected: {
            browser: { id: 'chrome', mode: 'headless' },
            engine: { id: 'blink' },
        },
        source: REGRESSION_SOURCE,
    },
    {
        id: 'chrome-ios-uses-webkit',
        userAgent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) ' +
            'AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/150.0.0.0 Mobile/15E148 Safari/604.1',
        expected: {
            browser: { id: 'chrome', mode: 'browser' },
            engine: { id: 'webkit' },
        },
        source: REGRESSION_SOURCE,
    },
    {
        id: 'android-webview-mode',
        userAgent:
            'Mozilla/5.0 (Linux; Android 16; Pixel 10 Pro Build/BP2A.260705.008; wv) ' +
            'AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/150.0.0.0 ' +
            'Mobile Safari/537.36',
        expected: { browser: { id: 'chrome', mode: 'webview' } },
        source: REGRESSION_SOURCE,
    },
    {
        id: 'safari-compatibility-token-is-insufficient',
        userAgent: 'Mozilla/5.0 AppleWebKit/605.1.15 Safari/605.1.15',
        expected: { browser: null },
        source: REGRESSION_SOURCE,
    },
]);
