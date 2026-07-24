# ua-info v2.1 Detection Accuracy & Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Release `ua-info@2.1.0` with source-backed detection fixtures, explicit precedence contracts, targeted accuracy corrections, robustness coverage, and enforced detector coverage thresholds without changing the public result model or package entry points.

**Architecture:** Keep the existing independent detector architecture and add a test-only fixture layer under `src/v2/__tests__/fixtures`. Production changes remain local to the detector whose failing fixture proves the defect. Coverage, package, Playground, and live-consumer gates remain independent verification layers.

**Tech Stack:** TypeScript 4.9, Jest 30 with ts-jest, ESLint, Node.js 18/20/22, native ESM/CommonJS builds, npm packed-consumer verification, Vite/Vitest/Playwright Playground validation, GitHub Actions, npm Trusted Publishing with provenance.

## Global Constraints

- Target release is exactly `ua-info@2.1.0`.
- Node.js support remains `>=18`; CI remains Node.js 18, 20, and 22.
- Public entry points remain `ua-info`, `ua-info/server`, `ua-info/browser`, and `ua-info/package.json`.
- `UAResult`, `ClientKind`, `ContextKind`, and all existing public interfaces remain source compatible with `2.0.x`.
- `parse()` remains synchronous, deterministic, and free of browser-global access.
- No runtime dependency may be added.
- User-Agent and Client Hints remain untrusted claims and must never be described as verified identity.
- Test fixtures and provenance data must not be included in the npm tarball.
- Coverage thresholds for `src/v2/**` are statements 90%, lines 90%, functions 90%, and branches 85%.
- Thresholds must not be lowered to pass CI.
- Production detector changes require a failing source-backed or regression fixture first.
- npm publication remains OIDC-only and provenance-enabled.

---

## File Map

### New test infrastructure

- `src/v2/__tests__/fixtures/fixture-types.ts` — fixture and provenance type contracts.
- `src/v2/__tests__/fixtures/provenance.ts` — frozen authoritative source records.
- `src/v2/__tests__/fixtures/browsers.ts` — browser and engine fixtures.
- `src/v2/__tests__/fixtures/clients.ts` — AI agent, crawler, automation, HTTP client, and false-positive fixtures.
- `src/v2/__tests__/fixtures/contexts.ts` — in-app, mini-app, WebView, and embedded fixtures.
- `src/v2/__tests__/fixtures/operating-systems.ts` — OS precedence and normalization fixtures.
- `src/v2/__tests__/fixtures/devices.ts` — device type, vendor, and model fixtures.
- `src/v2/__tests__/fixtures/client-hints.ts` — request-header enrichment fixtures.
- `src/v2/__tests__/fixtures/malformed.ts` — bounded malformed and robustness inputs.
- `src/v2/__tests__/fixtures/index.ts` — canonical fixture exports and combined collection.
- `src/v2/__tests__/fixture-assertions.ts` — shared fixture execution helpers.
- `src/v2/__tests__/fixture-contract.test.ts` — fixture schema, uniqueness, and provenance validation.
- `src/v2/__tests__/precedence.test.ts` — cross-token browser, client, and context precedence.
- `src/v2/__tests__/robustness.test.ts` — malformed input, purity, determinism, and mutation safety.

### Existing production files that may change

- `src/v2/parser/browser.ts` — distinguish explicit Chromium from Chrome and preserve precedence.
- `src/v2/parser/client.ts` — source-backed crawler additions, remove Google-Extended false claim, harden generic bot fallback.
- `src/v2/parser/os.ts` — make iPadOS precedence reachable before generic iOS.
- `src/v2/parser/context.ts` — change only if a source-backed context fixture exposes a concrete defect.
- `src/v2/parser/client-hints.ts` — change only for a failing precedence or malformed-header fixture.
- `src/v2/browser.ts` — change only for a failing browser-adapter contract.

### Verification and release files

- `jest.config.js` — collect production v2 coverage and enforce thresholds.
- `package.json` — add detection scripts and later bump to `2.1.0`.
- `.github/workflows/ci.yml` — add a Node.js 22 detection-coverage job.
- `scripts/verify-package-identity.mjs` — update the frozen package version at release cut.
- `apps/playground/src/samples/automation-samples.ts` — align explanatory samples with shipped detection behavior.
- `apps/playground/src/samples/samples.test.ts` — verify new sample IDs and categories.
- `README.md` — update coverage, limitations, and verification language.
- `docs/v2-design.md` — add v2.1 accuracy and provenance addendum.
- `CHANGELOG.md` — record release changes and corrections.

---

### Task 1: Fixture Contracts and Provenance Validation

**Files:**
- Create: `src/v2/__tests__/fixtures/fixture-types.ts`
- Create: `src/v2/__tests__/fixtures/provenance.ts`
- Create: `src/v2/__tests__/fixtures/index.ts`
- Create: `src/v2/__tests__/fixture-contract.test.ts`

**Interfaces:**
- Produces: `FixtureSourceKind`, `FixtureSource`, `DetectionFixture`, `RequestFixture`, `DeepPartial<T>`, `PROVENANCE`, and `ALL_DETECTION_FIXTURES`.
- Consumes: public `UAResult` and `HeaderRecord` types only.

- [ ] **Step 1: Write the failing fixture-contract test**

Create `src/v2/__tests__/fixture-contract.test.ts`:

```ts
import { ALL_DETECTION_FIXTURES, PROVENANCE } from './fixtures';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const FIXTURE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function assertHttpsReference(reference: string): void {
    expect(() => new URL(reference)).not.toThrow();
    expect(reference.startsWith('https://')).toBe(true);
}

describe('v2 detection fixture contract', () => {
    it('uses globally unique stable fixture ids', () => {
        const ids = ALL_DETECTION_FIXTURES.map((fixture) => fixture.id);
        expect(new Set(ids).size).toBe(ids.length);
        for (const id of ids) expect(id).toMatch(FIXTURE_ID);
    });

    it('provides complete provenance for every fixture', () => {
        for (const fixture of ALL_DETECTION_FIXTURES) {
            expect(fixture.source.authority.trim()).not.toBe('');
            expect(fixture.source.reference.trim()).not.toBe('');
            expect(fixture.source.observedAt).toMatch(ISO_DATE);
            if (fixture.source.kind === 'official-doc') {
                assertHttpsReference(fixture.source.reference);
            }
        }
    });

    it('defines the frozen authoritative source registry', () => {
        expect(PROVENANCE.openAiPublishers.reference).toContain('help.openai.com');
        expect(PROVENANCE.googleCommonCrawlers.reference).toContain('developers.google.com');
        expect(PROVENANCE.perplexityCrawlers.reference).toContain('docs.perplexity.ai');
    });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npx jest src/v2/__tests__/fixture-contract.test.ts --runInBand
```

Expected: FAIL with module resolution errors for `./fixtures` because the fixture modules do not exist yet.

- [ ] **Step 3: Create the fixture type contracts**

Create `src/v2/__tests__/fixtures/fixture-types.ts`:

```ts
import type { HeaderRecord } from '../../parser/client-hints';
import type { UAResult } from '../../types';

export type DeepPartial<T> = {
    readonly [K in keyof T]?: T[K] extends readonly unknown[]
        ? T[K]
        : T[K] extends object
          ? DeepPartial<T[K]>
          : T[K];
};

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

- [ ] **Step 4: Create the authoritative provenance registry**

Create `src/v2/__tests__/fixtures/provenance.ts`:

```ts
import type { FixtureSource } from './fixture-types';

function official(authority: string, reference: string, notes: string): FixtureSource {
    return Object.freeze({
        kind: 'official-doc',
        authority,
        reference,
        observedAt: '2026-07-24',
        notes,
    });
}

