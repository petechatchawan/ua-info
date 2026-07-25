# Changelog

All notable changes to `ua-info` are documented in this file.

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
