# UA Info Interactive Playground Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a privacy-preserving, framework-neutral interactive playground that consumes the packed `ua-info` public API exactly like an external browser application.

**Architecture:** Keep the canonical library at the repository root and create a private Vite application under `apps/playground`. The playground imports only the installed package entry points, routes all parsing through a typed detection service, manages immutable state through a pure reducer, renders persistent DOM component objects, and verifies the production build at the real GitHub Pages base path. The authoritative gate builds the library, creates an `npm pack` tarball, installs that tarball into the playground, then type-checks, tests, bundles, and browser-smokes the consumer.

**Tech Stack:** Node.js 22 for playground tooling, Vite 6, Vanilla TypeScript, TypeScript 5.7, Vitest 3, jsdom 26, Playwright 1.61 with Chromium, custom CSS, GitHub Actions, GitHub Pages Actions artifact deployment. The root library remains TypeScript 4.9-compatible and keeps its Node.js 18/20/22 CI matrix.

## Global Constraints

- Follow `docs/superpowers/specs/2026-07-23-ua-info-playground-design.md` as the source of truth.
- Keep the root package identity and version unchanged unless a separate release decision is approved.
- Do not modify parser semantics or public result contracts under `src/v2/**`.
- Keep root public exports `.`, `./server`, `./browser`, and `./package.json` unchanged.
- Playground production imports may use only `ua-info`, `ua-info/browser`, and dynamically loaded `ua-info/server`.
- Never resolve playground imports to root source files, private dist paths, or TypeScript source aliases.
- Build the root package and install its generated `npm pack` tarball before playground type-check, test, build, or browser smoke.
- Keep the playground private and outside the root npm tarball.
- Keep npm publication and GitHub Pages deployment in separate workflows.
- Use Vite + native DOM APIs; do not add React, Vue, Angular, Lit, a router, a UI framework, or a state library.
- Use custom CSS; do not add Tailwind, Sass, Bootstrap, remote fonts, remote icons, or a syntax-highlighting dependency.
- Keep all User-Agent and Client Hints processing local; do not add analytics, backend calls, remote logging, cookies, or persisted input history.
- Treat User-Agent and Client Hints as untrusted input; never render them through `innerHTML` or `insertAdjacentHTML`.
- Current Browser is the default mode.
- Manual User-Agent parsing uses a 300 ms debounce and supports immediate `Ctrl/Cmd + Enter` parsing.
- Advanced Client Hints is optional, collapsed by default, and uses a dynamic `ua-info/server` import only when valid non-empty headers are supplied.
- The first release is English-only.
- Support light/dark system color preferences, reduced motion, keyboard-only operation, 200% zoom, and a 320 CSS-pixel viewport without page-level horizontal overflow.
- Every behavior change follows red-green-refactor. Configuration changes require a fresh executable verification command.
- Do not weaken the existing root `npm run check` gate or Node.js 18/20/22 library matrix.

---

## File Map

### Create

- `apps/playground/package.json` — private tooling package and local commands.
- `apps/playground/package-lock.json` — deterministic playground tooling lock.
- `apps/playground/index.html` — Vite document entry.
- `apps/playground/tsconfig.json` — strict browser TypeScript configuration.
- `apps/playground/vite.config.ts` — `/ua-info/` base, version injection, build and preview settings.
- `apps/playground/vitest.config.ts` — jsdom test configuration.
- `apps/playground/playwright.config.ts` — production preview smoke configuration.
- `apps/playground/public/favicon.svg` — local favicon.
- `apps/playground/src/env.d.ts` — Vite and injected version declarations.
- `apps/playground/src/main.ts` — application bootstrap only.
- `apps/playground/src/app/playground-state.ts` — immutable state contracts and initial state.
- `apps/playground/src/app/playground-actions.ts` — application event union.
- `apps/playground/src/app/playground-reducer.ts` — pure state transition function.
- `apps/playground/src/app/playground-store.ts` — minimal store and subscriptions.
- `apps/playground/src/app/current-detection-effect.ts` — current-browser async orchestration.
- `apps/playground/src/app/manual-detection-effect.ts` — manual parse/debounce orchestration.
- `apps/playground/src/app/playground-view-model.ts` — pure result-to-view-model mapping.
- `apps/playground/src/app/create-playground-app.ts` — component composition and lifecycle.
- `apps/playground/src/components/component.ts` — component and listener cleanup primitives.
- `apps/playground/src/components/app-header.ts` — package identity and repository links.
- `apps/playground/src/components/mode-selector.ts` — accessible Current/Manual tabs.
- `apps/playground/src/components/current-browser-panel.ts` — current detection states and retry.
- `apps/playground/src/components/manual-user-agent-panel.ts` — textarea, sample selection, parse/reset actions.
- `apps/playground/src/components/client-hints-editor.ts` — native disclosure and JSON editor.
- `apps/playground/src/components/detection-summary.ts` — normalized identity summary.
- `apps/playground/src/components/result-details.ts` — detail-card owner.
- `apps/playground/src/components/result-card.ts` — reusable labelled-value card.
- `apps/playground/src/components/json-viewer.ts` — escaped raw JSON and copy action.
- `apps/playground/src/components/code-example.ts` — mode-aware public API example.
- `apps/playground/src/components/status-message.ts` — live loading, success, and error semantics.
- `apps/playground/src/components/privacy-notice.ts` — local-processing statement.
- `apps/playground/src/services/ua-detection-service.ts` — only production owner of `ua-info` imports.
- `apps/playground/src/services/client-hints-input.ts` — safe JSON header validation.
- `apps/playground/src/services/clipboard-service.ts` — injectable clipboard adapter.
- `apps/playground/src/services/debounce.ts` — cancellable 300 ms scheduler.
- `apps/playground/src/samples/sample-types.ts` — readonly sample contracts.
- `apps/playground/src/samples/browser-samples.ts` — desktop and mobile browsers.
- `apps/playground/src/samples/webview-samples.ts` — Android and iOS webviews.
- `apps/playground/src/samples/application-samples.ts` — LINE, Facebook, Instagram, and TikTok.
- `apps/playground/src/samples/automation-samples.ts` — headless, bot, HTTP, and unknown clients.
- `apps/playground/src/samples/index.ts` — combined readonly sample catalog and lookup.
- `apps/playground/src/styles/tokens.css` — semantic design tokens.
- `apps/playground/src/styles/base.css` — reset and document defaults.
- `apps/playground/src/styles/layout.css` — responsive page layout.
- `apps/playground/src/styles/components.css` — component-specific rules.
- `apps/playground/src/styles/utilities.css` — accessibility-only utilities.
- `apps/playground/src/tests/setup.ts` — test DOM cleanup.
- `apps/playground/src/tests/fixtures.ts` — deterministic `UAResult` fixtures.
- `apps/playground/src/contract/public-entrypoints.test.ts` — packed public API contract.
- `apps/playground/src/**/*.test.ts` — unit, DOM, and integration tests beside owners.
- `apps/playground/e2e/playground.spec.ts` — production browser and privacy smoke.
- `apps/playground/README.md` — playground architecture, commands, tests, and deployment.
- `scripts/install-playground-package.mjs` — pack and install the root artifact into the playground.
- `scripts/verify-playground-boundaries.mjs` — import, rendering, and tarball isolation gate.
- `.github/workflows/deploy-playground.yml` — verified GitHub Pages deployment.

### Modify

- `.gitignore` — continue ignoring the root lock file while allowing `apps/playground/package-lock.json`.
- `package.json` — add root playground commands without adding Vite tooling to root dependencies.
- `scripts/verify-package.mjs` — explicitly reject playground files from the root tarball.
- `.github/workflows/ci.yml` — add one Node.js 22 playground consumer job while preserving the existing library matrix.
- `README.md` — add the production playground link and development command.

### Intentionally Unchanged

- `src/v2/**`
- `src/index.ts`
- `src/v2/server.ts`
- `src/v2/browser.ts`
- `.github/workflows/publish.yml`
- root `engines.node`
- existing root Jest configuration and tests

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
- Create: `apps/playground/src/services/ua-detection-service.ts`
- Create: `apps/playground/src/contract/public-entrypoints.test.ts`
- Create: `apps/playground/src/tests/setup.ts`
- Create: `scripts/install-playground-package.mjs`
- Modify: `.gitignore`
- Modify: `package.json`
- Modify: `scripts/verify-package.mjs`

**Interfaces:**
- Consumes: existing root `npm run build`, `npm pack --json`, and public exports from `package.json`.
- Produces: `UADetectionService`, `UAResult` type re-export, installed packed package, Vite `/ua-info/` build, root `playground:*` commands.

- [ ] **Step 1: Create the failing public-entry contract test**

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
  "engines": {
    "node": ">=22"
  },
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
  document.head.querySelectorAll('[data-test-owned]').forEach((node) => node.remove());
});
```

Create `apps/playground/src/env.d.ts`:

```ts
/// <reference types="vite/client" />

declare const __UA_INFO_VERSION__: string;
```

- [ ] **Step 3: Install only playground tooling and prove RED**

Run:

```bash
npm install --prefix apps/playground
npm run test --prefix apps/playground -- src/contract/public-entrypoints.test.ts
```

Expected: FAIL because `ua-info`, `ua-info/browser`, and `ua-info/server` are not installed in `apps/playground/node_modules`.

Commit the generated `apps/playground/package-lock.json`; do not create or commit a root lock file.

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
  const packageJson = JSON.parse(
    await readFile(path.join(rootDirectory, 'package.json'), 'utf8'),
  );
  const output = execFileSync(
    npmCommand,
    ['pack', '--ignore-scripts', '--json', '--pack-destination', workspace],
    { cwd: rootDirectory, encoding: 'utf8' },
  );
  const [report] = JSON.parse(output);

  if (report.name !== packageJson.name || report.version !== packageJson.version) {
    throw new Error(
      `Packed identity mismatch: expected ${packageJson.name}@${packageJson.version}, ` +
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
  if (installed.name !== packageJson.name || installed.version !== packageJson.version) {
    throw new Error(
      `Installed identity mismatch: expected ${packageJson.name}@${packageJson.version}, ` +
        `received ${installed.name}@${installed.version}`,
    );
  }

  console.log(`Installed packed ${installed.name}@${installed.version} into apps/playground.`);
} finally {
  await rm(workspace, { recursive: true, force: true });
}
```

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

const HIGH_ENTROPY_HINTS: NonNullable<DetectCurrentOptions['highEntropy']> = [
  'architecture',
  'bitness',
  'fullVersionList',
  'model',
  'platformVersion',
];

export function createUADetectionService(): UADetectionService {
  return {
    detectCurrent: () => detectCurrent({ highEntropy: HIGH_ENTROPY_HINTS }),
    parseUserAgent: (userAgent) => parse(userAgent),
    async parseRequest(input) {
      const { parseRequest } = await import('ua-info/server');
      return parseRequest(input);
    },
  };
}
```

This file is the only production TypeScript file allowed to import `ua-info` entry points.

- [ ] **Step 6: Add the Vite document and minimal build**

Create `apps/playground/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      name="description"
      content="Inspect User-Agent, browser context, device, operating system, and Client Hints locally with ua-info."
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
const installedPackagePath = require.resolve('ua-info/package.json');
const installedPackage = JSON.parse(readFileSync(installedPackagePath, 'utf8')) as {
  readonly version: string;
};

