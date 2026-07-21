# ua-info

A TypeScript User-Agent and Client Hints parser for browser, engine, operating system, device, CPU, non-browser client, and execution-context detection.

## Install

```bash
npm install ua-info
```

The existing v1 API remains available from the package root. The modern parser is opt-in through `ua-info/v2`.

## Parse a User-Agent

```ts
import { parse, satisfiesVersion } from 'ua-info/v2';

const info = parse(userAgent);

console.log(info.browser?.id);
console.log(info.engine?.id);
console.log(info.os?.id);
console.log(info.device.type);
console.log(info.client?.kind);
console.log(info.context?.host?.id);

if (satisfiesVersion(info.browser?.version, '>=120')) {
  // Supported browser version
}
```

`parse()` is pure. It only uses the supplied User-Agent and never reads `navigator`, `document`, or runtime state.

## Parse a server request

```ts
import { parseRequest } from 'ua-info/server';

const info = parseRequest({
  headers: request.headers,
});
```

`parseRequest()` combines the User-Agent with available request-side Client Hints, including full browser versions, platform versions, device models, architecture, and bitness.

## Detect the current browser

```ts
import { detectCurrent } from 'ua-info/browser';

const info = await detectCurrent();
```

`detectCurrent()` may use `navigator.userAgentData`, high-entropy Client Hints, and runtime-only signals such as standalone PWA display mode.

## LINE LIFF

LINE is represented as the host context while Chrome remains the underlying browser:

```ts
const info = parse(lineLiffUserAgent);

info.browser?.id;       // 'chrome'
info.browser?.mode;     // 'webview'
info.context?.kind;     // 'mini-app'
info.context?.id;       // 'liff'
info.context?.host?.id; // 'line'
info.client;            // null
```

## Non-browser clients

Bots, crawlers, AI agents, automation tools, HTTP clients, libraries, email clients, and media players use `client` instead of being reported as browsers:

```ts
parse('AhrefsBot/7.0').client?.kind; // 'crawler'
parse('GPTBot/1.2').client?.kind;    // 'ai-agent'
parse('curl/8.7.1').client?.kind;    // 'http-client'
```

## Result shape

```ts
interface UAResult {
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

User-Agent and Client Hints values are untrusted client claims. They must not be used as proof of identity or as a security boundary.

See [`docs/v2-design.md`](docs/v2-design.md) for field semantics and compatibility rules.
