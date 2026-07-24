import { BrowserFamily, BrowserId } from '../constants';
import type { BrowserInfo, BrowserMode } from '../types';
import { parseVersion } from '../version';

export type BrowserEngineHint = 'blink' | 'gecko' | 'trident' | 'webkit';

export interface BrowserDetection {
    readonly browser: BrowserInfo;
    readonly engineHint: BrowserEngineHint;
}

interface BrowserPattern {
    readonly regex: RegExp;
    readonly id: string;
    readonly name: string;
    readonly family: string;
    readonly engine: BrowserEngineHint;
    readonly mode?: BrowserMode;
}

function createDetection(pattern: BrowserPattern, versionRaw: string, mode?: BrowserMode): BrowserDetection {
    return {
        browser: {
            id: pattern.id,
            name: pattern.name,
            version: parseVersion(versionRaw),
            family: pattern.family,
            mode: mode ?? pattern.mode ?? 'browser',
        },
        engineHint: pattern.engine,
    };
}

function findPattern(userAgent: string, patterns: readonly BrowserPattern[]): BrowserDetection | null {
    for (const pattern of patterns) {
        const match = pattern.regex.exec(userAgent);
        if (match?.[1]) {
            return createDetection(pattern, match[1]);
        }
    }

    return null;
}

function isAndroidWebView(userAgent: string): boolean {
    return /(?:;\s*wv\)|\bVersion\/4\.0\b.*\bChrome\/)/i.test(userAgent);
}

const DERIVATIVE_PATTERNS: readonly BrowserPattern[] = [
    {
        regex: /\bEdgiOS\/([0-9]+(?:\.[0-9]+)*)/i,
        id: BrowserId.Edge,
        name: 'Edge',
        family: BrowserFamily.Chromium,
        engine: 'webkit',
    },
    {
        regex: /\bEdgA?\/([0-9]+(?:\.[0-9]+)*)/i,
        id: BrowserId.Edge,
        name: 'Edge',
        family: BrowserFamily.Chromium,
        engine: 'blink',
    },
    {
        regex: /\b(?:OPiOS|OPT)\/([0-9]+(?:\.[0-9]+)*)/i,
        id: BrowserId.Opera,
        name: 'Opera',
        family: BrowserFamily.Chromium,
        engine: 'webkit',
    },
    {
        regex: /\b(?:OPR|Opera Mini)\/([0-9]+(?:\.[0-9]+)*)/i,
        id: BrowserId.Opera,
        name: 'Opera',
        family: BrowserFamily.Chromium,
        engine: 'blink',
    },
    {
        regex: /\bSamsungBrowser\/([0-9]+(?:\.[0-9]+)*)/i,
        id: BrowserId.SamsungInternet,
        name: 'Samsung Internet',
        family: BrowserFamily.Chromium,
        engine: 'blink',
    },
    {
        regex: /\bVivaldi\/([0-9]+(?:\.[0-9]+)*)/i,
        id: BrowserId.Vivaldi,
        name: 'Vivaldi',
        family: BrowserFamily.Chromium,
        engine: 'blink',
    },
    {
        regex: /\bYaBrowser\/([0-9]+(?:\.[0-9]+)*)/i,
        id: BrowserId.Yandex,
        name: 'Yandex Browser',
        family: BrowserFamily.Chromium,
        engine: 'blink',
    },
    {
        regex: /\bUCBrowser\/([0-9]+(?:\.[0-9]+)*)/i,
        id: BrowserId.UCBrowser,
        name: 'UC Browser',
        family: BrowserFamily.Chromium,
        engine: 'blink',
    },
    {
        regex: /\bHuaweiBrowser\/([0-9]+(?:\.[0-9]+)*)/i,
        id: BrowserId.Huawei,
        name: 'Huawei Browser',
        family: BrowserFamily.Chromium,
        engine: 'blink',
    },
    {
        regex: /\b(?:XiaoMi\/MiuiBrowser|MiuiBrowser)\/([0-9]+(?:\.[0-9]+)*)/i,
        id: BrowserId.Xiaomi,
        name: 'Xiaomi Browser',
        family: BrowserFamily.Chromium,
        engine: 'blink',
    },
    {
        regex: /\bArc\/([0-9]+(?:\.[0-9]+)*)/i,
        id: BrowserId.Arc,
        name: 'Arc',
        family: BrowserFamily.Chromium,
        engine: 'blink',
    },
    {
        regex: /\bBrave(?: Chrome)?\/([0-9]+(?:\.[0-9]+)*)/i,
        id: BrowserId.Brave,
        name: 'Brave',
        family: BrowserFamily.Chromium,
        engine: 'blink',
    },
];

