import { detectCurrent } from '../browser';
import { parseRequest } from '../server';

const REDUCED_CHROME_UA =
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

const LINE_LIFF_UA =
    'Mozilla/5.0 (Linux; Android 16; Pixel 10 Pro Build/BP2A.260705.008; wv) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/150.0.0.0 ' +
    'Mobile Safari/537.36 Line/26.11.0 LIFF';

describe('v2 adapters', () => {
    it('enriches a request with high-entropy Client Hints', () => {
        const result = parseRequest({
            headers: {
                'user-agent': REDUCED_CHROME_UA,
                'sec-ch-ua': '"Not_A Brand";v="99", "Chromium";v="120", "Google Chrome";v="120"',
                'sec-ch-ua-full-version-list':
                    '"Not_A Brand";v="99.0.0.0", "Chromium";v="120.0.6099.109", "Google Chrome";v="120.0.6099.109"',
                'sec-ch-ua-platform': '"Android"',
                'sec-ch-ua-platform-version': '"14.0.0"',
                'sec-ch-ua-mobile': '?1',
                'sec-ch-ua-model': '"Pixel 8 Pro"',
                'sec-ch-ua-arch': '"arm"',
                'sec-ch-ua-bitness': '"64"',
            },
        });

        expect(result.browser?.version?.raw).toBe('120.0.6099.109');
        expect(result.os).toMatchObject({ id: 'android', version: { raw: '14.0.0' } });
        expect(result.device).toMatchObject({ type: 'mobile', model: 'Pixel 8 Pro' });
        expect(result.cpu).toEqual({ architecture: 'arm64', bitness: 64 });
    });

    it('requests and applies the default high-entropy browser hints', async () => {
        const navigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
        const getHighEntropyValues = jest.fn(async (hints: readonly string[]) => {
            expect(hints).toEqual([
                'architecture',
                'bitness',
                'fullVersionList',
                'model',
                'platformVersion',
            ]);

            return {
                architecture: 'x86',
                bitness: '64',
                fullVersionList: [
                    { brand: 'Google Chrome', version: '150.0.0.0' },
                    { brand: 'Microsoft Edge', version: '150.0.0.0' },
                ],
                model: 'Surface Pro',
                platformVersion: '15.0.0',
            };
        });

        Object.defineProperty(globalThis, 'navigator', {
            configurable: true,
            value: {
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/150.0.0.0',
                userAgentData: {
                    brands: [{ brand: 'Google Chrome', version: '150' }],
                    mobile: false,
                    platform: 'Windows',
                    getHighEntropyValues,
                },
            },
        });

        try {
            await expect(detectCurrent()).resolves.toMatchObject({
                browser: { id: 'edge', version: { raw: '150.0.0.0' } },
                os: { id: 'windows', version: { raw: '15.0.0' } },
                device: { model: 'Surface Pro' },
                cpu: { architecture: 'x86_64', bitness: 64 },
            });
            expect(getHighEntropyValues).toHaveBeenCalledTimes(1);
        } finally {
            if (navigatorDescriptor) Object.defineProperty(globalThis, 'navigator', navigatorDescriptor);
            else Reflect.deleteProperty(globalThis, 'navigator');
        }
    });

    it('uses an explicit userAgent over the header value', () => {
        const result = parseRequest({
            userAgent: 'curl/8.7.1',
            headers: { 'user-agent': REDUCED_CHROME_UA },
        });
        expect(result.client?.id).toBe('curl');
        expect(result.browser).toBeNull();
    });

    it('detects runtime PWA state without changing parse()', async () => {
        const navigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
        const matchMediaDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'matchMedia');
        Object.defineProperty(globalThis, 'navigator', {
            configurable: true,
            value: { userAgent: REDUCED_CHROME_UA },
        });
        Object.defineProperty(globalThis, 'matchMedia', {
            configurable: true,
            value: () => ({ matches: true }),
        });

        try {
            const result = await detectCurrent({ highEntropy: [] });
            expect(result.context).toEqual({
                kind: 'pwa',
                id: 'standalone',
                name: 'Standalone PWA',
                host: null,
            });
        } finally {
            if (navigatorDescriptor) Object.defineProperty(globalThis, 'navigator', navigatorDescriptor);
            else Reflect.deleteProperty(globalThis, 'navigator');
            if (matchMediaDescriptor) Object.defineProperty(globalThis, 'matchMedia', matchMediaDescriptor);
            else Reflect.deleteProperty(globalThis, 'matchMedia');
        }
    });

    it('does not replace an existing host context with PWA context', async () => {
        const navigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
        Object.defineProperty(globalThis, 'navigator', {
            configurable: true,
            value: { userAgent: LINE_LIFF_UA, standalone: true },
        });

        try {
            await expect(detectCurrent({ highEntropy: [] })).resolves.toMatchObject({
                context: { kind: 'mini-app', id: 'liff', host: { id: 'line' } },
            });
        } finally {
            if (navigatorDescriptor) Object.defineProperty(globalThis, 'navigator', navigatorDescriptor);
            else Reflect.deleteProperty(globalThis, 'navigator');
        }
    });

    it('propagates high-entropy permission failures', async () => {
        const navigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
        Object.defineProperty(globalThis, 'navigator', {
            configurable: true,
            value: {
                userAgent: REDUCED_CHROME_UA,
                userAgentData: {
                    brands: [{ brand: 'Google Chrome', version: '150' }],
                    mobile: true,
                    platform: 'Android',
                    getHighEntropyValues: async () => {
                        throw new Error('permission denied');
                    },
                },
            },
        });

        try {
            await expect(detectCurrent()).rejects.toThrow('permission denied');
        } finally {
            if (navigatorDescriptor) Object.defineProperty(globalThis, 'navigator', navigatorDescriptor);
            else Reflect.deleteProperty(globalThis, 'navigator');
        }
    });

    it('throws a clear error when detectCurrent runs without navigator', async () => {
        const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
        Reflect.deleteProperty(globalThis, 'navigator');
        try {
            await expect(detectCurrent()).rejects.toThrow('requires a browser-like navigator');
        } finally {
            if (descriptor) Object.defineProperty(globalThis, 'navigator', descriptor);
        }
    });
});
