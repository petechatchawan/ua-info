# ua-info v2.2 Typed Predicate Helpers Implementation Plan

**Status:** Implemented and verified  
**Pull request:** `#37`  
**Final implementation head:** `ec78e27de964fd871f5caf15aeb66500c13c9e13`  
**Final CI:** run `30100245895` / CI `#204`

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add nine tree-shakeable, type-narrowing predicate helpers to the `ua-info` package root without changing `UAResult`, detector behavior, package entry points, or runtime dependencies.

**Architecture:** Implement one side-effect-free `src/v2/predicates.ts` module containing strict-equality predicates over canonical `UAResult` fields. Export it from `src/v2/index.ts`, verify runtime behavior and compile-time narrowing in a dedicated Jest suite, verify package-root availability, and document the API in README recipes.

**Tech Stack:** TypeScript 4.9, Jest 30, ts-jest, ESLint, Node.js 18/20/22, ESM and CommonJS package builds.

## Global Constraints

- Target release is `ua-info@2.2.0`; do not change the version until the release PR is approved.
- `UAResult` and every existing public interface remain unchanged.
- Detection behavior remains unchanged.
- Public package entry points remain root, `/server`, `/browser`, and `/package.json`.
- No runtime dependency is added.
- Every predicate is synchronous, deterministic, pure, `O(1)`, allocation-free per call, and uses strict case-sensitive equality.
- ID-like predicates accept custom `string` literals; closed semantic predicates accept existing public union types.
- Follow RED-GREEN TDD and retain fresh CI evidence for both stages.

---

### Task 1: Add failing runtime and type contracts

**Files:**
- Create: `src/v2/__tests__/predicates.test.ts`
- Modify: `src/__tests__/root-api.test.ts`

**Interfaces:**
- Consumes: `UAResult`, `BrowserId`, `BrowserFamily`, `EngineId`, `OSId`, `CPUArchitecture`, `BrowserMode`, `DeviceType`, `ClientKind`, and `ContextKind` from `src/v2`.
- Produces: executable contracts for `isBrowser`, `isBrowserFamily`, `isBrowserMode`, `isEngine`, `isOperatingSystem`, `isDeviceType`, `isCPUArchitecture`, `isClientKind`, and `isContextKind`.

- [x] **Step 1: Create the failing predicate test suite**

Create `src/v2/__tests__/predicates.test.ts` with a complete `UAResult` fixture and tests equivalent to:

```ts
import {
  BrowserFamily,
  BrowserId,
  CPUArchitecture,
  EngineId,
  OSId,
  isBrowser,
  isBrowserFamily,
  isBrowserMode,
  isCPUArchitecture,
  isClientKind,
  isContextKind,
  isDeviceType,
  isEngine,
  isOperatingSystem,
  type BrowserMode,
  type ClientKind,
  type ContextKind,
  type DeviceType,
  type UAResult,
} from '../index';

const completeResult: UAResult = {
  ua: 'fixture',
  browser: {
    id: BrowserId.Chrome,
    name: 'Chrome',
    version: { raw: '120.0.0.0', major: 120, minor: 0 },
    family: BrowserFamily.Chromium,
    mode: 'webview',
  },
  engine: { id: EngineId.Blink, name: 'Blink', version: null },
  os: { id: OSId.Android, name: 'Android', version: null },
  device: { type: 'mobile', vendor: 'Google', model: 'Pixel' },
  cpu: { architecture: CPUArchitecture.ARM64, bitness: 64 },
  client: { id: 'googlebot', name: 'Googlebot', version: null, kind: 'crawler' },
  context: { kind: 'mini-app', id: 'liff', name: 'LIFF', host: null },
};
```

Cover positive and negative comparisons for all nine helpers, null containers, case sensitivity, custom string IDs, and unchanged object identity.

Add a non-exported compile-time function that proves literal narrowing:

```ts
function assertTypeNarrowing(result: UAResult): void {
  if (isBrowser(result, BrowserId.Chrome)) {
    const value: typeof BrowserId.Chrome = result.browser.id;
    void value;
  }

  if (isBrowserFamily(result, BrowserFamily.Chromium)) {
    const value: typeof BrowserFamily.Chromium = result.browser.family;
    void value;
  }

  if (isBrowserMode(result, 'webview')) {
    const value: 'webview' = result.browser.mode;
    void value;
  }

  if (isEngine(result, EngineId.Blink)) {
    const value: typeof EngineId.Blink = result.engine.id;
    void value;
  }

  if (isOperatingSystem(result, OSId.Android)) {
    const value: typeof OSId.Android = result.os.id;
    void value;
  }

  if (isDeviceType(result, 'mobile')) {
    const value: 'mobile' = result.device.type;
    void value;
  }

  if (isCPUArchitecture(result, CPUArchitecture.ARM64)) {
    const value: typeof CPUArchitecture.ARM64 = result.cpu.architecture;
    void value;
  }

  if (isClientKind(result, 'crawler')) {
    const value: 'crawler' = result.client.kind;
    void value;
  }

  if (isContextKind(result, 'mini-app')) {
    const value: 'mini-app' = result.context.kind;
    void value;
  }

  if (isBrowser(result, 'custom-enterprise-browser')) {
    const value: 'custom-enterprise-browser' = result.browser.id;
    void value;
  }
}
```

