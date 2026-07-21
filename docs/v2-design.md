# ua-info v2 design

## Status

The v2 public model is frozen for implementation. This document is the concise reference for the public result shape and entry-point boundaries. The existing v1 API remains unchanged while v2 is developed behind the `ua-info/v2` subpath.

PR 1 exposes only the v2 types, identity constants, and version utilities. The v2 parser entry points are implemented in later phases.

## Product scope

`ua-info` v2 is a general-purpose User-Agent and Client Hints parser. LINE and LIFF are representative in-app fixtures, not the product boundary.

The core result follows the familiar browser-parser dimensions:

- browser
- rendering engine
- operating system
- device
- CPU

Two additional dimensions resolve cases that do not fit the browser field:

- `client`: the most specific selected non-browser actor, such as a crawler, automation tool, or HTTP client
- `context`: an execution surface, such as an in-app browser, mini app, PWA, or embedded environment

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

`browser.family` represents browser lineage, for example `chromium`, `firefox`, or `safari`. Rendering-engine identities such as Blink, Gecko, and WebKit belong in `engine`.

`browser.mode` distinguishes `browser`, `webview`, `headless`, `embedded`, and `unknown` execution modes.

### Client

`client` is nullable and represents one selected non-browser actor. Ordinary browsers and in-app host applications do not duplicate themselves in this field.

Examples:

- Chrome: `client = null`
- LINE LIFF: `client = null`, LINE is stored in `context.host`
- AhrefsBot: `client.kind = 'crawler'`
- GPTBot: `client.kind = 'ai-agent'`
- Playwright: `client.kind = 'automation'`
- curl: `client.kind = 'http-client'`

When multiple classifications describe the same actor, selection uses this specificity order:

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

This precedence selects one public v2 client; it is not a public multi-agent model.

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

The host is nullable because contexts such as standalone PWA do not require a host application.

For LINE LIFF:

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

| API | Inputs | Runtime-only context such as PWA |
| --- | --- | --- |
| `parse(ua)` | User-Agent string only | No |
| `parseRequest({ headers })` | User-Agent plus request Client Hints | Partial |
| `detectCurrent()` | User-Agent, browser Client Hints, and runtime signals | Yes |

The pure parser must not read `navigator`, `document`, or other browser globals. Runtime enrichment belongs in the browser entry point.

## Package boundaries

During v2 development:

```ts
import { UAInfo } from 'ua-info';
import { BrowserId, satisfiesVersion, type UAResult } from 'ua-info/v2';
```

The main entry remains the existing v1 API until the v2 migration and release gates are complete.

The package publishes native ESM and CommonJS outputs and verifies both entry points from a packed tarball.

## Compatibility policy

V2 is developed alongside v1 rather than by rewriting the existing parser in place. Before the v2 beta, fixtures must classify each v1 capability as preserved, normalized, deprecated, or intentionally removed.

## Security and provenance

User-Agent strings and Client Hints are untrusted client claims, not proof of identity.

`ua-parser-js` may be used as a feature and coverage benchmark only. Its v2 regex mappings, fixtures, device data, extension data, and source implementation must not be copied. New detector data must have compatible licensing and documented provenance.
