import type {
  BrowserId,
  CPUArchitecture,
  ContextId,
  EngineId,
  OSId,
} from './constants';

export interface Version {
  readonly full: string;
  readonly major: number | null;
}

export interface ProductInfo<TName extends string = string> {
  readonly name: TName | null;
  readonly version: Version | null;
}

export type BrowserFamily = 'chromium' | 'firefox' | 'safari';
export type BrowserMode = 'browser' | 'webview' | 'headless';

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

export type DeviceType =
  | 'desktop'
  | 'mobile'
  | 'tablet'
  | 'smart-tv'
  | 'console'
  | 'wearable'
  | 'xr'
  | 'embedded';

export interface DeviceInfo {
  readonly type: DeviceType | null;
  readonly vendor: string | null;
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
  readonly name: string | null;
  readonly version: Version | null;
}

export type ContextType = 'in-app-browser' | 'mini-app' | 'pwa';

export interface ContextInfo {
  readonly type: ContextType | null;
  readonly name: ContextId | null;
  readonly host: ProductInfo | null;
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
