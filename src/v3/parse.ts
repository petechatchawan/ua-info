import type { UAInfo } from './types';
import { createEmptyUAInfo } from './result';
import { detectBrowser } from './parser/browser';
import { detectClient } from './parser/client';
import { detectContext } from './parser/context';
import { detectCPU } from './parser/cpu';
import { detectDevice } from './parser/device';
import { detectEngine } from './parser/engine';
import { detectOS } from './parser/os';

export function parse(userAgent: string): UAInfo {
  const browserDetection = detectBrowser(userAgent);
  const context = detectContext(userAgent);
  const empty = createEmptyUAInfo(userAgent);
  const browser = browserDetection?.browser ?? empty.browser;
  const mode = context.type === 'in-app-browser' || context.type === 'mini-app'
    ? browser.mode === 'headless' ? 'headless' : 'webview'
    : browser.mode;

  return {
    ua: userAgent,
    browser: { ...browser, mode },
    engine: detectEngine(userAgent, browserDetection?.engineHint ?? null),
    os: detectOS(userAgent),
    device: detectDevice(userAgent),
    cpu: detectCPU(userAgent),
    client: detectClient(userAgent),
    context,
  };
}
