# ua-info v2.1 Detection Accuracy & Coverage Design

**Status:** Approved for implementation planning  
**Date:** 2026-07-24  
**Repository:** `petechatchawan/ua-info`  
**Target release:** `ua-info@2.1.0`

## 1. Purpose

Deliver an additive `ua-info` minor release that improves detection accuracy, source-backed coverage, collision handling, robustness, and regression protection without changing the public result model or package entry points.

The selected strategy is **fixture-first hardening with explicit precedence contracts**. Every production behavior change starts from a source-backed or regression fixture, demonstrates a focused failure, applies the smallest detector correction, and then passes the full package and Playground gates.

This release is not a detector rewrite. It preserves the existing orchestration in which `parse()` delegates independently to browser, engine, operating-system, device, CPU, client, and context detectors.

## 2. Frozen Release Contract

`ua-info@2.1.0` is an additive minor release.

- `UAResult` and all existing public interfaces remain unchanged.
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
- Node.js support remains `>=18`; CI remains Node.js 18, 20, and 22.
- ESM, CommonJS, TypeScript declarations, root, `/server`, `/browser`, and packed-consumer contracts remain mandatory.
- User-Agent and Client Hints values are untrusted claims. Detection never means authentication or origin verification.

## 3. Selected Approach and Alternatives

### Selected: fixture-first hardening

Add a test-only fixture corpus with provenance, executable precedence rules, focused regression tests, and coverage thresholds. Keep production changes local to the detector whose fixture proves the defect.

### Deferred: generic detector registry

A shared detector registry could reduce repetition, but it would create a large structural diff before accuracy is established. It is not required for v2.1.0.

### Deferred: generated detector catalog

A JSON/YAML catalog and code generator may become useful at a much larger catalog size. The current scope does not justify new generation machinery.

## 4. Architecture Boundary

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

Semantic boundaries remain:

- `browser` is a browser product or runtime.
- `engine` is the rendering engine.
- `browser.mode` is browser, WebView, headless, embedded, or unknown execution.
- `client` is the most specific selected non-browser actor.
- `context` is an execution surface such as an in-app browser, mini-app, PWA, or embedded host.
- Host applications never replace the underlying browser.

## 5. Test-Only Fixture Architecture

### 5.1 Repository topology

```text
src/v2/__tests__/
├── fixtures/
│   ├── fixture-types.ts
│   ├── provenance.ts
│   ├── browsers.ts
│   ├── clients.ts
│   ├── contexts.ts
│   ├── operating-systems.ts
│   ├── devices.ts
│   ├── client-hints.ts
│   ├── malformed.ts
│   └── index.ts
├── fixture-assertions.ts
├── fixture-contract.test.ts
├── precedence.test.ts
├── context-coverage.test.ts
├── platform-coverage.test.ts
├── client-hints-coverage.test.ts
└── robustness.test.ts
```

All fixture modules remain under `__tests__`. They must not be emitted into `dist` or included in the npm tarball.

### 5.2 Fixture contracts

```ts
import type { HeaderRecord } from '../../parser/client-hints';
import type { UAResult } from '../../types';

export type DeepPartial<T> =
  T extends readonly unknown[]
    ? T
    : T extends object
      ? { readonly [K in keyof T]?: DeepPartial<T[K]> }
      : T;

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

export interface RequestFixture extends DetectionFixture {
  readonly headers: HeaderRecord;
}
```

The distributive `DeepPartial<T>` is required so nullable nested fields such as `BrowserInfo | null` can be partially asserted without weakening production types.

### 5.3 Fixture rules

- IDs are globally unique, stable, lowercase kebab case.
- Every fixture has nonempty authority, reference, and ISO `YYYY-MM-DD` observation date.
- Official-document references use HTTPS.
- Real captures identify the capture source and date.
- Synthetic collision cases use `kind = 'regression'` and state the invariant they protect.
- Empty User-Agent is allowed only in malformed or request/Client Hints fixtures.
- Every fixture asserts at least one result field.
- Fixture matching uses recursive partial comparison; canonical unknown-result tests retain exact equality.
- No fixture claims cryptographic verification of a bot or client.

