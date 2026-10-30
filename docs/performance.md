# Performance and Bundle Size

`user-agent-parser-ts` measures package size, consumer bundle size, module import cost, and parsing throughput. The release checks deliberately separate deterministic hard limits from noisy advisory metrics.

## Commands

```bash
npm run performance:sizes
npm run performance:runtime
npm run performance:report
npm run performance:validate
npm run performance:gate
```

Generated reports are written under `artifacts/performance/` and are ignored by git. The reviewed comparison baseline remains under `benchmarks/baselines/`; the gate policy is `benchmarks/performance-gate-policy.json`.

## Measurement model

The performance report uses schema version `1` and remains measurement-only. The separate gate document also uses schema version `1` with mode `static-hard-gate`.

This keeps historical measurements stable while allowing release policy to evolve independently.

## Package ceilings

Package size and file count are enforced by `scripts/verify-package.mjs`, not duplicated as zero-growth performance blockers.

Every packed release must satisfy:

```text
unpacked npm package <= 150,000 bytes
packed file count    <= 64 files
```

The same tarball is used for content validation and ESM/CommonJS/TypeScript consumer verification.

## Bundle measurements

Consumer bundles are generated from a clean temporary project that installs the actual npm tarball produced by `npm pack`.

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

### Blocking bundle metric

Only raw consumer-bundle bytes are a performance hard gate against the reviewed baseline.

Bundle scenarios cover:

- root `parse()` usage;
- `isChrome()` from `user-agent-parser-ts/check`;
- `parseRequest()` from `user-agent-parser-ts/server`;
- `detect()` from `user-agent-parser-ts/browser`.

An increase in a blocking raw bundle metric fails `performance:gate` with `PERF_GATE_STATIC_BUDGET_EXCEEDED`.

Raw distribution totals and distribution file counts are still measured, but they are no longer duplicate zero-growth blockers because published package size/file-count already have explicit absolute ceilings.

### Advisory static metrics

The following remain advisory:

- npm tarball bytes;
- gzip bytes for each bundle;
- Brotli bytes for each bundle.

Compression and tarball values can vary with npm/platform tooling even when the shipped logical content remains acceptable.

## Runtime measurements

Runtime measurements execute on Node.js 22 in CI and can contain shared-runner noise.

### Cold import

Cold-import measurements use fresh child processes. The timer surrounds module loading only; parent-process startup is outside the measured interval.

Targets cover root ESM, root CommonJS, server ESM, and browser ESM entry points. Each target discards three warm-up processes and reports fifteen measured samples.

A warning is produced only when median import time is more than `25%` slower than baseline.

### Parse throughput

Throughput scenarios cover desktop Chromium, mobile Safari, LINE input, crawler inputs, malformed inputs, and the mixed corpus.

Each scenario discards five warm-up samples and reports fifteen measured samples. Results include median operations per second, p95 nanoseconds per operation, and a checksum proving parser results were consumed.

A warning is produced when median throughput is more than `15%` below baseline.

Although the existing evaluator records this as an advisory warning, the **release review treats a parse-throughput drop above 15% as a release failure**. Such a regression must be optimized or otherwise resolved before publishing; it must not be waived merely because `performance:gate` exits successfully.

## CLI exit codes

`npm run performance:gate` uses:

- exit `0`: valid evaluation with no blocking violations, including warning-only results;
- exit `1`: one or more blocking raw bundle budgets exceeded;
- exit `2`: invalid arguments, files, JSON, schemas, package identity, or toolchain contract.

The evaluator reports all blocking violations in one execution instead of stopping at the first failure.

## CI policy

The existing `performance-foundation` job identifier is retained. It:

1. installs development dependencies;
2. generates the report;
3. validates report schema and required scenarios;
4. evaluates the blocking performance gate;
5. publishes report and gate summaries;
6. uploads diagnostics as the `performance-report` artifact.

The CI gate fails for broken instrumentation, invalid schemas, package/toolchain mismatch, or blocking raw bundle growth. Release review additionally rejects parse-throughput regression above the documented 15% threshold.

## Baseline update protocol

The baseline is never updated automatically.

A legitimate blocking bundle increase requires a reviewed change that:

1. explains why the growth is necessary;
2. updates the baseline from a successful exact-head Node.js 22 artifact;
3. records run, job, artifact, source head, Node.js, npm, and esbuild provenance;
4. executes the performance job twice on the same exact source head;
5. confirms blocking metrics are reproducible;
6. updates this document when policy or methodology changes;
7. keeps the gate passing against the reviewed new maximums.

A baseline-only increase without implementation justification is not an acceptable fix.

## Scope limits

This system does not measure:

- browser rendering/runtime performance;
- real-browser `detect()` execution cost;
- memory usage or allocation counts;
- garbage collection;
- performance against competing libraries.

User-Agent and Client Hints values remain untrusted claims. Performance enforcement does not change detection semantics or authentication guarantees.
