import type { DetectionFixture, FixtureSource } from './fixture-types';

const SOURCE: FixtureSource = Object.freeze({
    kind: 'regression',
    authority: 'ua-info regression suite',
    reference: 'robustness-inputs-v2.1',
    observedAt: '2026-07-24',
    notes: 'Bounded malformed, contradictory, Unicode, and oversized input fixtures.',
});

export const MALFORMED_FIXTURES: readonly DetectionFixture[] = Object.freeze([
    {
        id: 'empty-user-agent',
        userAgent: '',
        expected: { ua: '', browser: null, client: null, context: null },
        source: SOURCE,
    },
    {
        id: 'whitespace-user-agent',
        userAgent: '   \t\n',
        expected: { ua: '   \t\n', browser: null, client: null },
        source: SOURCE,
    },
    {
        id: 'unicode-unknown-product',
        userAgent: 'ตัวอย่างไคลเอนต์/๑.๐ 🚀',
        expected: { browser: null, client: null },
        source: SOURCE,
    },
    {
        id: 'control-character-before-browser',
        userAgent: '\u0000Chrome/150.0.0.0\u0007',
        expected: { browser: { id: 'chrome', version: { raw: '150.0.0.0' } } },
        source: SOURCE,
    },
    {
        id: 'truncated-browser-version',
        userAgent: 'Mozilla/5.0 Chrome/',
        expected: { browser: null },
        source: SOURCE,
    },
    {
        id: 'duplicated-browser-token-first-version',
        userAgent: 'Chrome/150.0.0.0 Chrome/149.0.0.0',
        expected: { browser: { id: 'chrome', version: { raw: '150.0.0.0' } } },
        source: SOURCE,
    },
    {
        id: 'contradictory-browser-precedence',
        userAgent: 'Chrome/150.0.0.0 Firefox/130.0',
        expected: { browser: { id: 'firefox', version: { raw: '130.0' } }, engine: { id: 'gecko' } },
        source: SOURCE,
    },
    {
        id: 'bounded-long-user-agent',
        userAgent: `${'x'.repeat(64 * 1024)} Chrome/150.0.0.0`,
        expected: { browser: { id: 'chrome' } },
        source: SOURCE,
    },
]);