export default defineConfig({
  base: '/ua-info/',
  define: {
    __UA_INFO_VERSION__: JSON.stringify(installedPackage.version),
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    host: '127.0.0.1',
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
  },
});
```

Create `apps/playground/src/main.ts`:

```ts
const root = document.querySelector<HTMLElement>('#app');
if (!root) {
  throw new Error('Playground root element was not found.');
}

const heading = document.createElement('h1');
heading.textContent = `UA Info ${__UA_INFO_VERSION__} Playground`;
root.append(heading);
```

Create `apps/playground/public/favicon.svg` as a local, accessible-color-neutral SVG:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#315efb"/>
  <path d="M17 18h8v18c0 6 3 9 8 9s8-3 8-9V18h8v19c0 11-6 16-16 16S17 48 17 37V18Z" fill="white"/>
</svg>
```

- [ ] **Step 7: Add root commands and lock-file exception**

Append this negation after the global `package-lock.json` ignore in `.gitignore`:

```gitignore
!apps/playground/package-lock.json
```

Add these root scripts to `package.json` without moving playground dependencies to the root:

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

In `scripts/verify-package.mjs`, add this after `packedPaths` is created:

```js
const leakedPlaygroundFiles = packedPaths.filter((path) => path.startsWith('apps/playground/'));
if (leakedPlaygroundFiles.length > 0) {
  throw new Error(
    `Playground files leaked into the root package: ${leakedPlaygroundFiles.join(', ')}`,
  );
}
```

- [ ] **Step 8: Prove GREEN for the consumer skeleton**

Run:

```bash
npm run build
npm run playground:install
npm run playground:typecheck
npm run playground:test -- --run src/contract/public-entrypoints.test.ts
npm run playground:build
npm run pack:check
```

Expected: all commands exit `0`; `apps/playground/dist/index.html` references assets under `/ua-info/`; the root tarball contains no `apps/playground` path.

- [ ] **Step 9: Commit**

```bash
git add .gitignore package.json scripts/install-playground-package.mjs scripts/verify-package.mjs apps/playground
git commit -m "build: add packed playground consumer harness"
```

---

## Task 2: Implement Immutable State, Actions, Reducer, and Store

**Files:**
- Create: `apps/playground/src/app/playground-state.ts`
- Create: `apps/playground/src/app/playground-actions.ts`
- Create: `apps/playground/src/app/playground-reducer.ts`
- Create: `apps/playground/src/app/playground-store.ts`
- Create: `apps/playground/src/app/playground-reducer.test.ts`
- Create: `apps/playground/src/app/playground-store.test.ts`

**Interfaces:**
- Consumes: `UAResult` type exported by `services/ua-detection-service.ts`.
- Produces: `PlaygroundState`, `PlaygroundAction`, `reducePlaygroundState()`, `createPlaygroundStore()`.

- [ ] **Step 1: Write reducer tests first**

Create `apps/playground/src/app/playground-reducer.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createInitialPlaygroundState } from './playground-state';
import { reducePlaygroundState } from './playground-reducer';
import { chromeResult } from '../tests/fixtures';

describe('reducePlaygroundState', () => {
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

  it('tracks current detection success', () => {
    const loading = reducePlaygroundState(createInitialPlaygroundState(), {
      type: 'current-detection-requested',
    });
    const success = reducePlaygroundState(loading, {
      type: 'current-detection-succeeded',
      result: chromeResult,
    });

    expect(loading.current).toEqual({ status: 'loading' });
    expect(success.current).toEqual({ status: 'success', result: chromeResult });
  });

  it('schedules non-empty manual input and clears an empty input', () => {
    const initial = createInitialPlaygroundState();
    const scheduled = reducePlaygroundState(initial, {
      type: 'manual-user-agent-changed',
      value: 'Mozilla/5.0',
    });
    const empty = reducePlaygroundState(scheduled, {
      type: 'manual-user-agent-changed',
      value: '   ',
    });

    expect(scheduled.manual.parseStatus).toBe('scheduled');
    expect(empty.manual.parseStatus).toBe('idle');
    expect(empty.manual.result).toBeNull();
  });

  it('preserves the last valid result when Client Hints becomes invalid', () => {
    const withResult = reducePlaygroundState(createInitialPlaygroundState(), {
      type: 'manual-parse-succeeded',
      result: chromeResult,
    });
    const invalid = reducePlaygroundState(withResult, {
      type: 'client-hints-invalid',
      error: { code: 'invalid-json', message: 'Invalid JSON.' },
    });

    expect(invalid.manual.result).toBe(chromeResult);
    expect(invalid.manual.clientHints.error?.code).toBe('invalid-json');
  });

  it('resets all manual input and result state', () => {
    const dirty = reducePlaygroundState(createInitialPlaygroundState(), {
      type: 'sample-selected',
      sampleId: 'line-liff',
      userAgent: 'Line/26.11.0 LIFF',
      clientHintsText: '{"sec-ch-ua-mobile":"?1"}',
    });
    const reset = reducePlaygroundState(dirty, { type: 'manual-reset' });

    expect(reset.manual).toEqual(createInitialPlaygroundState().manual);
  });
});
```

Create `apps/playground/src/tests/fixtures.ts`:

```ts
import type { UAResult } from '../services/ua-detection-service';

export const chromeResult: UAResult = {
  ua: 'Mozilla/5.0 Chrome/150.0.0.0 Safari/537.36',
  browser: {
    id: 'chrome',
    name: 'Chrome',
    family: 'chromium',
    mode: 'browser',
    version: { raw: '150.0.0.0', major: 150, minor: 0 },
  },
  engine: {
    id: 'blink',
    name: 'Blink',
    version: null,
  },
  os: {
    id: 'windows',
    name: 'Windows',
    version: { raw: '10', major: 10, minor: null },
  },
  device: {
    type: 'desktop',
    vendor: null,
    model: null,
  },
  cpu: {
    architecture: 'x86_64',
    bitness: 64,
  },
  client: null,
  context: null,
};
```

- [ ] **Step 2: Run reducer tests and prove RED**

Run:

```bash
npm run playground:test -- --run src/app/playground-reducer.test.ts
```

Expected: FAIL because state, reducer, and action modules do not exist.

- [ ] **Step 3: Define state and action contracts**

Create `apps/playground/src/app/playground-state.ts`:

```ts
import type { UAResult } from '../services/ua-detection-service';

export type PlaygroundMode = 'current' | 'manual';

export type CurrentDetectionState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'success'; readonly result: UAResult }
  | { readonly status: 'error'; readonly message: string };

export type ClientHintsInputErrorCode =
  | 'too-large'
  | 'invalid-json'
  | 'invalid-root'
  | 'dangerous-key'
  | 'invalid-value';

export interface ClientHintsInputError {
  readonly code: ClientHintsInputErrorCode;
  readonly message: string;
}

export interface PlaygroundNotification {
  readonly kind: 'success' | 'error';
  readonly message: string;
}

export interface ManualDetectionState {
  readonly userAgent: string;
  readonly selectedSampleId: string | null;
  readonly clientHints: {
    readonly expanded: boolean;
    readonly text: string;
    readonly error: ClientHintsInputError | null;
  };
  readonly parseStatus: 'idle' | 'scheduled' | 'parsing' | 'success' | 'error';
  readonly result: UAResult | null;
  readonly errorMessage: string | null;
}

export interface PlaygroundState {
  readonly mode: PlaygroundMode;
  readonly current: CurrentDetectionState;
  readonly manual: ManualDetectionState;
  readonly notification: PlaygroundNotification | null;
}

export function createInitialManualState(): ManualDetectionState {
  return {
    userAgent: '',
    selectedSampleId: null,
    clientHints: {
      expanded: false,
      text: '',
      error: null,
    },
    parseStatus: 'idle',
    result: null,
    errorMessage: null,
  };
}

export function createInitialPlaygroundState(): PlaygroundState {
  return {
    mode: 'current',
    current: { status: 'idle' },
    manual: createInitialManualState(),
    notification: null,
  };
}
```

Create `apps/playground/src/app/playground-actions.ts`:

```ts
import type {
  ClientHintsInputError,
  PlaygroundMode,
  PlaygroundNotification,
} from './playground-state';
import type { UAResult } from '../services/ua-detection-service';

export type PlaygroundAction =
  | { readonly type: 'mode-selected'; readonly mode: PlaygroundMode }
  | { readonly type: 'current-detection-requested' }
  | { readonly type: 'current-detection-succeeded'; readonly result: UAResult }
  | { readonly type: 'current-detection-failed'; readonly message: string }
  | { readonly type: 'manual-user-agent-changed'; readonly value: string }
  | { readonly type: 'manual-parse-requested' }
  | { readonly type: 'manual-parse-succeeded'; readonly result: UAResult }
  | { readonly type: 'manual-parse-failed'; readonly message: string }
  | {
      readonly type: 'sample-selected';
      readonly sampleId: string;
      readonly userAgent: string;
      readonly clientHintsText: string;
    }
  | { readonly type: 'client-hints-expanded'; readonly expanded: boolean }
  | { readonly type: 'client-hints-changed'; readonly value: string }
  | { readonly type: 'client-hints-valid' }
  | { readonly type: 'client-hints-invalid'; readonly error: ClientHintsInputError }
  | { readonly type: 'manual-reset' }
  | {
      readonly type: 'notification-shown';
      readonly notification: PlaygroundNotification;
    }
  | { readonly type: 'notification-cleared' };
```

- [ ] **Step 4: Implement the pure reducer**

Create `apps/playground/src/app/playground-reducer.ts`:

```ts
import type { PlaygroundAction } from './playground-actions';
import {
  createInitialManualState,
  type PlaygroundState,
} from './playground-state';

export function reducePlaygroundState(
  state: PlaygroundState,
  action: PlaygroundAction,
): PlaygroundState {
  switch (action.type) {
    case 'mode-selected':
      return action.mode === state.mode ? state : { ...state, mode: action.mode };
    case 'current-detection-requested':
      return { ...state, current: { status: 'loading' } };
    case 'current-detection-succeeded':
      return { ...state, current: { status: 'success', result: action.result } };
    case 'current-detection-failed':
      return { ...state, current: { status: 'error', message: action.message } };
    case 'manual-user-agent-changed': {
      const empty = action.value.trim().length === 0;
      return {
        ...state,
        manual: {
          ...state.manual,
          userAgent: action.value,
          selectedSampleId: null,
          parseStatus: empty ? 'idle' : 'scheduled',
          result: empty ? null : state.manual.result,
          errorMessage: null,
        },
      };
    }
    case 'manual-parse-requested':
      return {
        ...state,
        manual: {
          ...state.manual,
          parseStatus: 'parsing',
          errorMessage: null,
        },
      };
    case 'manual-parse-succeeded':
      return {
        ...state,
        manual: {
          ...state.manual,
          parseStatus: 'success',
          result: action.result,
          errorMessage: null,
        },
      };
    case 'manual-parse-failed':
      return {
        ...state,
        manual: {
          ...state.manual,
          parseStatus: 'error',
          errorMessage: action.message,
        },
      };
    case 'sample-selected':
      return {
        ...state,
        manual: {
          ...state.manual,
          userAgent: action.userAgent,
          selectedSampleId: action.sampleId,
          clientHints: {
            ...state.manual.clientHints,
            text: action.clientHintsText,
            error: null,
          },
          parseStatus: 'scheduled',
          errorMessage: null,
        },
      };
    case 'client-hints-expanded':
      return {
        ...state,
        manual: {
          ...state.manual,
          clientHints: {
            ...state.manual.clientHints,
            expanded: action.expanded,
          },
        },
      };
    case 'client-hints-changed':
      return {
        ...state,
        manual: {
          ...state.manual,
          clientHints: {
            ...state.manual.clientHints,
            text: action.value,
            error: null,
          },
          parseStatus:
            state.manual.userAgent.trim().length > 0 ? 'scheduled' : 'idle',
        },
      };
    case 'client-hints-valid':
      return {
        ...state,
        manual: {
          ...state.manual,
          clientHints: { ...state.manual.clientHints, error: null },
        },
      };
    case 'client-hints-invalid':
      return {
        ...state,
        manual: {
          ...state.manual,
          parseStatus: 'error',
          clientHints: { ...state.manual.clientHints, error: action.error },
        },
      };
    case 'manual-reset':
      return { ...state, manual: createInitialManualState() };
    case 'notification-shown':
      return { ...state, notification: action.notification };
    case 'notification-cleared':
      return state.notification === null ? state : { ...state, notification: null };
  }
}
```

