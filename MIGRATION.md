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
