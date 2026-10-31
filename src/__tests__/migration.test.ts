import { readFileSync } from 'node:fs';
import path from 'node:path';

// Every public name that 3.0.1 exported and 4.0 removed. MIGRATION.md must say what replaces each one.
const REMOVED_EXPORTS = [
  'parseVersion', 'readHeader', 'ProductInfo',
  'BrowserId', 'EngineId', 'OSId', 'CPUArchitecture', 'ContextId',
  'isBrowser', 'isBrowserFamily', 'isBrowserMode', 'isEngine', 'isOS', 'isDevice', 'isClient', 'isContext',
  'isChrome', 'isChromium', 'isSafari', 'isFirefox', 'isEdge', 'isOpera', 'isSamsungInternet', 'isBrave',
  'isVivaldi', 'isMiBrowser', 'isHuaweiBrowser', 'isUCBrowser', 'isYandexBrowser', 'isArc',
  'isAndroid', 'isIOS', 'isIPadOS', 'isWindows', 'isMacOS', 'isLinux', 'isChromeOS', 'isHarmonyOS', 'isKaiOS', 'isTizen',
  'isMobile', 'isTablet', 'isDesktop', 'isSmartTV', 'isConsole', 'isWearable', 'isXR', 'isEmbeddedDevice',
  'isCrawler', 'isAICrawler', 'isAIAssistant', 'isAutomation', 'isHttpClient', 'isEmailClient', 'isMediaPlayer',
  'isWebView', 'isHeadless', 'isInAppBrowser', 'isPWA', 'isLine', 'isLiff', 'isFacebook', 'isInstagram', 'isMessenger', 'isWeChat',
];

const guide = readFileSync(path.join(__dirname, '..', '..', 'MIGRATION.md'), 'utf8');
const v4Section = guide.slice(0, guide.indexOf('# Migrating from ua-info v2'));

describe('MIGRATION.md', () => {
  it.each(REMOVED_EXPORTS)('says what replaces %s', (name) => {
    expect(v4Section).toContain(`| \`${name}\` |`);
  });

  it('never maps a name to a replacement that does not exist', () => {
    const queryKeys = ['browser', 'family', 'mode', 'engine', 'os', 'device', 'vendor', 'client', 'clientType', 'context', 'contextType', 'app'];
    const used = [...v4Section.matchAll(/is\(info, \{ (\w+)/g)].map((match) => match[1]);
    expect(used.filter((key) => !queryKeys.includes(key))).toEqual([]);
  });
});
