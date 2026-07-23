# UA Info Interactive Playground Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a privacy-preserving, framework-neutral playground that consumes the packed `ua-info` package exactly like an external browser application.

**Architecture:** The root repository remains the canonical library package. A private Vite application under `apps/playground` imports only the installed public package entry points, centralizes detection behind one service, manages immutable state through a pure reducer, renders persistent DOM components, and deploys a verified `/ua-info/` static build to GitHub Pages.

**Tech Stack:** Node.js 22 for playground tooling, Vite 6, Vanilla TypeScript, TypeScript 5.7, Vitest 3, jsdom 26, Playwright 1.61 with Chromium, custom CSS, GitHub Actions, GitHub Pages artifact deployment. The root library remains TypeScript 4.9-compatible and keeps its Node.js 18/20/22 CI matrix.

## Global Constraints

- Treat `docs/superpowers/specs/2026-07-23-ua-info-playground-design.md` as the source of truth.
- Keep the root package identity, version, parser semantics, and public result contracts unchanged.
- Keep public exports `.`, `./server`, `./browser`, and `./package.json` unchanged.
- Playground production code may import only `ua-info`, `ua-info/browser`, and dynamically loaded `ua-info/server`.
- Never map playground imports to root source files, private dist paths, or TypeScript aliases.
- Before playground type-check, test, build, or smoke, build the root package, run `npm pack`, and install the generated tarball into `apps/playground`.
- Keep playground code and tooling outside the root npm tarball.
- Keep npm publication and GitHub Pages deployment in separate workflows.
- Do not add a frontend framework, router, state library, UI framework, CSS framework, remote font, remote icon, analytics SDK, backend endpoint, service worker, or persistent input storage.
- Treat User-Agent and Client Hints as untrusted text. Use `textContent` and element value properties; never use `innerHTML` or `insertAdjacentHTML`.
- Current Browser is the default mode.
- Manual User-Agent parsing waits 300 ms after typing and also supports immediate `Ctrl/Cmd + Enter` parsing.
- Advanced Client Hints is collapsed by default and invokes `ua-info/server` only for valid non-empty headers.
- Keep the first release English-only.
- Support light/dark system preferences, reduced motion, keyboard-only operation, 200% zoom, and 320 CSS-pixel viewports without page-level horizontal overflow.
- Follow red-green-refactor for behavior. Configuration tasks require an executable verification command.
- Preserve the existing root `npm run check` behavior and Node.js 18/20/22 library matrix.

---

## File Map

### Create

```text
apps/playground/
├── package.json
├── package-lock.json
├── index.html
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── public/favicon.svg
├── src/
│   ├── env.d.ts
│   ├── main.ts
│   ├── app/
│   │   ├── playground-state.ts
│   │   ├── playground-actions.ts
│   │   ├── playground-reducer.ts
│   │   ├── playground-store.ts
│   │   ├── current-detection-effect.ts
│   │   ├── manual-detection-effect.ts
│   │   ├── playground-view-model.ts
│   │   └── create-playground-app.ts
│   ├── components/
│   │   ├── component.ts
│   │   ├── app-header.ts
│   │   ├── mode-selector.ts
│   │   ├── current-browser-panel.ts
│   │   ├── manual-user-agent-panel.ts
│   │   ├── client-hints-editor.ts
│   │   ├── sample-selector.ts
│   │   ├── detection-summary.ts
│   │   ├── result-card.ts
│   │   ├── result-details.ts
│   │   ├── json-viewer.ts
│   │   ├── code-example.ts
│   │   ├── status-message.ts
│   │   └── privacy-notice.ts
│   ├── services/
│   │   ├── ua-detection-service.ts
│   │   ├── client-hints-input.ts
│   │   ├── clipboard-service.ts
│   │   └── debounce.ts
│   ├── samples/
│   │   ├── sample-types.ts
│   │   ├── browser-samples.ts
│   │   ├── webview-samples.ts
│   │   ├── application-samples.ts
│   │   ├── automation-samples.ts
│   │   └── index.ts
│   ├── styles/
│   │   ├── tokens.css
│   │   ├── base.css
│   │   ├── layout.css
│   │   ├── components.css
│   │   └── utilities.css
│   ├── contract/public-entrypoints.test.ts
│   └── tests/
│       ├── setup.ts
│       └── fixtures.ts
├── e2e/playground.spec.ts
└── README.md

scripts/install-playground-package.mjs
scripts/verify-playground-boundaries.mjs
.github/workflows/deploy-playground.yml
```

Tests live beside their owners as `*.test.ts`.

### Modify

- `.gitignore`
- `package.json`
- `scripts/verify-package.mjs`
- `.github/workflows/ci.yml`
- `README.md`

### Intentionally Unchanged

- `src/v2/**`
- `src/index.ts`
- `src/v2/server.ts`
- `src/v2/browser.ts`
- `.github/workflows/publish.yml`
- root `engines.node`
- root Jest configuration and existing tests

---

## Task 1: Establish the Packed Consumer Harness and Vite Skeleton

**Files:**
- Create: `apps/playground/package.json`
- Create: `apps/playground/package-lock.json`
- Create: `apps/playground/index.html`
- Create: `apps/playground/tsconfig.json`
- Create: `apps/playground/vite.config.ts`
- Create: `apps/playground/vitest.config.ts`
- Create: `apps/playground/public/favicon.svg`
- Create: `apps/playground/src/env.d.ts`
- Create: `apps/playground/src/main.ts`
- Create: `apps/playground/src/tests/setup.ts`
- Create: `apps/playground/src/contract/public-entrypoints.test.ts`
- Create: `scripts/install-playground-package.mjs`
- Modify: `.gitignore`
- Modify: `package.json`
- Modify: `scripts/verify-package.mjs`

**Interfaces:**
- Consumes: root `npm run build`, root package metadata, `npm pack --json`.
- Produces: a private Node.js 22 playground, installed packed `ua-info`, Vite build at `/ua-info/`, root `playground:*` commands.

- [ ] **Step 1: Create the failing public-entry contract**

