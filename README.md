# user-agent-parser-ts

[![npm version](https://img.shields.io/npm/v/user-agent-parser-ts.svg)](https://www.npmjs.com/package/user-agent-parser-ts)
[![CI](https://github.com/petechatchawan/ua-info/actions/workflows/ci.yml/badge.svg)](https://github.com/petechatchawan/ua-info/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/user-agent-parser-ts.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-blue.svg)](https://www.typescriptlang.org/)

**user-agent-parser-ts** (formerly `ua-info`) is a zero-dependency TypeScript User-Agent parser with browser, operating-system, device, bot/client, WebView, in-app context, and User-Agent Client Hints support.

The API has one main mental model:

```text
parse -> info -> check
```

```ts
import { parse } from 'user-agent-parser-ts';
import { isAndroid, isChrome, isMobile } from 'user-agent-parser-ts/check';

const info = parse(userAgent);

if (isChrome(info) && isAndroid(info) && isMobile(info)) {
  // browser-specific flow
}
```

## Installation

```bash
npm install user-agent-parser-ts
```

Node.js 18 or newer is required for server-side usage. TypeScript declarations, ESM, and CommonJS exports are included.

## Entry points

| Use case | Import | Main API |
| --- | --- | --- |
| Pure User-Agent parsing | `user-agent-parser-ts` | `parse()` |
| Predicates | `user-agent-parser-ts/check` | `isChrome()`, `isMobile()`, ... |
| HTTP request + Client Hints | `user-agent-parser-ts/server` | `parseRequest()` |
| Current browser + runtime signals | `user-agent-parser-ts/browser` | `detect()` |

### Pure parser

```ts
import { parse } from 'user-agent-parser-ts';

const info = parse(userAgent);

console.log(info.browser.name);
console.log(info.os.name);
console.log(info.device.type);
```

`parse()` is synchronous, deterministic, and does not access browser globals, HTTP headers, cookies, storage, or the network.

### Server requests

```ts
import { parseRequest } from 'user-agent-parser-ts/server';

const info = parseRequest(request);
```

`parseRequest()` accepts a Request-like object, a `Headers`-like object, or a plain header record:

```ts
const info = parseRequest({
  'user-agent': userAgent,
  'sec-ch-ua': '"Chromium";v="150", "Google Chrome";v="150"',
  'sec-ch-ua-mobile': '?1',
  'sec-ch-ua-platform': '"Android"',
});
```

It consumes supported `Sec-CH-UA-*` headers that are already present. It does **not** emit or manage `Accept-CH`, `Critical-CH`, `Permissions-Policy`, caching headers, or framework response behavior.

### Current browser

```ts
import { detect } from 'user-agent-parser-ts/browser';

const info = await detect();
```

By default, `detect()` uses the User-Agent plus available low-entropy User-Agent Client Hints. It does not request high-entropy hints.

For diagnostics that need more detail:

```ts
const info = await detect({ highEntropy: true });
```

The high-entropy opt-in requests exactly:

```text
architecture
bitness
fullVersionList
model
platformVersion
```

`detect()` throws when no browser `navigator` is available. Use `parse()` or `parseRequest()` during SSR or other non-browser execution.

## Result model

`parse()`, `parseRequest()`, and `detect()` all return the same fixed-shape `UAInfo` object:

```ts
interface UAInfo {
  ua: string;
  browser: BrowserInfo;
  engine: EngineInfo;
  os: OSInfo;
  device: DeviceInfo;
  cpu: CPUInfo;
  client: ClientInfo;
  context: ContextInfo;
}
```

Top-level dimensions always exist. Unknown or unavailable values are `null`; there is no `"unknown"` sentinel.

```ts
const info = parse('');

info.browser; // { name: null, version: null, family: null, mode: null }
info.os;      // { name: null, version: null }
info.device;  // { type: null, vendor: null, model: null }
info.client;  // { type: null, name: null, version: null }
info.context; // { type: null, name: null, host: null }
```

Versions use one shape:

```ts
type Version = {
  full: string;
  major: number | null;
};
```

A version is a product/platform version string, not SemVer. `full` is the source value and `major` is the parsed leading integer when available.

### Stable identities

Machine identities are lowercase stable IDs:

```ts
info.browser.name === 'chrome';
info.os.name === 'android';
info.engine.name === 'blink';
info.device.type === 'mobile';
```

Use these IDs for program logic. Format them separately for UI labels.

`browser.name` and `browser.family` are independent evidence fields. Both of these states are valid:

```ts
// Product known, lineage not established.
{ name: 'brave', family: null }

// Chromium lineage known, exact product not established.
{ name: null, family: 'chromium' }
```

UA Info does not invent a browser family merely to fill a field.

`ClientInfo.name` is intentionally `string | null`, rather than a closed union. Bot, crawler, HTTP-client, library, and automation product names are open-ended and evolve too quickly for a stable exhaustive catalog.

## Browser support

UA Info prioritizes browsers with current meaningful usage plus active vendor/region browsers.

| Browser | Stable ID | Notes |
| --- | --- | --- |
| Google Chrome | `chrome` | Chromium family |
| Chromium | `chromium` | Chromium product itself |
| Safari | `safari` | Safari family |
| Firefox | `firefox` | Firefox family |
| Microsoft Edge | `edge` | Chromium family when established |
| Opera | `opera` | Chromium family |
| Samsung Internet | `samsung-internet` | Chromium family |
| Brave | `brave` | UA/Client-Hints evidence varies by platform |
| Vivaldi | `vivaldi` | Chromium family |
| Mi Browser | `mi-browser` | Xiaomi browser |
| Huawei Browser | `huawei-browser` | Huawei browser |
| UC Browser | `uc-browser` | Vendor/mobile browser |
| Yandex Browser | `yandex-browser` | Chromium family when established |
| Arc | `arc` | Identified only where reliable evidence is available |

Android WebView is represented through `browser.mode === 'webview'`, not as a separate browser identity.

Browser detection uses ordered, product-specific evidence before generic Chrome/Chromium fallback so derivative browsers are not silently collapsed into Chrome.

## Predicate API

Predicates live in `user-agent-parser-ts/check`, not in the package root.

```ts
import { parse } from 'user-agent-parser-ts';
import {
  isBrowser,
  isBrowserFamily,
  isChrome,
  isEdge,
  isAndroid,
  isMobile,
  isTablet,
  isLine,
} from 'user-agent-parser-ts/check';

const info = parse(userAgent);

isChrome(info);
isEdge(info);
isAndroid(info);
isMobile(info);
isTablet(info);
isBrowser(info, 'chrome');
isBrowserFamily(info, 'chromium');
```

Generic predicates are type guards:

```ts
if (isBrowser(info, 'chrome')) {
  const name: 'chrome' = info.browser.name;
}
```

### Browser predicates

Common named checks include:

```text
isChrome
isChromium
isSafari
isFirefox
isEdge
isOpera
isSamsungInternet
isBrave
isVivaldi
isMiBrowser
isHuaweiBrowser
isUCBrowser
isYandexBrowser
isArc
```

`isChromium(info)` means **the Chromium product itself**. It is false for Chrome, Edge, Brave, Opera, Mi Browser, and other Chromium derivatives.

Use this for Chromium lineage:

```ts
isBrowserFamily(info, 'chromium');
```

### Operating-system predicates

```text
isAndroid
isIOS
isIPadOS
isWindows
isMacOS
isLinux
isChromeOS
isHarmonyOS
isKaiOS
isTizen
```

### Device predicates

```text
isMobile
isTablet
isDesktop
isSmartTV
isConsole
isWearable
isXR
isEmbeddedDevice
```

Device checks are exact classifications. In particular:

```ts
// Tablet
isTablet(info); // true
isMobile(info); // false
```

`isMobile()` does not include tablets.

### Client predicates

```text
isBot
isCrawler
isAICrawler
isAIAssistant
isAutomation
isHttpClient
isEmailClient
isMediaPlayer
```

`isBot()` is an umbrella for `bot`, `crawler`, and `ai-crawler`. `isCrawler()` includes `crawler` and `ai-crawler`.

### Browser mode and context predicates

```text
isWebView
isHeadless
isInAppBrowser
isPWA
isLine
isLiff
isFacebook
isInstagram
isMessenger
isWeChat
```

Generic helpers are also available:

```ts
isBrowser(info, 'chrome');
isBrowserFamily(info, 'chromium');
isBrowserMode(info, 'webview');
isEngine(info, 'blink');
isOS(info, 'android');
isDevice(info, 'mobile');
isClient(info, 'crawler');
isContext(info, 'line');
```

Predicate results describe parsed evidence. They do not authenticate a browser, bot, application, or request origin.

## LINE and LIFF

LINE and LIFF are deliberately different concepts.

Pure User-Agent parsing may establish a LINE in-app browser:

```ts
import { parse } from 'user-agent-parser-ts';
import { isLiff, isLine } from 'user-agent-parser-ts/check';

const info = parse(lineUserAgent);

isLine(info); // true when LINE evidence is present
isLiff(info); // false: User-Agent text alone does not prove LIFF
```

LIFF is established only from browser runtime evidence. Pass a structural adapter; UA Info does not depend on `@line/liff`:

```ts
import liff from '@line/liff';
import { detect } from 'user-agent-parser-ts/browser';
import { isLiff, isLine } from 'user-agent-parser-ts/check';

const info = await detect({ liff });

if (isLine(info) && isLiff(info)) {
  // Runtime-confirmed LIFF browser execution.
}
```

The adapter only needs:

```ts
interface LiffAdapter {
  isInClient(): boolean;
}
```

If the adapter is absent, returns `false`, or throws, UA Info does not manufacture a LIFF result.

Runtime-confirmed LIFF is represented as:

```ts
context: {
  type: 'mini-app',
  name: 'liff',
  host: {
    name: 'line',
    version: Version | null,
  },
}
```

A LINE in-app browser detected from User-Agent evidence remains an `in-app-browser` context named `line`.

## Client Hints merge behavior

Adapters normalize browser UAData or HTTP headers into one structured internal Client Hints shape. Browser UAData is not serialized into fake HTTP headers.

Evidence is merged conservatively:

```text
explicit runtime evidence
        >
specific Client Hints evidence
        >
User-Agent evidence
        >
conservative fallback
        >
null
```

A more generic hint does not erase a more specific compatible identity. For example, a generic Chromium brand must not turn a detected Mi Browser into Chromium.

`parseRequest()` supports present values for:

```text
Sec-CH-UA
Sec-CH-UA-Mobile
Sec-CH-UA-Platform
Sec-CH-UA-Full-Version-List
Sec-CH-UA-Arch
Sec-CH-UA-Bitness
Sec-CH-UA-Model
Sec-CH-UA-Platform-Version
```

Applications remain responsible for Client Hints negotiation and cache behavior.

## CommonJS

```js
const { parse } = require('user-agent-parser-ts');
const { isChrome, isMobile } = require('user-agent-parser-ts/check');
const { parseRequest } = require('user-agent-parser-ts/server');

const info = parse(userAgent);

if (isChrome(info) && isMobile(info)) {
  // ...
}
```

## TypeScript example

```ts
import { BrowserId, parse, type UAInfo } from 'user-agent-parser-ts';
import { isBrowser } from 'user-agent-parser-ts/check';

function handle(info: UAInfo) {
  if (isBrowser(info, BrowserId.Chrome)) {
    const exact: typeof BrowserId.Chrome = info.browser.name;
    return exact;
  }

  return null;
}

handle(parse(userAgent));
```

## Trust boundary

User-Agent strings and Client Hints are client-provided claims. Detection is useful for compatibility, diagnostics, analytics, and UX branching, but it is not authentication or a security boundary.

Do not use a detected browser, device, bot, LINE context, or other identity as proof that a request originates from that product or platform.

## Migration from v2

v3 is intentionally breaking. See [MIGRATION.md](MIGRATION.md) for result-shape, predicate, browser-runtime, LINE/LIFF, and server Client Hints changes.

## License

MIT
