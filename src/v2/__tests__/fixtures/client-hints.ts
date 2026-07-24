import type { RequestFixture } from './fixture-types';

const SOURCE = Object.freeze({
    kind: 'regression' as const,
    authority: 'ua-info regression suite',
    reference: 'client-hints-precedence-v2.1',
    observedAt: '2026-07-24',
    notes: 'Locks Client Hints enrichment, precedence, GREASE filtering, and malformed-sibling tolerance.',
});

const REDUCED_CHROME_UA =
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

export const CLIENT_HINT_FIXTURES: readonly RequestFixture[] = Object.freeze([
    {
        id: 'client-hints-full-version-precedence',
        userAgent: REDUCED_CHROME_UA,
        headers: Object.freeze({
            'sec-ch-ua': '"Chromium";v="120", "Google Chrome";v="120"',
            'sec-ch-ua-full-version-list': '"Chromium";v="120.0.6099.109", "Google Chrome";v="120.0.6099.109"',
        }),
        expected: { browser: { id: 'chrome', version: { raw: '120.0.6099.109' } } },
        source: SOURCE,
    },
    {
        id: 'client-hints-edge-before-chrome-brand',
        userAgent: '',
        headers: Object.freeze({
            'sec-ch-ua': '"Google Chrome";v="150", "Microsoft Edge";v="150"',
        }),
        expected: { browser: { id: 'edge', version: { raw: '150' } }, engine: { id: 'blink' } },
        source: SOURCE,
    },
    {
        id: 'client-hints-ignore-grease-brand',
        userAgent: '',
        headers: Object.freeze({
            'sec-ch-ua': '"Not_A Brand";v="99", "Chromium";v="150"',
        }),
        expected: { browser: { id: 'chromium', version: { raw: '150' } } },
        source: SOURCE,
    },
    {
        id: 'client-hints-mobile-false-preserves-tablet',
        userAgent: 'Mozilla/5.0 (Linux; Android 15; ExampleTab T10)',
        headers: Object.freeze({ 'sec-ch-ua-mobile': '?0' }),
        expected: { device: { type: 'tablet', model: 'ExampleTab T10' } },
        source: SOURCE,
    },
    {
        id: 'client-hints-unknown-platform-preserves-os',
        userAgent: 'Mozilla/5.0 (Linux; Android 16; Pixel 10 Pro) Mobile',
        headers: Object.freeze({
            'sec-ch-ua-platform': '"ExampleOS"',
            'sec-ch-ua-platform-version': '"99.0"',
        }),
        expected: { os: { id: 'android', version: { raw: '16' } } },
        source: SOURCE,
    },
    {
        id: 'client-hints-valid-brand-with-malformed-sibling',
        userAgent: '',
        headers: Object.freeze({
            'sec-ch-ua': 'malformed, "Google Chrome";v="150", broken',
        }),
        expected: { browser: { id: 'chrome', version: { raw: '150' } } },
        source: SOURCE,
    },
]);
