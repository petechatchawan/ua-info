# Performance and Bundle Size

`ua-info` measures package size, consumer bundle size, module import cost, and parsing throughput as a report-only engineering signal.

The current foundation deliberately does **not** enforce performance budgets. It validates that the measurement harness works, required scenarios exist, and every metric is finite. Changes in measured values are reported but do not fail a pull request.

## Commands

```bash
npm run performance:sizes
npm run performance:runtime
npm run performance:report
npm run performance:validate
```

The complete report command builds the package once and writes:

```text
artifacts/performance/performance-report.json
artifacts/performance/performance-summary.md
```

Generated reports are ignored by git. The reviewed reference report is committed separately under `benchmarks/baselines/`.

## Static size measurements

Static metrics are expected to be deterministic when source, toolchain, and platform are unchanged.

The report includes:

- npm tarball bytes;
- unpacked npm package bytes;
- packed file count;
- raw ESM distribution bytes and file count;
- raw CommonJS distribution bytes and file count;
- minified, tree-shaken consumer bundles measured as raw, gzip, and Brotli bytes.

Consumer bundles are generated from a clean temporary project that installs the actual npm tarball produced by `npm pack`. They are not bundled directly from repository source.

Bundle scenarios cover:

- root `parse()` usage;
- predicate-only root usage;
- `parseRequest()` from `ua-info/server`;
- `detectCurrent()` from `ua-info/browser`.

The bundler configuration is fixed to esbuild, ESM output, production minification, tree-shaking, ES2020 target, no source map, and no legal-comment output.

## Runtime measurements

Runtime measurements execute on Node.js 22 in CI and are expected to contain runner noise. They are useful for trend analysis, not single-run release decisions.

### Cold import

Cold import measurements use fresh child processes. The timer surrounds module loading only; parent-process startup is outside the measured interval.

Targets cover root ESM, root CommonJS, server ESM, and browser ESM entry points. Each target discards three warm-up processes and reports fifteen measured samples with median, p95, minimum, and maximum milliseconds.

### Parse throughput

Throughput scenarios cover desktop Chromium, mobile Safari, LINE LIFF, crawler inputs, malformed inputs, and the complete mixed corpus.

Each scenario discards five warm-up samples and reports fifteen measured samples. Results include median operations per second, p95 nanoseconds per operation, and a checksum proving that parser results were consumed.

## CI policy

The `performance-foundation` CI job runs on Node.js 22. It:

1. installs development dependencies;
2. generates the report;
3. validates schema and required scenarios;
4. publishes the Markdown report to the GitHub Actions summary;
5. uploads the JSON and Markdown files as the `performance-report` artifact for 30 days.

The job fails when the harness, package build, npm tarball, clean install, bundle generation, runtime collection, report schema, or required scenarios fail.

The job does not fail when a size or timing differs from the committed baseline.

## Baseline interpretation

The baseline file is evidence of a successful measurement run, not a budget. Deltas shown in reports are informational.

A later hard-gate design may introduce static size budgets and statistically justified throughput thresholds only after multiple successful CI reports establish stability and variance characteristics. Cold import timing may remain informational because it is especially sensitive to shared-runner noise.

## Scope limits

This foundation does not measure:

- browser or Chromium runtime performance;
- `detectCurrent()` execution against real browser globals;
- memory usage or allocation counts;
- garbage collection;
- performance against competing libraries.

User-Agent and Client Hints values remain untrusted claims. Performance measurements do not change detection semantics or authentication guarantees.