- [ ] **Step 5: Write the store test, prove RED, then implement the store**

Create `apps/playground/src/app/playground-store.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { createPlaygroundStore } from './playground-store';

describe('createPlaygroundStore', () => {
  it('notifies subscribers only when the state reference changes', () => {
    const store = createPlaygroundStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.dispatch({ type: 'mode-selected', mode: 'current' });
    store.dispatch({ type: 'mode-selected', mode: 'manual' });
    unsubscribe();
    store.dispatch({ type: 'mode-selected', mode: 'current' });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0]?.[0].mode).toBe('manual');
  });
});
```

Run:

```bash
npm run playground:test -- --run src/app/playground-store.test.ts
```

Expected: FAIL because `playground-store.ts` does not exist.

Create `apps/playground/src/app/playground-store.ts`:

```ts
import type { PlaygroundAction } from './playground-actions';
import { reducePlaygroundState } from './playground-reducer';
import {
  createInitialPlaygroundState,
  type PlaygroundState,
} from './playground-state';

export interface PlaygroundStore {
  getState(): PlaygroundState;
  dispatch(action: PlaygroundAction): void;
  subscribe(listener: (state: PlaygroundState) => void): () => void;
}

export function createPlaygroundStore(
  initialState: PlaygroundState = createInitialPlaygroundState(),
): PlaygroundStore {
  let state = initialState;
  const listeners = new Set<(state: PlaygroundState) => void>();

  return {
    getState: () => state,
    dispatch(action) {
      const next = reducePlaygroundState(state, action);
      if (next === state) return;
      state = next;
      for (const listener of listeners) listener(state);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
```

- [ ] **Step 6: Run GREEN checks**

```bash
npm run playground:test -- --run src/app/playground-reducer.test.ts src/app/playground-store.test.ts
npm run playground:typecheck
```

Expected: all tests and type-check pass.

- [ ] **Step 7: Commit**

```bash
git add apps/playground/src/app apps/playground/src/tests/fixtures.ts
git commit -m "feat: add playground state foundation"
```

---

## Task 3: Add Safe Client Hints Parsing and Cancellable Debounce

**Files:**
- Create: `apps/playground/src/services/client-hints-input.ts`
- Create: `apps/playground/src/services/client-hints-input.test.ts`
- Create: `apps/playground/src/services/debounce.ts`
- Create: `apps/playground/src/services/debounce.test.ts`

**Interfaces:**
- Consumes: `ClientHintsInputError` from state and `HeaderRecord` shape from the public server contract.
- Produces: `parseClientHintsInput()`, `createDebounce()`.

- [ ] **Step 1: Write Client Hints validation tests**

Create `apps/playground/src/services/client-hints-input.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { parseClientHintsInput } from './client-hints-input';

describe('parseClientHintsInput', () => {
  it('treats blank input as no Client Hints', () => {
    expect(parseClientHintsInput('   ')).toEqual({ ok: true, headers: null });
  });

  it('normalizes valid header keys and string arrays', () => {
    expect(
      parseClientHintsInput(
        '{"Sec-CH-UA-Platform":"\\"Android\\"","x-example":["one","two"]}',
      ),
    ).toEqual({
      ok: true,
      headers: {
        'sec-ch-ua-platform': '"Android"',
        'x-example': ['one', 'two'],
      },
    });
  });

  it.each(['[]', 'null', '"value"', '42'])('rejects a non-object root: %s', (text) => {
    const result = parseClientHintsInput(text);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('invalid-root');
  });

  it.each(['__proto__', 'prototype', 'constructor'])(
    'rejects dangerous key %s',
    (key) => {
      const result = parseClientHintsInput(`{"${key}":"blocked"}`);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('dangerous-key');
    },
  );

  it('rejects unsupported header values', () => {
    const result = parseClientHintsInput('{"sec-ch-ua-mobile":true}');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('invalid-value');
  });
});
```

- [ ] **Step 2: Run the validation test and prove RED**

```bash
npm run playground:test -- --run src/services/client-hints-input.test.ts
```

Expected: FAIL because `parseClientHintsInput()` does not exist.

- [ ] **Step 3: Implement bounded safe parsing**

Create `apps/playground/src/services/client-hints-input.ts`:

```ts
import type { HeaderRecord } from 'ua-info/server';
import type { ClientHintsInputError } from '../app/playground-state';

const MAX_CLIENT_HINTS_LENGTH = 32_768;
const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

type ParseClientHintsResult =
  | { readonly ok: true; readonly headers: HeaderRecord | null }
  | { readonly ok: false; readonly error: ClientHintsInputError };

function failure(
  code: ClientHintsInputError['code'],
  message: string,
): ParseClientHintsResult {
  return { ok: false, error: { code, message } };
}

export function parseClientHintsInput(text: string): ParseClientHintsResult {
  if (text.trim().length === 0) return { ok: true, headers: null };
  if (text.length > MAX_CLIENT_HINTS_LENGTH) {
    return failure('too-large', 'Client Hints JSON must not exceed 32 KiB.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return failure(
      'invalid-json',
      error instanceof Error ? error.message : 'Client Hints JSON is invalid.',
    );
  }

  if (parsed === null || Array.isArray(parsed) || typeof parsed !== 'object') {
    return failure('invalid-root', 'Client Hints must be a JSON object.');
  }

  const headers: Record<string, string | readonly string[]> = Object.create(null);
  for (const [rawKey, value] of Object.entries(parsed)) {
    const key = rawKey.toLowerCase();
    if (DANGEROUS_KEYS.has(key)) {
      return failure('dangerous-key', `Client Hints key "${rawKey}" is not allowed.`);
    }
    if (typeof value === 'string') {
      headers[key] = value;
      continue;
    }
    if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
      headers[key] = Object.freeze([...value]);
      continue;
    }
    return failure(
      'invalid-value',
      `Header "${rawKey}" must be a string or an array of strings.`,
    );
  }

  return { ok: true, headers: Object.freeze(headers) };
}
```

- [ ] **Step 4: Write debounce tests and prove RED**

Create `apps/playground/src/services/debounce.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDebounce } from './debounce';

describe('createDebounce', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('runs only the latest scheduled callback after 300 ms', () => {
    const first = vi.fn();
    const second = vi.fn();
    const debounce = createDebounce(300);

    debounce.schedule(first);
    vi.advanceTimersByTime(200);
    debounce.schedule(second);
    vi.advanceTimersByTime(299);
    expect(first).not.toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(second).toHaveBeenCalledOnce();
  });

  it('flushes immediately and cancels pending work', () => {
    const callback = vi.fn();
    const debounce = createDebounce(300);
    debounce.schedule(callback);
    debounce.flush();
    vi.runAllTimers();
    expect(callback).toHaveBeenCalledOnce();
  });

  it('cancels pending work on destroy', () => {
    const callback = vi.fn();
    const debounce = createDebounce(300);
    debounce.schedule(callback);
    debounce.destroy();
    vi.runAllTimers();
    expect(callback).not.toHaveBeenCalled();
  });
});
```

Run:

```bash
npm run playground:test -- --run src/services/debounce.test.ts
```

Expected: FAIL because `createDebounce()` does not exist.

- [ ] **Step 5: Implement the debounce controller**

Create `apps/playground/src/services/debounce.ts`:

```ts
export interface DebounceController {
  schedule(callback: () => void): void;
  flush(): void;
  cancel(): void;
  destroy(): void;
}

export function createDebounce(delayMs: number): DebounceController {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: (() => void) | null = null;
  let destroyed = false;

  const cancel = (): void => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    pending = null;
  };

  return {
    schedule(callback) {
      if (destroyed) return;
      cancel();
      pending = callback;
      timer = setTimeout(() => {
        const next = pending;
        timer = null;
        pending = null;
        next?.();
      }, delayMs);
    },
    flush() {
      if (destroyed) return;
      const next = pending;
      cancel();
      next?.();
    },
    cancel,
    destroy() {
      destroyed = true;
      cancel();
    },
  };
}
```

- [ ] **Step 6: Run GREEN checks**

```bash
npm run playground:test -- --run src/services/client-hints-input.test.ts src/services/debounce.test.ts
npm run playground:typecheck
```

Expected: all tests and type-check pass.

- [ ] **Step 7: Commit**

```bash
git add apps/playground/src/services/client-hints-input* apps/playground/src/services/debounce*
git commit -m "feat: validate playground input safely"
```

---

## Task 4: Add the Sample Corpus and Pure Result View Models

**Files:**
- Create: `apps/playground/src/samples/sample-types.ts`
- Create: `apps/playground/src/samples/browser-samples.ts`
- Create: `apps/playground/src/samples/webview-samples.ts`
- Create: `apps/playground/src/samples/application-samples.ts`
- Create: `apps/playground/src/samples/automation-samples.ts`
- Create: `apps/playground/src/samples/index.ts`
- Create: `apps/playground/src/samples/samples.test.ts`
- Create: `apps/playground/src/app/playground-view-model.ts`
- Create: `apps/playground/src/app/playground-view-model.test.ts`

**Interfaces:**
- Consumes: public `UAResult` shape and readonly Client Hints header values.
- Produces: `USER_AGENT_SAMPLES`, `findUserAgentSample()`, `createDetectionSummary()`, `createResultCards()`, `createCodeExample()`.

- [ ] **Step 1: Write sample and view-model tests first**

Create `apps/playground/src/samples/samples.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { USER_AGENT_SAMPLES, findUserAgentSample } from './index';

const requiredIds = [
  'chrome-windows',
  'edge-windows',
  'firefox-linux',
  'safari-macos',
  'chrome-android',
  'safari-iphone',
  'android-webview',
  'ios-wkwebview',
  'line-liff',
  'line-in-app',
  'facebook-in-app',
  'instagram-in-app',
  'tiktok-in-app',
  'headless-chrome',
  'googlebot',
  'curl',
  'unknown-client',
] as const;

describe('USER_AGENT_SAMPLES', () => {
  it('contains every required baseline sample exactly once', () => {
    expect(new Set(USER_AGENT_SAMPLES.map((sample) => sample.id)).size).toBe(
      USER_AGENT_SAMPLES.length,
    );
    for (const id of requiredIds) expect(findUserAgentSample(id)?.id).toBe(id);
  });

  it('includes Client Hints for the LINE LIFF regression sample', () => {
    expect(findUserAgentSample('line-liff')?.clientHints).toMatchObject({
      'sec-ch-ua-mobile': '?1',
      'sec-ch-ua-platform': '"Android"',
    });
  });
});
```

