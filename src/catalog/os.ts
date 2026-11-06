import type { RowSpec } from '../core/match';
import type { Version } from '../types';

export interface OSRow extends RowSpec<string> {
    readonly label: string;
    /** Sec-CH-UA-Platform values that name this OS. An empty list means none is known. */
    readonly platforms: readonly string[];
    /** Maps a raw version to the one published scale. A null value means the raw number is not a version. */
    readonly scale?: {
        readonly ua?: Readonly<Record<string, string | null>>;
        readonly hint?: (version: Version) => string | null;
    };
}

// UA-CH platformVersion for Windows: 13 and later is Windows 11, 1 to 12 is Windows 10, 0 is older and unknown.
function windowsFromPlatformVersion(version: Version): string | null {
    if (version.major < 1) return null;
    return version.major >= 13 ? '11' : '10';
}

const rows = {
    android: {
        label: 'Android',
        platforms: ['Android'],
        match: [
            { words: 'android', versionOptional: true },
            { words: 'android-*', versionOptional: true },
        ],
    },
    blackberry: {
        label: 'BlackBerry OS',
        platforms: [],
        match: [
            { words: 'bb10', versionOptional: true },
            { words: 'blackberry', versionOptional: true },
            { words: 'rim tablet os', versionOptional: true },
        ],
    },
    chromeos: {
        label: 'ChromeOS',
        platforms: ['Chrome OS', 'ChromeOS'],
        match: [{ words: 'cros', skip: 1 }],
    },
    'firefox-os': {
        label: 'Firefox OS',
        platforms: [],
        // A Firefox OS phone is `(Mobile; rv:14.0)` with no platform word at all, so the gate is the
        // absence of every other platform token, not the presence of one.
        match: [
            { words: 'firefox os', versionOptional: true },
            {
                words: 'mobile',
                with: ['firefox'],
                without: ['android', 'linux', 'windows', 'macintosh', 'kaios'],
                versionFrom: 'rv',
                versionOptional: true,
            },
        ],
    },
    fuchsia: {
        label: 'Fuchsia',
        platforms: [],
        match: [{ words: 'fuchsia', versionOptional: true }],
    },
    harmonyos: {
        label: 'HarmonyOS',
        platforms: [],
        beats: ['android'],
        match: [{ words: 'harmonyos', versionOptional: true }],
    },
    ios: {
        label: 'iOS',
        platforms: ['iOS'],
        // Some app User-Agents carry no `CPU iPhone OS` token and only name `iOS` in their own suffix.
        match: [
            { words: 'cpu iphone os' },
            { words: 'iphone os' },
            { words: 'ios', versionOptional: true, fallback: true },
        ],
    },
    ipados: {
        label: 'iPadOS',
        platforms: ['iPadOS'],
        beats: ['ios'],
        match: [
            { words: 'cpu os', with: ['ipad'] },
            { words: 'cpu iphone os', with: ['ipad'] },
            { words: 'iphone os', with: ['ipad'] },
        ],
    },
    kaios: { label: 'KaiOS', platforms: [], match: [{ words: 'kaios' }] },
    linux: {
        label: 'Linux',
        platforms: ['Linux'],
        match: [{ words: 'linux', versionOptional: true, fallback: true }],
    },
    macos: {
        label: 'macOS',
        platforms: ['macOS'],
        // `PPC Mac OS X` carries no release token, and an app string can put a non-version word next.
        // An iOS string also names `Mac OS X`, so the phone tokens keep it out of this row.
        match: [{ words: 'mac os x', versionOptional: true, without: ['iphone', 'ipad'] }],
    },
    openharmony: {
        label: 'OpenHarmony',
        platforms: [],
        // HarmonyOS NEXT User-Agents carry `Windows NT` or `Android` beside `OpenHarmony`.
        beats: ['android', 'harmonyos', 'linux', 'windows'],
        match: [{ words: 'openharmony', versionOptional: true }],
    },
    steamos: {
        label: 'SteamOS',
        platforms: [],
        beats: ['linux'],
        match: [
            { words: 'steamdeck', versionOptional: true },
            { words: 'steam', with: ['valve'], versionOptional: true },
        ],
    },
    symbian: {
        label: 'Symbian',
        platforms: [],
        match: [
            { product: 'SymbianOS' },
            { words: 'symbian', versionOptional: true },
            { product: 'Series60' },
            { words: 'series60', versionOptional: true },
        ],
    },
    tizen: { label: 'Tizen', platforms: [], match: [{ words: 'tizen' }] },
    tvos: {
        label: 'tvOS',
        platforms: [],
        match: ['AppleTV', { words: 'appletv', versionOptional: true }],
    },
    watchos: { label: 'watchOS', platforms: [], match: ['watchOS'] },
    webos: {
        label: 'webOS',
        platforms: [],
        beats: ['linux'],
        match: ['webOS', 'hpwOS', 'web0S', { words: 'webos', versionOptional: true }],
    },
    windows: {
        label: 'Windows',
        platforms: ['Windows'],
        beats: ['android', 'linux'],
        match: [{ words: 'windows nt' }],
        scale: {
            ua: {
                '10.0': '10',
                '6.3': '8.1',
                '6.2': '8',
                '6.1': '7',
                '6.0': null,
                '5.2': null,
                '5.1': null,
                '5.0': null,
            },
            hint: windowsFromPlatformVersion,
        },
    },
    'windows-phone': {
        label: 'Windows Phone',
        platforms: [],
        beats: ['android', 'ios', 'ipados', 'linux', 'macos', 'windows'],
        match: [
            { words: 'windows phone os', versionOptional: true },
            { words: 'windows phone', versionOptional: true },
            { words: 'xblwp7', versionOptional: true },
            { words: 'zunewp7', versionOptional: true },
            { words: 'iemobile', versionOptional: true },
        ],
    },
} as const satisfies Readonly<Record<string, OSRow>>;

export type OSId = keyof typeof rows;
export const OPERATING_SYSTEMS: Readonly<Record<OSId, OSRow>> = rows;

/** Names OS ids in a signal's `os` gate, so a misspelled id fails to compile. */
export const osIn = (...ids: readonly OSId[]): readonly OSId[] => ids;
