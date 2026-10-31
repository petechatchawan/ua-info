export const BrowserId = {
  Arc: 'arc',
  Brave: 'brave',
  Chrome: 'chrome',
  Chromium: 'chromium',
  Edge: 'edge',
  Firefox: 'firefox',
  HuaweiBrowser: 'huawei-browser',
  MiBrowser: 'mi-browser',
  Opera: 'opera',
  Safari: 'safari',
  SamsungInternet: 'samsung-internet',
  UCBrowser: 'uc-browser',
  Vivaldi: 'vivaldi',
  YandexBrowser: 'yandex-browser',
} as const;
export type BrowserId = (typeof BrowserId)[keyof typeof BrowserId];

export const EngineId = {
  Blink: 'blink',
  Gecko: 'gecko',
  WebKit: 'webkit',
} as const;
export type EngineId = (typeof EngineId)[keyof typeof EngineId];

export const OSId = {
  Android: 'android',
  ChromeOS: 'chromeos',
  HarmonyOS: 'harmonyos',
  IOS: 'ios',
  IPadOS: 'ipados',
  KaiOS: 'kaios',
  Linux: 'linux',
  MacOS: 'macos',
  Tizen: 'tizen',
  Windows: 'windows',
} as const;
export type OSId = (typeof OSId)[keyof typeof OSId];

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
export type CPUArchitecture = (typeof CPUArchitecture)[keyof typeof CPUArchitecture];

export const ContextId = {
  Facebook: 'facebook',
  Instagram: 'instagram',
  Liff: 'liff',
  Line: 'line',
  Messenger: 'messenger',
  PWA: 'pwa',
  WeChat: 'wechat',
} as const;
export type ContextId = (typeof ContextId)[keyof typeof ContextId];
