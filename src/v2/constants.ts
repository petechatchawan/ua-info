export const BrowserId = {
    Chrome: 'chrome',
    Edge: 'edge',
    Firefox: 'firefox',
    Safari: 'safari',
    Opera: 'opera',
    SamsungInternet: 'samsung-internet',
} as const;

export const BrowserFamily = {
    Chromium: 'chromium',
    Firefox: 'firefox',
    Safari: 'safari',
} as const;

export const EngineId = {
    Blink: 'blink',
    Gecko: 'gecko',
    WebKit: 'webkit',
} as const;

export const OSId = {
    Android: 'android',
    ChromeOS: 'chromeos',
    IOS: 'ios',
    Linux: 'linux',
    MacOS: 'macos',
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