Create `apps/playground/src/contract/public-entrypoints.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { BrowserId, parse } from 'ua-info';
import { detectCurrent } from 'ua-info/browser';
import { parseRequest } from 'ua-info/server';

const chromeUA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';

describe('packed ua-info browser consumer contract', () => {
  it('resolves root, browser, and server entry points', () => {
    const parsed = parse(chromeUA);
    const enriched = parseRequest({
      userAgent: chromeUA,
      headers: {
        'sec-ch-ua': '"Google Chrome";v="151"',
        'sec-ch-ua-platform': '"Android"',
        'sec-ch-ua-mobile': '?1',
      },
    });

    expect(parsed.browser?.id).toBe(BrowserId.Chrome);
    expect(enriched.browser?.version?.major).toBe(151);
    expect(enriched.device.type).toBe('mobile');
    expect(typeof detectCurrent).toBe('function');
  });
});
```

- [ ] **Step 2: Create the private tooling package and strict configs**

Create `apps/playground/package.json`:

```json
{
  "name": "@ua-info/playground",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22" },
  "scripts": {
    "dev": "vite",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview --host 127.0.0.1 --port 4173 --strictPort",
    "test:e2e": "playwright test"
  },
  "devDependencies": {
    "@playwright/test": "^1.61.0",
    "@types/node": "^22.10.0",
    "jsdom": "^26.1.0",
    "typescript": "^5.7.3",
    "vite": "^6.1.0",
    "vitest": "^3.0.9"
  }
}
```

Create `apps/playground/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client", "vitest/globals", "node"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": [
    "src/**/*.ts",
    "vite.config.ts",
    "vitest.config.ts",
    "playwright.config.ts",
    "e2e/**/*.ts"
  ]
}
```

Create `apps/playground/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    include: ['./src/**/*.test.ts'],
    restoreMocks: true,
    clearMocks: true,
  },
});
```

Create `apps/playground/src/tests/setup.ts`:

```ts
import { afterEach } from 'vitest';

afterEach(() => {
  document.body.replaceChildren();
});
```

Create `apps/playground/src/env.d.ts`:

```ts
/// <reference types="vite/client" />

declare const __UA_INFO_VERSION__: string;
```

- [ ] **Step 3: Install tooling and prove RED**

```bash
npm install --prefix apps/playground
npm run test --prefix apps/playground -- src/contract/public-entrypoints.test.ts
```

Expected: FAIL because the private tooling package does not contain `ua-info`.

- [ ] **Step 4: Implement the pack-and-install script**

Create `scripts/install-playground-package.mjs`:

```js
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const playgroundDirectory = path.join(rootDirectory, 'apps', 'playground');
const workspace = await mkdtemp(path.join(os.tmpdir(), 'ua-info-playground-pack-'));

try {
  const expected = JSON.parse(
    await readFile(path.join(rootDirectory, 'package.json'), 'utf8'),
  );
  const output = execFileSync(
    npmCommand,
    ['pack', '--ignore-scripts', '--json', '--pack-destination', workspace],
    { cwd: rootDirectory, encoding: 'utf8' },
  );
  const [report] = JSON.parse(output);
  if (report.name !== expected.name || report.version !== expected.version) {
    throw new Error(
      `Packed identity mismatch: expected ${expected.name}@${expected.version}, ` +
        `received ${report.name}@${report.version}`,
    );
  }

  const tarballPath = path.join(workspace, report.filename);
  execFileSync(
    npmCommand,
    [
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--no-save',
      '--package-lock=false',
      tarballPath,
    ],
    { cwd: playgroundDirectory, stdio: 'inherit' },
  );

  const installed = JSON.parse(
    await readFile(
      path.join(playgroundDirectory, 'node_modules', 'ua-info', 'package.json'),
      'utf8',
    ),
  );
  if (installed.name !== expected.name || installed.version !== expected.version) {
    throw new Error(
      `Installed identity mismatch: expected ${expected.name}@${expected.version}, ` +
        `received ${installed.name}@${installed.version}`,
    );
  }
  console.log(`Installed packed ${installed.name}@${installed.version}.`);
} finally {
  await rm(workspace, { recursive: true, force: true });
}
```

- [ ] **Step 5: Create the Vite document and version injection**

Create `apps/playground/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      name="description"
      content="Inspect browser, device, operating system, context, and Client Hints locally with UA Info."
    />
    <link rel="icon" type="image/svg+xml" href="./favicon.svg" />
    <title>UA Info Playground</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

Create `apps/playground/vite.config.ts`:

```ts
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { defineConfig } from 'vite';

const require = createRequire(import.meta.url);
const packagePath = require.resolve('ua-info/package.json');
const packageMetadata = JSON.parse(readFileSync(packagePath, 'utf8')) as {
  readonly version: string;
};

export default defineConfig({
  base: '/ua-info/',
  define: {
    __UA_INFO_VERSION__: JSON.stringify(packageMetadata.version),
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
  },
  server: { host: '127.0.0.1' },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
});
```

Create `apps/playground/src/main.ts`:

```ts
const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Playground root element was not found.');

