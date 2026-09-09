# ua-info v3 Simple API Design

**Status:** Approved design, revised after Ponytail review
**Date:** 2026-09-09
**Scope:** Breaking v3 redesign of the public API and detector contracts

## 1. Purpose

`ua-info` v3 is a small, parser-first User-Agent library for application branching across browser, OS, device, client, and app-context signals.

The public mental model is:

```text
parse -> info -> check
```

Typical use:

```ts
const info = parse(userAgent)

if (isChrome(info) && isAndroid(info) && isMobile(info)) {
  // ...
}
```

Browser runtime use:

```ts
const info = await detect({ liff })

if (isLine(info) && isLiff(info)) {
  // ...
}
```

The package does not introduce a detector registry, plugin framework, builder API, or stateful parser instance for ordinary use.

## 2. Goals

- Keep the API centered on `parse()`, `detect()`, `parseRequest()`, and predicates.
- Keep `parse()` synchronous, deterministic, and free of runtime-global reads.
- Keep `UAInfo` plain and serializable.
- Make common checks readable: `isChrome()`, `isAndroid()`, `isMobile()`, `isLine()`, `isLiff()`.
- Keep generic predicates for less-common identities.
- Let browser/server adapters enrich the same result model with stronger evidence.
- Prefer evidence over guesses; unresolved values are `null`.
- Support current browsers using an evidence-backed catalog rather than an unbounded historical list.
- Keep zero runtime dependencies in the core package.
- Preserve tree-shakeable browser/server/check entry points and ESM/CJS consumers.

## 3. Non-goals

- Authenticating browser, device, bot, or application identity.
- Fingerprinting users.
- Shipping logos, marketing metadata, vendor URLs, or brand assets in parser results.
- Supporting every historical browser indefinitely.
- Treating every Chromium derivative as a dedicated product without reliable evidence.
- Requesting high-entropy Client Hints by default.
- Depending directly on `@line/liff` or application frameworks.

## 4. Public Entry Points

### `ua-info`

```ts
import { parse } from 'ua-info'

export function parse(userAgent: string): UAInfo
```

`parse()` accepts a string. Adapters normalize missing headers/runtime values before calling it; the core parser does not accept `undefined` as a convenience overload.

### `ua-info/check`

```ts
import {
  isChrome,
  isAndroid,
  isMobile,
  isLine,
  isLiff,
} from 'ua-info/check'
```

All predicates consume an existing `UAInfo`. They never accept or reparse a User-Agent string.

Generic predicates preserve useful TypeScript narrowing. Named convenience predicates return `boolean` and delegate to the same primitive comparisons.

### `ua-info/browser`

```ts
import { detect } from 'ua-info/browser'

export function detect(options?: DetectOptions): Promise<UAInfo>
```

```ts
export interface DetectOptions {
  readonly highEntropy?: boolean
  readonly liff?: LiffAdapter
}

export interface LiffAdapter {
  isInClient(): boolean
}
```

`ua-info` does not import `@line/liff`; callers may pass any structurally compatible object.

### `ua-info/server`

```ts
import { parseRequest } from 'ua-info/server'
```

```ts
export type HeaderValue = string | readonly string[] | undefined
export type HeaderRecord = Readonly<Record<string, HeaderValue>>

export interface HeaderGetter {
  get(name: string): string | null
}

export type HeaderSource = HeaderRecord | HeaderGetter

export interface RequestLikeInput {
  readonly headers: HeaderSource
  readonly userAgent?: string
}

export type ParseRequestInput = HeaderSource | RequestLikeInput

export function parseRequest(input: ParseRequestInput): UAInfo
```

A Web Standard `Request` satisfies `RequestLikeInput` structurally through its `headers` property, so the server types do not require DOM `Request` typings. All accepted forms normalize to one internal detection input. No framework-specific adapter is required for inputs that can supply headers.

## 5. Canonical Result Model

Every top-level dimension is present. Unknown fields are `null`; v3 does not use `unknown` identity sentinel strings.

```ts
export interface UAInfo {
  readonly ua: string
  readonly browser: BrowserInfo
  readonly engine: EngineInfo
  readonly os: OSInfo
  readonly device: DeviceInfo
  readonly cpu: CPUInfo
  readonly client: ClientInfo
  readonly context: ContextInfo
}
```

### Version

```ts
export interface Version {
  readonly full: string
  readonly major: number | null
}
```

