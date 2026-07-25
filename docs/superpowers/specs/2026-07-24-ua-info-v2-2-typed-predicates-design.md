# ua-info v2.2 Typed Predicate Helpers Design

**Status:** Implemented and verified  
**Date:** 2026-07-24  
**Repository:** `petechatchawan/ua-info`  
**Target release:** `ua-info@2.2.0`

## 1. Purpose

Add a complete, symmetric set of tree-shakeable TypeScript predicate helpers for querying a canonical `UAResult` without changing the result model, parser behavior, package entry points, or runtime dependencies.

The helpers remove repeated optional chaining and string comparisons while narrowing nullable result dimensions at compile time.

## 2. Frozen Release Contract

`ua-info@2.2.0` is an additive minor release.

- `UAResult` and all existing public interfaces remain unchanged.
- Detection behavior remains unchanged.
- Public package entry points remain root, `/server`, `/browser`, and `/package.json`.
- Removed v1 APIs and the removed `/v2` package subpath remain removed.
- No runtime dependency is added.
- Node.js support remains `>=18`; CI remains Node.js 18, 20, and 22.
- ESM, CommonJS, TypeScript declarations, packed-consumer checks, and Playground checks remain mandatory.
- All helpers are synchronous, deterministic, pure, `O(1)`, and allocation-free per invocation.

## 3. Public API

Create `src/v2/predicates.ts` and export it through `src/v2/index.ts`, which already flows through the package root.

The release adds exactly these nine functions:

```ts
isBrowser(result, BrowserId.Chrome);
isBrowserFamily(result, BrowserFamily.Chromium);
isBrowserMode(result, 'webview');
isEngine(result, EngineId.Blink);
isOperatingSystem(result, OSId.Android);
isDeviceType(result, 'mobile');
isCPUArchitecture(result, CPUArchitecture.ARM64);
isClientKind(result, 'crawler');
isContextKind(result, 'mini-app');
```

Canonical signatures:

```ts
export function isBrowser<T extends string>(
  result: UAResult,
  id: T,
): result is UAResult & BrowserResult<T>;

export function isBrowserFamily<T extends string>(
  result: UAResult,
  family: T,
): result is UAResult & BrowserFamilyResult<T>;

export function isBrowserMode<T extends BrowserMode>(
  result: UAResult,
  mode: T,
): result is UAResult & BrowserModeResult<T>;

export function isEngine<T extends string>(
  result: UAResult,
  id: T,
): result is UAResult & EngineResult<T>;

export function isOperatingSystem<T extends string>(
  result: UAResult,
  id: T,
): result is UAResult & OperatingSystemResult<T>;

export function isDeviceType<T extends DeviceType>(
  result: UAResult,
  type: T,
): result is UAResult & DeviceTypeResult<T>;

export function isCPUArchitecture<T extends string>(
  result: UAResult,
  architecture: T,
): result is UAResult & CPUArchitectureResult<T>;

export function isClientKind<T extends ClientKind>(
  result: UAResult,
  kind: T,
): result is UAResult & ClientKindResult<T>;

export function isContextKind<T extends ContextKind>(
  result: UAResult,
  kind: T,
): result is UAResult & ContextKindResult<T>;
```

ID-like dimensions accept `T extends string` so consumers may compare custom or future detector IDs without waiting for a constant to be added. Closed semantic unions use their existing public types so TypeScript rejects invalid literals.

## 4. Type-Narrowing Contract

A successful predicate narrows both nullable containers and the compared property:

| Helper | Compared field | Successful narrowing |
| --- | --- | --- |
| `isBrowser` | `browser.id` | `browser` non-null; `id` is literal `T` |
| `isBrowserFamily` | `browser.family` | `browser` non-null; `family` is literal `T` |
| `isBrowserMode` | `browser.mode` | `browser` non-null; `mode` is literal `T` |
| `isEngine` | `engine.id` | `engine` non-null; `id` is literal `T` |
| `isOperatingSystem` | `os.id` | `os` non-null; `id` is literal `T` |
| `isDeviceType` | `device.type` | `type` is literal `T` |
| `isCPUArchitecture` | `cpu.architecture` | `cpu` non-null; `architecture` is literal `T` |
| `isClientKind` | `client.kind` | `client` non-null; `kind` is literal `T` |
| `isContextKind` | `context.kind` | `context` non-null; `kind` is literal `T` |

