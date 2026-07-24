# ua-info v2.1 Detection Accuracy & Coverage Design

**Status:** Approved for implementation planning  
**Date:** 2026-07-24  
**Repository:** `petechatchawan/ua-info`  
**Target release:** `ua-info@2.1.0`

## 1. Purpose

Deliver an additive `ua-info` minor release that improves detection accuracy, source-backed coverage, collision handling, and regression protection without changing the public result model or package entry points.

The release must make detector behavior easier to review and safer to extend by introducing a test-only fixture corpus with explicit provenance, executable precedence contracts, robustness coverage, and enforced coverage thresholds.

This release is not a detector rewrite. It preserves the current orchestration in which `parse()` delegates independently to browser, engine, operating-system, device, CPU, client, and context detectors.

## 2. Frozen Release Contract

`ua-info@2.1.0` is an additive minor release.

- The public `UAResult` shape remains unchanged.
- The public `BrowserInfo`, `OSInfo`, `DeviceInfo`, `CPUInfo`, `ClientInfo`, and `ContextInfo` shapes remain unchanged.
- `ClientKind` and `ContextKind` remain unchanged.
- Public entry points remain exactly:

```ts
import { parse } from 'ua-info';
import { parseRequest } from 'ua-info/server';
import { detectCurrent } from 'ua-info/browser';
```

- Removed v1 APIs and removed `/v2` package subpaths remain removed.
- `parse(userAgent)` remains synchronous, deterministic, and pure.
- `parse()` must not read `navigator`, `document`, `window`, `matchMedia`, or other runtime globals.
- `parseRequest()` remains the server adapter for User-Agent plus request Client Hints.
- `detectCurrent()` remains the browser adapter for User-Agent, browser Client Hints, and runtime-only PWA signals.
- No runtime dependency is added.
- Node.js support remains `>=18` with CI coverage on Node.js 18, 20, and 22.
- ESM, CommonJS, TypeScript declaration, root, `/server`, `/browser`, and packed-consumer contracts remain mandatory.
- User-Agent and Client Hints values are untrusted claims. Detection never means authentication or origin verification.

## 3. Selected Approach

Use **fixture-first hardening with explicit precedence contracts**.

Every production detector change begins with a source-backed failing fixture or a focused regression fixture. The implementation then makes the smallest change needed to pass that fixture while retaining the full package and consumer matrix.

This approach is selected over two alternatives:

1. A generic detector-registry refactor would reduce some repetition but create a large structural diff before accuracy is established.
2. A generated JSON or YAML detector catalog would be useful at a much larger catalog size but adds build and schema machinery that is not justified for this release.

The release may perform small local refactors when they directly support testability or explicit precedence. It must not redesign all detectors into a shared framework.

## 4. Current Architecture Boundary

The canonical parse flow remains:

```text
parse(userAgent)
├── detectBrowser(userAgent)
├── detectContext(userAgent)
├── apply context-derived browser mode
├── detectEngine(userAgent, browser engine hint)
├── detectOS(userAgent)
├── detectDevice(userAgent)
├── detectCPU(userAgent)
└── detectClient(userAgent)
```

The dimensions remain independent:

- `browser` represents a browser product or runtime.
- `engine` represents the rendering engine.
- `browser.mode` represents browser, WebView, headless, or embedded execution.
- `client` represents the most specific selected non-browser actor.
- `context` represents an execution surface such as an in-app browser, mini-app, PWA, or embedded host.
- Host applications never replace the underlying browser.

## 5. Test-Only Fixture Architecture

### 5.1 Repository topology

Create the following test-only structure:

```text
src/v2/__tests__/
├── fixtures/
│   ├── fixture-types.ts
│   ├── browsers.ts
│   ├── clients.ts
│   ├── contexts.ts
│   ├── operating-systems.ts
│   ├── devices.ts
│   ├── client-hints.ts
│   ├── malformed.ts
│   ├── index.ts
│   └── provenance.ts
├── fixture-contract.test.ts
├── precedence.test.ts
└── robustness.test.ts
```

Fixture files remain under `__tests__` and must not be emitted into `dist` or included in the npm tarball.

### 5.2 Fixture contract

