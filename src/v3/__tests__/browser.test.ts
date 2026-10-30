import { BrowserId, EngineId } from '../constants';
import { parse } from '../parse';
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
      name: BrowserId.MiBrowser,
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
      name: BrowserId.Brave,
      family: null,
      version: null,
    });
    expect(result.engine.name).toBe(EngineId.WebKit);
  });

  it('does not treat a Safari compatibility token as Safari without Version', () => {
    expect(parse('Mozilla/5.0 AppleWebKit/605.1.15 Safari/605.1.15').browser.name).toBeNull();
  });

  it('keeps browser lineage independent from the iOS rendering engine', () => {
    const ua =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 ' +
      '(KHTML, like Gecko) CriOS/150.0.0.0 Mobile/15E148 Safari/604.1';
    const result = parse(ua);
    expect(result.browser).toMatchObject({ name: BrowserId.Chrome, family: 'chromium' });
    expect(result.engine.name).toBe(EngineId.WebKit);
  });

  it('never copies Chrome version into Blink', () => {
    const ua =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';
    expect(parse(ua).engine).toEqual({ name: EngineId.Blink, version: null });
  });

  it('does not report an unlisted Chromium fork as Chrome', () => {
    const ua = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/150.0.0.0 Mobile Safari/537.36 Fork/1.0';
    expect(parse(ua).browser).toMatchObject({ name: null, family: 'chromium' });
  });

  it('reports Edge Legacy as Edge', () => {
    const ua =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
      'Chrome/70.0.3538.102 Safari/537.36 Edge/18.19041';
    expect(parse(ua).browser).toMatchObject({ name: BrowserId.Edge, family: null, version: { full: '18.19041', major: 18 } });
  });
});