The result parameter remains exactly `UAResult`. Helpers do not accept raw User-Agent strings, `null`, `undefined`, `unknown`, or individual dimension objects.

Internal narrowing aliases remain unexported implementation details.

## 5. Runtime Semantics

Every helper performs one strict, case-sensitive equality comparison against the normalized `UAResult` field.

```ts
return result.browser?.id === id;
```

Rules:

- A missing or `null` dimension returns `false`.
- Arguments are not trimmed, lowercased, normalized, or parsed.
- The helper does not call `parse()`.
- The helper does not clone or mutate the result.
- The helper does not throw for values conforming to `UAResult`.
- Custom string IDs are compared exactly as supplied.

## 6. Module and Packaging Boundary

Repository changes:

```text
src/v2/predicates.ts                  new public helper implementation
src/v2/index.ts                       export predicates
src/v2/__tests__/predicates.test.ts  runtime and type-narrowing contracts
src/__tests__/root-api.test.ts        root export smoke contract
README.md                             usage and API documentation
```

No new package subpath is introduced. Consumers import helpers from `ua-info`; `/server` and `/browser` continue returning `UAResult` that can be passed to root predicates.

`sideEffects: false` remains valid because the new module has no top-level side effects.

## 7. Testing Strategy

Implementation follows RED-GREEN TDD.

### 7.1 Runtime tests

Tests must cover:

- positive and negative comparisons for all nine helpers;
- nullable dimensions returning `false`;
- exact, case-sensitive matching;
- custom browser, engine, OS, and CPU strings;
- no mutation of the supplied result.

### 7.2 Type contracts

Compile-time assertions must prove:

- successful branches remove nullable containers;
- compared properties narrow to literal types;
- custom string IDs are accepted;
- invalid `BrowserMode`, `DeviceType`, `ClientKind`, and `ContextKind` literals are rejected with `@ts-expect-error`.

### 7.3 Package contracts

The root API test must prove all nine helpers are exported. Existing ESM, CommonJS, TypeScript Node16, package identity, pack, Playground, and coverage gates remain required.

## 8. Documentation

README examples should prefer predicates where they materially reduce optional chaining, including browser/version, device class, WebView/headless, in-app context, and crawler/AI-agent recipes.

Documentation must state that predicates query parsed claims; they do not authenticate a browser, bot, or request origin.

## 9. Out of Scope

The release does not add:

- a fluent query wrapper;
- predicate factories or combinators;
- aliases such as `isOS()`;
- overloads accepting individual `BrowserInfo`, `ClientInfo`, or other dimension objects;
- schema validation for `unknown` inputs;
- normalization of predicate arguments;
- new constants, detector identities, or detection behavior;
- performance benchmark infrastructure, which belongs to the next performance and bundle-size phase.

## 10. Verification Record

- Pull request: `#37 feat: add typed predicate helpers for ua-info 2.2`
- RED contract head: `55dedd784849be828e260b99fd0c56d885b7eef6`
- RED CI: run `30099922137` / CI `#199`; lint passed and tests failed before predicate exports existed.
- Initial GREEN head: `63ae08a5151a0fa42e6e2fa3ad5a36bf1cb24797`
- Initial GREEN CI: run `30100025324` / CI `#201`; predicate tests, coverage, build, packed consumers, and Node.js 18/20/22 passed.
- Final verified implementation head: `ec78e27de964fd871f5caf15aeb66500c13c9e13`
- Final CI: run `30100245895` / CI `#204`; detection coverage, Node.js 18/20/22 tests, build, packed consumers, Playground type-check/tests/build, and production smoke all passed.
- No runtime dependency, public result model, detector behavior, or package entry-point change was introduced.

## 11. Acceptance Gates

The feature is complete only when:

1. All nine helpers are exported from `ua-info` with declaration-safe type predicates.
2. Runtime and compile-time contracts pass.
3. Existing detection coverage thresholds remain satisfied.
4. `npm run check` passes.
5. Playground type-check, tests, build, and production smoke remain green.
6. CI passes on Node.js 18, 20, and 22.
7. README documents the new API without implying identity verification.
8. No public result shape, package subpath, or runtime dependency changes.