export const PROVENANCE = Object.freeze({
    openAiPublishers: official(
        'OpenAI',
        'https://help.openai.com/en/articles/12627856-publishers-and-developers-faq',
        'Purpose separation for OAI-SearchBot and GPTBot.',
    ),
    openAiAdvertisers: official(
        'OpenAI',
        'https://help.openai.com/en/articles/20001243-advertiser-guidance-for-allowing-openai-web-crawlers',
        'OAI-AdsBot and OAI-SearchBot allowlisting guidance.',
    ),
    googleBot: official(
        'Google',
        'https://developers.google.com/search/docs/crawling-indexing/googlebot',
        'Googlebot desktop/mobile semantics and spoofing warning.',
    ),
    googleCommonCrawlers: official(
        'Google',
        'https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers',
        'HTTP User-Agent forms and Google-Extended control-token semantics.',
    ),
    perplexityCrawlers: official(
        'Perplexity',
        'https://docs.perplexity.ai/docs/resources/perplexity-crawlers',
        'PerplexityBot and Perplexity-User purpose separation.',
    ),
});
```

- [ ] **Step 5: Create the initial fixture barrel**

Create `src/v2/__tests__/fixtures/index.ts`:

```ts
import type { DetectionFixture } from './fixture-types';

export const ALL_DETECTION_FIXTURES: readonly DetectionFixture[] = Object.freeze([]);

export { PROVENANCE } from './provenance';
export type {
    DeepPartial,
    DetectionFixture,
    FixtureSource,
    FixtureSourceKind,
    RequestFixture,
} from './fixture-types';
```

- [ ] **Step 6: Run the focused test and verify GREEN**

Run:

```bash
npx jest src/v2/__tests__/fixture-contract.test.ts --runInBand
```

Expected: PASS, 3 tests.

- [ ] **Step 7: Run lint and commit**

Run:

```bash
npm run lint
git add src/v2/__tests__/fixtures src/v2/__tests__/fixture-contract.test.ts
git commit -m "test: add detection fixture contracts"
```

Expected: ESLint passes and the commit contains test-only files.

---

### Task 2: Browser and Engine Precedence Corpus

**Files:**
- Create: `src/v2/__tests__/fixture-assertions.ts`
- Create: `src/v2/__tests__/fixtures/browsers.ts`
- Create: `src/v2/__tests__/precedence.test.ts`
- Modify: `src/v2/__tests__/fixtures/index.ts`
- Modify: `src/v2/parser/browser.ts:186-213`

**Interfaces:**
- Produces: `assertDetectionFixture(fixture: DetectionFixture): void` and `BROWSER_FIXTURES`.
- Consumes: `parse(userAgent)`, `BrowserId`, `BrowserFamily`, and `EngineId`.

- [ ] **Step 1: Create the fixture assertion helper**

Create `src/v2/__tests__/fixture-assertions.ts`:

```ts
import { parse } from '../index';
import type { DetectionFixture } from './fixtures';

export function assertDetectionFixture(fixture: DetectionFixture): void {
    expect(parse(fixture.userAgent)).toMatchObject(fixture.expected);
}
```

- [ ] **Step 2: Write browser fixtures including the Chromium regression**

Create `src/v2/__tests__/fixtures/browsers.ts`:

```ts
import { BrowserFamily, BrowserId, EngineId } from '../../constants';
import type { DetectionFixture } from './fixture-types';

const captured = (reference: string, notes: string) => ({
    kind: 'captured' as const,
    authority: 'ua-info fixture corpus',
    reference,
    observedAt: '2026-07-24',
    notes,
});

const regression = (reference: string, notes: string) => ({
    kind: 'regression' as const,
    authority: 'ua-info regression suite',
    reference,
    observedAt: '2026-07-24',
    notes,
});

const CHROME_BASE =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';

export const BROWSER_FIXTURES: readonly DetectionFixture[] = Object.freeze([
    {
        id: 'chrome-windows-blink',
        userAgent: CHROME_BASE,
        expected: {
            browser: { id: BrowserId.Chrome, family: BrowserFamily.Chromium, mode: 'browser' },
            engine: { id: EngineId.Blink },
        },
        source: captured('repo://src/v2/__tests__/fixtures/browsers.ts#chrome-windows-blink', 'Canonical Chrome baseline.'),
    },
    {
        id: 'chromium-linux-not-chrome',
        userAgent:
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ' +
            '(KHTML, like Gecko) Chromium/150.0.0.0 Safari/537.36',
        expected: {
            browser: { id: BrowserId.Chromium, family: BrowserFamily.Chromium, mode: 'browser' },
            engine: { id: EngineId.Blink },
        },
        source: regression('repo://src/v2/parser/browser.ts', 'Explicit Chromium token must not become Chrome.'),
    },
    {
        id: 'edge-beats-chrome',
        userAgent: `${CHROME_BASE} Edg/150.0.0.0`,
        expected: { browser: { id: BrowserId.Edge }, engine: { id: EngineId.Blink } },
        source: regression('repo://src/v2/parser/browser.ts#derivative-precedence', 'Edge token wins over shared Chrome token.'),
    },
    {
        id: 'samsung-internet-beats-chrome',
        userAgent: `${CHROME_BASE} SamsungBrowser/29.0`,
        expected: { browser: { id: BrowserId.SamsungInternet }, engine: { id: EngineId.Blink } },
        source: regression('repo://src/v2/parser/browser.ts#derivative-precedence', 'Samsung Internet token wins over Chrome.'),
    },
    {
        id: 'headless-chrome-mode',
        userAgent:
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ' +
            '(KHTML, like Gecko) HeadlessChrome/150.0.0.0 Safari/537.36',
        expected: { browser: { id: BrowserId.Chrome, mode: 'headless' }, engine: { id: EngineId.Blink } },
        source: regression('repo://src/v2/parser/browser.ts#headless', 'Headless token wins over generic Chrome handling.'),
    },
    {
        id: 'chrome-ios-product-webkit-engine',
        userAgent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) ' +
            'AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/150.0.0.0 Mobile/15E148 Safari/604.1',
        expected: { browser: { id: BrowserId.Chrome }, engine: { id: EngineId.WebKit } },
        source: regression('repo://src/v2/parser/browser.ts#ios-engine', 'iOS product identity is separate from WebKit engine identity.'),
    },
]);
```

- [ ] **Step 3: Write the browser fixture execution test**

Create `src/v2/__tests__/precedence.test.ts`:

```ts
import { assertDetectionFixture } from './fixture-assertions';
import { BROWSER_FIXTURES } from './fixtures/browsers';

describe('v2 detector precedence', () => {
    it.each(BROWSER_FIXTURES)('$id', (fixture) => {
        assertDetectionFixture(fixture);
    });
});
```

- [ ] **Step 4: Export fixtures and verify RED**

Replace `src/v2/__tests__/fixtures/index.ts` with:

```ts
import { BROWSER_FIXTURES } from './browsers';
import type { DetectionFixture } from './fixture-types';

export const ALL_DETECTION_FIXTURES: readonly DetectionFixture[] = Object.freeze([
    ...BROWSER_FIXTURES,
]);

export { BROWSER_FIXTURES } from './browsers';
export { PROVENANCE } from './provenance';
export type {
    DeepPartial,
    DetectionFixture,
    FixtureSource,
    FixtureSourceKind,
    RequestFixture,
} from './fixture-types';
```

Run:

```bash
npx jest src/v2/__tests__/precedence.test.ts src/v2/__tests__/fixture-contract.test.ts --runInBand
```

Expected: FAIL because `Chromium/150.0.0.0` is reported as `chrome`.

- [ ] **Step 5: Distinguish Chromium before Chrome**

In `src/v2/parser/browser.ts`, replace the combined Chrome/Chromium block with:

```ts
    const chromium = /\bChromium\/([0-9]+(?:\.[0-9]+)*)/i.exec(userAgent);
    if (chromium?.[1]) {
        return createDetection(
            {
                regex: /$^/,
                id: BrowserId.Chromium,
                name: 'Chromium',
                family: BrowserFamily.Chromium,
                engine: 'blink',
            },
            chromium[1],
            isAndroidWebView(userAgent) ? 'webview' : 'browser',
        );
    }

    const chrome = /\bChrome\/([0-9]+(?:\.[0-9]+)*)/i.exec(userAgent);
    if (chrome?.[1]) {
        return createDetection(
            {
                regex: /$^/,
                id: BrowserId.Chrome,
                name: 'Chrome',
                family: BrowserFamily.Chromium,
                engine: 'blink',
            },
            chrome[1],
            isAndroidWebView(userAgent) ? 'webview' : 'browser',
        );
    }