A missing product version is represented by `version: null`. Versions are not assumed to be SemVer. `minor` and `patch` are not canonical fields.

### Product reference

```ts
export interface ProductInfo<TName extends string = string> {
  readonly name: TName | null
  readonly version: Version | null
}
```

`name` is the stable lowercase machine identity, not a display label.

### Browser

```ts
export interface BrowserInfo {
  readonly name: BrowserId | null
  readonly version: Version | null
  readonly family: BrowserFamily | null
  readonly mode: BrowserMode | null
}

export type BrowserFamily = 'chromium' | 'firefox' | 'safari'
export type BrowserMode = 'browser' | 'webview' | 'headless'
```

`browser.family` describes product lineage, not the rendering engine. For example, Chrome or Edge on iOS can have Chromium product lineage while the engine is WebKit.

`browser.mode` describes browser execution evidence only. Initial v3 does not expose a generic application-embedding classification; if one is added later, it belongs in `context`, not in `browser.mode`.

### Engine

```ts
export interface EngineInfo {
  readonly name: EngineId | null
  readonly version: Version | null
}
```

An engine version is only returned when evidence supports that engine version. Chrome's version must not be copied into Blink merely because Chrome normally uses Blink.

### Operating system

```ts
export interface OSInfo {
  readonly name: OSId | null
  readonly version: Version | null
}
```

### Device

```ts
export type DeviceType =
  | 'desktop'
  | 'mobile'
  | 'tablet'
  | 'smart-tv'
  | 'console'
  | 'wearable'
  | 'xr'
  | 'embedded'

export interface DeviceInfo {
  readonly type: DeviceType | null
  readonly vendor: string | null
  readonly model: string | null
}
```

`mobile` and `tablet` are exact classes:

- phone-class device -> `isMobile() === true`, `isTablet() === false`
- tablet -> `isMobile() === false`, `isTablet() === true`

### CPU

```ts
export interface CPUInfo {
  readonly architecture: CPUArchitecture | null
  readonly bitness: 32 | 64 | null
}
```

### Client

`client` represents the selected non-browser agent/client. Ordinary browsers keep all client fields null.

```ts
export type ClientType =
  | 'bot'
  | 'crawler'
  | 'ai-crawler'
  | 'ai-assistant'
  | 'automation'
  | 'http-client'
  | 'library'
  | 'email-client'
  | 'media-player'

export interface ClientInfo {
  readonly type: ClientType | null
  readonly name: string | null
  readonly version: Version | null
}
```

`ClientInfo.name` intentionally remains `string | null` rather than a closed union because bot, crawler, automation, HTTP-client, library, and other non-browser identities form an open-ended catalog. Recognized built-in clients still use normalized stable lowercase names.

Client types are selected leaf classifications. Umbrella predicates have fixed membership:

| Predicate         | True for client types          |
| ----------------- | ------------------------------ |
| `isBot()`         | `bot`, `crawler`, `ai-crawler` |
| `isCrawler()`     | `crawler`, `ai-crawler`        |
| `isAICrawler()`   | `ai-crawler` only              |
| `isAIAssistant()` | `ai-assistant` only            |
| `isAutomation()`  | `automation` only              |

Automation and AI assistants are not silently reclassified as bots.

### Context

```ts
export type ContextType =
  | 'in-app-browser'
  | 'mini-app'
  | 'pwa'

export interface ContextInfo {
  readonly type: ContextType | null
  readonly name: ContextId | null
  readonly host: ProductInfo | null
}
```

`context.name` identifies the execution context. `context.host` identifies the hosting application when that is a separate identity.

Examples:

```ts
// LINE ordinary in-app browser
context: {
  type: 'in-app-browser',
  name: 'line',
  host: { name: 'line', version: ... }
}
```

```ts
// LIFF browser inside LINE
context: {
  type: 'mini-app',
  name: 'liff',
  host: { name: 'line', version: ... }
}
```

## 6. Stable Identifiers

Machine-facing identities use lowercase stable names such as:

```text
chrome
chromium
edge
firefox
safari
opera
samsung-internet
brave
vivaldi
mi-browser
huawei-browser
uc-browser
yandex-browser
arc
```

Exported constants are the canonical spelling source. Display names are documentation/UI concerns, not parser data.

Renaming a stable identity is a breaking change. Browser, OS, engine, and context identities are closed exported unions; `ClientInfo.name` is intentionally open-ended as described above.

## 7. Predicate API

