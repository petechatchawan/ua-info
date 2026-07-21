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
const EDGE_DESKTOP =
    `${CHROME_DESKTOP} Edg/120.0.2210.91`;
const EDGE_ANDROID =
    `${CHROME_ANDROID} EdgA/120.0.2210.89`;
const EDGE_IOS =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) ' +
    'AppleWebKit/605.1.15 (KHTML, like Gecko) EdgiOS/120.0.2210.86 ' +
    'Mobile/15E148 Safari/605.1.15';
const FIREFOX_DESKTOP =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) ' +
    'Gecko/20100101 Firefox/121.0';
const FIREFOX_IOS =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) ' +
    'AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/121.0 ' +
    'Mobile/15E148 Safari/605.1.15';
const SAFARI_MACOS =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
    'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15';
const SAFARI_IOS =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) ' +
    'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 ' +
    'Mobile/15E148 Safari/604.1';

describe('v2 pure browser parser', () => {
    it.each([
        ['desktop', CHROME_DESKTOP, '120.0.6099.109'],
        ['Android', CHROME_ANDROID, '120.0.6099.144'],
    ])('detects Chrome on %s with Blink', (_label, userAgent, version) => {
        const result = parse(userAgent);

        expect(result.browser).toEqual({
            id: BrowserId.Chrome,
            name: 'Chrome',
            version: {
                raw: version,
                major: 120,
                minor: 0,
            },
            family: BrowserFamily.Chromium,
            mode: 'browser',
        });
        expect(result.engine).toEqual({
            id: EngineId.Blink,
            name: 'Blink',
            version: null,
        });
    });

    it('detects Chrome on iOS while preserving the WebKit engine', () => {
        const result = parse(CHROME_IOS);

        expect(result.browser?.id).toBe(BrowserId.Chrome);
        expect(result.browser?.family).toBe(BrowserFamily.Chromium);
        expect(result.engine).toEqual({
            id: EngineId.WebKit,
            name: 'WebKit',
            version: {
                raw: '605.1.15',
                major: 605,
                minor: 1,
            },
        });
    });

    it.each([
        ['desktop', EDGE_DESKTOP, EngineId.Blink],
        ['Android', EDGE_ANDROID, EngineId.Blink],
        ['iOS', EDGE_IOS, EngineId.WebKit],
    ])('detects Edge before Chrome on %s', (_label, userAgent, engineId) => {
        const result = parse(userAgent);

        expect(result.browser?.id).toBe(BrowserId.Edge);
        expect(result.browser?.family).toBe(BrowserFamily.Chromium);
        expect(result.engine?.id).toBe(engineId);
    });

    it('detects desktop Firefox with Gecko and the rv engine version', () => {
        const result = parse(FIREFOX_DESKTOP);

        expect(result.browser?.id).toBe(BrowserId.Firefox);
        expect(result.browser?.family).toBe(BrowserFamily.Firefox);
        expect(result.engine).toEqual({
            id: EngineId.Gecko,
            name: 'Gecko',
            version: {
                raw: '121.0',
                major: 121,
                minor: 0,
            },
        });
    });

    it('detects Firefox on iOS with WebKit rather than Gecko', () => {
        const result = parse(FIREFOX_IOS);

        expect(result.browser?.id).toBe(BrowserId.Firefox);
        expect(result.engine?.id).toBe(EngineId.WebKit);
    });

    it.each([
        ['macOS', SAFARI_MACOS],
        ['iOS', SAFARI_IOS],
    ])('detects Safari on %s', (_label, userAgent) => {
        const result = parse(userAgent);

        expect(result.browser?.id).toBe(BrowserId.Safari);
        expect(result.browser?.family).toBe(BrowserFamily.Safari);
        expect(result.browser?.version?.raw).toBe('17.2');
        expect(result.engine?.id).toBe(EngineId.WebKit);
    });

    it.each([
        ['Opera', `${CHROME_DESKTOP} OPR/106.0.0.0`],
        ['Samsung Internet', `${CHROME_ANDROID} SamsungBrowser/23.0`],
        ['Vivaldi', `${CHROME_DESKTOP} Vivaldi/7.2.3621.60`],
    ])('does not misclassify unsupported %s as Chrome', (_label, userAgent) => {
        const result = parse(userAgent);

        expect(result.browser).toBeNull();
        expect(result.engine?.id).toBe(EngineId.Blink);
    });

    it('returns canonical unknown dimensions for an unrecognized User-Agent', () => {
        const result = parse('ExampleClient/1.0');

        expect(result).toEqual({
            ua: 'ExampleClient/1.0',
            browser: null,
            engine: null,
            os: null,
            device: {
                type: 'unknown',
                vendor: null,
                model: null,
            },
            cpu: null,
            client: null,
            context: null,
        });
    });

    it('preserves the exact input and does not read browser globals', () => {
        const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
        Object.defineProperty(globalThis, 'navigator', {
            configurable: true,
            get() {
                throw new Error('parse() must not access navigator');
            },
        });

        try {
            const result = parse(CHROME_DESKTOP);
            expect(result.ua).toBe(CHROME_DESKTOP);
        } finally {
            if (originalDescriptor) {
                Object.defineProperty(globalThis, 'navigator', originalDescriptor);
            } else {
                Reflect.deleteProperty(globalThis, 'navigator');
            }
        }
    });
});
