import {
  BrowserId,
  type BrowserFamily,
  type BrowserMode,
  type ContextType,
  type DeviceType,
  type UAInfo,
} from '../index';
import { createEmptyUAInfo } from '../result';

describe('canonical contracts', () => {
  it('uses fixed top-level objects with null unknown fields', () => {
    expect(createEmptyUAInfo('fixture')).toEqual({
      ua: 'fixture',
      browser: { name: null, version: null, family: null, mode: null },
      engine: { name: null, version: null },
      os: { name: null, version: null },
      device: { type: null, vendor: null, model: null },
      cpu: { architecture: null, bitness: null },
      client: { type: null, name: null, version: null },
      context: { type: null, name: null, host: null },
    });
  });

  it('locks stable browser IDs', () => {
    expect(BrowserId.Chrome).toBe('chrome');
    expect(BrowserId.MiBrowser).toBe('mi-browser');
    expect(BrowserId.Chromium).toBe('chromium');
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