Detection logic lives in parsers/enrichers. Predicates only query `UAInfo`.

### Generic predicates

```ts
isBrowser(info, name: string)
isBrowserFamily(info, family: BrowserFamily)
isBrowserMode(info, mode: BrowserMode)
isEngine(info, name: string)
isOS(info, name: string)
isDevice(info, type: DeviceType)
isClient(info, type: ClientType)
isContext(info, name: string)
```

Generic identity predicates may accept arbitrary strings for comparison and type narrowing, but they do not teach the parser to detect new identities.

### Browser predicates

Initial convenience set:

```ts
isChrome(info)
isChromium(info)
isSafari(info)
isFirefox(info)
isEdge(info)
isOpera(info)
isSamsungInternet(info)
isBrave(info)
isVivaldi(info)
isMiBrowser(info)
isHuaweiBrowser(info)
isUCBrowser(info)
isYandexBrowser(info)
isArc(info)
```

For lineage checks, use the explicit primitive:

```ts
isBrowserFamily(info, 'chromium')
```

This is preferred over a separate `isChromiumBased()` alias because family is a first-class result dimension and is distinct from engine identity.

Exact identity semantics:

```text
Chrome   -> isChrome true,   isChromium false, family chromium
Edge     -> isEdge true,     isChrome false,   family chromium
Brave    -> isBrave true,    isChrome false,   family chromium
Chromium -> isChromium true only when Chromium product identity is established
```

A generic Chromium-family fallback must be represented as:

```ts
browser.name === null
browser.family === 'chromium'
```

It must not set `browser.name = 'chromium'` unless evidence identifies the Chromium product itself.

### OS predicates

```ts
isAndroid(info)
isIOS(info)
isIPadOS(info)
isWindows(info)
isMacOS(info)
isLinux(info)
isChromeOS(info)
isHarmonyOS(info)
isKaiOS(info)
isTizen(info)
```

### Device predicates

```ts
isMobile(info)
isTablet(info)
isDesktop(info)
isSmartTV(info)
isConsole(info)
isWearable(info)
isXR(info)
isEmbeddedDevice(info)
```

### Client predicates

```ts
isBot(info)
isCrawler(info)
isAICrawler(info)
isAIAssistant(info)
isAutomation(info)
isHttpClient(info)
isEmailClient(info)
isMediaPlayer(info)
```

### Browser/context predicates

```ts
isWebView(info)
isHeadless(info)
isInAppBrowser(info)
isPWA(info)
isLine(info)
isLiff(info)
isFacebook(info)
isInstagram(info)
isMessenger(info)
isWeChat(info)
```

`isInAppBrowser()` is true only for `context.type === 'in-app-browser'`. A `mini-app` such as LIFF is not implicitly classified as the same context type.

## 8. Browser Support Catalog

Support is evidence-backed rather than tier-driven. A browser only receives a dedicated identity when a reliable signal exists; otherwise v3 returns the strongest correct family/base result it can prove.

The initial v3 catalog is:

| Browser / behavior                 | Stable identity                     | Evidence expected                                          | Named predicate     | Notes                                   |
| ---------------------------------- | ----------------------------------- | ---------------------------------------------------------- | ------------------- | --------------------------------------- |
| Google Chrome                      | `chrome`                            | UA token and/or Chrome UA-CH brand                         | `isChrome`          | Mainstream                              |
| Apple Safari                       | `safari`                            | Safari eligibility + Version token                         | `isSafari`          | Mainstream                              |
| Microsoft Edge                     | `edge`                              | Edge platform token and/or Edge UA-CH brand                | `isEdge`            | Must beat Chrome fallback               |
| Mozilla Firefox                    | `firefox`                           | Firefox/FxiOS token                                        | `isFirefox`         | Engine differs on iOS                   |
| Opera                              | `opera`                             | OPR/OPiOS/OPT/Opera-specific evidence                      | `isOpera`           | Must beat Chrome fallback               |
| Samsung Internet / Samsung Browser | `samsung-internet`                  | SamsungBrowser evidence                                    | `isSamsungInternet` | Active mainstream mobile browser        |
| Brave                              | `brave`                             | Brave UA-CH brand or current platform-specific Brave token | `isBrave`           | Chrome-like UA can hide identity        |
| Vivaldi                            | `vivaldi`                           | Vivaldi token/evidence                                     | `isVivaldi`         | Active Chromium browser                 |
| Xiaomi Mi Browser                  | `mi-browser`                        | MiuiBrowser/Xiaomi product evidence                        | `isMiBrowser`       | First-class Xiaomi/MIUI support         |
| Huawei Browser                     | `huawei-browser`                    | HuaweiBrowser evidence                                     | `isHuaweiBrowser`   | Active Huawei mobile browser            |
| UC Browser                         | `uc-browser`                        | UCBrowser/platform-specific evidence                       | `isUCBrowser`       | Still relevant on mobile markets        |
| Yandex Browser                     | `yandex-browser`                    | YaBrowser/platform-specific evidence                       | `isYandexBrowser`   | Active desktop/mobile browser           |
| Arc                                | `arc`                               | Arc-specific evidence where available                      | `isArc`             | Fallback when identity cannot be proven |
| Chromium product                   | `chromium`                          | Explicit Chromium product token/brand                      | `isChromium`        | Not a synonym for Chromium-family       |
| Android WebView                    | browser identity + `mode='webview'` | WebView UA/runtime evidence                                | `isWebView`         | Mode, not a separate product identity   |

