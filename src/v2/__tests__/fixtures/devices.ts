import type { DetectionFixture, FixtureSource } from './fixture-types';

const SOURCE: FixtureSource = Object.freeze({
    kind: 'regression',
    authority: 'ua-info regression suite',
    reference: 'device-cpu-coverage-v2.1',
    observedAt: '2026-07-24',
    notes: 'Locks device class, conservative vendor inference, model extraction, and CPU normalization.',
});

export const DEVICE_FIXTURES: readonly DetectionFixture[] = Object.freeze([
    {
        id: 'iphone-mobile-device',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X)',
        expected: { device: { type: 'mobile', vendor: 'Apple', model: 'iPhone' }, cpu: { architecture: 'arm64', bitness: 64 } },
        source: SOURCE,
    },
    {
        id: 'ipad-tablet-device',
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 19_0 like Mac OS X)',
        expected: { device: { type: 'tablet', vendor: 'Apple', model: 'iPad' }, cpu: { architecture: 'arm64', bitness: 64 } },
        source: SOURCE,
    },
    {
        id: 'pixel-android-mobile-model',
        userAgent: 'Mozilla/5.0 (Linux; Android 16; Pixel 10 Pro Build/BP2A.260705.008) Mobile',
        expected: { device: { type: 'mobile', vendor: 'Google', model: 'Pixel 10 Pro' } },
        source: SOURCE,
    },
    {
        id: 'android-tablet-with-unknown-vendor',
        userAgent: 'Mozilla/5.0 (Linux; Android 15; ExampleTab T10 Build/ABC123)',
        expected: { device: { type: 'tablet', vendor: null, model: 'ExampleTab T10' } },
        source: SOURCE,
    },
    {
        id: 'samsung-android-vendor',
        userAgent: 'Mozilla/5.0 (Linux; Android 15; SM-S938B Build/AP3A.240905.015) Mobile',
        expected: { device: { type: 'mobile', vendor: 'Samsung', model: 'SM-S938B' } },
        source: SOURCE,
    },
    {
        id: 'smart-tv-device',
        userAgent: 'Mozilla/5.0 (SMART-TV; Linux; Tizen 8.0)',
        expected: { device: { type: 'smart-tv' } },
        source: SOURCE,
    },
    {
        id: 'console-device',
        userAgent: 'Mozilla/5.0 (PlayStation 5/8.00)',
        expected: { device: { type: 'console' } },
        source: SOURCE,
    },
    {
        id: 'wearable-device',
        userAgent: 'Mozilla/5.0 (Linux; Android 14; Wear OS 5.0; Watch)',
        expected: { device: { type: 'wearable' } },
        source: SOURCE,
    },
    {
        id: 'xr-device',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) OculusBrowser/35.0 Quest 3',
        expected: { device: { type: 'xr', vendor: 'Meta' } },
        source: SOURCE,
    },
    {
        id: 'embedded-framework-device',
        userAgent: 'ExampleRuntime Cordova/13.0.0',
        expected: { device: { type: 'embedded' } },
        source: SOURCE,
    },
    {
        id: 'desktop-x86-64-cpu',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        expected: { device: { type: 'desktop' }, cpu: { architecture: 'x86_64', bitness: 64 } },
        source: SOURCE,
    },
    {
        id: 'android-arm64-cpu',
        userAgent: 'Mozilla/5.0 (Linux; Android 16; arm64; Pixel 10 Pro) Mobile',
        expected: { cpu: { architecture: 'arm64', bitness: 64 } },
        source: SOURCE,
    },
    {
        id: 'riscv64-cpu',
        userAgent: 'ExampleClient/1.0 (Linux; riscv64)',
        expected: { cpu: { architecture: 'riscv', bitness: 64 } },
        source: SOURCE,
    },
]);
