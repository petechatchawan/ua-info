import { EngineId } from '../constants';
import type { EngineInfo } from '../types';
import { parseVersion } from '../version';
import type { BrowserEngineHint } from './browser';

function createEngine(id: string, name: string, versionRaw?: string): EngineInfo {
    return {
        id,
        name,
        version: versionRaw ? parseVersion(versionRaw) : null,
    };
}

function readWebKitVersion(userAgent: string): string | undefined {
    return /\bAppleWebKit\/([0-9]+(?:\.[0-9]+)*)/i.exec(userAgent)?.[1];
}

function readGeckoVersion(userAgent: string): string | undefined {
    return /\brv:([0-9]+(?:\.[0-9]+)*)/i.exec(userAgent)?.[1];
}

export function detectEngine(
    userAgent: string,
    browserHint: BrowserEngineHint | null,
): EngineInfo | null {
    if (browserHint === 'blink') return createEngine(EngineId.Blink, 'Blink');
    if (browserHint === 'gecko') return createEngine(EngineId.Gecko, 'Gecko', readGeckoVersion(userAgent));
    if (browserHint === 'webkit') return createEngine(EngineId.WebKit, 'WebKit', readWebKitVersion(userAgent));
    if (browserHint === 'trident') {
        const version = /\bTrident\/([0-9.]+)/i.exec(userAgent)?.[1];
        return createEngine(EngineId.Trident, 'Trident', version);
    }

    const webKitVersion = readWebKitVersion(userAgent);
    if (webKitVersion) {
        const hasChromiumToken = /\b(?:Chrome|Chromium|Edg|OPR|SamsungBrowser)\//i.test(userAgent);
        const isIOS = /\b(?:CPU (?:iPhone )?OS|iPad|iPhone|iPod)\b/i.test(userAgent);
        return hasChromiumToken && !isIOS
            ? createEngine(EngineId.Blink, 'Blink')
            : createEngine(EngineId.WebKit, 'WebKit', webKitVersion);
    }

    const geckoVersion = readGeckoVersion(userAgent);
    if (geckoVersion && /\bGecko\/[0-9]+/i.test(userAgent)) {
        return createEngine(EngineId.Gecko, 'Gecko', geckoVersion);
    }

    return null;
}
