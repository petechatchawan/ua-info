import type { UserAgentSample } from './sample-types';

export const WEBVIEW_SAMPLES: readonly UserAgentSample[] = Object.freeze([
  {
    id: 'android-webview',
    label: 'Android WebView',
    category: 'WebViews',
    userAgent:
      'Mozilla/5.0 (Linux; Android 16; Pixel 10 Build/BP2A.260705.008; wv) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/150.0.7871.46 ' +
      'Mobile Safari/537.36',
  },
  {
    id: 'ios-wkwebview',
    label: 'iOS WKWebView',
    category: 'WebViews',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 ' +
      '(KHTML, like Gecko) Mobile/15E148',
  },
]);
