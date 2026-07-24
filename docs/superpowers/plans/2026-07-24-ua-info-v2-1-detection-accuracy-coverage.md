# ua-info v2.1 Detection Accuracy & Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Release `ua-info@2.1.0` with source-backed fixtures, explicit precedence, targeted detector corrections, robustness coverage, and enforced coverage thresholds while preserving the 2.0 public contract.

**Architecture:** Keep the independent detector architecture. Add test-only fixtures under `src/v2/__tests__/fixtures`; change production only when a failing fixture proves a defect; verify through unit, coverage, build, packed-consumer, Playground, publication, and live-consumer gates.

**Tech Stack:** TypeScript 4.9, Jest 30, ts-jest, ESLint, Node.js 18/20/22, ESM/CommonJS, npm pack, Vite/Vitest/Playwright, GitHub Actions, npm Trusted Publishing.

## Global Constraints

- Target package is exactly `ua-info@2.1.0`.
- Node.js remains `>=18`; CI remains 18/20/22.
- Public exports remain root, `/server`, `/browser`, and `/package.json`.
- `UAResult`, `ClientKind`, `ContextKind`, and existing interfaces remain compatible.
- `parse()` remains synchronous, deterministic, and browser-global free.
- No runtime dependency is added.
- User-Agent and Client Hints are untrusted claims, never verified identity.
- Fixtures stay outside the npm tarball.
- Coverage for production `src/v2/**`: statements 90%, lines 90%, functions 90%, branches 85%.
- Thresholds are not lowered.
- npm publication remains OIDC-only with provenance.

---

### Task 1: Fixture Foundation

**Files:**
- Create: `src/v2/__tests__/fixtures/fixture-types.ts`
- Create: `src/v2/__tests__/fixtures/provenance.ts`
- Create: `src/v2/__tests__/fixtures/index.ts`
- Create: `src/v2/__tests__/fixture-contract.test.ts`

**Interfaces:** Produces `DeepPartial<T>`, `DetectionFixture`, `RequestFixture`, `PROVENANCE`, and `ALL_DETECTION_FIXTURES`.

- [ ] **Step 1: Write the failing contract test**

```ts
// src/v2/__tests__/fixture-contract.test.ts
import { ALL_DETECTION_FIXTURES, PROVENANCE } from './fixtures';

it('uses unique valid ids and complete provenance', () => {
  const ids = ALL_DETECTION_FIXTURES.map((item) => item.id);
  expect(new Set(ids).size).toBe(ids.length);
  for (const item of ALL_DETECTION_FIXTURES) {
    expect(item.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    expect(item.source.authority.trim()).not.toBe('');
    expect(item.source.reference.trim()).not.toBe('');
    expect(item.source.observedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Object.keys(item.expected).length).toBeGreaterThan(0);
  }
});

it('freezes authoritative sources', () => {
  expect(PROVENANCE.openAi.reference).toContain('help.openai.com');
  expect(PROVENANCE.google.reference).toContain('developers.google.com');
  expect(PROVENANCE.perplexity.reference).toContain('docs.perplexity.ai');
});
```

- [ ] **Step 2: Verify RED**

Run: `npx jest src/v2/__tests__/fixture-contract.test.ts --runInBand`  
Expected: FAIL because `./fixtures` does not exist.

- [ ] **Step 3: Create distributive fixture types**

```ts
// src/v2/__tests__/fixtures/fixture-types.ts
import type { HeaderRecord } from '../../parser/client-hints';
import type { UAResult } from '../../types';

export type DeepPartial<T> = T extends readonly unknown[]
  ? T
  : T extends object
    ? { readonly [K in keyof T]?: DeepPartial<T[K]> }
    : T;

export interface FixtureSource {
  readonly kind: 'official-doc' | 'captured' | 'regression';
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

- [ ] **Step 4: Create provenance and barrel**

```ts
// src/v2/__tests__/fixtures/provenance.ts
const official = (authority: string, reference: string, notes: string) => Object.freeze({
  kind: 'official-doc' as const,
  authority,
  reference,
  observedAt: '2026-07-24',
  notes,
});