The catalog is reviewed at releases using current usage, active vendor support, reliable signals, fixtures, and real consumer demand.

As of September 2026, current usage data supports prioritizing Chrome, Safari, Edge, Firefox, Samsung Internet/Browser, and Opera globally, while active vendor browsers such as Mi Browser, Huawei Browser, UC Browser, Brave, Vivaldi, and Yandex remain justified by product activity and/or regional usage.

Browsers such as DuckDuckGo Browser, Dia, or future derivatives should not receive speculative identities merely because the product exists. Add first-class support when a reliable observable signal and fixtures exist; otherwise return a correct family/base fallback.

Internet Explorer and legacy EdgeHTML are not part of the current-browser catalog. If retained at all for migration coverage, legacy parsing stays isolated and must not complicate modern detection paths.

## 9. Browser Detection Ordering

Derivative identities must be evaluated before their base fallback when tokens overlap.

Conceptual Chromium-family ordering:

```text
specific reliable runtime/UA-CH product evidence
  -> known derivative UA evidence
  -> Chrome product evidence
  -> Chromium product evidence
  -> family-only chromium fallback
```

The implementation should use an ordered declarative pattern table for straightforward derivatives and a small number of explicit special cases.

Safari eligibility, iOS tokens, Android WebView, headless mode, and other precedence-sensitive cases may remain explicit rather than being forced into one generic abstraction.

## 10. Field-Level Evidence Merge Contract

There is no blanket rule that replaces an entire result dimension merely because a stronger source exists. Evidence is merged by field and compatibility.

The rules are:

1. **Specific product beats generic family.** A generic `Chromium` Client Hint must not replace a reliably detected `mi-browser`, `edge`, or other specific Chromium-family product.
2. **Identity-specific evidence may replace weaker identity.** A reliable Brave UA-CH brand may refine a Chrome-like UA result to `brave`.
3. **Versions belong to identities.** When identity changes, an incompatible version from the previous identity is discarded unless evidence also provides a version for the selected product.
4. **Same-product detail can enrich.** Full-version evidence may replace significant-version evidence for the same product.
5. **Missing compatible fields preserve weaker evidence.** A stronger source that says nothing about model/version/architecture does not erase a compatible value already established.
6. **Runtime signals affect only what they prove.** LIFF runtime evidence changes context; it does not rewrite unrelated browser/OS fields.
7. **Unresolved conflict becomes conservative.** If evidence cannot be reconciled safely, retain the strongest compatible fact and set the disputed field to `null` rather than guessing.

Conceptual evidence strength remains:

```text
explicit runtime signal
  -> Client Hints
  -> User-Agent
  -> conservative heuristic
```

but the order is applied only to fields the source can actually establish.

Browser and server adapters normalize evidence into structured objects. Browser `NavigatorUAData` must not be serialized into fake HTTP headers and parsed back again.

## 11. LINE and LIFF Contract

LINE host detection and LIFF-browser detection are distinct.

### Predicate mapping

```ts
export function isLine(info: UAInfo): boolean {
  return info.context.name === 'line' || info.context.host?.name === 'line'
}

export function isLiff(info: UAInfo): boolean {
  return info.context.type === 'mini-app' && info.context.name === 'liff'
}
```

These are semantic definitions; implementation may use equivalent allocation-free checks.

### Pure `parse()`

