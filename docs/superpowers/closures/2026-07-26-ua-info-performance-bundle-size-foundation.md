# ua-info Performance & Bundle Size Foundation Closure

**Status:** Implemented and verified  
**Date:** 2026-07-26  
**Pull request:** #44  
**Policy:** `report-only`

## Delivery

The Performance & Bundle Size Foundation is implemented without changing package runtime behavior or public API.

Delivered components:

- deterministic User-Agent and bundle scenario catalog;
- reusable statistics, filesystem, compression, command, and JSON utilities;
- npm tarball size and unpacked-size collection;
- ESM and CommonJS distribution-size collection;
- clean installed-consumer bundles through esbuild;
- raw, gzip, and Brotli bundle reporting;
- Node.js cold ESM/CommonJS import measurements;
- `parse()` throughput measurements for six workloads;
- report schema version 1 with strict validation;
- JSON report and Markdown summary rendering;
- dedicated Node.js 22 `performance-foundation` CI job;
- 30-day `performance-report` CI artifact;
- committed `ua-info@2.2.0` Linux x64 / Node.js 22 baseline;
- methodology documentation in `docs/performance.md`.

## TDD evidence

### RED

- Exact head: `1f0f662809f7ae115e9d7f6ba41b9e23e64e83a9`
- CI run: `30167839273` / CI #226
- Existing lint and detector gates passed.
- Main test matrix failed because the newly discovered performance contracts referenced modules that did not yet exist.

An earlier CI run did not count as RED because Jest had not discovered the new out-of-tree tests. Test discovery was corrected before recording RED evidence.

### GREEN implementation

- Exact implementation head before baseline refresh: `7383b39d186a9184820aab937d752ebab302d025`
- CI run: `30168419459` / CI #247
- Node.js 18, 20, and 22 package jobs passed.
- Detector fixture and coverage job passed.
- Playground boundaries, type-check, tests, production build, and Chromium smoke passed.
- Performance report generation, schema validation, summary publication, and artifact upload passed.

## Reproducibility evidence

The performance job executed twice on exact source head:

```text
7383b39d186a9184820aab937d752ebab302d025
```

Execution 1:

- run: `30168419459`
- job: `89705252596`
- artifact: `8622238527`

Execution 2:

- run: `30168419459`, rerun attempt 2
- job: `89705474319`
- artifact: `8622259216`

Static values matched exactly across both executions:

- npm tarball: `22,960` bytes;
- npm unpacked package: `120,620` bytes;
- packed files: `56`;
- ESM distribution: `50,083` bytes / `35` files;
- CommonJS distribution: `44,308` bytes / `18` files;
- every bundle raw, gzip, and Brotli value matched byte-for-byte.

Observed runtime variation remained informational:

- cold-import median deltas ranged from approximately `-1.64%` to `+4.55%`;
- parse-throughput median deltas ranged from approximately `-3.70%` to `-1.30%`.

This confirms that static measurements are suitable for later strict budgets, while runtime thresholds require statistical tolerance.

## Baseline

Committed baseline:

```text
benchmarks/baselines/ua-info-2.2.0-node22-linux-x64.json
```

Baseline source:

- source head: `7383b39d186a9184820aab937d752ebab302d025`;
- CI run: `30168419459`;
- job: `89705474319`;
- artifact: `8622259216`;
- runner: `ubuntu-latest`;
- Node.js: `v22.23.1`;
- npm: `10.9.8`;
- esbuild: `0.25.8`.

## Baseline bundle sizes

| Scenario | Raw | Gzip | Brotli |
| --- | ---: | ---: | ---: |
| `root-parse` | 12,993 B | 4,172 B | 3,804 B |
| `root-predicate` | 1,888 B | 571 B | 517 B |
| `server-parse-request` | 15,401 B | 4,996 B | 4,553 B |
| `browser-detect-current` | 16,758 B | 5,489 B | 5,027 B |

## Compatibility audit

- package remains `ua-info@2.2.0`;
- Node.js support remains `>=18`;
- root, `/server`, `/browser`, and `/package.json` exports are unchanged;
- no file under `src/` changed;
- no runtime dependency was added;
- esbuild is development-only;
- no parser, detector, result shape, predicate, constant, or Playground behavior changed;
- npm publication and release workflows are unchanged;
- no performance metric movement is blocking in this phase.

## Follow-on gate

A later Hard Gate design may define static size budgets after enough routine reports exist. Runtime thresholds must remain separate and use evidence-based tolerances; cold import timing may remain informational.
