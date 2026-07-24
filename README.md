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

## Interactive Playground

Try the [UA Info Interactive Playground](https://petechatchawan.github.io/ua-info/) to inspect the current browser, parse manual User-Agent strings, and supply optional Client Hints. Detection and parsing run locally in the browser; input is not uploaded.

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

details.browser?.id;
details.client;
details.context;
```

For an ordinary Chrome request, `client` and `context` are normally `null`.

### LINE LIFF

```ts
const details = parse(lineLiffUserAgent);

details.browser?.id;
details.browser?.mode;
details.context?.kind;
details.context?.id;
details.context?.host?.id;
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

- AI agents such as GPTBot, ClaudeBot, and PerplexityBot.
- Crawlers such as OAI-SearchBot, OAI-AdsBot, Googlebot, Googlebot Image, Googlebot Video, Bingbot, AhrefsBot, SemrushBot, Applebot, and CCBot.
- Automation tools such as Playwright, Puppeteer, and Selenium.
- HTTP clients such as curl, Wget, Postman, and HTTPie.
- Libraries such as Axios, Python Requests, and OkHttp.
- Email and media clients such as Thunderbird and VLC.
- Generic `bot`, `spider`, or `crawler` tokens as a fallback.

`client` contains one selected non-browser actor. Ordinary browsers and in-app hosts return `client: null`.

`Google-Extended` is a robots control token rather than a distinct HTTP User-Agent crawler claim, so parsing `Google-Extended` returns `client: null`. User-triggered fetchers such as `Perplexity-User` are not forced into an inaccurate autonomous-client kind.

### Claim detection is not identity verification

`ua-info` parses User-Agent and Client Hints claims. These values can be absent, reduced, malformed, or spoofed. A matching client ID does not prove request origin.

Use provider-documented IP ranges, reverse DNS, signed-agent mechanisms, or another server-side verification process when origin verification is required.

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
- Invalid or absent values return `null` from `parseVersion()` and `compareVersions()`, and `false` from `satisfiesVersion()`.

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

```ts
import {
  BrowserFamily,
  BrowserId,
  CPUArchitecture,
  EngineId,
  OSId,
} from 'ua-info';

if (details.browser?.id === BrowserId.Edge) {
  console.log(details.browser.name);
}

if (details.engine?.id === EngineId.WebKit) {
  console.log(details.engine.name);
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

Desktop, mobile, tablet, smart TV, console, wearable, XR, embedded, and unknown. Common Android vendor and model information is extracted when available.

### Browser modes

Ordinary browser, WebView, headless, embedded, and unknown.

Detection is evidence-based. Unrecognized products return `null` or `unknown` rather than being forced into an incorrect identity.

## Null and `unknown` semantics

- Use `null` when an optional dimension is not detected, such as `browser`, `os`, `cpu`, `client`, or `context`.
- Use `unknown` when a dimension always exists but its category cannot be classified, such as `device.type`.
- Sparse User-Agent strings are valid input.
- The original supplied value is preserved in `result.ua`.

```ts
const details = parse('');

console.log(details.browser);
console.log(details.os);
console.log(details.device.type);
console.log(details.client);
console.log(details.context);
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

## Migrating from the previous package name

The API is unchanged. See [MIGRATION.md](MIGRATION.md) for dependency and import replacements.

## Security and privacy

User-Agent strings and Client Hints are **untrusted client claims**.

Do not use this package to:

- authenticate a user,
- prove device identity,
- enforce authorization,
- make fraud decisions by itself,
- assume a browser feature is definitely available.

Prefer feature detection for capabilities. Use User-Agent information for analytics, compatibility fallbacks, diagnostics, presentation choices, and routing where occasional misclassification is acceptable.

Avoid logging complete User-Agent or Client Hint values unless your privacy policy and retention controls allow it.

## Limitations

- User-Agent reduction and frozen User-Agent strings can make UA-only results less precise.
- Client Hints are not available in every browser or request.
- In-app browsers may change or omit tokens between releases.
- Device vendor and model detection is best-effort.
- `parse()` cannot detect standalone PWA mode because that requires runtime state.
- Browser feature support should be tested directly rather than inferred only from browser name and version.

## Package compatibility

- Native ESM import.
- CommonJS `require()`.
- TypeScript declarations included.
- Node.js 18, 20, and 22 covered by CI.
- Browser and server code split through package subpath exports.
- `sideEffects: false` for tree-shaking.

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
npm run playground:dev
```

`npm run check` runs identity validation, linting, Jest tests, ESM and CommonJS builds, package-content validation, and packed-package consumer tests.

`npm run playground:dev` installs the locked Playground tooling, builds the library, installs the generated package tarball into the private Playground application, and starts the Vite development server. See [`apps/playground/README.md`](apps/playground/README.md) for architecture, testing, and deployment details.

When adding a detector:

1. Add representative positive fixtures.
2. Add exclusion and precedence fixtures for shared tokens.
3. Keep browser, client, and context identity separate.
4. Preserve pure behavior in `parse()`.
5. Use detector data and fixtures with clear, compatible provenance.

Architecture and field semantics are documented in [`docs/v2-design.md`](docs/v2-design.md).

## License

MIT © Chatchawan Koedsawas
