# ua-info v2 design

## Status

The v2 public model and entry-point boundaries are frozen and implemented in `ua-info` 1.3.0. The existing v1 API remains available from the package root; the modern parser is opt-in through `ua-info/v2`, `ua-info/server`, and `ua-info/browser`.

## Product scope

`ua-info` v2 is a general-purpose User-Agent and Client Hints parser. LINE and LIFF are representative in-app fixtures, not the product boundary.

The canonical result contains:

- browser
- rendering engine
- operating system
- device
- CPU
- selected non-browser client
- execution context

## Canonical result

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

### Browser

`browser` contains only a browser product/runtime. Host applications such as LINE must never replace Chrome, Safari, Firefox, or another underlying browser.

`browser.family` represents browser lineage such as `chromium`, `firefox`, or `safari`. Rendering-engine identities such as Blink, Gecko, and WebKit belong in `engine`.

`browser.mode` distinguishes `browser`, `webview`, `headless`, `embedded`, and `unknown` execution modes.

### Client

`client` is nullable and represents the most specific selected non-browser actor. Ordinary browsers and in-app host applications do not duplicate themselves in this field.

Examples:

- Chrome: `client = null`
- LINE LIFF: `client = null`, LINE is stored in `context.host`
- AhrefsBot: `client.kind = 'crawler'`
- GPTBot: `client.kind = 'ai-agent'`
- Playwright: `client.kind = 'automation'`
- curl: `client.kind = 'http-client'`

When several classifications describe the same actor, the public selection follows:

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

This is a singular public-client selection rule, not a public multi-agent model.

### Context

`context` describes the execution surface separately from browser and client identity.

```ts
export interface ContextInfo {
  readonly kind: 'in-app-browser' | 'mini-app' | 'pwa' | 'embedded' | 'unknown';
  readonly id: string | null;
  readonly name: string | null;
  readonly host: ProductInfo | null;
}
```

The host is nullable because standalone PWA contexts do not require a host application.

LINE LIFF resolves as:

```text
browser.id      = chrome
browser.mode    = webview
context.kind    = mini-app
context.id      = liff
context.host.id = line
client          = null
```

## Version semantics

`Version.raw` is canonical. `major` and `minor` are convenience values with stable meaning across product families.

```ts
export interface Version {
  readonly raw: string;
  readonly major: number | null;
  readonly minor: number | null;
}
```

Versions are not assumed to follow Semantic Versioning. Full numeric comparison parses `raw` internally through `compareVersions()` and `satisfiesVersion()`.

Missing comparison segments are treated as zero. Malformed values and unsupported range syntax do not throw; comparison returns `null` and range checks return `false`.

## Entry-point capability boundaries

| API | Package | Inputs | Runtime-only context such as PWA |
| --- | --- | --- | --- |
| `parse(ua)` | `ua-info/v2` | User-Agent string only | No |
| `parseRequest({ headers })` | `ua-info/server` | User-Agent plus request Client Hints | Partial |
| `detectCurrent()` | `ua-info/browser` | User-Agent, browser Client Hints, and runtime signals | Yes |

The pure parser never reads `navigator`, `document`, or other browser globals. Runtime enrichment belongs in the browser entry point.

## Package boundaries

```ts
import { UAInfo } from 'ua-info';
import { parse, satisfiesVersion, type UAResult } from 'ua-info/v2';
import { parseRequest } from 'ua-info/server';
import { detectCurrent } from 'ua-info/browser';
```

The package publishes native ESM and CommonJS outputs and verifies all entry points from a packed tarball.

## Compatibility policy

V2 is additive in version 1.3.0. The package root retains the existing v1 API and result shape. Consumers migrate explicitly by importing a v2 subpath.

## Security and provenance

User-Agent strings and Client Hints are untrusted client claims, not proof of identity.

`ua-parser-js` may be used as a feature and coverage benchmark only. Its v2 regex mappings, fixtures, device data, extension data, and source implementation must not be copied. New detector data must have compatible licensing and documented provenance.
