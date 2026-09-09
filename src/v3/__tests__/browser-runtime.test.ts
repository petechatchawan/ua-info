import { detect } from '../browser';

const chromeUA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';
const lineUA =
  'Mozilla/5.0 (Linux; Android 16; Pixel 10 Pro; wv) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Version/4.0 Chrome/150.0.0.0 Mobile Safari/537.36 Line/26.11.0';

function installNavigator(
  userAgent = chromeUA,
  getHighEntropyValues: jest.Mock | undefined = undefined,
  brands: readonly { readonly brand: string; readonly version: string }[] = [
    { brand: 'Google Chrome', version: '150' },
  ],
): void {
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
      userAgent,
      userAgentData: {
        brands,
        mobile: false,
        platform: 'macOS',
        getHighEntropyValues,
      },
    },
  });
}

function installStandalone(matches: boolean): void {
  Object.defineProperty(globalThis, 'matchMedia', {
    configurable: true,
    value: () => ({ matches }),
  });
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'navigator');
  Reflect.deleteProperty(globalThis, 'matchMedia');
});

describe('detect', () => {
  it('does not request high entropy by default', async () => {
    const getHighEntropyValues = jest.fn();
    installNavigator(chromeUA, getHighEntropyValues);
    installStandalone(false);

    const result = await detect();
    expect(result.browser.name).toBe('chrome');
    expect(getHighEntropyValues).not.toHaveBeenCalled();
  });

  it('requests only the documented set when highEntropy is true', async () => {
    const getHighEntropyValues = jest.fn().mockResolvedValue({
      architecture: 'arm',
      bitness: '64',
      model: '',
      platformVersion: '15.0.0',
      fullVersionList: [{ brand: 'Google Chrome', version: '150.0.7339.80' }],
    });
    installNavigator(chromeUA, getHighEntropyValues);
    installStandalone(false);

    const result = await detect({ highEntropy: true });
    expect(getHighEntropyValues).toHaveBeenCalledWith([
      'architecture',
      'bitness',
      'fullVersionList',
      'model',
      'platformVersion',
    ]);
    expect(result.browser.version?.full).toBe('150.0.7339.80');
    expect(result.cpu).toEqual({ architecture: 'arm64', bitness: 64 });
  });

  it('ignores malformed low-entropy browser versions', async () => {
    installNavigator(
      chromeUA,
      undefined,
      [{ brand: 'Google Chrome', version: 'garbage' }],
    );
    installStandalone(false);

    const result = await detect();
    expect(result.browser.name).toBe('chrome');
    expect(result.browser.version).toEqual({ full: '150.0.0.0', major: 150 });
  });

  it('ignores malformed high-entropy browser versions', async () => {
    const getHighEntropyValues = jest.fn().mockResolvedValue({
      fullVersionList: [{ brand: 'Google Chrome', version: 'garbage' }],
    });
    installNavigator(chromeUA, getHighEntropyValues);
    installStandalone(false);

    const result = await detect({ highEntropy: true });
    expect(result.browser.name).toBe('chrome');
    expect(result.browser.version).toEqual({ full: '150', major: 150 });
  });

  it('falls back when high entropy access rejects', async () => {
    installNavigator(chromeUA, jest.fn().mockRejectedValue(new Error('denied')));
    installStandalone(false);
    await expect(detect({ highEntropy: true })).resolves.toMatchObject({
      browser: { name: 'chrome' },
    });
  });

  it('establishes LIFF only from runtime true', async () => {
    installNavigator();
    installStandalone(false);
    const result = await detect({ liff: { isInClient: () => true } });
    expect(result.context).toMatchObject({
      type: 'mini-app',
      name: 'liff',
      host: { name: 'line' },
    });
  });

  it('does not establish LIFF for runtime false or missing adapter', async () => {
    installNavigator();
    installStandalone(false);
    expect((await detect({ liff: { isInClient: () => false } })).context.name).not.toBe('liff');
    expect((await detect()).context.name).not.toBe('liff');
  });

  it('ignores a throwing LIFF adapter', async () => {
    installNavigator();
    installStandalone(false);
    await expect(detect({ liff: { isInClient: () => { throw new Error('sdk'); } } })).resolves.toBeDefined();
  });

  it('establishes PWA only when no app context exists', async () => {
    installNavigator();
    installStandalone(true);
    expect((await detect()).context).toEqual({ type: 'pwa', name: 'pwa', host: null });
  });

  it('keeps LINE context ahead of standalone PWA', async () => {
    installNavigator(lineUA);
    installStandalone(true);
    const result = await detect();
    expect(result.context.name).toBe('line');
    expect(result.context.type).toBe('in-app-browser');
  });

  it('rejects without navigator and directs server callers to pure adapters', async () => {
    await expect(detect()).rejects.toThrow(/parse\(\).*parseRequest\(\)/i);
  });
});
