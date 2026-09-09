# ua-info v3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the v2 public surface with a simple parser-first v3 API built around `parse()`, fixed-shape `UAInfo`, `ua-info/check` predicates, structured Client Hints enrichment, conservative LINE/LIFF runtime detection, and evidence-backed support for current browsers including Mi Browser.

**Architecture:** Build v3 in `src/v3` alongside v2 until contract, parser, enrichment, predicate, and adapter tests pass; only then switch the package root and export map to v3 and remove v2 from the published build. The pure parser stays synchronous and side-effect free, while `parseRequest()` and `detect()` normalize external evidence into one structured input and merge fields conservatively instead of replacing whole result dimensions.

**Tech Stack:** TypeScript, Jest + ts-jest, Node.js >=18, dual ESM/CJS TypeScript builds, npm package exports, browser User-Agent Client Hints, Web Standard `Headers`-compatible structural inputs.

**Spec:** `docs/superpowers/specs/2026-09-09-ua-info-v3-simple-api-design.md`

## Global Constraints

- v3 is intentionally breaking; do not keep v2 public aliases merely to reduce migration work.
- Public and internal symbol names must not use `V3` or `v3` suffixes/prefixes; use canonical names such as `UAInfo`, `BrowserInfo`, `parse`, `detect`, and `parseRequest`.
- Keep `parse(userAgent: string): UAInfo` synchronous, pure, and runtime-global free.
- Every top-level `UAInfo` dimension is always present; unknown fields are `null`, never an `unknown` sentinel string.
- Keep zero runtime dependencies.
- Detection output describes client claims and must never be documented or treated as authentication/authorization proof.
- Do not add fingerprinting-oriented collection beyond the explicit opt-in Client Hints contract.
- Do not add a runtime dependency on `@line/liff`; LIFF support remains a structural optional adapter.
- Browser lineage is independent from rendering engine; iOS Chromium-lineage products may use WebKit.
- Generic Chromium-family evidence must not set `browser.name = 'chromium'`; `isChromium()` is true only for the Chromium product.
- Evidence merges by field and compatibility; a generic Client Hint must not erase a more-specific compatible User-Agent identity.
- `isLiff()` means LIFF browser/client execution established by runtime evidence; pure UA parsing does not infer LIFF from a LINE-looking UA.
- `parseRequest()` consumes supported Client Hint headers already present and never manages `Accept-CH`, `Critical-CH`, `Permissions-Policy`, or response caching.
- `detect()` does not request high-entropy hints by default; `detect({ highEntropy: true })` requests the documented supported set.
- Initial v3 has no generic embedded-application context. `DeviceType.'embedded'` remains a hardware classification only.
- Preserve ESM, CJS, TypeScript, browser, and server consumer compatibility at the package level.
- Do not expand the existing performance framework; simplify duplicated package verification where safe.
- Before modifying `package.json` during execution, inspect its worktree diff and preserve unrelated user edits.

---

## File Structure

### New v3 source

- `src/v3/constants.ts` — closed stable IDs for browsers, engines, operating systems, CPU architectures, and contexts.
- `src/v3/types.ts` — canonical public v3 data model and unions.
- `src/v3/version.ts` — `Version` normalization only.
- `src/v3/result.ts` — fixed-shape empty-result factories used by parsers/enrichers.
- `src/v3/parse.ts` — pure composition entry point.
- `src/v3/parser/browser.ts` — UA-only browser identity, lineage, mode, and engine hint selection.
- `src/v3/parser/engine.ts` — engine identity/version from UA plus browser engine hint.
- `src/v3/parser/os.ts` — operating-system parsing.
- `src/v3/parser/device.ts` — device class/vendor/model parsing.
- `src/v3/parser/cpu.ts` — UA CPU architecture parsing.
- `src/v3/parser/client.ts` — non-browser client leaf classification.
- `src/v3/parser/context.ts` — UA-only in-app/mini-app host context; no LIFF inference.
- `src/v3/input.ts` — structured `ClientHints`, `RuntimeEvidence`, and `DetectionInput` internal contracts.
- `src/v3/client-hints.ts` — HTTP Client Hint decoding and browser-UAData normalization helpers.
- `src/v3/enrich.ts` — field-level evidence merge rules.
- `src/v3/server.ts` — `parseRequest()` and structural header types.
- `src/v3/browser.ts` — `detect()` runtime adapter, PWA signal, optional LIFF adapter, optional high entropy.
- `src/v3/check.ts` — generic and named predicate public API.
- `src/v3/index.ts` — root v3 exports only.

### New v3 tests

- `src/v3/__tests__/contracts.test.ts`
- `src/v3/__tests__/version.test.ts`
- `src/v3/__tests__/browser.test.ts`
- `src/v3/__tests__/parse.test.ts`
- `src/v3/__tests__/predicates.test.ts`
- `src/v3/__tests__/client-hints.test.ts`
- `src/v3/__tests__/server.test.ts`
- `src/v3/__tests__/browser-runtime.test.ts`
- `src/v3/__tests__/fixtures/fixture-types.ts`
- `src/v3/__tests__/fixtures/browsers.ts`
- `src/v3/__tests__/fixtures/platforms.ts`
- `src/v3/__tests__/fixtures/clients.ts`
- `src/v3/__tests__/fixtures/contexts.ts`
- `src/v3/__tests__/fixtures/client-hints.ts`
- `src/v3/__tests__/fixtures/index.ts`

### Existing files changed at cut-over/hardening

- `src/index.ts`
- `src/__tests__/root-api.test.ts`
- `package.json`
- `jest.config.js`
- `scripts/verify-package-identity.mjs`
- `scripts/verify-package.mjs`
- `scripts/verify-consumers.mjs` — consume a supplied tarball and execute checked-in consumer fixtures.
- `scripts/consumer-fixtures/esm.mjs` — create.
- `scripts/consumer-fixtures/cjs.cjs` — create.
- `scripts/consumer-fixtures/typescript.ts` — create.
- `scripts/consumer-fixtures/tsconfig.json` — create.
- `apps/playground/src/**` files that currently import/use `UAResult` or `detectCurrent()`.
- `apps/playground/src/contract/public-entrypoints.test.ts`
- `README.md`
- `MIGRATION.md` — create and publish.
- `CHANGELOG.md`
- `benchmarks/performance-gate-policy.json`
- `benchmarks/scenarios.mjs` — migrate the known v2 `.id`, root-predicate, and `detectCurrent` scenarios.
- `src/v2/**` — delete after v3 parity and package cut-over are green.

---

### Task 1: Canonical v3 model, constants, versions, and fixed-shape empty result

**Files:**
- Create: `src/v3/constants.ts`
- Create: `src/v3/types.ts`
- Create: `src/v3/version.ts`
- Create: `src/v3/result.ts`
- Create: `src/v3/index.ts`
- Create: `src/v3/__tests__/contracts.test.ts`
- Create: `src/v3/__tests__/version.test.ts`

**Interfaces:**
- Consumes: none; this is the base contract.
- Produces:
  - `Version { full: string; major: number | null }`
  - `UAInfo` with always-present `browser`, `engine`, `os`, `device`, `cpu`, `client`, and `context` objects.
  - `parseVersion(raw: string): Version`
  - `createEmptyUAInfo(ua: string): UAInfo`
  - closed ID constants/types used by every later task.

- [ ] **Step 1: Write the failing type/shape contract test**

Create `src/v3/__tests__/contracts.test.ts` with a representative fully-null result and compile-time assignments:

```ts
import {
  BrowserId,
  type BrowserFamily,
  type BrowserMode,
  type ContextType,
  type DeviceType,
  type UAInfo,
} from '../index';
import { createEmptyUAInfo } from '../result';

describe('v3 canonical contracts', () => {
  it('uses fixed top-level objects with null unknown fields', () => {
    expect(createEmptyUAInfo('fixture')).toEqual({
      ua: 'fixture',
      browser: { name: null, version: null, family: null, mode: null },
      engine: { name: null, version: null },
      os: { name: null, version: null },
      device: { type: null, vendor: null, model: null },
      cpu: { architecture: null, bitness: null },
      client: { type: null, name: null, version: null },
      context: { type: null, name: null, host: null },
    });
  });

  it('locks stable browser IDs', () => {
    expect(BrowserId.Chrome).toBe('chrome');
    expect(BrowserId.MiBrowser).toBe('mi-browser');
    expect(BrowserId.Chromium).toBe('chromium');
  });
});

function assertClosedTypes(info: UAInfo): void {
  const family: BrowserFamily = 'chromium';
  const mode: BrowserMode = 'webview';
  const device: DeviceType = 'embedded';
  const context: ContextType = 'mini-app';
  void family;
  void mode;
  void device;
  void context;
  void info;

  // @ts-expect-error v3 has no generic embedded application context
  const invalidContext: ContextType = 'embedded';
  void invalidContext;
}

void assertClosedTypes;
```