Create `apps/playground/src/app/playground-view-model.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { chromeResult } from '../tests/fixtures';
import {
  createCodeExample,
  createDetectionSummary,
  createResultCards,
} from './playground-view-model';

describe('playground result view models', () => {
  it('keeps browser mode and context as separate summary dimensions', () => {
    const summary = createDetectionSummary({
      ...chromeResult,
      browser: { ...chromeResult.browser!, mode: 'webview' },
      context: {
        kind: 'mini-app',
        id: 'liff',
        name: 'LIFF',
        host: {
          id: 'line',
          name: 'LINE',
          version: { raw: '26.11.0', major: 26, minor: 11 },
        },
      },
    });

    expect(summary.browser).toBe('Chrome 150.0.0.0');
    expect(summary.mode).toBe('WebView');
    expect(summary.contextHost).toBe('LINE 26.11.0');
    expect(summary.contextSurface).toBe('LIFF');
  });

  it('uses Not detected for absent card values', () => {
    const cards = createResultCards({
      ...chromeResult,
      client: null,
      context: null,
      cpu: null,
    });
    expect(cards.find((card) => card.id === 'client')?.rows[0]?.value).toBe(
      'Not detected',
    );
  });

  it('selects the public API example for each mode', () => {
    expect(createCodeExample('current', false)).toContain("from 'ua-info/browser'");
    expect(createCodeExample('manual', false)).toContain("from 'ua-info'");
    expect(createCodeExample('manual', true)).toContain("from 'ua-info/server'");
  });
});
```

- [ ] **Step 2: Run the tests and prove RED**

```bash
npm run playground:test -- --run src/samples/samples.test.ts src/app/playground-view-model.test.ts
```

Expected: FAIL because the sample catalog and view-model mapper do not exist.

- [ ] **Step 3: Define sample contracts and complete baseline data**

Create `apps/playground/src/samples/sample-types.ts`:

```ts
import type { HeaderRecord } from 'ua-info/server';

export type SampleCategory =
  | 'Desktop browsers'
  | 'Mobile browsers'
  | 'WebViews'
  | 'Applications and mini-apps'
  | 'Automation and bots'
  | 'HTTP clients'
  | 'Unknown or malformed';

export interface UserAgentSample {
  readonly id: string;
  readonly label: string;
  readonly category: SampleCategory;
  readonly userAgent: string;
  readonly clientHints?: HeaderRecord;
}
```

Create `browser-samples.ts`, `webview-samples.ts`, `application-samples.ts`, and `automation-samples.ts` with these exact IDs and representative values:

```ts
// browser-samples.ts
import type { UserAgentSample } from './sample-types';

export const browserSamples: readonly UserAgentSample[] = [
  {
    id: 'chrome-windows',
    label: 'Chrome on Windows',
    category: 'Desktop browsers',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
  },
  {
    id: 'edge-windows',
    label: 'Edge on Windows',
    category: 'Desktop browsers',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0',
  },
  {
    id: 'firefox-linux',
    label: 'Firefox on Linux',
    category: 'Desktop browsers',
    userAgent:
      'Mozilla/5.0 (X11; Linux x86_64; rv:145.0) Gecko/20100101 Firefox/145.0',
  },
  {
    id: 'safari-macos',
    label: 'Safari on macOS',
    category: 'Desktop browsers',
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
      'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15',
  },
  {
    id: 'chrome-android',
    label: 'Chrome on Android',
    category: 'Mobile browsers',
    userAgent:
      'Mozilla/5.0 (Linux; Android 16; Pixel 9 Pro) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',
  },
  {
    id: 'safari-iphone',
    label: 'Safari on iPhone',
    category: 'Mobile browsers',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) ' +
      'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 ' +
      'Mobile/15E148 Safari/604.1',
  },
];
```

```ts
// webview-samples.ts
import type { UserAgentSample } from './sample-types';

export const webviewSamples: readonly UserAgentSample[] = [
  {
    id: 'android-webview',
    label: 'Android Chrome WebView',
    category: 'WebViews',
    userAgent:
      'Mozilla/5.0 (Linux; Android 16; Pixel 9 Pro Build/BP2A; wv) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 ' +
      'Chrome/150.0.7871.46 Mobile Safari/537.36',
  },
  {
    id: 'ios-wkwebview',
    label: 'iOS WKWebView',
    category: 'WebViews',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) ' +
      'AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
  },
];
```

```ts
// application-samples.ts
import type { UserAgentSample } from './sample-types';

const androidWebView =
  'Mozilla/5.0 (Linux; Android 16; 2407FPN8EG Build/BP2A; wv) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 ' +
  'Chrome/150.0.7871.46 Mobile Safari/537.36';

export const applicationSamples: readonly UserAgentSample[] = [
  {
    id: 'line-liff',
    label: 'LINE LIFF',
    category: 'Applications and mini-apps',
    userAgent: `${androidWebView} Line/26.11.0 LIFF`,
    clientHints: {
      'sec-ch-ua': '"Google Chrome";v="150", "Chromium";v="150"',
      'sec-ch-ua-mobile': '?1',
      'sec-ch-ua-platform': '"Android"',
      'sec-ch-ua-platform-version': '"16"',
      'sec-ch-ua-model': '"2407FPN8EG"',
    },
  },
  {
    id: 'line-in-app',
    label: 'LINE in-app browser',
    category: 'Applications and mini-apps',
    userAgent: `${androidWebView} Line/26.11.0`,
  },
  {
    id: 'facebook-in-app',
    label: 'Facebook in-app browser',
    category: 'Applications and mini-apps',
    userAgent: `${androidWebView} [FBAN/FB4A;FBAV/530.0.0.0.0;]`,
  },
  {
    id: 'instagram-in-app',
    label: 'Instagram in-app browser',
    category: 'Applications and mini-apps',
    userAgent: `${androidWebView} Instagram 400.0.0.0 Android`,
  },
  {
    id: 'tiktok-in-app',
    label: 'TikTok in-app browser',
    category: 'Applications and mini-apps',
    userAgent: `${androidWebView} musical_ly_2026 TikTok/40.0.0`,
  },
];
```

```ts
// automation-samples.ts
import type { UserAgentSample } from './sample-types';

export const automationSamples: readonly UserAgentSample[] = [
  {
    id: 'headless-chrome',
    label: 'Headless Chrome',
    category: 'Automation and bots',
    userAgent:
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) HeadlessChrome/150.0.0.0 Safari/537.36',
  },
  {
    id: 'googlebot',
    label: 'Googlebot Smartphone',
    category: 'Automation and bots',
    userAgent:
      'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 ' +
      'Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  },
  {
    id: 'curl',
    label: 'curl',
    category: 'HTTP clients',
    userAgent: 'curl/8.10.1',
  },
  {
    id: 'unknown-client',
    label: 'Unknown client',
    category: 'Unknown or malformed',
    userAgent: 'ExampleClient/1.0',
  },
];
```

Create `apps/playground/src/samples/index.ts`:

```ts
import { applicationSamples } from './application-samples';
import { automationSamples } from './automation-samples';
import { browserSamples } from './browser-samples';
import type { UserAgentSample } from './sample-types';
import { webviewSamples } from './webview-samples';

export type { SampleCategory, UserAgentSample } from './sample-types';

export const USER_AGENT_SAMPLES: readonly UserAgentSample[] = Object.freeze([
  ...browserSamples,
  ...webviewSamples,
  ...applicationSamples,
  ...automationSamples,
]);

export function findUserAgentSample(id: string): UserAgentSample | undefined {
  return USER_AGENT_SAMPLES.find((sample) => sample.id === id);
}
```

- [ ] **Step 4: Implement view-model mapping**

Create `apps/playground/src/app/playground-view-model.ts` with these complete contracts and mapping rules:

```ts
import type { PlaygroundMode } from './playground-state';
import type { UAResult } from '../services/ua-detection-service';

const NOT_DETECTED = 'Not detected';

export interface DetectionSummaryViewModel {
  readonly browser: string;
  readonly mode: string;
  readonly contextHost: string;
  readonly contextSurface: string;
  readonly os: string;
  readonly device: string;
}

export interface ResultCardViewModel {
  readonly id: string;
  readonly title: string;
  readonly rows: readonly {
    readonly label: string;
    readonly value: string;
    readonly detected: boolean;
  }[];
}

function humanize(value: string): string {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
    .replace('Webview', 'WebView');
}

function productLabel(
  product: { readonly name: string; readonly version: { readonly raw: string } | null } | null,
): string {
  if (!product) return NOT_DETECTED;
  return product.version ? `${product.name} ${product.version.raw}` : product.name;
}

function row(label: string, value: string | number | null | undefined) {
  const detected = value !== null && value !== undefined && value !== '';
  return {
    label,
    value: detected ? String(value) : NOT_DETECTED,
    detected,
  } as const;
}

export function createDetectionSummary(
  result: UAResult,
): DetectionSummaryViewModel {
  return {
    browser: productLabel(result.browser),
    mode: result.browser ? humanize(result.browser.mode) : NOT_DETECTED,
    contextHost: productLabel(result.context?.host ?? null),
    contextSurface: result.context?.name ?? NOT_DETECTED,
    os: productLabel(result.os),
    device: humanize(result.device.type),
  };
}

export function createResultCards(result: UAResult): readonly ResultCardViewModel[] {
  return [
    {
      id: 'browser',
      title: 'Browser',
      rows: [
        row('Name', result.browser?.name),
        row('ID', result.browser?.id),
        row('Family', result.browser?.family),
        row('Mode', result.browser ? humanize(result.browser.mode) : null),
        row('Version', result.browser?.version?.raw),
      ],
    },
    {
      id: 'context',
      title: 'Context',
      rows: [
        row('Kind', result.context ? humanize(result.context.kind) : null),
        row('ID', result.context?.id),
        row('Surface', result.context?.name),
        row('Host', productLabel(result.context?.host ?? null)),
      ],
    },
    {
      id: 'client',
      title: 'Client',
      rows: [
        row('Name', result.client?.name),
        row('ID', result.client?.id),
        row('Kind', result.client ? humanize(result.client.kind) : null),
        row('Version', result.client?.version?.raw),
      ],
    },
    {
      id: 'engine',
      title: 'Engine',
      rows: [
        row('Name', result.engine?.name),
        row('ID', result.engine?.id),
        row('Version', result.engine?.version?.raw),
      ],
    },
    {
      id: 'os',
      title: 'Operating System',
      rows: [
        row('Name', result.os?.name),
        row('ID', result.os?.id),
        row('Version', result.os?.version?.raw),
      ],
    },
    {
      id: 'device',
      title: 'Device',
      rows: [
        row('Type', humanize(result.device.type)),
        row('Vendor', result.device.vendor),
        row('Model', result.device.model),
      ],
    },
    {
      id: 'cpu',
      title: 'CPU',
      rows: [
        row('Architecture', result.cpu?.architecture),
        row('Bitness', result.cpu?.bitness ? `${result.cpu.bitness}-bit` : null),
      ],
    },
  ];
}

export function createCodeExample(
  mode: PlaygroundMode,
  hasClientHints: boolean,
): string {
  if (mode === 'current') {
    return `import { detectCurrent } from 'ua-info/browser';\n\nconst info = await detectCurrent();\nconsole.log(info);`;
  }
  if (hasClientHints) {
    return `import { parseRequest } from 'ua-info/server';\n\nconst info = parseRequest({\n  userAgent,\n  headers: clientHints,\n});\nconsole.log(info);`;
  }
  return `import { parse } from 'ua-info';\n\nconst info = parse(userAgent);\nconsole.log(info);`;
}
```

