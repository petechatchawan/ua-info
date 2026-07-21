import { BrowserFamily, BrowserId, EngineId, parse } from '../index';

const CHROME_DESKTOP =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/120.0.6099.109 Safari/537.36';
const CHROME_ANDROID =
    'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36';
const CHROME_IOS =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) ' +
    'AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 ' +
    'Mobile/15E148 Safari/604.1';
const EDGE_DESKTOP = `${CHROME_DESKTOP} Edg/120.0.2210.91`;
const FIREFOX_DESKTOP =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) ' +
    'Gecko/20100101 Firefox/121.0';
const SAFARI_IOS =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) ' +
    'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 ' +
    'Mobile/15E148 Safari/604.1';
const LINE_LIFF =
    'Mozilla/5.0 (Linux; Android 16; 2407FPN8EG Build/BP2A.250605.031.A3; wv) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 ' +
    'Chrome/150.0.7871.46 Mobile Safari/537.36 Line/26.11.0 LIFF';

describe('v2 complete pure parser', () => {
    it('detects Chrome, Windows, desktop device, and x64 CPU', () => {
        const result = parse(CHROME_DESKTOP);
        expect(result.browser?.id).toBe(BrowserId.Chrome);
        expect(result.browser?.family).toBe(BrowserFamily.Chromium);
        expect(result.browser?.version?.raw).toBe('120.0.6099.109');
        expect(result.engine?.id).toBe(EngineId.Blink);
        expect(result.os?.id).toBe('windows');
        expect(result.device.type).toBe('desktop');
        expect(result.cpu).toEqual({ architecture: 'x86_64', bitness: 64 });
    });

    it('detects Android device identity without losing the browser', () => {
        const result = parse(CHROME_ANDROID);
        expect(result.browser?.id).toBe(BrowserId.Chrome);
        expect(result.os?.id).toBe('android');
        expect(result.device).toEqual({ type: 'mobile', vendor: 'Google', model: 'Pixel 8 Pro' });
    });

    it('preserves iOS browser product identity while using WebKit', () => {
        const result = parse(CHROME_IOS);
        expect(result.browser?.id).toBe(BrowserId.Chrome);
        expect(result.engine?.id).toBe(EngineId.WebKit);
        expect(result.os?.id).toBe('ios');
        expect(result.device).toEqual({ type: 'mobile', vendor: 'Apple', model: 'iPhone' });
    });

    it('detects Edge before the shared Chrome token', () => {
        const result = parse(EDGE_DESKTOP);
        expect(result.browser?.id).toBe(BrowserId.Edge);
        expect(result.engine?.id).toBe(EngineId.Blink);
    });

    it('detects Firefox and Gecko', () => {
        const result = parse(FIREFOX_DESKTOP);
        expect(result.browser?.id).toBe(BrowserId.Firefox);
        expect(result.engine?.id).toBe(EngineId.Gecko);
        expect(result.os?.id).toBe('macos');
    });

    it('detects Safari on iOS', () => {
        const result = parse(SAFARI_IOS);
        expect(result.browser?.id).toBe(BrowserId.Safari);
        expect(result.engine?.id).toBe(EngineId.WebKit);
    });

    it.each([
        [BrowserId.Opera, `${CHROME_DESKTOP} OPR/106.0.0.0`],
        [BrowserId.SamsungInternet, `${CHROME_ANDROID} SamsungBrowser/23.0`],
        [BrowserId.Vivaldi, `${CHROME_DESKTOP} Vivaldi/7.2.3621.60`],
        [BrowserId.Yandex, `${CHROME_DESKTOP} YaBrowser/24.1.0.0`],
    ])('detects Chromium derivative %s before Chrome', (browserId, userAgent) => {
        const result = parse(userAgent);
        expect(result.browser?.id).toBe(browserId);
        expect(result.engine?.id).toBe(EngineId.Blink);
    });

    it('detects LINE LIFF as Chrome WebView with host context', () => {
        const result = parse(LINE_LIFF);
        expect(result.browser).toMatchObject({ id: BrowserId.Chrome, mode: 'webview' });
        expect(result.os?.version?.raw).toBe('16');
        expect(result.device).toEqual({ type: 'mobile', vendor: 'Xiaomi', model: '2407FPN8EG' });
        expect(result.client).toBeNull();
        expect(result.context).toMatchObject({
            kind: 'mini-app',
            id: 'liff',
            host: { id: 'line', name: 'LINE' },
        });
    });

    it('distinguishes LINE in-app from LIFF', () => {
        const result = parse(LINE_LIFF.replace(/ LIFF$/, ''));
        expect(result.context?.kind).toBe('in-app-browser');
        expect(result.context?.host?.id).toBe('line');
    });

    it.each([
        ['AhrefsBot/7.0', 'crawler', 'ahrefsbot'],
        ['GPTBot/1.2', 'ai-agent', 'gptbot'],
        ['curl/8.7.1', 'http-client', 'curl'],
        ['Playwright/1.45.0', 'automation', 'playwright'],
    ])('selects non-browser client for %s', (userAgent, kind, id) => {
        const result = parse(userAgent);
        expect(result.client).toMatchObject({ kind, id });
        expect(result.browser).toBeNull();
    });

    it('returns canonical unknown values for an unrecognized User-Agent', () => {
        expect(parse('ExampleClient/1.0')).toEqual({
            ua: 'ExampleClient/1.0',
            browser: null,
            engine: null,
            os: null,
            device: { type: 'unknown', vendor: null, model: null },
            cpu: null,
            client: null,
            context: null,
        });
    });

    it('does not read browser globals', () => {
        const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
        Object.defineProperty(globalThis, 'navigator', {
            configurable: true,
            get() {
                throw new Error('parse() must not access navigator');
            },
        });
        try {
            expect(parse(CHROME_DESKTOP).ua).toBe(CHROME_DESKTOP);
        } finally {
            if (originalDescriptor) Object.defineProperty(globalThis, 'navigator', originalDescriptor);
            else Reflect.deleteProperty(globalThis, 'navigator');
        }
    });
});