## 6. Browser and Engine Coverage

### 6.1 Precedence

```text
headless browser
> browser derivative or platform-specific token
> Firefox product token
> Chromium product token
> Chrome product token
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

### 6.2 Invariants

- Chrome, Edge, Firefox, and Opera identities on iOS remain distinct while the engine is WebKit.
- Firefox outside iOS uses Gecko.
- Chromium-family products outside iOS use Blink.
- Internet Explorer uses Trident.
- Headless Chrome remains Chrome with `browser.mode = 'headless'`.
- Android WebView remains Chrome with `browser.mode = 'webview'` unless a more-specific supported browser token is present.
- Context may change browser mode but never browser product identity.
- Safari requires a valid `Version/<version>` token and a Safari product token.
- Browser compatibility tokens inside crawler or application strings must not suppress `client` or `context`.

### 6.3 Required negative collisions

Fixtures must prevent:

- supported Chromium derivatives falling through to Chrome;
- explicit Chromium being reported as Chrome;
- iOS Chrome, Firefox, Edge, or Opera being reported as Safari;
- Android WebView being reported as ordinary Chrome;
- Headless Chrome being reported as ordinary Chrome;
- Safari being inferred from a lone compatibility token;
- crawler strings containing Chrome compatibility tokens losing their client identity.

Pure `parse()` does not promise detection of products that intentionally omit a distinguishable User-Agent token. Runtime-only Brave detection remains outside scope unless the browser exposes a supported User-Agent or Client Hints claim.

## 7. Client and Bot Coverage

### 7.1 Public semantics

`client` remains one selected non-browser actor. Existing specificity remains:

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

No multi-client result and no new `user-fetcher` kind are added.

### 7.2 Source-backed additions and corrections

Initial authoritative work includes:

- OpenAI `OAI-SearchBot` as a crawler claim.
- OpenAI `GPTBot` as the existing AI-agent claim.
- OpenAI `OAI-AdsBot` as a crawler claim when that HTTP User-Agent token is present.
- Anthropic `ClaudeBot` as the existing AI-agent claim.
- Perplexity `PerplexityBot` as the existing AI-agent claim.
- Googlebot desktop, smartphone, and generic short form as `googlebot`.
- Googlebot Image and Googlebot Video as distinct crawler identities.

### 7.3 Robots control tokens

A robots control token is not automatically an HTTP User-Agent token.

Google documents `Google-Extended` as a control token without a separate HTTP request User-Agent string. Therefore v2.1.0 must:

- remove `Google-Extended` from `CLIENT_PATTERNS`;
- prove `parse('Google-Extended').client === null`;
- retain the security statement that User-Agent matching is not bot verification.

### 7.4 User-triggered fetchers

Current public kinds cannot accurately represent every user-triggered fetcher.

- `Perplexity-User` must not be misclassified as `PerplexityBot`.
- User-triggered tokens are not forced into `crawler`, `ai-agent`, or `http-client` merely to increase coverage.
- A dedicated public kind is deferred to a separately designed API release.

### 7.5 Generic fallback

The generic bot fallback remains after explicit products and must:

- lose to explicit catalog entries;
- require a complete bot-like token boundary;
- avoid matching ordinary words that merely contain `bot`;
- preserve valid generic `bot`, `spider`, or `crawler` claims;
- tolerate malformed version suffixes without throwing.

## 8. Context and WebView Coverage

Context precedence remains:

```text
LINE LIFF
> LINE in-app browser
> supported in-app host
> supported mini-app host
> embedded framework
> null
```

Required coverage includes LINE LIFF, LINE without LIFF, Facebook, Instagram, TikTok, X, WeChat, Telegram Mini App, Electron, Capacitor, Cordova, standalone Android WebView, and host tokens coexisting with browser derivative tokens.

Invariants:

- LINE LIFF returns a LIFF mini-app context with a LINE host.
- LINE without `LIFF` returns an in-app-browser context.
- In-app and mini-app contexts change an existing browser mode to `webview`.
- Embedded contexts change an existing browser mode to `embedded`.
- Headless mode is never overwritten.
- Host version parsing is independent from browser version parsing.
- Host applications remain absent from `client`.
- Context detection never manufactures a browser when no browser product is present.

## 9. Operating System, Device, and CPU Coverage

### 9.1 Operating systems

Cover Windows NT mappings, Windows Phone precedence, iOS, iPadOS, Android, HarmonyOS, ChromeOS, macOS, Linux, KaiOS, Tizen, unknown, and malformed platform tokens.

Existing naming remains. Windows 11 is not inferred from `Windows NT 10.0` alone.

The iPadOS-specific branch must run before generic iOS so an iPad claim can report the existing `iPadOS` name.

### 9.2 Devices

Cover iPhone, iPad, iPod, Android mobile/tablet, supported Android vendor/model extraction, smart TV, console, wearable, XR, desktop, embedded framework, and unknown.

Model extraction ignores locale, architecture, `wv`, `mobile`, `tablet`, and `Build/...` metadata. Unknown prefixes retain `vendor = null` rather than guessing.

### 9.3 CPU

Cover ARM64, ARM 32-bit, x86_64, x86 32-bit, MIPS 32/64, RISC-V 64, PowerPC, SPARC, and unknown. CPU remains a nullable claim.

## 10. Client Hints Contract

### 10.1 Precedence

```text
full-version Client Hint
> low-entropy Client Hint
> User-Agent result
> null or unknown
```

Rules:

- `sec-ch-ua-full-version-list` takes precedence over `sec-ch-ua` for browser version.
- Recognized non-GREASE brands may establish or refine Chromium-family identity.
- Edge and Opera brands beat Chrome and Chromium brands.
- GREASE brands are ignored.
- recognized platform and platform-version hints may refine OS identity/version;
- nonempty model may refine device model;
- `?1` may promote type to mobile;
- `?0` does not demote known tablet, TV, console, wearable, XR, or embedded types;
- architecture and bitness refine CPU independently;
- unknown values preserve the current parsed value.

### 10.2 Input behavior

- Header names are case-insensitive.
- String-array values are joined consistently.
- Getter-backed and record-backed sources remain supported.
- Missing, partial, contradictory, malformed, or empty hints do not throw.
- Malformed brand fragments do not discard valid siblings.
- Prototype-like own keys remain ordinary input and do not mutate prototypes.

### 10.3 Browser adapter

`detectCurrent()` retains its current default high-entropy request. Tests cover missing navigator, no `userAgentData`, low entropy only, high-entropy success, empty requested list, PWA detection, existing host context beating PWA context, and explicit propagation of rejected high-entropy collection.

## 11. Robustness Contract

Public parsing remains deterministic for:

- empty and whitespace-only strings;
- Unicode and ASCII control characters;
- a bounded 64 KiB regression input;
- truncated and duplicated product tokens;
- contradictory browser tokens;
- malformed version separators;
- malformed Client Hints;
- unknown products.

The release does not add a runtime length rejection. The 64 KiB case is a bounded regression fixture, not a promise for arbitrary unbounded input.

Public calls must not mutate supplied headers, fixtures, or previously returned results.

## 12. Verification Gates

Add root commands:

```json
{
  "fixture:check": "jest src/v2/__tests__/fixture-contract.test.ts --runInBand",
  "test:coverage": "jest --coverage --runInBand",
  "detection:check": "npm run fixture:check && npm run test:coverage"
}
```

Coverage applies to production TypeScript under `src/v2/**`, excluding tests and declaration files.

```text
statements >= 90%
lines      >= 90%
functions  >= 90%
branches   >= 85%
```

Thresholds are never lowered to pass CI.

Final gates include:

- ESLint;
- all Jest suites;
- fixture validation;
- detector coverage thresholds;
- ESM and CommonJS builds;
- package identity and tarball verification;
- packed ESM, CommonJS, TypeScript Node16, `/server`, and `/browser` consumers;
- removed `/v2` assertion;
- Playground packed-consumer boundary, type-check, tests, build, and Chromium smoke;
- live npm verification on Node.js 18, 20, and 22.

## 13. Playground Alignment

The Playground remains a packed public consumer, not an alternate detector source.

After detector behavior stabilizes:

- add explanatory samples only for shipped behavior;
- include `OAI-SearchBot`, Googlebot Image, and a `Google-Extended` negative-control sample;
- retain LINE LIFF as the main browser/context example;
- never import fixture or source modules into the Playground;
- retain local-only processing and no analytics, persistence, backend calls, or remote runtime assets.

## 14. Documentation and Release Artifacts

Implementation updates:

- `README.md` coverage and limitations;
- `docs/v2-design.md` with a v2.1 addendum;
- new `CHANGELOG.md` using Keep a Changelog-style sections;
- package version and identity verifier to `2.1.0` only after all implementation gates pass;
- GitHub release notes describing additions, corrections, compatibility, and claim limitations.

Documentation explicitly states that provider-specific origin verification requires mechanisms such as IP ranges, reverse DNS, signed agents, or provider-documented verification outside this library.

## 15. Provenance Baseline

Authoritative pages recorded as of 2026-07-24:

| Authority | Purpose | Reference |
| --- | --- | --- |
| OpenAI | `OAI-SearchBot`, `GPTBot`, and purpose separation | `https://help.openai.com/en/articles/12627856-publishers-and-developers-faq` |
| OpenAI | `OAI-AdsBot` and allowlisting guidance | `https://help.openai.com/en/articles/20001243-advertiser-guidance-for-allowing-openai-web-crawlers` |
| Google | Googlebot desktop/mobile and spoofing warning | `https://developers.google.com/search/docs/crawling-indexing/googlebot` |
| Google | Common HTTP User-Agent strings and `Google-Extended` control-token semantics | `https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers` |
| Perplexity | `PerplexityBot` versus `Perplexity-User` | `https://docs.perplexity.ai/docs/resources/perplexity-crawlers` |

References support semantic decisions only. No third-party implementation, proprietary regex dataset, or incompatible fixture corpus is copied.

## 16. Delivery Sequence

1. Fixture contracts and provenance validation.
2. Browser and engine precedence.
3. Client and crawler additions and false-positive corrections.
4. Context and WebView collision coverage.
5. OS, device, and CPU coverage.
6. Client Hints and browser-adapter robustness.
7. Global robustness and coverage thresholds.
8. Playground sample alignment.
9. README, v2 design addendum, changelog, and package identity.
10. CI, publication, live consumers, and GitHub release verification.

Every production change follows:

```text
source-backed or regression fixture
→ focused failing test
→ minimal correction
→ focused passing test
→ full Jest suite
→ build and packed consumers
→ commit
```

## 17. Acceptance Criteria

The release is complete only when:

- fixture IDs and provenance validate automatically;
- supported browser precedence is executable and complete;
- explicit Chromium no longer reports Chrome;
- `Google-Extended` no longer reports a client;
- OpenAI and Google additions are source-backed;
- user-triggered fetchers are not forced into an inaccurate `ClientKind`;
- contexts preserve browser identity and derive mode correctly;
- iPadOS precedence is reachable;
- OS, device, CPU, Client Hints, adapter, and robustness matrices pass;
- coverage meets statements 90%, lines 90%, functions 90%, branches 85%;
- no runtime dependency is added;
- public types and entry points remain compatible with 2.0.x;
- root and Playground gates pass;
- `ua-info@2.1.0` publishes through npm Trusted Publishing with provenance;
- clean Node.js 18/20/22 consumers pass;
- `v2.1.0` resolves to the exact package release commit.

## 18. Explicitly Deferred

- new public kind for user-triggered fetchers;
- multi-client results;
- network, reverse-DNS, IP-range, or signed-agent verification;
- remote detector-data updates;
- generated detector catalogs;
- full detector-registry rewrite;
- performance benchmark gates and bundle budgets;
- public API redesign;
- browser fingerprinting;
- analytics or telemetry.
