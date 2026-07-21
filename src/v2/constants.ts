export const BrowserId = {
    Arc: 'arc',
    Brave: 'brave',
    Chrome: 'chrome',
    Chromium: 'chromium',
    Edge: 'edge',
    Firefox: 'firefox',
    Huawei: 'huawei-browser',
    InternetExplorer: 'internet-explorer',
    Opera: 'opera',
    Safari: 'safari',
    SamsungInternet: 'samsung-internet',
    UCBrowser: 'uc-browser',
    Vivaldi: 'vivaldi',
    Xiaomi: 'xiaomi-browser',
    Yandex: 'yandex-browser',
} as const;

export const BrowserFamily = {
    Chromium: 'chromium',
    Firefox: 'firefox',
    InternetExplorer: 'internet-explorer',
    Safari: 'safari',
} as const;

export const EngineId = {
    Blink: 'blink',
    EdgeHTML: 'edgehtml',
    Gecko: 'gecko',
    Trident: 'trident',
    WebKit: 'webkit',
} as const;

export const OSId = {
    Android: 'android',
    ChromeOS: 'chromeos',
    HarmonyOS: 'harmonyos',
    IOS: 'ios',
    KaiOS: 'kaios',
    Linux: 'linux',
    MacOS: 'macos',
    Tizen: 'tizen',
    Windows: 'windows',
} as const;

export const CPUArchitecture = {
    ARM: 'arm',
    ARM64: 'arm64',
    MIPS: 'mips',
    PowerPC: 'powerpc',
    RISCV: 'riscv',
    SPARC: 'sparc',
    X86: 'x86',
    X86_64: 'x86_64',
} as const;

export type KnownBrowserId = (typeof BrowserId)[keyof typeof BrowserId];
export type KnownBrowserFamily = (typeof BrowserFamily)[keyof typeof BrowserFamily];
export type KnownEngineId = (typeof EngineId)[keyof typeof EngineId];
export type KnownOSId = (typeof OSId)[keyof typeof OSId];
export type KnownCPUArchitecture = (typeof CPUArchitecture)[keyof typeof CPUArchitecture];
