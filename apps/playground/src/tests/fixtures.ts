import type { UAResult } from '../services/ua-detection-service';

function version(raw: string) {
  const [major, minor] = raw.split('.').map(Number);
  return { raw, major: major ?? null, minor: minor ?? null };
}

export const chromeResult: UAResult = {
  ua: 'Mozilla/5.0 Chrome/150.0.0.0 Safari/537.36',
  browser: {
    id: 'chrome',
    name: 'Chrome',
    family: 'chromium',
    mode: 'browser',
    version: version('150.0.0.0'),
  },
  engine: { id: 'blink', name: 'Blink', version: null },
  os: { id: 'windows', name: 'Windows', version: version('10.0') },
  device: { type: 'desktop', vendor: null, model: null },
  cpu: { architecture: 'x86_64', bitness: 64 },
  client: null,
  context: null,
};

export const lineLiffResult: UAResult = {
  ua: 'Mozilla/5.0 Android Line/26.11.0 LIFF',
  browser: {
    id: 'chrome',
    name: 'Chrome',
    family: 'chromium',
    mode: 'webview',
    version: version('150.0.7871.46'),
  },
  engine: { id: 'blink', name: 'Blink', version: null },
  os: { id: 'android', name: 'Android', version: version('16.0.0') },
  device: { type: 'mobile', vendor: 'Google', model: 'Pixel 10 Pro' },
  cpu: { architecture: 'arm64', bitness: 64 },
  client: null,
  context: {
    kind: 'mini-app',
    id: 'liff',
    name: 'LIFF',
    host: { id: 'line', name: 'LINE', version: version('26.11.0') },
  },
};
