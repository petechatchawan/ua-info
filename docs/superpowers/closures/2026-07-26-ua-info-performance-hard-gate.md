# ua-info Performance & Bundle Size Hard Gate Closure

**Status:** Implemented and verified  
**Date:** 2026-07-26  
**Pull request:** #46  
**Mode:** `static-hard-gate`

## 1. Delivery

The Performance & Bundle Size Hard Gate is implemented on top of the existing report-only measurement foundation.

Delivered components:

- reviewed gate policy in `benchmarks/performance-gate-policy.json`;
- strict policy schema validation;
- pure deterministic comparison engine;
- blocking maximum budgets for unpacked package, file-count, distribution raw, distribution file-count, and consumer raw-bundle metrics;
- advisory warnings for tarball, gzip, Brotli, cold-import, and parse-throughput movement;
- fixed runtime warning thresholds of more than `25%` cold-import slowdown and more than `15%` throughput loss;
- exact esbuild `0.25.8` validation for current and baseline reports;
- gate JSON schema version `1` output;
- PASS/FAIL Markdown summary with baseline provenance and update protocol;
- CLI exit codes `0`, `1`, and `2`;
- blocking `performance:gate` step in the existing `performance-foundation` CI job;
- always-published report and gate summaries;
- always-uploaded diagnostics for failed gates;
- refreshed reviewed `ua-info@2.2.0` baseline;
- complete methodology and rollback documentation in `docs/performance.md`.

## 2. Design and Plan

Approved design:

```text
docs/superpowers/specs/2026-07-26-ua-info-performance-hard-gate-design.md
```

Implementation plan:

```text
docs/superpowers/plans/2026-07-26-ua-info-performance-hard-gate.md
```

Specification PR:

- PR: `#45 docs: define performance hard gate`;
- merged commit: `e97a024578434e3f1a3db22ad0a11b7894a1de7b`.

## 3. Policy Evidence

The hard-gate policy was selected after reviewing five successful Node.js 22 reports from the foundation phase:

| Evidence | Exact head | Run | Job | Artifact |
| --- | --- | ---: | ---: | ---: |
| CI #244 execution 1 | `81b6860918cfced15f647b104560f98d8f026b7b` | `30168168502` | `89704603513` | `8622172411` |
| CI #244 execution 2 | `81b6860918cfced15f647b104560f98d8f026b7b` | `30168168502` | `89704942126` | `8622206482` |
| CI #247 execution 1 | `7383b39d186a9184820aab937d752ebab302d025` | `30168419459` | `89705252596` | `8622238527` |
| CI #247 execution 2 | `7383b39d186a9184820aab937d752ebab302d025` | `30168419459` | `89705474319` | `8622259216` |
| CI #249 closure | `e635924cb76485aa7b5bbff84ca5f80c9ee82dd9` | `30168606593` | `89705731100` | `8622286990` |

Across these reports:

- unpacked package bytes and packed file count were stable;
- ESM and CommonJS raw bytes and file counts were stable;
- every consumer bundle raw, gzip, and Brotli value matched byte-for-byte;
- cold-import and throughput measurements varied by several percent on shared runners.

Therefore deterministic raw/static metrics became blocking and runtime metrics remained advisory.

## 4. TDD Evidence

### RED

Exact head:

```text
403da5e03344ef3871fbb54e7e2d619f16e29aa4
```

CI evidence:

- CI #253;
- run `30169201716`;
- Node.js 18 job `89707273524`: failed at tests;
- Node.js 20 job `89707273516`: failed at tests;
- Node.js 22 job `89707273601`: failed at tests;
- lint completed successfully before test failure;
- detector coverage job `89707273467`: passed;
- Playground job `89707273493`: passed;
- existing report-only performance job `89707273530`: passed.

The new policy, evaluator, and CLI contracts were discovered by Jest and failed because the gate modules did not yet exist.

### Core GREEN

Exact head:

```text
45ce12d3f23b1a8b703e538e3aedf5a2cfab002f
```

CI evidence:

- CI #258;
- run `30169302102`;
- Node.js 18 job `89707540793`: passed;
- Node.js 20 job `89707540799`: passed;
- Node.js 22 job `89707540779`: passed;
- detector coverage job `89707540800`: passed;
- Playground job `89707540802`: passed;
- report-only performance job `89707540807`: passed.

This proved the policy validator, evaluator, Markdown renderer, CLI, and package command before CI enforcement was enabled.

## 5. Baseline Refresh Evidence

Enabling `performance:gate` added one development script to the published `package.json` metadata. This caused a legitimate one-time package-size increase without changing distribution or consumer bundle output.

Observed change:

| Metric | Previous | Current | Delta |
| --- | ---: | ---: | ---: |
| npm tarball | 22,960 B | 23,022 B | +62 B |
| unpacked package | 120,620 B | 120,907 B | +287 B |
| packed files | 56 | 56 | 0 |

All ESM, CommonJS, and consumer bundle values remained identical.

Two executions ran on exact implementation head:

```text
05fd18c3e45931e34d36a1a6f38fd8b40a7080a7
```

