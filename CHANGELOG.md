# Changelog

All notable changes to `user-agent-parser-ts` (formerly `ua-info`) are documented in this file.

## Unreleased

### Breaking

- Renamed the npm package from `ua-info` to `user-agent-parser-ts`. Update dependencies and import specifiers; see `MIGRATION.md`.

## 3.0.0 — 2026-09-09

### Breaking

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
