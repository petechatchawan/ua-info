import { describe, expect, it } from 'vitest';
import { BrowserId, parse } from 'ua-info';
import { detectCurrent } from 'ua-info/browser';
import { parseRequest } from 'ua-info/server';

const chromeUA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';

describe('packed ua-info browser consumer contract', () => {
  it('resolves root, browser, and server entry points', () => {
    const parsed = parse(chromeUA);
    const enriched = parseRequest({
      userAgent: chromeUA,
      headers: {
        'sec-ch-ua': '"Google Chrome";v="151"',
        'sec-ch-ua-platform': '"Android"',
        'sec-ch-ua-mobile': '?1',
      },
    });

    expect(parsed.browser?.id).toBe(BrowserId.Chrome);
    expect(enriched.browser?.version?.major).toBe(151);
    expect(enriched.device.type).toBe('mobile');
    expect(typeof detectCurrent).toBe('function');
  });
});