Execution 1:

- CI #260 / run `30169359345`;
- job `89707694839`;
- artifact `8622480896`.

Execution 2:

- CI #260 rerun / run `30169359345`;
- job `89707930617`;
- artifact `8622504524`.

Static metrics matched exactly across both executions. The later report became the reviewed baseline source.

Refreshed baseline provenance:

- source head: `05fd18c3e45931e34d36a1a6f38fd8b40a7080a7`;
- run: `30169359345`;
- job: `89707930617`;
- artifact: `8622504524`;
- Node.js: `v22.23.1`;
- npm: `10.9.8`;
- esbuild: `0.25.8`.

## 6. First Enforced GREEN

Baseline refresh commit:

```text
5a594cef2d46dd3439ddc77f69941bd700781724
```

CI evidence:

- CI #261;
- run `30169518723`;
- performance job `89708120053`: report, validation, gate, summaries, and artifact passed;
- Node.js 18/20/22 jobs passed;
- detector coverage passed;
- Playground Chromium production smoke passed.

This was the first complete successful run with the blocking gate active.

## 7. Intentional Static Regression Proof

Temporary proof head:

```text
a80c4f3864f05b40201fe8262e735389bb5c3657
```

The reviewed maximum for only this metric was temporarily changed:

```text
sizes.bundles.root-predicate.rawBytes: 1888 -> 1887
```

CI evidence:

- CI #262;
- run `30169608407`;
- failed performance job `89708366915`;
- artifact `8622552080`;
- report generation: passed;
- report validation: passed;
- gate evaluation: failed;
- summary publication: passed;
- artifact upload: passed;
- Node.js 18/20/22 jobs: passed;
- detector coverage: passed;
- unrelated package and Playground checks remained healthy.

Exact diagnostic:

```text
code: PERF_GATE_STATIC_BUDGET_EXCEEDED
path: sizes.bundles.root-predicate.rawBytes
current: 1888
maximum: 1887
delta: +1
```

The artifact contained exactly one blocking violation and no warnings.

## 8. Restored GREEN

Reviewed baseline restoration commit:

```text
6a3bad2304eed86decb5c133e2eb48caf7f925cf
```

CI evidence:

- CI #263;
- run `30169674310`;
- performance job `89708579812`: passed;
- performance artifact `8622570807`;
- Node.js 18/20/22 jobs: passed;
- detector coverage: passed;
- packed consumers: passed;
- Playground Chromium production smoke: passed.

The temporary `1887` maximum was fully removed; the reviewed `1888` baseline is restored.

## 9. Final Expanded Verification

Exact implementation head before closure documentation:

```text
e2d021269200c569627adf63e0bc17c0fef46544
```

CI evidence:

- CI #265;
- run `30169782755`;
- conclusion: success;
- performance artifact: `8622598306`;
- Node.js 18/20/22: passed;
- detector coverage: passed;
- packed package and ESM/CommonJS consumers: passed;
- Playground boundaries, type-check, tests, build, and Chromium smoke: passed;
- performance report generation: passed;
- report schema validation: passed;
- static hard gate: passed;
- report and gate summaries: published;
- artifact upload: passed.

Expanded unit coverage verifies:

- equality and reductions pass;
- every package blocking metric;
- every ESM/CommonJS blocking metric;
- every consumer raw-bundle blocking metric;
- deterministic multi-violation ordering;
- tarball and compressed-size warnings;
- exact `25%` and `15%` runtime threshold boundaries;
- warning-only status remains PASS;
- current and baseline package mismatch handling;
- current and baseline esbuild mismatch handling;
- strict policy key, metric, duplicate, and threshold validation;
- CLI exit codes `0`, `1`, and `2`;
- PASS and FAIL output generation.

## 10. Compatibility Audit

- package remains `ua-info@2.2.0`;
- Node.js support remains `>=18`;
- root, `/server`, `/browser`, and `/package.json` exports are unchanged;
- no file under `src/` changed;
- no Playground source file changed;
- no public API, result shape, constant, predicate, parser, or detector behavior changed;
- no runtime dependency was added;
- esbuild remains development-only and exactly `0.25.8`;
- npm publication and release workflows are unchanged;
- no new npm version or publication is required.

## 11. Changed-File Scope

Implementation changes are limited to:

- `.github/workflows/ci.yml`;
- `benchmarks/baselines/ua-info-2.2.0-node22-linux-x64.json`;
- `benchmarks/performance-gate-policy.json`;
- `docs/performance.md`;
- this closure document;
- `package.json` development script metadata;
- `scripts/performance/` evaluator, CLI, renderer, policy validator, and tests.

No product runtime source was modified.

## 12. Operational Policy

The baseline is never updated automatically. A legitimate deterministic increase requires implementation justification, two exact-head Node.js 22 reports with matching static metrics, reviewed provenance, and a passing gate against the approved new maximums.

If enforcement becomes operationally unreliable, remove only the CI `performance:gate` step. Keep the measurement harness, evaluator, policy, tests, baseline, summaries, and historical artifacts intact for diagnosis.