const heading = document.createElement('h1');
heading.textContent = `UA Info ${__UA_INFO_VERSION__} Playground`;
root.append(heading);
```

Create a local SVG favicon at `apps/playground/public/favicon.svg`; it must not reference an external resource.

- [ ] **Step 6: Add root scripts and tarball isolation assertion**

After the global `package-lock.json` ignore in `.gitignore`, add:

```gitignore
!apps/playground/package-lock.json
```

Add these root scripts:

```json
{
  "playground:install": "node scripts/install-playground-package.mjs",
  "playground:dev": "npm run build && npm run playground:install && npm run dev --prefix apps/playground",
  "playground:typecheck": "npm run typecheck --prefix apps/playground",
  "playground:test": "npm run test --prefix apps/playground",
  "playground:build": "npm run build --prefix apps/playground",
  "playground:test:e2e": "npm run playground:build && npm run test:e2e --prefix apps/playground",
  "playground:check": "npm run build && npm run playground:install && npm run playground:typecheck && npm run playground:test && npm run playground:test:e2e"
}
```

In `scripts/verify-package.mjs`, after creating `packedPaths`, add:

```js
const leakedPlaygroundFiles = packedPaths.filter((filePath) =>
  filePath.startsWith('apps/playground/'),
);
if (leakedPlaygroundFiles.length > 0) {
  throw new Error(
    `Playground files leaked into the root package: ${leakedPlaygroundFiles.join(', ')}`,
  );
}
```

- [ ] **Step 7: Prove GREEN**

```bash
npm run build
npm run playground:install
npm run playground:typecheck
npm run playground:test -- src/contract/public-entrypoints.test.ts
npm run playground:build
npm run pack:check
```

Expected: every command exits `0`; `apps/playground/dist/index.html` uses `/ua-info/`; the root tarball contains no playground path.

- [ ] **Step 8: Commit**

```bash
git add .gitignore package.json scripts/install-playground-package.mjs scripts/verify-package.mjs apps/playground
git commit -m "build: add packed playground consumer harness"
```

---

## Task 2: Implement State, Reducer, Store, Client Hints Validation, and Debounce

**Files:**
- Create: `apps/playground/src/services/ua-detection-service.ts`
- Create: `apps/playground/src/app/playground-state.ts`
- Create: `apps/playground/src/app/playground-actions.ts`
- Create: `apps/playground/src/app/playground-reducer.ts`
- Create: `apps/playground/src/app/playground-store.ts`
- Create: `apps/playground/src/services/client-hints-input.ts`
- Create: `apps/playground/src/services/debounce.ts`
- Create: focused tests beside each owner
- Create: `apps/playground/src/tests/fixtures.ts`

**Interfaces:**
- Produces: `UADetectionService`, `PlaygroundState`, `PlaygroundAction`, `reducePlaygroundState()`, `createPlaygroundStore()`, `parseClientHintsInput()`, `createDebounce()`.

- [ ] **Step 1: Create deterministic result fixtures**

Create `apps/playground/src/tests/fixtures.ts` with a complete `UAResult` for Chrome on Windows and a complete LINE LIFF result. Use actual `UAResult` fields: `ua`, `browser`, `engine`, `os`, `device`, `cpu`, `client`, and `context`.

- [ ] **Step 2: Write failing reducer and store tests**

Tests must prove:

```ts
it('selects a mode without mutating the previous state', () => {
  const before = createInitialPlaygroundState();
  const after = reducePlaygroundState(before, {
    type: 'mode-selected',
    mode: 'manual',
  });
  expect(after).not.toBe(before);
  expect(after.mode).toBe('manual');
  expect(before.mode).toBe('current');
});

it('preserves the last valid result when Client Hints becomes invalid', () => {
  const valid = reducePlaygroundState(createInitialPlaygroundState(), {
    type: 'manual-parse-succeeded',
    result: chromeResult,
  });
  const invalid = reducePlaygroundState(valid, {
    type: 'client-hints-invalid',
    error: { code: 'invalid-json', message: 'Invalid JSON.' },
  });
  expect(invalid.manual.result).toBe(chromeResult);
  expect(invalid.manual.clientHints.error?.code).toBe('invalid-json');
});

it('notifies subscribers only for a new state reference', () => {
  const store = createPlaygroundStore();
  const listener = vi.fn();
  store.subscribe(listener);
  store.dispatch({ type: 'mode-selected', mode: 'current' });
  store.dispatch({ type: 'mode-selected', mode: 'manual' });
  expect(listener).toHaveBeenCalledOnce();
});
```

Run:

```bash
npm run playground:test -- src/app/playground-reducer.test.ts src/app/playground-store.test.ts
```

Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Define state and action contracts**

Use these exact state unions:

```ts
export type PlaygroundMode = 'current' | 'manual';

export type CurrentDetectionState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'success'; readonly result: UAResult }
  | { readonly status: 'error'; readonly message: string };

export type ManualParseStatus =
  | 'idle'
  | 'scheduled'
  | 'parsing'
  | 'success'
  | 'error';

export type ClientHintsInputErrorCode =
  | 'too-large'
  | 'invalid-json'
  | 'invalid-root'
  | 'dangerous-key'
  | 'invalid-value';
```

`PlaygroundState` contains `mode`, `current`, `manual`, and `notification`. Manual state contains User-Agent text, selected sample ID, Client Hints expanded/text/error, parse status, last valid result, and error message. Initial mode is `current`; initial detection is `idle`; manual values are empty.

The action union contains exactly:

```text
mode-selected
current-detection-requested
current-detection-succeeded
current-detection-failed
manual-user-agent-changed
manual-parse-requested
manual-parse-succeeded
manual-parse-failed
sample-selected
client-hints-expanded
client-hints-changed
client-hints-valid
client-hints-invalid
manual-reset
notification-shown
notification-cleared
```

- [ ] **Step 4: Implement the pure reducer and minimal store**

Reducer rules:

- Return the same state reference for selecting the already selected mode.
- Current request replaces current state with `loading`; success/error replace it with their discriminated state.
- Non-empty manual input sets `scheduled`; empty input sets `idle`, clears result, and clears parse errors.
- Manual parse request sets `parsing`; success sets `success` and result; failure sets `error` without clearing the last valid result.
- Invalid Client Hints sets the validation error and preserves the last valid result.
- Reset restores only the initial manual state.
- Notification clear returns the same state reference when already clear.

Store contract:

```ts
export interface PlaygroundStore {
  getState(): PlaygroundState;
  dispatch(action: PlaygroundAction): void;
  subscribe(listener: (state: PlaygroundState) => void): () => void;
}
```

The store owns no DOM, timer, clipboard, or detection logic.

- [ ] **Step 5: Add the centralized detection service**

Create `apps/playground/src/services/ua-detection-service.ts`:

```ts
import { parse, type UAResult } from 'ua-info';
import { detectCurrent, type DetectCurrentOptions } from 'ua-info/browser';
import type { HeaderRecord } from 'ua-info/server';

export type { UAResult };

export interface UADetectionService {
  detectCurrent(): Promise<UAResult>;
  parseUserAgent(userAgent: string): UAResult;
  parseRequest(input: {
    readonly userAgent: string;
    readonly headers: HeaderRecord;
  }): Promise<UAResult>;
}