export const PROVENANCE = Object.freeze({
  openAi: official('OpenAI', 'https://help.openai.com/en/articles/12627856-publishers-and-developers-faq', 'OAI-SearchBot and GPTBot.'),
  openAiAds: official('OpenAI', 'https://help.openai.com/en/articles/20001243-advertiser-guidance-for-allowing-openai-web-crawlers', 'OAI-AdsBot.'),
  google: official('Google', 'https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers', 'Google crawlers and Google-Extended semantics.'),
  perplexity: official('Perplexity', 'https://docs.perplexity.ai/docs/resources/perplexity-crawlers', 'PerplexityBot versus Perplexity-User.'),
});
```

```ts
// src/v2/__tests__/fixtures/index.ts
import type { DetectionFixture } from './fixture-types';
export const ALL_DETECTION_FIXTURES: readonly DetectionFixture[] = Object.freeze([]);
export { PROVENANCE } from './provenance';
export type { DeepPartial, DetectionFixture, FixtureSource, RequestFixture } from './fixture-types';
```

- [ ] **Step 5: Verify GREEN and commit**

```bash
npx jest src/v2/__tests__/fixture-contract.test.ts --runInBand
npm run lint
git add src/v2/__tests__
git commit -m "test: add detection fixture contracts"
```

---

### Task 2: Browser and Engine Precedence

**Files:**
- Create: `src/v2/__tests__/fixture-assertions.ts`
- Create: `src/v2/__tests__/fixtures/browsers.ts`
- Create: `src/v2/__tests__/precedence.test.ts`
- Modify: `src/v2/__tests__/fixtures/index.ts`
- Modify: `src/v2/parser/browser.ts`

- [ ] **Step 1: Add fixture runner and browser corpus**

```ts
// fixture-assertions.ts
import { parse } from '../index';
import type { DetectionFixture } from './fixtures';
export const assertDetectionFixture = (fixture: DetectionFixture): void => {
  expect(parse(fixture.userAgent)).toMatchObject(fixture.expected);
};
```

`browsers.ts` must include exact fixtures for Chrome, explicit Chromium, Edge, Opera, Samsung Internet, Headless Chrome, Chrome iOS/WebKit, Android WebView, and Safari negative collision. Each fixture carries regression provenance.

- [ ] **Step 2: Write precedence execution**

```ts
// precedence.test.ts
import { assertDetectionFixture } from './fixture-assertions';
import { BROWSER_FIXTURES } from './fixtures';

describe('browser precedence', () => {
  it.each(BROWSER_FIXTURES)('$id', (fixture) => assertDetectionFixture(fixture));
});
```

- [ ] **Step 3: Verify RED**

Run: `npx jest src/v2/__tests__/precedence.test.ts --runInBand`  
Expected: explicit `Chromium/150.0.0.0` reports `chrome` instead of `chromium`.

- [ ] **Step 4: Split Chromium from Chrome**

```ts
// src/v2/parser/browser.ts, after derivative and iOS branches
const chromium = /\bChromium\/([0-9]+(?:\.[0-9]+)*)/i.exec(userAgent);
if (chromium?.[1]) {
  return createDetection({
    regex: /$^/,
    id: BrowserId.Chromium,
    name: 'Chromium',
    family: BrowserFamily.Chromium,
    engine: 'blink',
  }, chromium[1], isAndroidWebView(userAgent) ? 'webview' : 'browser');
}

