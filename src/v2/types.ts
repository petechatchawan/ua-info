/** A normalized product version. `raw` is the canonical representation. */
export interface Version {
    readonly raw: string;
    readonly major: number | null;
    readonly minor: number | null;
}

/** Shared identity fields for browser, engine, OS, client, and context host products. */
export interface ProductInfo {
    readonly id: string;
    readonly name: string;
    readonly version: Version | null;
}

export type BrowserMode = 'browser' | 'webview' | 'headless' | 'embedded' | 'unknown';

export interface BrowserInfo extends ProductInfo {
    /** Browser lineage, such as `chromium`, `firefox`, or `safari`. */
    readonly family: string | null;
    readonly mode: BrowserMode;
}

export type EngineInfo = ProductInfo;

export type OSInfo = ProductInfo;

export type DeviceType =
    | 'desktop'
    | 'mobile'
    | 'tablet'
    | 'smart-tv'
    | 'console'
    | 'wearable'
    | 'xr'
    | 'embedded'
    | 'unknown';

export interface DeviceInfo {
    readonly type: DeviceType;
    readonly vendor: string | null;
    readonly model: string | null;
}

export interface CPUInfo {
    readonly architecture: string | null;
    readonly bitness: 32 | 64 | null;
}

export type ClientKind =
    | 'bot'
    | 'crawler'
    | 'ai-agent'
    | 'automation'
    | 'http-client'
    | 'library'
    | 'email-client'
    | 'media-player'
    | 'unknown';

/** The most specific selected non-browser client. */
export interface ClientInfo extends ProductInfo {
    readonly kind: ClientKind;
}

export type ContextKind = 'in-app-browser' | 'mini-app' | 'pwa' | 'embedded' | 'unknown';

export interface ContextInfo {
    readonly kind: ContextKind;
    readonly id: string | null;
    readonly name: string | null;
    readonly host: ProductInfo | null;
}

export interface UAResult {
    readonly ua: string;
    readonly browser: BrowserInfo | null;
    readonly engine: EngineInfo | null;
    readonly os: OSInfo | null;
    readonly device: DeviceInfo;
    readonly cpu: CPUInfo | null;
    /**
     * The most specific selected non-browser client.
     * Null for an ordinary browser or an in-app host represented by `context.host`.
     */
    readonly client: ClientInfo | null;
    readonly context: ContextInfo | null;
}
