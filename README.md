# ua-info

[![npm version](https://img.shields.io/npm/v/ua-info.svg)](https://www.npmjs.com/package/ua-info)
[![CI](https://github.com/petechatchawan/ua-info/actions/workflows/ci.yml/badge.svg)](https://github.com/petechatchawan/ua-info/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/ua-info.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-blue.svg)](https://www.typescriptlang.org/)

A small, typed User-Agent and Client Hints parser for browsers, rendering engines, operating systems, devices, CPUs, bots, HTTP clients, in-app browsers, mini apps, WebViews, and PWAs.

```ts
import { parse } from 'ua-info';

const info = parse(navigator.userAgent);

console.log(info.browser?.name);     // Chrome
console.log(info.os?.name);          // Android
console.log(info.device.type);       // mobile
console.log(info.context?.host?.id); // line, facebook, instagram, ...
```

## Why `ua-info`?

- **One predictable result shape** for browser, server, automation, bot, and in-app environments.
- **Clear separation of concerns**: Chrome stays in `browser`; LINE, Facebook, or Electron live in `context`.
- **Pure core parser**: `parse()` never reads browser globals and is safe in Node.js, SSR, tests, and workers.
- **Client Hints support** through dedicated server and browser entry points.
- **TypeScript-first** with readonly results, exported types, and constants for known IDs.
- **ESM and CommonJS** package exports.
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
- A modern bundler or browser when using the browser entry point.
- TypeScript is optional; declarations are included in the package.

## Quick start

### TypeScript / ESM

```ts
import {
  BrowserId,
  OSId,
  parse,
  satisfiesVersion,
} from 'ua-info';

const info = parse(
  'Mozilla/5.0 (Linux; Android 16; Pixel 9 Pro) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/150.0.7871.46 Mobile Safari/537.36',
);

if (
  info.browser?.id === BrowserId.Chrome &&
  info.os?.id === OSId.Android &&
  satisfiesVersion(info.browser.version, '>=120')
) {
  console.log('Supported Chrome on Android');
}
```

### CommonJS

```js
const { parse } = require('ua-info');

const info = parse(userAgent);
console.log(info.browser?.name);
```

## Choose the right entry point

| Use case | Import | Data source | Runtime detection |
| --- | --- | --- | --- |
| Parse a known User-Agent | `ua-info` | Supplied UA string | No |
| Parse an HTTP request | `ua-info/server` | UA + request Client Hints | No |
| Detect the current browser | `ua-info/browser` | UA + browser Client Hints + runtime signals | Yes |

### `parse()` — universal and pure

```ts
import { parse } from 'ua-info';

const info = parse(userAgent);
```

Use `parse()` when you already have a User-Agent string. It is synchronous and deterministic. It does not access `navigator`, `document`, `window`, headers, cookies, or network APIs.

### `parseRequest()` — server requests and Client Hints

```ts
import { parseRequest } from 'ua-info/server';

const info = parseRequest({
  headers: request.headers,
});
```

Use `parseRequest()` when parsing an incoming request. It accepts either:

- a Fetch-compatible `Headers` object with `get(name)`, or
- a plain header record whose values are strings, string arrays, or `undefined`.

It combines the User-Agent with available Client Hints such as full browser version, platform version, device model, CPU architecture, and bitness.

### `detectCurrent()` — browser enrichment and PWA detection

```ts
import { detectCurrent } from 'ua-info/browser';

const info = await detectCurrent();
```

Use `detectCurrent()` inside a browser when you want runtime-only information. It can read `navigator.userAgentData`, request high-entropy Client Hints, and detect standalone PWA mode.

`detectCurrent()` throws when no browser-like `navigator` exists. Use `parse()` or `parseRequest()` during SSR.

## Result mental model

`ua-info` keeps product identity, execution context, and non-browser clients separate:

```text
browser  -> What browser/runtime is rendering the page?
engine   -> What rendering engine is used?
os       -> What operating system is claimed?
device   -> What device class/vendor/model is claimed?
cpu      -> What CPU architecture/bitness is claimed?
client   -> Is the caller a bot, crawler, automation tool, HTTP client, or library?
context  -> Is the browser running inside LINE, Facebook, Electron, a PWA, etc.?
```

This avoids collapsing unrelated concepts into one `browser` field.

### Example: ordinary Chrome

```ts
const info = parse(chromeUserAgent);

info.browser?.id; // 'chrome'
info.client;      // null
info.context;     // null
```

### Example: LINE LIFF

```ts
const info = parse(lineLiffUserAgent);

info.browser?.id;       // 'chrome'
info.browser?.mode;     // 'webview'
info.context?.kind;     // 'mini-app'
info.context?.id;       // 'liff'
info.context?.host?.id; // 'line'
info.client;            // null
```

### Example: GPTBot

```ts
const info = parse('GPTBot/1.2');

info.browser;             // null
info.client?.kind;        // 'ai-agent'
info.client?.id;          // 'gptbot'
info.client?.version?.raw; // '1.2'
```

## Common recipes

### Detect browser and version

Prefer stable IDs for program logic and names for display:

```ts
import {
  BrowserId,
  parse,
  satisfiesVersion,
} from 'ua-info';

const info = parse(userAgent);

const isModernChrome =
  info.browser?.id === BrowserId.Chrome &&
  satisfiesVersion(info.browser.version, '>=120');
```

### Detect mobile, tablet, or desktop

```ts
const info = parse(userAgent);

switch (info.device.type) {
  case 'mobile':
    // Phone-sized device claim
    break;
  case 'tablet':
    // Tablet claim
    break;
  case 'desktop':
    // Desktop-class claim
    break;
  default:
    // smart-tv, console, wearable, xr, embedded, or unknown
    break;
}
```

`device` is always present. Unknown device information is represented by:

```ts
{
  type: 'unknown',
  vendor: null,
  model: null,
}
```

### Detect WebView, headless, or embedded browser mode

```ts
const info = parse(userAgent);

const isWebView = info.browser?.mode === 'webview';
const isHeadless = info.browser?.mode === 'headless';
const isEmbedded = info.browser?.mode === 'embedded';
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
const info = parse(userAgent);

const host = info.context?.host;

if (info.context?.kind === 'in-app-browser' && host) {
  console.log(`Running inside ${host.name}`);
}
```

Known contexts currently include LINE, Facebook, Instagram, TikTok, X, WeChat, Telegram, Electron, Capacitor, Cordova, and runtime-detected standalone PWAs.

### Detect LINE and LIFF

```ts
const info = parse(navigator.userAgent);

const isLine = info.context?.host?.id === 'line';
const isLiff =
  info.context?.kind === 'mini-app' &&
  info.context.id === 'liff' &&
  info.context.host?.id === 'line';
```

Do not use only `browser.id` to identify LINE. The underlying browser remains available in `browser`; LINE is represented in `context.host`.

### Detect bots, crawlers, and AI agents

```ts
const info = parse(request.headers.get('user-agent') ?? '');

if (info.client?.kind === 'crawler') {
  console.log(`Crawler: ${info.client.name}`);
}

if (info.client?.kind === 'ai-agent') {
  console.log(`AI agent: ${info.client.name}`);
}
```

Examples of recognized non-browser clients include:

- AI agents: GPTBot, ClaudeBot, PerplexityBot, Google-Extended.
- Crawlers: Googlebot, Bingbot, AhrefsBot, SemrushBot, Applebot, CCBot.
- Automation: Playwright, Puppeteer, Selenium.
- HTTP clients: curl, Wget, Postman, HTTPie.
- Libraries: Axios, Python Requests, OkHttp.
- Other clients: Thunderbird and VLC.
- Generic `bot`, `spider`, or `crawler` tokens as a fallback.

`client` is a single selected non-browser actor. Ordinary browsers and in-app hosts return `client: null`.

## Server usage

### Fetch API / Web-standard request

```ts
import { parseRequest } from 'ua-info/server';

export function handleRequest(request: Request): Response {
  const info = parseRequest({ headers: request.headers });

  return Response.json({
    browser: info.browser,
    os: info.os,
    device: info.device,
  });
}
```

### Node.js / Express-style headers

```ts
import { parseRequest } from 'ua-info/server';

app.get('/client-info', (req, res) => {
  const info = parseRequest({ headers: req.headers });

  res.json(info);
});
```

### Override the User-Agent

```ts
const info = parseRequest({
  headers: request.headers,
  userAgent: forwardedUserAgent,
});
```

`userAgent` takes precedence over the `user-agent` header when supplied.

### Client Hints notes

`parseRequest()` consumes hints that are already present. It does not negotiate them for you.

A server that needs high-entropy hints may advertise appropriate `Accept-CH` response headers. Browser support and delivery rules vary, so your application must continue to work when hints are absent.

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

GREASE brands such as `Not A Brand` are ignored.

## Browser usage

### Default enrichment

```ts
import { detectCurrent } from 'ua-info/browser';

const info = await detectCurrent();
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

### Request only selected high-entropy hints

```ts
const info = await detectCurrent({
  highEntropy: [
    'fullVersionList',
    'platformVersion',
  ],
});
```

To avoid requesting high-entropy values entirely:

```ts
const info = await detectCurrent({ highEntropy: [] });
```

### SSR-safe pattern

```ts
import { parse } from 'ua-info';

const info = typeof navigator === 'undefined'
  ? parse(serverUserAgent)
  : parse(navigator.userAgent);
```

Use `detectCurrent()` only after entering the browser runtime.

### Angular service example

```ts
import { Injectable } from '@angular/core';
import { detectCurrent, type DetectCurrentOptions } from 'ua-info/browser';
import { parse, type UAResult } from 'ua-info';

@Injectable({ providedIn: 'root' })
export class UserAgentService {
  private current: UAResult | null = null;

  get snapshot(): UAResult | null {
    return this.current;
  }

  async detect(options?: DetectCurrentOptions): Promise<UAResult> {
    this.current = typeof navigator === 'undefined'
      ? parse('')
      : await detectCurrent(options);

    return this.current;
  }

  get isMobile(): boolean {
    return this.current?.device.type === 'mobile';
  }

  get isLine(): boolean {
    return this.current?.context?.host?.id === 'line';
  }
}
```

For Angular SSR, call `detect()` only in the browser or pass the request User-Agent to `parse()` on the server.

## Version utilities

Browser and product versions are not assumed to follow Semantic Versioning. `raw` is canonical; `major` and `minor` are conveniences.

```ts
import {
  compareVersions,
  parseVersion,
  satisfiesVersion,
} from 'ua-info';

const version = parseVersion('150.0.7871.46');

version?.raw;   // '150.0.7871.46'
version?.major; // 150
version?.minor; // 0

compareVersions('150.0.7871.46', '150.0.7871.45'); // 1
satisfiesVersion(version, '>=150');                // true
```

### Supported comparisons

```ts
satisfiesVersion(version, '>120');
satisfiesVersion(version, '>=120.0');
satisfiesVersion(version, '<=150.0.7871.46');
satisfiesVersion(version, '=150');
satisfiesVersion(version, '==150.0');
```

Only one comparator is supported per call. Compound ranges such as `>=120 <130`, caret ranges, tilde ranges, and prerelease SemVer syntax are intentionally not supported.

Comparison rules:

- Segments are compared numerically.
- Missing segments are treated as zero.
- Dot, underscore, and comma separators are accepted by `parseVersion()`.
- Invalid or absent values return `null` from `parseVersion()` / `compareVersions()` and `false` from `satisfiesVersion()`.

## TypeScript API

### Result shape

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

### Product versions

```ts
interface Version {
  readonly raw: string;
  readonly major: number | null;
  readonly minor: number | null;
}
```

### Browser

```ts
interface BrowserInfo extends ProductInfo {
  readonly family: string | null;
  readonly mode: BrowserMode;
}
```

Known browser families are `chromium`, `firefox`, `safari`, and `internet-explorer`. Rendering engine identity remains separate in `engine`.

### Device

```ts
type DeviceType =
  | 'desktop'
  | 'mobile'
  | 'tablet'
  | 'smart-tv'
  | 'console'
  | 'wearable'
  | 'xr'
  | 'embedded'
  | 'unknown';
```

### Non-browser client

```ts
type ClientKind =
  | 'bot'
  | 'crawler'
  | 'ai-agent'
  | 'automation'
  | 'http-client'
  | 'library'
  | 'email-client'
  | 'media-player'
  | 'unknown';
```

### Execution context

```ts
type ContextKind =
  | 'in-app-browser'
  | 'mini-app'
  | 'pwa'
  | 'embedded'
  | 'unknown';
```

### Known-ID constants

Use constants to avoid string typos while keeping IDs extensible:

```ts
import {
  BrowserFamily,
  BrowserId,
  CPUArchitecture,
  EngineId,
  OSId,
} from 'ua-info';

if (info.browser?.id === BrowserId.Edge) {
  // ...
}

if (info.engine?.id === EngineId.WebKit) {
  // ...
}
```

Also exported:

```ts
type KnownBrowserId;
type KnownBrowserFamily;
type KnownEngineId;
type KnownOSId;
type KnownCPUArchitecture;
```

## Detection coverage

### Browsers

Chrome, Chromium, Edge, Firefox, Safari, Opera, Samsung Internet, Vivaldi, Yandex Browser, UC Browser, Huawei Browser, Xiaomi Browser, Arc, Brave, and Internet Explorer.

### Engines

Blink, WebKit, Gecko, Trident, and EdgeHTML.

### Operating systems

Windows, macOS, iOS, Android, ChromeOS, Linux, HarmonyOS, KaiOS, and Tizen.

### Device classes

Desktop, mobile, tablet, smart TV, console, wearable, XR, embedded, and unknown. Common Android vendor/model information is extracted when available.

### Browser modes

Ordinary browser, WebView, headless, embedded, and unknown.

Detection coverage is intentionally evidence-based. Unrecognized products return `null` or `unknown` rather than being forced into an incorrect identity.

## Null and `unknown` semantics

- Use `null` when an optional dimension is not detected, such as `browser`, `os`, `cpu`, `client`, or `context`.
- Use `unknown` when the dimension always exists but its category cannot be classified, such as `device.type`.
- Never treat `null` as an error. Sparse User-Agent strings are valid input.
- The original supplied value is preserved in `result.ua`.

```ts
const info = parse('');

info.browser;     // null
info.os;          // null
info.device.type; // 'unknown'
info.client;      // null
info.context;     // null
```

## API reference

### `parse(userAgent)`

```ts
function parse(userAgent: string): UAResult;
```

Pure, synchronous User-Agent parsing.

### `parseRequest(input)`

```ts
interface ParseRequestInput {
  readonly headers: HeaderSource;
  readonly userAgent?: string;
}

function parseRequest(input: ParseRequestInput): UAResult;
```

Import from `ua-info/server`.

Header types are exported for adapters:

```ts
type HeaderValue = string | readonly string[] | undefined;
type HeaderRecord = Readonly<Record<string, HeaderValue>>;

interface HeaderGetter {
  get(name: string): string | null;
}

type HeaderSource = HeaderRecord | HeaderGetter;
```

### `detectCurrent(options?)`

```ts
interface DetectCurrentOptions {
  readonly highEntropy?: readonly (
    | 'architecture'
    | 'bitness'
    | 'fullVersionList'
    | 'model'
    | 'platformVersion'
  )[];
}

function detectCurrent(
  options?: DetectCurrentOptions,
): Promise<UAResult>;
```

Import from `ua-info/browser`.

### Version functions

```ts
function parseVersion(value: string): Version | null;

function compareVersions(
  left: Version | string | null | undefined,
  right: Version | string | null | undefined,
): -1 | 0 | 1 | null;

function satisfiesVersion(
  version: Version | string | null | undefined,
  range: string,
): boolean;
```

## Migrating from 1.x

Version 2 is a breaking redesign. The mutable `UAInfo` class and legacy result shape were removed.

Before:

```ts
import { UAInfo } from 'ua-info';

const parser = new UAInfo(userAgent);
const info = parser.getParsedUserAgent();
```

After:

```ts
import { parse } from 'ua-info';

const info = parse(userAgent);
```

Important model changes:

- Browser runtime is in `browser`.
- Rendering engine is in `engine`.
- LINE and other host apps are in `context.host`.
- Bots and HTTP clients are in `client`.
- Results are immutable values rather than mutable parser state.
- There is no `ua-info/v2` or legacy subpath; version 2 is the package-root API.

## Security and privacy

User-Agent strings and Client Hints are **untrusted client claims**.

Do not use this package to:

- authenticate a user,
- prove device identity,
- enforce authorization,
- make fraud decisions by itself,
- assume a browser feature is definitely available.

Prefer feature detection for browser capabilities. Use UA information for analytics, compatibility fallbacks, diagnostics, presentation choices, and routing where occasional misclassification is acceptable.

Avoid logging full User-Agent or Client Hint values unless your privacy policy and retention controls allow it.

## Limitations

- User-Agent reduction and frozen UA strings can make UA-only results less precise.
- Client Hints are not available in every browser or every request.
- In-app browsers often customize tokens inconsistently between platform versions.
- Device vendor/model detection is best-effort.
- `parse()` cannot detect standalone PWA mode because that requires runtime state; use `detectCurrent()`.
- Browser feature support should be tested directly rather than inferred only from browser name/version.

## Package compatibility

- Native ESM import.
- CommonJS `require()`.
- TypeScript declarations included.
- Node.js 18, 20, and 22 are covered by CI.
- Browser/server code is split through package subpath exports.
- `sideEffects: false` supports tree-shaking.

Public entry points:

```ts
import { parse } from 'ua-info';
import { parseRequest } from 'ua-info/server';
import { detectCurrent } from 'ua-info/browser';
```

## Contributing

```bash
git clone https://github.com/petechatchawan/ua-info.git
cd ua-info
npm install
npm run check
```

`npm run check` runs linting, Jest tests, ESM and CommonJS builds, package-content validation, and packed-package consumer tests.

When adding a detector:

1. Add representative positive fixtures.
2. Add exclusion/precedence fixtures to prevent shared-token false positives.
3. Keep browser, client, and context identity separate.
4. Preserve pure behavior in `parse()`.
5. Do not copy third-party regex databases or fixtures without license-compatible provenance.

Architecture and field semantics are documented in [`docs/v2-design.md`](docs/v2-design.md).

## License

MIT © Chatchawan Koedsawas