- [ ] **Step 5: Run GREEN checks**

```bash
npm run playground:test -- --run src/samples/samples.test.ts src/app/playground-view-model.test.ts
npm run playground:typecheck
```

Expected: all tests and type-check pass.

- [ ] **Step 6: Commit**

```bash
git add apps/playground/src/samples apps/playground/src/app/playground-view-model*
git commit -m "feat: add playground samples and result models"
```

---

## Task 5: Build DOM Component Primitives and the Persistent Application Shell

**Files:**
- Create: `apps/playground/src/components/component.ts`
- Create: `apps/playground/src/components/component.test.ts`
- Create: `apps/playground/src/components/app-header.ts`
- Create: `apps/playground/src/components/mode-selector.ts`
- Create: `apps/playground/src/components/mode-selector.test.ts`
- Create: `apps/playground/src/components/status-message.ts`
- Create: `apps/playground/src/components/privacy-notice.ts`
- Create: `apps/playground/src/app/create-playground-app.ts`
- Create: `apps/playground/src/app/create-playground-app.test.ts`
- Modify: `apps/playground/src/main.ts`

**Interfaces:**
- Consumes: `PlaygroundStore`, injected component callbacks, `__UA_INFO_VERSION__`.
- Produces: `Component<TModel>`, listener cleanup helpers, persistent application shell, `createPlaygroundApp()` lifecycle.

- [ ] **Step 1: Write component cleanup and shell stability tests**

Create `apps/playground/src/components/component.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { createCleanup } from './component';

describe('createCleanup', () => {
  it('removes registered event listeners on destroy', () => {
    const button = document.createElement('button');
    const handler = vi.fn();
    const cleanup = createCleanup();
    cleanup.listen(button, 'click', handler);
    button.click();
    cleanup.destroy();
    button.click();
    expect(handler).toHaveBeenCalledOnce();
  });
});
```

Create `apps/playground/src/components/mode-selector.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { createModeSelector } from './mode-selector';

describe('createModeSelector', () => {
  it('exposes accessible selected tabs and emits manual mode', () => {
    const onModeSelected = vi.fn();
    const component = createModeSelector({ onModeSelected });
    document.body.append(component.element);
    component.update({ mode: 'current' });

    const current = component.element.querySelector<HTMLButtonElement>(
      '[data-mode="current"]',
    );
    const manual = component.element.querySelector<HTMLButtonElement>(
      '[data-mode="manual"]',
    );
    manual?.click();

    expect(current?.getAttribute('aria-selected')).toBe('true');
    expect(manual?.getAttribute('aria-selected')).toBe('false');
    expect(onModeSelected).toHaveBeenCalledWith('manual');
  });
});
```

Create `apps/playground/src/app/create-playground-app.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createPlaygroundApp } from './create-playground-app';

const never = () => new Promise<never>(() => undefined);

describe('createPlaygroundApp', () => {
  it('keeps the same application shell when state changes', () => {
    const app = createPlaygroundApp({
      detectionService: {
        detectCurrent: never,
        parseUserAgent: () => {
          throw new Error('not used');
        },
        parseRequest: never,
      },
    });
    const shell = app.element;
    app.selectMode('manual');
    expect(app.element).toBe(shell);
    app.destroy();
  });
});
```

- [ ] **Step 2: Run tests and prove RED**

```bash
npm run playground:test -- --run src/components/component.test.ts src/components/mode-selector.test.ts src/app/create-playground-app.test.ts
```

Expected: FAIL because component and application modules do not exist.

- [ ] **Step 3: Implement component lifecycle primitives**

Create `apps/playground/src/components/component.ts`:

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

export function createCleanup(): Cleanup {
  const disposers: Array<() => void> = [];
  let destroyed = false;

  return {
    listen(target, type, listener) {
      if (destroyed) return;
      const eventListener = listener as EventListener;
      target.addEventListener(type, eventListener);
      disposers.push(() => target.removeEventListener(type, eventListener));
    },
    add(dispose) {
      if (destroyed) dispose();
      else disposers.push(dispose);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      for (const dispose of disposers.splice(0).reverse()) dispose();
    },
  };
}
```

- [ ] **Step 4: Implement static shell components**

Implement `app-header.ts`, `mode-selector.ts`, `status-message.ts`, and `privacy-notice.ts` using only `document.createElement`, `textContent`, element properties, and the `Component<TModel>` contract.

The exact `mode-selector.ts` behavior is:

```ts
import type { PlaygroundMode } from '../app/playground-state';
import { createCleanup, type Component } from './component';

interface ModeSelectorModel {
  readonly mode: PlaygroundMode;
}

interface ModeSelectorCallbacks {
  readonly onModeSelected: (mode: PlaygroundMode) => void;
}

export function createModeSelector(
  callbacks: ModeSelectorCallbacks,
): Component<ModeSelectorModel> {
  const cleanup = createCleanup();
  const element = document.createElement('div');
  element.className = 'ua-playground-mode-selector';
  element.setAttribute('role', 'tablist');
  element.setAttribute('aria-label', 'Detection mode');

  const current = document.createElement('button');
  current.type = 'button';
  current.dataset.mode = 'current';
  current.setAttribute('role', 'tab');
  current.textContent = 'Current Browser';

  const manual = document.createElement('button');
  manual.type = 'button';
  manual.dataset.mode = 'manual';
  manual.setAttribute('role', 'tab');
  manual.textContent = 'Manual User-Agent';

  cleanup.listen(current, 'click', () => callbacks.onModeSelected('current'));
  cleanup.listen(manual, 'click', () => callbacks.onModeSelected('manual'));
  element.append(current, manual);

  return {
    element,
    update(model) {
      current.setAttribute('aria-selected', String(model.mode === 'current'));
      manual.setAttribute('aria-selected', String(model.mode === 'manual'));
      current.tabIndex = model.mode === 'current' ? 0 : -1;
      manual.tabIndex = model.mode === 'manual' ? 0 : -1;
    },
    destroy: cleanup.destroy,
  };
}
```

`app-header.ts` displays `UA Info`, `v${__UA_INFO_VERSION__}`, a short explanation, and safe static anchors to the GitHub repository and npm package. `privacy-notice.ts` contains the exact sentence `Detection happens locally in your browser. No data is uploaded.`

- [ ] **Step 5: Implement the persistent application composition**

Create `create-playground-app.ts` with an injected detection service, a root `main` element, static header/mode/workspace/privacy regions, one store subscription, and stable component instances. At this checkpoint the workspace may expose labelled current and manual panel containers without detection controls; Task 6 and Task 7 own those controls.

Required public contract:

```ts
import { createPlaygroundStore } from './playground-store';
import type { PlaygroundMode } from './playground-state';
import {
  createUADetectionService,
  type UADetectionService,
} from '../services/ua-detection-service';
import { createAppHeader } from '../components/app-header';
import { createModeSelector } from '../components/mode-selector';
import { createPrivacyNotice } from '../components/privacy-notice';

export interface PlaygroundApp {
  readonly element: HTMLElement;
  start(): void;
  selectMode(mode: PlaygroundMode): void;
  destroy(): void;
}

export function createPlaygroundApp(
  options: { readonly detectionService?: UADetectionService } = {},
): PlaygroundApp {
  const detectionService = options.detectionService ?? createUADetectionService();
  void detectionService;
  const store = createPlaygroundStore();
  const element = document.createElement('main');
  element.className = 'ua-playground-shell';

  const header = createAppHeader();
  const modeSelector = createModeSelector({
    onModeSelected: (mode) => store.dispatch({ type: 'mode-selected', mode }),
  });
  const workspace = document.createElement('section');
  workspace.className = 'ua-playground-workspace';
  workspace.setAttribute('aria-label', 'User-Agent playground');
  const currentPanel = document.createElement('section');
  currentPanel.dataset.panel = 'current';
  currentPanel.setAttribute('role', 'tabpanel');
  const manualPanel = document.createElement('section');
  manualPanel.dataset.panel = 'manual';
  manualPanel.setAttribute('role', 'tabpanel');
  workspace.append(currentPanel, manualPanel);
  const privacy = createPrivacyNotice();
  element.append(header.element, modeSelector.element, workspace, privacy.element);

  const render = (): void => {
    const state = store.getState();
    modeSelector.update({ mode: state.mode });
    currentPanel.hidden = state.mode !== 'current';
    manualPanel.hidden = state.mode !== 'manual';
  };
  const unsubscribe = store.subscribe(render);
  render();

  return {
    element,
    start: render,
    selectMode: (mode) => store.dispatch({ type: 'mode-selected', mode }),
    destroy() {
      unsubscribe();
      modeSelector.destroy();
      header.destroy();
      privacy.destroy();
    },
  };
}
```

- [ ] **Step 6: Replace bootstrap with application startup**

Update `src/main.ts`:

```ts
import { createPlaygroundApp } from './app/create-playground-app';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Playground root element was not found.');

const app = createPlaygroundApp();
root.append(app.element);
app.start();
```

- [ ] **Step 7: Run GREEN checks**

```bash
npm run playground:test -- --run src/components/component.test.ts src/components/mode-selector.test.ts src/app/create-playground-app.test.ts
npm run playground:typecheck
npm run playground:build
```

Expected: tests, type-check, and build pass; `createPlaygroundApp()` keeps one shell element.

- [ ] **Step 8: Commit**

```bash
git add apps/playground/src/components apps/playground/src/app/create-playground-app* apps/playground/src/main.ts
git commit -m "feat: add persistent playground shell"
```

---

## Task 6: Implement Current Browser Detection End to End

**Files:**
- Create: `apps/playground/src/app/current-detection-effect.ts`
- Create: `apps/playground/src/app/current-detection-effect.test.ts`
- Create: `apps/playground/src/components/current-browser-panel.ts`
- Create: `apps/playground/src/components/current-browser-panel.test.ts`
- Modify: `apps/playground/src/app/create-playground-app.ts`
- Modify: `apps/playground/src/app/create-playground-app.test.ts`

**Interfaces:**
- Consumes: `PlaygroundStore`, `UADetectionService.detectCurrent()`, current state actions.
- Produces: `CurrentDetectionEffect`, retry callback, loading/error/success panel model.

- [ ] **Step 1: Write current-effect and panel tests**

Test these exact behaviors:

```ts
it('dispatches loading then success for the latest request', async () => {
  const store = createPlaygroundStore();
  const detectionService = {
    detectCurrent: vi.fn().mockResolvedValue(chromeResult),
    parseUserAgent: vi.fn(),
    parseRequest: vi.fn(),
  };
  const effect = createCurrentDetectionEffect({ store, detectionService });
  await effect.detect();
  expect(store.getState().current).toEqual({ status: 'success', result: chromeResult });
});

