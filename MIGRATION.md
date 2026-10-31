# Migrating to user-agent-parser-ts v4

## From 3.x to 4.0

4.0 keeps `parse`, `parseRequest` and `detect`. It replaces about 60 `isX` helpers with two functions, makes every id a type that comes from the catalog, and tightens a few result fields. It also fixes the detection defects listed at the end.

### Checks: `is()` and `isBot()`

```ts
// 3.x
import { isChrome, isAndroid, isMobile } from 'user-agent-parser-ts/check';
if (isChrome(info) && isAndroid(info) && isMobile(info)) { /* ... */ }

// 4.0
import { is } from 'user-agent-parser-ts/check';
if (is(info, { browser: 'chrome', os: 'android', device: 'mobile' })) {
  info.browser.name; // narrowed to 'chrome'
}
```

Keys combine with AND, and an array combines with OR. The query keys are `browser`, `family`, `mode`, `engine`, `os`, `device`, `vendor`, `client`, `clientType`, `context`, `contextType` and `app`. A misspelled id fails to compile.

`isBot(info)` is still there and still means `bot`, `crawler` or `ai-crawler`.

### Every removed export

Browsers.

| 3.x | 4.0 |
| --- | --- |
| `isChrome` | `is(info, { browser: 'chrome' })` |
| `isChromium` | `is(info, { browser: 'chromium' })` |
| `isSafari` | `is(info, { browser: 'safari' })` |
| `isFirefox` | `is(info, { browser: 'firefox' })` |
| `isEdge` | `is(info, { browser: 'edge' })` |
| `isOpera` | `is(info, { browser: 'opera' })` |
| `isSamsungInternet` | `is(info, { browser: 'samsung-internet' })` |
| `isBrave` | `is(info, { browser: 'brave' })` |
| `isVivaldi` | `is(info, { browser: 'vivaldi' })` |
| `isMiBrowser` | `is(info, { browser: 'mi-browser' })` |
| `isHuaweiBrowser` | `is(info, { browser: 'huawei-browser' })` |
| `isUCBrowser` | `is(info, { browser: 'uc-browser' })` |
| `isYandexBrowser` | `is(info, { browser: 'yandex-browser' })` |
| `isArc` | `is(info, { browser: 'arc' })` |

Operating systems.

| 3.x | 4.0 |
| --- | --- |
| `isAndroid` | `is(info, { os: 'android' })` |
| `isIOS` | `is(info, { os: 'ios' })` |
| `isIPadOS` | `is(info, { os: 'ipados' })` |
| `isWindows` | `is(info, { os: 'windows' })` |
| `isMacOS` | `is(info, { os: 'macos' })` |
| `isLinux` | `is(info, { os: 'linux' })` |
| `isChromeOS` | `is(info, { os: 'chromeos' })` |
| `isHarmonyOS` | `is(info, { os: 'harmonyos' })` |
| `isKaiOS` | `is(info, { os: 'kaios' })` |
| `isTizen` | `is(info, { os: 'tizen' })` |

Devices.

| 3.x | 4.0 |
| --- | --- |
| `isMobile` | `is(info, { device: 'mobile' })` |
| `isTablet` | `is(info, { device: 'tablet' })` |
| `isDesktop` | `is(info, { device: 'desktop' })` |
| `isSmartTV` | `is(info, { device: 'smart-tv' })` |
| `isConsole` | `is(info, { device: 'console' })` |
| `isWearable` | `is(info, { device: 'wearable' })` |
| `isXR` | `is(info, { device: 'xr' })` |
| `isEmbeddedDevice` | `is(info, { device: 'embedded' })` |

Clients.

| 3.x | 4.0 |
| --- | --- |
| `isCrawler` | `is(info, { clientType: ['crawler', 'ai-crawler'] })` |
| `isAICrawler` | `is(info, { clientType: 'ai-crawler' })` |
| `isAIAssistant` | `is(info, { clientType: 'ai-assistant' })` |
| `isAutomation` | `is(info, { clientType: 'automation' })` |
| `isHttpClient` | `is(info, { clientType: 'http-client' })` |
| `isEmailClient` | `is(info, { clientType: 'email-client' })` |
| `isMediaPlayer` | `is(info, { clientType: 'media-player' })` |

