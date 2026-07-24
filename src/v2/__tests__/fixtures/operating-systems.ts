import type { DetectionFixture, FixtureSource } from './fixture-types';

const SOURCE: FixtureSource = Object.freeze({
    kind: 'regression',
    authority: 'ua-info regression suite',
    reference: 'operating-system-precedence-v2.1',
    observedAt: '2026-07-24',
    notes: 'Locks operating-system precedence and version normalization.',
});

export const OPERATING_SYSTEM_FIXTURES: readonly DetectionFixture[] = Object.freeze([
    {
        id: 'windows-phone-before-windows-nt',
        userAgent: 'Mozilla/5.0 (Windows Phone 10.0; Android 6.0.1; Microsoft; Lumia 950 XL Dual SIM) AppleWebKit/537.36 Edge/15.15063',
        expected: { os: { id: 'windows', name: 'Windows Phone', version: { raw: '10.0' } } },
        source: SOURCE,
    },
    {
        id: 'windows-nt-version-map',
        userAgent: 'Mozilla/5.0 (Windows NT 6.3; Win64; x64)',
        expected: { os: { id: 'windows', name: 'Windows', version: { raw: '8.1' } } },
        source: SOURCE,
    },
    {
        id: 'iphone-ios-normalization',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X)',
        expected: { os: { id: 'ios', name: 'iOS', version: { raw: '19.0' } } },
        source: SOURCE,
    },
    {
        id: 'ipad-os-name-and-version',
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 19_0 like Mac OS X)',
        expected: { os: { id: 'ios', name: 'iPadOS', version: { raw: '19.0' } } },
        source: SOURCE,
    },
    {
        id: 'android-operating-system',
        userAgent: 'Mozilla/5.0 (Linux; Android 16; Pixel 10 Pro)',
        expected: { os: { id: 'android', name: 'Android', version: { raw: '16' } } },
        source: SOURCE,
    },
    {
        id: 'harmony-operating-system',
        userAgent: 'Mozilla/5.0 (Linux; HarmonyOS 5.0; HUAWEI ALN-AL00)',
        expected: { os: { id: 'harmonyos', name: 'HarmonyOS', version: { raw: '5.0' } } },
        source: SOURCE,
    },
    {
        id: 'chromeos-operating-system',
        userAgent: 'Mozilla/5.0 (X11; CrOS x86_64 16093.68.0)',
        expected: { os: { id: 'chromeos', name: 'ChromeOS', version: { raw: '16093.68.0' } } },
        source: SOURCE,
    },
    {
        id: 'macos-operating-system',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 15_5)',
        expected: { os: { id: 'macos', name: 'macOS', version: { raw: '15.5' } } },
        source: SOURCE,
    },
    {
        id: 'linux-operating-system',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
        expected: { os: { id: 'linux', name: 'Linux', version: null } },
        source: SOURCE,
    },
    {
        id: 'kaios-operating-system',
        userAgent: 'Mozilla/5.0 (Mobile; KaiOS/3.1)',
        expected: { os: { id: 'kaios', name: 'KaiOS', version: { raw: '3.1' } } },
        source: SOURCE,
    },
    {
        id: 'tizen-operating-system',
        userAgent: 'Mozilla/5.0 (SMART-TV; Linux; Tizen 8.0)',
        expected: { os: { id: 'tizen', name: 'Tizen', version: { raw: '8.0' } } },
        source: SOURCE,
    },
]);
