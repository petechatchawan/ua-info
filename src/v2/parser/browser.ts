import { BrowserFamily, BrowserId } from '../constants';
import type { BrowserInfo } from '../types';
import { parseVersion } from '../version';

export type BrowserEngineHint = 'blink' | 'gecko' | 'webkit';

export interface BrowserDetection {
    readonly browser: BrowserInfo;
    readonly engineHint: BrowserEngineHint;
}

const CHROMIUM_DERIVATIVE_TOKEN =
    /\b(?:Arc|Brave|Edg(?:A|iOS)?|HuaweiBrowser|MiuiBrowser|OPR|OPT|SamsungBrowser|UCBrowser|Vivaldi|YaBrowser)\//i;

function createDetection(
    id: string,
    name: string,
    family: string,
    versionRaw: string,
    engineHint: BrowserEngineHint,
): BrowserDetection {
    return {
        browser: {
            id,
            name,
            version: parseVersion(versionRaw),
            family,
            mode: 'browser',
        },
        engineHint,
    };
}

/**
 * Detects only the browsers implemented by the v2 core parser.
 * Ordering is deliberate: derivative tokens are resolved before their shared
 * compatibility tokens so Edge never falls through to Chrome and iOS browsers
 * retain their product identity while using WebKit.
 */
export function detectBrowser(userAgent: string): BrowserDetection | null {
    const edgeIOS = /\bEdgiOS\/([0-9]+(?:\.[0-9]+)*)/i.exec(userAgent);
    if (edgeIOS) {
        return createDetection(
            BrowserId.Edge,
            'Edge',
            BrowserFamily.Chromium,
            edgeIOS[1],
            'webkit',
        );
    }

    const edge = /\bEdgA?\/([0-9]+(?:\.[0-9]+)*)/i.exec(userAgent);
    if (edge) {
        return createDetection(
            BrowserId.Edge,
            'Edge',
            BrowserFamily.Chromium,
            edge[1],
            'blink',
        );
    }

    const firefoxIOS = /\bFxiOS\/([0-9]+(?:\.[0-9]+)*)/i.exec(userAgent);
    if (firefoxIOS) {
        return createDetection(
            BrowserId.Firefox,
            'Firefox',
            BrowserFamily.Firefox,
            firefoxIOS[1],
            'webkit',
        );
    }

    const firefox = /\bFirefox\/([0-9]+(?:\.[0-9]+)*)/i.exec(userAgent);
    if (firefox) {
        return createDetection(
            BrowserId.Firefox,
            'Firefox',
            BrowserFamily.Firefox,
            firefox[1],
            'gecko',
        );
    }

    const chromeIOS = /\bCriOS\/([0-9]+(?:\.[0-9]+)*)/i.exec(userAgent);
    if (chromeIOS && !CHROMIUM_DERIVATIVE_TOKEN.test(userAgent)) {
        return createDetection(
            BrowserId.Chrome,
            'Chrome',
            BrowserFamily.Chromium,
            chromeIOS[1],
            'webkit',
        );
    }

    const chrome = /\bChrome\/([0-9]+(?:\.[0-9]+)*)/i.exec(userAgent);
    if (chrome && !CHROMIUM_DERIVATIVE_TOKEN.test(userAgent)) {
        return createDetection(
            BrowserId.Chrome,
            'Chrome',
            BrowserFamily.Chromium,
            chrome[1],
            'blink',
        );
    }

    const safariVersion = /\bVersion\/([0-9]+(?:\.[0-9]+)*)/i.exec(userAgent);
    const hasSafariToken = /\bSafari\/[0-9.]+/i.test(userAgent);
    const hasCompetingBrowserToken =
        /\b(?:Chrome|CriOS|Edg|EdgA|EdgiOS|Firefox|FxiOS|OPR|OPT)\//i.test(userAgent);

    if (safariVersion && hasSafariToken && !hasCompetingBrowserToken) {
        return createDetection(
            BrowserId.Safari,
            'Safari',
            BrowserFamily.Safari,
            safariVersion[1],
            'webkit',
        );
    }

    return null;
}