```

Keep the derivative, Firefox, and iOS product blocks before these blocks.

- [ ] **Step 6: Run focused and full tests**

Run:

```bash
npx jest src/v2/__tests__/precedence.test.ts src/v2/__tests__/parse.test.ts --runInBand
npm test
```

Expected: focused tests pass and the existing complete Jest suite passes.

- [ ] **Step 7: Commit**

```bash
git add src/v2/parser/browser.ts src/v2/__tests__
git commit -m "fix: distinguish Chromium browser identity"
```

---

### Task 3: Source-Backed Client Catalog and False-Positive Corrections

**Files:**
- Create: `src/v2/__tests__/fixtures/clients.ts`
- Modify: `src/v2/__tests__/fixtures/index.ts`
- Modify: `src/v2/__tests__/precedence.test.ts`
- Modify: `src/v2/parser/client.ts:13-65`

**Interfaces:**
- Produces: `CLIENT_FIXTURES`.
- Preserves: one selected `ClientInfo | null` and existing `ClientKind` values.

- [ ] **Step 1: Add client fixtures**

Create `src/v2/__tests__/fixtures/clients.ts`:

```ts
import type { DetectionFixture } from './fixture-types';
import { PROVENANCE } from './provenance';

const regression = (id: string, notes: string) => ({
    kind: 'regression' as const,
    authority: 'ua-info regression suite',
    reference: `repo://src/v2/__tests__/fixtures/clients.ts#${id}`,
    observedAt: '2026-07-24',
    notes,
});

export const CLIENT_FIXTURES: readonly DetectionFixture[] = Object.freeze([
    {
        id: 'openai-searchbot-crawler',
        userAgent: 'OAI-SearchBot/1.0',
        expected: { client: { kind: 'crawler', id: 'oai-searchbot', name: 'OAI-SearchBot' } },
        source: PROVENANCE.openAiPublishers,
    },
    {
        id: 'openai-gptbot-ai-agent',
        userAgent: 'GPTBot/1.2',
        expected: { client: { kind: 'ai-agent', id: 'gptbot', name: 'GPTBot' } },
        source: PROVENANCE.openAiPublishers,
    },
    {
        id: 'openai-adsbot-crawler',
        userAgent: 'OAI-AdsBot/1.0',
        expected: { client: { kind: 'crawler', id: 'oai-adsbot', name: 'OAI-AdsBot' } },
        source: PROVENANCE.openAiAdvertisers,
    },
    {
        id: 'googlebot-smartphone-crawler',
        userAgent:
            'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) ' +
            'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36 ' +
            '(compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        expected: { client: { kind: 'crawler', id: 'googlebot', version: { raw: '2.1' } } },
        source: PROVENANCE.googleCommonCrawlers,
    },
    {
        id: 'googlebot-image-crawler',
        userAgent: 'Googlebot-Image/1.0',
        expected: { client: { kind: 'crawler', id: 'googlebot-image', name: 'Googlebot Image' } },
        source: PROVENANCE.googleCommonCrawlers,
    },
    {
        id: 'googlebot-video-crawler',
        userAgent: 'Googlebot-Video/1.0',
        expected: { client: { kind: 'crawler', id: 'googlebot-video', name: 'Googlebot Video' } },
        source: PROVENANCE.googleCommonCrawlers,
    },
    {
        id: 'google-extended-is-not-http-user-agent',
        userAgent: 'Google-Extended',
        expected: { client: null },
        source: PROVENANCE.googleCommonCrawlers,
    },
    {
        id: 'perplexity-user-not-perplexitybot',
        userAgent: 'Perplexity-User/1.0',
        expected: { client: null },
        source: PROVENANCE.perplexityCrawlers,
    },
    {
        id: 'explicit-crawler-beats-generic-bot',
        userAgent: 'AhrefsBot/7.0',
        expected: { client: { kind: 'crawler', id: 'ahrefsbot' } },
        source: regression('explicit-crawler-beats-generic-bot', 'Explicit catalog entries win over the generic bot fallback.'),
    },
    {
        id: 'robotics-word-is-not-generic-bot',
        userAgent: 'RoboticsResearchClient/1.0',
        expected: { client: null },
        source: regression('robotics-word-is-not-generic-bot', 'The generic fallback requires a complete bot-like token.'),
    },
]);
```

- [ ] **Step 2: Add client fixtures to the combined corpus and precedence suite**

Update `src/v2/__tests__/fixtures/index.ts`:

```ts
import { BROWSER_FIXTURES } from './browsers';
import { CLIENT_FIXTURES } from './clients';
import type { DetectionFixture } from './fixture-types';

export const ALL_DETECTION_FIXTURES: readonly DetectionFixture[] = Object.freeze([
    ...BROWSER_FIXTURES,
    ...CLIENT_FIXTURES,
]);

export { BROWSER_FIXTURES } from './browsers';
export { CLIENT_FIXTURES } from './clients';
export { PROVENANCE } from './provenance';
export type {
    DeepPartial,
    DetectionFixture,
    FixtureSource,
    FixtureSourceKind,
    RequestFixture,
} from './fixture-types';
```

Update `src/v2/__tests__/precedence.test.ts`:

```ts
import { assertDetectionFixture } from './fixture-assertions';
import { BROWSER_FIXTURES, CLIENT_FIXTURES } from './fixtures';

const FIXTURES = [...BROWSER_FIXTURES, ...CLIENT_FIXTURES];

