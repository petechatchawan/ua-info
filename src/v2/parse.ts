import type { UAResult } from './types';
import { detectBrowser } from './parser/browser';
import { detectEngine } from './parser/engine';

/**
 * Parses a User-Agent string without reading browser globals or runtime state.
 * Platform, device, CPU, client, and context detection are added in later v2
 * phases; until then those dimensions return their canonical unknown values.
 */
export function parse(userAgent: string): UAResult {
    const browserDetection = detectBrowser(userAgent);

    return {
        ua: userAgent,
        browser: browserDetection?.browser ?? null,
        engine: detectEngine(userAgent, browserDetection?.engineHint ?? null),
        os: null,
        device: {
            type: 'unknown',
            vendor: null,
            model: null,
        },
        cpu: null,
        client: null,
        context: null,
    };
}
