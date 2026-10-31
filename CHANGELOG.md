# Changelog

All notable changes to `user-agent-parser-ts` (formerly `ua-info`) are documented in this file.

## 4.0.0 — 2026-11-01

Migration guide, with a replacement for every removed export: `MIGRATION.md`.

### Breaking

- `user-agent-parser-ts/check` exports `is()` and `isBot()` only. `is(info, { browser: 'chrome', os: 'android' })` replaces the 60 named and generic predicates, narrows every field it names, and rejects a misspelled id at compile time.
- The id value objects (`BrowserId`, `EngineId`, `OSId`, `CPUArchitecture`, `ContextId`) are removed. Ids are string literals, and the id types come from the catalog.
- `parseVersion` and `readHeader` are no longer exported.
- `Version` is `{ full, major, minor, patch }`. `major` is always a number, and a string with no leading integer is `null` instead of a version.
- `device.vendor` is a lowercase id (`'samsung'`). Display text is in the new `user-agent-parser-ts/labels` subpath.
- `client.name` is a listed client id or `null`, and `client.token` carries the product name. `ChatGPT-User`, `Claude-User` and `Perplexity-User` have their own names.
- `context.host` is replaced by `context.app` and `context.version`.
- Windows XP and Vista report no version, and Windows 11 from Client Hints reports `11`.
- The deep `dist/*/v3/*` paths are now `dist/*/*`. Only the package subpaths are supported.

### Fixed

- An unlisted Chromium fork reports `name: null, family: 'chromium'` instead of `chrome`. Edge Legacy reports `edge`. The Android stock browser reports no browser. Safari needs an Apple OS.
- `device.model` is no longer `K` (Chrome reduced User-Agent), `rv:126.0` (Firefox on Android) or `HarmonyOS`.
- Android TV and Fire TV are `smart-tv`. Windows Phone is `mobile`.
- Vendor detection has no catch-all rules, so `Primo RX8` is not Oppo and `M5 Note` is not Xiaomi. `SAMSUNG SM-G960F` is Samsung.
- HarmonyOS keeps its identity when a Client Hints platform says Android. A mobile hint no longer turns an iPad into mobile. A hint model brings its own vendor.
- A phone brand or URL that contains `bot` is not a bot. `YandexBot` is a `crawler` and `Bytespider` an `ai-crawler`.
- Opera Mini reports Android. `Mac OS X 10.15` reports `10.15` instead of `10`.

### Changed

- Detection is data. Browsers, operating systems, CPUs, devices, vendors, clients and in-app contexts are rows in `src/catalog/`, read by one scanner and one precedence rule. Adding a row is one entry plus one corpus User-Agent.
- No regular expression remains in `src`, so no input can trigger backtracking, and ESLint rejects a new one.
- A Client Hints brand takes part in the same precedence as User-Agent tokens. A `Brave` or `Edge` brand replaces a Samsung Internet User-Agent, where 3.x kept Samsung.
- The release gate compares bundle sizes with a reviewed baseline, and `npm run budget:update` refreshes it. The 64-file and 150,000-byte ceilings are gone.
- Tests run on vitest, with a corpus of real and composed User-Agents in `test/corpus`.

### Added

- `user-agent-parser-ts/labels` with display names for every id.
- `Version.minor` and `Version.patch`.
- `parse()` accepts `null` and `undefined`.

## 3.0.1 — 2026-10-30

### Security

- Detection now reads at most the first 1,024 characters of a User-Agent. `UAInfo.ua` still echoes the full input. A 13 KB header used to take 2.3 s in `parseRequest()`; it now takes about 2 ms.
- Removed the cubic `Tizen.+Mobile.+Watch` wearable alternative. `Watch` already matches those User-Agents.
- Rewrote the generic bot fallback so that each token is scanned once. A 16 KB dotted token run used to take 130 ms; it now takes under 0.1 ms.

### Fixed

- `parse()` treats non-string input as an empty User-Agent instead of returning `ua: undefined`.
- The LINE in-app browser token now needs a token boundary, so `my-command-line/1.2.3` no longer reports a LINE context or `webview` mode.
- `detect()` throws outside a browser window or worker, as documented. Node.js 21+ defines `navigator`, so `detect()` used to return an all-null result there.
- `detect()` ignores a `matchMedia` implementation that throws.

## 3.0.0 — 2026-09-09

Published to npm as `user-agent-parser-ts@3.0.0` on 2026-10-30.

### Breaking

- Renamed the npm package from `ua-info` to `user-agent-parser-ts`. Update dependencies and import specifiers; see `MIGRATION.md`.

