import { parse } from '../../src/parse';
import { BROWSER_FIXTURES } from './fixtures';

describe('browser detection', () => {
  it.each(BROWSER_FIXTURES)('$id', (fixture) => {
    expect(parse(fixture.userAgent).browser).toMatchObject(fixture.expected);
  });

  it('detects Mi Browser before Chrome', () => {
    const ua =
      'Mozilla/5.0 (Linux; U; Android 14; en-us; 23127PN0CG) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Version/4.0 Chrome/120.0.0.0 Mobile Safari/537.36 XiaoMi/MiuiBrowser/18.4.110316';
    expect(parse(ua).browser).toMatchObject({
      name: 'mi-browser',
      family: 'chromium',
      mode: 'browser',
    });
  });

  it('detects Brave on iOS without inventing Chromium lineage', () => {
    const ua =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 ' +
      '(KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1 Brave';
    const result = parse(ua);
    expect(result.browser).toMatchObject({
      name: 'brave',
      family: null,
      version: null,
    });
    expect(result.engine.name).toBe('webkit');
  });

  it('does not treat a Safari compatibility token as Safari without Version', () => {
    expect(parse('Mozilla/5.0 AppleWebKit/605.1.15 Safari/605.1.15').browser.name).toBeNull();
  });

  it('keeps browser lineage independent from the iOS rendering engine', () => {
    const ua =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 ' +
      '(KHTML, like Gecko) CriOS/150.0.0.0 Mobile/15E148 Safari/604.1';
    const result = parse(ua);
    expect(result.browser).toMatchObject({ name: 'chrome', family: 'chromium' });
    expect(result.engine.name).toBe('webkit');
  });

  it('never copies Chrome version into Blink', () => {
    const ua =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';
    expect(parse(ua).engine).toEqual({ name: 'blink', version: null });
  });

  it('does not report an unlisted Chromium fork as Chrome', () => {
    const ua = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/150.0.0.0 Mobile Safari/537.36 Fork/1.0';
    expect(parse(ua).browser).toMatchObject({ name: null, family: 'chromium' });
  });

  it('reports Edge Legacy as its own product', () => {
    const ua =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
      'Chrome/70.0.3538.102 Safari/537.36 Edge/18.19041';
    expect(parse(ua).browser).toMatchObject({ name: 'edge-legacy', family: null, version: { full: '18.19041', major: 18 } });
    expect(parse(ua).engine).toMatchObject({ name: 'edgehtml', version: { full: '18.19041', major: 18 } });
  });

  it('reports Chrome on an Android phone as chrome-mobile', () => {
    const ua =
      'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36';
    expect(parse(ua).browser).toMatchObject({ name: 'chrome-mobile', family: 'chromium', mode: 'browser' });
  });

  it('keeps Chrome on desktop and an Android tablet as chrome', () => {
    const desktop =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';
    const tablet =
      'Mozilla/5.0 (Linux; Android 14; SM-X910) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';
    expect(parse(desktop).browser.name).toBe('chrome');
    expect(parse(tablet).browser.name).toBe('chrome');
  });

  it('keeps the WebView mode on a Chrome Android phone', () => {
    const ua =
      'Mozilla/5.0 (Linux; Android 14; SM-S928B; wv) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Version/4.0 Chrome/150.0.0.0 Mobile Safari/537.36';
    expect(parse(ua).browser).toMatchObject({ name: 'chrome-mobile', mode: 'webview' });
  });

  it('reports Safari on iOS and iPadOS as safari-mobile', () => {
    const iphone =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 ' +
      '(KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1';
    const ipad =
      'Mozilla/5.0 (iPad; CPU OS 18_7 like Mac OS X) AppleWebKit/605.1.15 ' +
      '(KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1';
    expect(parse(iphone).browser).toMatchObject({ name: 'safari-mobile', family: 'safari' });
    expect(parse(ipad).browser).toMatchObject({ name: 'safari-mobile', family: 'safari' });
  });

  it('keeps Safari on macOS as safari', () => {
    const ua =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 ' +
      '(KHTML, like Gecko) Version/26.5 Safari/605.1.15';
    expect(parse(ua).browser.name).toBe('safari');
  });
});
