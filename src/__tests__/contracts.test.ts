import {
  type BrowserFamily,
  type BrowserMode,
  type ContextType,
  type DeviceType,
  type UAInfo,
} from '../index';
import { parse } from '../parse';

describe('canonical contracts', () => {
  it('uses fixed top-level objects with null unknown fields', () => {
    expect(parse('')).toEqual({
      ua: '',
      browser: { name: null, version: null, family: null, mode: null },
      engine: { name: null, version: null },
      os: { name: null, version: null },
      device: { type: null, vendor: null, model: null },
      cpu: { architecture: null, bitness: null },
      client: { type: null, name: null, token: null, version: null },
      context: { type: null, name: null, app: null, version: null },
    });
  });

  it('locks stable ids', () => {
    expect(parse('Mozilla/5.0 Chrome/150.0.0.0').browser.name).toBe('chrome');
    expect(parse('Mozilla/5.0 (Linux; Android 14; Pixel 8) Mobile XiaoMi/MiuiBrowser/18.4').browser.name).toBe('mi-browser');
    expect(parse('Mozilla/5.0 Chromium/150.0.0.0').browser.name).toBe('chromium');
  });

  it('reports versions with major, minor and patch', () => {
    expect(parse('Mozilla/5.0 Chrome/150.2.3.4').browser.version).toEqual({ full: '150.2.3.4', major: 150, minor: 2, patch: 3 });
    expect(parse('Mozilla/5.0 Firefox/132.0').browser.version).toEqual({ full: '132.0', major: 132, minor: 0, patch: null });
    expect(parse('Mozilla/5.0 Safari/17').browser.version).toBeNull();
  });
});

function assertClosedTypes(info: UAInfo): void {
  const family: BrowserFamily = 'chromium';
  const mode: BrowserMode = 'webview';
  const device: DeviceType = 'embedded';
  const context: ContextType = 'mini-app';
  void family;
  void mode;
  void device;
  void context;
  void info;

  // @ts-expect-error generic embedded application context is not part of the contract
  const invalidContext: ContextType = 'embedded';
  void invalidContext;
}

void assertClosedTypes;