A LINE UA may establish ordinary LINE app context:

```ts
context: {
  type: 'in-app-browser',
  name: 'line',
  host: { name: 'line', version: ... }
}
```

`parse(userAgent)` does **not** establish LIFF merely from generic LINE/LIFF-looking UA text. Therefore a pure parse may produce:

```ts
isLine(info) // true
isLiff(info) // false
```

### Browser runtime

When a caller supplies `liff`:

| Runtime result               | Effect                                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| `liff.isInClient() === true` | establish `{ type: 'mini-app', name: 'liff', host.name: 'line' }`                  |
| `false`                      | do not establish LIFF; preserve independently reliable LINE/other context evidence |
| adapter absent               | no LIFF runtime claim                                                              |
| adapter throws               | ignore the failed optional integration and preserve other evidence                 |

A runtime `true` is authoritative for LIFF-browser execution even if the UA is generic. A runtime `false` does not erase a separately detected LINE in-app browser; it only means LIFF-browser execution was not established.

`isLiff()` therefore means **running in the LIFF browser/client context**, not merely “this web app uses the LIFF SDK.” A LIFF app opened in an external browser is not `isLiff()`.

## 12. Client Hints Contract

Client Hints are progressive enhancement.

### Default browser detection

```ts
await detect()
```

Uses available low-entropy UA data when present and falls back to User-Agent parsing. It does not request high-entropy values solely for completeness.

### Explicit high entropy

```ts
await detect({ highEntropy: true })
```

`true` requests the library's documented supported set, initially:

```text
architecture
bitness
fullVersionList
model
platformVersion
```

Unsupported, denied, malformed, or failed high-entropy access falls back to existing evidence without making normal detection fail.

### Server request parsing

`parseRequest(input)` reads every supported `Sec-CH-UA-*` request header that is already present and merges it with User-Agent evidence. It has no `highEntropy` option because server-side parsing cannot request missing hints from the current request.

Supported request headers initially include:

```text
Sec-CH-UA
Sec-CH-UA-Mobile
Sec-CH-UA-Platform
Sec-CH-UA-Full-Version-List
Sec-CH-UA-Arch
Sec-CH-UA-Bitness
Sec-CH-UA-Model
Sec-CH-UA-Platform-Version
```

Low-entropy hints may arrive without opt-in. Additional/high-entropy hints are only used when the caller's HTTP stack has already negotiated them and the user agent actually sends them. `ua-info` does not emit or manage `Accept-CH`, `Critical-CH`, `Permissions-Policy`, or response caching headers; that negotiation remains the caller/framework responsibility. Missing hints simply fall back to compatible User-Agent evidence.

## 13. Internal Detection Input

Browser and server paths normalize to one internal representation:

```ts
interface DetectionInput {
  readonly ua: string
  readonly clientHints: ClientHints | null
  readonly runtime: RuntimeEvidence | null
}
```

HTTP header parsing exists only at the server boundary. Browser runtime data is converted directly into structured Client Hints values.

The parser/enricher pipeline produces one `UAInfo`; adapters do not maintain parallel result models.

## 14. Error and Null Semantics

- `parse(userAgent)` requires a string.
- Adapters normalize missing User-Agent input to `''` before parsing.
- Unsupported identity -> identity field `null`.
- Family known but product unknown -> product `name: null`, family retained.
- Product known but family not reliably established -> product `name` retained, `browser.family: null`. A specific vendor identity does not force a lineage guess.
- Missing version -> `version: null`.
- Known version text with unparsable major -> `version.full` retained, `version.major: null`.
- Malformed Client Hint field -> ignore that field and continue with compatible evidence.
- Optional runtime integration failure -> ignore that integration and continue.
- Detection claims are not authentication or authorization evidence.

## 15. Adding Browser or Context Support

A new first-class identity requires:

1. stable machine identity,
2. reliable observable signal,
3. current positive fixture from a credible source,
4. collision/precedence fixture when it overlaps another identity,
5. generic predicate compatibility,
6. named predicate only when common usage justifies it,
7. documented limitations when the product masks its identity.

The same evidence bar applies before adding a new `ContextType` member. The initial v3 context taxonomy intentionally excludes a generic embedded-application type until a concrete public signal and fixture contract justify it.

No registry/plugin subsystem is introduced. The detector catalog is internal data and focused functions.

## 16. Testing Strategy

### Public contracts

Test result shape, null semantics, entry-point exports, and TypeScript predicate narrowing.

