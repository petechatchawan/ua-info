import type { UAInfo } from '../services/ua-detection-service';

function version(full: string) {
  const parts = full.split('.').map((part) => Number.parseInt(part, 10));
  return { full, major: parts[0] ?? 0, minor: parts[1] ?? null, patch: parts[2] ?? null };
}

export const chromeResult: UAInfo = {
  ua: 'Mozilla/5.0 Chrome/150.0.0.0 Safari/537.36',
  browser: {
    name: 'chrome',
    family: 'chromium',
    mode: 'browser',
    version: version('150.0.0.0'),
  },
  engine: { name: 'blink', version: null },
  os: { name: 'windows', version: version('10.0') },
  device: { type: 'desktop', vendor: null, model: null },
  cpu: { architecture: 'x86_64', bitness: 64 },
  client: { type: null, name: null, token: null, version: null },
  context: { type: null, name: null, app: null, version: null },
};

export const lineLiffResult: UAInfo = {
  ua: 'Mozilla/5.0 Android Line/26.11.0 LIFF',
  browser: {
    name: 'chrome',
    family: 'chromium',
    mode: 'webview',
    version: version('150.0.7871.46'),
  },
  engine: { name: 'blink', version: null },
  os: { name: 'android', version: version('16.0.0') },
  device: { type: 'mobile', vendor: 'google', model: 'Pixel 10 Pro' },
  cpu: { architecture: 'arm64', bitness: 64 },
  client: { type: null, name: null, token: null, version: null },
  context: {
    type: 'mini-app',
    name: 'liff',
    app: 'line',
    version: version('26.11.0'),
  },
};
