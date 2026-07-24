# Changelog

All notable changes to `ua-info` are documented in this file.

## 2.1.0 — 2026-07-24

### Added

- Source-backed, test-only detection fixture corpus with globally unique IDs and provenance validation.
- Explicit browser, client, context, operating-system, device, CPU, Client Hints, and malformed-input regression matrices.
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
- iPhone and iPad User-Agent strings now return the documented ARM64 CPU claim.

### Compatibility

- No public result shape, `ClientKind`, `ContextKind`, package entry point, or runtime dependency changed.
- `parse()` remains synchronous, deterministic, and free of browser-global access.
- ESM, CommonJS, TypeScript, root, `/server`, `/browser`, and packed-consumer contracts remain supported on Node.js 18, 20, and 22.

### Security note

User-Agent and Client Hints values are untrusted claims. A detected client, browser, operating system, device, or context is not proof of request origin or identity.
