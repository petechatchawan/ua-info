import { BrowserId } from '../constants';
import type { BrowserFamily, BrowserInfo, BrowserMode } from '../types';
import { parseVersion } from '../version';

export type BrowserEngineHint = 'blink' | 'gecko' | 'webkit';

export interface BrowserDetection {
  readonly browser: BrowserInfo;
  readonly engineHint: BrowserEngineHint;
}

interface BrowserPattern {
  readonly regex: RegExp;
  readonly name: BrowserInfo['name'];
  readonly family: BrowserFamily | null;
  readonly engineHint: BrowserEngineHint;
  readonly mode?: BrowserMode;
}

const DERIVATIVE_PATTERNS: readonly BrowserPattern[] = [
  {
    regex: /\bEdgiOS\/([0-9]+(?:\.[0-9]+)*)/i,
    name: BrowserId.Edge,
    family: 'chromium',
    engineHint: 'webkit',
  },
  {
    regex: /\bEdgA?\/([0-9]+(?:\.[0-9]+)*)/i,
    name: BrowserId.Edge,
    family: 'chromium',
    engineHint: 'blink',
  },
  {
    regex: /\b(?:OPiOS|OPT)\/([0-9]+(?:\.[0-9]+)*)/i,
    name: BrowserId.Opera,
    family: 'chromium',
    engineHint: 'webkit',
  },
  {
    regex: /\b(?:OPR|Opera Mini)\/([0-9]+(?:\.[0-9]+)*)/i,
    name: BrowserId.Opera,
    family: 'chromium',
    engineHint: 'blink',
  },
  {
    regex: /\bSamsungBrowser\/([0-9]+(?:\.[0-9]+)*)/i,
    name: BrowserId.SamsungInternet,
    family: 'chromium',
    engineHint: 'blink',
  },
  {
    regex: /\bVivaldi\/([0-9]+(?:\.[0-9]+)*)/i,
    name: BrowserId.Vivaldi,
    family: 'chromium',
    engineHint: 'blink',
  },
  {
    regex: /\bYaBrowser\/([0-9]+(?:\.[0-9]+)*)/i,
    name: BrowserId.YandexBrowser,
    family: 'chromium',
    engineHint: 'blink',
  },
  {
    regex: /\bUCBrowser\/([0-9]+(?:\.[0-9]+)*)/i,
    name: BrowserId.UCBrowser,
    family: 'chromium',
    engineHint: 'blink',
  },
  {
    regex: /\bHuaweiBrowser\/([0-9]+(?:\.[0-9]+)*)/i,
    name: BrowserId.HuaweiBrowser,
    family: 'chromium',
    engineHint: 'blink',
  },
  {
    regex: /\b(?:XiaoMi\/MiuiBrowser|MiuiBrowser)\/([0-9]+(?:\.[0-9]+)*)/i,
    name: BrowserId.MiBrowser,
    family: 'chromium',
    engineHint: 'blink',
  },
  {
    regex: /\bArc\/([0-9]+(?:\.[0-9]+)*)/i,
    name: BrowserId.Arc,
    family: 'chromium',
    engineHint: 'blink',
  },
  {
    regex: /\bBrave(?: Chrome)?\/([0-9]+(?:\.[0-9]+)*)/i,
    name: BrowserId.Brave,
    family: 'chromium',
    engineHint: 'blink',
  },
];

function createDetection(
  name: BrowserInfo['name'],
  versionRaw: string | null,
  family: BrowserFamily | null,
  engineHint: BrowserEngineHint,
  mode: BrowserMode = 'browser',
): BrowserDetection {
  return {
    browser: {
      name,
      version: versionRaw ? parseVersion(versionRaw) : null,
      family,
      mode,
    },
    engineHint,
  };
}

function findDerivative(userAgent: string): BrowserDetection | null {
  for (const pattern of DERIVATIVE_PATTERNS) {
    const match = pattern.regex.exec(userAgent);
    if (match?.[1]) {
      return createDetection(
        pattern.name,
        match[1],
        pattern.family,
        pattern.engineHint,
        pattern.mode,
      );
    }
  }
  return null;
}

function isAndroidWebView(userAgent: string): boolean {
  return /(?:;\s*wv\)|\bVersion\/4\.0\b.*\bChrome\/)/i.test(userAgent);
}

export function detectBrowser(userAgent: string): BrowserDetection | null {
  const headless = /\bHeadlessChrome\/([0-9]+(?:\.[0-9]+)*)/i.exec(userAgent);
  if (headless?.[1]) {
    return createDetection(BrowserId.Chrome, headless[1], 'chromium', 'blink', 'headless');
  }

  const derivative = findDerivative(userAgent);
  if (derivative) return derivative;

  if (/\bBrave\b/i.test(userAgent) && /\b(?:iPhone|iPad|iPod)\b/i.test(userAgent)) {
    return createDetection(BrowserId.Brave, null, null, 'webkit');
  }

  const firefoxIOS = /\bFxiOS\/([0-9]+(?:\.[0-9]+)*)/i.exec(userAgent);
  if (firefoxIOS?.[1]) {
    return createDetection(BrowserId.Firefox, firefoxIOS[1], 'firefox', 'webkit');
  }

  const firefox = /\bFirefox\/([0-9]+(?:\.[0-9]+)*)/i.exec(userAgent);
  if (firefox?.[1]) {
    return createDetection(BrowserId.Firefox, firefox[1], 'firefox', 'gecko');
  }

  const chromeIOS = /\bCriOS\/([0-9]+(?:\.[0-9]+)*)/i.exec(userAgent);
  if (chromeIOS?.[1]) {
    return createDetection(BrowserId.Chrome, chromeIOS[1], 'chromium', 'webkit');
  }

  const chromium = /\bChromium\/([0-9]+(?:\.[0-9]+)*)/i.exec(userAgent);
  if (chromium?.[1]) {
    return createDetection(
      BrowserId.Chromium,
      chromium[1],
      'chromium',
      'blink',
      isAndroidWebView(userAgent) ? 'webview' : 'browser',
    );
  }

  const chrome = /\bChrome\/([0-9]+(?:\.[0-9]+)*)/i.exec(userAgent);
  if (chrome?.[1]) {
    return createDetection(
      BrowserId.Chrome,
      chrome[1],
      'chromium',
      'blink',
      isAndroidWebView(userAgent) ? 'webview' : 'browser',
    );
  }

  const safariVersion = /\bVersion\/([0-9]+(?:\.[0-9]+)*)/i.exec(userAgent);
  if (safariVersion?.[1] && /\bSafari\/[0-9.]+/i.test(userAgent)) {
    return createDetection(BrowserId.Safari, safariVersion[1], 'safari', 'webkit');
  }

  return null;
}
