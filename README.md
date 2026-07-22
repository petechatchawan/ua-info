# UA Info

[![npm version](https://img.shields.io/npm/v/ua-info.svg)](https://www.npmjs.com/package/ua-info)
[![CI](https://github.com/petechatchawan/ua-info/actions/workflows/ci.yml/badge.svg)](https://github.com/petechatchawan/ua-info/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/ua-info.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-blue.svg)](https://www.typescriptlang.org/)

**UA Info** stands for **User-Agent Information**.

A zero-dependency TypeScript User-Agent information parser for browsers, devices, operating systems, bots, WebViews, in-app browsers, and User-Agent Client Hints.

```ts
import { parse } from 'ua-info';

const details = parse(navigator.userAgent);

console.log(details.browser?.name);
console.log(details.os?.name);
console.log(details.device.type);
```

## Why UA Info?

- **One stable result shape** for browsers, servers, bots, automation tools, and embedded web runtimes.
- **Separate identities** for the underlying browser, rendering engine, non-browser client, and host application.
- **Pure core parser**: `parse()` does not access browser globals and works in Node.js, SSR, tests, and workers.
- **Client Hints support** through dedicated server and browser entry points.
- **TypeScript declarations** for results, options, constants, and helper functions.
- **ESM and CommonJS** exports.
- **No runtime dependencies** and `sideEffects: false` for bundlers.

## Installation

```bash
npm install ua-info
```

```bash
pnpm add ua-info
```

```bash
yarn add ua-info
```

Requirements:

- Node.js 18 or newer for server-side usage.
- A modern browser or bundler for the browser entry point.
- TypeScript is optional; declarations are included.

## Quick start

### TypeScript / ESM

```ts
import { BrowserId, parse } from 'ua-info';

const details = parse(navigator.userAgent);

if (details.browser?.id === BrowserId.Chrome) {
  console.log(details.browser.version?.raw);
}
```

### CommonJS

```js
const { parse } = require('ua-info');

const details = parse(userAgent);
console.log(details.browser?.name);
```

## Choose the right entry point

| Use case | Import | Data source | Runtime detection |
| --- | --- | --- | --- |
| Parse a known User-Agent | `ua-info` | Supplied User-Agent string | No |
| Parse an HTTP request | `ua-info/server` | User-Agent and request Client Hints | No |
| Detect the current browser | `ua-info/browser` | User-Agent, browser Client Hints, and runtime signals | Yes |

### `parse()` — universal and pure

```ts
import { parse } from 'ua-info';

const details = parse(userAgent);
```

Use `parse()` when a User-Agent string is already available. It is synchronous and deterministic. It does not access `navigator`, `document`, `window`, headers, cookies, or network APIs.

### `parseRequest()` — server requests and Client Hints

```ts
import { parseRequest } from 'ua-info/server';

const details = parseRequest({
  headers: request.headers,
});
```

Use `parseRequest()` for incoming HTTP requests. It accepts either a Fetch-compatible `Headers` object or a plain header record. Available Client Hints can enrich browser versions, platform versions, device models, CPU architecture, and bitness.

### `detectCurrent()` — browser enrichment and PWA detection

```ts
import { detectCurrent } from 'ua-info/browser';

const details = await detectCurrent();
```

Use `detectCurrent()` inside a browser when runtime-only signals matter. It can read `navigator.userAgentData`, request selected high-entropy Client Hints, and detect standalone PWA mode.

`detectCurrent()` throws when no browser-like `navigator` exists. Use `parse()` or `parseRequest()` during SSR.

## Result mental model

The result keeps independent dimensions separate:

```text
browser  -> Browser product and execution mode
engine   -> Rendering engine
os       -> Operating system claim
device   -> Device class, vendor, and model claim
cpu      -> CPU architecture and bitness claim
client   -> Bot, crawler, automation tool, HTTP client, or library
context  -> Host app or surface such as LINE, LIFF, Electron, or a PWA
```

This separation matters in embedded environments. A LINE LIFF page can run in a Chrome WebView: Chrome remains the browser while LINE and LIFF are represented by the context.

### Ordinary Chrome

```ts
const details = parse(chromeUserAgent);

console.log(details.browser?.id);
console.log(details.client);
console.log(details.context);
```

For an ordinary Chrome request, `client` and `context` are normally `null`.

### LINE LIFF

```ts
const details = parse(lineLiffUserAgent);

console.log(details.browser?.id);
console.log(details.browser?.mode);
console.log(details.context?.kind);
console.log(details.context?.id);
console.log(details.context?.host?.id);
```

A typical result identifies Chrome in WebView mode, a `mini-app` context named `liff`, and LINE as the host.

### Non-browser client

```ts
const details = parse('GPTBot/1.2');

console.log(details.client?.kind);
console.log(details.client?.name);
console.log(details.client?.version?.raw);
```

A selected non-browser actor is returned in `client`; `browser` is normally `null` for a standalone bot or HTTP client.

## Common recipes

### Check a browser version

```ts
import {
  BrowserId,
  parse,
  satisfiesVersion,
} from 'ua-info';

const details = parse(userAgent);
const supported =
  details.browser?.id === BrowserId.Chrome &&
  satisfiesVersion(details.browser.version, '>=120');
```

Use stable IDs for program logic and names for display.

### Read the device class

```ts
const details = parse(userAgent);

const isTouchDevice =
  details.device.type === 'mobile' ||
  details.device.type === 'tablet';
```

Other device types are `desktop`, `smart-tv`, `console`, `wearable`, `xr`, `embedded`, and `unknown`.

`device` is always present. Unknown device information is represented as:

```ts
{
  type: 'unknown',
  vendor: null,
  model: null,
}
```

### Detect a WebView or headless browser

```ts
const details = parse(userAgent);

const isWebView = details.browser?.mode === 'webview';
const isHeadless = details.browser?.mode === 'headless';
```

Browser modes are:

```ts
type BrowserMode =
  | 'browser'
  | 'webview'
  | 'headless'
  | 'embedded'
  | 'unknown';
```

### Detect an in-app browser

```ts
const details = parse(userAgent);
const host = details.context?.host;

if (details.context?.kind === 'in-app-browser' && host) {
  console.log(`Opened inside ${host.name}`);
}
```

Known contexts include LINE, Facebook, Instagram, TikTok, X, WeChat, Telegram, Electron, Capacitor, Cordova, and runtime-detected standalone PWAs.

### Detect LINE and LIFF

```ts
const details = parse(navigator.userAgent);

const isLine = details.context?.host?.id === 'line';
const isLiff = details.context?.id === 'liff';
```

LINE stays in `context.host`; the underlying browser stays in `browser`.

### Detect bots, crawlers, and AI agents

```ts
const details = parse(request.headers.get('user-agent') ?? '');

if (details.client?.kind === 'crawler') {
  console.log(`Crawler: ${details.client.name}`);
}

if (details.client?.kind === 'ai-agent') {
  console.log(`AI agent: ${details.client.name}`);
}
```

Recognized clients include:

- AI agents such as GPTBot, ClaudeBot, PerplexityBot, and Google-Extended.
- Crawlers such as Googlebot, Bingbot, AhrefsBot, SemrushBot, Applebot, and CCBot.
- Automation tools such as Playwright, Puppeteer, and Selenium.
- HTTP clients such as curl, Wget, Postman, and HTTPie.
- Libraries such as Axios, Python Requests, and OkHttp.
- Email and media clients such as Thunderbird and VLC.
- Generic `bot`, `spider`, or `crawler` tokens as a fallback.

`client` contains one selected non-browser actor. Ordinary browsers and in-app hosts return `client: null`.

## Server usage

### Fetch API / web-standard request

```ts
import { parseRequest } from 'ua-info/server';

export function getClientDetails(request: Request) {
  const details = parseRequest({ headers: request.headers });

  return {
    browser: details.browser?.name,
    os: details.os?.name,
    device: details.device.type,
  };
}
```

### Node.js / Express-style headers

```ts
import { parseRequest } from 'ua-info/server';

app.get('/client-details', (req, res) => {
  res.json(parseRequest({ headers: req.headers }));
});
```

### Override the User-Agent

```ts
const details = parseRequest({
  headers: request.headers,
  userAgent: forwardedUserAgent,
});
```

An explicit `userAgent` takes precedence over the `user-agent` header.

### Client Hints notes

`parseRequest()` consumes hints already present in the request. It does not negotiate them.

Supported request hints include:

```text
Sec-CH-UA
Sec-CH-UA-Full-Version-List
Sec-CH-UA-Mobile
Sec-CH-UA-Platform
Sec-CH-UA-Platform-Version
Sec-CH-UA-Model
Sec-CH-UA-Arch
Sec-CH-UA-Bitness
```

GREASE brands such as `Not A Brand` are ignored. Applications must continue to work when Client Hints are absent.

## Browser usage

### Default enrichment

```ts
import { detectCurrent } from 'ua-info/browser';

const details = await detectCurrent();
```

When supported, the default call requests:

```ts
[
  'architecture',
  'bitness',
  'fullVersionList',
  'model',
  'platformVersion',
]
```

### Request selected high-entropy hints

```ts
const details = await detectCurrent({
  highEntropy: [
    'fullVersionList',
    'platformVersion',
  ],
});
```

To avoid requesting high-entropy values:

```ts
const details = await detectCurrent({ highEntropy: [] });
```

### SSR-safe usage

```ts
import { parse } from 'ua-info';

const details = parse(serverUserAgent);
```

Call `detectCurrent()` only after entering a browser runtime. Server rendering should use `parse()` or `parseRequest()`.

### Angular service

```ts
import { Injectable } from '@angular/core';
import { detectCurrent } from 'ua-info/browser';

@Injectable({ providedIn: 'root' })
export class UserAgentService {
  detect() {
    return detectCurrent();
  }
}
```

Angular SSR code should use `parse()` or `parseRequest()` instead of calling `detectCurrent()`.

## Version utilities

Browser and product versions are not assumed to follow Semantic Versioning. `raw` is canonical; `major` and `minor` are conveniences.

```ts
import {
  compareVersions,
  parseVersion,
  satisfiesVersion,
} from 'ua-info';

const version = parseVersion('150.0.7871.46');

console.log(version?.raw);
console.log(version?.major);
console.log(version?.minor);

console.log(compareVersions('150.0.7871.46', '150.0.7871.45'));
console.log(satisfiesVersion(version, '>=150'));
```

Supported comparisons:

```ts
satisfiesVersion(version, '>120');
satisfiesVersion(version, '>=120.0');
satisfiesVersion(version, '<=150.0.7871.46');
satisfiesVersion(version, '=150');
satisfiesVersion(version, '==150.0');
```

Only one comparator is supported per call. Compound ranges, caret ranges, tilde ranges, and prerelease SemVer syntax are intentionally not supported.

Comparison rules:

- Segments are compared numerically.
- Missing segments are treated as zero.
- Dot, underscore, and comma separators are accepted by `parseVersion()`.
- Invalid or absent values return `null` from `parseVersion()` and `compareVersions()`.
- `satisfiesVersion()` returns `false` for invalid versions or unsupported ranges.

## Result contract

The top-level result is:

```ts
interface UAResult {
  readonly ua: string;
  readonly browser: BrowserInfo | null;
  readonly engine: EngineInfo | null;
  readonly os: OSInfo | null;
  readonly device: DeviceInfo;
  readonly cpu: CPUInfo | null;
  readonly client: ClientInfo | null;
  readonly context: ContextInfo | null;
}
```

User-Agent strings and Client Hints are untrusted client claims. Do not use them as proof of identity, authentication, authorization, fraud status, or device ownership.

## Package contract

The supported package entry points are:

```ts
import { parse } from 'ua-info';
import { parseRequest } from 'ua-info/server';
import { detectCurrent } from 'ua-info/browser';
```

The package does not expose the removed v1 `UAInfo` class or transitional `/v2` entry points.

## Development

```bash
npm install
npm run check
```

`npm run check` verifies package identity, linting, all tests, ESM and CommonJS builds, packed package contents, and packed ESM/CommonJS consumers.

The CI matrix runs on Node.js 18, 20, and 22.

## License

MIT
