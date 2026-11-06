import type { RowSpec } from '../core/match';
import type { BrowserFamily, BrowserMode, EngineId } from '../types';
import { osIn } from './os';

export interface BrowserSignal {
    readonly family?: BrowserFamily | null;
    readonly engine?: EngineId | null;
    readonly mode?: BrowserMode;
}

export interface BrowserRow extends RowSpec<string, BrowserSignal> {
    readonly label: string;
    readonly family: BrowserFamily | null;
    readonly engine: EngineId | null;
    /** Sec-CH-UA brand names that identify this product. An empty list means no brand is known. */
    readonly brands: readonly string[];
    /** The brand names a generic identity, so a specific UA product is not replaced by it. */
    readonly brandIsFallback?: true;
}

const rows = {
    '360': {
        label: '360 Browser',
        family: 'chromium',
        engine: 'blink',
        brands: [],
        // The UA carries the Chrome build that the shell is built on, so its version is the reportable one.
        match: [
            { words: '360se*', versionFrom: 'Chrome', versionOptional: true },
            { words: '360ee*', versionFrom: 'Chrome', versionOptional: true },
            'QHBrowser',
            'QihooBrowser',
        ],
    },
    // The stock Android browser is the only client that reports `Version/` with no Chrome token.
    // Android 4.4 rebuilt it on Chromium, so those builds carry `Chrome/`, and a modern in-app
    // WebView carries the same tokens as that build, so both keep the Chrome identity.
    'android-browser': {
        label: 'Android Browser',
        family: null,
        engine: 'webkit',
        brands: [],
        match: [
            {
                product: 'Version',
                with: ['safari'],
                without: ['chrome'],
                os: osIn('android'),
                fallback: true,
            },
        ],
    },
    arc: { label: 'Arc', family: 'chromium', engine: 'blink', brands: [], match: ['Arc'] },
    brave: {
        label: 'Brave',
        family: 'chromium',
        engine: 'blink',
        brands: ['Brave'],
        match: [
            'Brave',
            { product: 'Brave', os: osIn('ios', 'ipados'), versionOptional: true, family: null },
        ],
    },
    chrome: {
        label: 'Google Chrome',
        family: 'chromium',
        engine: 'blink',
        brands: ['Google Chrome'],
        brandIsFallback: true,
        match: [
            { product: 'Chrome', fallback: true },
            'CriOS',
            { product: 'HeadlessChrome', mode: 'headless', versionOptional: true },
        ],
    },
    // A phone build carries the `Mobile` token; a desktop or tablet build does not. The row is a
    // fallback, so a specific product such as Samsung Internet still beats it.
    'chrome-mobile': {
        label: 'Chrome Mobile',
        family: 'chromium',
        engine: 'blink',
        brands: [],
        beats: ['chrome'],
        match: [
            {
                product: 'Chrome',
                os: osIn('android', 'harmonyos'),
                with: ['mobile'],
                fallback: true,
            },
            { product: 'CrMo', os: osIn('android'), with: ['mobile'], fallback: true },
        ],
    },
    chromium: {
        label: 'Chromium',
        family: 'chromium',
        engine: 'blink',
        brands: [],
        match: ['Chromium'],
    },
    'coc-coc': {
        label: 'Coc Coc',
        family: 'chromium',
        engine: 'blink',
        brands: [],
        match: ['coc_coc_browser'],
    },
    duckduckgo: {
        label: 'DuckDuckGo Browser',
        family: 'chromium',
        engine: 'blink',
        brands: [],
        match: ['Ddg', 'DuckDuckGo'],
    },
    ecosia: {
        label: 'Ecosia',
        family: 'chromium',
        engine: 'blink',
        brands: [],
        match: [{ words: 'ecosia', versionFrom: 'Chrome', versionOptional: true }, 'Ecosia'],
    },
    edge: {
        label: 'Microsoft Edge',
        family: 'chromium',
        engine: 'blink',
        brands: ['Microsoft Edge'],
        // EdgWebView2 is a WebView2 host, so the plain `Edg/` token must not decide the mode for it.
        match: [
            { product: 'Edg', without: ['edgwebview2'] },
            'EdgA',
            'EdgiOS',
            { product: 'EdgW', mode: 'webview' },
            { words: 'edgwebview2', mode: 'webview', versionFrom: 'Edg', versionOptional: true },
        ],
    },
    'edge-legacy': {
        label: 'Microsoft Edge Legacy',
        family: null,
        engine: 'edgehtml',
        brands: [],
        match: ['Edge'],
    },
    firefox: {
        label: 'Firefox',
        family: 'firefox',
        engine: 'gecko',
        brands: [],
        match: ['Firefox'],
    },
    // `FxiOS` is the iOS app token and also appears on Android, so it names the mobile build on its
    // own. A plain `Firefox/` on a phone platform is the mobile build too.
    'firefox-mobile': {
        label: 'Firefox Mobile',
        family: 'firefox',
        engine: 'gecko',
        brands: [],
        beats: ['firefox'],
        match: [
            'FxiOS',
            { product: 'Firefox', os: osIn('android', 'ios', 'ipados'), with: ['mobile'] },
        ],
    },
    'huawei-browser': {
        label: 'Huawei Browser',
        family: 'chromium',
        engine: 'blink',
        brands: [],
        match: ['HuaweiBrowser', 'HBPC'],
    },
    ie: {
        label: 'Internet Explorer',
        family: null,
        engine: null,
        brands: [],
        match: [
            { words: 'msie', versionOptional: true },
            { product: 'Trident', versionFrom: 'rv', versionOptional: true },
        ],
    },
    'mi-browser': {
        label: 'Mi Browser',
        family: 'chromium',
        engine: 'blink',
        brands: [],
        match: ['MiuiBrowser'],
    },
    opera: {
        label: 'Opera',
        family: 'chromium',
        engine: 'blink',
        brands: ['Opera'],
        // The MSIE token in an old Opera string is a compatibility lie, so Opera outranks it.
        beats: ['ie'],
        // Before version 15 Opera ran on Presto and reported its release through `Version/`. The builds
        // that predate that token predate `Version/` too, so the product version is the fallback.
        match: [
            { product: 'OPR' },
            { product: 'OPT' },
            { product: 'Opera', versionPrefer: 'Version', family: null, engine: 'presto' },
        ],
    },
    'opera-gx': {
        label: 'Opera GX',
        family: 'chromium',
        engine: 'blink',
        brands: [],
        beats: ['opera'],
        match: ['OPX', 'OPRGX'],
    },
    'opera-mini': {
        label: 'Opera Mini',
        family: null,
        engine: 'presto',
        brands: [],
        beats: ['opera'],
        match: ['Opera Mini', { product: 'OPiOS', engine: 'webkit' }],
    },
    'opera-mobi': {
        label: 'Opera Mobi',
        family: null,
        engine: 'presto',
        brands: [],
        beats: ['opera'],
        // The token carries a build code, not a version; the release is in `Version/`.
        match: [{ product: 'Opera Mobi', versionFrom: 'Version' }],
    },
    'opera-tablet': {
        label: 'Opera Tablet',
        family: null,
        engine: 'presto',
        brands: [],
        beats: ['opera'],
        match: [{ product: 'Opera Tablet', versionFrom: 'Version' }],
    },
    'pale-moon': {
        label: 'Pale Moon',
        family: 'firefox',
        engine: 'gecko',
        brands: [],
        beats: ['firefox'],
        match: ['PaleMoon'],
    },
    puffin: { label: 'Puffin', family: null, engine: null, brands: [], match: ['Puffin'] },
    qq: {
        label: 'QQ Browser',
        family: 'chromium',
        engine: 'blink',
        brands: [],
        match: [
            { product: 'MQQBrowser', without: ['micromessenger'] },
            { product: 'QQBrowser', without: ['micromessenger'] },
        ],
    },
    safari: {
        label: 'Safari',
        family: 'safari',
        engine: 'webkit',
        brands: [],
        // Safari on Windows keeps the `Version/` token. The builds that predate it send only
        // `Safari/<build>`, which is a WebKit build number, so such a string has no reportable release.
        match: [
            {
                product: 'Version',
                with: ['Safari'],
                os: osIn('ios', 'ipados', 'macos', 'windows'),
                fallback: true,
            },
            {
                product: 'Safari',
                os: osIn('macos', 'windows'),
                without: ['chrome', 'chromium'],
                versionFrom: 'Version',
                versionOptional: true,
                fallback: true,
            },
        ],
    },
    // Safari on iOS and iPadOS is the mobile build; macOS stays `safari`. Both rows are fallbacks,
    // so a specific product such as Edge on iOS still wins.
    'safari-mobile': {
        label: 'Safari Mobile',
        family: 'safari',
        engine: 'webkit',
        brands: [],
        beats: ['safari'],
        match: [
            { product: 'Version', with: ['Safari'], os: osIn('ios', 'ipados'), fallback: true },
            {
                product: 'Safari',
                with: ['mobile'],
                os: osIn('ios', 'ipados'),
                without: ['chrome', 'chromium', 'crios'],
                versionFrom: 'Version',
                versionOptional: true,
                fallback: true,
            },
        ],
    },
    'samsung-internet': {
        label: 'Samsung Internet',
        family: 'chromium',
        engine: 'blink',
        brands: [],
        match: ['SamsungBrowser'],
    },
    'uc-browser': {
        label: 'UC Browser',
        family: 'chromium',
        engine: 'blink',
        brands: [],
        match: ['UCBrowser'],
    },
    vivaldi: {
        label: 'Vivaldi',
        family: 'chromium',
        engine: 'blink',
        brands: [],
        match: ['Vivaldi'],
    },
    'vivo-browser': {
        label: 'Vivo Browser',
        family: 'chromium',
        engine: 'blink',
        brands: [],
        match: ['VivoBrowser'],
    },
    whale: {
        label: 'Whale',
        family: 'chromium',
        engine: 'blink',
        brands: [],
        match: ['Whale'],
    },
    'yandex-browser': {
        label: 'Yandex Browser',
        family: 'chromium',
        engine: 'blink',
        brands: [],
        match: ['YaBrowser'],
    },
} as const satisfies Readonly<Record<string, BrowserRow>>;

export type BrowserId = keyof typeof rows;
export const BROWSERS: Readonly<Record<BrowserId, BrowserRow>> = rows;

/**
 * Top-level products that belong to no browser or context row but appear in ordinary
 * Chromium and WebKit User-Agents. Any other top-level product next to a generic Chrome token
 * marks an unlisted fork, so its identity is not reported as Chrome.
 */
export const NEUTRAL_PRODUCTS: readonly string[] = [
    'mozilla',
    'applewebkit',
    'gecko',
    'safari',
    'mobile',
    'android',
    'version',
    'liff',
    'nettype',
    'language',
    'abi',
    'mmwebid',
    'mmwebsdk',
    'fbnv',
    // Instagram for iOS names its network stack; it is not a browser.
    'nw',
];