it('maps a failure to a readable message without throwing', async () => {
  const store = createPlaygroundStore();
  const effect = createCurrentDetectionEffect({
    store,
    detectionService: {
      detectCurrent: vi.fn().mockRejectedValue(new Error('permission denied')),
      parseUserAgent: vi.fn(),
      parseRequest: vi.fn(),
    },
  });
  await effect.detect();
  expect(store.getState().current).toEqual({
    status: 'error',
    message: 'permission denied',
  });
});
```

Panel DOM tests must verify:

```ts
expect(panel.element.querySelector('[role="status"]')?.textContent).toContain(
  'Detecting',
);
expect(panel.element.querySelector('[role="alert"]')?.textContent).toContain(
  'Current browser detection failed',
);
retryButton.click();
expect(onRetry).toHaveBeenCalledOnce();
```

- [ ] **Step 2: Run tests and prove RED**

```bash
npm run playground:test -- --run src/app/current-detection-effect.test.ts src/components/current-browser-panel.test.ts
```

Expected: FAIL because effect and panel modules do not exist.

- [ ] **Step 3: Implement stale-safe current detection**

Create `current-detection-effect.ts`:

```ts
import type { PlaygroundStore } from './playground-store';
import type { UADetectionService } from '../services/ua-detection-service';

export interface CurrentDetectionEffect {
  detect(): Promise<void>;
  destroy(): void;
}

export function createCurrentDetectionEffect(input: {
  readonly store: PlaygroundStore;
  readonly detectionService: UADetectionService;
}): CurrentDetectionEffect {
  let generation = 0;
  let destroyed = false;

  return {
    async detect() {
      const requestGeneration = ++generation;
      input.store.dispatch({ type: 'current-detection-requested' });
      try {
        const result = await input.detectionService.detectCurrent();
        if (destroyed || requestGeneration !== generation) return;
        input.store.dispatch({ type: 'current-detection-succeeded', result });
      } catch (error) {
        if (destroyed || requestGeneration !== generation) return;
        input.store.dispatch({
          type: 'current-detection-failed',
          message: error instanceof Error ? error.message : 'Current browser detection failed.',
        });
      }
    },
    destroy() {
      destroyed = true;
      generation += 1;
    },
  };
}
```

- [ ] **Step 4: Implement the current-browser panel**

The component owns one heading, one `status-message` region, one retry button, and one result outlet. Its `update()` maps:

- `idle` → explanatory text and Detect button
- `loading` → `role="status"`, `aria-live="polite"`, retry hidden
- `error` → `role="alert"`, message `Current browser detection failed. You can still use Manual User-Agent mode.`, retry visible
- `success` → status text `Detection complete`, retry label `Refresh detection`

The component never calls `detectCurrent()` itself; it only emits `onRetry`.

- [ ] **Step 5: Integrate startup and retry into the persistent app**

Update `createPlaygroundApp()` to create one current panel and one current effect, update the panel from `state.current`, call `void currentEffect.detect()` once from `start()`, and call `currentEffect.destroy()` from app destruction. Guard `start()` so a second call does not launch a duplicate detection.

- [ ] **Step 6: Run GREEN integration checks**

```bash
npm run playground:test -- --run src/app/current-detection-effect.test.ts src/components/current-browser-panel.test.ts src/app/create-playground-app.test.ts
npm run playground:typecheck
```

Expected: current detection success, failure, retry, and destruction tests pass.

- [ ] **Step 7: Commit**

```bash
git add apps/playground/src/app/current-detection-effect* apps/playground/src/components/current-browser-panel* apps/playground/src/app/create-playground-app*
git commit -m "feat: detect the current browser in playground"
```

---

## Task 7: Implement Manual User-Agent Parsing, Samples, Reset, and Keyboard Parsing

**Files:**
- Create: `apps/playground/src/app/manual-detection-effect.ts`
- Create: `apps/playground/src/app/manual-detection-effect.test.ts`
- Create: `apps/playground/src/components/sample-selector.ts`
- Create: `apps/playground/src/components/manual-user-agent-panel.ts`
- Create: `apps/playground/src/components/manual-user-agent-panel.test.ts`
- Create: `apps/playground/src/services/clipboard-service.ts`
- Modify: `apps/playground/src/app/create-playground-app.ts`
- Modify: `apps/playground/src/app/create-playground-app.test.ts`

**Interfaces:**
- Consumes: `createDebounce(300)`, sample catalog, `parseUserAgent()`, store actions.
- Produces: manual input callbacks, sample selection, immediate parse, reset/focus contract, injectable clipboard service.

- [ ] **Step 1: Write manual-effect tests first**

Cover these behaviors with fake timers and injected fakes:

```ts
it('parses the latest User-Agent after 300 ms', () => {
  vi.useFakeTimers();
  const store = createPlaygroundStore();
  const parseUserAgent = vi.fn().mockReturnValue(chromeResult);
  const effect = createManualDetectionEffect({
    store,
    detectionService: {
      detectCurrent: vi.fn(),
      parseUserAgent,
      parseRequest: vi.fn(),
    },
  });

  effect.changeUserAgent('first');
  vi.advanceTimersByTime(200);
  effect.changeUserAgent('second');
  vi.advanceTimersByTime(300);

  expect(parseUserAgent).toHaveBeenCalledOnce();
  expect(parseUserAgent).toHaveBeenCalledWith('second');
  vi.useRealTimers();
});

it('parses immediately and cancels a pending debounce', () => {
  vi.useFakeTimers();
  const parseUserAgent = vi.fn().mockReturnValue(chromeResult);
  const effect = createManualDetectionEffect(/* same injected dependencies */);
  effect.changeUserAgent('Mozilla/5.0');
  effect.parseNow();
  vi.runAllTimers();
  expect(parseUserAgent).toHaveBeenCalledOnce();
  vi.useRealTimers();
});

it('selects a sample and parses immediately', () => {
  const sample = findUserAgentSample('line-liff')!;
  effect.selectSample(sample.id);
  expect(store.getState().manual.selectedSampleId).toBe(sample.id);
  expect(parseUserAgent).toHaveBeenCalledWith(sample.userAgent);
});
```

Use full test setup rather than a shared mutable global; each test creates its own store, fake service, and effect.

- [ ] **Step 2: Run manual-effect tests and prove RED**

```bash
npm run playground:test -- --run src/app/manual-detection-effect.test.ts
```

Expected: FAIL because the manual effect does not exist.

- [ ] **Step 3: Implement manual parsing without Client Hints**

Create `manual-detection-effect.ts` with:

```ts
import type { PlaygroundStore } from './playground-store';
import { createDebounce, type DebounceController } from '../services/debounce';
import { findUserAgentSample } from '../samples';
import type { UADetectionService } from '../services/ua-detection-service';

export interface ManualDetectionEffect {
  changeUserAgent(value: string): void;
  selectSample(sampleId: string): void;
  parseNow(): void;
  reset(): void;
  destroy(): void;
}

export function createManualDetectionEffect(input: {
  readonly store: PlaygroundStore;
  readonly detectionService: UADetectionService;
  readonly debounce?: DebounceController;
}): ManualDetectionEffect {
  const debounce = input.debounce ?? createDebounce(300);
  let destroyed = false;

  const parseCurrent = (): void => {
    if (destroyed) return;
    const { userAgent } = input.store.getState().manual;
    if (userAgent.trim().length === 0) return;
    input.store.dispatch({ type: 'manual-parse-requested' });
    try {
      const result = input.detectionService.parseUserAgent(userAgent);
      input.store.dispatch({ type: 'manual-parse-succeeded', result });
    } catch (error) {
      input.store.dispatch({
        type: 'manual-parse-failed',
        message: error instanceof Error ? error.message : 'User-Agent parsing failed.',
      });
    }
  };

  return {
    changeUserAgent(value) {
      input.store.dispatch({ type: 'manual-user-agent-changed', value });
      if (value.trim().length === 0) debounce.cancel();
      else debounce.schedule(parseCurrent);
    },
    selectSample(sampleId) {
      const sample = findUserAgentSample(sampleId);
      if (!sample) return;
      input.store.dispatch({
        type: 'sample-selected',
        sampleId: sample.id,
        userAgent: sample.userAgent,
        clientHintsText: sample.clientHints
          ? JSON.stringify(sample.clientHints, null, 2)
          : '',
      });
      debounce.cancel();
      parseCurrent();
    },
    parseNow() {
      debounce.cancel();
      parseCurrent();
    },
    reset() {
      debounce.cancel();
      input.store.dispatch({ type: 'manual-reset' });
    },
    destroy() {
      destroyed = true;
      debounce.destroy();
    },
  };
}
```

Task 8 will extend `parseCurrent()` to validate and asynchronously enrich with Client Hints while preserving this public effect interface.

- [ ] **Step 4: Add sample and manual input components**

`sample-selector.ts` renders one labelled `<select>` with `<optgroup>` per `SampleCategory`, uses sample IDs as option values, and emits `onSampleSelected(id)`.

`manual-user-agent-panel.ts` creates these persistent controls:

- labelled multiline textarea with `data-testid="manual-user-agent"`
- sample selector
- Parse now button
- Reset button
- status region
- an empty Client Hints slot for Task 8

Keyboard handler:

```ts
cleanup.listen(textarea, 'keydown', (event) => {
  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    callbacks.onParseNow();
  }
});
```

`update()` must assign `textarea.value` only when it differs from the state value so the caret does not jump while typing. `focusInput()` is an explicit component method used after reset.

- [ ] **Step 5: Add clipboard adapter**

Create `clipboard-service.ts`:

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

The adapter is injected into result components in Task 9; it is created now so application tests can use one stable dependency boundary.

- [ ] **Step 6: Integrate manual mode and focus reset**

Update `createPlaygroundApp()` to create one manual panel and manual effect. Wire callbacks to effect methods, render `state.manual`, and after reset call `manualPanel.focusInput()` in the same synchronous callback. Selecting Manual mode must not trigger current detection again.

- [ ] **Step 7: Run GREEN checks**

```bash
npm run playground:test -- --run src/app/manual-detection-effect.test.ts src/components/manual-user-agent-panel.test.ts src/app/create-playground-app.test.ts
npm run playground:typecheck
```

Expected: debounce, immediate parse, sample selection, reset, focus, keyboard shortcut, and listener cleanup pass.

- [ ] **Step 8: Commit**

```bash
git add apps/playground/src/app/manual-detection-effect* apps/playground/src/components/sample-selector* apps/playground/src/components/manual-user-agent-panel* apps/playground/src/services/clipboard-service.ts apps/playground/src/app/create-playground-app*
git commit -m "feat: parse manual user agents in playground"
```

---

## Task 8: Add Advanced Client Hints Through the Dynamic Server Entry

**Files:**
- Create: `apps/playground/src/components/client-hints-editor.ts`
- Create: `apps/playground/src/components/client-hints-editor.test.ts`
- Modify: `apps/playground/src/app/manual-detection-effect.ts`
- Modify: `apps/playground/src/app/manual-detection-effect.test.ts`
- Modify: `apps/playground/src/components/manual-user-agent-panel.ts`
- Modify: `apps/playground/src/components/manual-user-agent-panel.test.ts`

**Interfaces:**
- Consumes: `parseClientHintsInput()`, `UADetectionService.parseRequest()`, Client Hints state actions.
- Produces: collapsed native disclosure, safe JSON validation, stale-safe async enrichment, last-valid-result preservation.

- [ ] **Step 1: Add failing effect tests for parsing choice and stale results**

Add tests proving:

```ts
it('uses parseUserAgent when Client Hints is blank', async () => {
  effect.changeUserAgent('Mozilla/5.0');
  effect.parseNow();
  expect(detectionService.parseUserAgent).toHaveBeenCalledOnce();
  expect(detectionService.parseRequest).not.toHaveBeenCalled();
});