const highEntropy: NonNullable<DetectCurrentOptions['highEntropy']> = [
  'architecture',
  'bitness',
  'fullVersionList',
  'model',
  'platformVersion',
];

export function createUADetectionService(): UADetectionService {
  return {
    detectCurrent: () => detectCurrent({ highEntropy }),
    parseUserAgent: (userAgent) => parse(userAgent),
    async parseRequest(input) {
      const { parseRequest } = await import('ua-info/server');
      return parseRequest(input);
    },
  };
}
```

This is the only production file allowed to import `ua-info` entry points.

- [ ] **Step 6: Write failing Client Hints and debounce tests**

Client Hints tests cover blank input, valid string/string-array headers, non-object roots, malformed JSON, values other than string/string-array, input longer than 32 KiB, and root keys `__proto__`, `prototype`, and `constructor`.

Debounce tests use fake timers and prove:

```ts
const debounce = createDebounce(300);
debounce.schedule(first);
vi.advanceTimersByTime(200);
debounce.schedule(second);
vi.advanceTimersByTime(299);
expect(second).not.toHaveBeenCalled();
vi.advanceTimersByTime(1);
expect(first).not.toHaveBeenCalled();
expect(second).toHaveBeenCalledOnce();
```

Also test `flush()`, `cancel()`, and `destroy()`.

Run:

```bash
npm run playground:test -- src/services/client-hints-input.test.ts src/services/debounce.test.ts
```

Expected: FAIL because both utilities do not exist.

- [ ] **Step 7: Implement safe Client Hints parsing**

`parseClientHintsInput(text)` returns:

```ts
type ParseClientHintsResult =
  | { readonly ok: true; readonly headers: HeaderRecord | null }
  | { readonly ok: false; readonly error: ClientHintsInputError };
```

Rules:

- Blank text returns `{ ok: true, headers: null }`.
- Reject text longer than `32_768` characters.
- Parse with `JSON.parse` only.
- Require a non-null, non-array object root.
- Lowercase header keys.
- Reject dangerous root keys.
- Accept only string or readonly string-array values.
- Return a null-prototype frozen header object.

- [ ] **Step 8: Implement cancellable debounce**

```ts
export interface DebounceController {
  schedule(callback: () => void): void;
  flush(): void;
  cancel(): void;
  destroy(): void;
}
```

Only one callback may be pending. `flush()` runs the pending callback once. `destroy()` cancels pending work and makes later scheduling inert.

- [ ] **Step 9: Prove GREEN and commit**

```bash
npm run playground:test -- src/app/playground-reducer.test.ts src/app/playground-store.test.ts src/services/client-hints-input.test.ts src/services/debounce.test.ts
npm run playground:typecheck
git add apps/playground/src/app apps/playground/src/services apps/playground/src/tests/fixtures.ts
git commit -m "feat: add playground state and input foundation"
```

---

## Task 3: Add the Required Sample Corpus and Pure View Models

**Files:**
- Create all files under `apps/playground/src/samples/`
- Create: `apps/playground/src/app/playground-view-model.ts`
- Create tests beside sample index and view-model owner

**Interfaces:**
- Produces: `USER_AGENT_SAMPLES`, `findUserAgentSample()`, `createDetectionSummary()`, `createResultCards()`, `createCodeExample()`.

- [ ] **Step 1: Write failing sample-corpus tests**

Require these unique IDs:

```text
chrome-windows
edge-windows
firefox-linux
safari-macos
chrome-android
safari-iphone
android-webview
ios-wkwebview
line-liff
line-in-app
facebook-in-app
instagram-in-app
tiktok-in-app
headless-chrome
googlebot
curl
unknown-client
```

Assert that `line-liff` contains `sec-ch-ua-mobile: ?1`, Android platform, platform version, model, and a Chrome/Chromium brand list.

- [ ] **Step 2: Write failing view-model tests**

Use the LINE LIFF fixture and assert:

```ts
expect(summary.browser).toBe('Chrome 150.0.7871.46');
expect(summary.mode).toBe('WebView');
expect(summary.contextHost).toBe('LINE 26.11.0');
expect(summary.contextSurface).toBe('LIFF');
```

Use a result with null client/context/cpu and assert card values are `Not detected`. Assert API examples import `ua-info/browser`, `ua-info`, or `ua-info/server` according to mode and Client Hints use.

Run and verify RED:

```bash
npm run playground:test -- src/samples/samples.test.ts src/app/playground-view-model.test.ts
```

- [ ] **Step 3: Implement readonly sample files**

`UserAgentSample` contains `id`, `label`, `category`, `userAgent`, and optional `HeaderRecord` Client Hints. Categories are exactly:

```text
Desktop browsers
Mobile browsers
WebViews
Applications and mini-apps
Automation and bots
HTTP clients
Unknown or malformed
```

Use realistic complete User-Agent strings. LINE LIFF uses an Android WebView User-Agent with `Line/26.11.0 LIFF` and the required Client Hints. Combine arrays with `Object.freeze` and implement lookup with `find`.

- [ ] **Step 4: Implement pure view-model mapping**

Summary fields are `browser`, `mode`, `contextHost`, `contextSurface`, `os`, and `device`.

Cards are always produced in this order:

```text
Browser
Context
Client
Engine
Operating System
Device
CPU
```

Use `version.raw`; humanize hyphenated enum values; render missing values as `Not detected`; keep raw JSON outside the mapper. API examples are exact public imports and contain no executable editor state.

- [ ] **Step 5: Prove GREEN and commit**

```bash
npm run playground:test -- src/samples/samples.test.ts src/app/playground-view-model.test.ts
npm run playground:typecheck
git add apps/playground/src/samples apps/playground/src/app/playground-view-model*
git commit -m "feat: add playground samples and view models"
```

---

## Task 4: Build Component Primitives and the Persistent Shell

**Files:**
- Create component primitive, header, mode selector, status, privacy notice
- Create: `apps/playground/src/app/create-playground-app.ts`
- Modify: `apps/playground/src/main.ts`
- Create focused component and app tests

**Interfaces:**
- Produces: `Component<TModel>`, cleanup ownership, one stable application shell, mode switching.

- [ ] **Step 1: Write failing lifecycle and shell tests**

Test that cleanup removes an event listener, mode selector emits `manual`, tabs expose `role="tab"` and `aria-selected`, and `createPlaygroundApp().element` remains the same object after mode switching.

- [ ] **Step 2: Implement component primitives**

```ts
export interface Component<TModel> {
  readonly element: HTMLElement;
  update(model: TModel): void;
  destroy(): void;
}