- [ ] **Step 2: Write the failing version contract test**

Create `src/v3/__tests__/version.test.ts`:

```ts
import { parseVersion } from '../version';

describe('parseVersion', () => {
  it.each([
    ['150.0.7339.80', { full: '150.0.7339.80', major: 150 }],
    ['18', { full: '18', major: 18 }],
    ['preview', { full: 'preview', major: null }],
  ])('normalizes %s', (input, expected) => {
    expect(parseVersion(input)).toEqual(expected);
  });
});
```

- [ ] **Step 3: Run the new tests and verify they fail before implementation**

Run:

```bash
npm test -- --runInBand src/v3/__tests__/contracts.test.ts src/v3/__tests__/version.test.ts
```

Expected: FAIL because `src/v3` modules do not exist.

- [ ] **Step 4: Implement stable constants and exact public unions**

Implement `src/v3/constants.ts` with these canonical IDs:

```ts
export const BrowserId = {
  Arc: 'arc',
  Brave: 'brave',
  Chrome: 'chrome',
  Chromium: 'chromium',
  Edge: 'edge',
  Firefox: 'firefox',
  HuaweiBrowser: 'huawei-browser',
  MiBrowser: 'mi-browser',
  Opera: 'opera',
  Safari: 'safari',
  SamsungInternet: 'samsung-internet',
  UCBrowser: 'uc-browser',
  Vivaldi: 'vivaldi',
  YandexBrowser: 'yandex-browser',
} as const;

export const EngineId = {
  Blink: 'blink',
  Gecko: 'gecko',
  WebKit: 'webkit',
} as const;

export const OSId = {
  Android: 'android',
  ChromeOS: 'chromeos',
  HarmonyOS: 'harmonyos',
  IOS: 'ios',
  IPadOS: 'ipados',
  KaiOS: 'kaios',
  Linux: 'linux',
  MacOS: 'macos',
  Tizen: 'tizen',
  Windows: 'windows',
} as const;

export const CPUArchitecture = {
  ARM: 'arm',
  ARM64: 'arm64',
  MIPS: 'mips',
  PowerPC: 'powerpc',
  RISCV: 'riscv',
  SPARC: 'sparc',
  X86: 'x86',
  X86_64: 'x86_64',
} as const;

export const ContextId = {
  Facebook: 'facebook',
  Instagram: 'instagram',
  Liff: 'liff',
  Line: 'line',
  Messenger: 'messenger',
  PWA: 'pwa',
  WeChat: 'wechat',
} as const;
```

Export corresponding union types from the value objects. Do not add IE or EdgeHTML to the v3 modern constants.

- [ ] **Step 5: Implement `types.ts`, `version.ts`, and `result.ts` minimally**

Use the spec shapes exactly. `createEmptyUAInfo()` must allocate fresh nested objects on every call so enrichers cannot accidentally share mutable references:

```ts
export function createEmptyUAInfo(ua: string): UAInfo {
  return {
    ua,
    browser: { name: null, version: null, family: null, mode: null },
    engine: { name: null, version: null },
    os: { name: null, version: null },
    device: { type: null, vendor: null, model: null },
    cpu: { architecture: null, bitness: null },
    client: { type: null, name: null, version: null },
    context: { type: null, name: null, host: null },
  };
}
```

- [ ] **Step 6: Export only the v3 foundation from `src/v3/index.ts` and run tests**

`src/v3/index.ts` at this stage:

```ts
export * from './constants';
export * from './types';
export * from './version';
```

Run:

```bash
npm test -- --runInBand src/v3/__tests__/contracts.test.ts src/v3/__tests__/version.test.ts
npm run lint
```

Expected: PASS.

- [ ] **Step 7: Commit the canonical model**

```bash
git add src/v3
git commit -m "feat: add ua-info v3 canonical model"
```

---

### Task 2: Browser and engine parser with current-browser catalog and collision precedence

**Files:**
- Create: `src/v3/parser/browser.ts`
- Create: `src/v3/parser/engine.ts`
- Create: `src/v3/__tests__/browser.test.ts`
- Create: `src/v3/__tests__/fixtures/fixture-types.ts`
- Create: `src/v3/__tests__/fixtures/browsers.ts`
- Create: `src/v3/__tests__/fixtures/index.ts`
- Modify: `src/v3/index.ts`

**Interfaces:**
- Consumes: `BrowserId`, `BrowserFamily`, `BrowserMode`, `EngineId`, `BrowserInfo`, `EngineInfo`, `parseVersion()`.
- Produces:
  - `detectBrowser(userAgent: string): BrowserDetection | null`
  - `BrowserDetection { browser: BrowserInfo; engineHint: 'blink' | 'gecko' | 'webkit' }`
  - `detectEngine(userAgent: string, engineHint: BrowserEngineHint | null): EngineInfo`
  - authoritative fixture structure reused by later parser tests.

- [ ] **Step 1: Add fixture contracts and failing browser catalog tests**

Use a fixture type that keeps source provenance:

```ts
export interface FixtureSource {
  readonly kind: 'official-doc' | 'captured' | 'regression';
  readonly authority: string;
  readonly reference: string;
  readonly observedAt: string;
  readonly notes?: string;
}

export interface BrowserFixture {
  readonly id: string;
  readonly userAgent: string;
  readonly expected: {
    readonly name: string | null;
    readonly family: 'chromium' | 'firefox' | 'safari' | null;
    readonly mode: 'browser' | 'webview' | 'headless' | null;
  };
  readonly source: FixtureSource;
}
```

In `browser.test.ts`, require at minimum Chrome, Safari, Firefox, Edge, Opera, Samsung Internet, Vivaldi, Mi Browser, Huawei Browser, UC Browser, Yandex Browser, Chromium product, Android WebView, and Headless Chrome. Also add explicit collision cases asserting derivatives beat Chrome.

Representative test:

```ts
import { BrowserId } from '../constants';
import { detectBrowser } from '../parser/browser';

it('detects Mi Browser before Chrome', () => {
  const ua = 'Mozilla/5.0 (Linux; U; Android 14; en-us; 23127PN0CG) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.0.0 Mobile Safari/537.36 XiaoMi/MiuiBrowser/18.4.110316';
  expect(detectBrowser(ua)?.browser).toMatchObject({
    name: BrowserId.MiBrowser,
    family: 'chromium',
    mode: 'browser',
  });
});
```

Add a current Brave iOS case where the UA ends in a bare `Brave` token and does not provide a Brave version:

```ts
it('detects Brave on iOS without inventing Chromium lineage', () => {
  const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1 Brave';
  expect(detectBrowser(ua)?.browser).toMatchObject({
    name: BrowserId.Brave,
    family: null,
    version: null,
  });
  expect(detectEngine(ua, 'webkit').name).toBe('webkit');
});
```

This case proves the approved `name known + family null` contract. Desktop/Android Brave refinement from UA-CH remains in Task 5.

- [ ] **Step 2: Run browser tests and verify failure**

```bash
npm test -- --runInBand src/v3/__tests__/browser.test.ts
```

Expected: FAIL because parser files do not exist.

- [ ] **Step 3: Implement one ordered declarative derivative table**

Implement `BrowserPattern` and `DERIVATIVE_PATTERNS` with derivative-first order. Use the existing v2 regex knowledge, but normalize IDs/names to v3 fields and remove dummy `regex: /$^/` construction.

Required derivative token coverage in the table:

```text
EdgiOS / EdgA / Edg
OPiOS / OPT / OPR / Opera Mini
SamsungBrowser
Vivaldi
YaBrowser
UCBrowser
HuaweiBrowser
XiaoMi/MiuiBrowser and MiuiBrowser
Arc
Brave platform token when actually present
```

Keep explicit branches for `HeadlessChrome`, `FxiOS`, `Firefox`, `CriOS`, Chromium product, Chrome, Safari eligibility, and Android WebView mode. Do not add a generic “all Chromium derivatives” product identity.

- [ ] **Step 4: Implement engine selection independently from lineage**

`detectEngine()` rules:

```ts
if (engineHint === 'blink') return { name: EngineId.Blink, version: null };
if (engineHint === 'gecko') return { name: EngineId.Gecko, version: readGeckoVersion(userAgent) };
if (engineHint === 'webkit') return { name: EngineId.WebKit, version: readWebKitVersion(userAgent) };
return { name: null, version: null };
```