const chrome = /\bChrome\/([0-9]+(?:\.[0-9]+)*)/i.exec(userAgent);
if (chrome?.[1]) {
  return createDetection({
    regex: /$^/,
    id: BrowserId.Chrome,
    name: 'Chrome',
    family: BrowserFamily.Chromium,
    engine: 'blink',
  }, chrome[1], isAndroidWebView(userAgent) ? 'webview' : 'browser');
}
```

- [ ] **Step 5: Verify and commit**

```bash
npx jest src/v2/__tests__/precedence.test.ts src/v2/__tests__/parse.test.ts --runInBand
npm test
npm run lint
git add src/v2/parser/browser.ts src/v2/__tests__
git commit -m "fix: distinguish Chromium browser identity"
```

---

### Task 3: Source-Backed Client Corrections

**Files:**
- Create: `src/v2/__tests__/fixtures/clients.ts`
- Modify: `src/v2/__tests__/fixtures/index.ts`
- Modify: `src/v2/__tests__/precedence.test.ts`
- Modify: `src/v2/parser/client.ts`

- [ ] **Step 1: Add fixtures**

`clients.ts` must assert:

```text
OAI-SearchBot/1.0       -> crawler / oai-searchbot
GPTBot/1.2              -> ai-agent / gptbot
OAI-AdsBot/1.0          -> crawler / oai-adsbot
Googlebot/2.1           -> crawler / googlebot
Googlebot-Image/1.0     -> crawler / googlebot-image
Googlebot-Video/1.0     -> crawler / googlebot-video
Google-Extended         -> client null
Perplexity-User/1.0     -> client null
AhrefsBot/7.0           -> explicit crawler, not generic bot
RoboticsResearch/1.0    -> client null
```

Use `PROVENANCE` for provider fixtures and regression provenance for collision fixtures.

- [ ] **Step 2: Verify RED**

Run: `npx jest src/v2/__tests__/precedence.test.ts --runInBand`  
Expected: missing OAI identities, missing distinct Googlebot products, incorrect Google-Extended claim, and unsafe generic substring matching.

- [ ] **Step 3: Correct explicit patterns**

Place these before generic crawlers in `CLIENT_PATTERNS`:

```ts
{ regex: /\bOAI-SearchBot(?:\/([0-9.]+))?/i, kind: 'crawler', id: 'oai-searchbot', name: 'OAI-SearchBot' },
{ regex: /\bOAI-AdsBot(?:\/([0-9.]+))?/i, kind: 'crawler', id: 'oai-adsbot', name: 'OAI-AdsBot' },
{ regex: /\bGooglebot-Image\/([0-9.]+)/i, kind: 'crawler', id: 'googlebot-image', name: 'Googlebot Image' },
{ regex: /\bGooglebot-Video\/([0-9.]+)/i, kind: 'crawler', id: 'googlebot-video', name: 'Googlebot Video' },
{ regex: /\bGooglebot\/([0-9.]+)/i, kind: 'crawler', id: 'googlebot', name: 'Googlebot' },
```

Delete the `Google-Extended` entry.

- [ ] **Step 4: Harden generic fallback**

```ts
const match = /\b([a-z0-9._-]*(?:bot|spider|crawler))\b(?:[/ ]?([0-9.]+))?/i.exec(userAgent);
```

Keep the existing returned `ClientInfo` shape.

- [ ] **Step 5: Verify and commit**

```bash
npx jest src/v2/__tests__/precedence.test.ts src/v2/__tests__/parse.test.ts --runInBand
npm test
npm run lint
git add src/v2/parser/client.ts src/v2/__tests__
git commit -m "fix: harden source-backed client detection"
```

---

### Task 4: Context, Platform, and Client Hints Matrices

**Files:**
- Create: `src/v2/__tests__/fixtures/contexts.ts`
- Create: `src/v2/__tests__/fixtures/operating-systems.ts`
- Create: `src/v2/__tests__/fixtures/devices.ts`
- Create: `src/v2/__tests__/fixtures/client-hints.ts`
- Create: `src/v2/__tests__/context-coverage.test.ts`
- Create: `src/v2/__tests__/platform-coverage.test.ts`
- Create: `src/v2/__tests__/client-hints-coverage.test.ts`
- Modify: `src/v2/parser/os.ts`
- Modify: `src/v2/__tests__/adapters.test.ts`

- [ ] **Step 1: Add context fixtures**

Cover LINE LIFF, LINE in-app, Facebook, Instagram, TikTok, X, WeChat, Telegram Mini App, Electron, Capacitor, Cordova, standalone Android WebView, context-only with browser null, and headless mode not overwritten.

Core assertion:

```ts
expect(parse(lineLiffUa)).toMatchObject({
  browser: { id: 'chrome', mode: 'webview' },
  client: null,
  context: { kind: 'mini-app', id: 'liff', host: { id: 'line' } },
});
```

- [ ] **Step 2: Add OS/device/CPU fixtures**

Cover Windows Phone precedence, iPhone/iPadOS, Android, HarmonyOS, ChromeOS, KaiOS, Tizen, Apple devices, Android mobile/tablet, conservative vendor inference, TV, console, wearable, XR, x86_64, ARM64, and RISC-V 64.

- [ ] **Step 3: Verify and fix iPadOS RED**

Run: `npx jest src/v2/__tests__/platform-coverage.test.ts --runInBand`  
Expected: iPad reports generic iOS.

Move this branch before generic iOS in `os.ts`:

```ts
const ipadOS = /\biPad\b.*?(?:CPU )?OS[ _/]([0-9_]+)/i.exec(userAgent);
if (ipadOS?.[1]) return createOS(OSId.IOS, 'iPadOS', ipadOS[1]);
```

- [ ] **Step 4: Add Client Hints fixtures**

Assert full-version list over low entropy, Edge over Chrome brand, GREASE ignored, `?0` preserving tablet, unknown platform preserving UA OS, valid brand surviving malformed siblings, frozen headers unchanged, and null-prototype record handling.

```ts
expect(parseRequest({
  userAgent: '',
  headers: { 'sec-ch-ua': '"Google Chrome";v="150", "Microsoft Edge";v="150"' },
})).toMatchObject({ browser: { id: 'edge' } });
```

- [ ] **Step 5: Add browser-adapter tests**

```ts
await expect(detectCurrent()).rejects.toThrow('permission denied');
await expect(detectCurrent()).resolves.toMatchObject({
  context: { id: 'liff', host: { id: 'line' } },
});
```

Use existing navigator cleanup in `adapters.test.ts`.

- [ ] **Step 6: Verify and commit**

```bash
npx jest src/v2/__tests__/context-coverage.test.ts src/v2/__tests__/platform-coverage.test.ts src/v2/__tests__/client-hints-coverage.test.ts src/v2/__tests__/adapters.test.ts --runInBand
npm test
npm run lint
git add src/v2/parser/os.ts src/v2/__tests__
git commit -m "fix: harden context and platform coverage"
```

---

### Task 5: Robustness and Coverage Gate

**Files:**
- Create: `src/v2/__tests__/fixtures/malformed.ts`
- Create: `src/v2/__tests__/robustness.test.ts`
- Modify: `jest.config.js`
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Add robustness fixtures and tests**

Cover empty, whitespace, Unicode, control characters, truncated token, duplicated/contradictory tokens, bounded 64 KiB input, determinism, independent returned objects, exact UA preservation, and no input mutation.

```ts
const first = parse('Chrome/150.0.0.0');
const second = parse('Chrome/150.0.0.0');
expect(first).toEqual(second);
expect(first).not.toBe(second);
expect(first.browser).not.toBe(second.browser);
```

- [ ] **Step 2: Configure coverage**

```js
// jest.config.js additions
collectCoverageFrom: [
  'src/v2/**/*.ts',
  '!src/v2/**/__tests__/**',
  '!src/v2/**/*.d.ts',
],
coverageThreshold: {
  global: { statements: 90, lines: 90, functions: 90, branches: 85 },
},
```

- [ ] **Step 3: Add scripts**

```json
"fixture:check": "jest src/v2/__tests__/fixture-contract.test.ts --runInBand",
"test:coverage": "jest --coverage --runInBand",
"detection:check": "npm run fixture:check && npm run test:coverage",
"check": "npm run identity:check && npm run lint && npm run detection:check && npm run build && npm run pack:check"
```

- [ ] **Step 4: Verify coverage and fill real gaps**

Run: `npm run detection:check`  
Expected: at least 90/90/90/85. Add focused tests for meaningful uncovered branches; do not lower thresholds or exclude production detectors.

- [ ] **Step 5: Add Node 22 CI job**

```yaml
  detection-coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm install
      - run: npm run lint
      - run: npm run detection:check
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: detector-coverage
          path: coverage
          if-no-files-found: ignore
