import { BrowserId, CPUArchitecture, type UAResult } from '../index';

const chromeResult: UAResult = {
    ua: 'Mozilla/5.0 Chrome/120.0.0.0',
    browser: {
        id: BrowserId.Chrome,
        name: 'Chrome',
        version: {
            raw: '120.0.0.0',
            major: 120,
            minor: 0,
        },
        family: 'chromium',
        mode: 'browser',
    },
    engine: {
        id: 'blink',
        name: 'Blink',
        version: null,
    },
    os: null,
    device: {
        type: 'desktop',
        vendor: null,
        model: null,
    },
    cpu: {
        architecture: CPUArchitecture.X86_64,
        bitness: 64,
    },
    client: null,
    context: null,
};

describe('v2 public contracts', () => {
    it('represents an ordinary browser without duplicating it as a client', () => {
        expect(chromeResult.browser?.id).toBe(BrowserId.Chrome);
        expect(chromeResult.client).toBeNull();
        expect(chromeResult.context).toBeNull();
    });

    it('supports hostless execution contexts such as PWA', () => {
        const pwaResult: UAResult = {
            ...chromeResult,
            context: {
                kind: 'pwa',
                id: 'standalone',
                name: 'Standalone PWA',
                host: null,
            },
        };

        expect(pwaResult.context?.host).toBeNull();
    });

    it('keeps the result immutable at the type level', () => {
        // @ts-expect-error UAResult fields are readonly by contract.
        chromeResult.ua = 'changed';

        expect(chromeResult.ua).toBe('changed');
    });
});