### Browser catalog fixtures

Every first-class browser in the support table must have authoritative/current positive fixtures for supported signals and collision tests where appropriate.

Initial coverage includes:

- Chrome
- Safari
- Firefox
- Edge
- Opera
- Samsung Internet / Samsung Browser
- Brave with UA-CH and platform-specific evidence
- Vivaldi
- Mi Browser
- Huawei Browser
- UC Browser
- Yandex Browser
- Arc where reliable evidence exists
- explicit Chromium product
- Chromium-family-only fallback
- Android WebView
- supported iOS browser tokens

### Predicate matrix

At minimum:

```text
Chrome   -> isChrome true,   isChromium false, family chromium
Edge     -> isEdge true,     isChrome false,   family chromium
Brave    -> isBrave true,    isChrome false,   family chromium
Family   -> name null,       isChromium false, family chromium
```

### Evidence merge tests

Lock cases where:

- generic Chromium Client Hints do not erase a specific Mi/Edge/etc. UA identity,
- Brave Client Hints refine a Chrome-like UA,
- same-product full versions enrich reduced versions,
- identity replacement does not retain the previous product's version,
- malformed sibling hints do not discard valid evidence.

### Context matrix

Test LINE in-app, LIFF runtime true, LIFF runtime false, missing adapter, throwing adapter, external browser, and PWA contexts independently.

### Package consumers

Continue packed-artifact tests for ESM, CJS, TypeScript, browser, and server consumers.

## 17. Performance and Package Constraints

v3 adds no runtime dependency merely to implement the redesign.

Keep only meaningful performance/package gates:

- no accidental published-file growth,
- no material core bundle regression without review,
- no severe parser throughput regression,
- packed consumer tests pass.

The implementation plan should simplify duplicated build/package verification where safe instead of expanding the current performance framework.

## 18. Migration Boundary from v2

v3 is intentionally breaking.

Expected migration points:

- `UAResult` -> `UAInfo`.
- Top-level dimensions become fixed objects; their unknown fields are `null`.
- Machine identity is exposed consistently through `name` fields.
- `Version.raw` -> `Version.full`; canonical `minor` is removed.
- `unknown` sentinel values -> `null`.
- `detectCurrent()` -> `detect()` from `ua-info/browser`.
- convenience predicates -> `ua-info/check`.
- `isOperatingSystem()` -> `isOS()`.
- `isDeviceType()` -> `isDevice()`.
- Xiaomi identity `xiaomi-browser` -> `mi-browser`.
- v2 `BrowserMode.Embedded` / `ContextKind.Embedded` are not part of the initial v3 context contract; embedded-application classification is deferred until a concrete signal and fixture contract is specified.
- legacy IE/EdgeHTML behavior does not define the modern browser architecture.

A published v3 release must include a dedicated v2 -> v3 migration guide.

## 19. Simplicity Rules

1. One `UAInfo` is the source of truth.
2. Predicates derive; they never detect or reparse.
3. Adapters enrich the same model; they do not invent a second model.
4. Evidence merges by field and compatibility, not wholesale replacement.
5. Specific product evidence beats generic family evidence.
6. Unknown means `null`, not a speculative identity.
7. New identities add signals + fixtures before architecture.
8. Named helpers wrap stable generic primitives.
9. Context and browser mode do not duplicate the same application state.
10. Historical compatibility must not complicate current-browser code paths.
11. No framework integration when structural inputs are sufficient.
12. The codebase must remain understandable without a registry/plugin subsystem.

## 20. Acceptance Criteria

v3 is ready to implement when the resulting design supports all of the following:

- Common checks read naturally in 3-5 lines.
- `isChrome`, `isSafari`, `isFirefox`, `isEdge`, `isOpera`, `isSamsungInternet`, and current vendor-browser checks are directly available.
- Mi Browser is a first-class supported identity with fixtures and `isMiBrowser()`.
- Generic Chromium-family fallback never produces a false-positive `isChromium()`.
- LINE and LIFF have distinct, tested semantics.
- Client Hints cannot erase a more-specific compatible product merely because their source is stronger.
- Browser identity, lineage, engine, OS, device, client, and context remain independently queryable.
- New browser identities can be added through focused detector data/functions and fixtures without architectural changes.
- Unsupported or conflicting evidence resolves conservatively.
- Every advertised browser identity has fixture evidence rather than relying on line coverage alone.
