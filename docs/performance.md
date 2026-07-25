# Performance and Bundle Size

`ua-info` measures package size, consumer bundle size, module import cost, and parsing throughput. Deterministic static growth is enforced in CI; compression and runtime movement remain advisory.

## Commands

```bash
npm run performance:sizes
npm run performance:runtime
npm run performance:report
npm run performance:validate
npm run performance:gate
```

The report and gate commands write:

```text
artifacts/performance/performance-report.json
artifacts/performance/performance-summary.md
artifacts/performance/performance-gate.json
artifacts/performance/performance-gate-summary.md
```

Generated output is ignored by git. The reviewed baseline remains committed under `benchmarks/baselines/`, and enforcement policy is committed at `benchmarks/performance-gate-policy.json`.

## Measurement model

The performance report remains schema version `1` with policy `report-only`. It records observations without deciding whether a pull request passes.

The gate evaluator is a separate schema version `1` document with mode `static-hard-gate`. It compares a current report against the reviewed baseline and policy.

This separation preserves the measurement format and allows enforcement to change without rewriting historical reports.

## Static size measurements

Consumer bundles are generated from a clean temporary project that installs the actual npm tarball produced by `npm pack`. Repository source is not bundled directly.

The fixed bundler contract is:

```text
esbuild: 0.25.8
format: esm
bundle: true
minify: true
treeShaking: true
target: es2020
legalComments: none
sourcemap: false
```

The exact esbuild version is validated for both current report and baseline.

### Blocking maximum budgets

The following metrics must be less than or equal to the reviewed baseline:

- unpacked npm package bytes;
- packed file count;
- raw ESM distribution bytes and file count;
- raw CommonJS distribution bytes and file count;
- raw bytes for every consumer bundle scenario.

Equality and reductions pass. Any increase blocks CI with `PERF_GATE_STATIC_BUDGET_EXCEEDED`.

Bundle scenarios cover:

- root `parse()` usage;
- predicate-only root usage;
- `parseRequest()` from `ua-info/server`;
- `detectCurrent()` from `ua-info/browser`.

### Advisory static metrics

The following metrics produce warnings but do not fail CI:

- npm tarball bytes;
- gzip bytes for each bundle;
- Brotli bytes for each bundle.

These outputs can move with npm, compression libraries, or platform tooling even when unpacked and raw output remains unchanged.

## Runtime measurements

Runtime measurements execute on Node.js 22 in CI and contain shared-runner noise. They remain advisory.

### Cold import

Cold import measurements use fresh child processes. The timer surrounds module loading only; parent-process startup is outside the measured interval.

Targets cover root ESM, root CommonJS, server ESM, and browser ESM entry points. Each target discards three warm-up processes and reports fifteen measured samples.

A warning is produced only when median import time is more than `25%` slower than baseline. Exactly `25%` does not warn.

### Parse throughput

Throughput scenarios cover desktop Chromium, mobile Safari, LINE LIFF, crawler inputs, malformed inputs, and the complete mixed corpus.

Each scenario discards five warm-up samples and reports fifteen measured samples. Results include median operations per second, p95 nanoseconds per operation, and a checksum proving parser results were consumed.

A warning is produced only when median throughput is more than `15%` below baseline. Exactly `15%` does not warn.

Warnings use median values only. p95, minimum, maximum, and nanoseconds-per-operation remain visible evidence but are not independently evaluated.

## CLI exit codes

`npm run performance:gate` uses:

- exit `0`: valid evaluation with no blocking violations, including warning-only results;
- exit `1`: one or more deterministic static budgets exceeded;
- exit `2`: invalid arguments, files, JSON, schemas, package identity, or toolchain contract.

The evaluator reports all blocking violations in one execution instead of stopping at the first failure.

## CI policy

The existing `performance-foundation` job identifier is retained to avoid branch-protection churn. It now:

1. installs development dependencies;
2. generates the report;
3. validates report schema and required scenarios;
4. evaluates the blocking performance gate;
5. appends report and gate Markdown summaries to GitHub Actions;
6. uploads report, gate result, and both summaries as `performance-report` for 30 days.

Summary publication and artifact upload use `if: always()` so failed gates preserve diagnostics.

The job fails for broken instrumentation, invalid schemas, package/toolchain mismatch, or deterministic static growth. Tarball, compressed-size, and runtime warnings do not fail the job.

## Baseline update protocol

The baseline is never updated automatically.

A legitimate static increase requires a reviewed pull request that:

1. explains why the growth is necessary;
2. updates the baseline from a successful exact-head Node.js 22 artifact;
3. records run, job, artifact, source head, Node.js, npm, and esbuild provenance;
4. executes the performance job twice on the same exact source head;
5. confirms blocking static metrics match across both executions;
6. updates this document when policy or methodology changes;
7. keeps the gate passing against the reviewed new maximums.

A baseline-only increase without implementation justification is not an acceptable fix.

## Rollback

If enforcement proves operationally unreliable, remove only the `performance:gate` CI step and return to report-only behavior. Keep the measurement harness, reports, policy, evaluator, tests, baseline, summaries, and historical artifacts for diagnosis.

## Scope limits

This system does not measure:

- browser or Chromium runtime performance;
- `detectCurrent()` execution against real browser globals;
- memory usage or allocation counts;
- garbage collection;
- performance against competing libraries.

User-Agent and Client Hints values remain untrusted claims. Performance enforcement does not change detection semantics or authentication guarantees.