export interface Cleanup {
  listen<K extends keyof HTMLElementEventMap>(
    target: HTMLElement,
    type: K,
    listener: (event: HTMLElementEventMap[K]) => void,
  ): void;
  add(dispose: () => void): void;
  destroy(): void;
}
```

`createCleanup()` stores disposer functions, runs them once in reverse registration order, and immediately runs a disposer added after destruction.

- [ ] **Step 3: Implement exact static shell semantics**

- Header contains `UA Info`, `v${__UA_INFO_VERSION__}`, one short description, GitHub link, and npm link.
- Mode selector is a labelled tablist with Current Browser and Manual User-Agent buttons.
- Privacy notice text is exactly `Detection happens locally in your browser. No data is uploaded.`
- Status component maps loading to `role="status"` and errors to `role="alert"`.
- All static anchors use `target="_blank"` and `rel="noreferrer"`.

- [ ] **Step 4: Compose one persistent application root**

`createPlaygroundApp()` creates one `main`, one header, one mode selector, one current panel container, one manual panel container, one result container, and one privacy notice. It creates one store subscription and toggles panel `hidden` properties. It never replaces the root, textarea owner, or future `<details>` owner.

Public contract:

```ts
export interface PlaygroundApp {
  readonly element: HTMLElement;
  start(): void;
  selectMode(mode: PlaygroundMode): void;
  destroy(): void;
}
```

- [ ] **Step 5: Replace bootstrap and prove GREEN**

`main.ts` imports the CSS files later added in Task 9, locates `#app`, creates the app, appends its element, and calls `start()`.

```bash
npm run playground:test -- src/components/component.test.ts src/components/mode-selector.test.ts src/app/create-playground-app.test.ts
npm run playground:typecheck
npm run playground:build
git add apps/playground/src/components apps/playground/src/app/create-playground-app* apps/playground/src/main.ts
git commit -m "feat: add persistent playground shell"
```

---

## Task 5: Implement Current Browser Detection

**Files:**
- Create: `apps/playground/src/app/current-detection-effect.ts`
- Create: `apps/playground/src/components/current-browser-panel.ts`
- Modify: `apps/playground/src/app/create-playground-app.ts`
- Create focused tests

**Interfaces:**
- Consumes: store and `UADetectionService.detectCurrent()`.
- Produces: startup detection, retry, stale-request fencing, loading/error/success panel.

- [ ] **Step 1: Write failing effect tests**

Test loading→success, readable failure, retry, stale first request ignored after a second request, and post-destroy completion ignored. Use deferred promises:

```ts
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
```

- [ ] **Step 2: Implement generation-fenced detection**

`detect()` increments a generation, dispatches requested, awaits the service, and dispatches only if generation and destroyed state still match. Error message uses `Error.message` or `Current browser detection failed.`. `destroy()` increments generation and marks destroyed.

- [ ] **Step 3: Implement panel behavior**

- `idle`: explanation and `Detect current browser` button.
- `loading`: `Detecting current browser…` in a polite status region.
- `error`: `Current browser detection failed. You can still use Manual User-Agent mode.` plus detail and Retry button.
- `success`: `Detection complete` plus `Refresh detection` button.

Panel emits retry only; it never imports or calls `ua-info`.

- [ ] **Step 4: Integrate startup once and prove GREEN**

`start()` launches current detection only on its first call. App destruction destroys the effect. Switching modes does not launch another detection.

```bash
npm run playground:test -- src/app/current-detection-effect.test.ts src/components/current-browser-panel.test.ts src/app/create-playground-app.test.ts
npm run playground:typecheck
git add apps/playground/src/app/current-detection-effect* apps/playground/src/components/current-browser-panel* apps/playground/src/app/create-playground-app*
git commit -m "feat: detect current browser in playground"
```

---

## Task 6: Implement Manual User-Agent Parsing and Samples

**Files:**
- Create: `apps/playground/src/app/manual-detection-effect.ts`
- Create: `apps/playground/src/components/sample-selector.ts`
- Create: `apps/playground/src/components/manual-user-agent-panel.ts`
- Create: `apps/playground/src/services/clipboard-service.ts`
- Modify application composition
- Create focused tests

**Interfaces:**
- Consumes: 300 ms debounce, `parseUserAgent()`, sample lookup, store.
- Produces: typing parse, immediate parse, sample parse, reset and focus.

- [ ] **Step 1: Write a complete failing effect test harness**

Use this helper in the test file:

```ts
function createHarness() {
  const store = createPlaygroundStore();
  const detectionService: UADetectionService = {
    detectCurrent: vi.fn(),
    parseUserAgent: vi.fn().mockReturnValue(chromeResult),
    parseRequest: vi.fn().mockResolvedValue(chromeResult),
  };
  const effect = createManualDetectionEffect({ store, detectionService });
  return { store, detectionService, effect };
}
```

Test:

- latest typed value parsed after exactly 300 ms
- previous scheduled parse canceled
- `parseNow()` runs once and cancels pending timer
- sample selection fills User-Agent and Client Hints JSON and parses immediately
- reset cancels timer and restores manual initial state
- destroy cancels pending timer

- [ ] **Step 2: Implement the manual effect**

Public interface:

```ts
export interface ManualDetectionEffect {
  changeUserAgent(value: string): void;
  selectSample(sampleId: string): void;
  parseNow(): Promise<void>;
  reset(): void;
  destroy(): void;
}
```

At this task, `parseNow()` uses synchronous `parseUserAgent()` and returns `Promise.resolve()` for a stable interface. Task 7 replaces the internal operation with async Client Hints selection without changing the interface.

