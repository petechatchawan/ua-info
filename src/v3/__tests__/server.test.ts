import { parseRequest } from '../server';

const chromeUA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';

describe('parseRequest', () => {
  it('accepts a plain header record directly', () => {
    const result = parseRequest({
      'user-agent': chromeUA,
      'sec-ch-ua': '"Chromium";v="150", "Google Chrome";v="150"',
    });
    expect(result.browser.name).toBe('chrome');
  });

  it('accepts a Request-like object without DOM Request typing', () => {
    const headers = new Map<string, string>([
      ['user-agent', chromeUA],
      ['sec-ch-ua-platform', '"Windows"'],
    ]);
    const result = parseRequest({
      headers: { get: (name: string) => headers.get(name.toLowerCase()) ?? null },
    });
    expect(result.os.name).toBe('windows');
  });

  it('does not confuse a literal headers header with RequestLikeInput', () => {
    const result = parseRequest({ headers: 'example', 'user-agent': chromeUA });
    expect(result.browser.name).toBe('chrome');
  });

  it('uses full-version-list in preference to significant versions', () => {
    const result = parseRequest({
      'user-agent': chromeUA,
      'sec-ch-ua': '"Chromium";v="150", "Google Chrome";v="150"',
      'sec-ch-ua-full-version-list':
        '"Chromium";v="150.0.7339.80", "Google Chrome";v="150.0.7339.80"',
    });
    expect(result.browser.version).toEqual({ full: '150.0.7339.80', major: 150 });
  });

  it('falls back to significant versions when the full-version list is malformed', () => {
    const result = parseRequest({
      'user-agent': chromeUA,
      'sec-ch-ua': '"Chromium";v="150", "Google Chrome";v="150"',
      'sec-ch-ua-full-version-list': '"Google Chrome";v="oops"',
    });
    expect(result.browser.name).toBe('chrome');
    expect(result.browser.version).toEqual({ full: '150', major: 150 });
  });

  it('decodes every supported request hint', () => {
    const result = parseRequest({
      'user-agent': 'Mozilla/5.0 AppleWebKit/537.36 Chrome/150.0.0.0 Safari/537.36',
      'sec-ch-ua': '"Google Chrome";v="150", "Chromium";v="150"',
      'sec-ch-ua-mobile': '?1',
      'sec-ch-ua-platform': '"Android"',
      'sec-ch-ua-platform-version': '"16.0.0"',
      'sec-ch-ua-arch': '"arm64"',
      'sec-ch-ua-bitness': '"64"',
      'sec-ch-ua-model': '"Pixel 10 Pro"',
    });
    expect(result.os).toEqual({ name: 'android', version: { full: '16.0.0', major: 16 } });
    expect(result.device).toMatchObject({ type: 'mobile', model: 'Pixel 10 Pro' });
    expect(result.cpu).toEqual({ architecture: 'arm64', bitness: 64 });
  });

  it('preserves valid brand siblings when others are malformed', () => {
    const result = parseRequest({
      'user-agent': chromeUA,
      'sec-ch-ua': 'broken, "Google Chrome";v="151", malformed',
    });
    expect(result.browser.version?.major).toBe(151);
  });

  it('filters GREASE brands without losing real products', () => {
    const result = parseRequest({
      'user-agent': chromeUA,
      'sec-ch-ua': '"Not_A Brand";v="99", "Brave";v="150", "Chromium";v="150"',
    });
    expect(result.browser.name).toBe('brave');
  });
});