Use WebKit for iOS Chrome/Firefox/Edge/Opera variants even when their browser lineage is Chromium/Firefox. Never copy browser version into Blink.

- [ ] **Step 5: Add authoritative positive fixtures and collision fixtures**

Populate `fixtures/browsers.ts` using current evidence sources already approved by the spec. Each first-class UA-visible browser must have at least one positive fixture and any Chrome-colliding derivative must have a negative/collision assertion. Brave desktop identity that is only reliably exposed by Client Hints belongs in Task 5, not fabricated here.

- [ ] **Step 6: Run focused tests and lint**

```bash
npm test -- --runInBand src/v3/__tests__/browser.test.ts
npm run lint
```

Expected: PASS.

- [ ] **Step 7: Commit browser/engine parsing**

```bash
git add src/v3/parser src/v3/__tests__ src/v3/index.ts
git commit -m "feat: add v3 browser and engine detection"
```

---

### Task 3: Pure platform, client, context parsers and `parse()` composition

**Files:**
- Create: `src/v3/parser/os.ts`
- Create: `src/v3/parser/device.ts`
- Create: `src/v3/parser/cpu.ts`
- Create: `src/v3/parser/client.ts`
- Create: `src/v3/parser/context.ts`
- Create: `src/v3/parse.ts`
- Create: `src/v3/__tests__/parse.test.ts`
- Create: `src/v3/__tests__/fixtures/platforms.ts`
- Create: `src/v3/__tests__/fixtures/clients.ts`
- Create: `src/v3/__tests__/fixtures/contexts.ts`
- Modify: `src/v3/__tests__/fixtures/index.ts`
- Modify: `src/v3/index.ts`

**Interfaces:**
- Consumes: Task 1 canonical types/factories and Task 2 `detectBrowser()`/`detectEngine()`.
- Produces: `parse(userAgent: string): UAInfo` and UA-only OS/device/CPU/client/context detectors.

- [ ] **Step 1: Write failing fixed-shape `parse()` tests**

```ts
import { parse } from '../parse';

it('returns fixed-shape unknown data for an empty UA', () => {
  expect(parse('')).toEqual({
    ua: '',
    browser: { name: null, version: null, family: null, mode: null },
    engine: { name: null, version: null },
    os: { name: null, version: null },
    device: { type: null, vendor: null, model: null },
    cpu: { architecture: null, bitness: null },
    client: { type: null, name: null, version: null },
    context: { type: null, name: null, host: null },
  });
});

it('keeps LINE in-app distinct from LIFF', () => {
  const ua = 'Mozilla/5.0 (Linux; Android 16; Pixel 10 Pro; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/150.0.0.0 Mobile Safari/537.36 Line/26.11.0 LIFF';
  const result = parse(ua);
  expect(result.context).toMatchObject({
    type: 'in-app-browser',
    name: 'line',
    host: { name: 'line' },
  });
  expect(result.context.name).not.toBe('liff');
});
```

- [ ] **Step 2: Add failing leaf-client taxonomy tests**

Lock:

```ts
expect(parse('Googlebot/2.1 (+http://www.google.com/bot.html)').client.type).toBe('crawler');
expect(parse('OAI-SearchBot/1.0').client.type).toBe('crawler');
expect(parse('GPTBot/1.2').client.type).toBe('ai-crawler');
expect(parse('Playwright/1.57.0').client.type).toBe('automation');
expect(parse('curl/8.7.1').client.type).toBe('http-client');
```

Use normalized lowercase `client.name` IDs such as `googlebot`, `oai-searchbot`, `gptbot`, `playwright`, `curl`.

- [ ] **Step 3: Run parse tests and verify failure**

```bash
npm test -- --runInBand src/v3/__tests__/parse.test.ts
```

Expected: FAIL because the new parsers/composer do not exist.

- [ ] **Step 4: Port OS/device/CPU parsing into fixed-shape outputs**

Each detector returns its dimension object, never `null` for the whole dimension. Example contract:

```ts
export function detectCPU(userAgent: string): CPUInfo {
  if (/\b(?:arm64|aarch64)\b/i.test(userAgent)) {
    return { architecture: 'arm64', bitness: 64 };
  }
  if (/\b(?:x86_64|x64|Win64|WOW64)\b/i.test(userAgent)) {
    return { architecture: 'x86_64', bitness: 64 };
  }
  return { architecture: null, bitness: null };
}
```

Preserve v2 supported OS/device heuristics where still relevant, add `ipados` only when evidence distinguishes it reliably, and keep mobile/tablet exact rather than umbrella semantics.

- [ ] **Step 5: Implement selected leaf client classification**

Use an ordered pattern table. Normalize AI crawlers as `ai-crawler`, not the old v2 `ai-agent`. Keep generic `bot|spider|crawler` fallback as leaf `bot` only when no more-specific client matched.

Required initial identities include the existing v2 set for Google/Bing/Apple/Ahrefs/Semrush/OpenAI/Claude/Perplexity crawlers plus Playwright/Puppeteer/Selenium, curl/Wget/Postman/HTTPie, Axios/Python Requests/OkHttp, Thunderbird, and VLC.

- [ ] **Step 6: Implement UA-only context parsing without generic embedded context**

Required initial behavior:

```text
LINE token -> { type: 'in-app-browser', name: 'line', host.name: 'line' }
Facebook app UA -> { type: 'in-app-browser', name: 'facebook', host.name: 'facebook' }
Instagram app UA -> { type: 'in-app-browser', name: 'instagram', host.name: 'instagram' }
Messenger FBAN/Orca-Android or FBAN/MessengerForiOS + FBAV version -> { type: 'in-app-browser', name: 'messenger', host.name: 'messenger' }
MicroMessenger -> { type: 'in-app-browser', name: 'wechat', host.name: 'wechat' }
```

Do not return `liff` from pure UA parsing. Do not return an `embedded` context for Electron/Capacitor/Cordova in initial v3.

- [ ] **Step 7: Implement `parse()` as a small composer**

Use `createEmptyUAInfo(userAgent)` as the base, then fill dimensions from focused detectors. Context may set browser `mode: 'webview'` only when browser mode is not already `headless`; context must not manufacture a browser identity.

```ts
export function parse(userAgent: string): UAInfo {
  const browserDetection = detectBrowser(userAgent);
  const context = detectContext(userAgent);
  const empty = createEmptyUAInfo(userAgent);
  const browser = browserDetection?.browser ?? empty.browser;
  const mode = context.type === 'in-app-browser' || context.type === 'mini-app'
    ? browser.mode === 'headless' ? 'headless' : 'webview'
    : browser.mode;

  return {
    ua: userAgent,
    browser: { ...browser, mode },
    engine: detectEngine(userAgent, browserDetection?.engineHint ?? null),
    os: detectOS(userAgent),
    device: detectDevice(userAgent),
    cpu: detectCPU(userAgent),
    client: detectClient(userAgent),
    context,
  };
}
```

- [ ] **Step 8: Run parser tests and lint**

```bash
npm test -- --runInBand src/v3/__tests__/parse.test.ts src/v3/__tests__/browser.test.ts
npm run lint
```

Expected: PASS.

- [ ] **Step 9: Commit pure parsing**

```bash
git add src/v3
git commit -m "feat: add v3 pure user-agent parser"
```

---

### Task 4: `ua-info/check` generic and named predicate API

**Files:**
- Create: `src/v3/check.ts`
- Create: `src/v3/__tests__/predicates.test.ts`
- Modify: `src/v3/index.ts` only to export public constants/types/parse, not named check helpers.

**Interfaces:**
- Consumes: `UAInfo` and stable union types.
- Produces:
  - generic narrowing helpers: `isBrowser`, `isBrowserFamily`, `isBrowserMode`, `isEngine`, `isOS`, `isDevice`, `isClient`, `isContext`.
  - named boolean helpers from the approved spec.

- [ ] **Step 1: Write failing generic narrowing tests**

```ts
import { BrowserId, type UAInfo } from '../index';
import { isBrowser, isBrowserFamily, isDevice, isOS } from '../check';
import { parse } from '../parse';

function assertNarrowing(info: UAInfo): void {
  if (isBrowser(info, BrowserId.Chrome)) {
    const name: typeof BrowserId.Chrome = info.browser.name;
    void name;
  }
  if (isDevice(info, 'mobile')) {
    const type: 'mobile' = info.device.type;
    void type;
  }
}

void assertNarrowing;

it('uses exact generic checks', () => {
  const info = parse('Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36');
  expect(isBrowser(info, 'chrome')).toBe(true);
  expect(isBrowserFamily(info, 'chromium')).toBe(true);
  expect(isOS(info, 'android')).toBe(true);
  expect(isDevice(info, 'mobile')).toBe(true);
});
```

