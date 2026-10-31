import { decodeClientHints, isValidBrandVersion, parseBrandList } from '../client-hints';
import { parse } from '../parse';

describe('client', () => {
  it.each([
    ['Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', 'crawler', 'googlebot', '2.1'],
    ['Googlebot-Image/1.0', 'crawler', 'googlebot-image', '1.0'],
    ['Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot', 'ai-crawler', 'gptbot', '1.2'],
    ['Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)', 'ai-crawler', 'claudebot', '1.0'],
    ['Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot', 'ai-assistant', 'chatgpt-user', '1.0'],
    ['Mozilla/5.0 (compatible; Claude-User/1.0)', 'ai-assistant', 'claude-user', '1.0'],
    ['Mozilla/5.0 (compatible; Perplexity-User/1.0)', 'ai-assistant', 'perplexity-user', '1.0'],
    ['Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)', 'crawler', 'yandexbot', '3.0'],
    ['curl/8.7.1', 'http-client', 'curl', '8.7.1'],
  ])('classifies %s', (ua, type, name, version) => {
    expect(parse(ua).client).toMatchObject({ type, name, version: { full: version } });
  });

  it('finds a bot named by a bare word in a comment', () => {
    const ua = 'Mozilla/5.0 (Linux; Android 5.0) Mobile Safari/537.36 (compatible; Bytespider; spider-feedback@bytedance.com)';
    expect(parse(ua).client).toEqual({ type: 'ai-crawler', name: 'bytespider', token: 'bytespider', version: null });
  });

  it('keeps a distinct name for each AI assistant', () => {
    const names = ['ChatGPT-User/1.0', 'Claude-User/1.0', 'Perplexity-User/1.0'].map((ua) => parse(ua).client.name);
    expect(new Set(names).size).toBe(3);
  });

  it('classifies an unlisted bot by its product name only', () => {
    expect(parse('Mozilla/5.0 (compatible; MJ12bot/v1.4.8; http://mj12bot.com/)').client).toEqual({
      type: 'bot',
      name: null,
      token: 'mj12bot',
      version: null,
    });
    expect(parse('ExampleCrawler').client).toMatchObject({ type: 'bot', name: null, token: 'examplecrawler' });
  });

  it('does not take a phone brand or a URL for a bot', () => {
    expect(parse('Mozilla/5.0 (Linux; Android 10; CUBOT P50) AppleWebKit/537.36 Mobile Safari/537.36').client.type).toBeNull();
    expect(parse('Mozilla/5.0 Chrome/130.0.0.0 +http://example.test/mybot.html').client.type).toBeNull();
    expect(parse('Mozilla/5.0 (X11; Linux x86_64) Chrome/130.0.0.0 Safari/537.36').client.type).toBeNull();
  });

  it('prefers a listed client over the generic bot rule', () => {
    expect(parse('Googlebot/2.1 OtherBot/1.0').client.name).toBe('googlebot');
  });
});

describe('Client Hints header reading', () => {
  it.each([
    ['"Not A Brand";v="99", "Google Chrome";v="150"', [{ brand: 'Google Chrome', version: '150' }]],
    ['"Chromium";v="150.0.1", "Brave" ; v = "150"', [{ brand: 'Chromium', version: '150.0.1' }, { brand: 'Brave', version: '150' }]],
    ['"A";v="1", garbage, "B";v="2"', [{ brand: 'A', version: '1' }, { brand: 'B', version: '2' }]],
    ['"A";v="x1", "B";v="2."', []],
    ['"A";v="1', []],
    ['"A", "B";v="3"', [{ brand: 'B', version: '3' }]],
    ['', []],
  ])('reads %s', (header, expected) => {
    expect(parseBrandList(header)).toEqual(expected);
  });

  it('reads nothing from a missing header', () => {
    expect(parseBrandList(null)).toEqual([]);
  });

  it.each([
    ['1', true], ['150.0.1.2', true], ['', false], ['1.', false], ['.1', false], ['1..2', false], ['1a', false],
  ])('validates brand version %p', (value, valid) => {
    expect(isValidBrandVersion(value)).toBe(valid);
  });

  it('ignores everything past the header limit in bounded time', () => {
    const header = `${'"A";v="1", '.repeat(2000)}"Late";v="9"`;
    const start = performance.now();
    const brands = parseBrandList(header);

    expect(performance.now() - start).toBeLessThan(25);
    expect(brands.some((item) => item.brand === 'Late')).toBe(false);
    expect(decodeClientHints(() => header).brands.length).toBeLessThan(200);
  });
});