Add compile-time rejection checks inside a never-invoked function:

```ts
function assertClosedUnionInputs(result: UAResult): void {
  // @ts-expect-error invalid BrowserMode
  isBrowserMode(result, 'Browser');
  // @ts-expect-error invalid DeviceType
  isDeviceType(result, 'phone');
  // @ts-expect-error invalid ClientKind
  isClientKind(result, 'robot');
  // @ts-expect-error invalid ContextKind
  isContextKind(result, 'application');
}

void assertTypeNarrowing;
void assertClosedUnionInputs;
```

- [x] **Step 2: Add failing package-root export assertions**

Extend `src/__tests__/root-api.test.ts` with:

```ts
it('exports the typed predicate helpers', () => {
  expect(typeof userAgentInfo.isBrowser).toBe('function');
  expect(typeof userAgentInfo.isBrowserFamily).toBe('function');
  expect(typeof userAgentInfo.isBrowserMode).toBe('function');
  expect(typeof userAgentInfo.isEngine).toBe('function');
  expect(typeof userAgentInfo.isOperatingSystem).toBe('function');
  expect(typeof userAgentInfo.isDeviceType).toBe('function');
  expect(typeof userAgentInfo.isCPUArchitecture).toBe('function');
  expect(typeof userAgentInfo.isClientKind).toBe('function');
  expect(typeof userAgentInfo.isContextKind).toBe('function');
});
```

- [x] **Step 3: Commit the RED tests**

```bash
git add src/v2/__tests__/predicates.test.ts src/__tests__/root-api.test.ts
git commit -m "test: define typed predicate contracts"
```

- [x] **Step 4: Verify RED in CI**

Expected result: TypeScript/Jest fails because the nine predicate exports do not exist. Confirm the failure is limited to missing predicate symbols rather than fixture or syntax errors.

---

### Task 2: Implement the minimal typed predicate module

**Files:**
- Create: `src/v2/predicates.ts`
- Modify: `src/v2/index.ts`

**Interfaces:**
- Consumes: public result and dimension types from `src/v2/types.ts`.
- Produces: all nine public type-predicate functions specified by the design.

- [x] **Step 1: Add internal narrowing aliases**

Create `src/v2/predicates.ts` with imports and non-exported aliases:

```ts
import type {
  BrowserInfo,
  BrowserMode,
  ClientInfo,
  ClientKind,
  ContextInfo,
  ContextKind,
  CPUInfo,
  DeviceType,
  EngineInfo,
  OSInfo,
  UAResult,
} from './types';

type BrowserResult<T extends string> = {
  readonly browser: BrowserInfo & { readonly id: T };
};

type BrowserFamilyResult<T extends string> = {
  readonly browser: BrowserInfo & { readonly family: T };
};

type BrowserModeResult<T extends BrowserMode> = {
  readonly browser: BrowserInfo & { readonly mode: T };
};

type EngineResult<T extends string> = {
  readonly engine: EngineInfo & { readonly id: T };
};

type OperatingSystemResult<T extends string> = {
  readonly os: OSInfo & { readonly id: T };
};

type DeviceTypeResult<T extends DeviceType> = {
  readonly device: UAResult['device'] & { readonly type: T };
};

type CPUArchitectureResult<T extends string> = {
  readonly cpu: CPUInfo & { readonly architecture: T };
};

type ClientKindResult<T extends ClientKind> = {
  readonly client: ClientInfo & { readonly kind: T };
};

type ContextKindResult<T extends ContextKind> = {
  readonly context: ContextInfo & { readonly kind: T };
};
```

- [x] **Step 2: Implement the nine strict-equality predicates**

