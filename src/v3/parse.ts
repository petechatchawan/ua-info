import type { UAInfo } from './types';
import { createEmptyUAInfo } from './result';
import { detectBrowser } from './parser/browser';
import { detectClient } from './parser/client';
import { detectContext } from './parser/context';
import { detectCPU } from './parser/cpu';
import { detectDevice } from './parser/device';
import { detectEngine } from './parser/engine';
import { detectOS } from './parser/os';

/** Detection reads at most this many characters; `UAInfo.ua` still echoes the full input. */
const MAX_UA_LENGTH = 1024;

export function parse(userAgent: string): UAInfo {
  const ua = typeof userAgent === 'string' ? userAgent : '';
  const text = ua.length > MAX_UA_LENGTH ? ua.slice(0, MAX_UA_LENGTH) : ua;
  const browserDetection = detectBrowser(text);
  const context = detectContext(text);
  const empty = createEmptyUAInfo(ua);
  const browser = browserDetection?.browser ?? empty.browser;
  const mode = context.type === 'in-app-browser' || context.type === 'mini-app'
    ? browser.mode === 'headless' ? 'headless' : 'webview'
    : browser.mode;

  return {
    ua,
    browser: { ...browser, mode },
    engine: detectEngine(text, browserDetection?.engineHint ?? null),
    os: detectOS(text),
    device: detectDevice(text),
    cpu: detectCPU(text),
    client: detectClient(text),
    context,
  };
}
