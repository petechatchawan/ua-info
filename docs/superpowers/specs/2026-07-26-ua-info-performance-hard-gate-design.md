# ua-info Performance & Bundle Size Hard Gate Design

**Status:** Approved for implementation  
**Date:** 2026-07-26  
**Repository:** `petechatchawan/ua-info`  
**Baseline package:** `ua-info@2.2.0`

## 1. Purpose

Promote the existing Performance & Bundle Size Foundation from measurement-only reporting to a reliable pull-request gate for deterministic static growth, while keeping noisy runtime measurements advisory.

The gate protects package and consumer size without making shared GitHub Actions runner variance a source of false failures.

## 2. Evidence Used

Five successful Node.js 22 performance reports were reviewed:

1. CI #244, first execution on head `81b6860918cfced15f647b104560f98d8f026b7b`;
2. CI #244, rerun on the same exact head;
3. CI #247, first execution on head `7383b39d186a9184820aab937d752ebab302d025`;
4. CI #247, rerun on the same exact head;
5. CI #249 on closure head `e635924cb76485aa7b5bbff84ca5f80c9ee82dd9`.

Across all five reports, every package-unpacked, file-count, distribution raw-byte, distribution file-count, and consumer raw/gzip/Brotli byte metric matched exactly.

Observed runtime variation was materially noisier:

- cold-import medians varied by several percent between executions;
- parse-throughput medians varied by several percent and were sensitive to runner allocation;
- no correctness or package-output change accompanied those movements.

This evidence supports strict static limits and advisory runtime thresholds.

## 3. Approaches Considered

### A. Strict gate for every metric

Block any increase in package, compressed bundle, import timing, or throughput regression.

Rejected because npm tarball compression, zlib/Brotli output, Node.js patch versions, and shared-runner scheduling can move without a package regression.

### B. Percentage tolerance for every metric

Apply a uniform tolerance such as 2% or 5% to all static and runtime measurements.

Rejected because deterministic raw output demonstrated byte-for-byte stability. A percentage allowance would permit avoidable package growth and would still be inappropriate for runtime noise.

### C. Deterministic static hard gate with runtime advisory thresholds

Block growth only for deterministic unpacked and raw-output metrics. Report tarball/compressed changes and runtime regressions as warnings.

**Selected.** This maximizes signal, minimizes false positives, and preserves a clear path for later runtime enforcement if stronger evidence becomes available.

## 4. Compatibility Constraints

- Package identity remains `ua-info`.
- Package version remains `2.2.0`.
- Node.js support remains `>=18`.
- Runtime measurement remains standardized on Node.js 22.
- Root, `/server`, `/browser`, and `/package.json` exports remain unchanged.
- No file under `src/` changes.
- No runtime dependency is added.
- `esbuild` remains development-only and is pinned exactly to `0.25.8` for reproducible raw bundle output.
- Parser, detector, result shape, predicate, constant, Playground, npm publication, and release behavior remain unchanged.
- Existing performance report schema version `1` remains valid and retains policy `report-only`; gate evaluation is a separate document.

## 5. Gate Architecture

The hard gate adds four focused units.

### 5.1 Reviewed policy

Create:

```text
benchmarks/performance-gate-policy.json
```

Policy schema version `1` contains:

```json
{
  "schemaVersion": 1,
  "mode": "static-hard-gate",
  "baseline": "benchmarks/baselines/ua-info-2.2.0-node22-linux-x64.json",
  "requiredEsbuild": "0.25.8",
  "blocking": {
    "package": ["unpackedBytes", "fileCount"],
    "distributions": ["rawBytes", "fileCount"],
    "bundles": ["rawBytes"]
  },
  "advisory": {
    "package": ["tarballBytes"],
    "bundles": ["gzipBytes", "brotliBytes"],
    "coldImportSlowdownPercent": 25,
    "parseThroughputDropPercent": 15
  }
}
```

The evaluator accepts only this exact field set and rejects unsupported schema versions, modes, metric names, non-positive thresholds, missing baseline paths, and toolchain identities that do not match the policy.