- [ ] **Step 2: Write failing named predicate matrix**

Lock exact semantics:

```ts
expect(isChrome(chrome)).toBe(true);
expect(isChromium(chrome)).toBe(false);
expect(isEdge(edge)).toBe(true);
expect(isChrome(edge)).toBe(false);
expect(isMiBrowser(mi)).toBe(true);
expect(isBrowserFamily(mi, 'chromium')).toBe(true);
expect(isMobile(phone)).toBe(true);
expect(isTablet(phone)).toBe(false);
expect(isBot(gptBot)).toBe(true);
expect(isCrawler(gptBot)).toBe(true);
expect(isAICrawler(gptBot)).toBe(true);
expect(isBot(playwright)).toBe(false);
expect(isAutomation(playwright)).toBe(true);
```

- [ ] **Step 3: Run predicate tests and verify failure**

```bash
npm test -- --runInBand src/v3/__tests__/predicates.test.ts
```

- [ ] **Step 4: Implement generic predicates as the only comparison primitives**

Example:

```ts
export function isBrowser<T extends string>(
  info: UAInfo,
  name: T,
): info is UAInfo & { readonly browser: BrowserInfo & { readonly name: T } } {
  return info.browser.name === name;
}
```

Use closed union parameters where the spec defines closed classifications (`BrowserFamily`, `BrowserMode`, `DeviceType`, `ClientType`) and string generics for open identity comparisons.

- [ ] **Step 5: Implement named wrappers with no detection logic**

Browser wrappers:

```text
isChrome, isChromium, isSafari, isFirefox, isEdge, isOpera,
isSamsungInternet, isBrave, isVivaldi, isMiBrowser,
isHuaweiBrowser, isUCBrowser, isYandexBrowser, isArc
```

OS wrappers:

```text
isAndroid, isIOS, isIPadOS, isWindows, isMacOS,
isLinux, isChromeOS, isHarmonyOS, isKaiOS, isTizen
```

Device wrappers:

```text
isMobile, isTablet, isDesktop, isSmartTV,
isConsole, isWearable, isXR, isEmbeddedDevice
```

Client wrappers:

```text
isBot, isCrawler, isAICrawler, isAIAssistant,
isAutomation, isHttpClient, isEmailClient, isMediaPlayer
```

`isClient(info, 'library')` remains the generic check for the `library` leaf type; v3 does not add a separate `isLibrary()` convenience helper in the initial surface.

Context/mode wrappers:

```text
isWebView, isHeadless, isInAppBrowser, isPWA,
isLine, isLiff, isFacebook, isInstagram, isMessenger, isWeChat
```

`isLine()` and `isLiff()` definitions:

```ts
export function isLine(info: UAInfo): boolean {
  return info.context.name === 'line' || info.context.host?.name === 'line';
}

export function isLiff(info: UAInfo): boolean {
  return info.context.type === 'mini-app' && info.context.name === 'liff';
}
```

- [ ] **Step 6: Run predicate + parser tests**

```bash
npm test -- --runInBand src/v3/__tests__/predicates.test.ts src/v3/__tests__/parse.test.ts
npm run lint
```

Expected: PASS.

- [ ] **Step 7: Commit predicate API**

```bash
git add src/v3/check.ts src/v3/__tests__/predicates.test.ts
git commit -m "feat: add v3 check predicates"
```

---

### Task 5: Structured Client Hints and field-level evidence merge

**Files:**
- Create: `src/v3/input.ts`
- Create: `src/v3/client-hints.ts`
- Create: `src/v3/enrich.ts`
- Create: `src/v3/__tests__/client-hints.test.ts`
- Create: `src/v3/__tests__/fixtures/client-hints.ts`
- Modify: `src/v3/__tests__/fixtures/index.ts`

**Interfaces:**
- Consumes: `UAInfo`, `parseVersion()`, stable IDs, pure parser result.
- Produces:

```ts
export interface BrandVersion {
  readonly brand: string;
  readonly version: string;
}

export interface ClientHints {
  readonly brands: readonly BrandVersion[];
  readonly mobile: boolean | null;
  readonly platform: string | null;
  readonly platformVersion: string | null;
  readonly architecture: string | null;
  readonly bitness: 32 | 64 | null;
  readonly model: string | null;
}

export interface RuntimeEvidence {
  readonly standalonePWA: boolean | null;
  readonly liffInClient: boolean | null;
}

export interface DetectionInput {
  readonly ua: string;
  readonly clientHints: ClientHints | null;
  readonly runtime: RuntimeEvidence | null;
}

export function enrich(base: UAInfo, input: DetectionInput): UAInfo;
```

- [ ] **Step 1: Write failing merge tests for the approved conflict rules**

Required tests:

```ts
it('does not let generic Chromium hints erase Mi Browser', () => {
  const base = parse(miBrowserUA);
  const result = enrich(base, {
    ua: miBrowserUA,
    clientHints: {
      brands: [{ brand: 'Chromium', version: '150' }],
      mobile: true,
      platform: 'Android',
      platformVersion: null,
      architecture: null,
      bitness: null,
      model: null,
    },
    runtime: null,
  });
  expect(result.browser.name).toBe('mi-browser');
});

it('refines Chrome-like UA to Brave from a specific brand', () => {
  const base = parse(chromeUA);
  const result = enrich(base, {
    ua: chromeUA,
    clientHints: {
      brands: [
        { brand: 'Brave', version: '150' },
        { brand: 'Chromium', version: '150' },
      ],
      mobile: false,
      platform: 'macOS',
      platformVersion: null,
      architecture: null,
      bitness: null,
      model: null,
    },
    runtime: null,
  });
  expect(result.browser).toMatchObject({ name: 'brave', family: 'chromium' });
});
```

Also lock same-product full-version enrichment, identity/version compatibility, `mobile=false` preserving tablet, unknown platform preserving OS, and accepted `arm64`/`x86_64` aliases remaining 64-bit.

- [ ] **Step 2: Run Client Hints tests and verify failure**

```bash
npm test -- --runInBand src/v3/__tests__/client-hints.test.ts
```

- [ ] **Step 3: Implement normalized brand selection without HTTP syntax**

Brand precedence for product identity:

```text
Brave
Microsoft Edge
Opera
Google Chrome
Chromium family only (never product identity from UA-CH alone)
```

Only a specific product brand may replace a more-specific UA identity. A `Chromium` UA-CH brand establishes only `family: 'chromium'` when family was unknown. It never sets `browser.name = 'chromium'`; Chromium product identity requires explicit product evidence such as a `Chromium/` UA token. Generic Chromium hints cannot overwrite `mi-browser`, `edge`, `brave`, or another specific product.

- [ ] **Step 4: Implement field-level merge helpers**

```ts
function mergeBrowser(base: BrowserInfo, hints: ClientHints): BrowserInfo;
function mergeOS(base: OSInfo, hints: ClientHints): OSInfo;
function mergeDevice(base: DeviceInfo, hints: ClientHints): DeviceInfo;
function mergeCPU(base: CPUInfo, hints: ClientHints): CPUInfo;
function mergeRuntime(base: UAInfo, runtime: RuntimeEvidence | null): UAInfo;
```

Rules must encode the spec, not generic source-rank replacement.

- [ ] **Step 5: Add Brave, full-version, and malformed fixture coverage**

Populate `fixtures/client-hints.ts` with:

```text
Brave brand + Chromium brand -> brave
Edge brand + Chrome/Chromium brand -> edge
full-version-list wins over significant-version list for same identity
generic Chromium + Mi UA -> Mi preserved
unknown platform -> base OS preserved
mobile ?0 + tablet base -> tablet preserved
```

- [ ] **Step 6: Run all v3 pure/enrichment tests**

```bash
npm test -- --runInBand src/v3/__tests__/browser.test.ts src/v3/__tests__/parse.test.ts src/v3/__tests__/client-hints.test.ts
npm run lint
```

Expected: PASS.

- [ ] **Step 7: Commit structured enrichment**

```bash
git add src/v3/input.ts src/v3/client-hints.ts src/v3/enrich.ts src/v3/__tests__
git commit -m "feat: add v3 structured client hints enrichment"
```

### Task 6: Server adapter and opportunistic Client Hints decoding

**Files:**
- Create: `src/v3/server.ts`
- Create: `src/v3/__tests__/server.test.ts`
- Modify: `src/v3/client-hints.ts`

**Interfaces:**
- Consumes: `parse()`, `enrich()`, `ClientHints`.
- Produces:

```ts
export type HeaderValue = string | readonly string[] | undefined;
export type HeaderRecord = Readonly<Record<string, HeaderValue>>;

export interface HeaderGetter {
  get(name: string): string | null;
}

export type HeaderSource = HeaderRecord | HeaderGetter;

export interface RequestLikeInput {
  readonly headers: HeaderSource;
  readonly userAgent?: string;
}

export type ParseRequestInput = HeaderSource | RequestLikeInput;

export function parseRequest(input: ParseRequestInput): UAInfo;
```

- [ ] **Step 1: Write failing header-shape and decoding tests**

Create `src/v3/__tests__/server.test.ts` with both record and `get()` inputs:

```ts
import { parseRequest } from '../server';

const chromeUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';

it('accepts a plain header record directly', () => {
  const result = parseRequest({
    'user-agent': chromeUA,
    'sec-ch-ua': '"Chromium";v="150", "Google Chrome";v="150"',
  });
  expect(result.browser.name).toBe('chrome');
});

it('accepts a Request-like object without DOM Request typing', () => {
  const headers = new Map<string, string>([
    ['user-agent', chromeUA],
    ['sec-ch-ua-platform', '"Windows"'],
  ]);
  const result = parseRequest({
    headers: { get: (name) => headers.get(name.toLowerCase()) ?? null },
  });
  expect(result.os.name).toBe('windows');
});
```

- [ ] **Step 2: Add failing tests for all supported request hints and malformed siblings**

Lock decoding for:

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

Add this malformed sibling case:

```ts
const result = parseRequest({
  'user-agent': chromeUA,
  'sec-ch-ua': 'broken, "Google Chrome";v="151", malformed',
});
expect(result.browser.version?.major).toBe(151);
```

- [ ] **Step 3: Run server tests and verify failure**

```bash
npm test -- --runInBand src/v3/__tests__/server.test.ts
```

- [ ] **Step 4: Implement case-insensitive structural header reading**

Keep the boundary logic local to `server.ts`/`client-hints.ts`:

```ts
export function readHeader(headers: HeaderSource, name: string): string | null {
  if (typeof (headers as HeaderGetter).get === 'function') {
    return (headers as HeaderGetter).get(name);
  }
  const target = name.toLowerCase();
  for (const [key, value] of Object.entries(headers as HeaderRecord)) {
    if (key.toLowerCase() !== target || value === undefined) continue;
    return typeof value === 'string' ? value : value.join(', ');
  }
  return null;
}
```

- [ ] **Step 5: Implement HTTP-only decoding into structured `ClientHints`**

`decodeClientHints(headers)` must parse/normalize HTTP syntax once and return the Task 5 structure. Filter GREASE brands by name, prefer `Sec-CH-UA-Full-Version-List` brands when present, normalize `?1/?0` to `boolean | null`, strip surrounding quotes, and preserve malformed-sibling tolerance.

- [ ] **Step 6: Implement `parseRequest()` with no negotiation API**

```ts
function isRequestLikeInput(input: ParseRequestInput): input is RequestLikeInput {
  const headers = (input as RequestLikeInput).headers;
  return !!headers && typeof headers === 'object' && (
    typeof (headers as HeaderGetter).get === 'function' || !Array.isArray(headers)
  );
}

export function parseRequest(input: ParseRequestInput): UAInfo {
  const requestLike = isRequestLikeInput(input) ? input : { headers: input };
  const ua = requestLike.userAgent ?? readHeader(requestLike.headers, 'user-agent') ?? '';
  const clientHints = decodeClientHints(requestLike.headers);
  return enrich(parse(ua), { ua, clientHints, runtime: null });
}
```

Add a regression test with a plain header record containing a literal `headers` header (`{ headers: 'example', 'user-agent': chromeUA }`) to prove it is not misclassified as `RequestLikeInput`.

Do not add `highEntropy`, `acceptCH`, response-header helpers, or framework adapters.

- [ ] **Step 7: Run server, enrichment, and parser tests**

```bash
npm test -- --runInBand src/v3/__tests__/server.test.ts src/v3/__tests__/client-hints.test.ts src/v3/__tests__/parse.test.ts
npm run lint
```

Expected: PASS.

- [ ] **Step 8: Commit the server adapter**

```bash
git add src/v3/server.ts src/v3/client-hints.ts src/v3/__tests__/server.test.ts
git commit -m "feat: add v3 request client hints adapter"
```

---

### Task 7: Browser `detect()` runtime enrichment, PWA, and LIFF contract

**Files:**
- Create: `src/v3/browser.ts`
- Create: `src/v3/__tests__/browser-runtime.test.ts`
- Modify: `src/v3/enrich.ts`

**Interfaces:**
- Consumes: `parse()`, structured `ClientHints`, `enrich()`.
- Produces:

```ts
export interface LiffAdapter {
  isInClient(): boolean;
}

export interface DetectOptions {
  readonly highEntropy?: boolean;
  readonly liff?: LiffAdapter;
}

export function detect(options?: DetectOptions): Promise<UAInfo>;
```

- [ ] **Step 1: Write failing default behavior tests**

Mock browser globals and assert default detection uses low-entropy UAData without calling `getHighEntropyValues()`:

```ts
it('does not request high entropy by default', async () => {
  const getHighEntropyValues = jest.fn();
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
      userAgent: chromeUA,
      userAgentData: {
        brands: [{ brand: 'Google Chrome', version: '150' }],
        mobile: false,
        platform: 'macOS',
        getHighEntropyValues,
      },
    },
  });

  const result = await detect();
  expect(result.browser.name).toBe('chrome');
  expect(getHighEntropyValues).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Write failing high-entropy opt-in test**

```ts
it('requests the documented set only when highEntropy is true', async () => {
  const getHighEntropyValues = jest.fn().mockResolvedValue({
    architecture: 'arm',
    bitness: '64',
    model: '',
    platformVersion: '15.0.0',
    fullVersionList: [{ brand: 'Google Chrome', version: '150.0.7339.80' }],
  });
  installNavigatorWithUAData(getHighEntropyValues);

  const result = await detect({ highEntropy: true });
  expect(getHighEntropyValues).toHaveBeenCalledWith([
    'architecture',
    'bitness',
    'fullVersionList',
    'model',
    'platformVersion',
  ]);
  expect(result.browser.version?.full).toBe('150.0.7339.80');
});
```

- [ ] **Step 3: Write the complete LIFF truth-table tests**

Lock four optional integration states plus external browser behavior:

```ts
expect((await detect({ liff: { isInClient: () => true } })).context)
  .toMatchObject({ type: 'mini-app', name: 'liff', host: { name: 'line' } });

expect((await detect({ liff: { isInClient: () => false } })).context.name)
  .not.toBe('liff');

expect((await detect()).context.name).not.toBe('liff');

expect(await detect({ liff: { isInClient: () => { throw new Error('sdk'); } } }))
  .toBeDefined();
```

Use a generic Chrome UA in the runtime-true test to prove runtime evidence can establish LIFF without LINE UA text.

- [ ] **Step 4: Write PWA precedence and no-navigator tests**

Required contract:

```text
standalone runtime + no app context -> { type: 'pwa', name: 'pwa' }
standalone runtime + LINE/LIFF context -> keep LINE/LIFF context
no navigator -> reject with a message directing users to parse()/parseRequest()
```

- [ ] **Step 5: Run runtime tests and verify failure**

```bash
npm test -- --runInBand src/v3/__tests__/browser-runtime.test.ts
```

- [ ] **Step 6: Implement direct UAData-to-structured-hints normalization**

Do not serialize UAData into fake HTTP headers. Define local structural browser types and map them directly:

```ts
const hints: ClientHints = {
  brands: data.brands,
  mobile: data.mobile,
  platform: data.platform,
  platformVersion: values?.platformVersion ?? null,
  architecture: values?.architecture ?? null,
  bitness: normalizeBitness(values?.bitness),
  model: values?.model || null,
};
```

When `fullVersionList` exists, use it instead of low-entropy `brands` for version detail.

- [ ] **Step 7: Implement runtime evidence collection conservatively**

LIFF:

```ts
function readLiff(options: DetectOptions): boolean | null {
  if (!options.liff) return null;
  try {
    return options.liff.isInClient();
  } catch {
    return null;
  }
}
```

PWA: true when `navigator.standalone === true` or `matchMedia('(display-mode: standalone)').matches`; otherwise false/null. In `enrich()`, LIFF runtime true sets `mini-app/liff/line`; standalone PWA only fills an otherwise-null context.

- [ ] **Step 8: Run runtime + enrichment tests**

```bash
npm test -- --runInBand src/v3/__tests__/browser-runtime.test.ts src/v3/__tests__/client-hints.test.ts
npm run lint
```

Expected: PASS.

- [ ] **Step 9: Commit browser runtime detection**

```bash
git add src/v3/browser.ts src/v3/enrich.ts src/v3/__tests__/browser-runtime.test.ts
git commit -m "feat: add v3 browser runtime detection"
```

---

### Task 8: Atomic public/package cut-over to v3 with green verification

**Files:**
- Modify: `src/v3/index.ts`
- Modify: `src/index.ts`
- Modify: `src/__tests__/root-api.test.ts`
- Modify: `package.json`
- Modify: `jest.config.js`
- Modify: `scripts/verify-package-identity.mjs`
- Modify: `scripts/verify-package.mjs`
- Modify: `scripts/verify-consumers.mjs`
- Create: `MIGRATION.md`

**Interfaces:**
- Consumes: all completed v3 public modules.
- Produces one green repository state where the package is already `3.0.0`, root/check/server/browser exports all point to v3, current consumer verification expects v3, and `npm run check` still passes before later cleanup.

Public entry points after this task:

```text
ua-info          -> parse + constants + public data types + version helper
ua-info/check    -> generic + named predicates
ua-info/server   -> parseRequest + header types
ua-info/browser  -> detect + DetectOptions + LiffAdapter
```

- [ ] **Step 1: Write failing root/export contract tests before switching**

Update `src/__tests__/root-api.test.ts`:

```ts
import * as root from '../index';
import * as check from '../v3/check';