describe('v2 detector precedence', () => {
    it.each(FIXTURES)('$id', (fixture) => {
        assertDetectionFixture(fixture);
    });
});
```

- [ ] **Step 3: Run the focused suite and verify RED**

Run:

```bash
npx jest src/v2/__tests__/precedence.test.ts --runInBand
```

Expected failures:

- `OAI-SearchBot` is not explicitly classified.
- `OAI-AdsBot` is not explicitly classified.
- Googlebot Image and Video are not distinct crawler identities.
- `Google-Extended` is incorrectly classified as an AI agent.
- `RoboticsResearchClient` is incorrectly matched by the generic fallback if the fallback stops at an internal `bot` substring.

- [ ] **Step 4: Replace the client catalog with source-backed ordering**

In `src/v2/parser/client.ts`, define the beginning of `CLIENT_PATTERNS` as:

```ts
const CLIENT_PATTERNS: readonly ClientPattern[] = [
    { regex: /\bGPTBot\/([0-9.]+)/i, kind: 'ai-agent', id: 'gptbot', name: 'GPTBot' },
    { regex: /\bClaudeBot(?:\/([0-9.]+))?/i, kind: 'ai-agent', id: 'claudebot', name: 'ClaudeBot' },
    { regex: /\bPerplexityBot(?:\/([0-9.]+))?/i, kind: 'ai-agent', id: 'perplexitybot', name: 'PerplexityBot' },
    { regex: /\bOAI-SearchBot(?:\/([0-9.]+))?/i, kind: 'crawler', id: 'oai-searchbot', name: 'OAI-SearchBot' },
    { regex: /\bOAI-AdsBot(?:\/([0-9.]+))?/i, kind: 'crawler', id: 'oai-adsbot', name: 'OAI-AdsBot' },
    { regex: /\bGooglebot-Image\/([0-9.]+)/i, kind: 'crawler', id: 'googlebot-image', name: 'Googlebot Image' },
    { regex: /\bGooglebot-Video\/([0-9.]+)/i, kind: 'crawler', id: 'googlebot-video', name: 'Googlebot Video' },
    { regex: /\bGooglebot(?:\/[a-z-]+)?\/([0-9.]+)/i, kind: 'crawler', id: 'googlebot', name: 'Googlebot' },
    { regex: /\bCCBot\/([0-9.]+)/i, kind: 'crawler', id: 'ccbot', name: 'CCBot' },
    { regex: /\bbingbot\/([0-9.]+)/i, kind: 'crawler', id: 'bingbot', name: 'Bingbot' },
    { regex: /\bAhrefsBot\/([0-9.]+)/i, kind: 'crawler', id: 'ahrefsbot', name: 'AhrefsBot' },
    { regex: /\bSemrushBot\/([0-9.]+)/i, kind: 'crawler', id: 'semrushbot', name: 'SemrushBot' },
    { regex: /\bApplebot\/([0-9.]+)/i, kind: 'crawler', id: 'applebot', name: 'Applebot' },
```

Retain the existing automation, HTTP-client, library, email-client, and media-player entries after these entries. Delete the `Google-Extended` entry.

- [ ] **Step 5: Harden the generic bot boundary**

Replace `genericBot()` with:

```ts
function genericBot(userAgent: string): ClientInfo | null {
    const match = /\b([a-z0-9._-]*(?:bot|spider|crawler))\b(?:[/ ]?([0-9.]+))?/i.exec(userAgent);
    if (!match?.[1]) return null;

    return {
        kind: 'bot',
        id: match[1].toLowerCase(),
        name: match[1],
        version: match[2] ? parseVersion(match[2]) : null,
    };
}
```

- [ ] **Step 6: Run focused and complete verification**

Run:

```bash
npx jest src/v2/__tests__/precedence.test.ts src/v2/__tests__/parse.test.ts --runInBand
npm test
npm run lint
```

Expected: all tests and lint pass.

- [ ] **Step 7: Commit**

```bash
git add src/v2/parser/client.ts src/v2/__tests__
git commit -m "fix: harden source-backed client detection"
```

---

### Task 4: Context and WebView Collision Matrix

**Files:**
- Create: `src/v2/__tests__/fixtures/contexts.ts`
- Create: `src/v2/__tests__/context-coverage.test.ts`
- Modify: `src/v2/__tests__/fixtures/index.ts`
- Modify only on proven failure: `src/v2/parser/context.ts`
- Modify only on proven failure: `src/v2/parse.ts`

**Interfaces:**
- Produces: `CONTEXT_FIXTURES`.
- Preserves: browser product identity, context host identity, and headless-mode precedence.

- [ ] **Step 1: Create context fixtures**

Create `src/v2/__tests__/fixtures/contexts.ts` with these exact baseline entries:

```ts
import { BrowserId } from '../../constants';
import type { DetectionFixture } from './fixture-types';

const source = (id: string, notes: string) => ({
    kind: 'regression' as const,
    authority: 'ua-info application-context regression suite',
    reference: `repo://src/v2/__tests__/fixtures/contexts.ts#${id}`,
    observedAt: '2026-07-24',
    notes,
});

const ANDROID_WEBVIEW =
    'Mozilla/5.0 (Linux; Android 16; Pixel 10 Pro Build/BP2A.260705.008; wv) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/150.0.0.0 Mobile Safari/537.36';

export const CONTEXT_FIXTURES: readonly DetectionFixture[] = Object.freeze([
    {
        id: 'line-liff-mini-app',
        userAgent: `${ANDROID_WEBVIEW} Line/26.11.0 LIFF`,
        expected: {
            browser: { id: BrowserId.Chrome, mode: 'webview' },
            client: null,
            context: { kind: 'mini-app', id: 'liff', host: { id: 'line', version: { raw: '26.11.0' } } },
        },
        source: source('line-liff-mini-app', 'LIFF remains separate from browser identity.'),
    },
    {
        id: 'line-in-app-without-liff',
        userAgent: `${ANDROID_WEBVIEW} Line/26.11.0`,
        expected: {
            browser: { id: BrowserId.Chrome, mode: 'webview' },
            context: { kind: 'in-app-browser', id: 'line-in-app', host: { id: 'line' } },
        },
        source: source('line-in-app-without-liff', 'LINE without the LIFF token is not a mini-app.'),
    },
    {
        id: 'facebook-in-app-preserves-chrome',
        userAgent: `${ANDROID_WEBVIEW} [FBAN/FB4A;FBAV/520.0.0.0.0;]`,
        expected: {
            browser: { id: BrowserId.Chrome, mode: 'webview' },
            context: { kind: 'in-app-browser', id: 'facebook-in-app', host: { id: 'facebook' } },
        },
        source: source('facebook-in-app-preserves-chrome', 'Host application does not replace Chrome WebView.'),
    },
    {
        id: 'electron-embedded-context',
        userAgent: 'ExampleShell/1.0 Electron/33.2.0 Chrome/130.0.0.0 Safari/537.36',
        expected: {
            browser: { id: BrowserId.Chrome, mode: 'embedded' },
            context: { kind: 'embedded', id: 'electron', host: { id: 'electron', version: { raw: '33.2.0' } } },
        },
        source: source('electron-embedded-context', 'Electron changes mode without replacing browser product.'),
    },
    {
        id: 'standalone-android-webview-without-host',
        userAgent: ANDROID_WEBVIEW,
        expected: { browser: { id: BrowserId.Chrome, mode: 'webview' }, context: null },
        source: source('standalone-android-webview-without-host', 'WebView mode does not require an application context.'),
    },
]);
```

- [ ] **Step 2: Add context fixtures to the combined corpus**

Update `src/v2/__tests__/fixtures/index.ts` to import `CONTEXT_FIXTURES`, append them to `ALL_DETECTION_FIXTURES`, and export them.

The resulting collection expression must be:

```ts
export const ALL_DETECTION_FIXTURES: readonly DetectionFixture[] = Object.freeze([
    ...BROWSER_FIXTURES,
    ...CLIENT_FIXTURES,
    ...CONTEXT_FIXTURES,
]);
```

- [ ] **Step 3: Create context coverage test**

Create `src/v2/__tests__/context-coverage.test.ts`:

```ts
import { assertDetectionFixture } from './fixture-assertions';
import { CONTEXT_FIXTURES } from './fixtures';

describe('v2 context and WebView coverage', () => {
    it.each(CONTEXT_FIXTURES)('$id', (fixture) => {
        assertDetectionFixture(fixture);
    });

    it('does not overwrite headless mode with context-derived mode', () => {
        const fixture = {
            ...CONTEXT_FIXTURES[0],
            id: 'headless-mode-precedence',
            userAgent: CONTEXT_FIXTURES[0].userAgent.replace('Chrome/150.0.0.0', 'HeadlessChrome/150.0.0.0'),
            expected: { browser: { mode: 'headless' } },
        };
        assertDetectionFixture(fixture);
    });
});
```

- [ ] **Step 4: Run focused tests**

Run:

```bash
npx jest src/v2/__tests__/context-coverage.test.ts src/v2/__tests__/fixture-contract.test.ts --runInBand
```

Expected: the fixture module initially fails before it is created; after creation, all baseline behaviors should pass. If a behavior fails, change only the relevant ordered branch in `context.ts` or `applyContextMode()` and retain all fixture expectations exactly.

- [ ] **Step 5: Run full tests and commit the coverage matrix**

```bash
npm test
npm run lint
git add src/v2/__tests__ src/v2/parser/context.ts src/v2/parse.ts
git commit -m "test: lock context and WebView precedence"
```

Stage `context.ts` or `parse.ts` only when a proven fixture required a production correction.

---

### Task 5: Operating-System, Device, and CPU Matrix

**Files:**
- Create: `src/v2/__tests__/fixtures/operating-systems.ts`
- Create: `src/v2/__tests__/fixtures/devices.ts`
- Create: `src/v2/__tests__/platform-coverage.test.ts`
- Modify: `src/v2/__tests__/fixtures/index.ts`
- Modify: `src/v2/parser/os.ts:30-47`

**Interfaces:**
- Produces: `OS_FIXTURES`, `DEVICE_FIXTURES`, and platform coverage tests.

- [ ] **Step 1: Create OS fixtures with the iPadOS regression**

Create `src/v2/__tests__/fixtures/operating-systems.ts`:

```ts
import type { DetectionFixture } from './fixture-types';

const source = (id: string, notes: string) => ({
    kind: 'regression' as const,
    authority: 'ua-info platform regression suite',
    reference: `repo://src/v2/__tests__/fixtures/operating-systems.ts#${id}`,
    observedAt: '2026-07-24',
    notes,
});

export const OS_FIXTURES: readonly DetectionFixture[] = Object.freeze([
    {
        id: 'windows-phone-before-windows-nt',
        userAgent: 'Mozilla/5.0 (Windows Phone 10.0; Android 6.0.1; Microsoft; RM-1116) Windows NT 10.0',
        expected: { os: { id: 'windows', name: 'Windows Phone', version: { raw: '10.0' } } },
        source: source('windows-phone-before-windows-nt', 'Windows Phone token wins over Windows NT compatibility token.'),
    },
    {
        id: 'ipad-reports-ipados',
        userAgent:
            'Mozilla/5.0 (iPad; CPU OS 19_0 like Mac OS X) AppleWebKit/605.1.15 ' +
            '(KHTML, like Gecko) Version/19.0 Mobile/15E148 Safari/604.1',
        expected: { os: { id: 'ios', name: 'iPadOS', version: { raw: '19.0' } } },
        source: source('ipad-reports-ipados', 'iPad-specific OS naming must be reachable before generic iOS.'),
    },
    {
        id: 'android-version',
        userAgent: 'Mozilla/5.0 (Linux; Android 16; Pixel 10 Pro) AppleWebKit/537.36 Chrome/150.0.0.0 Mobile Safari/537.36',
        expected: { os: { id: 'android', name: 'Android', version: { raw: '16' } } },
        source: source('android-version', 'Android version parsing baseline.'),
    },
    {
        id: 'chromeos-version',
        userAgent: 'Mozilla/5.0 (X11; CrOS x86_64 16093.68.0) AppleWebKit/537.36 Chrome/150.0.0.0 Safari/537.36',
        expected: { os: { id: 'chromeos', version: { raw: '16093.68.0' } } },
        source: source('chromeos-version', 'ChromeOS version parsing baseline.'),
    },
]);
```

- [ ] **Step 2: Create device and CPU fixtures**

Create `src/v2/__tests__/fixtures/devices.ts`:

```ts
import type { DetectionFixture } from './fixture-types';

const source = (id: string, notes: string) => ({
    kind: 'regression' as const,
    authority: 'ua-info device regression suite',
    reference: `repo://src/v2/__tests__/fixtures/devices.ts#${id}`,
    observedAt: '2026-07-24',
    notes,
});

export const DEVICE_FIXTURES: readonly DetectionFixture[] = Object.freeze([
    {
        id: 'pixel-model-after-locale',
        userAgent:
            'Mozilla/5.0 (Linux; Android 16; en-US; Pixel 10 Pro Build/BP2A.260705.008) ' +
            'AppleWebKit/537.36 Chrome/150.0.0.0 Mobile Safari/537.36',
        expected: {
            device: { type: 'mobile', vendor: 'Google', model: 'Pixel 10 Pro' },
        },
        source: source('pixel-model-after-locale', 'Locale metadata is skipped before model extraction.'),
    },
    {
        id: 'android-tablet-without-mobile-token',
        userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-X910 Build/UP1A.231005.007) AppleWebKit/537.36 Chrome/150.0.0.0 Safari/537.36',
        expected: { device: { type: 'tablet', vendor: 'Samsung', model: 'SM-X910' } },
        source: source('android-tablet-without-mobile-token', 'Android without Mobile is classified as tablet.'),
    },
    {
        id: 'unknown-vendor-remains-null',
        userAgent: 'Mozilla/5.0 (Linux; Android 14; ZX-UNKNOWN Build/UP1A) AppleWebKit/537.36 Chrome/150.0.0.0 Mobile Safari/537.36',
        expected: { device: { type: 'mobile', vendor: null, model: 'ZX-UNKNOWN' } },
        source: source('unknown-vendor-remains-null', 'Vendor inference remains conservative.'),
    },
    {
        id: 'windows-x64-cpu',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150.0.0.0 Safari/537.36',
        expected: { device: { type: 'desktop' }, cpu: { architecture: 'x86_64', bitness: 64 } },
        source: source('windows-x64-cpu', 'Desktop and x64 CPU baseline.'),
    },
    {
        id: 'riscv64-cpu',
        userAgent: 'ExampleClient/1.0 (Linux; riscv64)',
        expected: { cpu: { architecture: 'riscv', bitness: 64 } },
        source: source('riscv64-cpu', 'RISC-V 64 claim baseline.'),
    },
]);
```

- [ ] **Step 3: Add fixtures to the barrel and write platform tests**

Append `OS_FIXTURES` and `DEVICE_FIXTURES` to `ALL_DETECTION_FIXTURES`, export them, and create `src/v2/__tests__/platform-coverage.test.ts`:

```ts
import { assertDetectionFixture } from './fixture-assertions';
import { DEVICE_FIXTURES, OS_FIXTURES } from './fixtures';

