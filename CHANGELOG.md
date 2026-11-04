# Changelog

All notable changes to `ua-inspect` are documented in this file.

## 1.1.0 — 2026-11-05

Splits the phone builds of Chrome and Safari into their own browser ids.

This is a minor version by request, but it changes `browser.name` for phone builds. Read the breaking list before upgrading.

### Breaking

- Chrome on a phone is now `chrome-mobile`, and Safari on iOS or iPadOS is `safari-mobile`. Desktop and tablet builds keep `chrome` and `safari`.
- `is(info, { browser: 'chrome' })` no longer matches a phone build. Use `chrome-mobile`, or `{ family: 'chromium' }` for any Chromium product.
- Chrome on Android or HarmonyOS WebView now reports `chrome-mobile` with `mode: 'webview'`, including LINE, Facebook and Instagram in-app browsers.

### Added

- Browser ids `chrome-mobile` and `safari-mobile`, with display names in `labels`.
- A phone build is a fallback: a specific product such as Samsung Internet, Edge or Brave still wins, and the desktop and tablet builds are unchanged.
- `detect()` reads `platform` and `maxTouchPoints` to report an iPad in desktop mode as `ipados`, `tablet`, `apple` and `iPad`. `parse()` and `parseRequest()` cannot see this, because the User-Agent says Macintosh.

## 1.0.1 — 2026-11-05

Expands the catalog and tightens detection. Test data is now first-party only: every vector is a real captured string, with no material from another parser.

### Added

- Browsers: `360`, `coc-coc`, `duckduckgo`, `ecosia`, `edge-legacy`, `ie`, `opera-gx`, `opera-mini`, `pale-moon`, `puffin`, `qq`, `whale`.
- Operating systems: `blackberry`, `firefox-os`, `fuchsia`, `openharmony`, `steamos`, `symbian`, `tvos`, `watchos`, `webos`, `windows-phone`.
- Device vendors: `asus`, `honor`, `infinix`, `itel`, `lg`, `nokia`, `nothing`, `tecno`, `zte`.
- Rendering engines: `edgehtml` and `presto`.
- In-app context: `tiktok`.
- Samsung model prefix `SCG`.

### Fixed

- `EdgWebView2` is reported as `mode: 'webview'`.
- Internet Explorer reports a `null` engine instead of `trident`.
- Edge Legacy is `edge-legacy` with the `edgehtml` engine; `Edg/` stays modern `edge`.
- Opera Mini beats Opera, and the iOS `OPiOS` token is `webkit`.
- QQ Browser is no longer swallowed by `MicroMessenger`.
- TikTok prefers the explicit `app_version` token over the `musical_ly_<build>` build code.
- Version-like tokens such as `312.0.0.34.111` are not treated as product names.
- `touch` is not a device model, and `iphone*` models parse as `iPhone`.
- Device mapping: Steam Deck is `console`, `appletv*` is `smart-tv`, `watchos*` is `wearable`, and `windows` with `windows-phone` is `mobile`.
- BlackBerry and Firefox OS `Mobile` tokens report `mobile`.

### Changed

- Tests moved from `src/__tests__/` to `test/unit/`, and capture data to `test/data/`.
- `scripts/` grouped by purpose: `build/`, `verify/`, `playground/`, `performance/`.
- Development TypeScript updated to 5.x.
- Removed all third-party test vectors and notices; the corpus is real captures only. `ua-inspect` does not derive from or embed another parser's data.

## 1.0.0 — 2026-11-04

First release. Zero-dependency User-Agent parser for TypeScript, in Node.js and browsers.

### Features

- `parse()` reads a User-Agent string. `parseRequest()` adds Client Hints from request headers. `detect()` reads the current browser.
- Dimensions: browser, rendering engine, operating system, device, CPU, non-browser client, and execution context.
- Bot, WebView, in-app (LINE, LIFF, Facebook, Instagram, Messenger, WeChat), and PWA detection.
- `ua-inspect/check` exposes `is()` with compile-time narrowing and `isBot()`.
- `ua-inspect/labels` maps ids to display text.
- ESM, CommonJS, and TypeScript declarations. Node.js 18 or newer.