```ts
import type { UAResult } from '../../types';

export type FixtureSourceKind = 'official-doc' | 'captured' | 'regression';

export interface FixtureSource {
  readonly kind: FixtureSourceKind;
  readonly authority: string;
  readonly reference: string;
  readonly observedAt: string;
  readonly notes?: string;
}

export interface DetectionFixture {
  readonly id: string;
  readonly userAgent: string;
  readonly expected: DeepPartial<UAResult>;
  readonly source: FixtureSource;
}

export type DeepPartial<T> = {
  readonly [K in keyof T]?: T[K] extends readonly unknown[]
    ? T[K]
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};
```

Rules:

- Fixture IDs are globally unique and stable.
- IDs use lowercase kebab case.
- Every fixture has a nonempty authority, reference, and ISO `YYYY-MM-DD` observation date.
- Official documentation is preferred for crawler, fetcher, and standards-defined tokens.
- Real captured User-Agent strings may be used when the capture source and date are documented.
- Synthetic collision strings are marked `regression` and describe the invariant they protect.
- Fixtures never claim that a matching User-Agent was cryptographically verified.

### 5.3 Fixture assertions

A shared fixture runner uses recursive partial matching so each fixture asserts only the dimensions it is intended to prove. Canonical unknown-result tests remain exact equality tests.

Fixture contract tests must reject:

- duplicate fixture IDs;
- invalid ID format;
- empty User-Agent values except in the malformed corpus;
- missing provenance fields;
- malformed observation dates;
- official-document fixtures whose reference is not an HTTPS URL;
- fixture objects without at least one expected result field.

## 6. Browser and Engine Coverage

### 6.1 Supported precedence

Browser selection remains ordered from specific to generic. The executable precedence contract is:

```text
headless browser
> browser derivative or platform-specific browser token
> Firefox product token
> Chromium or Chrome product token
> Safari product token
> Internet Explorer product token
> unknown
```

Within Chromium-family products:

```text
Edge / Opera / Samsung Internet / Vivaldi / Yandex / UC Browser /
Huawei Browser / Xiaomi Browser / Arc / Brave
> Chromium
> Chrome
```

`Chromium/<version>` must identify Chromium rather than Chrome. `Chrome/<version>` continues to identify Chrome.

### 6.2 Platform and engine invariants

- Chrome, Edge, Firefox, and Opera product identity on iOS remains distinct while the engine is WebKit.
- Firefox outside iOS uses Gecko.
- Chromium-family products outside iOS use Blink.
- Internet Explorer uses Trident.
- Headless Chrome remains Chrome with `browser.mode = 'headless'`.
- Android WebView remains Chrome with `browser.mode = 'webview'` unless a more specific supported browser product is present.
- A context may change `browser.mode` to `webview` or `embedded`, but it must not replace browser product identity.
- Safari requires both a valid `Version/<version>` token and a Safari product token.
- Browser-like compatibility tokens inside crawler or application User-Agent strings must not suppress the selected `client` or `context`.

### 6.3 Negative collision coverage

The fixture matrix must include negative cases for:

- Edge, Opera, Samsung Internet, Vivaldi, Yandex, UC Browser, Huawei Browser, Xiaomi Browser, Arc, and Brave falling through to Chrome;
- Chromium being reported as Chrome;
- iOS Chrome, Firefox, Edge, or Opera being reported as Safari;
- Android WebView being reported as ordinary Chrome;
- Headless Chrome being reported as ordinary Chrome;
- Safari being inferred from a lone compatibility token;
- Chrome compatibility tokens in Googlebot or other crawler strings preventing client detection.

The release does not promise detection of products that intentionally omit a distinguishable User-Agent token. For example, runtime-only Brave identification is outside pure `parse()` unless a supported claim is present in User-Agent or Client Hints.

## 7. Client and Bot Coverage

### 7.1 Existing public semantics

`client` remains a single selected non-browser actor. Selection follows the frozen specificity order:

```text
ai-agent
> crawler
> bot
> automation
> http-client
> library
> email-client
> media-player
> unknown
```

The release does not add a public multi-client result or a new `user-fetcher` kind.

### 7.2 Source-backed catalog

The catalog must cover the currently supported products and add only tokens that have current authoritative documentation or a documented real-world regression.

Initial authoritative additions and corrections include:

- OpenAI `OAI-SearchBot` as a crawler claim.
- OpenAI `GPTBot` as the existing AI-agent claim.
- OpenAI `OAI-AdsBot` as a crawler claim when an HTTP User-Agent token is present.
- Anthropic `ClaudeBot` as the existing AI-agent claim.
- Perplexity `PerplexityBot` as the existing AI-agent claim.
- Googlebot desktop, smartphone, and the generic short form as the same `googlebot` crawler identity.
- Googlebot Image and Googlebot Video as distinct crawler identities when their distinct HTTP User-Agent tokens are present.

### 7.3 Robots tokens are not automatically HTTP User-Agent tokens

A robots control token must not be added to the User-Agent detector unless authoritative documentation states that it appears in HTTP requests.

In particular, Google documents `Google-Extended` as a robots control token without a separate HTTP User-Agent string. Therefore:

- remove `Google-Extended` from `CLIENT_PATTERNS`;
- add a regression fixture proving `parse('Google-Extended')` does not claim an AI agent;
- retain the project security statement that User-Agent matching is not bot verification.

### 7.4 User-triggered fetchers

Current public kinds cannot accurately represent every provider's user-triggered fetcher. The following rules apply:

- `Perplexity-User` must not be misclassified as `PerplexityBot`.
- A future user-triggered token must not be forced into `crawler`, `ai-agent`, or `http-client` solely to increase coverage.
- Such tokens remain unknown unless an existing public kind is semantically correct and documented.
- Adding a dedicated public kind is deferred to a separately designed API release.

### 7.5 Generic bot fallback

The generic bot fallback remains after all explicit patterns. Tests must prove that:

- explicit products win over the generic fallback;
- ordinary words containing `bot` as a substring do not produce accidental identities;
- a valid generic `bot`, `spider`, or `crawler` product token still returns `kind = 'bot'`;
- malformed version suffixes do not throw.

## 8. Context and WebView Coverage

### 8.1 Context precedence

Context selection remains most-specific-first:

```text
LINE LIFF
> LINE in-app browser
> supported in-app browser host
> supported mini-app host
> embedded framework
> null
```

The required matrix includes:

- LINE LIFF;
- LINE without LIFF;
- Facebook;
- Instagram;
- TikTok;
- X;
- WeChat;
- Telegram Mini App;
- Electron;
- Capacitor;
- Cordova;
- standalone Android WebView without a host token;
- host-context tokens coexisting with browser derivative tokens.

### 8.2 Context invariants

- LINE LIFF returns `context.kind = 'mini-app'`, `context.id = 'liff'`, and a LINE host.
- LINE without `LIFF` returns an in-app-browser context.
- In-app and mini-app contexts change an existing browser mode to `webview`.
- Embedded contexts change an existing browser mode to `embedded`.
- Headless mode is never overwritten by context-derived mode.
- Context host version parsing remains independent from browser version parsing.
- Host applications remain absent from `client`.
- Context detection must not manufacture a browser when no browser product is present.

## 9. Operating System, Device, and CPU Coverage

### 9.1 Operating systems

The fixture matrix covers:

- Windows NT mappings already supported by the package;
- Windows Phone precedence over Windows NT;
- iOS and iPadOS version normalization;
- Android;
- HarmonyOS;
- ChromeOS;
- macOS;
- Linux;
- KaiOS;
- Tizen;
- unknown and malformed platform tokens.

Existing public naming is preserved. This release does not redesign the Windows-version mapping or infer Windows 11 from User-Agent data that reports `Windows NT 10.0`.

### 9.2 Devices

The fixture matrix covers:

- Apple iPhone, iPad, and iPod;
- Android mobile versus tablet classification;
- supported Android vendor and model extraction;
- smart TV;
- console;
- wearable;
- XR;
- desktop;
- embedded framework;
- unknown.

Model extraction must ignore locale, architecture, `wv`, `mobile`, `tablet`, and `Build/...` metadata segments.

Vendor inference remains conservative. Unknown model prefixes return `vendor = null` rather than a guessed manufacturer.

### 9.3 CPU

The fixture matrix covers:

- ARM64;
- ARM 32-bit;
- x86_64;
- x86 32-bit;
- MIPS 32/64;
- RISC-V 64;
- PowerPC;
- SPARC;
- unknown.

CPU detection remains claim-based and nullable.

## 10. Client Hints Contract

### 10.1 Field precedence

For supported structured claims, precedence is:

```text
full-version Client Hint
> low-entropy Client Hint
> User-Agent result
> null or unknown
```

Per-field rules:

- `sec-ch-ua-full-version-list` takes precedence over `sec-ch-ua` for browser version.
- Recognized non-GREASE brands may establish or refine Chromium-family browser identity.
- Edge and Opera brands take precedence over Chrome and Chromium brands.
- GREASE brands are ignored.
- `sec-ch-ua-platform` may refine operating-system identity.
- `sec-ch-ua-platform-version` refines the selected operating-system version.
- `sec-ch-ua-model` replaces the device model only when nonempty.
- `sec-ch-ua-mobile = ?1` may promote the device type to mobile.
- `sec-ch-ua-mobile = ?0` must not incorrectly demote a known tablet, smart TV, console, wearable, XR, or embedded device.
- architecture and bitness hints refine CPU fields independently.
- unknown brands, platforms, architectures, and bitness values preserve the current parsed value.

### 10.2 Header input behavior

- Header names remain case-insensitive.
- String-array header values are joined consistently.
- Getter-backed and record-backed header sources remain supported.
- Missing, partial, contradictory, malformed, or empty hints must not throw.
- Malformed brand fragments are ignored without discarding valid fragments in the same header.
- Prototype-like object keys are treated as ordinary untrusted input and must not mutate prototypes.

### 10.3 Browser adapter behavior

`detectCurrent()` continues to request the existing high-entropy hints by default. Tests must cover:

- no `navigator` error;
- navigator without `userAgentData`;
- low-entropy values only;
- high-entropy success;
- empty requested high-entropy list;
- runtime standalone PWA detection;
- existing host context taking precedence over standalone PWA context;
- a rejected `getHighEntropyValues()` promise propagating as an explicit detection failure rather than returning silently corrupted data.

## 11. Robustness Contract

All public parsers must have deterministic behavior for:

- empty string;
- whitespace-only string;
- Unicode input;
- ASCII control characters;
- a 64 KiB User-Agent regression input;
- truncated product tokens;
- duplicated product tokens;
- contradictory browser tokens;
- malformed and duplicated version separators;
- malformed Client Hints;
- unknown products.

The release does not add a runtime input-length rejection. The 64 KiB case is a bounded regression fixture intended to detect pathological behavior, not a promise that arbitrary unbounded input is safe or cheap.

Public parser calls must not mutate the supplied header record, fixture object, or previously returned result.

## 12. Coverage and Verification Gates

### 12.1 Commands

Add root commands:

```json
{
  "scripts": {
    "test:coverage": "jest --coverage --runInBand",
    "detection:check": "npm run fixture:check && npm run test:coverage",
    "fixture:check": "jest src/v2/__tests__/fixture-contract.test.ts --runInBand"
  }
}
```

The exact final script composition may include focused suites, but `detection:check` must fail on fixture-contract, detector-test, or coverage-threshold failure.

### 12.2 Coverage scope and thresholds

Coverage applies to production TypeScript under `src/v2/**` and excludes test files.

Global thresholds for that scope are:

```text
statements >= 90%
lines      >= 90%
functions  >= 90%
branches   >= 85%
```

Thresholds must not be lowered to make CI pass. A missed threshold is resolved by adding meaningful tests, removing unreachable code with justification, or narrowing collection only to generated/test files that were incorrectly included.

### 12.3 Existing gates remain mandatory

The final release gate includes:

- ESLint;
- all Jest suites;
- fixture validation;
- detector coverage threshold;
- ESM build;
- CommonJS build;
- package identity verification;
- npm tarball content verification;
- packed ESM consumer;
- packed CommonJS consumer;
- packed TypeScript Node16 consumer;
- `/server` consumer;
- `/browser` consumer;
- removed `/v2` assertion;
- Playground packed-consumer boundary, type-check, unit tests, build, and Chromium smoke;
- live npm verification on Node.js 18, 20, and 22 after publication.

## 13. Playground Alignment

The Playground remains a consumer, not an alternate source of detector truth.

After detector implementation stabilizes:

- update samples only for behaviors shipped by the library;
- add `OAI-SearchBot`, corrected Googlebot variants, and a `Google-Extended` negative sample when they improve explanation value;
- keep LINE LIFF as the primary browser/context separation example;
- install the packed root tarball before Playground validation;
- do not import fixtures or source modules into the Playground;
- do not add analytics, persistence, backend calls, or remote runtime assets.

