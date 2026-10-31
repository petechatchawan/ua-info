import { MAX_UA_LENGTH, readVersion, scan } from '../core/scan';

describe('scan', () => {
  it('splits top-level products and comment parts', () => {
    const result = scan('Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/130.0.0.0 Mobile Safari/537.36');

    expect(result.products).toEqual([
      { name: 'mozilla', version: '5.0', top: true },
      { name: 'chrome', version: '130.0.0.0', top: true },
      { name: 'mobile', version: null, top: true },
      { name: 'safari', version: '537.36', top: true },
    ]);
    expect(result.parts).toEqual(['linux', 'android 14', 'pixel 8']);
  });

  it('reads a product that sits inside a comment', () => {
    const result = scan('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)');

    expect(result.products).toContainEqual({ name: 'googlebot', version: '2.1', top: false });
    expect(result.names.has('+http')).toBe(false);
  });

  it('reads a spaced version after a bare word', () => {
    const result = scan('Mobile/15E148 Instagram 330.0.0.20.103 (iPhone14,5)');

    expect(result.products).toContainEqual({ name: 'instagram', version: '330.0.0.20.103', top: true });
  });

  it('reads both products of a nested slash token', () => {
    const result = scan('Safari/537.36 XiaoMi/MiuiBrowser/18.4.110316');

    expect(result.products).toContainEqual({ name: 'miuibrowser', version: '18.4.110316', top: true });
  });

  it('ignores URL words and unbalanced brackets', () => {
    expect(scan('Bot/1.0 +http://example.test/mybot.html').names.has('+http')).toBe(false);
    expect(scan('Mozilla/5.0 (Linux; Android 14; Pixel').parts).toEqual(['linux', 'android 14', 'pixel']);
    expect(() => scan(')))((( ;;; [[[')).not.toThrow();
  });

  it('reads at most the matching window', () => {
    const result = scan(`${'x'.repeat(MAX_UA_LENGTH)} chrome/1.0`);

    expect(result.names.has('chrome')).toBe(false);
  });

  it.each([
    ['repeated slash tokens', 'a/'.repeat(8000)],
    ['repeated groups', '(;'.repeat(8000)],
    ['one long word', 'a'.repeat(100_000)],
    ['spaced digits', 'a 1.'.repeat(4000)],
  ])('scans %s in bounded time', (_, input) => {
    const start = performance.now();
    const result = scan(input);

    expect(performance.now() - start).toBeLessThan(25);
    expect(result.products.length).toBeLessThanOrEqual(64);
    expect(result.parts.length).toBeLessThanOrEqual(64);
  });
});

describe('readVersion', () => {
  it.each([
    ['130.0.6723.92', '130.0.6723.92', 130, 0, 6723],
    ['17_5_1', '17.5.1', 17, 5, 1],
    ['9.80', '9.80', 9, 80, null],
    ['36.2.2254/119.132', '36.2.2254', 36, 2, 2254],
    ['1.2.', '1.2', 1, 2, null],
    ['7', '7', 7, null, null],
  ])('reads %s', (raw, full, major, minor, patch) => {
    expect(readVersion(raw)).toEqual({ full, major, minor, patch });
  });

  it.each([null, '', 'garbage', '.5', 'v1'])('rejects %p', (raw) => {
    expect(readVersion(raw)).toBeNull();
  });

  it('reports a version whose major is not a safe integer as no version', () => {
    expect(readVersion('99999999999999999999')).toBeNull();
  });
});
