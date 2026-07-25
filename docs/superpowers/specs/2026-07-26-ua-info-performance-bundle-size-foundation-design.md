# ua-info Performance & Bundle Size Foundation Design

**Status:** Approved for implementation  
**Date:** 2026-07-26  
**Repository:** `petechatchawan/ua-info`  
**Baseline package:** `ua-info@2.2.0`

## 1. Purpose

Establish a reproducible performance and size measurement foundation for `ua-info` before enforcing regression budgets.

This phase adds trustworthy instrumentation, committed measurement scenarios, machine-readable reports, and non-blocking CI visibility. It does not optimize parser code and does not reject pull requests because a runtime number moved.

## 2. Decision

Use a two-stage policy:

1. **Foundation stage — this design:** collect deterministic static metrics and statistically summarized Node.js runtime metrics, publish them as CI artifacts and job summaries, and establish a reviewed baseline.
2. **Hard-gate stage — later design:** after enough stable runs exist, define budgets and make selected regressions blocking.

The foundation stage may fail when the measurement harness is broken, a scenario is missing, or the report schema is invalid. It must not fail solely because a measured size or timing differs from the baseline.

## 3. Scope

### Included

- npm tarball size and unpacked package size;
- packed file count;
- raw ESM and CommonJS distribution totals;
- representative consumer bundle sizes after production minification and tree-shaking;
- gzip and Brotli sizes for bundle scenarios;
- Node.js cold import wall-time measurements;
- Node.js `parse()` throughput for representative and mixed User-Agent workloads;
- a versioned JSON report schema;
- a committed `ua-info@2.2.0` baseline report;
- a dedicated Node.js 22 CI job;
- CI summary and downloadable report artifact;
- deterministic harness tests and report validation;
- documentation describing methodology and interpretation.

### Excluded

- browser or Chromium runtime microbenchmarks;
- `detectCurrent()` timing in a real browser;
- memory, heap, garbage-collection, or allocation budgets;
- cross-library competitive benchmarks;
- parser rewrites or detector optimizations;
- automatic comparison against npm releases;
- blocking bundle-size or performance thresholds;
- package version changes or npm publication.

## 4. Compatibility Constraints

- Package identity remains `ua-info`.
- Package version remains `2.2.0`.
- Node.js support remains `>=18`.
- Runtime benchmark execution is standardized on Node.js 22.
- Root, `/server`, `/browser`, and `/package.json` exports remain unchanged.
- ESM and CommonJS build outputs remain unbundled TypeScript compiler output.
- No runtime dependency is added.
- `esbuild` is permitted as a development-only measurement dependency.
- Parser, detector, public result, constant, predicate, Playground, and release behavior remain unchanged.

## 5. Measurement Architecture

The foundation is split into four focused units.

### 5.1 Scenario catalog

`benchmarks/scenarios.mjs` is the single source of truth for measurement workloads.

It contains a frozen representative User-Agent corpus, stable scenario IDs, bundle entry source generators, import targets, and benchmark iteration policy.

The corpus covers desktop Chromium, desktop Safari, Firefox, Android Chrome, iPhone Safari, standalone Android WebView, LINE LIFF mini-app, Electron, OAI-SearchBot, Googlebot Image, malformed input, and empty input.

Scenario order is fixed. No random data is permitted.

### 5.2 Static size collector

`scripts/performance/collect-sizes.mjs` records:

- npm pack `size`;
- npm pack `unpackedSize`;
- npm pack file count;
- total raw bytes under `dist/esm`;
- total raw bytes under `dist/cjs`;
- consumer bundle raw, gzip, and Brotli bytes.

Consumer bundles are built from the generated npm tarball installed into a temporary clean project. This proves the public package surface rather than bundling repository source directly.

Production bundle settings are fixed:

```text
bundler: esbuild
format: esm
bundle: true
minify: true
treeShaking: true
target: es2020
legalComments: none
sourcemap: false
```

Bundle scenarios:

1. `root-parse`: imports and executes `parse` from `ua-info`;
2. `root-predicate`: imports and executes `isBrowser` and `BrowserId` without importing the parser;
3. `server-parse-request`: imports and executes `parseRequest` from `ua-info/server`;
4. `browser-detect-current`: imports `detectCurrent` from `ua-info/browser` and retains the exported function without executing browser globals.

The browser scenario uses esbuild platform `browser`. Other scenarios use platform `node`.

### 5.3 Runtime collector

`scripts/performance/collect-runtime.mjs` measures Node.js behavior from built ESM and CommonJS outputs.

#### Cold import

Cold import is measured in fresh child processes. Each child records elapsed high-resolution time around one module load. Parent-process startup time is outside the measured interval.

Targets:

- root ESM import;
- root CommonJS require;
- server ESM import;
- browser ESM import.

Each target uses 3 discarded warm-up processes and 15 measured processes. Results include median, minimum, maximum, and p95 milliseconds.

#### Parse throughput

Scenarios:

- `desktop-chromium`;
- `mobile-safari`;
- `line-liff`;
- `crawler`;
- `malformed`;
- `mixed-corpus`.

Each scenario uses 5 discarded warm-up samples and 15 measured samples. Iteration counts are fixed in the scenario catalog. Results include median operations per second, p95 nanoseconds per operation, and a checksum that proves work was executed.

