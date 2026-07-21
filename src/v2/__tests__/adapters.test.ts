import { detectCurrent } from '../browser';
import { parseRequest } from '../server';

const REDUCED_CHROME_UA =
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

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
