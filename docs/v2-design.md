# ua-info 2.0 design

## Status

The 2.0 public model and entry-point boundaries are implemented and frozen. Version 2.0 is a breaking release: the modern parser is exported from the package root and the v1 class API is removed.

## Product scope

`ua-info` is a general-purpose User-Agent and Client Hints parser. The canonical result contains browser, rendering engine, operating system, device, CPU, non-browser client, and execution-context dimensions.

```ts
export interface UAResult {
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

## Browser, client, and context

`browser` contains only a browser product/runtime. Host applications such as LINE never replace Chrome, Safari, Firefox, or another underlying browser.

`browser.family` represents browser lineage such as `chromium`, `firefox`, or `safari`. Blink, Gecko, and WebKit belong in `engine`.

`browser.mode` distinguishes `browser`, `webview`, `headless`, `embedded`, and `unknown` execution modes.

`client` is nullable and contains the most specific selected non-browser actor, such as a crawler, AI agent, automation tool, or HTTP client. Ordinary browsers and in-app host applications do not duplicate themselves in this field.

`context` describes the execution surface separately from browser and client identity. Its host is nullable because surfaces such as standalone PWAs do not require a host application.

For LINE LIFF:

```text
browser.id      = chrome
browser.mode    = webview
context.kind    = mini-app
context.id      = liff
context.host.id = line
client          = null
```

## Client selection

When multiple classifications describe the same non-browser actor, selection uses this specificity order:

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

This selects one public client. It is not a public multi-agent model.

## Version semantics

`Version.raw` is canonical. `major` and `minor` are cross-product convenience values.

```ts
export interface Version {
  readonly raw: string;
  readonly major: number | null;
  readonly minor: number | null;
}
```

Versions are not assumed to follow Semantic Versioning. Full numeric comparison parses `raw` internally through `compareVersions()` and `satisfiesVersion()`.

## Entry-point boundaries

| API | Import | Inputs | Runtime-only context such as PWA |
| --- | --- | --- | --- |
| `parse(ua)` | `ua-info` | User-Agent string only | No |
| `parseRequest({ headers })` | `ua-info/server` | User-Agent plus request Client Hints | Partial |
| `detectCurrent()` | `ua-info/browser` | User-Agent, browser Client Hints, and runtime signals | Yes |

The pure parser must not read `navigator`, `document`, or other browser globals.

## Package contract

Version 2.0 exports:

```ts
import { parse, satisfiesVersion } from 'ua-info';
import { parseRequest } from 'ua-info/server';
import { detectCurrent } from 'ua-info/browser';
```

The package does not export `UAInfo`, `ua-info/v2`, `ua-info/v2/server`, or `ua-info/v2/browser`.

## Security and provenance

User-Agent strings and Client Hints are untrusted client claims, not proof of identity.

`ua-parser-js` may be used as a feature and coverage benchmark only. Its v2 regex mappings, fixtures, device data, extension data, and source implementation must not be copied. New detector data must have compatible licensing and documented provenance.

## Version 2.1 accuracy and provenance addendum

Version 2.1 preserves every public interface and entry-point boundary above. It adds a test-only fixture corpus, explicit precedence contracts, and enforced production coverage without adding a runtime dependency.

### Fixture-first detector changes

Every production detector correction begins with a failing fixture. Fixtures have globally unique IDs and record one of three source kinds:

- `official-doc` for provider or standards documentation;
- `captured` for a documented real User-Agent capture;
- `regression` for a synthetic collision that protects an established invariant.

Fixture and provenance modules remain under `src/v2/__tests__` and are excluded from emitted builds and npm tarballs.

### Precedence corrections

The v2.1 contract makes these behaviors executable:

- Explicit `Chromium/<version>` identifies Chromium; `Chrome/<version>` identifies Chrome.
- Product-specific Chromium derivatives continue to win over shared Chrome tokens.
- Headless, WebView, in-app, mini-app, and embedded modes do not replace browser product identity.
- Googlebot Image and Googlebot Video remain distinct crawler identities.
- `OAI-SearchBot` and `OAI-AdsBot` are crawler claims; `GPTBot` remains an AI-agent claim.
- `Google-Extended` is a robots control token and is not reported as an HTTP User-Agent client.
- `Perplexity-User` is not forced into an inaccurate autonomous crawler or AI-agent kind.
- iPad User-Agent strings reach the iPadOS-specific branch.

### Coverage gate

CI enforces these minimums across production `src/v2/**` code:

```text
statements >= 90%
lines      >= 90%
functions  >= 90%
branches   >= 85%
```

Thresholds must be met through meaningful behavior coverage. Production detector files may not be excluded and thresholds may not be lowered to make a release pass.

### Identity verification boundary

A detected browser, client, operating system, device, CPU, or context is a parsed claim only. Applications that require origin verification must use provider-documented server-side mechanisms such as IP-range validation, reverse DNS, signed-agent protocols, or equivalent controls.