const FIXTURES = [...OS_FIXTURES, ...DEVICE_FIXTURES];

describe('v2 operating-system, device, and CPU coverage', () => {
    it.each(FIXTURES)('$id', (fixture) => {
        assertDetectionFixture(fixture);
    });
});
```

- [ ] **Step 4: Run focused tests and verify RED**

Run:

```bash
npx jest src/v2/__tests__/platform-coverage.test.ts --runInBand
```

Expected: FAIL because the generic iOS branch currently captures the iPad fixture before the iPadOS-specific branch.

- [ ] **Step 5: Move iPadOS detection before generic iOS**

In `src/v2/parser/os.ts`, order these branches as:

```ts
    const ipadOS = /\biPad\b.*?(?:CPU )?OS[ _/]([0-9_]+)/i.exec(userAgent);
    if (ipadOS?.[1]) return createOS(OSId.IOS, 'iPadOS', ipadOS[1]);

    const ios = /(?:CPU (?:iPhone )?OS|iPhone OS)[ _/]([0-9_]+)/i.exec(userAgent);
    if (ios?.[1]) return createOS(OSId.IOS, 'iOS', ios[1]);
```

Delete the old later iPadOS branch.

- [ ] **Step 6: Run focused and full verification**

```bash
npx jest src/v2/__tests__/platform-coverage.test.ts src/v2/__tests__/parse.test.ts --runInBand
npm test
npm run lint
```

Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add src/v2/parser/os.ts src/v2/__tests__
git commit -m "fix: harden platform detection coverage"
```

---

### Task 6: Client Hints Precedence and Header Robustness

**Files:**
- Create: `src/v2/__tests__/fixtures/client-hints.ts`
- Create: `src/v2/__tests__/client-hints-coverage.test.ts`
- Modify: `src/v2/parser/client-hints.ts` only for proven fixture failures.

**Interfaces:**
- Produces: `CLIENT_HINT_FIXTURES` and request fixture execution.
- Consumes: `parseRequest({ userAgent, headers })`.

- [ ] **Step 1: Create request fixtures**

Create `src/v2/__tests__/fixtures/client-hints.ts`:

```ts
import type { RequestFixture } from './fixture-types';

const source = (id: string, notes: string) => ({
    kind: 'regression' as const,
    authority: 'ua-info Client Hints regression suite',
    reference: `repo://src/v2/__tests__/fixtures/client-hints.ts#${id}`,
    observedAt: '2026-07-24',
    notes,
});

