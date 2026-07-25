const CHROME_DESKTOP =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';
const CHROME_ANDROID =
  'Mozilla/5.0 (Linux; Android 16; Pixel 10 Pro Build/BP2A.260705.008) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36';
const ANDROID_WEBVIEW =
  'Mozilla/5.0 (Linux; Android 16; Pixel 10 Pro Build/BP2A.260705.008; wv) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/150.0.0.0 ' +
  'Mobile Safari/537.36';
const SAFARI_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 15_6) AppleWebKit/605.1.15 ' +
  '(KHTML, like Gecko) Version/19.0 Safari/605.1.15';
const SAFARI_IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 ' +
  '(KHTML, like Gecko) Version/19.0 Mobile/15E148 Safari/604.1';
const FIREFOX_DESKTOP =
  'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:150.0) Gecko/20100101 Firefox/150.0';

export const USER_AGENT_CORPUS = Object.freeze([
  Object.freeze({ id: 'desktop-chromium', userAgent: CHROME_DESKTOP }),
  Object.freeze({ id: 'desktop-safari', userAgent: SAFARI_MAC }),
  Object.freeze({ id: 'desktop-firefox', userAgent: FIREFOX_DESKTOP }),
  Object.freeze({ id: 'android-chrome', userAgent: CHROME_ANDROID }),
  Object.freeze({ id: 'mobile-safari', userAgent: SAFARI_IPHONE }),
  Object.freeze({ id: 'android-webview', userAgent: ANDROID_WEBVIEW }),
  Object.freeze({ id: 'line-liff', userAgent: `${ANDROID_WEBVIEW} Line/26.11.0 LIFF` }),
  Object.freeze({
    id: 'electron',
    userAgent:
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ' +
      'Chrome/150.0.0.0 Safari/537.36 Electron/38.0.0',
  }),
  Object.freeze({ id: 'oai-searchbot', userAgent: 'OAI-SearchBot/1.0' }),
  Object.freeze({
    id: 'googlebot-image',
    userAgent:
      'Mozilla/5.0 (compatible; Googlebot-Image/1.0; +http://www.google.com/bot.html)',
  }),
  Object.freeze({ id: 'malformed', userAgent: 'Mozilla/5.0 ((( broken bot spider' }),
  Object.freeze({ id: 'empty', userAgent: '' }),
]);

const userAgentById = new Map(USER_AGENT_CORPUS.map((item) => [item.id, item.userAgent]));

export function assertUniqueScenarioIds(items) {
  const seen = new Set();
  for (const item of items) {
    if (!item || typeof item.id !== 'string' || item.id.length === 0) {
      throw new Error('Scenario id must be a non-empty string.');
    }
    if (seen.has(item.id)) {
      throw new Error(`Duplicate scenario id: ${item.id}`);
    }
    seen.add(item.id);
  }
}

export const BUNDLE_SCENARIOS = Object.freeze([
  Object.freeze({
    id: 'root-parse',
    platform: 'node',
    source: `import { parse } from 'ua-info';\nconst result = parse(${JSON.stringify(CHROME_DESKTOP)});\nconsole.log(result.browser?.id ?? 'unknown');\n`,
  }),
  Object.freeze({
    id: 'root-predicate',
    platform: 'node',
    source: `import { BrowserId, isBrowser } from 'ua-info';\nconst result = { browser: { id: BrowserId.Chrome } };\nconsole.log(isBrowser(result, BrowserId.Chrome));\n`,
  }),
  Object.freeze({
    id: 'server-parse-request',
    platform: 'node',
    source: `import { parseRequest } from 'ua-info/server';\nconst result = parseRequest({ headers: { 'user-agent': ${JSON.stringify(CHROME_DESKTOP)} } });\nconsole.log(result.browser?.id ?? 'unknown');\n`,
  }),
  Object.freeze({
    id: 'browser-detect-current',
    platform: 'browser',
    source: `import { detectCurrent } from 'ua-info/browser';\nglobalThis.__uaInfoDetectCurrent = detectCurrent;\nconsole.log(typeof globalThis.__uaInfoDetectCurrent);\n`,
  }),
]);

export const COLD_IMPORT_SCENARIOS = Object.freeze([
  Object.freeze({ id: 'root-esm', kind: 'import', target: 'dist/esm/index.js' }),
  Object.freeze({ id: 'root-cjs', kind: 'require', target: 'dist/cjs/index.js' }),
  Object.freeze({ id: 'server-esm', kind: 'import', target: 'dist/esm/v2/server.js' }),
  Object.freeze({ id: 'browser-esm', kind: 'import', target: 'dist/esm/v2/browser.js' }),
]);

export const THROUGHPUT_SCENARIOS = Object.freeze([
  Object.freeze({
    id: 'desktop-chromium',
    iterations: 20_000,
    userAgents: Object.freeze([userAgentById.get('desktop-chromium')]),
  }),
  Object.freeze({
    id: 'mobile-safari',
    iterations: 20_000,
    userAgents: Object.freeze([userAgentById.get('mobile-safari')]),
  }),
  Object.freeze({
    id: 'line-liff',
    iterations: 20_000,
    userAgents: Object.freeze([userAgentById.get('line-liff')]),
  }),
  Object.freeze({
    id: 'crawler',
    iterations: 20_000,
    userAgents: Object.freeze([
      userAgentById.get('oai-searchbot'),
      userAgentById.get('googlebot-image'),
    ]),
  }),
  Object.freeze({
    id: 'malformed',
    iterations: 20_000,
    userAgents: Object.freeze([
      userAgentById.get('malformed'),
      userAgentById.get('empty'),
    ]),
  }),
  Object.freeze({
    id: 'mixed-corpus',
    iterations: 24_000,
    userAgents: Object.freeze(USER_AGENT_CORPUS.map(({ userAgent }) => userAgent)),
  }),
]);

for (const collection of [
  USER_AGENT_CORPUS,
  BUNDLE_SCENARIOS,
  COLD_IMPORT_SCENARIOS,
  THROUGHPUT_SCENARIOS,
]) {
  assertUniqueScenarioIds(collection);
}

export const REQUIRED_SCENARIO_IDS = Object.freeze({
  bundles: Object.freeze(BUNDLE_SCENARIOS.map(({ id }) => id)),
  coldImports: Object.freeze(COLD_IMPORT_SCENARIOS.map(({ id }) => id)),
  parseThroughput: Object.freeze(THROUGHPUT_SCENARIOS.map(({ id }) => id)),
});
