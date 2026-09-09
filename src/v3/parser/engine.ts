import { EngineId } from '../constants';
import type { EngineInfo } from '../types';
import { parseVersion } from '../version';
import type { BrowserEngineHint } from './browser';

function readVersion(userAgent: string, regex: RegExp) {
  const raw = regex.exec(userAgent)?.[1] ?? null;
  return raw ? parseVersion(raw) : null;
}

export function detectEngine(
  userAgent: string,
  engineHint: BrowserEngineHint | null,
): EngineInfo {
  if (engineHint === 'blink') {
    return { name: EngineId.Blink, version: null };
  }
  if (engineHint === 'gecko') {
    return { name: EngineId.Gecko, version: readVersion(userAgent, /\brv:([0-9]+(?:\.[0-9]+)*)/i) };
  }
  if (engineHint === 'webkit') {
    return {
      name: EngineId.WebKit,
      version: readVersion(userAgent, /\bAppleWebKit\/([0-9]+(?:\.[0-9]+)*)/i),
    };
  }
  const webKitVersion = readVersion(userAgent, /\bAppleWebKit\/([0-9]+(?:\.[0-9]+)*)/i);
  if (webKitVersion) return { name: EngineId.WebKit, version: webKitVersion };
  return { name: null, version: null };
}
