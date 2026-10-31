import type { BrowserId } from './catalog/browsers';
import type { ClientId } from './catalog/clients';
import type { AppId, ContextId } from './catalog/contexts';
import type { CPUArchitecture } from './catalog/cpus';
import type { DeviceType } from './catalog/devices';
import type { OSId } from './catalog/os';
import type { VendorId } from './catalog/vendors';

export type { AppId, BrowserId, ClientId, ContextId, CPUArchitecture, DeviceType, OSId, VendorId };

/**
 * A product or platform version, not SemVer. `full` is the dotted digits as reported and `major`,
 * `minor` and `patch` are its leading integers. A value that has no leading integer is not a version
 * and is reported as `null` instead.
 */
export interface Version {
  readonly full: string;
  readonly major: number;
  readonly minor: number | null;
  readonly patch: number | null;
}

export type BrowserFamily = 'chromium' | 'firefox' | 'safari';
export type BrowserMode = 'browser' | 'webview' | 'headless';
export type EngineId = 'blink' | 'gecko' | 'webkit';

export interface BrowserInfo {
  readonly name: BrowserId | null;
  readonly version: Version | null;
  readonly family: BrowserFamily | null;
  readonly mode: BrowserMode | null;
}

export interface EngineInfo {
  readonly name: EngineId | null;
  readonly version: Version | null;
}

export interface OSInfo {
  readonly name: OSId | null;
  readonly version: Version | null;
}

export interface DeviceInfo {
  readonly type: DeviceType | null;
  readonly vendor: VendorId | null;
  /** The model string as the device reported it. It is never normalized or invented. */
  readonly model: string | null;
}

export interface CPUInfo {
  readonly architecture: CPUArchitecture | null;
  readonly bitness: 32 | 64 | null;
}

export type ClientType =
  | 'bot'
  | 'crawler'
  | 'ai-crawler'
  | 'ai-assistant'
  | 'automation'
  | 'http-client'
  | 'library'
  | 'email-client'
  | 'media-player';

export interface ClientInfo {
  readonly type: ClientType | null;
  /** The listed client, or null for an unlisted bot that only has a `token`. */
  readonly name: ClientId | null;
  /** The product name from the User-Agent, lowercased. Set for every matched client. */
  readonly token: string | null;
  readonly version: Version | null;
}

export type ContextType = 'in-app-browser' | 'mini-app' | 'pwa';

export interface ContextInfo {
  readonly type: ContextType | null;
  /** What the page runs as. `liff` is a LINE mini-app, so `name` is `liff` and `app` is `line`. */
  readonly name: ContextId | null;
  /** The native app that hosts the page. It differs from `name` only for a mini-app. */
  readonly app: AppId | null;
  /** The version of the hosting app. */
  readonly version: Version | null;
}

export interface UAInfo {
  readonly ua: string;
  readonly browser: BrowserInfo;
  readonly engine: EngineInfo;
  readonly os: OSInfo;
  readonly device: DeviceInfo;
  readonly cpu: CPUInfo;
  readonly client: ClientInfo;
  readonly context: ContextInfo;
}