The collector performs no baseline comparison and always reports observed values when execution succeeds.

### 5.4 Report orchestration

`scripts/performance/report.mjs` runs one build, static collection, runtime collection, validation, and Markdown rendering.

Generated files:

```text
artifacts/performance/performance-report.json
artifacts/performance/performance-summary.md
```

The JSON document includes schema version, package identity, source commit when available, environment versions, static metrics, runtime metrics, scenario metadata, and policy `report-only`.

## 6. Report Schema

The schema version is `1`.

```ts
interface PerformanceReportV1 {
  readonly schemaVersion: 1;
  readonly policy: 'report-only';
  readonly generatedAt: string;
  readonly package: {
    readonly name: 'ua-info';
    readonly version: string;
  };
  readonly environment: {
    readonly platform: string;
    readonly arch: string;
    readonly node: string;
    readonly npm: string;
    readonly esbuild: string;
    readonly commit: string | null;
  };
  readonly sizes: {
    readonly package: {
      readonly tarballBytes: number;
      readonly unpackedBytes: number;
      readonly fileCount: number;
    };
    readonly distributions: readonly DistributionSize[];
    readonly bundles: readonly BundleSize[];
  };
  readonly runtime: {
    readonly coldImports: readonly ColdImportResult[];
    readonly parseThroughput: readonly ThroughputResult[];
  };
}
```

Validation rejects unknown schema versions, missing or duplicate scenario IDs, negative or non-finite metrics, unexpected package identity, policy values other than `report-only`, and reports that omit required scenarios.

`generatedAt`, environment versions, commit, and runtime timings may vary. Static sizes should remain stable when inputs and toolchain are unchanged.

## 7. Baseline Contract

The committed baseline is stored at:

```text
benchmarks/baselines/ua-info-2.2.0-node22-linux-x64.json
```

It is generated from a successful GitHub Actions run on `ubuntu-latest`, Node.js 22, after implementation is complete.

The baseline is evidence, not a budget. Reporting may show deltas but must not fail because of those deltas. It records the exact CI run ID and source commit used to generate it.

## 8. CI Integration

Add a dedicated `performance-foundation` job to `.github/workflows/ci.yml`:

- runner: `ubuntu-latest`;
- Node.js: `22`;
- install: `npm install`;
- command: `npm run performance:report`;
- append the Markdown summary to `$GITHUB_STEP_SUMMARY`;
- upload `artifacts/performance` as artifact `performance-report`;
- retain the artifact for 30 days.

The job blocks broken instrumentation but contains no regression threshold evaluator. Existing Node.js 18/20/22, detector coverage, package consumer, and Playground jobs remain unchanged.

## 9. Commands

Add package scripts:

```json
{
  "performance:sizes": "npm run build && node scripts/performance/collect-sizes.mjs",
  "performance:runtime": "npm run build && node scripts/performance/collect-runtime.mjs",
  "performance:report": "node scripts/performance/report.mjs",
  "performance:validate": "node scripts/performance/validate-report.mjs artifacts/performance/performance-report.json"
}
```

`performance:report` owns the single build invocation and calls collectors internally without rebuilding.

## 10. Testing Strategy

### Unit tests

Add Jest tests for percentile and median calculations, finite non-negative metric validation, recursive byte counting with stable path ordering, gzip and Brotli size calculation, duplicate scenario detection, required scenario validation, and Markdown rendering from a fixture report.

### Integration tests

The report command proves package build, npm tarball generation, temporary consumer installation, all four bundle scenarios, all runtime scenarios, report validation, summary output, and JSON output.

### Baseline reproducibility

Before committing the baseline:

1. run the performance job at least twice on the same exact source head;
2. confirm static metrics are identical;
3. confirm every runtime scenario is present and finite;
4. record both runs in implementation evidence;
5. use the later successful run as the baseline source.

Runtime variance is documented but not treated as failure.

## 11. Failure Handling

The harness exits non-zero when build, npm pack, temporary install, esbuild, required scenarios, metric validation, output writing, package identity, or schema validation fails.

The harness does not exit non-zero when size, import timing, or throughput differs from the baseline.

Temporary directories are removed in `finally` blocks. Diagnostic errors include the failed scenario ID and command.

## 12. Future Hard-Gate Criteria

A later design may introduce budgets only after:

- at least five successful Node.js 22 CI reports exist;
- static sizes are stable across identical inputs;
- runtime variance is understood per scenario;
- one intentional static-size regression has proved comparison behavior;
- one intentional runtime slowdown has proved threshold behavior without excessive flakiness.

Expected future policy is exact or low-tolerance static budgets, percentage-based parse throughput thresholds, and wider tolerance or informational-only cold import timing. No threshold values are defined here.

## 13. Acceptance Criteria

The foundation is complete when:

1. deterministic scenarios exist;
2. package, distribution, and consumer bundle metrics are reported;
3. Node.js cold import and parse throughput metrics are reported;
4. report validation and Markdown rendering are tested;
5. CI uploads the report and renders the summary;
6. two exact-head CI runs prove static reproducibility;
7. a `ua-info@2.2.0` baseline is committed with run provenance;
8. no metric regression is blocking;
9. package version, exports, runtime dependencies, parser behavior, and Playground behavior remain unchanged;
10. final Node.js 18/20/22, detector coverage, package consumer, Playground, and performance jobs pass.
