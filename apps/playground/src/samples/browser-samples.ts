import type { UserAgentSample } from './sample-types';

export const BROWSER_SAMPLES: readonly UserAgentSample[] = Object.freeze([
  {
    id: 'chrome-windows',
    label: 'Chrome on Windows',
    category: 'Desktop browsers',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
  },
  {
    id: 'edge-windows',
    label: 'Microsoft Edge on Windows',
    category: 'Desktop browsers',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0',
  },
  {
    id: 'firefox-linux',
    label: 'Firefox on Linux',
    category: 'Desktop browsers',
    userAgent:
      'Mozilla/5.0 (X11; Linux x86_64; rv:151.0) Gecko/20100101 Firefox/151.0',
  },
  {
    id: 'safari-macos',
    label: 'Safari on macOS',
    category: 'Desktop browsers',
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 15_6) AppleWebKit/605.1.15 ' +
      '(KHTML, like Gecko) Version/19.0 Safari/605.1.15',
  },
  {
    id: 'chrome-android',
    label: 'Chrome on Android',
    category: 'Mobile browsers',
    userAgent:
      'Mozilla/5.0 (Linux; Android 16; Pixel 10 Pro) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/150.0.7871.46 Mobile Safari/537.36',
  },
  {
    id: 'safari-iphone',
    label: 'Safari on iPhone',
    category: 'Mobile browsers',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 ' +
      '(KHTML, like Gecko) Version/19.0 Mobile/15E148 Safari/604.1',
  },
]);