## 14. Documentation and Release Artifacts

The implementation updates:

- `README.md` detection coverage and limitations;
- `docs/v2-design.md` with the v2.1 accuracy addendum;
- `CHANGELOG.md`, created using Keep a Changelog-style release sections;
- package version to `2.1.0` only after all implementation gates pass;
- GitHub release notes describing corrections, additions, and non-breaking boundaries.

Documentation must explicitly state:

- User-Agent and Client Hints are spoofable;
- `ua-info` reports claims and does not verify bot origin;
- provider-specific verification requires IP, reverse DNS, signed-agent, or provider-documented verification mechanisms outside this library;
- runtime-only browser identities cannot always be inferred by pure `parse()`.

## 15. Provenance Baseline

The initial fixture provenance records the authoritative pages used to define crawler semantics as of 2026-07-24:

| Authority | Purpose | Reference |
| --- | --- | --- |
| OpenAI | `OAI-SearchBot`, `GPTBot`, and crawler-purpose separation | `https://help.openai.com/en/articles/12627856-publishers-and-developers-faq` |
| OpenAI | `OAI-AdsBot` and `OAI-SearchBot` allowlisting guidance | `https://help.openai.com/en/articles/20001243-advertiser-guidance-for-allowing-openai-web-crawlers` |
| Google | Googlebot desktop/mobile behavior and spoofing warning | `https://developers.google.com/search/docs/crawling-indexing/googlebot` |
| Google | Common crawler HTTP User-Agent strings and `Google-Extended` control-token semantics | `https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers` |
| Perplexity | `PerplexityBot` versus user-triggered `Perplexity-User` | `https://docs.perplexity.ai/docs/resources/perplexity-crawlers` |

A fixture source URL is an audit reference, not permission to copy third-party implementation code or proprietary mapping datasets.

## 16. Delivery Sequence

Implementation proceeds in this order:

1. Fixture contracts, provenance registry, and validation.
2. Browser and engine precedence.
3. Client, bot, crawler, and false-positive corrections.
4. Context and WebView collision coverage.
5. Operating-system, device, and CPU coverage.
6. Client Hints and adapter robustness.
7. Global robustness tests and enforced coverage thresholds.
8. Playground sample alignment.
9. README, v2 design addendum, changelog, and package metadata.
10. Full CI, packed consumers, publication, and live Node.js verification.

Every production behavior change follows:

```text
source-backed or regression fixture
→ focused failing test
→ minimal implementation
→ focused passing test
→ full Jest suite
→ build and packed consumers
→ commit
```

## 17. Acceptance Criteria

The release is complete only when all of the following are true:

- Fixture IDs and provenance pass automated validation.
- Browser and engine precedence tests cover every supported derivative and platform-specific token.
- Chromium is no longer reported as Chrome when the explicit Chromium product token is used.
- `Google-Extended` is no longer reported as an HTTP client or AI agent from a User-Agent string.
- OpenAI and Google crawler additions are source-backed and tested.
- User-triggered fetchers are not forced into an inaccurate existing `ClientKind`.
- Context tests preserve browser identity and correctly derive browser mode.
- OS, device, CPU, and Client Hints matrices pass.
- Robustness tests pass without global access, mutation, or exceptions for malformed claims.
- Coverage for `src/v2/**` meets statements 90%, lines 90%, functions 90%, and branches 85%.
- No runtime dependency is added.
- Public types and entry points remain backward compatible with 2.0.x.
- Root and Playground full gates pass.
- `ua-info@2.1.0` publishes through npm Trusted Publishing with provenance.
- Clean live consumers pass on Node.js 18, 20, and 22.
- The GitHub release tag resolves to the exact package release commit.

## 18. Explicitly Deferred Work

The following items are outside this release:

- a new public kind for user-triggered fetchers;
- multi-client results;
- network-based bot verification;
- reverse-DNS or IP-range verification;
- signed-agent verification;
- automatic remote detector-data updates;
- generated detector catalogs;
- a full detector-registry rewrite;
- performance benchmark gates;
- bundle-size budgets;
- public API redesign;
- browser fingerprinting;
- analytics or telemetry.

These are candidates for later Public API & Developer Experience or Performance & Benchmark phases after v2.1.0 closes.