- Replaced `UAResult` with fixed-shape `UAInfo`; top-level dimensions always exist and unknown fields use `null` instead of nullable containers or `"unknown"` sentinels.
- Stable machine identities now live in `name` fields, and `Version.raw` is replaced by `Version.full`.
- Browser runtime detection is now `detect()` from `ua-info/browser`; `detectCurrent()` was removed.
- Predicate helpers moved from the package root to `ua-info/check`.
- Removed the generic embedded-application browser/context classification from the initial v3 contract; `DeviceType.'embedded'` remains only a hardware class.

### Added

- Named predicates for current browser, OS, device, client, and context checks, including Chrome, Safari, Firefox, Edge, Opera, Samsung Internet, Brave, Vivaldi, Mi Browser, Huawei Browser, UC Browser, Yandex Browser, and Arc where reliable evidence exists.
- Structured Client Hints normalization and field-level evidence merging shared by server and browser adapters.
- Conservative LINE/LIFF handling: pure User-Agent parsing may identify LINE, while LIFF requires runtime `liff.isInClient()` evidence.
- Browser runtime high-entropy Client Hints opt-in with `detect({ highEntropy: true })`.
- `MIGRATION.md` as part of the published package.

### Changed

- `parseRequest()` consumes supported `Sec-CH-UA-*` headers already present in a request without managing Client Hints negotiation.
- Chromium product identity and Chromium-family lineage now have distinct predicate semantics.
- Mi Browser uses the stable ID `mi-browser`.
- Package verification uses one packed tarball for content and ESM/CommonJS/TypeScript consumer checks, with absolute package size/file-count ceilings.
- Playground, benchmark scenarios, and release/performance documentation now use the v3 public API.

### Compatibility

- ESM, CommonJS, TypeScript, root, `/check`, `/server`, and `/browser` consumers are verified from the packed artifact.
- Node.js 18 or newer remains required for server-side usage.
- User-Agent and Client Hints values remain untrusted claims; detection is not authentication.

## 2.2.0 — 2026-07-25

### Added

- Nine pure, tree-shakeable typed predicate helpers exported from the package root: `isBrowser`, `isBrowserFamily`, `isBrowserMode`, `isEngine`, `isOperatingSystem`, `isDeviceType`, `isCPUArchitecture`, `isClientKind`, and `isContextKind`.
- Compile-time narrowing for nullable result dimensions and matched literal values.
- Support for custom or future string IDs in browser, browser-family, engine, operating-system, and CPU-architecture predicates.
- Closed-union input validation for browser mode, device type, client kind, and context kind.

### Compatibility

- No `UAResult`, detector behavior, package entry-point, or runtime dependency changes.
- ESM, CommonJS, TypeScript Node16/NodeNext, server, browser, packed-consumer, and Playground contracts remain supported on Node.js 18, 20, and 22.

### Security note

Predicate helpers query parsed User-Agent and Client Hints claims. A match does not authenticate a browser, client, device, context, or request origin.

## 2.1.0 — 2026-07-24

### Added

- Source-backed, test-only detection fixture corpus with globally unique IDs and provenance validation.
- Explicit browser, client, context, operating-system, device, CPU, Client Hints, and malformed-input regression matrices.
- Default high-entropy browser enrichment coverage for architecture, bitness, full-version lists, model, and platform version.
- Detection coverage commands and a dedicated Node.js 22 CI job.
- Enforced production coverage thresholds for `src/v2/**`: 90% statements, 90% lines, 90% functions, and 85% branches.
- Crawler claims for `OAI-SearchBot`, `OAI-AdsBot`, Googlebot Image, and Googlebot Video.
- Playground samples for OAI-SearchBot, Googlebot Image, and the non-client `Google-Extended` control token.

### Corrected

- Explicit `Chromium/<version>` now reports Chromium instead of Chrome.
- `Google-Extended` is no longer reported as an HTTP User-Agent client; it is a robots control token without a distinct crawler User-Agent claim.
- `Perplexity-User` is not forced into an inaccurate autonomous crawler or AI-agent classification.
- Generic bot fallback requires a complete `bot`, `spider`, or `crawler` product token and no longer matches ordinary substrings such as `RoboticsResearch`.
- iPad User-Agent strings now reach the iPadOS-specific operating-system branch.
- iPhone and iPad device tokens now produce the package's ARM64 CPU inference consistently.

### Compatibility

- No public result shape, `ClientKind`, `ContextKind`, package entry point, or runtime dependency changed.
- `parse()` remains synchronous, deterministic, and free of browser-global access.
- ESM, CommonJS, TypeScript, root, `/server`, `/browser`, and packed-consumer contracts remain supported on Node.js 18, 20, and 22.

### Security note

User-Agent and Client Hints values are untrusted claims. A detected client, browser, operating system, device, or context is not proof of request origin or identity.