- [ ] **Step 3: Implement exact manual controls**

The panel contains:

- `<label for="manual-user-agent">User-Agent</label>`
- textarea `id="manual-user-agent"`, `data-testid="manual-user-agent"`, six visible rows
- labelled sample `<select>` with `<optgroup>` for each category
- `Parse now` button
- `Reset` button
- status/error region
- a dedicated Client Hints slot

`Ctrl/Cmd + Enter` prevents default and invokes parse now. `update()` writes textarea value only when different. `focusInput()` calls textarea focus and is used after reset.

- [ ] **Step 4: Implement the clipboard boundary**

```ts
export interface ClipboardService {
  writeText(value: string): Promise<void>;
}

export function createClipboardService(): ClipboardService {
  return {
    async writeText(value) {
      if (!globalThis.navigator?.clipboard) {
        throw new Error('Clipboard access is unavailable.');
      }
      await globalThis.navigator.clipboard.writeText(value);
    },
  };
}
```

- [ ] **Step 5: Integrate and prove GREEN**

Selecting Manual mode exposes controls. Selecting a sample parses immediately. Reset restores focus. Current detection is not re-run.

```bash
npm run playground:test -- src/app/manual-detection-effect.test.ts src/components/manual-user-agent-panel.test.ts src/app/create-playground-app.test.ts
npm run playground:typecheck
git add apps/playground/src/app/manual-detection-effect* apps/playground/src/components/sample-selector* apps/playground/src/components/manual-user-agent-panel* apps/playground/src/services/clipboard-service.ts apps/playground/src/app/create-playground-app*
git commit -m "feat: parse manual user agents in playground"
```

---

## Task 7: Add Advanced Client Hints Through Dynamic Server Import

**Files:**
- Create: `apps/playground/src/components/client-hints-editor.ts`
- Modify manual effect and panel
- Create/extend focused tests

**Interfaces:**
- Consumes: `parseClientHintsInput()` and `UADetectionService.parseRequest()`.
- Produces: native disclosure, validation, async stale-result fencing, last-valid-result preservation.

- [ ] **Step 1: Add complete failing async tests**

Use a deferred helper and test that the second request wins:

```ts
it('ignores an older asynchronous parseRequest result', async () => {
  const first = deferred<UAResult>();
  const second = deferred<UAResult>();
  const { store, detectionService, effect } = createHarness();
  vi.mocked(detectionService.parseRequest)
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(second.promise);

  effect.changeUserAgent('first');
  effect.changeClientHints('{"sec-ch-ua-mobile":"?1"}');
  const firstRun = effect.parseNow();
  effect.changeUserAgent('second');
  const secondRun = effect.parseNow();

  second.resolve(lineLiffResult);
  await secondRun;
  first.resolve(chromeResult);
  await firstRun;

  expect(store.getState().manual.result).toBe(lineLiffResult);
});
```

Also test blank hints use `parseUserAgent`, valid hints use `parseRequest`, malformed hints do not call either parser and preserve the last valid result, and destroy ignores a late completion.

- [ ] **Step 2: Extend manual effect without changing callers**

Add:

```ts
changeClientHints(value: string): void;
setClientHintsExpanded(expanded: boolean): void;
```

`parseNow()` snapshots User-Agent and hints text, validates hints, dispatches validation error without clearing result, dispatches parse request, chooses sync `parseUserAgent` or async `parseRequest`, and commits only the latest generation. `destroy()` increments generation and destroys debounce.

- [ ] **Step 3: Implement the native editor**

Use one persistent `<details>` with `<summary>Advanced Client Hints</summary>`, labelled JSON textarea, `Reset Client Hints` button, and conditional alert. Emit open state from the `toggle` event. Assign textarea value only when different. Never replace the `<details>` element.

- [ ] **Step 4: Integrate samples and prove dynamic chunking**

A sample with Client Hints fills both inputs and parses through `parseRequest`. Blank hints use `parse`. Build and inspect assets:

```bash
npm run playground:test -- src/app/manual-detection-effect.test.ts src/components/client-hints-editor.test.ts src/components/manual-user-agent-panel.test.ts
npm run playground:build
find apps/playground/dist/assets -maxdepth 1 -type f -print
```

Expected: tests pass and Vite emits a separate lazy chunk for the server entry.

- [ ] **Step 5: Commit**

```bash
git add apps/playground/src/app/manual-detection-effect* apps/playground/src/components/client-hints-editor* apps/playground/src/components/manual-user-agent-panel*
git commit -m "feat: enrich playground results with client hints"
```

---

## Task 8: Render Summary, Detail Cards, Raw JSON, API Examples, and Copy Feedback

**Files:**
- Create result components
- Modify application composition
- Create focused DOM and integration tests

**Interfaces:**
- Consumes: pure view models, raw `UAResult`, injected clipboard service.
- Produces: readable result surface, exact raw JSON, copy notifications.

- [ ] **Step 1: Write failing rendering and injection tests**

Use hostile text:

```ts
const hostile = '<img src=x onerror=alert(1)>';
jsonViewer.update({ json: JSON.stringify({ ua: hostile }, null, 2) });
expect(jsonViewer.element.querySelector('img')).toBeNull();
expect(jsonViewer.element.textContent).toContain(hostile);
```

Assert summary fields remain separate, cards show `Not detected`, copy callbacks receive exact JSON/example text, and component root elements remain stable across updates.

- [ ] **Step 2: Implement result components**

- Summary uses a `<dl>` with Browser, Mode, Context Host, Context Surface, Operating System, and Device.
- Each card uses a heading plus `<dl>` rows.
- Details owner keeps card instances keyed by card ID.
- JSON viewer uses `<pre><code>` and `code.textContent = JSON.stringify(result, null, 2)`.
- Code example uses static text and `textContent`.
- Copy buttons emit exact strings; components do not call clipboard APIs.

- [ ] **Step 3: Add non-fatal copy notifications**

Application injects `ClipboardService`. Success dispatches a success notification. Failure dispatches `Unable to copy. Select the text manually.` without changing detection state. One owned timeout clears notifications and is canceled on destroy.