// @ts-expect-error v3 root no longer exports generic predicates
import { isBrowser as removedRootPredicate } from '../index';
// @ts-expect-error v3 removes the UAResult type
import type { UAResult as RemovedUAResult } from '../index';

it('keeps the root parser-first', () => {
  expect(typeof root.parse).toBe('function');
  expect('isBrowser' in root).toBe(false);
  expect(typeof check.isChrome).toBe('function');
});

void removedRootPredicate;
type _RemovedUAResult = RemovedUAResult;
```

Also assert `package.json.exports['./check']`, `['./server']`, and `['./browser']` point to `dist/*/v3/...`.

- [ ] **Step 2: Run the root test and verify it fails against v2**

```bash
npm test -- --runInBand src/__tests__/root-api.test.ts
```

Expected: FAIL because the root and export map are still v2.

- [ ] **Step 3: Finalize `src/v3/index.ts` and switch `src/index.ts`**

`src/v3/index.ts`:

```ts
export * from './constants';
export * from './parse';
export * from './types';
export * from './version';
```

`src/index.ts`:

```ts
export * from './v3';
```

Do not export `./check`, `./server`, or `./browser` through root.

- [ ] **Step 4: Create the complete v2 -> v3 migration guide before changing package files**

Create `MIGRATION.md` with concrete before/after sections for:

```text
UAResult -> UAInfo
dimension object nullability -> fixed object with null fields
browser.id/os.id -> browser.name/os.name
Version.raw -> Version.full
detectCurrent() -> detect()
root predicates -> ua-info/check
isOperatingSystem() -> isOS()
isDeviceType() -> isDevice()
xiaomi-browser -> mi-browser
pure LINE UA no longer proving LIFF
removed generic embedded application context
parseRequest() accepting direct HeaderSource or RequestLikeInput
```

Include these exact migration examples:

```ts
// v2
import { BrowserId, isBrowser, parse } from 'ua-info';
if (isBrowser(parse(ua), BrowserId.Chrome)) {}

// v3
import { BrowserId, parse } from 'ua-info';
import { isBrowser } from 'ua-info/check';
if (isBrowser(parse(ua), BrowserId.Chrome)) {}
```

```ts
// v2
import { detectCurrent } from 'ua-info/browser';
const info = await detectCurrent();

// v3
import { detect } from 'ua-info/browser';
const info = await detect();
```

- [ ] **Step 5: Change package identity/export map/files to v3**

Before editing, run `git diff -- package.json` and preserve unrelated worktree edits. Semantic target:

```json
{
  "version": "3.0.0",
  "files": ["dist", "README.md", "MIGRATION.md", "LICENSE"],
  "exports": {
    ".": {
      "types": "./dist/esm/index.d.ts",
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js",
      "default": "./dist/esm/index.js"
    },
    "./check": {
      "types": "./dist/esm/v3/check.d.ts",
      "import": "./dist/esm/v3/check.js",
      "require": "./dist/cjs/v3/check.js",
      "default": "./dist/esm/v3/check.js"
    },
    "./server": {
      "types": "./dist/esm/v3/server.d.ts",
      "import": "./dist/esm/v3/server.js",
      "require": "./dist/cjs/v3/server.js",
      "default": "./dist/esm/v3/server.js"
    },
    "./browser": {
      "types": "./dist/esm/v3/browser.d.ts",
      "import": "./dist/esm/v3/browser.js",
      "require": "./dist/cjs/v3/browser.js",
      "default": "./dist/esm/v3/browser.js"
    },
    "./package.json": "./package.json"
  }
}
```

Keep `sideEffects: false` and Node >=18.

- [ ] **Step 6: Point Jest coverage/check scripts at v3**

In `jest.config.js` change coverage collection from `src/v2/**/*.ts` to `src/v3/**/*.ts`. In `package.json` change:

```json
"fixture:check": "jest src/v3/__tests__ --runInBand",
"test:coverage": "jest src/v3 --coverage --runInBand",
"detection:check": "npm run test:coverage"
```

The separate fixture invocation is removed from `detection:check` because the coverage run already executes the fixture-backed v3 tests.

- [ ] **Step 7: Make current identity/package verification accept the new v3 release before cleanup**

In `verify-package-identity.mjs`, change the exact version to `3.0.0`, require `MIGRATION.md`, and remove the old rule forbidding it:

```js
const expected = Object.freeze({
  name: 'ua-info',
  version: '3.0.0',
  repository: 'git+https://github.com/petechatchawan/ua-info.git',
  homepage: 'https://petechatchawan.github.io/ua-info/',
  bugs: 'https://github.com/petechatchawan/ua-info/issues',
});

