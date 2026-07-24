import type { ClientInfo, ClientKind } from '../types';
import { parseVersion } from '../version';

interface ClientPattern {
    readonly regex: RegExp;
    readonly kind: ClientKind;
    readonly id: string;
    readonly name: string;
}

const CLIENT_PATTERNS: readonly ClientPattern[] = [
    { regex: /\bGPTBot\/([0-9.]+)/i, kind: 'ai-agent', id: 'gptbot', name: 'GPTBot' },
    { regex: /\bClaudeBot(?:\/([0-9.]+))?/i, kind: 'ai-agent', id: 'claudebot', name: 'ClaudeBot' },
    { regex: /\bPerplexityBot(?:\/([0-9.]+))?/i, kind: 'ai-agent', id: 'perplexitybot', name: 'PerplexityBot' },
    { regex: /\bOAI-SearchBot(?:\/([0-9.]+))?/i, kind: 'crawler', id: 'oai-searchbot', name: 'OAI-SearchBot' },
    { regex: /\bOAI-AdsBot(?:\/([0-9.]+))?/i, kind: 'crawler', id: 'oai-adsbot', name: 'OAI-AdsBot' },
    { regex: /\bGooglebot-Image\/([0-9.]+)/i, kind: 'crawler', id: 'googlebot-image', name: 'Googlebot Image' },
    { regex: /\bGooglebot-Video\/([0-9.]+)/i, kind: 'crawler', id: 'googlebot-video', name: 'Googlebot Video' },
    { regex: /\bGooglebot\/([0-9.]+)/i, kind: 'crawler', id: 'googlebot', name: 'Googlebot' },
    { regex: /\bCCBot\/([0-9.]+)/i, kind: 'crawler', id: 'ccbot', name: 'CCBot' },
    { regex: /\bbingbot\/([0-9.]+)/i, kind: 'crawler', id: 'bingbot', name: 'Bingbot' },
    { regex: /\bAhrefsBot\/([0-9.]+)/i, kind: 'crawler', id: 'ahrefsbot', name: 'AhrefsBot' },
    { regex: /\bSemrushBot\/([0-9.]+)/i, kind: 'crawler', id: 'semrushbot', name: 'SemrushBot' },
    { regex: /\bApplebot\/([0-9.]+)/i, kind: 'crawler', id: 'applebot', name: 'Applebot' },
    { regex: /\bPlaywright\/([0-9.]+)/i, kind: 'automation', id: 'playwright', name: 'Playwright' },
    { regex: /\bPuppeteer\/([0-9.]+)/i, kind: 'automation', id: 'puppeteer', name: 'Puppeteer' },
    { regex: /\bSelenium(?:\/([0-9.]+))?/i, kind: 'automation', id: 'selenium', name: 'Selenium' },
    { regex: /\bcurl\/([0-9.]+)/i, kind: 'http-client', id: 'curl', name: 'curl' },
    { regex: /\bWget\/([0-9.]+)/i, kind: 'http-client', id: 'wget', name: 'Wget' },
    { regex: /\bPostmanRuntime\/([0-9.]+)/i, kind: 'http-client', id: 'postman', name: 'Postman' },
    { regex: /\bHTTPie\/([0-9.]+)/i, kind: 'http-client', id: 'httpie', name: 'HTTPie' },
    { regex: /\baxios\/([0-9.]+)/i, kind: 'library', id: 'axios', name: 'Axios' },
    { regex: /\bpython-requests\/([0-9.]+)/i, kind: 'library', id: 'python-requests', name: 'Python Requests' },
    { regex: /\bokhttp\/([0-9.]+)/i, kind: 'library', id: 'okhttp', name: 'OkHttp' },
    { regex: /\bThunderbird\/([0-9.]+)/i, kind: 'email-client', id: 'thunderbird', name: 'Thunderbird' },
    { regex: /\bVLC\/([0-9.]+)/i, kind: 'media-player', id: 'vlc', name: 'VLC' },
];

function genericBot(userAgent: string): ClientInfo | null {
    const match = /\b([a-z0-9._-]*(?:bot|spider|crawler))\b(?:[/ ]?([0-9.]+))?/i.exec(userAgent);
    if (!match?.[1]) return null;

    return {
        kind: 'bot',
        id: match[1].toLowerCase(),
        name: match[1],
        version: match[2] ? parseVersion(match[2]) : null,
    };
}

/** Selects the most specific non-browser client represented in the User-Agent. */
export function detectClient(userAgent: string): ClientInfo | null {
    for (const pattern of CLIENT_PATTERNS) {
        const match = pattern.regex.exec(userAgent);
        if (match) {
            return {
                kind: pattern.kind,
                id: pattern.id,
                name: pattern.name,
                version: match[1] ? parseVersion(match[1]) : null,
            };
        }
    }

    return genericBot(userAgent);
}