```ts
export function isBrowser<T extends string>(
  result: UAResult,
  id: T,
): result is UAResult & BrowserResult<T> {
  return result.browser?.id === id;
}

export function isBrowserFamily<T extends string>(
  result: UAResult,
  family: T,
): result is UAResult & BrowserFamilyResult<T> {
  return result.browser?.family === family;
}

export function isBrowserMode<T extends BrowserMode>(
  result: UAResult,
  mode: T,
): result is UAResult & BrowserModeResult<T> {
  return result.browser?.mode === mode;
}

export function isEngine<T extends string>(
  result: UAResult,
  id: T,
): result is UAResult & EngineResult<T> {
  return result.engine?.id === id;
}

export function isOperatingSystem<T extends string>(
  result: UAResult,
  id: T,
): result is UAResult & OperatingSystemResult<T> {
  return result.os?.id === id;
}

export function isDeviceType<T extends DeviceType>(
  result: UAResult,
  type: T,
): result is UAResult & DeviceTypeResult<T> {
  return result.device.type === type;
}

export function isCPUArchitecture<T extends string>(
  result: UAResult,
  architecture: T,
): result is UAResult & CPUArchitectureResult<T> {
  return result.cpu?.architecture === architecture;
}

export function isClientKind<T extends ClientKind>(
  result: UAResult,
  kind: T,
): result is UAResult & ClientKindResult<T> {
  return result.client?.kind === kind;
}

export function isContextKind<T extends ContextKind>(
  result: UAResult,
  kind: T,
): result is UAResult & ContextKindResult<T> {
  return result.context?.kind === kind;
}
```

- [x] **Step 3: Export the module**

Append to `src/v2/index.ts`:

```ts
export * from './predicates';
```

- [x] **Step 4: Commit the GREEN implementation**

```bash
git add src/v2/predicates.ts src/v2/index.ts
git commit -m "feat: add typed predicate helpers"
```

- [x] **Step 5: Verify focused and full GREEN gates**

Run locally or through CI:

```bash
npx jest src/v2/__tests__/predicates.test.ts src/__tests__/root-api.test.ts --runInBand
npm run lint
npm run detection:check
npm run build
npm run pack:check
```

Expected: all commands exit `0`; declarations expose all nine predicates and packed ESM/CommonJS consumers resolve them.

---

### Task 3: Document predicate usage

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: the nine root exports from Task 2.
- Produces: discoverable usage guidance without changing runtime behavior.

- [x] **Step 1: Update Quick Start to demonstrate narrowing**

Replace the browser optional-chain comparison with:

```ts
import { BrowserId, isBrowser, parse } from 'ua-info';

const details = parse(navigator.userAgent);

if (isBrowser(details, BrowserId.Chrome)) {
  console.log(details.browser.version?.raw);
}
```

- [x] **Step 2: Add a Typed predicate helpers section**

Document all nine helpers in one compact example and state:

- successful checks narrow nullable containers and compared literal properties;
- ID-like predicates accept future/custom string IDs;
- closed union helpers catch invalid literals at compile time;
- matching parsed claims is not origin authentication.

- [x] **Step 3: Convert relevant recipes**

Use predicates in browser/version, device class, WebView/headless, in-app context, and crawler/AI-agent recipes while leaving direct field access examples where predicates do not improve clarity.

- [x] **Step 4: Commit documentation**

```bash
git add README.md
git commit -m "docs: document typed predicate helpers"
```

---

### Task 4: Final verification and PR readiness

**Files:**
- Modify: `docs/superpowers/specs/2026-07-24-ua-info-v2-2-typed-predicates-design.md`
- Modify: `docs/superpowers/plans/2026-07-24-ua-info-v2-2-typed-predicates.md`

**Interfaces:**
- Consumes: completed implementation and CI evidence.
- Produces: reviewable PR with traceable verification status.

- [x] **Step 1: Run the full package gate**

```bash
npm run check
```

Expected: identity, lint, fixture contract, coverage, build, package verification, and consumer checks all exit `0`.

- [x] **Step 2: Run the full Playground gate**

```bash
npm run playground:check
```

Expected: setup, boundary check, TypeScript check, tests, browser build, and Playwright smoke all exit `0`.

- [x] **Step 3: Verify the diff**

```bash
git diff --check master...HEAD
git diff --stat master...HEAD
```

Confirm there are no whitespace errors, no generated `dist`, no dependency changes, no package subpath changes, and no `UAResult` changes.

- [x] **Step 4: Record verified status**

After fresh CI passes, update design status to `Implemented and verified`, mark every plan checkbox complete, and record the exact implementation head and workflow run.

- [x] **Step 5: Open the implementation PR**

Use title:

```text
feat: add typed predicate helpers for ua-info 2.2
```

The PR body must list the nine helpers, type-narrowing behavior, RED/GREEN evidence, unchanged public result/entry-point contracts, and exact verification runs.