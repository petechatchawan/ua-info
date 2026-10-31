# user-agent-parser-ts

[![npm version](https://img.shields.io/npm/v/user-agent-parser-ts.svg)](https://www.npmjs.com/package/user-agent-parser-ts)
[![CI](https://github.com/petechatchawan/ua-info/actions/workflows/ci.yml/badge.svg)](https://github.com/petechatchawan/ua-info/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/user-agent-parser-ts.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-blue.svg)](https://www.typescriptlang.org/)

**user-agent-parser-ts** (formerly `ua-info`) is a zero-dependency TypeScript User-Agent parser with browser, operating-system, device, bot/client, WebView, in-app context, and User-Agent Client Hints support.

```ts
import { parse } from 'user-agent-parser-ts';
import { is, isBot } from 'user-agent-parser-ts/check';

const info = parse(userAgent);

if (is(info, { browser: 'chrome', os: ['android', 'harmonyos'], device: 'mobile' })) {
  info.browser.name; // narrowed to 'chrome'
}
if (isBot(info)) return new Response(null, { status: 403 });
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
| Queries | `user-agent-parser-ts/check` | `is()`, `isBot()` |
| HTTP request + Client Hints | `user-agent-parser-ts/server` | `parseRequest()` |
| Current browser + runtime signals | `user-agent-parser-ts/browser` | `detect()` |
| Display names | `user-agent-parser-ts/labels` | `labels` |

### Pure parser

```ts
import { parse } from 'user-agent-parser-ts';

const info = parse(userAgent);

info.browser.name;     // 'chrome'
info.browser.version;  // { full: '130.0.6723.92', major: 130, minor: 0, patch: 6723 }
info.os.name;          // 'android'
info.device;           // { type: 'mobile', vendor: 'samsung', model: 'SM-S928B' }
```

`parse()` is synchronous, deterministic, and does not access browser globals, HTTP headers, cookies, storage, or the network. It accepts `string`, `null` and `undefined` and never throws. Detection reads at most the first 1,024 characters, so oversized input cannot slow it down. `info.ua` still holds the full string.

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

It consumes the supported `Sec-CH-UA-*` headers that are already present. It does **not** emit or manage `Accept-CH`, `Critical-CH`, `Permissions-Policy`, caching headers, or framework response behavior. Each header is read up to 1,024 characters.

### Current browser

```ts
import { detect } from 'user-agent-parser-ts/browser';

const info = await detect();
```

By default, `detect()` uses the User-Agent plus the available low-entropy Client Hints. It does not request high-entropy hints. For diagnostics that need more detail:

```ts
const info = await detect({ highEntropy: true });
```

The high-entropy opt-in requests exactly `architecture`, `bitness`, `fullVersionList`, `model` and `platformVersion`.

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
import { labels } from 'user-agent-parser-ts/labels';

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

| Browser | Id |
| --- | --- |
| Google Chrome | `chrome` |
| Chromium | `chromium` |
| Safari | `safari` |
| Firefox | `firefox` |
| Microsoft Edge (including Edge Legacy) | `edge` |
| Opera (including Opera Mini) | `opera` |
| Samsung Internet | `samsung-internet` |
| Brave | `brave` |
| Vivaldi | `vivaldi` |
| Mi Browser | `mi-browser` |
| Huawei Browser | `huawei-browser` |
| UC Browser | `uc-browser` |
| Yandex Browser | `yandex-browser` |
| Arc | `arc` |

Android WebView is `browser.mode === 'webview'`, not a separate browser. Operating systems, devices, clients and contexts are listed in `labels`.

## Queries

`is(info, query)` is the one way to ask a question. Keys combine with AND, and the values of one key combine with OR:

```ts
import { is } from 'user-agent-parser-ts/check';

is(info, { browser: 'chrome' });
is(info, { browser: ['chrome', 'edge'], os: 'android' });
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

| Type | Meaning |
| --- | --- |
| `crawler` | Fetches pages to build a search or preview index. |
| `ai-crawler` | Fetches pages to train or ground an AI model. |
| `ai-assistant` | Fetches one page because a person asked an assistant to. |
| `bot` | An automated agent that no row classifies. |
| `automation` | Drives a browser. |
| `http-client`, `library` | Make raw requests. |
| `email-client`, `media-player` | Desktop applications. |

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
import { detect } from 'user-agent-parser-ts/browser';

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
- An iPad in desktop mode sends a Macintosh User-Agent, so it is reported as a Mac.
- Chrome reports a fixed Android version and no model in its reduced User-Agent.
- The Blink engine version is `null`. It equals the Chrome version, so use `browser.version`.

## CommonJS

```js
const { parse } = require('user-agent-parser-ts');
const { is } = require('user-agent-parser-ts/check');

const info = parse(userAgent);
if (is(info, { browser: 'chrome', device: 'mobile' })) {
  // ...
}
```

## Adding a browser, bot, vendor or app

Detection data lives in `src/catalog/`, one file per dimension, and rows are data, not code. A row cannot hold a regular expression, and ESLint rejects one in `src`. The id type, the `is()` query type, the Client Hints maps and `labels` all come from the rows.

1. Add the row to the catalog file, for example `whale: { label: 'Naver Whale', family: 'chromium', engine: 'blink', brands: [], match: ['Whale'] }` in `src/catalog/browsers.ts`.
2. Add a real User-Agent for it: `npm run build && npm run corpus:add -- --topic browsers --id whale-desktop --src "observed:<where>@<date>" "<User-Agent>"`. See `test/corpus/README.md`.
3. Run `npm test`. The row must be the result of at least one corpus entry, its `beats` references must exist, and every id needs a label.

## Trust boundary

User-Agent strings and Client Hints are client-provided claims. Detection is useful for compatibility, diagnostics, analytics, and UX branching, but it is not authentication or a security boundary.

Do not use a detected browser, device, bot, LINE context, or other identity as proof that a request originates from that product or platform.

## Migration

See [MIGRATION.md](MIGRATION.md) for the 3.x to 4.0 changes, with a replacement for every removed export, and for the older 2.x changes.

## License

MIT