```

- [ ] **Step 6: Verify and commit**

```bash
npm run detection:check
npm run check
git add src/v2/__tests__ jest.config.js package.json .github/workflows/ci.yml
git commit -m "ci: enforce detector coverage thresholds"
```

---

### Task 6: Playground Alignment

**Files:**
- Modify: `apps/playground/src/samples/automation-samples.ts`
- Modify: `apps/playground/src/samples/samples.test.ts`

- [ ] **Step 1: Write failing sample test**

Assert IDs `oai-searchbot`, `googlebot-image`, and `google-extended-control-token` exist.

- [ ] **Step 2: Verify RED**

```bash
npm run playground:setup
npm run test --prefix apps/playground -- samples.test.ts
```

- [ ] **Step 3: Add samples**

```ts
{ id: 'oai-searchbot', label: 'OpenAI OAI-SearchBot', category: 'Automation and bots', userAgent: 'OAI-SearchBot/1.0' },
{ id: 'googlebot-image', label: 'Googlebot Image', category: 'Automation and bots', userAgent: 'Googlebot-Image/1.0' },
{ id: 'google-extended-control-token', label: 'Google-Extended control token', category: 'Unknown or malformed', userAgent: 'Google-Extended' },
```

- [ ] **Step 4: Verify and commit**

```bash
npm run playground:check
git add apps/playground/src/samples
git commit -m "docs: align playground detection samples"
```

---

### Task 7: Documentation and Release Cut

**Files:**
- Create: `CHANGELOG.md`
- Modify: `README.md`
- Modify: `docs/v2-design.md`
- Modify: `package.json`
- Modify: `scripts/verify-package-identity.mjs`

- [ ] **Step 1: Document additions and corrections**

`CHANGELOG.md` records source-backed fixtures, OAI/Google additions, Chromium correction, iPadOS correction, generic bot boundary, Google-Extended removal, coverage gate, and claim-verification warning.

Add to README:

```md
### Claim detection is not identity verification

