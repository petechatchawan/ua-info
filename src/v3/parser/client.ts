import type { ClientInfo, ClientType } from '../types';
import { parseVersion } from '../version';

interface ClientPattern {
  readonly regex: RegExp;
  readonly type: ClientType;
  readonly name: string;
}

const CLIENT_PATTERNS: readonly ClientPattern[] = [
  { regex: /\bGPTBot\/([0-9.]+)/i, type: 'ai-crawler', name: 'gptbot' },
  { regex: /\bClaudeBot(?:\/([0-9.]+))?/i, type: 'ai-crawler', name: 'claudebot' },
  { regex: /\bPerplexityBot(?:\/([0-9.]+))?/i, type: 'ai-crawler', name: 'perplexitybot' },
  { regex: /\b(?:ChatGPT-User|Claude-User|Perplexity-User)(?:\/([0-9.]+))?/i, type: 'ai-assistant', name: 'ai-assistant' },
  { regex: /\bOAI-SearchBot(?:\/([0-9.]+))?/i, type: 'crawler', name: 'oai-searchbot' },
  { regex: /\bOAI-AdsBot(?:\/([0-9.]+))?/i, type: 'crawler', name: 'oai-adsbot' },
  { regex: /\bGooglebot-Image\/([0-9.]+)/i, type: 'crawler', name: 'googlebot-image' },
  { regex: /\bGooglebot-Video\/([0-9.]+)/i, type: 'crawler', name: 'googlebot-video' },
  { regex: /\bGooglebot\/([0-9.]+)/i, type: 'crawler', name: 'googlebot' },
  { regex: /\bCCBot\/([0-9.]+)/i, type: 'crawler', name: 'ccbot' },
  { regex: /\bbingbot\/([0-9.]+)/i, type: 'crawler', name: 'bingbot' },
  { regex: /\bAhrefsBot\/([0-9.]+)/i, type: 'crawler', name: 'ahrefsbot' },
  { regex: /\bSemrushBot\/([0-9.]+)/i, type: 'crawler', name: 'semrushbot' },
  { regex: /\bApplebot\/([0-9.]+)/i, type: 'crawler', name: 'applebot' },
  { regex: /\bPlaywright\/([0-9.]+)/i, type: 'automation', name: 'playwright' },
  { regex: /\bPuppeteer\/([0-9.]+)/i, type: 'automation', name: 'puppeteer' },
  { regex: /\bSelenium(?:\/([0-9.]+))?/i, type: 'automation', name: 'selenium' },
  { regex: /\bcurl\/([0-9.]+)/i, type: 'http-client', name: 'curl' },
  { regex: /\bWget\/([0-9.]+)/i, type: 'http-client', name: 'wget' },
  { regex: /\bPostmanRuntime\/([0-9.]+)/i, type: 'http-client', name: 'postman' },
  { regex: /\bHTTPie\/([0-9.]+)/i, type: 'http-client', name: 'httpie' },
  { regex: /\baxios\/([0-9.]+)/i, type: 'library', name: 'axios' },
  { regex: /\bpython-requests\/([0-9.]+)/i, type: 'library', name: 'python-requests' },
  { regex: /\bokhttp\/([0-9.]+)/i, type: 'library', name: 'okhttp' },
  { regex: /\bThunderbird\/([0-9.]+)/i, type: 'email-client', name: 'thunderbird' },
  { regex: /\bVLC\/([0-9.]+)/i, type: 'media-player', name: 'vlc' },
];

function emptyClient(): ClientInfo {
  return { type: null, name: null, version: null };
}

export function detectClient(userAgent: string): ClientInfo {
  for (const pattern of CLIENT_PATTERNS) {
    const match = pattern.regex.exec(userAgent);
    if (match) {
      return {
        type: pattern.type,
        name: pattern.name,
        version: match[1] ? parseVersion(match[1]) : null,
      };
    }
  }

  // A token may start only after a non-token character, so each token run is scanned once (linear time).
  const generic = /(?:^|[^a-z0-9._-])([a-z0-9._-]*(?:bot|spider|crawler))\b(?:[/ ]?([0-9.]+))?/i.exec(userAgent);
  if (generic?.[1]) {
    return {
      type: 'bot',
      name: generic[1].toLowerCase(),
      version: generic[2] ? parseVersion(generic[2]) : null,
    };
  }
  return emptyClient();
}