export const CLIENT_HINT_FIXTURES: readonly RequestFixture[] = Object.freeze([
    {
        id: 'full-version-list-beats-low-entropy-version',
        userAgent: 'Mozilla/5.0 AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        headers: {
            'sec-ch-ua': '"Chromium";v="150", "Google Chrome";v="150", "Not_A Brand";v="99"',
            'sec-ch-ua-full-version-list': '"Chromium";v="150.0.1.2", "Google Chrome";v="150.0.7339.12"',
        },
        expected: { browser: { id: 'chrome', version: { raw: '150.0.7339.12' } } },
        source: source('full-version-list-beats-low-entropy-version', 'Full-version brands take precedence.'),
    },
    {
        id: 'edge-brand-beats-chrome-brand',
        userAgent: '',
        headers: {
            'sec-ch-ua': '"Google Chrome";v="150", "Microsoft Edge";v="150", "Chromium";v="150"',
        },
        expected: { browser: { id: 'edge', version: { raw: '150' } } },
        source: source('edge-brand-beats-chrome-brand', 'Specific Chromium derivative brand wins.'),
    },
    {
        id: 'grease-brand-is-ignored',
        userAgent: '',
        headers: { 'sec-ch-ua': '"Not_A Brand";v="99"' },
        expected: { browser: null },
        source: source('grease-brand-is-ignored', 'GREASE brand does not establish identity.'),
    },
    {
        id: 'mobile-false-does-not-demote-tablet',
        userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-X910) AppleWebKit/537.36 Chrome/150.0.0.0 Safari/537.36',
        headers: { 'sec-ch-ua-mobile': '?0' },
        expected: { device: { type: 'tablet' } },
        source: source('mobile-false-does-not-demote-tablet', 'A false mobile hint preserves known nonmobile type.'),
    },
    {
        id: 'unknown-platform-preserves-user-agent-os',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        headers: { 'sec-ch-ua-platform': '"ExampleOS"' },
        expected: { os: { id: 'windows', version: { raw: '10' } } },
        source: source('unknown-platform-preserves-user-agent-os', 'Unknown platform hints do not erase parsed OS.'),
    },
    {
        id: 'malformed-brand-fragment-keeps-valid-brand',
        userAgent: '',
        headers: { 'sec-ch-ua': 'garbage, "Google Chrome";v="150", broken' },
        expected: { browser: { id: 'chrome', version: { raw: '150' } } },
        source: source('malformed-brand-fragment-keeps-valid-brand', 'Valid fragments survive malformed siblings.'),
    },
]);
```

- [ ] **Step 2: Write the request fixture runner**

Create `src/v2/__tests__/client-hints-coverage.test.ts`:

```ts
import { parseRequest } from '../server';
import { CLIENT_HINT_FIXTURES } from './fixtures/client-hints';

describe('v2 Client Hints coverage', () => {
    it.each(CLIENT_HINT_FIXTURES)('$id', (fixture) => {
        expect(parseRequest({ userAgent: fixture.userAgent, headers: fixture.headers })).toMatchObject(fixture.expected);
    });

    it('does not mutate a record-backed header source', () => {
        const headers = Object.freeze({ 'Sec-CH-UA-Mobile': '?1' });
        parseRequest({ userAgent: '', headers });
        expect(headers).toEqual({ 'Sec-CH-UA-Mobile': '?1' });
    });

    it('reads a null-prototype record without prototype mutation', () => {
        const headers = Object.create(null) as Record<string, string>;
        headers['__proto__'] = 'ignored';
        headers['sec-ch-ua-platform'] = '"Linux"';
        expect(parseRequest({ userAgent: '', headers }).os?.id).toBe('linux');
        expect(Object.getPrototypeOf(headers)).toBeNull();
    });
});
```

- [ ] **Step 3: Run focused tests**

```bash
npx jest src/v2/__tests__/client-hints-coverage.test.ts src/v2/__tests__/adapters.test.ts --runInBand
```

Expected: baseline should pass after the fixture module exists. Any failure must be corrected in the narrow helper responsible for that field; do not alter public types.

- [ ] **Step 4: Apply only evidence-driven production corrections**

When a fixture fails, preserve these exact helper contracts in `src/v2/parser/client-hints.ts`:

```ts
function selectBrowser(brands: readonly BrandVersion[], current: BrowserInfo | null): BrowserInfo | null;
function platformOS(platform: string | null, version: string | null, current: OSInfo | null): OSInfo | null;
function clientHintCPU(architecture: string | null, bitnessRaw: string | null, current: CPUInfo | null): CPUInfo | null;
```

Do not export them and do not add a runtime dependency.

- [ ] **Step 5: Run full tests and commit**

```bash
npm test
npm run lint
git add src/v2/__tests__/fixtures/client-hints.ts src/v2/__tests__/client-hints-coverage.test.ts src/v2/parser/client-hints.ts
git commit -m "test: lock Client Hints precedence"
```

Stage `client-hints.ts` only when a fixture proves a production defect.

---

### Task 7: Browser Adapter and Global Robustness Contracts

**Files:**
- Create: `src/v2/__tests__/fixtures/malformed.ts`
- Create: `src/v2/__tests__/robustness.test.ts`
- Modify: `src/v2/__tests__/adapters.test.ts`
- Modify: `src/v2/browser.ts` only for a proven adapter failure.

**Interfaces:**
- Produces: `MALFORMED_FIXTURES`.
- Preserves: explicit failure from rejected high-entropy collection and runtime-only PWA handling.

- [ ] **Step 1: Create bounded malformed fixtures**

Create `src/v2/__tests__/fixtures/malformed.ts`:

```ts
import type { DetectionFixture } from './fixture-types';

const source = (id: string, notes: string) => ({
    kind: 'regression' as const,
    authority: 'ua-info robustness suite',
    reference: `repo://src/v2/__tests__/fixtures/malformed.ts#${id}`,
    observedAt: '2026-07-24',
    notes,
});

export const MALFORMED_FIXTURES: readonly DetectionFixture[] = Object.freeze([
    { id: 'empty-user-agent', userAgent: '', expected: { ua: '', browser: null, client: null }, source: source('empty-user-agent', 'Empty claim is deterministic.') },
    { id: 'whitespace-user-agent', userAgent: '   ', expected: { ua: '   ', browser: null, client: null }, source: source('whitespace-user-agent', 'Whitespace is preserved and not invented into identity.') },
    { id: 'unicode-user-agent', userAgent: 'ตัวอย่าง/1.0 🚀', expected: { browser: null, client: null }, source: source('unicode-user-agent', 'Unicode input does not throw.') },
    { id: 'control-character-user-agent', userAgent: 'Example/1.0\u0000\u001f', expected: { browser: null }, source: source('control-character-user-agent', 'Control characters do not throw.') },
    { id: 'truncated-chrome-token', userAgent: 'Chrome/', expected: { browser: null }, source: source('truncated-chrome-token', 'Missing version is not a browser claim.') },
    { id: 'bounded-64k-user-agent', userAgent: `ExampleClient/${'x'.repeat(64 * 1024)}`, expected: { browser: null }, source: source('bounded-64k-user-agent', 'Bounded long input regression.') },
]);
```

- [ ] **Step 2: Create robustness tests**

Create `src/v2/__tests__/robustness.test.ts`:

```ts
import { parse } from '../index';
import { MALFORMED_FIXTURES } from './fixtures/malformed';