- [ ] **Step 4: Select active result deterministically**

```ts
const activeResult =
  state.mode === 'current'
    ? state.current.status === 'success'
      ? state.current.result
      : null
    : state.manual.result;
```

When null, display a mode-specific empty state. Otherwise update summary, details, JSON, and code example.

- [ ] **Step 5: Prove GREEN and commit**

```bash
npm run playground:test -- src/components/result-components.test.ts src/app/create-playground-app.test.ts
npm run playground:typecheck
npm run playground:build
git add apps/playground/src/components/detection-summary* apps/playground/src/components/result-* apps/playground/src/components/json-viewer* apps/playground/src/components/code-example* apps/playground/src/app/create-playground-app*
git commit -m "feat: present playground detection results"
```

---

## Task 9: Add Styling, Accessibility, Security, and Boundary Enforcement

**Files:**
- Create five CSS files
- Create: `scripts/verify-playground-boundaries.mjs`
- Modify `main.ts`, tests, and root scripts

**Interfaces:**
- Produces: responsive accessible UI and executable static architecture gate.

- [ ] **Step 1: Implement the boundary verifier before fixing violations**

The script recursively reads `.ts` files under `apps/playground/src`. Allow `ua-info` imports only in:

```text
services/ua-detection-service.ts
contract/public-entrypoints.test.ts
```

Reject source text matching:

```text
../../src
/src/v2/
dist/esm
.innerHTML
insertAdjacentHTML
```

Reject production imports whose target filename ends in `.test.ts` or begins under `tests/`. Exit non-zero with one line per violation.

Prove failure with a temporary file created and removed by the shell command:

```bash
printf "element.innerHTML = input;\n" > apps/playground/src/unsafe-boundary-fixture.ts
node scripts/verify-playground-boundaries.mjs; status=$?
rm apps/playground/src/unsafe-boundary-fixture.ts
exit $status
```

Expected: FAIL naming `unsafe-boundary-fixture.ts`.

- [ ] **Step 2: Add semantic CSS**

`tokens.css` defines semantic colors, system sans/mono stacks, spacing, radii, focus, and motion. Dark values live in `@media (prefers-color-scheme: dark)`.

`base.css` applies box sizing, zero body margin, minimum width 20rem, form font inheritance, minimum 44px control height, visible focus, and code font.

`layout.css` uses:

```css
.ua-playground-shell {
  width: min(100% - 2rem, 90rem);
  margin-inline: auto;
  padding-block: var(--space-5) var(--space-8);
}

.ua-playground-workspace {
  display: grid;
  grid-template-columns: minmax(18rem, 2fr) minmax(0, 3fr);
  gap: var(--space-6);
  align-items: start;
}

@media (max-width: 56rem) {
  .ua-playground-workspace {
    grid-template-columns: minmax(0, 1fr);
  }
}
```

`components.css` styles `ua-playground-` classes. JSON/code scroll internally. `utilities.css` contains visually-hidden and reduced-motion rules only.

- [ ] **Step 3: Import CSS once and strengthen DOM tests**

`main.ts` imports tokens, base, layout, components, utilities in that order.

Tests verify labels, tab selected state, live loading status, alert errors, native details/summary, reset focus, visible/accessibly named actions, and no injected element from hostile input.

- [ ] **Step 4: Add and run the gate**

Add:

```json
{
  "playground:boundaries": "node scripts/verify-playground-boundaries.mjs"
}
```

Insert `npm run playground:boundaries` before browser smoke in `playground:check`.

```bash
npm run playground:boundaries
npm run playground:test
npm run playground:build
git add apps/playground/src/styles apps/playground/src/main.ts apps/playground/src/**/*.test.ts scripts/verify-playground-boundaries.mjs package.json
git commit -m "style: harden playground experience"
```

---

## Task 10: Add Production Playwright Smoke at `/ua-info/`

**Files:**
- Create: `apps/playground/playwright.config.ts`
- Create: `apps/playground/e2e/playground.spec.ts`

**Interfaces:**
- Consumes: built dist and stable `data-testid` attributes.
- Produces: browser, base-path, responsive, console, and privacy evidence.

- [ ] **Step 1: Configure production preview**

Use base URL `http://127.0.0.1:4173/ua-info/`, one Chromium project, trace retained on failure, screenshot on failure, HTML report in CI, and Vite preview as `webServer`.

- [ ] **Step 2: Write complete smoke tests**

Test 1:

```ts
test('detects the current browser without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('./');
  await expect(page.getByTestId('detection-summary')).toBeVisible();
  const json = await page.getByTestId('raw-json').textContent();
  expect(() => JSON.parse(json ?? '')).not.toThrow();
  expect(errors).toEqual([]);
});
```

Test 2 selects Manual User-Agent, chooses `line-liff`, waits for Browser/Mode/Context Host/Context Surface rows, and parses raw JSON to assert browser mode `webview`, context name `LIFF`, and host name `LINE`.

Test 3 sets viewport `320×800`, records all request URLs before navigation, asserts `document.documentElement.scrollWidth <= window.innerWidth`, and asserts every request origin equals `http://127.0.0.1:4173`.

- [ ] **Step 3: Prove missing-browser RED then GREEN**

```bash
npm run playground:build
PLAYWRIGHT_BROWSERS_PATH=$(mktemp -d) npm run test:e2e --prefix apps/playground
```

Expected: FAIL because the temporary path has no Chromium.

Then:

```bash
cd apps/playground
npx playwright install chromium
npm run test:e2e
cd ../..
```

Expected: all smoke tests pass.

- [ ] **Step 4: Verify asset base and commit**

```bash
grep -R 'src="/assets\|href="/assets' apps/playground/dist && exit 1 || true
grep -R '/ua-info/assets/' apps/playground/dist/index.html
git add apps/playground/playwright.config.ts apps/playground/e2e apps/playground/package-lock.json
git commit -m "test: smoke playground production build"
```

---

## Task 11: Integrate CI, Pages Deployment, and Documentation

