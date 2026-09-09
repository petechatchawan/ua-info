import { parse } from '../parse';

describe('parse', () => {
  it('returns fixed-shape unknown data for an empty UA', () => {
    expect(parse('')).toEqual({
      ua: '',
      browser: { name: null, version: null, family: null, mode: null },
      engine: { name: null, version: null },
      os: { name: null, version: null },
      device: { type: null, vendor: null, model: null },
      cpu: { architecture: null, bitness: null },
      client: { type: null, name: null, version: null },
      context: { type: null, name: null, host: null },
    });
  });

  it('parses Android Chrome into fixed dimensions', () => {
    const result = parse(
      'Mozilla/5.0 (Linux; Android 16; Pixel 10 Pro) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36 arm64',
    );
    expect(result.browser).toMatchObject({ name: 'chrome', family: 'chromium', mode: 'browser' });
    expect(result.os).toMatchObject({ name: 'android', version: { full: '16', major: 16 } });
    expect(result.device).toMatchObject({ type: 'mobile', vendor: 'Google', model: 'Pixel 10 Pro' });
    expect(result.cpu).toEqual({ architecture: 'arm64', bitness: 64 });
  });

  it('keeps LINE in-app distinct from LIFF during pure parsing', () => {
    const ua =
      'Mozilla/5.0 (Linux; Android 16; Pixel 10 Pro; wv) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Version/4.0 Chrome/150.0.0.0 Mobile Safari/537.36 Line/26.11.0 LIFF';
    const result = parse(ua);
    expect(result.context).toMatchObject({
      type: 'in-app-browser',
      name: 'line',
      host: { name: 'line' },
    });
    expect(result.context.name).not.toBe('liff');
    expect(result.browser.mode).toBe('webview');
  });

  it('preserves explicit WebKit engine evidence without a browser product', () => {
    const ua =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 ' +
      '(KHTML, like Gecko) Mobile/15E148 Line/26.11.0';
    const result = parse(ua);
    expect(result.browser.name).toBeNull();
    expect(result.engine).toEqual({
      name: 'webkit',
      version: { full: '605.1.15', major: 605 },
    });
  });

  it('preserves standalone Gecko engine evidence for non-browser clients', () => {
    const result = parse(
      'Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Thunderbird/140.0',
    );
    expect(result.client).toMatchObject({ type: 'email-client', name: 'thunderbird' });
    expect(result.browser.name).toBeNull();
    expect(result.engine).toEqual({
      name: 'gecko',
      version: { full: '140.0', major: 140 },
    });
  });

  it('does not create a generic embedded application context', () => {
    expect(parse('Mozilla/5.0 Electron/39.0.0').context).toEqual({
      type: null,
      name: null,
      host: null,
    });
  });

  it('distinguishes iPadOS and tablet from iOS mobile', () => {
    const result = parse(
      'Mozilla/5.0 (iPad; CPU OS 18_7 like Mac OS X) AppleWebKit/605.1.15 ' +
      '(KHTML, like Gecko) Version/18.7 Mobile/15E148 Safari/604.1',
    );
    expect(result.os.name).toBe('ipados');
    expect(result.device.type).toBe('tablet');
  });

  it.each([
    ['Googlebot/2.1 (+http://www.google.com/bot.html)', 'crawler', 'googlebot'],
    ['OAI-SearchBot/1.0', 'crawler', 'oai-searchbot'],
    ['GPTBot/1.2', 'ai-crawler', 'gptbot'],
    ['ClaudeBot/1.0', 'ai-crawler', 'claudebot'],
    ['PerplexityBot/1.0', 'ai-crawler', 'perplexitybot'],
    ['Playwright/1.57.0', 'automation', 'playwright'],
    ['curl/8.7.1', 'http-client', 'curl'],
    ['axios/1.8.0', 'library', 'axios'],
    ['Thunderbird/128.0', 'email-client', 'thunderbird'],
    ['VLC/3.0.21', 'media-player', 'vlc'],
  ] as const)('classifies %s as %s', (ua, type, name) => {
    expect(parse(ua).client).toMatchObject({ type, name });
  });
});
