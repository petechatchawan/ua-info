import type { UserAgentSample } from './sample-types';

const lineClientHints = Object.freeze({
  'sec-ch-ua': '"Chromium";v="150", "Google Chrome";v="150", "Not_A Brand";v="99"',
  'sec-ch-ua-mobile': '?1',
  'sec-ch-ua-platform': '"Android"',
  'sec-ch-ua-platform-version': '"16.0.0"',
  'sec-ch-ua-model': '"Pixel 10 Pro"',
});

export const APPLICATION_SAMPLES: readonly UserAgentSample[] = Object.freeze([
  {
    id: 'line-liff',
    label: 'LINE LIFF on Android',
    category: 'Applications and mini-apps',
    userAgent:
      'Mozilla/5.0 (Linux; Android 16; Pixel 10 Pro Build/BP2A.260705.008; wv) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/150.0.7871.46 ' +
      'Mobile Safari/537.36 Line/26.11.0 LIFF',
    clientHints: lineClientHints,
  },
  {
    id: 'line-in-app',
    label: 'LINE in-app browser',
    category: 'Applications and mini-apps',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 ' +
      '(KHTML, like Gecko) Mobile/15E148 Line/26.11.0',
  },
  {
    id: 'facebook-in-app',
    label: 'Facebook in-app browser',
    category: 'Applications and mini-apps',
    userAgent:
      'Mozilla/5.0 (Linux; Android 16; Pixel 10 Pro) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Version/4.0 Chrome/150.0.0.0 Mobile Safari/537.36 ' +
      '[FBAN/FB4A;FBAV/520.0.0.0.0;]',
  },
  {
    id: 'instagram-in-app',
    label: 'Instagram in-app browser',
    category: 'Applications and mini-apps',
    userAgent:
      'Mozilla/5.0 (Linux; Android 16; Pixel 10 Pro) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36 Instagram 401.0.0.0.0 Android',
  },
  {
    id: 'tiktok-in-app',
    label: 'TikTok in-app browser',
    category: 'Applications and mini-apps',
    userAgent:
      'Mozilla/5.0 (Linux; Android 16; Pixel 10 Pro) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36 musical_ly_2026000000',
  },
]);