it('uses parseRequest for valid Client Hints', async () => {
  effect.changeUserAgent('Mozilla/5.0');
  effect.changeClientHints('{"sec-ch-ua-mobile":"?1"}');
  await effect.parseNow();
  expect(detectionService.parseRequest).toHaveBeenCalledWith({
    userAgent: 'Mozilla/5.0',
    headers: { 'sec-ch-ua-mobile': '?1' },
  });
});

it('preserves the last valid result for invalid Client Hints', async () => {
  // First parse a valid result, then enter malformed JSON and parse again.
  expect(store.getState().manual.result).toBe(chromeResult);
  expect(store.getState().manual.clientHints.error?.code).toBe('invalid-json');
  expect(detectionService.parseRequest).not.toHaveBeenCalled();
});

it('ignores an older asynchronous parseRequest result', async () => {
  // Resolve request two before request one and assert the store keeps request two.
});
```

Implement the final test with two deferred promises and explicit resolvers; do not use time-based sleeps.

- [ ] **Step 2: Run targeted tests and prove RED**

```bash
npm run playground:test -- --run src/app/manual-detection-effect.test.ts
```

Expected: FAIL because the effect does not expose `changeClientHints()` and still always calls `parseUserAgent()`.

- [ ] **Step 3: Extend the manual effect with async Client Hints parsing**

Change the interface:

```ts
changeClientHints(value: string): void;
setClientHintsExpanded(expanded: boolean): void;
parseNow(): Promise<void>;
```

Replace `parseCurrent()` with an async stale-safe implementation:

```ts
let generation = 0;

const parseCurrent = async (): Promise<void> => {
  if (destroyed) return;
  const requestGeneration = ++generation;
  const snapshot = input.store.getState().manual;
  if (snapshot.userAgent.trim().length === 0) return;

  const hints = parseClientHintsInput(snapshot.clientHints.text);
  if (!hints.ok) {
    input.store.dispatch({ type: 'client-hints-invalid', error: hints.error });
    return;
  }

  input.store.dispatch({ type: 'client-hints-valid' });
  input.store.dispatch({ type: 'manual-parse-requested' });
  try {
    const result = hints.headers
      ? await input.detectionService.parseRequest({
          userAgent: snapshot.userAgent,
          headers: hints.headers,
        })
      : input.detectionService.parseUserAgent(snapshot.userAgent);
    if (destroyed || requestGeneration !== generation) return;
    input.store.dispatch({ type: 'manual-parse-succeeded', result });
  } catch (error) {
    if (destroyed || requestGeneration !== generation) return;
    input.store.dispatch({
      type: 'manual-parse-failed',
      message: error instanceof Error ? error.message : 'User-Agent parsing failed.',
    });
  }
};
```

`changeUserAgent()` and `changeClientHints()` schedule `() => void parseCurrent()`. `selectSample()` and `parseNow()` call and return `parseCurrent()`. `destroy()` increments `generation` before destroying the debounce.

- [ ] **Step 4: Implement the native Client Hints editor**

Create `client-hints-editor.ts` with a `<details>`, `<summary>Advanced Client Hints</summary>`, a labelled JSON textarea, reset button, and inline error region. The component uses the `open` property for state and emits:

```ts
interface ClientHintsEditorCallbacks {
  readonly onExpandedChanged: (expanded: boolean) => void;
  readonly onTextChanged: (value: string) => void;
  readonly onReset: () => void;
}
```

Assign error text through `textContent`; set `role="alert"` only when an error exists. Do not replace the `<details>` element during updates.

- [ ] **Step 5: Integrate the editor into manual mode**

Wire editor callbacks to the extended effect. Client Hints reset dispatches an empty text change and schedules a plain `parse()` when the User-Agent is non-empty. A sample containing Client Hints fills both controls and parses immediately through `parseRequest()`.

- [ ] **Step 6: Run GREEN and chunk-boundary checks**

```bash
npm run playground:test -- --run src/app/manual-detection-effect.test.ts src/components/client-hints-editor.test.ts src/components/manual-user-agent-panel.test.ts
npm run playground:build
find apps/playground/dist/assets -type f -maxdepth 1 -print
```

Expected: tests pass; build emits the main application asset plus a separate dynamic chunk that contains the server entry path. The initial application source must not statically import `ua-info/server` outside `ua-detection-service.ts`.

- [ ] **Step 7: Commit**

```bash
git add apps/playground/src/app/manual-detection-effect* apps/playground/src/components/client-hints-editor* apps/playground/src/components/manual-user-agent-panel*
git commit -m "feat: enrich playground results with client hints"
```

---

## Task 9: Render Summary, Details, Raw JSON, API Examples, and Copy Feedback

**Files:**
- Create: `apps/playground/src/components/result-card.ts`
- Create: `apps/playground/src/components/result-details.ts`
- Create: `apps/playground/src/components/detection-summary.ts`
- Create: `apps/playground/src/components/json-viewer.ts`
- Create: `apps/playground/src/components/code-example.ts`
- Create: `apps/playground/src/components/result-components.test.ts`
- Modify: `apps/playground/src/app/create-playground-app.ts`
- Modify: `apps/playground/src/app/create-playground-app.test.ts`

**Interfaces:**
- Consumes: summary/card/code view models, raw `UAResult`, injected `ClipboardService`, application notifications.
- Produces: readable result surface, escaped JSON, mode-aware examples, non-fatal copy status.

- [ ] **Step 1: Write DOM security and copy tests first**

Create tests that use hostile strings such as:

```ts
const hostile = '<img src=x onerror=alert(1)>';
```

Verify:

```ts
component.update({ json: JSON.stringify({ ua: hostile }, null, 2) });
expect(component.element.querySelector('img')).toBeNull();
expect(component.element.textContent).toContain(hostile);
```

Also verify:

- summary renders separate Browser, Mode, Context Host, Context Surface, OS, and Device rows
- cards render `Not detected`
- JSON Copy calls the callback with the exact serialized result
- code Copy calls the callback with the exact example
- components retain one root element across updates

- [ ] **Step 2: Run tests and prove RED**

```bash
npm run playground:test -- --run src/components/result-components.test.ts
```

Expected: FAIL because result components do not exist.

- [ ] **Step 3: Implement result components with text-only rendering**

Use `document.createElement`, `textContent`, and `replaceChildren()` only inside each component-owned list or card body. Do not replace the application shell, input controls, or native disclosure element.

`json-viewer.ts` must serialize the actual result at the application boundary:

```ts
const json = JSON.stringify(result, null, 2);
code.textContent = json;
copyButton.addEventListener('click', () => callbacks.onCopy(json));
```

Do not add a separate transformed JSON model.

`result-details.ts` owns stable `result-card` instances keyed by card ID and updates those instances rather than injecting HTML strings.

- [ ] **Step 4: Add copy feedback to application composition**

Inject `ClipboardService` into `createPlaygroundApp()` with a default from `createClipboardService()`. Use one helper:

```ts
const copy = async (value: string, successMessage: string): Promise<void> => {
  try {
    await clipboardService.writeText(value);
    store.dispatch({
      type: 'notification-shown',
      notification: { kind: 'success', message: successMessage },
    });
  } catch {
    store.dispatch({
      type: 'notification-shown',
      notification: {
        kind: 'error',
        message: 'Unable to copy. Select the text manually.',
      },
    });
  }
};
```

Clear the notification with a single owned timeout and cancel that timeout in `destroy()`. Do not let clipboard failure change detection state.

- [ ] **Step 5: Select the active result and example**

Application render logic uses:

```ts
const activeResult =
  state.mode === 'current'
    ? state.current.status === 'success'
      ? state.current.result
      : null
    : state.manual.result;
```

When `activeResult` is null, show a mode-specific empty state. Otherwise update summary, details, JSON, and code components. `createCodeExample()` receives `state.mode` and whether parsed Client Hints are currently valid and non-empty.

- [ ] **Step 6: Run GREEN integration checks**

```bash
npm run playground:test -- --run src/components/result-components.test.ts src/app/create-playground-app.test.ts
npm run playground:typecheck
npm run playground:build
```

Expected: rendering, escaping, copy success/failure, and active-result selection pass.

- [ ] **Step 7: Commit**

```bash
git add apps/playground/src/components/result-* apps/playground/src/components/detection-summary* apps/playground/src/components/json-viewer* apps/playground/src/components/code-example* apps/playground/src/app/create-playground-app*
git commit -m "feat: present playground detection results"
```

---

## Task 10: Add Responsive Styling, Accessibility, and Static Boundary Enforcement

**Files:**
- Create: `apps/playground/src/styles/tokens.css`
- Create: `apps/playground/src/styles/base.css`
- Create: `apps/playground/src/styles/layout.css`
- Create: `apps/playground/src/styles/components.css`
- Create: `apps/playground/src/styles/utilities.css`
- Create: `scripts/verify-playground-boundaries.mjs`
- Modify: `apps/playground/src/main.ts`
- Modify: `package.json`
- Modify: relevant component tests

**Interfaces:**
- Consumes: stable component class names and source tree.
- Produces: accessible responsive UI, `playground:boundaries` gate, no source-bypass or unsafe-rendering regressions.

- [ ] **Step 1: Add failing source-boundary verification**

Create `scripts/verify-playground-boundaries.mjs` so it recursively reads `.ts` files under `apps/playground/src` and enforces:

```js
const allowedUaInfoImportOwners = new Set([
  'services/ua-detection-service.ts',
  'contract/public-entrypoints.test.ts',
]);
```

Reject:

- imports containing `../../src`, `/src/v2/`, or `dist/esm`
- `ua-info` imports from any other TypeScript file
- `.innerHTML`
- `insertAdjacentHTML`
- production imports from test files

Run it before the CSS imports are added and include a temporary unsafe fixture only within the test command:

```bash
printf "element.innerHTML = input;\n" > apps/playground/src/unsafe-boundary-fixture.ts
node scripts/verify-playground-boundaries.mjs; status=$?
rm apps/playground/src/unsafe-boundary-fixture.ts
exit $status
```

Expected: FAIL and identify `unsafe-boundary-fixture.ts`. Then run without the fixture and expect PASS.

The final script must not create or delete files itself.

- [ ] **Step 2: Create semantic tokens and base rules**

`tokens.css` defines font stacks, spacing, radii, borders, semantic light colors, dark overrides, focus colors, and motion durations. Use the exact token names from the approved specification.

`base.css` includes:

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  color-scheme: light dark;
  font-family: var(--font-sans);
  background: var(--color-page);
  color: var(--color-text);
}

body {
  margin: 0;
  min-width: 20rem;
  min-height: 100vh;
}

button,
textarea,
select {
  font: inherit;
}

button,
select,
summary {
  min-height: 2.75rem;
}

:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}

pre,
code {
  font-family: var(--font-mono);
}
```

- [ ] **Step 3: Add desktop and narrow layout without DOM reordering**

