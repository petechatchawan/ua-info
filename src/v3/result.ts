import type { UAInfo } from './types';

export function createEmptyUAInfo(ua: string): UAInfo {
  return {
    ua,
    browser: { name: null, version: null, family: null, mode: null },
    engine: { name: null, version: null },
    os: { name: null, version: null },
    device: { type: null, vendor: null, model: null },
    cpu: { architecture: null, bitness: null },
    client: { type: null, name: null, version: null },
    context: { type: null, name: null, host: null },
  };
}
