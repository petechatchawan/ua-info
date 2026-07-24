import type { DetectionFixture, FixtureSource } from './fixture-types';

const SOURCE: FixtureSource = Object.freeze({
    kind: 'regression',
    authority: 'ua-info regression suite',
    reference: 'context-precedence-v2.1',
    observedAt: '2026-07-24',
    notes: 'Locks browser, mode, context surface, and host identity separation.',
});

const CHROME_ANDROID =
    'Mozilla/5.0 (Linux; Android 16; Pixel 10 Pro Build/BP2A.260705.008; wv) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/150.0.0.0 ' +
    'Mobile Safari/537.36';

export const CONTEXT_FIXTURES: readonly DetectionFixture[] = Object.freeze([
    {
        id: 'line-liff-mini-app',
        userAgent: `${CHROME_ANDROID} Line/26.11.0 LIFF`,
        expected: {
            browser: { id: 'chrome', mode: 'webview' },
            client: null,
            context: { kind: 'mini-app', id: 'liff', host: { id: 'line', version: { raw: '26.11.0' } } },
        },
        source: SOURCE,
    },
    {
        id: 'line-in-app-without-liff',
        userAgent: `${CHROME_ANDROID} Line/26.11.0`,
        expected: { browser: { mode: 'webview' }, context: { kind: 'in-app-browser', host: { id: 'line' } } },
        source: SOURCE,
    },
    {
        id: 'facebook-in-app-context',
        userAgent: `${CHROME_ANDROID} [FBAN/FB4A;FBAV/520.0.0.0.0;]`,
        expected: { context: { id: 'facebook-in-app', host: { id: 'facebook' } }, browser: { mode: 'webview' } },
        source: SOURCE,
    },
    {
        id: 'instagram-in-app-context',
        userAgent: `${CHROME_ANDROID} Instagram 401.0.0.0.0 Android`,
        expected: { context: { id: 'instagram-in-app', host: { id: 'instagram' } }, browser: { mode: 'webview' } },
        source: SOURCE,
    },
    {
        id: 'tiktok-in-app-context',
        userAgent: `${CHROME_ANDROID} musical_ly_2026000000`,
        expected: { context: { id: 'tiktok-in-app', host: { id: 'tiktok' } }, browser: { mode: 'webview' } },
        source: SOURCE,
    },
    {
        id: 'x-in-app-context',
        userAgent: `${CHROME_ANDROID} TwitterAndroid/10.52.0`,
        expected: { context: { id: 'x-in-app', host: { id: 'x' } }, browser: { mode: 'webview' } },
        source: SOURCE,
    },
    {
        id: 'wechat-in-app-context',
        userAgent: `${CHROME_ANDROID} MicroMessenger/8.0.56`,
        expected: { context: { id: 'wechat-in-app', host: { id: 'wechat' } }, browser: { mode: 'webview' } },
        source: SOURCE,
    },
    {
        id: 'telegram-mini-app-context',
        userAgent: `${CHROME_ANDROID} Telegram/11.2.0`,
        expected: { context: { kind: 'mini-app', id: 'telegram-mini-app', host: { id: 'telegram' } }, browser: { mode: 'webview' } },
        source: SOURCE,
    },
    {
        id: 'electron-embedded-context',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/150.0.0.0 Safari/537.36 Electron/38.0.0',
        expected: { context: { kind: 'embedded', id: 'electron' }, browser: { id: 'chrome', mode: 'embedded' } },
        source: SOURCE,
    },
    {
        id: 'capacitor-embedded-context',
        userAgent: `${CHROME_ANDROID} Capacitor/7.0.0`,
        expected: { context: { kind: 'embedded', id: 'capacitor' }, browser: { mode: 'embedded' } },
        source: SOURCE,
    },
    {
        id: 'cordova-embedded-context',
        userAgent: `${CHROME_ANDROID} Cordova/13.0.0`,
        expected: { context: { kind: 'embedded', id: 'cordova' }, browser: { mode: 'embedded' } },
        source: SOURCE,
    },
    {
        id: 'standalone-android-webview-no-context',
        userAgent: CHROME_ANDROID,
        expected: { browser: { mode: 'webview' }, context: null },
        source: SOURCE,
    },
    {
        id: 'context-does-not-manufacture-browser',
        userAgent: 'Line/26.11.0 LIFF',
        expected: { browser: null, client: null, context: { kind: 'mini-app', id: 'liff', host: { id: 'line' } } },
        source: SOURCE,
    },
    {
        id: 'headless-mode-survives-context',
        userAgent: 'Mozilla/5.0 HeadlessChrome/150.0.0.0 Safari/537.36 Line/26.11.0 LIFF',
        expected: { browser: { id: 'chrome', mode: 'headless' }, context: { id: 'liff' } },
        source: SOURCE,
    },
]);
