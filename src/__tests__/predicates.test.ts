import { is, isBot } from '../check';
import { parse } from '../parse';
import type { UAInfo } from '../types';

const chromeAndroid = parse(
  'Mozilla/5.0 (Linux; Android 16; Pixel 10 Pro) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',
);
const edgeWindows = parse(
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0',
);
const ipad = parse(
  'Mozilla/5.0 (iPad; CPU OS 18_7 like Mac OS X) AppleWebKit/605.1.15 ' +
  '(KHTML, like Gecko) Version/18.7 Mobile/15E148 Safari/604.1',
);
const lineWebView = parse(
  'Mozilla/5.0 (Linux; Android 16; Pixel 10 Pro; wv) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Version/4.0 Chrome/150.0.0.0 Mobile Safari/537.36 Line/26.11.0',
);
const googlebot = parse('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)');
const gptbot = parse('Mozilla/5.0 AppleWebKit/537.36 (compatible; GPTBot/1.2; +https://openai.com/gptbot)');
const chatgptUser = parse('Mozilla/5.0 AppleWebKit/537.36 (compatible; ChatGPT-User/1.0)');
const curl = parse('curl/8.7.1');

// Compile-time contract. A failing line here fails `npm run typecheck`.
function assertTypes(info: UAInfo): void {
  if (is(info, { browser: 'chrome' })) {
    const name: 'chrome' = info.browser.name;
    void name;
  }
  if (is(info, { browser: ['chrome', 'edge'], os: ['android', 'harmonyos'], device: 'mobile' })) {
    const browser: 'chrome' | 'edge' = info.browser.name;
    const os: 'android' | 'harmonyos' = info.os.name;
    const device: 'mobile' = info.device.type;
    void [browser, os, device];
  }
  if (is(info, { client: 'gptbot' })) {
    const name: 'gptbot' = info.client.name;
    void name;
  }
  if (is(info, { app: 'line', vendor: 'google' })) {
    const app: 'line' = info.context.app;
    const vendor: 'google' = info.device.vendor;
    void [app, vendor];
  }

  // @ts-expect-error a misspelled browser id does not compile
  is(info, { browser: 'chrom' });
  // @ts-expect-error an OS id is not a browser id
  is(info, { browser: 'android' });
  // @ts-expect-error vendor ids are lowercase
  is(info, { vendor: 'Samsung' });
  // @ts-expect-error unknown query keys do not compile
  is(info, { colour: 'red' });
}
void assertTypes;

describe('is', () => {
  it('matches every key of the query', () => {
    expect(is(chromeAndroid, { browser: 'chrome', os: 'android', device: 'mobile' })).toBe(true);
    expect(is(chromeAndroid, { browser: 'chrome', os: 'ios' })).toBe(false);
    expect(is(chromeAndroid, {})).toBe(true);
  });

  it('matches any value of an array', () => {
    expect(is(edgeWindows, { browser: ['chrome', 'edge'] })).toBe(true);
    expect(is(edgeWindows, { browser: ['chrome', 'firefox'] })).toBe(false);
  });

  it('never matches an unknown field', () => {
    const unknown = parse('CustomAgent/1.0');
    expect(is(unknown, { browser: 'chrome' })).toBe(false);
    expect(is(unknown, { os: ['android', 'ios'] })).toBe(false);
    expect(is(unknown, { vendor: 'samsung' })).toBe(false);
  });

  it('reads family, mode, engine, client type, context and app', () => {
    expect(is(chromeAndroid, { family: 'chromium', engine: 'blink', mode: 'browser' })).toBe(true);
    expect(is(lineWebView, { mode: 'webview', contextType: 'in-app-browser', context: 'line', app: 'line' })).toBe(true);
    expect(is(googlebot, { clientType: 'crawler', client: 'googlebot' })).toBe(true);
  });

  it('keeps a tablet distinct from mobile', () => {
    expect(is(ipad, { device: 'tablet', os: 'ipados', vendor: 'apple' })).toBe(true);
    expect(is(ipad, { device: 'mobile' })).toBe(false);
  });
});

describe('isBot', () => {
  it('is true for bot, crawler and ai-crawler', () => {
    expect(isBot(googlebot)).toBe(true);
    expect(isBot(gptbot)).toBe(true);
    expect(isBot(parse('Mozilla/5.0 (compatible; MJ12bot/v1.4.8)'))).toBe(true);
  });

  it('is false for assistants, HTTP clients and people', () => {
    expect(isBot(chatgptUser)).toBe(false);
    expect(isBot(curl)).toBe(false);
    expect(isBot(chromeAndroid)).toBe(false);
  });
});
