# ua-inspect

[![npm version](https://img.shields.io/npm/v/ua-inspect.svg)](https://www.npmjs.com/package/ua-inspect)
[![CI](https://github.com/petechatchawan/ua-inspect/actions/workflows/ci.yml/badge.svg)](https://github.com/petechatchawan/ua-inspect/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/ua-inspect.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-blue.svg)](https://www.typescriptlang.org/)

**ua-inspect** is a zero-dependency TypeScript User-Agent parser with browser, operating-system, device, bot/client, WebView, in-app context, and User-Agent Client Hints support.

```ts
import { parse } from 'ua-inspect';
import { is, isBot } from 'ua-inspect/check';

const info = parse(userAgent);

if (is(info, { browser: 'chrome-mobile', os: 'android', device: 'mobile' })) {
  info.browser.name; // narrowed to 'chrome-mobile'
}
if (isBot(info)) return new Response(null, { status: 403 });
```

## Installation

```bash
npm install ua-inspect
```

Node.js 18 or newer is required for server-side usage. TypeScript declarations, ESM, and CommonJS exports are included.

## Entry points

| Use case                          | Import               | Main API          |
| --------------------------------- | -------------------- | ----------------- |
| Pure User-Agent parsing           | `ua-inspect`         | `parse()`         |
| Queries                           | `ua-inspect/check`   | `is()`, `isBot()` |
| HTTP request + Client Hints       | `ua-inspect/server`  | `parseRequest()`  |
| Current browser + runtime signals | `ua-inspect/browser` | `detect()`        |
| Display names                     | `ua-inspect/labels`  | `labels`          |

### Pure parser

```ts
import { parse } from 'ua-inspect';

const info = parse(userAgent);

info.browser.name;     // 'chrome'
info.browser.version;  // { full: '130.0.6723.92', major: 130, minor: 0, patch: 6723 }
info.os.name;          // 'android'
info.device;           // { type: 'mobile', vendor: 'samsung', model: 'SM-S928B' }
```

`parse()` is synchronous, deterministic, and does not access browser globals, HTTP headers, cookies, storage, or the network. It accepts `string`, `null` and `undefined` and never throws. Detection reads at most the first 1,024 characters, so oversized input cannot slow it down. `info.ua` still holds the full string.

### Server requests

```ts
import { parseRequest } from 'ua-inspect/server';

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

It consumes the supported `Sec-CH-UA-*` headers that are already present. It does **not** emit or manage `Accept-CH`, `Critical-CH`, `Permissions-Policy`, caching headers, or framework response behavior. Each header is read up to 1,024 characters.

### Current browser

```ts
import { detect } from 'ua-inspect/browser';

const info = await detect();
```

By default, `detect()` uses the User-Agent plus the available low-entropy Client Hints. It does not request high-entropy hints. For diagnostics that need more detail:

```ts
const info = await detect({ highEntropy: true });
```

The high-entropy opt-in requests exactly `architecture`, `bitness`, `fullVersionList`, `model` and `platformVersion`.

`detect()` also reads `platform` and `maxTouchPoints`. Safari sends no Client Hints, so this is the only way to spot an iPad in desktop mode, which sends a Macintosh User-Agent. A Mac reports no touch points, so a desktop Mac is never turned into an iPad.

`detect()` throws outside a browser window or worker. This includes Node.js 21 and later, which define `navigator`. Use `parse()` or `parseRequest()` during SSR or other non-browser execution.

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
info.client;  // { type: null, name: null, token: null, version: null }
info.context; // { type: null, name: null, app: null, version: null }
```

Versions use one shape. A version is a product or platform version, not SemVer:

```ts
type Version = {
  full: string;
  major: number;
  minor: number | null;
  patch: number | null;
};
```

A string with no leading integer is not a version, so the field is `null`.

### Stable identities

Every identity is a lowercase stable id, and every id is a type:

```ts
info.browser.name === 'chrome';
info.os.name === 'android';
info.engine.name === 'blink';
info.device.type === 'mobile';
info.device.vendor === 'samsung';
```

Use ids for program logic. For a person, use `labels`:

```ts
import { labels } from 'ua-inspect/labels';

labels.browser[info.browser.name];  // 'Google Chrome'
labels.vendor.samsung;              // 'Samsung'
```

`browser.name` and `browser.family` are independent evidence fields. Both of these states are valid:

```ts
// Product known, lineage not established.
{ name: 'brave', family: null }

// Chromium lineage known, product not established.
{ name: null, family: 'chromium' }
```

The parser does not invent a family to fill a field. A Chromium fork that has no catalog row reports `name: null, family: 'chromium'`, never `chrome`.

`device.model` is the raw string the device reported. It is never normalized or invented, and placeholders such as `K` are not models.

`client.name` is a listed client id, or `null` for a bot that no row lists. `client.token` is the lowercased product name from the User-Agent, so an unlisted bot still has a name to log.

`context.name` is what the page runs as and `context.app` is the native app that hosts it. They differ only for a mini-app: LIFF has `name: 'liff'` and `app: 'line'`.

### Browsers

| Browser               | Id                 |
| --------------------- | ------------------ |
| Google Chrome         | `chrome`           |
| Chrome Mobile         | `chrome-mobile`    |
| Chromium              | `chromium`         |
| Android Browser       | `android-browser`  |
| Safari                | `safari`           |
| Safari Mobile         | `safari-mobile`    |
| Firefox               | `firefox`          |
| Firefox Mobile        | `firefox-mobile`   |
| Microsoft Edge        | `edge`             |
| Microsoft Edge Legacy | `edge-legacy`      |
| Internet Explorer     | `ie`               |
| Opera                 | `opera`            |
| Opera GX              | `opera-gx`         |
| Opera Mini            | `opera-mini`       |
| Opera Mobi            | `opera-mobi`       |
| Opera Tablet          | `opera-tablet`     |
| Samsung Internet      | `samsung-internet` |
| Brave                 | `brave`            |
| Vivaldi               | `vivaldi`          |
| Arc                   | `arc`              |
| Whale                 | `whale`            |
| DuckDuckGo Browser    | `duckduckgo`       |
| Ecosia                | `ecosia`           |
| Pale Moon             | `pale-moon`        |
| Puffin                | `puffin`           |
| QQ Browser            | `qq`               |
| 360 Browser           | `360`              |
| Coc Coc               | `coc-coc`          |
| Mi Browser            | `mi-browser`       |
| Huawei Browser        | `huawei-browser`   |
| UC Browser            | `uc-browser`       |
| Yandex Browser        | `yandex-browser`   |
| Vivo Browser          | `vivo-browser`     |

Android WebView is `browser.mode === 'webview'`, not a separate browser.

Chrome on a phone is `chrome-mobile`, and Safari on iOS or iPadOS is `safari-mobile`. Desktop and tablet builds stay `chrome` and `safari`. A phone build carries the `Mobile` token; both rows are fallbacks, so a specific product such as Samsung Internet or a specific fork still wins. Firefox on Android, iOS or iPadOS is `firefox-mobile`.

The stock Android browser is `android-browser`. It is the only client that sends a `Version/` token on Android with no Chrome token. Android 4.4 rebuilt it on Chromium, so those builds carry `Chrome/` and stay `chrome-mobile`, which a modern in-app WebView also reports.

### Supported dimensions

| Dimension          | Count | Ids                                                                                                                                                                                                                         |
| ------------------ | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Browser            | 33    | the table above                                                                                                                                                                                                             |
| Rendering engine   | 5     | `blink`, `edgehtml`, `gecko`, `presto`, `webkit`                                                                                                                                                                            |
| Operating system   | 20    | `android`, `ios`, `ipados`, `windows`, `macos`, `linux`, `chromeos`, `harmonyos`, `openharmony`, `fuchsia`, `tizen`, `kaios`, `blackberry`, `symbian`, `webos`, `windows-phone`, `firefox-os`, `steamos`, `tvos`, `watchos` |
| Device type        | 8     | `desktop`, `mobile`, `tablet`, `smart-tv`, `console`, `wearable`, `xr`, `embedded`                                                                                                                                          |
| In-app context     | 9     | `line`, `facebook`, `instagram`, `tiktok`, `tiktok-lite`, `twitter`, `discord`, `messenger`, `wechat`                                                                                                                       |
| Non-browser client | 31    | `labels.client`                                                                                                                                                                                                             |
| CPU architecture   | 8     | `x86`, `x86_64`, `arm`, `arm64`, `mips`, `powerpc`, `sparc`, `riscv`                                                                                                                                                        |
| Device vendor      | 22    | `labels.vendor`                                                                                                                                                                                                             |

`labels` maps every id to display text.

## Queries

`is(info, query)` is the one way to ask a question. Keys combine with AND, and the values of one key combine with OR:

```ts
import { is } from 'ua-inspect/check';

is(info, { browser: 'chrome' });
is(info, { browser: 'chrome-mobile' });      // Chrome on a phone
is(info, { browser: ['chrome', 'edge'], os: 'windows' });
is(info, { family: 'chromium', mode: 'webview' });
is(info, { clientType: ['crawler', 'ai-crawler'] });
is(info, { app: 'line' });   // the LINE in-app browser or LIFF
is(info, { context: 'liff' });
```

The keys are `browser`, `family`, `mode`, `engine`, `os`, `device`, `vendor`, `client`, `clientType`, `context`, `contextType` and `app`. `is()` narrows every field that the query names, and a misspelled id fails to compile:

```ts
if (is(info, { browser: 'chrome' })) {
  const name: 'chrome' = info.browser.name;
}

is(info, { browser: 'chrom' });    // error
is(info, { browser: 'android' });  // error: an OS id is not a browser id
is(info, { vendor: 'Samsung' });   // error: vendor ids are lowercase
```

An unknown field never matches. `device: 'tablet'` is exact, so a tablet is not `mobile`.

`isBot(info)` is true for the client types `bot`, `crawler` and `ai-crawler`. The types are:

| Type                           | Meaning                                                  |
| ------------------------------ | -------------------------------------------------------- |
| `crawler`                      | Fetches pages to build a search or preview index.        |
| `ai-crawler`                   | Fetches pages to train or ground an AI model.            |
| `ai-assistant`                 | Fetches one page because a person asked an assistant to. |
| `bot`                          | An automated agent that no row classifies.               |
| `automation`                   | Drives a browser.                                        |
| `http-client`, `library`       | Make raw requests.                                       |
| `email-client`, `media-player` | Desktop applications.                                    |

Predicate results describe parsed evidence. They do not authenticate a browser, bot, application, or request origin.

## LINE and LIFF

LINE and LIFF are different concepts. Pure User-Agent parsing may establish a LINE in-app browser:

```ts
const info = parse(lineUserAgent);

is(info, { context: 'line' }); // true
is(info, { context: 'liff' }); // false: User-Agent text alone does not prove LIFF
is(info, { app: 'line' });     // true
```

LIFF is established only from browser runtime evidence. Pass a structural adapter; the package does not depend on `@line/liff`:

```ts
import liff from '@line/liff';
import { detect } from 'ua-inspect/browser';

const info = await detect({ liff });

if (is(info, { context: 'liff' })) {
  // Runtime-confirmed LIFF: type 'mini-app', name 'liff', app 'line'.
}
```

The adapter only needs `isInClient(): boolean`. If it is absent, returns `false`, or throws, no LIFF result is produced.

## Client Hints merge behavior

Adapters normalize browser `userAgentData` or HTTP headers into one internal shape. Evidence from the User-Agent and from Client Hints competes under one rule. A specific product beats a generic one, a stronger source beats a weaker one, and a conflict that cannot be settled gives no identity instead of a guess:

- A generic `Chromium` brand never replaces a specific product such as Mi Browser. It only establishes the family.
- A `Brave` or `Edge` brand refines a Chrome-like User-Agent.
- A `Google Chrome` brand never replaces a specific product.
- An Android hint never replaces HarmonyOS.
- A mobile hint never turns an iPad into mobile, but it replaces a generic guess.
- A hint model brings its own vendor, and the User-Agent vendor is never kept for a different model.
- Windows versions use one marketing scale. A `platformVersion` of 13 or more is Windows 11.

Applications remain responsible for Client Hints negotiation and cache behavior.

## What a User-Agent cannot tell you

These are limits of the string, not parser defects:

- macOS reports the frozen version `10.15.7`, and Windows 11 reports `10`. Only Client Hints (`parseRequest`, or `detect({ highEntropy: true })`) give the real version.
- An iPad in desktop mode sends a Macintosh User-Agent, so `parse()` and `parseRequest()` report a Mac. Only `detect()` recovers it: a Mac-like platform that reports touch points is an iPad.
- Chrome reports a fixed Android version and no model in its reduced User-Agent.
- Chrome, Chrome Mobile and Chromium before version 28 report the `webkit` engine; version 28 is the first Blink release. The Blink engine version is `null`. It equals the Chrome version, so use `browser.version`.

## CommonJS

```js
const { parse } = require('ua-inspect');
const { is } = require('ua-inspect/check');

const info = parse(userAgent);
if (is(info, { browser: 'chrome-mobile', device: 'mobile' })) {
  // ...
}
```

## Real-world usage

### Block bots in an Express middleware

```ts
import express from 'express';
import { parseRequest } from 'ua-inspect/server';
import { isBot } from 'ua-inspect/check';

const app = express();

app.use((req, res, next) => {
  const info = parseRequest(req.headers);
  if (isBot(info)) return res.status(403).end();
  next();
});
```

### Group analytics with display names

```ts
import { parse } from 'ua-inspect';
import { labels } from 'ua-inspect/labels';

const info = parse(userAgent);

const browser = info.browser.name ? labels.browser[info.browser.name] : 'Unknown';
const os = info.os.name ? labels.os[info.os.name] : 'Unknown';
const device = info.device.type ? labels.device[info.device.type] : 'Unknown';

track('page_view', { browser, os, device });
```

`labels` is display text. Log the ids (`info.browser.name`), not the labels, when the value feeds a query.

### Branch on LINE without a hard dependency

```ts
import { parse } from 'ua-inspect';
import { is } from 'ua-inspect/check';

const info = parse(userAgent);

if (is(info, { context: ['line', 'liff'] })) {
  // The page runs inside LINE, in the in-app browser or as a mini-app.
}
```

### Parse a Request in a worker or edge runtime

```ts
import { parseRequest } from 'ua-inspect/server';

export default {
  async fetch(request: Request) {
    const info = parseRequest(request);
    return Response.json(info);
  },
};
```

`parseRequest()` also reads Client Hints headers when your platform forwards them.

### Read high-entropy detail in the browser

```ts
import { detect } from 'ua-inspect/browser';

const info = await detect({ highEntropy: true });

info.cpu;    // { architecture: 'arm64', bitness: 64 }
info.device; // { type: 'mobile', vendor: 'samsung', model: 'SM-S928B' }
```

High-entropy hints are an opt-in round trip to the browser, so request them only when you need the extra fields.

## Adding a browser, bot, vendor or app

Detection data lives in `src/catalog/`, one file per dimension, and rows are data, not code. A row cannot hold a regular expression, and ESLint rejects one in `src`. The id type, the `is()` query type, the Client Hints maps and `labels` all come from the rows.

1. Add the row to the catalog file, for example `whale: { label: 'Naver Whale', family: 'chromium', engine: 'blink', brands: [], match: ['Whale'] }` in `src/catalog/browsers.ts`.
2. Add a **real** captured string to `test/data/user-agents.json`: `{ "id": "whale-desktop", "ua": "Mozilla/5.0 (...)", "src": "observed:<where>@<date>", "expect": { "browser": { "name": "whale" } } }`. Nothing composed belongs there. A real string for one dimension goes in `test/data/<dimension>/<name>.json` instead (for example `browser/chrome.json`), with no `src`. Each file holds only the strings for that name. Both are read by the same runner, one row per case, and `note` explains any deliberate difference.
3. Run `npm test`. The row's `beats` references must exist, every id needs a label, every entry in `user-agents.json` must name its capture in `src`, and the new string must parse as its `expect` says.

## Trust boundary

User-Agent strings and Client Hints are client-provided claims. Detection is useful for compatibility, diagnostics, analytics, and UX branching, but it is not authentication or a security boundary.

Do not use a detected browser, device, bot, LINE context, or other identity as proof that a request originates from that product or platform.

## License

MIT
