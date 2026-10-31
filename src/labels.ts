import { BROWSERS, type BrowserId } from './catalog/browsers';
import { CLIENTS, type ClientId } from './catalog/clients';
import { CONTEXTS, type AppId } from './catalog/contexts';
import { CPUS, type CPUArchitecture } from './catalog/cpus';
import { DEVICE_TYPES, type DeviceType } from './catalog/devices';
import { OPERATING_SYSTEMS, type OSId } from './catalog/os';
import { VENDORS, type VendorId } from './catalog/vendors';
import type { ContextId, EngineId } from './types';

function labelsOf<K extends string>(rows: Readonly<Record<K, { readonly label: string }>>): Readonly<Record<K, string>> {
  const result = {} as Record<K, string>;
  for (const id of Object.keys(rows) as K[]) result[id] = rows[id].label;
  return result;
}

const ENGINE_LABELS: Readonly<Record<EngineId, string>> = { blink: 'Blink', gecko: 'Gecko', webkit: 'WebKit' };

const CONTEXT_LABELS: Readonly<Record<ContextId, string>> = {
  ...labelsOf<AppId>(CONTEXTS),
  liff: 'LINE LIFF',
  pwa: 'Installed web app',
};

/**
 * Display names for the stable IDs in a result. Results carry IDs, so a program branches on a
 * lowercase ID and shows `labels.browser[info.browser.name]` to a person.
 */
export const labels: {
  readonly browser: Readonly<Record<BrowserId, string>>;
  readonly os: Readonly<Record<OSId, string>>;
  readonly engine: Readonly<Record<EngineId, string>>;
  readonly device: Readonly<Record<DeviceType, string>>;
  readonly cpu: Readonly<Record<CPUArchitecture, string>>;
  readonly vendor: Readonly<Record<VendorId, string>>;
  readonly client: Readonly<Record<ClientId, string>>;
  readonly context: Readonly<Record<ContextId, string>>;
} = {
  browser: labelsOf(BROWSERS),
  os: labelsOf(OPERATING_SYSTEMS),
  engine: ENGINE_LABELS,
  device: labelsOf(DEVICE_TYPES),
  cpu: labelsOf(CPUS),
  vendor: labelsOf(VENDORS),
  client: labelsOf(CLIENTS),
  context: CONTEXT_LABELS,
};