**Files:**
- Modify: `.github/workflows/ci.yml`
- Create: `.github/workflows/deploy-playground.yml`
- Create: `apps/playground/README.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: root and playground gates.
- Produces: PR verification and master-only deployment.

- [ ] **Step 1: Add a separate Node.js 22 CI job**

Preserve the existing library matrix unchanged. New job sequence:

```text
checkout
setup Node 22 with apps/playground/package-lock.json cache
npm install at root
npm ci --prefix apps/playground
npm run build
npm run playground:install
npm run playground:boundaries
npm run playground:typecheck
npm run playground:test
install Chromium with dependencies
npm run playground:test:e2e
upload playwright-report and test-results on non-cancelled runs
```

Use `actions/checkout@v4`, `actions/setup-node@v4`, and `actions/upload-artifact@v4` to match the existing CI workflow generation. The job does not deploy.

- [ ] **Step 2: Add Pages artifact deployment**

Workflow triggers on `master` path changes affecting playground source, public library source/exports/build, installer/boundary scripts, or the deployment workflow, plus manual dispatch.

Build job uses Node 22, installs root and playground dependencies, runs the same verification, configures Pages, and uploads only `apps/playground/dist` with `actions/upload-pages-artifact@v4`.

Deploy job needs build, targets `github-pages`, grants `contents: read`, `pages: write`, and `id-token: write`, and uses `actions/deploy-pages@v4`. Concurrency group is `github-pages-playground` with cancellation enabled.

- [ ] **Step 3: Write playground README**

Include purpose, production URL, package boundary, exact local commands, tarball flow, source layers, adding a sample, adding a component, test layers, `/ua-info/` base requirement, privacy guarantees, deployment, and future CNAME note.

Local setup:

```bash
npm install
npm ci --prefix apps/playground
npm run playground:dev
```

- [ ] **Step 4: Update root README**

Add:

```md
## Interactive Playground

Try UA Info in your browser at <https://petechatchawan.github.io/ua-info/>. Detection and parsing run locally; User-Agent and Client Hints data are not uploaded.
```

Add the local setup commands and link to `apps/playground/README.md`. Do not duplicate component internals.

- [ ] **Step 5: Validate YAML and docs, then commit**

```bash
npm run playground:check
git diff --check
git add .github/workflows/ci.yml .github/workflows/deploy-playground.yml apps/playground/README.md README.md
git commit -m "ci: deploy verified ua-info playground"
```

---

## Task 12: Run Final Acceptance and Prepare the Implementation PR

**Files:**
- No source changes unless verification exposes a defect.
- PR body records fresh evidence and manual checklist.

**Interfaces:**
- Consumes: all Tasks 1–11.
- Produces: verified implementation branch ready for review.

- [ ] **Step 1: Run fresh automated gates**

```bash
npm install
npm ci --prefix apps/playground
npm run check
npm run playground:check
npm run playground:boundaries
git diff --check
```

Required evidence:

- root lint, Jest suites, ESM build, CommonJS build, package checks, and packed consumers pass
- packed install reports current root package identity
- strict playground type-check passes
- all Vitest unit, DOM, integration, and public-entry tests pass
- Vite build uses `/ua-info/`
- Playwright tests pass
- root pack contains no playground files
- boundary scan reports no forbidden import or unsafe rendering
- `git diff --check` emits no output

- [ ] **Step 2: Run manual release inspection**

Record each result in the PR body:

```text
Keyboard-only navigation         PASS/FAIL
Current Browser retry            PASS/FAIL
Manual 300 ms parsing            PASS/FAIL
Ctrl/Cmd + Enter                 PASS/FAIL
LINE LIFF dimensions separated   PASS/FAIL
Invalid Client Hints preserved   PASS/FAIL
Copy failure remains non-fatal   PASS/FAIL
200% zoom                        PASS/FAIL
320 CSS-pixel viewport           PASS/FAIL
Light color scheme               PASS/FAIL
Dark color scheme                PASS/FAIL
Reduced motion                   PASS/FAIL
No external network request      PASS/FAIL
```

Do not mark an item PASS without observing it.

- [ ] **Step 3: Audit scope**

```bash
git diff --name-only master...HEAD
git diff -- src/v2 .github/workflows/publish.yml
git status --short
```

Expected: no parser source or publish workflow diff; only approved playground, verification, CI, Pages, and documentation paths.

- [ ] **Step 4: Request code review**

Invoke `superpowers:requesting-code-review`, address any verified findings, rerun affected gates, then use the GitHub publish workflow to push and open a Draft PR.

---

## Final Self-Review Checklist

- [ ] Every approved specification section maps to a task.
- [ ] No root package version or parser contract changes.
- [ ] Packed tarball, not a source alias, satisfies playground imports.
- [ ] Playground is private with its own committed lock file.
- [ ] Root tarball excludes playground files.
- [ ] Only detection service owns production `ua-info` imports.
- [ ] `ua-info/server` remains dynamically loaded.
- [ ] Reducer and view-model mapping are pure.
- [ ] Store owns no DOM, timer, clipboard, or detection logic.
- [ ] Components own no parser calls or global state.
- [ ] Root, textarea, and details elements persist across state updates.
- [ ] Timers, listeners, debounce, and async generations are cleaned up or fenced.
- [ ] User-controlled text never enters HTML parsing APIs.
- [ ] Client Hints size, root, value, and dangerous-key validation are covered.
- [ ] Current detection failure leaves Manual mode usable.
- [ ] Invalid Client Hints preserve the last valid result.
- [ ] Browser, mode, context host, context surface, client, engine, OS, device, and CPU remain distinct.
- [ ] Raw JSON is produced from the actual `UAResult`.
- [ ] All required samples exist; LINE LIFF includes Client Hints.
- [ ] Accessibility, responsive, theme, and reduced-motion contracts are verified.
- [ ] Production smoke runs at `/ua-info/` and rejects third-party requests.
- [ ] Existing Node.js 18/20/22 library CI remains intact.
- [ ] Pull requests verify but do not deploy.
- [ ] Pages deploys from `master` or manual dispatch only.
- [ ] npm publication workflow remains unchanged.
- [ ] Full root and playground gates pass with fresh output.