Modes and contexts.

| 3.x | 4.0 |
| --- | --- |
| `isWebView` | `is(info, { mode: 'webview' })` |
| `isHeadless` | `is(info, { mode: 'headless' })` |
| `isInAppBrowser` | `is(info, { contextType: 'in-app-browser' })` |
| `isPWA` | `is(info, { contextType: 'pwa' })` |
| `isLine` | `is(info, { app: 'line' })` |
| `isLiff` | `is(info, { context: 'liff' })` |
| `isFacebook` | `is(info, { app: 'facebook' })` |
| `isInstagram` | `is(info, { app: 'instagram' })` |
| `isMessenger` | `is(info, { app: 'messenger' })` |
| `isWeChat` | `is(info, { app: 'wechat' })` |

Generic helpers.

| 3.x | 4.0 |
| --- | --- |
| `isBrowser` | `is(info, { browser: id })` |
| `isBrowserFamily` | `is(info, { family })` |
| `isBrowserMode` | `is(info, { mode })` |
| `isEngine` | `is(info, { engine })` |
| `isOS` | `is(info, { os })` |
| `isDevice` | `is(info, { device })` |
| `isClient` | `is(info, { clientType })` |
| `isContext` | `is(info, { context })` |

Values, helpers and types.

| 3.x | 4.0 |
| --- | --- |
| `parseVersion` | Read `info.<dimension>.version`, which has `full`, `major`, `minor` and `patch`. |
| `BrowserId` | Use the string id (`'chrome'`) and the `BrowserId` type. |
| `EngineId` | Use the string id (`'blink'`) and the `EngineId` type. |
| `OSId` | Use the string id (`'android'`) and the `OSId` type. |
| `CPUArchitecture` | Use the string id (`'arm64'`) and the `CPUArchitecture` type. |
| `ContextId` | Use the string id (`'liff'`) and the `ContextId` type. |
| `readHeader` | Not public. Use `parseRequest(headers)`. |
| `ProductInfo` | Removed with `context.host`. Use `context.app` and `context.version`. |

### Result changes

| Field | 3.x | 4.0 |
| --- | --- | --- |
| `Version` | `{ full, major: number \| null }` | `{ full, major: number, minor: number \| null, patch: number \| null }`. A string with no leading integer is `null`, not a version. |
| `device.vendor` | display text such as `'Samsung'` | stable lowercase id such as `'samsung'`. Display text is `labels.vendor.samsung`. |
| `client.name` | open string | a listed client id or `null`. An unlisted bot has `name: null` and its product name in `client.token`. |
| `client.name` for AI assistants | `'ai-assistant'` for all of them | `'chatgpt-user'`, `'claude-user'` and `'perplexity-user'`. Use `client.type === 'ai-assistant'` for the category. |
| `context.host` | `{ name, version }` | removed. `context.app` is the hosting app and `context.version` its version. |
| `context.name` | `'line'` or `'liff'` | unchanged. `app` is `'line'` for both. |
| `os.version` for Windows XP and Vista | `'XP'` or `'Vista'` | `null`. They are not versions. |
| `os.version` for Windows 11 from Client Hints | `'15.0.0'` | `'11'`, the same scale as the User-Agent. |
| `parse(undefined)` | `ua` was `undefined` | accepted. `ua` is `''`. |

### Display text: `labels`

Results carry ids. For a person, import the display names from `user-agent-parser-ts/labels`.

```ts
import {{ labels }} from 'user-agent-parser-ts/labels';

labels.browser[info.browser.name]; // 'Google Chrome'
labels.vendor.samsung;             // 'Samsung'
```

### Behavior that changed

