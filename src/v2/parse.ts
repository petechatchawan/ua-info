import type { BrowserInfo, BrowserMode, UAResult } from './types';
import { detectBrowser } from './parser/browser';
import { detectClient } from './parser/client';
import { detectContext } from './parser/context';
import { detectCPU } from './parser/cpu';
import { detectDevice } from './parser/device';
import { detectEngine } from './parser/engine';
import { detectOS } from './parser/os';

function applyContextMode(browser: BrowserInfo | null, mode: BrowserMode | null): BrowserInfo | null {
    if (!browser || !mode || browser.mode === 'headless') return browser;
    return { ...browser, mode };
}

/** Parses only the supplied User-Agent string and never reads runtime globals. */
export function parse(userAgent: string): UAResult {
    const browserDetection = detectBrowser(userAgent);
    const context = detectContext(userAgent);
    const contextMode: BrowserMode | null = context
        ? context.kind === 'embedded'
            ? 'embedded'
            : context.kind === 'in-app-browser' || context.kind === 'mini-app'
              ? 'webview'
              : null
        : null;

    return {
        ua: userAgent,
        browser: applyContextMode(browserDetection?.browser ?? null, contextMode),
        engine: detectEngine(userAgent, browserDetection?.engineHint ?? null),
        os: detectOS(userAgent),
        device: detectDevice(userAgent),
        cpu: detectCPU(userAgent),
        client: detectClient(userAgent),
        context,
    };
}
