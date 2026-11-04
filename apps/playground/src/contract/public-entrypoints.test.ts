import { describe, expect, it } from 'vitest';
import { parse } from 'ua-inspect';
import { is } from 'ua-inspect/check';
import { labels } from 'ua-inspect/labels';
import { detect } from 'ua-inspect/browser';
import { parseRequest } from 'ua-inspect/server';

const chromeUA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';

describe('packed ua-inspect browser consumer contract', () => {
  it('resolves root, check, browser, and server entry points', () => {
    const parsed = parse(chromeUA);
    const enriched = parseRequest({
      userAgent: chromeUA,
      headers: {
        'sec-ch-ua': '"Google Chrome";v="151"',
        'sec-ch-ua-platform': '"Android"',
        'sec-ch-ua-mobile': '?1',
      },
    });

    expect(parsed.browser.name).toBe('chrome');
    expect(is(parsed, { browser: 'chrome' })).toBe(true);
    expect(labels.browser.chrome).toBe('Google Chrome');
    expect(enriched.browser.version?.major).toBe(151);
    expect(enriched.device.type).toBe('mobile');
    expect(typeof detect).toBe('function');
  });
});