- An unlisted Chromium fork reports `browser.name: null` and `family: 'chromium'` instead of `chrome`. Edge Legacy reports `edge`. The Android stock browser reports no browser.
- Safari needs an Apple OS.
- `detect()` throws outside a browser window or worker, including on Node.js 21 and later.
- A Client Hints brand such as `Brave` or `Edge` now replaces a Samsung Internet User-Agent.
- A mobile hint no longer turns an iPad into mobile, and a hint model brings its own vendor.
- A model that matched only an old catch-all vendor rule has no vendor now.
- HarmonyOS keeps its identity when a hint says Android.
- Android TV and Fire TV are `smart-tv`.
- Detection reads the first 1,024 characters of a User-Agent.

### Fixed in 3.0.1 and 4.0

- Super-linear regular expressions that blocked the event loop on large headers.
- `device.model` was `K` for the Chrome reduced User-Agent, `rv:126.0` for Firefox on Android, and `HarmonyOS` for Huawei.
- `my-command-line/1.2.3` reported a LINE in-app browser.
- A phone brand ending in `bot` was a bot.

### Deep paths

The files moved from `dist/*/v3/*` to `dist/*/*`. Import only the package subpaths (`user-agent-parser-ts`, `/check`, `/server`, `/browser`, `/labels`). The export map does not expose files.

---

# Migrating from ua-info v2 to user-agent-parser-ts v3

## Package rename

The package is now published as `user-agent-parser-ts`. Replace `ua-info` with `user-agent-parser-ts` in `package.json` and in every import specifier, including the `/check`, `/browser`, and `/server` subpaths.

```bash
npm uninstall ua-info
npm install user-agent-parser-ts
```


`user-agent-parser-ts` v3 is intentionally breaking. The new API is parser-first, uses fixed-shape results, and moves predicates to `user-agent-parser-ts/check`.

## Result model

`UAResult` is replaced by `UAInfo`. Every top-level dimension is always present; unknown fields are `null` instead of making the whole dimension nullable.

```ts
// v2
result.browser?.id
result.os?.id
result.browser?.version?.raw

// v3
result.browser.name
result.os.name
result.browser.version?.full
```

Stable identity fields use lowercase machine names. Xiaomi Browser is now `mi-browser` instead of `xiaomi-browser`.

## Parser and predicates

```ts
// v2
import { BrowserId, isBrowser, parse } from 'user-agent-parser-ts';
if (isBrowser(parse(ua), BrowserId.Chrome)) {}

// v3
import { BrowserId, parse } from 'user-agent-parser-ts';
import { isBrowser } from 'user-agent-parser-ts/check';
if (isBrowser(parse(ua), BrowserId.Chrome)) {}
```

Generic predicate renames include `isOperatingSystem()` -> `isOS()` and `isDeviceType()` -> `isDevice()`. Named helpers such as `isChrome()`, `isAndroid()`, `isMobile()`, `isLine()`, and `isLiff()` are exported from `user-agent-parser-ts/check`.

## Browser runtime detection

```ts
// v2
import { detectCurrent } from 'user-agent-parser-ts/browser';
const info = await detectCurrent();

// v3
import { detect } from 'user-agent-parser-ts/browser';
const info = await detect();
```

High-entropy Client Hints are no longer requested by default. Opt in with `detect({ highEntropy: true })`.

## LINE and LIFF

A LINE-looking User-Agent can establish a LINE in-app context, but pure User-Agent parsing no longer claims that the page is running inside LIFF. LIFF requires runtime evidence:

```ts
const info = await detect({ liff });
```

where the adapter provides `liff.isInClient()`.

## Server requests and Client Hints

`parseRequest()` accepts either a header source directly or a Request-like object:

```ts
import { parseRequest } from 'user-agent-parser-ts/server';

parseRequest({ 'user-agent': ua, 'sec-ch-ua': ch });
parseRequest({ headers: request.headers });
```

It consumes supported `Sec-CH-UA-*` headers already present in the request. It does not emit or manage `Accept-CH`, `Critical-CH`, `Permissions-Policy`, or response caching headers.

## Removed embedded application context

The generic v2 embedded application context/browser mode is not part of the initial v3 contract. `DeviceType.'embedded'` remains only a hardware classification. Electron, Capacitor, and Cordova are not automatically classified as an embedded application context.
