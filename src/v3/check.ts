import { BrowserId, ContextId, EngineId, OSId } from './constants';
import type {
  BrowserFamily,
  BrowserInfo,
  BrowserMode,
  ClientType,
  ContextInfo,
  DeviceType,
  EngineInfo,
  OSInfo,
  UAInfo,
} from './types';

export function isBrowser<T extends string>(
  info: UAInfo,
  name: T,
): info is UAInfo & { readonly browser: BrowserInfo & { readonly name: T } } {
  return info.browser.name === name;
}

export function isBrowserFamily<T extends BrowserFamily>(
  info: UAInfo,
  family: T,
): info is UAInfo & { readonly browser: BrowserInfo & { readonly family: T } } {
  return info.browser.family === family;
}

export function isBrowserMode<T extends BrowserMode>(
  info: UAInfo,
  mode: T,
): info is UAInfo & { readonly browser: BrowserInfo & { readonly mode: T } } {
  return info.browser.mode === mode;
}

export function isEngine<T extends string>(
  info: UAInfo,
  name: T,
): info is UAInfo & { readonly engine: EngineInfo & { readonly name: T } } {
  return info.engine.name === name;
}

export function isOS<T extends string>(
  info: UAInfo,
  name: T,
): info is UAInfo & { readonly os: OSInfo & { readonly name: T } } {
  return info.os.name === name;
}

export function isDevice<T extends DeviceType>(
  info: UAInfo,
  type: T,
): info is UAInfo & { readonly device: UAInfo['device'] & { readonly type: T } } {
  return info.device.type === type;
}

export function isClient<T extends ClientType>(
  info: UAInfo,
  type: T,
): info is UAInfo & { readonly client: UAInfo['client'] & { readonly type: T } } {
  return info.client.type === type;
}

export function isContext<T extends string>(
  info: UAInfo,
  name: T,
): info is UAInfo & { readonly context: ContextInfo & { readonly name: T } } {
  return info.context.name === name;
}

export const isChrome = (info: UAInfo): boolean => isBrowser(info, BrowserId.Chrome);
export const isChromium = (info: UAInfo): boolean => isBrowser(info, BrowserId.Chromium);
export const isSafari = (info: UAInfo): boolean => isBrowser(info, BrowserId.Safari);
export const isFirefox = (info: UAInfo): boolean => isBrowser(info, BrowserId.Firefox);
export const isEdge = (info: UAInfo): boolean => isBrowser(info, BrowserId.Edge);
export const isOpera = (info: UAInfo): boolean => isBrowser(info, BrowserId.Opera);
export const isSamsungInternet = (info: UAInfo): boolean => isBrowser(info, BrowserId.SamsungInternet);
export const isBrave = (info: UAInfo): boolean => isBrowser(info, BrowserId.Brave);
export const isVivaldi = (info: UAInfo): boolean => isBrowser(info, BrowserId.Vivaldi);
export const isMiBrowser = (info: UAInfo): boolean => isBrowser(info, BrowserId.MiBrowser);
export const isHuaweiBrowser = (info: UAInfo): boolean => isBrowser(info, BrowserId.HuaweiBrowser);
export const isUCBrowser = (info: UAInfo): boolean => isBrowser(info, BrowserId.UCBrowser);
export const isYandexBrowser = (info: UAInfo): boolean => isBrowser(info, BrowserId.YandexBrowser);
export const isArc = (info: UAInfo): boolean => isBrowser(info, BrowserId.Arc);

export const isAndroid = (info: UAInfo): boolean => isOS(info, OSId.Android);
export const isIOS = (info: UAInfo): boolean => isOS(info, OSId.IOS);
export const isIPadOS = (info: UAInfo): boolean => isOS(info, OSId.IPadOS);
export const isWindows = (info: UAInfo): boolean => isOS(info, OSId.Windows);
export const isMacOS = (info: UAInfo): boolean => isOS(info, OSId.MacOS);
export const isLinux = (info: UAInfo): boolean => isOS(info, OSId.Linux);
export const isChromeOS = (info: UAInfo): boolean => isOS(info, OSId.ChromeOS);
export const isHarmonyOS = (info: UAInfo): boolean => isOS(info, OSId.HarmonyOS);
export const isKaiOS = (info: UAInfo): boolean => isOS(info, OSId.KaiOS);
export const isTizen = (info: UAInfo): boolean => isOS(info, OSId.Tizen);

export const isMobile = (info: UAInfo): boolean => isDevice(info, 'mobile');
export const isTablet = (info: UAInfo): boolean => isDevice(info, 'tablet');
export const isDesktop = (info: UAInfo): boolean => isDevice(info, 'desktop');
export const isSmartTV = (info: UAInfo): boolean => isDevice(info, 'smart-tv');
export const isConsole = (info: UAInfo): boolean => isDevice(info, 'console');
export const isWearable = (info: UAInfo): boolean => isDevice(info, 'wearable');
export const isXR = (info: UAInfo): boolean => isDevice(info, 'xr');
export const isEmbeddedDevice = (info: UAInfo): boolean => isDevice(info, 'embedded');

export function isBot(info: UAInfo): boolean {
  return info.client.type === 'bot' || info.client.type === 'crawler' || info.client.type === 'ai-crawler';
}

export function isCrawler(info: UAInfo): boolean {
  return info.client.type === 'crawler' || info.client.type === 'ai-crawler';
}

export const isAICrawler = (info: UAInfo): boolean => isClient(info, 'ai-crawler');
export const isAIAssistant = (info: UAInfo): boolean => isClient(info, 'ai-assistant');
export const isAutomation = (info: UAInfo): boolean => isClient(info, 'automation');
export const isHttpClient = (info: UAInfo): boolean => isClient(info, 'http-client');
export const isEmailClient = (info: UAInfo): boolean => isClient(info, 'email-client');
export const isMediaPlayer = (info: UAInfo): boolean => isClient(info, 'media-player');

export const isWebView = (info: UAInfo): boolean => isBrowserMode(info, 'webview');
export const isHeadless = (info: UAInfo): boolean => isBrowserMode(info, 'headless');
export const isInAppBrowser = (info: UAInfo): boolean => info.context.type === 'in-app-browser';
export const isPWA = (info: UAInfo): boolean => info.context.type === 'pwa';

export function isLine(info: UAInfo): boolean {
  return isContext(info, ContextId.Line) || info.context.host?.name === ContextId.Line;
}

export function isLiff(info: UAInfo): boolean {
  return info.context.type === 'mini-app' && isContext(info, ContextId.Liff);
}

export const isFacebook = (info: UAInfo): boolean => isContext(info, ContextId.Facebook);
export const isInstagram = (info: UAInfo): boolean => isContext(info, ContextId.Instagram);
export const isMessenger = (info: UAInfo): boolean => isContext(info, ContextId.Messenger);
export const isWeChat = (info: UAInfo): boolean => isContext(info, ContextId.WeChat);

void EngineId;