describe('v2 parser robustness', () => {
    it.each(MALFORMED_FIXTURES)('$id', (fixture) => {
        expect(() => parse(fixture.userAgent)).not.toThrow();
        expect(parse(fixture.userAgent)).toMatchObject(fixture.expected);
    });

    it('is deterministic and returns independent objects', () => {
        const userAgent = 'Mozilla/5.0 Chrome/150.0.0.0 Safari/537.36';
        const first = parse(userAgent);
        const second = parse(userAgent);
        expect(first).toEqual(second);
        expect(first).not.toBe(second);
        expect(first.browser).not.toBe(second.browser);
    });

    it('does not mutate the User-Agent value', () => {
        const userAgent = '  ExampleClient/1.0  ';
        expect(parse(userAgent).ua).toBe(userAgent);
    });
});
```

- [ ] **Step 3: Add browser-adapter rejection and PWA precedence tests**

Append to `src/v2/__tests__/adapters.test.ts`:

```ts
it('propagates high-entropy collection failures', async () => {
    Object.defineProperty(globalThis, 'navigator', {
        configurable: true,
        value: {
            userAgent: 'Mozilla/5.0 Chrome/150.0.0.0 Safari/537.36',
            userAgentData: {
                brands: [{ brand: 'Google Chrome', version: '150' }],
                mobile: false,
                platform: 'Windows',
                getHighEntropyValues: async () => {
                    throw new Error('permission denied');
                },
            },
        },
    });

    await expect(detectCurrent()).rejects.toThrow('permission denied');
});

it('keeps an existing host context instead of replacing it with PWA context', async () => {
    Object.defineProperty(globalThis, 'navigator', {
        configurable: true,
        value: {
            userAgent: 'Mozilla/5.0 Chrome/150.0.0.0 Safari/537.36 Line/26.11.0 LIFF',
            standalone: true,
        },
    });

    await expect(detectCurrent()).resolves.toMatchObject({
        context: { id: 'liff', host: { id: 'line' } },
    });
});
```

Use the existing test file's navigator restoration helpers rather than duplicating teardown logic when those helpers are already present.

- [ ] **Step 4: Run focused tests**

```bash
npx jest src/v2/__tests__/robustness.test.ts src/v2/__tests__/adapters.test.ts --runInBand
```

Expected: all tests pass with current explicit rejection and context precedence. Apply a production change only if the focused test proves otherwise.

- [ ] **Step 5: Run full tests and commit**

```bash
npm test
npm run lint
git add src/v2/__tests__ src/v2/browser.ts
git commit -m "test: add parser robustness contracts"
```

Stage `browser.ts` only when required.

---

### Task 8: Coverage Thresholds and CI Detection Gate

**Files:**
- Modify: `jest.config.js`
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Produces root scripts `fixture:check`, `test:coverage`, and `detection:check`.

- [ ] **Step 1: Run baseline coverage before enforcing thresholds**

Run:

```bash
npx jest --coverage --runInBand
```

Record statements, branches, functions, and lines for `src/v2/**` in the implementation log. Do not adjust the approved thresholds based on the baseline.

- [ ] **Step 2: Configure v2 production coverage**

Replace `jest.config.js` with:

```js
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      diagnostics: true,
    }],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/v2/**/*.ts',
    '!src/v2/**/__tests__/**',
    '!src/v2/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      statements: 90,
      lines: 90,
      functions: 90,
      branches: 85,
    },
  },
};
```

- [ ] **Step 3: Add root detection scripts and integrate the release check**

In `package.json`, set scripts to include:

```json
{
  "test": "jest --verbose",
  "fixture:check": "jest src/v2/__tests__/fixture-contract.test.ts --runInBand",
  "test:coverage": "jest --coverage --runInBand",
  "detection:check": "npm run fixture:check && npm run test:coverage",
  "check": "npm run identity:check && npm run lint && npm run detection:check && npm run build && npm run pack:check"
}
```

Retain all existing unrelated scripts unchanged.

- [ ] **Step 4: Run the gate and fill real coverage gaps**

Run:

```bash
npm run detection:check
```

Expected: PASS at statements 90%, lines 90%, functions 90%, and branches 85% or higher.

When a threshold fails, add focused tests to the relevant detector test file. Do not lower a threshold and do not exclude a production detector merely because it is under-tested.

- [ ] **Step 5: Add a Node.js 22 CI job**

Append to `.github/workflows/ci.yml`:

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
      - name: Upload detector coverage
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: detector-coverage
          path: coverage
          if-no-files-found: ignore
```

Keep the existing Node.js 18/20/22 package matrix and Playground job unchanged.

- [ ] **Step 6: Run the complete local release gate**

```bash
npm run check
```

Expected: identity, lint, fixture validation, coverage, ESM/CJS build, package verification, and packed consumers pass.

- [ ] **Step 7: Commit**

```bash
git add jest.config.js package.json .github/workflows/ci.yml src/v2/__tests__
git commit -m "ci: enforce detector coverage thresholds"
```

---

### Task 9: Playground Sample Alignment

**Files:**
- Modify: `apps/playground/src/samples/automation-samples.ts`
- Modify: `apps/playground/src/samples/samples.test.ts`

**Interfaces:**
- Consumes only the packed public package.
- Produces explanatory samples for shipped v2.1 behavior.

- [ ] **Step 1: Write failing sample expectations**

Add to `apps/playground/src/samples/samples.test.ts`:

```ts
it('includes source-backed v2.1 crawler and negative-control samples', () => {
  const ids = USER_AGENT_SAMPLES.map((sample) => sample.id);
  expect(ids).toEqual(expect.arrayContaining([
    'oai-searchbot',
    'googlebot-image',
    'google-extended-control-token',
  ]));
});
```

Use the file's existing aggregate export name if it differs from `USER_AGENT_SAMPLES`.

- [ ] **Step 2: Run the Playground sample test and verify RED**

```bash
npm run playground:setup
npm run test --prefix apps/playground -- samples.test.ts
```

Expected: FAIL because the three sample IDs are absent.

- [ ] **Step 3: Add the samples**

Append to `AUTOMATION_SAMPLES` in `apps/playground/src/samples/automation-samples.ts`:

```ts
  {
    id: 'oai-searchbot',
    label: 'OpenAI OAI-SearchBot',
    category: 'Automation and bots',
    userAgent: 'OAI-SearchBot/1.0',
  },
  {
    id: 'googlebot-image',
    label: 'Googlebot Image',
    category: 'Automation and bots',
    userAgent: 'Googlebot-Image/1.0',
  },
  {
    id: 'google-extended-control-token',
    label: 'Google-Extended control token',
    category: 'Unknown or malformed',
    userAgent: 'Google-Extended',
  },
```

The label must not describe Google-Extended as a crawler User-Agent.

- [ ] **Step 4: Run the complete Playground gate**

```bash
npm run playground:check
```

Expected: packed consumer setup, boundaries, type-check, Vitest, Vite production build, and Chromium smoke pass.

- [ ] **Step 5: Commit**

```bash
git add apps/playground/src/samples
git commit -m "docs: align playground detection samples"
```

---

### Task 10: Documentation and Changelog

**Files:**
- Create: `CHANGELOG.md`
- Modify: `README.md`
- Modify: `docs/v2-design.md`

**Interfaces:**
- Documents the shipped claim-based behavior and its limitations.

- [ ] **Step 1: Create the changelog with an unreleased v2.1 section**

Create `CHANGELOG.md`:

```md
# Changelog

All notable changes to this project are documented in this file.

The format follows Keep a Changelog, and this project uses Semantic Versioning.

## [Unreleased]

## [2.1.0] - 2026-07-24

### Added

- Source-backed detection fixtures with automated provenance validation.
- Explicit browser, crawler, application-context, platform, device, CPU, and Client Hints precedence coverage.
- Detection coverage gates for production code under `src/v2/**`.
- OAI-SearchBot, OAI-AdsBot, Googlebot Image, and Googlebot Video client claims.

### Changed

- Explicit `Chromium/<version>` User-Agent claims now report Chromium rather than Chrome.
- iPad User-Agent claims now use the existing iPadOS product name before generic iOS matching.
- Generic bot fallback requires a complete bot-like token boundary.

### Fixed

- `Google-Extended` is no longer treated as an HTTP User-Agent client; Google documents it as a robots control token without a separate HTTP User-Agent string.
- Specific crawler products win over generic bot fallback classification.

### Security

- Clarified that User-Agent and Client Hints detection reports spoofable claims and does not verify bot origin.
```

- [ ] **Step 2: Add README detection and verification language**

Add a concise section under the existing limitations or security area:

```md
### Claim detection is not identity verification

`ua-info` parses User-Agent and Client Hints claims. These values can be absent, reduced, malformed, or spoofed. A result such as `client.id === 'googlebot'` means the request claimed a matching User-Agent token; it does not prove that the request originated from Google.

Use provider-documented IP ranges, reverse DNS, signed-agent mechanisms, or another server-side verification process when origin verification is required.
```

Update the detection coverage list to include the v2.1 additions and the Google-Extended limitation.

- [ ] **Step 3: Add the v2.1 design addendum**

Append to `docs/v2-design.md`:

```md
## 2.1 accuracy and provenance addendum

Version 2.1 keeps the 2.0 public result and entry-point contracts unchanged. Detector additions and corrections are fixture-first: every changed claim has a source-backed or regression fixture, explicit precedence, and package-level verification.

Robots control tokens are not automatically HTTP User-Agent tokens. In particular, `Google-Extended` is not detected from a User-Agent claim because Google documents it as a control token without a separate HTTP request User-Agent string.

All detected identities remain untrusted claims rather than origin verification.
```

- [ ] **Step 4: Run identity and stale-language scans**

```bash
npm run identity:check
rg -n "verified bot|authentic bot|Google-Extended.*ai-agent|Google-Extended.*crawler User-Agent" README.md docs CHANGELOG.md src apps
```

Expected: identity passes and the search finds no language that represents claim detection as authentication.

- [ ] **Step 5: Commit**

```bash
git add CHANGELOG.md README.md docs/v2-design.md
git commit -m "docs: document v2.1 detection guarantees"
```

---

### Task 11: Release Cut to ua-info 2.1.0

**Files:**
- Modify: `package.json`
- Modify: `scripts/verify-package-identity.mjs`
- Modify: `CHANGELOG.md` only if the release date changed during implementation.

**Interfaces:**
- Produces the immutable package identity `ua-info@2.1.0`.

- [ ] **Step 1: Add a failing identity expectation for 2.1.0**

First update only `package.json`:

```json
"version": "2.1.0"
```

Run:

```bash
npm run identity:check
```

Expected: FAIL because the canonical identity verifier still requires `2.0.3`.

- [ ] **Step 2: Update the canonical identity verifier**

In `scripts/verify-package-identity.mjs`, change:

```js
version: '2.1.0',
```

and change the final success message to:

```js
console.log('Package identity verified: ua-info@2.1.0, canonical metadata, and OIDC-only release workflow.');
```

No repository, homepage, bugs URL, exports, files list, or publish workflow identity may change.

- [ ] **Step 3: Run the final local gates**

```bash
npm run identity:check
npm run detection:check
npm run check
npm run playground:check
```

Expected: every command passes.

- [ ] **Step 4: Inspect the npm tarball**

```bash
npm pack --dry-run
```

Expected:

- package name and version are `ua-info@2.1.0`;
- `dist`, `README.md`, and `LICENSE` are included;
- `src`, `src/v2/__tests__`, fixture files, coverage output, Playground source, and design documents are excluded.

- [ ] **Step 5: Commit the release identity**

```bash
git add package.json scripts/verify-package-identity.mjs CHANGELOG.md
git commit -m "release: prepare ua-info 2.1.0"
```

---

### Task 12: Pull Request, CI, Publication, and Live Verification

**Files:**
- No source file is created unless CI exposes a defect.
- Update implementation plan checkboxes and verification record after each gate.

**Interfaces:**
- Produces a merged release commit, npm publication, GitHub tag/release, and live-consumer evidence.

- [ ] **Step 1: Push the implementation branch and open a draft PR**

```bash
git status --short
git log --oneline --decorate master..HEAD
git push -u origin agent/ua-info-v2-1-detection-accuracy-coverage
```

Open a draft PR targeting `master` with:

```text
Title: feat: harden detection accuracy for ua-info 2.1
```

The PR body must list:

- fixture and provenance architecture;
- behavior corrections;
- public compatibility boundary;
- coverage thresholds;
- full package and Playground gates;
- planned npm publication and live verification.

- [ ] **Step 2: Verify GitHub Actions**

Required successful jobs:

```text
CI / test (Node.js 18)
CI / test (Node.js 20)
CI / test (Node.js 22)
CI / detection-coverage
CI / playground
```

Inspect failed logs before changing code. Do not weaken tests or thresholds to make a job green.

- [ ] **Step 3: Perform final diff review**

```bash
git diff --check master...HEAD
git diff --stat master...HEAD
git diff master...HEAD -- package.json src/v2 scripts .github apps/playground README.md CHANGELOG.md docs/v2-design.md
```

Verify:

- no public type expansion;
- no runtime dependency;
- no test fixture in package `files`;
- no static npm token;
- no unrelated detector rewrite;
- package version exactly `2.1.0`.

- [ ] **Step 4: Mark the PR ready and merge only at the verified head SHA**

Use squash merge after all required checks pass. Record:

```text
PR number
verified head SHA
CI run ID
squash merge SHA
```

- [ ] **Step 5: Verify npm Trusted Publishing**

The `Publish to npm` workflow must:

```text
validate package
confirm ua-info@2.1.0 is absent before publication
publish through OIDC with provenance
verify registry visibility
close the generated [release-report] issue as completed
```

Do not use `NPM_TOKEN` or another static-token fallback.

- [ ] **Step 6: Run clean live consumers on Node.js 18, 20, and 22**

For each Node version, create a clean temporary project and run:

```bash
npm init -y
npm install ua-info@2.1.0 typescript@4.9.5
```

Verify:

```js
import { parse } from 'ua-info';
import { parseRequest } from 'ua-info/server';

console.log(parse('Chromium/150.0.0.0').browser?.id);
console.log(parse('Google-Extended').client);
console.log(parseRequest({
  userAgent: '',
  headers: { 'sec-ch-ua': '"Microsoft Edge";v="150"' },
}).browser?.id);
```

Expected output:

```text
chromium
null
edge
```

Also compile a TypeScript Node16 consumer with `skipLibCheck: false`.

- [ ] **Step 7: Create and verify the GitHub release**

Create tag and release `v2.1.0` at the exact package release commit. Release notes must summarize additions, corrections, compatibility, provenance, and claim-verification limitations.

Verify:

```bash
git rev-parse v2.1.0^{commit}
git rev-parse <package-release-commit>
```

Expected: identical SHAs.

- [ ] **Step 8: Close the implementation record**

Update this plan with:

```text
final PR
verified head SHA
CI run IDs
merge SHA
npm release report issue
live verification issue or run
GitHub release URL
```

Change the design status to `Implemented and verified` only after npm, live consumers, and tag verification all pass.

---

## Final Verification Checklist

- [ ] Fixture IDs are unique and provenance is complete.
- [ ] Chromium is distinct from Chrome.
- [ ] Google-Extended is not treated as an HTTP User-Agent client.
- [ ] OAI-SearchBot, OAI-AdsBot, Googlebot Image, and Googlebot Video are source-backed.
- [ ] Perplexity-User is not forced into an inaccurate client kind.
- [ ] Context mode never replaces browser product identity.
- [ ] iPadOS precedence is reachable.
- [ ] Client Hints precedence and malformed fragments are deterministic.
- [ ] Parser purity, determinism, bounded long input, and mutation safety pass.
- [ ] Coverage meets 90/90/90/85.
- [ ] Node.js 18/20/22 package jobs pass.
- [ ] Detection coverage job passes.
- [ ] Playground packed-consumer gate passes.
- [ ] npm tarball excludes test fixtures and Playground source.
- [ ] No public type or entry-point breaking change exists.
- [ ] npm Trusted Publishing and provenance pass.
- [ ] Clean live consumers pass on Node.js 18, 20, and 22.
- [ ] GitHub tag resolves to the exact release commit.