/** Detects browser product identity without reading runtime globals. */
export function detectBrowser(userAgent: string): BrowserDetection | null {
    const headless = /\bHeadlessChrome\/([0-9]+(?:\.[0-9]+)*)/i.exec(userAgent);
    if (headless?.[1]) {
        return createDetection(
            {
                regex: /$^/,
                id: BrowserId.Chrome,
                name: 'Chrome',
                family: BrowserFamily.Chromium,
                engine: 'blink',
            },
            headless[1],
            'headless',
        );
    }

    const derivative = findPattern(userAgent, DERIVATIVE_PATTERNS);
    if (derivative) return derivative;

    const firefoxIOS = /\bFxiOS\/([0-9]+(?:\.[0-9]+)*)/i.exec(userAgent);
    if (firefoxIOS?.[1]) {
        return createDetection(
            {
                regex: /$^/,
                id: BrowserId.Firefox,
                name: 'Firefox',
                family: BrowserFamily.Firefox,
                engine: 'webkit',
            },
            firefoxIOS[1],
        );
    }

    const firefox = /\bFirefox\/([0-9]+(?:\.[0-9]+)*)/i.exec(userAgent);
    if (firefox?.[1]) {
        return createDetection(
            {
                regex: /$^/,
                id: BrowserId.Firefox,
                name: 'Firefox',
                family: BrowserFamily.Firefox,
                engine: 'gecko',
            },
            firefox[1],
        );
    }

    const chromeIOS = /\bCriOS\/([0-9]+(?:\.[0-9]+)*)/i.exec(userAgent);
    if (chromeIOS?.[1]) {
        return createDetection(
            {
                regex: /$^/,
                id: BrowserId.Chrome,
                name: 'Chrome',
                family: BrowserFamily.Chromium,
                engine: 'webkit',
            },
            chromeIOS[1],
        );
    }

    const chromium = /\bChromium\/([0-9]+(?:\.[0-9]+)*)/i.exec(userAgent);
    if (chromium?.[1]) {
        return createDetection(
            {
                regex: /$^/,
                id: BrowserId.Chromium,
                name: 'Chromium',
                family: BrowserFamily.Chromium,
                engine: 'blink',
            },
            chromium[1],
            isAndroidWebView(userAgent) ? 'webview' : 'browser',
        );
    }

    const chrome = /\bChrome\/([0-9]+(?:\.[0-9]+)*)/i.exec(userAgent);
    if (chrome?.[1]) {
        return createDetection(
            {
                regex: /$^/,
                id: BrowserId.Chrome,
                name: 'Chrome',
                family: BrowserFamily.Chromium,
                engine: 'blink',
            },
            chrome[1],
            isAndroidWebView(userAgent) ? 'webview' : 'browser',
        );
    }

    const safariVersion = /\bVersion\/([0-9]+(?:\.[0-9]+)*)/i.exec(userAgent);
    if (safariVersion?.[1] && /\bSafari\/[0-9.]+/i.test(userAgent)) {
        return createDetection(
            {
                regex: /$^/,
                id: BrowserId.Safari,
                name: 'Safari',
                family: BrowserFamily.Safari,
                engine: 'webkit',
            },
            safariVersion[1],
        );
    }

    const ie = /(?:MSIE\s|Trident\/.*?rv:)([0-9]+(?:\.[0-9]+)*)/i.exec(userAgent);
    if (ie?.[1]) {
        return createDetection(
            {
                regex: /$^/,
                id: BrowserId.InternetExplorer,
                name: 'Internet Explorer',
                family: BrowserFamily.InternetExplorer,
                engine: 'trident',
            },
            ie[1],
        );
    }

    return null;
}