`ua-info` parses User-Agent and Client Hints claims. These values can be absent, reduced, malformed, or spoofed. A matching client ID does not prove request origin.

Use provider-documented IP ranges, reverse DNS, signed-agent mechanisms, or another server-side verification process when origin verification is required.
```

Append a v2.1 accuracy/provenance addendum to `docs/v2-design.md`.

- [ ] **Step 2: Cut version and verify RED**

Change `package.json` version to `2.1.0`, then run `npm run identity:check`.  
Expected: FAIL because verifier requires `2.0.3`.

- [ ] **Step 3: Update identity verifier**

```js
version: '2.1.0'
```

Update the final success message to `ua-info@2.1.0`. Do not change repository, homepage, bugs URL, exports, files, or OIDC checks.

- [ ] **Step 4: Run final local gates**

```bash
npm run identity:check
npm run detection:check
npm run check
npm run playground:check
npm pack --dry-run
```

Expected tarball contains `dist`, `README.md`, `LICENSE`; excludes source fixtures, coverage, Playground source, and design docs.

- [ ] **Step 5: Commit**

```bash
git add CHANGELOG.md README.md docs/v2-design.md package.json scripts/verify-package-identity.mjs
git commit -m "release: prepare ua-info 2.1.0"
```

---

### Task 8: PR, Publication, and Live Verification

- [ ] **Step 1: Push implementation branch and open draft PR**

Branch: `agent/ua-info-v2-1-detection-accuracy-coverage`  
Title: `feat: harden detection accuracy for ua-info 2.1`

- [ ] **Step 2: Require successful jobs**

```text
CI / test (Node.js 18)
CI / test (Node.js 20)
CI / test (Node.js 22)
CI / detection-coverage
CI / playground
```

- [ ] **Step 3: Audit final diff**

```bash
git diff --check master...HEAD
git diff --stat master...HEAD
git diff master...HEAD -- package.json src/v2 scripts .github apps/playground README.md CHANGELOG.md docs/v2-design.md
```

Verify no public type expansion, runtime dependency, static npm token, fixture tarball leak, unrelated rewrite, or version other than `2.1.0`.

- [ ] **Step 4: Merge at verified head SHA and verify npm OIDC publication**

Record PR, head SHA, CI run, merge SHA, release-report issue, and registry verification.

- [ ] **Step 5: Verify live Node.js 18/20/22 consumers**

```js
console.log(parse('Chromium/150.0.0.0').browser?.id); // chromium
console.log(parse('Google-Extended').client); // null
console.log(parseRequest({ userAgent: '', headers: { 'sec-ch-ua': '"Microsoft Edge";v="150"' } }).browser?.id); // edge
```

Also compile a TypeScript Node16 consumer with `skipLibCheck: false`.

- [ ] **Step 6: Create GitHub release `v2.1.0`**

The tag must resolve to the exact package release commit. Change design status to `Implemented and verified` only after publication, live consumers, and tag verification pass.

---

## Final Verification Checklist

- [ ] Nullable nested fixture partials compile.
- [ ] Fixture IDs and provenance validate.
- [ ] Chromium is distinct from Chrome.
- [ ] Google-Extended is not an HTTP User-Agent client.
- [ ] OAI-SearchBot, OAI-AdsBot, Googlebot Image, and Googlebot Video are source-backed.
- [ ] Perplexity-User is not forced into an inaccurate kind.
- [ ] Browser/context identity and mode remain separate.
- [ ] iPadOS precedence is reachable.
- [ ] Client Hints and malformed inputs are deterministic.
- [ ] Coverage meets 90/90/90/85.
- [ ] Node 18/20/22, detection coverage, and Playground jobs pass.
- [ ] Tarball excludes fixtures and Playground source.
- [ ] Public contracts remain compatible.
- [ ] npm OIDC publication and provenance pass.
- [ ] Clean Node 18/20/22 consumers pass.
- [ ] `v2.1.0` resolves to the exact release commit.