const requiredFiles = new Set(['dist', 'README.md', 'MIGRATION.md', 'LICENSE']);
```

In `verify-package.mjs`, change `2.2.0`/`2.x` assertions to `3.0.0`/`3.x`, require `./check`, `./server`, `./browser`, and require `MIGRATION.md`. At this intermediate task, do not yet fail merely because unexported `dist/*/v2/` files still exist; Task 9 removes them.

- [ ] **Step 8: Update the existing escaped-string consumers to v3 so `pack:check` stays green**

Before the cleanup in Task 9, update `verify-consumers.mjs` in place to test:

```js
import { BrowserId, parse } from 'ua-info';
import { isBrowser, isChrome } from 'ua-info/check';
import { parseRequest } from 'ua-info/server';
import { detect } from 'ua-info/browser';
```

Change assertions from `.browser?.id` to `.browser.name`, `UAResult` to `UAInfo`, `detectCurrent` to `detect`, and root predicates to `ua-info/check`. Change the packed identity assertion to require `ua-info@3.0.0`. Keep the existing ESM/CJS/TypeScript temp-consumer mechanism for this task only.

- [ ] **Step 9: Run the complete repository check before committing the public cut-over**

```bash
npm test -- --runInBand src/__tests__/root-api.test.ts src/v3
npm run test:coverage
npm run build
npm run check
```

Expected: PASS. This is the gate that prevents a commit where `package.json` says 3.0.0 while verification scripts still expect 2.2.0.

- [ ] **Step 10: Commit the atomic public cut-over**

```bash
git add src/index.ts src/__tests__/root-api.test.ts src/v3/index.ts package.json jest.config.js \
  scripts/verify-package-identity.mjs scripts/verify-package.mjs scripts/verify-consumers.mjs MIGRATION.md
git commit -m "feat: switch ua-info package to v3 API"
```

---

### Task 9: Remove v2 implementation and simplify package/consumer verification

**Files:**
- Delete: `src/v2/**`
- Modify: `scripts/verify-package-identity.mjs`
- Modify: `scripts/verify-package.mjs`
- Modify: `scripts/verify-consumers.mjs`
- Create: `scripts/consumer-fixtures/esm.mjs`
- Create: `scripts/consumer-fixtures/cjs.cjs`
- Create: `scripts/consumer-fixtures/typescript.ts`
- Create: `scripts/consumer-fixtures/tsconfig.json`
- Modify: `package.json`

**Interfaces:**
- Consumes: the already-green v3 package from Task 8.
- Produces one-pack verification: content inspection and all ESM/CJS/TypeScript consumer checks use the same tarball; no v2 implementation is built or packed.

- [ ] **Step 1: Write the consumer fixtures as real checked-in files**

`scripts/consumer-fixtures/esm.mjs`:

```js
import assert from 'node:assert/strict';
import { BrowserId, parse } from 'ua-info';
import { isBrowser, isChrome, isMobile } from 'ua-info/check';
import { parseRequest } from 'ua-info/server';
import { detect } from 'ua-info/browser';

const ua = 'Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36';
const result = parse(ua);
assert.equal(result.browser.name, BrowserId.Chrome);
assert.equal(isBrowser(result, BrowserId.Chrome), true);
assert.equal(isChrome(result), true);
assert.equal(isMobile(result), true);
assert.equal(parseRequest({ 'user-agent': ua }).os.name, 'android');
assert.equal(typeof detect, 'function');
```

`scripts/consumer-fixtures/cjs.cjs` must `require()` root/check/server and make equivalent assertions. `typescript.ts` must prove narrowing:

```ts
import { BrowserId, parse } from 'ua-info';
import { isBrowser } from 'ua-info/check';

const result = parse('Mozilla/5.0 Chrome/150.0.0.0 Safari/537.36');
if (isBrowser(result, BrowserId.Chrome)) {
  const exact: typeof BrowserId.Chrome = result.browser.name;
  void exact;
}
```

`tsconfig.json` uses Node16 module/moduleResolution, strict mode, `skipLibCheck: false`, and no emit.

- [ ] **Step 2: Generalize package identity verification from exact 3.0.0 to any valid 3.x release**

Keep repository/homepage/OIDC checks, but replace the exact version check with:

```js
if (!/^3\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(packageJson.version)) {
  failures.push(`version must be ua-info 3.x: ${packageJson.version}`);
}

for (const entry of ['dist', 'README.md', 'MIGRATION.md', 'LICENSE']) {
  if (!packageJson.files?.includes(entry)) failures.push(`files is missing ${entry}`);
}
```

- [ ] **Step 3: Make `verify-package.mjs` pack exactly once**

Create a temporary directory and run:

```js
const output = execFileSync(npmCommand, [
  'pack', '--ignore-scripts', '--json', '--pack-destination', workspace,
], { cwd: root, encoding: 'utf8' });
```

Validate `report.name === packageJson.name` and `report.version === packageJson.version`. Require `README.md`, `LICENSE`, `MIGRATION.md`; reject tests, playground files, v1 artifacts, and any `dist/esm/v2/` or `dist/cjs/v2/` path. Enforce explicit package ceilings here: `report.unpackedSize <= 150_000` and `report.files.length <= 64`.

Then invoke the consumer verifier with the same tarball:

```js
execFileSync(nodeCommand, [
  path.join(root, 'scripts/verify-consumers.mjs'),
  tarballPath,
], { cwd: root, stdio: 'inherit' });
```

Clean the temporary directory in `finally`.

- [ ] **Step 4: Change `verify-consumers.mjs` to consume a tarball argument instead of packing**

At startup:

```js
const tarballPath = process.argv[2];
if (!tarballPath) throw new Error('verify-consumers.mjs requires a packed tarball path');
```

Remove its `npm pack` call. Copy the four checked-in fixture files into its temp workspace, install the supplied tarball once, then execute ESM, CJS, and TypeScript fixtures.

- [ ] **Step 5: Simplify package scripts so checks are not duplicated**

Target relationships:

```json
"identity:check": "node scripts/verify-package-identity.mjs",
"pack:check": "node scripts/verify-package.mjs",
"check": "npm run lint && npm run detection:check && npm run build && npm run pack:check",
"prepack": "npm run check"
```

Remove `consumer:check` from the aggregate path because `pack:check` now runs consumer verification using its single tarball. Let `verify-package.mjs` import/run identity verification so `check` does not separately repeat `identity:check`.

- [ ] **Step 6: Delete v2 source after v3 parity is green**

Delete `src/v2/**`. Do not add compatibility exports. Run a clean build and assert there are no v2 paths:

```bash
npm run clean
npm run build
find dist -type f | grep '/v2/' && exit 1 || true
```

Expected: no output from the v2 path scan.

- [ ] **Step 7: Run clean package verification**

```bash
npm run test:coverage
npm run build
npm run pack:check
npm run check
```

Expected: PASS; one packed tarball is used for content + consumer checks and contains no v2 path.

- [ ] **Step 8: Commit package hardening and v2 removal**

```bash
git add -A src/v2 scripts package.json MIGRATION.md
git commit -m "refactor: remove v2 and simplify package verification"
```

---

### Task 10: Migrate the interactive playground to v3 contracts

**Files:**
- Modify: `apps/playground/src/services/ua-detection-service.ts`
- Modify: `apps/playground/src/app/current-detection-effect.ts`
- Modify: `apps/playground/src/app/current-detection-effect.test.ts`
- Modify: `apps/playground/src/app/manual-detection-effect.test.ts`
- Modify: `apps/playground/src/app/playground-view-model.ts`
- Modify: `apps/playground/src/app/playground-view-model.test.ts`
- Modify: `apps/playground/src/app/playground-state.ts`
- Modify: `apps/playground/src/app/playground-actions.ts`
- Modify: `apps/playground/src/app/create-playground-app.ts`
- Modify: `apps/playground/src/app/create-playground-app.test.ts`
- Modify: `apps/playground/src/tests/fixtures.ts`
- Modify: `apps/playground/src/contract/public-entrypoints.test.ts`
- Modify any component/result tests that compile against `UAResult`/`.id`/`version.raw`.

**Interfaces:**
- Consumes: packed v3 package.
- Produces playground-facing `UAInfo` only; no compatibility aliases inside the app.

- [ ] **Step 1: Change the service contract in a failing compile-first edit**

Target service:

```ts
import { parse, type UAInfo } from 'ua-info';
import { detect, type DetectOptions } from 'ua-info/browser';
import type { HeaderRecord } from 'ua-info/server';

export type { UAInfo };

export interface UADetectionService {
  detect(): Promise<UAInfo>;
  parseUserAgent(userAgent: string): UAInfo;
  parseRequest(input: {
    readonly userAgent: string;
    readonly headers: HeaderRecord;
  }): Promise<UAInfo>;
}
```

The playground remains an explicit diagnostics surface, so `createUADetectionService()` uses `detect({ highEntropy: true })` to preserve its current rich current-browser inspection behavior. This is an application-level opt-in and does not change the library default `detect()` semantics.

- [ ] **Step 2: Run playground typecheck and capture expected v2-shape failures**

```bash
npm run playground:setup
npm run playground:typecheck
```

Expected before migration: FAIL on `UAResult`, `detectCurrent`, `.id`, `version.raw`, and nullable dimension assumptions.

- [ ] **Step 3: Migrate state/actions/effects from `UAResult` to `UAInfo`**

Rename internal service method calls from `detectCurrent()` to `detect()`:

```ts
const result = await input.detectionService.detect();
```

Replace type imports everywhere with `UAInfo`. Do not introduce a local `type UAResult = UAInfo` alias.

- [ ] **Step 4: Migrate result rendering to fixed-shape v3 fields**

Use exact accesses:

```ts
result.browser.name
result.browser.version?.full
result.engine.name
result.os.name
result.device.type
result.client.name
result.context.name
```

Remove optional chaining that only existed because whole v2 dimensions were nullable, while keeping optional access on nullable nested fields such as `version` and `context.host`.

- [ ] **Step 5: Update playground fixtures to v3 fixed objects**

Representative `chromeResult`:

```ts
export const chromeResult: UAInfo = {
  ua: 'fixture',
  browser: {
    name: 'chrome',
    version: { full: '150.0.0.0', major: 150 },
    family: 'chromium',
    mode: 'browser',
  },
  engine: { name: 'blink', version: null },
  os: { name: 'windows', version: null },
  device: { type: 'desktop', vendor: null, model: null },
  cpu: { architecture: 'x86_64', bitness: 64 },
  client: { type: null, name: null, version: null },
  context: { type: null, name: null, host: null },
};
```

LIFF fixture must represent runtime-confirmed LIFF:

```ts
context: {
  type: 'mini-app',
  name: 'liff',
  host: { name: 'line', version: { full: '26.11.0', major: 26 } },
}
```

- [ ] **Step 6: Update generated code examples to v3 imports**

Current-browser example:

```ts
import { detect } from 'ua-info/browser';

const result = await detect();
```

Predicate examples should import from `ua-info/check`, not root.

- [ ] **Step 7: Update packed-entrypoint contract test**

`apps/playground/src/contract/public-entrypoints.test.ts` must import:

```ts
import { BrowserId, parse } from 'ua-info';
import { isChrome } from 'ua-info/check';
import { detect } from 'ua-info/browser';
import { parseRequest } from 'ua-info/server';
```

Assert `parse().browser.name`, `parseRequest()` Client Hint enrichment, `typeof detect === 'function'`, and `isChrome()`.

- [ ] **Step 8: Run all playground checks**

```bash
npm run playground:typecheck
npm run playground:test
npm run playground:build
npm run playground:test:e2e
```

Expected: PASS.

- [ ] **Step 9: Commit playground migration**

```bash
git add apps/playground
git commit -m "feat: migrate playground to ua-info v3"
```

---

### Task 11: Rewrite public documentation, release notes, and final acceptance/performance checks

**Files:**
- Modify: `README.md`
- Modify: `MIGRATION.md`
- Modify: `CHANGELOG.md`
- Modify: `benchmarks/scenarios.mjs` if old predicate/browser names remain.
- Modify: `benchmarks/performance-gate-policy.json` only if required by the explicit simplification below.
- Modify: `scripts/performance/gate-policy.mjs`
- Modify: `scripts/performance/__tests__/gate-policy.test.cjs`
- Modify: `docs/performance.md`

**Interfaces:**
- Consumes: final v3 package/API.
- Produces published usage documentation and release acceptance evidence.

- [ ] **Step 1: Rewrite README quick start around the three-step mental model**

Top-level examples must lead with:

```ts
import { parse } from 'ua-info';
import { isAndroid, isChrome, isMobile } from 'ua-info/check';

const info = parse(userAgent);

if (isChrome(info) && isAndroid(info) && isMobile(info)) {
  // browser-specific flow
}
```

Add separate concise sections for:

```ts
import { parseRequest } from 'ua-info/server';
const info = parseRequest(request);
```

and:

```ts
import { detect } from 'ua-info/browser';
const info = await detect();
```

- [ ] **Step 2: Document exact browser, device, client, and context semantics**

README browser support table must match the spec catalog and include Chrome, Safari, Edge, Firefox, Opera, Samsung Internet, Brave, Vivaldi, Mi Browser, Huawei Browser, UC Browser, Yandex Browser, Arc when evidence is available, Chromium product, and Android WebView mode.

Explicitly document:

```text
isChromium() = Chromium product only
isBrowserFamily(info, 'chromium') = Chromium lineage
isMobile() does not include tablet
ClientInfo.name is intentionally open-ended
known browser + unknown family is valid
unknown family + known product is valid
```

- [ ] **Step 3: Document LINE/LIFF and server Client Hints truthfully**

README must show runtime LIFF:

```ts
const info = await detect({ liff });
if (isLine(info) && isLiff(info)) {
  // LIFF browser execution
}
```

State that pure UA parsing may identify LINE but does not prove LIFF. State that `parseRequest()` only consumes present `Sec-CH-UA-*` headers and does not negotiate `Accept-CH`/`Critical-CH`.

- [ ] **Step 4: Finish `MIGRATION.md` and add `CHANGELOG.md` v3.0.0 entry**

Ensure the migration guide created in Task 8 has no stale v2 API examples presented as current API. Add `CHANGELOG.md` entry summarizing:

```text
Breaking: fixed-shape UAInfo, name IDs, Version.full, detect(), check subpath
Added: current browser catalog including Mi Browser, named predicates, structured CH merge, conservative LIFF runtime detection
Removed: v2 public API, unknown sentinels, detectCurrent(), generic embedded application context
Changed: package/server/browser consumer contracts and migration guide included in tarball
```

- [ ] **Step 5: Update benchmark scenarios for the v3 API without adding new framework machinery**

The current `benchmarks/scenarios.mjs` is known to use v2 fields/imports. Change all four affected snippets exactly:

```text
root parse:      result.browser?.id -> result.browser.name
root predicate:  import BrowserId from ua-info + isChrome from ua-info/check; parse a Chrome UA and call isChrome(result)
server:          result.browser?.id -> result.browser.name
browser:         detectCurrent import/global marker -> detect import/global marker
```

Keep the existing scenario names and report/gate architecture so the 2.2.0 baseline remains comparable.

- [ ] **Step 6: Simplify the performance policy deterministically around meaningful hard gates**

Package total size/file count are already enforced by `verify-package.mjs` at 150,000 unpacked bytes and 64 files. Remove the duplicate zero-growth package/distribution blockers from the performance policy instead of adding tolerance machinery.

Change `benchmarks/performance-gate-policy.json` to:

```json
"blocking": {
  "package": [],
  "distributions": [],
  "bundles": ["rawBytes"]
}
```

Keep the existing advisory values unchanged:

```json
"advisory": {
  "package": ["tarballBytes"],
  "bundles": ["gzipBytes", "brotliBytes"],
  "coldImportSlowdownPercent": 25,
  "parseThroughputDropPercent": 15
}
```

Update `scripts/performance/gate-policy.mjs` expected arrays to `blockingPackage: []` and `blockingDistributions: []`; keep `blockingBundles: ['rawBytes']`. Update `scripts/performance/__tests__/gate-policy.test.cjs` and `docs/performance.md` to match. Do not add new policy fields or a second evaluator.

Run:

```bash
npm test -- --runInBand scripts/performance/__tests__/gate-policy.test.cjs
```

Expected: PASS.

The release process treats a parse-throughput advisory above 15% as a release failure requiring optimization even though the existing evaluator labels it advisory; do not ship by merely documenting that warning.

- [ ] **Step 7: Run repository-wide acceptance checks**

Run in this order:

```bash
npm run lint
npm run test:coverage
npm run build
npm run pack:check
npm run playground:check
npm run performance:sizes
npm run performance:runtime
npm run performance:report
npm run performance:validate
npm run performance:gate
```

Expected: all blocking checks PASS. Advisory performance warnings are allowed only when recorded in the final implementation review; blocking violations are not.

- [ ] **Step 8: Run final stale-v2 and placeholder scans**

```bash
rg -n "detectCurrent|UAResult|Version\.raw|isOperatingSystem|isDeviceType|xiaomi-browser|ContextKind\.Embedded|BrowserMode\.Embedded" \
  src apps/playground README.md MIGRATION.md scripts package.json
```

Expected: no current-code/documentation matches except explicit “v2 before” examples inside `MIGRATION.md`.

Also run:

```bash
rg -n "[T]BD|[T]ODO|[F]IXME|[P]LACEHOLDER|[i]mplement later|[f]ill in" \
  src/v3 README.md MIGRATION.md
```

Expected: no matches.

- [ ] **Step 9: Commit release documentation and acceptance updates**

```bash
git add README.md MIGRATION.md CHANGELOG.md benchmarks scripts/performance docs/performance.md
git commit -m "docs: finalize ua-info v3 release contracts"
```

---

## Final Implementation Review Checklist

Before declaring v3 complete, verify all of the following against the spec:

- [ ] `parse()` returns fixed-shape `UAInfo` for empty, malformed, browser, bot, and in-app UAs.
- [ ] Root package does not export named predicates; `ua-info/check` does.
- [ ] `isChrome`, `isSafari`, `isFirefox`, `isEdge`, `isOpera`, `isSamsungInternet`, and `isMiBrowser` are directly available.
- [ ] `isChromium()` is false for Chrome/Edge/Brave/Mi Browser and true only for Chromium product identity.
- [ ] Browser family can be `chromium` while browser product is `null`, and product can be known while family is `null`.
- [ ] Chrome/Safari/Firefox/Edge/Opera/Samsung/Mi/Huawei/UC/Yandex/Vivaldi/Brave evidence is fixture-backed; Arc is only asserted where reliable evidence exists.
- [ ] Client Hints merge does not erase more-specific compatible UA identity.
- [ ] `parseRequest()` reads supported present hints with no negotiation API.
- [ ] `detect()` requests no high entropy by default.
- [ ] `detect({ highEntropy: true })` requests exactly architecture, bitness, fullVersionList, model, platformVersion.
- [ ] Pure LINE UA does not make `isLiff()` true.
- [ ] Runtime `liff.isInClient() === true` makes `isLiff()` true even with generic UA.
- [ ] Runtime false/absent/throwing LIFF adapter never manufactures LIFF.
- [ ] No generic embedded application context remains in initial v3.
- [ ] `MIGRATION.md` is in the published tarball.
- [ ] Packed artifact contains no v2 implementation path.
- [ ] ESM, CJS, TypeScript, browser, server, and check consumers pass from the same tarball.
- [ ] Playground compiles, tests, builds, and passes e2e against v3.
- [ ] Blocking performance/package gates pass.
