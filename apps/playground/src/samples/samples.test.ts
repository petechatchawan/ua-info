import { describe, expect, it } from 'vitest';
import { findUserAgentSample, USER_AGENT_SAMPLES } from './index';

const requiredIds = [
  'chrome-windows', 'edge-windows', 'firefox-linux', 'safari-macos',
  'chrome-android', 'safari-iphone', 'android-webview', 'ios-wkwebview',
  'line-liff', 'line-in-app', 'facebook-in-app', 'instagram-in-app',
  'tiktok-in-app', 'headless-chrome', 'googlebot', 'oai-searchbot',
  'googlebot-image', 'google-extended-control-token', 'curl', 'unknown-client',
];

describe('sample corpus', () => {
  it('contains every required unique sample', () => {
    const ids = USER_AGENT_SAMPLES.map((sample) => sample.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(expect.arrayContaining(requiredIds));
  });

  it('includes complete LINE LIFF Client Hints', () => {
    const sample = findUserAgentSample('line-liff');
    expect(sample?.clientHints?.['sec-ch-ua-mobile']).toBe('?1');
    expect(sample?.clientHints?.['sec-ch-ua-platform']).toBe('"Android"');
    expect(sample?.clientHints?.['sec-ch-ua-platform-version']).toBeTruthy();
    expect(sample?.clientHints?.['sec-ch-ua-model']).toBeTruthy();
    expect(sample?.clientHints?.['sec-ch-ua']).toContain('Google Chrome');
  });
});