`layout.css` must use:

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

Every textarea, pre, code panel, card grid, and workspace child must include `min-width: 0` or `max-width: 100%` as appropriate. Do not use CSS `order` to rearrange content.

- [ ] **Step 4: Add component and reduced-motion rules**

`components.css` styles panels, tabs, controls, summary rows, cards, status, code blocks, and notices with `ua-playground-` classes only.

`utilities.css` contains only:

```css
.u-visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

- [ ] **Step 5: Import styles once from bootstrap**

At the top of `main.ts` add:

```ts
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/utilities.css';
```

- [ ] **Step 6: Strengthen accessibility tests**

Add DOM assertions for:

- every textarea and select has an associated `<label>`
- tab buttons have selected state and keyboard focus state
- loading uses `role="status"` or `aria-live="polite"`
- errors use `role="alert"`
- icon-only controls do not exist; every action has visible text or an accessible name
- details/summary remains native
- reset returns focus to the User-Agent textarea

- [ ] **Step 7: Add root boundary command and verify**

Add to root scripts:

```json
{
  "playground:boundaries": "node scripts/verify-playground-boundaries.mjs"
}
```

Include `npm run playground:boundaries` before browser smoke in `playground:check`.

Run:

```bash
npm run playground:boundaries
npm run playground:test
npm run playground:build
```

Expected: boundary scan, DOM tests, type-check, and build pass.

- [ ] **Step 8: Commit**

```bash
git add apps/playground/src/styles apps/playground/src/main.ts apps/playground/src/**/*.test.ts scripts/verify-playground-boundaries.mjs package.json
git commit -m "style: harden playground experience"
```

---

## Task 11: Add Production Playwright Smoke at the GitHub Pages Base Path

**Files:**
- Create: `apps/playground/playwright.config.ts`
- Create: `apps/playground/e2e/playground.spec.ts`
- Modify: `apps/playground/package.json` only if reporter/output scripts need correction

**Interfaces:**
- Consumes: built `apps/playground/dist`, Vite preview, stable `data-testid` attributes.
- Produces: Chromium production smoke, base-path verification, privacy request assertion, trace/screenshots/report artifacts.

- [ ] **Step 1: Write the production smoke before installing Chromium**

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [['line'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
    : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173/ua-info/',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  outputDir: 'test-results',
  webServer: {
    command: 'npm run preview',
    url: 'http://127.0.0.1:4173/ua-info/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

Create `e2e/playground.spec.ts` with three tests:

1. Current Browser loads with no console errors and valid raw JSON.
2. Manual LINE LIFF sample shows separate Browser, Mode, Context Host, and Context Surface and dynamically parses Client Hints.
3. A 320×800 viewport has no page-level horizontal overflow and all requests stay on the preview origin.

Use this request guard before navigation:

```ts
const externalRequests: string[] = [];
page.on('request', (request) => {
  const url = new URL(request.url());
  if (url.origin !== 'http://127.0.0.1:4173') externalRequests.push(url.href);
});
```

Use `data-testid` locators rather than CSS implementation classes.

- [ ] **Step 2: Run the smoke and prove RED due to missing browser binary**

```bash
npm run playground:build
npm run test:e2e --prefix apps/playground
```

Expected on a clean machine: FAIL with the Playwright instruction to install Chromium. If Chromium already exists locally, temporarily set `PLAYWRIGHT_BROWSERS_PATH` to an empty temporary directory to demonstrate the missing-browser failure, then remove that environment override.

- [ ] **Step 3: Install Chromium and run GREEN**

```bash
cd apps/playground
npx playwright install chromium
npm run test:e2e
cd ../..
```

Expected: all three production tests pass against `/ua-info/`.

- [ ] **Step 4: Inspect base-path output directly**

```bash
grep -R 'src="/assets\|href="/assets' apps/playground/dist && exit 1 || true
grep -R '/ua-info/assets/' apps/playground/dist/index.html
```

Expected: no root `/assets` references; at least one `/ua-info/assets/` reference.

- [ ] **Step 5: Commit**

```bash
git add apps/playground/playwright.config.ts apps/playground/e2e apps/playground/package.json apps/playground/package-lock.json
git commit -m "test: smoke playground production build"
```

---

## Task 12: Integrate CI, GitHub Pages Deployment, Documentation, and Final Gates

**Files:**
- Modify: `.github/workflows/ci.yml`
- Create: `.github/workflows/deploy-playground.yml`
- Create: `apps/playground/README.md`
- Modify: `README.md`
- Modify: `package.json` if final command ordering needs correction

**Interfaces:**
- Consumes: `npm run playground:check`, built `apps/playground/dist`, Playwright artifacts.
- Produces: PR verification, master-only Pages deployment, maintainer documentation, final acceptance evidence.

- [ ] **Step 1: Add a separate Node.js 22 playground CI job**

Preserve the existing Node.js 18/20/22 `test` matrix unchanged. Add:

```yaml
  playground:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: apps/playground/package-lock.json
      - name: Install library dependencies
        run: npm install
      - name: Install playground tooling
        run: npm ci --prefix apps/playground
      - name: Build and install packed library
        run: |
          npm run build
          npm run playground:install
      - name: Verify playground boundaries
        run: npm run playground:boundaries
      - name: Type-check and test playground
        run: |
          npm run playground:typecheck
          npm run playground:test
      - name: Install Chromium
        run: cd apps/playground && npx playwright install --with-deps chromium
      - name: Run production smoke
        run: npm run playground:test:e2e
      - name: Upload Playwright diagnostics
        if: ${{ !cancelled() }}
        uses: actions/upload-artifact@v4
        with:
          name: playground-playwright-report
          path: |
            apps/playground/playwright-report
            apps/playground/test-results
          if-no-files-found: ignore
```

- [ ] **Step 2: Add verified Pages deployment**

Create `.github/workflows/deploy-playground.yml`:

```yaml
name: Deploy Playground

on:
  push:
    branches: [master]
    paths:
      - apps/playground/**
      - src/**
      - package.json
      - tsconfig.build.json
      - tsconfig.build.cjs.json
      - scripts/finalize-build.mjs
      - scripts/install-playground-package.mjs
      - scripts/verify-playground-boundaries.mjs
      - .github/workflows/deploy-playground.yml
  workflow_dispatch:

concurrency:
  group: github-pages-playground
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: apps/playground/package-lock.json
      - run: npm install
      - run: npm ci --prefix apps/playground
      - run: npm run build
      - run: npm run playground:install
      - run: npm run playground:boundaries
      - run: npm run playground:typecheck
      - run: npm run playground:test
      - run: cd apps/playground && npx playwright install --with-deps chromium
      - run: npm run playground:test:e2e
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v4
        with:
          path: apps/playground/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

Do not add this workflow to npm publication triggers.

- [ ] **Step 3: Add playground maintainer documentation**

Create `apps/playground/README.md` with these concrete sections:

- Purpose and production URL
- Package boundary and why the packed tarball is mandatory
- Commands: `playground:dev`, `typecheck`, `test`, `build`, `test:e2e`, `check`
- Source architecture and component contract
- Adding a sample with exact file paths
- Adding a component with `Component<TModel>` and cleanup ownership
- Test layers and Playwright artifact paths
- `/ua-info/` base-path requirement
- Privacy guarantees
- Pages workflow and custom-domain note

Include this local startup sequence:

```bash
npm install
npm ci --prefix apps/playground
npm run playground:dev
```

- [ ] **Step 4: Update root README without duplicating internals**

Add near the project introduction:

```md
## Interactive Playground

Try UA Info in your browser at <https://petechatchawan.github.io/ua-info/>. Detection and parsing run locally; User-Agent and Client Hints data are not uploaded.
```

Add to development commands:

```bash
npm ci --prefix apps/playground
npm run playground:dev
```

Link to `apps/playground/README.md` for architecture and testing details.

- [ ] **Step 5: Run complete fresh verification**

From a clean working tree with Node.js 22 and Chromium installed:

```bash
npm install
npm ci --prefix apps/playground
npm run check
npm run playground:check
npm run playground:boundaries
git diff --check
```

Expected evidence:

- existing root lint, 43+ Jest tests, ESM build, CommonJS build, package content, packed ESM/CommonJS/TypeScript consumers pass
- playground packed install reports the current root package identity
- playground strict type-check passes
- all Vitest unit, DOM, integration, and contract tests pass
- Vite builds with `/ua-info/`
- all Playwright production tests pass
- root pack contains no playground source or tooling
- boundary scan finds no source import, unsafe HTML, or test import violation
- `git diff --check` produces no output

- [ ] **Step 6: Perform manual release inspection**

Run `npm run playground:dev` and verify:

```text
Keyboard-only navigation         PASS
Current Browser retry            PASS
Manual 300 ms parsing            PASS
Ctrl/Cmd + Enter                 PASS
LINE LIFF dimensions separated   PASS
Invalid Client Hints preserved   PASS
Copy failure remains non-fatal   PASS
200% zoom                        PASS
320 CSS-pixel viewport           PASS
Light color scheme               PASS
Dark color scheme                PASS
Reduced motion                   PASS
No external network request      PASS
```

Record the completed checklist in the PR body; do not create a separate permanent verification document unless a failure requires investigation history.

- [ ] **Step 7: Commit**

```bash
git add .github/workflows/ci.yml .github/workflows/deploy-playground.yml apps/playground/README.md README.md package.json
git commit -m "ci: deploy verified ua-info playground"
```

---

## Final Self-Review Checklist

Before opening the implementation PR, inspect the complete diff and verify each item directly:

- [ ] Every approved specification section maps to one of Tasks 1–12.
- [ ] No parser source or result contract under `src/v2/**` changed.
- [ ] No root package version change occurred.
- [ ] Root `files` remains `dist`, `README.md`, and `LICENSE`.
- [ ] Playground package is private and has its own committed lock file.
- [ ] The installed tarball, not source aliases, satisfies playground imports.
- [ ] Only `ua-detection-service.ts` owns production `ua-info` imports.
- [ ] `ua-info/server` is dynamically imported only when valid Client Hints exist.
- [ ] Reducer and view-model mappers are pure.
- [ ] Store does not own DOM, timers, clipboard, or detection.
- [ ] Components do not own application state or parser calls.
- [ ] Application shell, textarea, and `<details>` are not replaced on each update.
- [ ] Every owned listener, timeout, debounce, and async generation is cleaned up or fenced.
- [ ] User input is rendered only through `textContent` or element value properties.
- [ ] Client Hints size, root type, values, and dangerous keys are validated.
- [ ] Current Browser failure leaves Manual mode usable.
- [ ] Invalid Client Hints preserve the last valid result.
- [ ] Browser, mode, context host, context surface, client, engine, OS, device, and CPU remain distinct.
- [ ] Raw JSON comes from the actual `UAResult`.
- [ ] All required sample IDs exist and LINE LIFF carries Client Hints.
- [ ] Light, dark, reduced-motion, keyboard, zoom, and 320-pixel contracts are verified.
- [ ] Production smoke runs at `/ua-info/` and rejects third-party requests.
- [ ] Existing Node.js 18/20/22 library CI remains unchanged.
- [ ] PRs verify but do not deploy.
- [ ] Pages deployment runs only from `master` or manual dispatch.
- [ ] npm publication workflow remains unchanged.
- [ ] Full root and playground gates pass with fresh output.