### 5.2 Pure comparison engine

Create:

```text
scripts/performance/evaluate-gate.mjs
```

Primary interface:

```js
evaluatePerformanceGate({ report, baseline, policy })
```

Return value:

```ts
interface PerformanceGateResultV1 {
  readonly schemaVersion: 1;
  readonly mode: 'static-hard-gate';
  readonly status: 'pass' | 'fail';
  readonly blockingViolations: readonly GateFinding[];
  readonly warnings: readonly GateFinding[];
  readonly comparisons: readonly GateComparison[];
}
```

Each finding includes a stable code, metric path, current value, baseline value, delta, and human-readable message.

Comparison order is deterministic:

1. toolchain identity;
2. package metrics;
3. ESM then CommonJS distribution metrics;
4. bundle metrics in scenario-catalog order;
5. cold-import scenarios in catalog order;
6. throughput scenarios in catalog order.

### 5.3 Blocking semantics

The following metrics are maximum budgets. A current value passes when it is less than or equal to the baseline and fails when it is greater:

- `sizes.package.unpackedBytes`;
- `sizes.package.fileCount`;
- every distribution `rawBytes`;
- every distribution `fileCount`;
- every consumer bundle `rawBytes`.

A decrease is always accepted and is shown as an improvement.

The gate also fails when:

- current or baseline report validation fails;
- policy validation fails;
- package identity or package version differs between current report and baseline;
- current esbuild version differs from `requiredEsbuild`;
- baseline esbuild version differs from `requiredEsbuild`;
- required scenarios are missing or duplicated.

### 5.4 Advisory semantics

Warnings do not change `status` and do not produce a non-zero process exit code.

Warn when:

- npm tarball bytes exceed baseline;
- gzip or Brotli bytes for a bundle exceed baseline;
- a cold-import median exceeds baseline by more than `25%`;
- a parse-throughput median falls more than `15%` below baseline.

The threshold is strict: exactly `25%` cold-import slowdown or exactly `15%` throughput loss does not warn; a greater regression warns.

Runtime warnings use median values only. p95, minimum, maximum, and nanoseconds-per-operation remain visible in the report but are not independently evaluated.

## 6. CLI Contract

Add command:

```text
npm run performance:gate
```

Equivalent invocation:

```bash
node scripts/performance/evaluate-gate.mjs \
  --report artifacts/performance/performance-report.json \
  --policy benchmarks/performance-gate-policy.json \
  --output artifacts/performance/performance-gate.json \
  --summary artifacts/performance/performance-gate-summary.md
```

CLI behavior:

- exit `0` when there are no blocking violations, including when warnings exist;
- exit `1` when blocking violations exist;
- exit `2` when arguments, files, JSON, schemas, or toolchain contracts are invalid;
- always write result JSON and Markdown when evaluation reaches comparison;
- include all blocking violations in one run rather than stopping at the first metric;
- print the Markdown summary to stdout.

## 7. CI Integration

Keep the existing `performance-foundation` job identifier to avoid unnecessary branch-protection churn.

After report generation and report validation, add:

```text
Evaluate performance hard gate
```

The step runs `npm run performance:gate` and is blocking.

Summary publication appends both:

```text
artifacts/performance/performance-summary.md
artifacts/performance/performance-gate-summary.md
```

Artifact upload continues to use `performance-report` and contains:

- `performance-report.json`;
- `performance-summary.md`;
- `performance-gate.json`;
- `performance-gate-summary.md`.

Artifact upload and summary publication remain `if: always()` so failed gates retain diagnostics.

## 8. Summary Presentation

The gate summary begins with one explicit status line:

```text
# ua-info Performance Gate: PASS
```

or:

```text
# ua-info Performance Gate: FAIL
```

It contains:

- baseline path and provenance;
- blocking metric table with current, maximum, and delta;
- advisory metric table;
- blocking violations section;
- warnings section;
- baseline-update instructions when status is `fail`.

