import { parse } from '../parse';
import { parseRequest } from '../server';

const CHROME_DESKTOP =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';

// Each input targets one formerly super-linear pattern and is sized like a large HTTP header.
const HOSTILE_INPUTS: readonly (readonly [string, string])[] = [
  ['repeated Tizen Mobile tokens', 'Tizen Mobile '.repeat(1260)],
  ['repeated Tizen tokens', 'Tizen '.repeat(2700)],
  ['dotted token run', 'a.'.repeat(8000)],
  ['dashed token run', 'a-'.repeat(8000)],
  ['unclosed comment', `Mozilla/5.0 (Linux; Android 14; ${'x;'.repeat(8000)}`],
];

function elapsedMilliseconds(run: () => void): number {
  const start = performance.now();
  run();
  return performance.now() - start;
}

describe('bounded User-Agent input', () => {
  it.each(HOSTILE_INPUTS)('parses %s in bounded time', (_, userAgent) => {
    expect(elapsedMilliseconds(() => parse(userAgent))).toBeLessThan(50);
  });

  it.each(HOSTILE_INPUTS)('parses a request carrying %s in bounded time', (_, userAgent) => {
    expect(elapsedMilliseconds(() => parseRequest({ 'user-agent': userAgent }))).toBeLessThan(50);
  });

  it('matches only the first 1024 characters but echoes the full input', () => {
    const userAgent = `${'x'.repeat(1024)} ${CHROME_DESKTOP}`;
    const result = parse(userAgent);

    expect(result.ua).toBe(userAgent);
    expect(result.browser.name).toBeNull();
    expect(parse(CHROME_DESKTOP).browser.name).toBe('chrome');
  });

  it.each([undefined, null, 42, {}])('treats non-string input %p as an empty User-Agent', (input) => {
    expect(parse(input as unknown as string)).toEqual(parse(''));
  });

  it('requires a token boundary before the LINE product token', () => {
    const result = parse('my-command-line/1.2.3');

    expect(result.context).toEqual({ type: null, name: null, host: null });
    expect(result.browser.mode).toBeNull();
    expect(parse(`${CHROME_DESKTOP} Line/13.1.0`).context.name).toBe('line');
  });
});