No ANSI control sequences or locale-dependent number formatting are used.

## 9. Baseline Update Protocol

The baseline is never changed automatically.

A legitimate size increase requires a reviewed pull request that:

1. explains why the growth is necessary;
2. updates the baseline from a successful exact-head Node.js 22 report artifact;
3. records run, job, artifact, source head, Node.js, npm, and esbuild provenance;
4. executes the performance job twice on the same exact source head;
5. confirms blocking static metrics match across both executions;
6. updates `docs/performance.md` when policy or methodology changes;
7. keeps the gate passing against the reviewed new maximums.

A baseline-only increase without implementation justification is invalid.

## 10. Testing Strategy

### Unit tests

Add deterministic tests for:

- policy validation;
- equality pass;
- size decrease pass;
- every blocking metric increase;
- multiple violations returned together;
- tarball and compressed-size warnings;
- `25%` cold-import boundary and greater-than-boundary warning;
- `15%` throughput boundary and greater-than-boundary warning;
- warning-only result remains `pass`;
- esbuild mismatch failure;
- package identity and version mismatch failure;
- stable comparison and finding order;
- Markdown PASS and FAIL rendering;
- CLI exit codes `0`, `1`, and `2`.

### Intentional static regression proof

After the real gate passes, create a temporary commit that lowers the `root-predicate.rawBytes` baseline maximum by exactly one byte.

Expected CI result:

- report generation succeeds;
- report validation succeeds;
- hard-gate step fails;
- diagnostic identifies `sizes.bundles.root-predicate.rawBytes` with current `1888`, maximum `1887`, and delta `+1`;
- artifact upload succeeds.

Revert the temporary commit before final review and retain the failed run ID in closure evidence.

### Intentional runtime slowdown proof

A fixture report with cold import `25.01%` slower and throughput `15.01%` lower must produce warnings while returning status `pass` and CLI exit code `0`.

This proves advisory thresholds without introducing timing sleeps or flaky live regressions.

## 11. Error Handling

All errors include a stable prefix:

- `PERF_GATE_POLICY_INVALID`;
- `PERF_GATE_REPORT_INVALID`;
- `PERF_GATE_BASELINE_INVALID`;
- `PERF_GATE_TOOLCHAIN_MISMATCH`;
- `PERF_GATE_ARGUMENT_INVALID`;
- `PERF_GATE_IO_ERROR`.

Blocking metric findings use code `PERF_GATE_STATIC_BUDGET_EXCEEDED`.

Advisory findings use:

- `PERF_GATE_TARBALL_GROWTH`;
- `PERF_GATE_COMPRESSED_GROWTH`;
- `PERF_GATE_COLD_IMPORT_SLOWDOWN`;
- `PERF_GATE_THROUGHPUT_DROP`.

Temporary or generated files remain under `artifacts/performance` and stay ignored by git.

## 12. Rollback

If the hard gate proves operationally unreliable:

1. remove only the CI `performance:gate` step;
2. keep report generation, validation, summaries, artifacts, policy, evaluator, tests, and baseline;
3. document the failing signal and return to report-only behavior;
4. do not remove measurement history or weaken package/runtime correctness gates.

This rollback changes enforcement only, not instrumentation.

## 13. Acceptance Criteria

The hard-gate phase is complete when:

1. policy and evaluator schemas are validated;
2. deterministic static growth blocks CI;
3. decreases and equality pass;
4. tarball, compressed-size, and runtime movements remain advisory;
5. current and baseline esbuild versions are pinned and validated as `0.25.8`;
6. gate JSON and Markdown are produced and uploaded;
7. intentional static regression produces the expected CI failure and diagnostic;
8. intentional runtime regression produces warnings without failure;
9. final Node.js 18/20/22, detector coverage, package consumer, Playground, report, schema, and hard-gate jobs pass;
10. package version, public API, exports, runtime dependencies, parser behavior, and Playground behavior remain unchanged;
11. closure evidence records RED, intentional regression, GREEN, exact heads, runs, jobs, and artifacts.
