# ua-info Performance & Bundle Size Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add reproducible package-size, consumer-bundle, cold-import, and parse-throughput reporting for `ua-info@2.2.0`, publish the report in CI, and commit a provenance-backed report-only baseline.

**Architecture:** Build one deterministic scenario catalog and a small set of pure performance utilities. Static and runtime collectors produce structured fragments; a report orchestrator builds once, combines and validates the fragments, and writes JSON plus Markdown. CI runs the harness on Node.js 22 and uploads evidence without enforcing regression budgets.

**Tech Stack:** Node.js ESM scripts, Jest 30, TypeScript 4.9, esbuild, npm pack, zlib gzip/Brotli, GitHub Actions, Node.js 18/20/22 compatibility matrix.

## Global Constraints

- Package identity remains `ua-info`.
- Package version remains `2.2.0`.
- Node.js support remains `>=18`.
- Runtime measurement is standardized on Node.js 22.
- Root, `/server`, `/browser`, and `/package.json` exports remain unchanged.
- No runtime dependency is added.
- `esbuild` is development-only.
- No parser, detector, public type, predicate, constant, Playground, release, or runtime behavior changes.
- Performance policy remains exactly `report-only`; no threshold evaluator is added.
- Generated reports live under `artifacts/performance` and are ignored by git except the committed baseline.

---

### Task 1: Pure Measurement Utilities

**Files:**
- Create: `scripts/performance/lib.mjs`
- Create: `scripts/performance/__tests__/lib.test.cjs`
- Modify: `jest.config.cjs`

**Interfaces:**
- Produces: `median(values)`, `percentile(values, percentileValue)`, `assertFiniteNonNegative(value, label)`, `compressedSizes(buffer)`, `directoryBytes(directory)`, `run(command, args, options)`, `readJson(path)`, and `writeJson(path, value)`.

- [ ] **Step 1: Write failing utility tests**

Test exact median behavior for odd/even arrays, nearest-rank p95, rejection of negative/NaN/Infinity metrics, deterministic recursive byte totals, and positive raw/gzip/Brotli byte counts.

```js
const { median, percentile, assertFiniteNonNegative, compressedSizes } = await import('../lib.mjs');

expect(median([9, 1, 5])).toBe(5);
expect(median([1, 3, 5, 7])).toBe(4);
expect(percentile([1, 2, 3, 4, 5], 95)).toBe(5);
expect(() => assertFiniteNonNegative(-1, 'metric')).toThrow('metric');
expect(compressedSizes(Buffer.from('repeat '.repeat(100))).rawBytes).toBeGreaterThan(0);
```

- [ ] **Step 2: Run the focused test and verify RED**

```bash
npm test -- scripts/performance/__tests__/lib.test.cjs --runInBand
```

Expected: FAIL because `scripts/performance/lib.mjs` does not exist.

- [ ] **Step 3: Implement the utilities**

Use `node:fs/promises`, `node:child_process`, `node:util`, and `node:zlib`. Sort directory entries lexically before recursion. `run()` must include the failed command and stderr in thrown errors.

- [ ] **Step 4: Run the focused test and verify GREEN**

```bash
npm test -- scripts/performance/__tests__/lib.test.cjs --runInBand
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add jest.config.cjs scripts/performance/lib.mjs scripts/performance/__tests__/lib.test.cjs
git commit -m "test: add deterministic performance utilities"
```

---

### Task 2: Deterministic Scenario Catalog

**Files:**
- Create: `benchmarks/scenarios.mjs`
- Create: `scripts/performance/__tests__/scenarios.test.cjs`

**Interfaces:**
- Produces: `USER_AGENT_CORPUS`, `BUNDLE_SCENARIOS`, `COLD_IMPORT_SCENARIOS`, `THROUGHPUT_SCENARIOS`, `REQUIRED_SCENARIO_IDS`, and `assertUniqueScenarioIds()`.

- [ ] **Step 1: Write failing catalog tests**

Require fixed corpus order, exact required IDs, unique IDs, positive integer iteration counts, and the four bundle scenario platforms.

```js
const scenarios = await import('../../../benchmarks/scenarios.mjs');
expect(scenarios.BUNDLE_SCENARIOS.map(({ id }) => id)).toEqual([
  'root-parse',
  'root-predicate',
  'server-parse-request',
  'browser-detect-current',
]);
expect(() => scenarios.assertUniqueScenarioIds([{ id: 'x' }, { id: 'x' }])).toThrow('Duplicate scenario id: x');
```

- [ ] **Step 2: Verify RED**

```bash
npm test -- scripts/performance/__tests__/scenarios.test.cjs --runInBand
```

Expected: FAIL because the catalog does not exist.

- [ ] **Step 3: Implement the frozen catalog**

Use the twelve workloads specified by the design. Bundle source strings must call or retain imports so esbuild cannot remove the measured API. Throughput scenarios use 20,000 iterations for single-UA workloads and 24,000 total operations for the mixed corpus.

- [ ] **Step 4: Verify GREEN**

```bash
npm test -- scripts/performance/__tests__/scenarios.test.cjs --runInBand
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add benchmarks/scenarios.mjs scripts/performance/__tests__/scenarios.test.cjs
git commit -m "test: define deterministic performance scenarios"
```

---

### Task 3: Static Package and Consumer Bundle Collector

**Files:**
- Create: `scripts/performance/collect-sizes.mjs`
- Create: `scripts/performance/__tests__/collect-sizes.test.cjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: utilities and `BUNDLE_SCENARIOS`.
- Produces: `collectSizes({ rootDirectory })` returning `{ package, distributions, bundles, toolchain }`.

- [ ] **Step 1: Add `esbuild` as a development dependency**

```bash
npm install --save-dev esbuild@0.25.8
```

Do not add runtime dependencies.

- [ ] **Step 2: Write failing collector tests**

Use a temporary fixture directory to test distribution byte totals and package-report normalization. Assert that bundle results contain raw, gzip, and Brotli bytes and retain scenario order.

- [ ] **Step 3: Verify RED**

```bash
npm test -- scripts/performance/__tests__/collect-sizes.test.cjs --runInBand
```

Expected: FAIL because `collect-sizes.mjs` does not exist.

- [ ] **Step 4: Implement npm package measurement**

Run:

```bash
npm pack --json --dry-run
npm pack --json --pack-destination <temporary-directory>
```

Validate name `ua-info`, normalize `size`, `unpackedSize`, and `files.length`, then install the produced tarball in a temporary project with:

```bash
npm install --ignore-scripts --no-audit --no-fund <tarball-path>
```

- [ ] **Step 5: Implement consumer bundles**

Generate one entry file per scenario and invoke the esbuild JavaScript API with the fixed design settings. Measure emitted bytes and compressed sizes. Remove the temporary project in `finally`.

- [ ] **Step 6: Verify focused tests and live collector**

```bash
npm run build
node scripts/performance/collect-sizes.mjs --output artifacts/performance/sizes.json
npm test -- scripts/performance/__tests__/collect-sizes.test.cjs --runInBand
```

Expected: collector exits 0, writes valid JSON, tests PASS.

- [ ] **Step 7: Commit**

```bash
git add package.json scripts/performance/collect-sizes.mjs scripts/performance/__tests__/collect-sizes.test.cjs
git commit -m "feat: measure package and consumer bundle sizes"
```

---

### Task 4: Node.js Runtime Collector

**Files:**
- Create: `scripts/performance/import-worker.mjs`
- Create: `scripts/performance/collect-runtime.mjs`
- Create: `scripts/performance/__tests__/collect-runtime.test.cjs`

**Interfaces:**
- Consumes: utilities, `COLD_IMPORT_SCENARIOS`, `THROUGHPUT_SCENARIOS`, and built `dist` files.
- Produces: `collectRuntime({ rootDirectory })` returning `{ coldImports, parseThroughput }`.

- [ ] **Step 1: Write failing statistical-shape tests**

Inject a fake process runner and fake timer where possible. Require 15 measured samples, finite median/min/max/p95 values, positive throughput, and non-zero checksums.

- [ ] **Step 2: Verify RED**

```bash
npm test -- scripts/performance/__tests__/collect-runtime.test.cjs --runInBand
```

Expected: FAIL because the runtime collector does not exist.

- [ ] **Step 3: Implement cold import worker**

The worker accepts `--kind import|require` and `--target <absolute-path>`, measures only module loading with `performance.now()`, and prints one JSON line:

```json
{"milliseconds":1.234}
```

- [ ] **Step 4: Implement throughput collection**

Import `parse` from `dist/esm/index.js`. For each scenario, execute five warm-up samples and fifteen measured samples. Accumulate result properties such as `result.ua.length`, browser/client/context presence, and version lengths into a numeric checksum.

- [ ] **Step 5: Verify focused tests and live collector**

```bash
npm run build
node scripts/performance/collect-runtime.mjs --output artifacts/performance/runtime.json
npm test -- scripts/performance/__tests__/collect-runtime.test.cjs --runInBand
```

Expected: collector exits 0, all metrics are finite, tests PASS.

- [ ] **Step 6: Commit**

```bash
git add scripts/performance/import-worker.mjs scripts/performance/collect-runtime.mjs scripts/performance/__tests__/collect-runtime.test.cjs
git commit -m "feat: measure import cost and parse throughput"
```

---

### Task 5: Report Validation, Rendering, and Orchestration

**Files:**
- Create: `scripts/performance/report-schema.mjs`
- Create: `scripts/performance/validate-report.mjs`
- Create: `scripts/performance/render-summary.mjs`
- Create: `scripts/performance/report.mjs`
- Create: `scripts/performance/__tests__/report.test.cjs`
- Modify: `package.json`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: static and runtime collectors.
- Produces: report schema v1, `validateReport(report)`, `renderSummary(report, baseline?)`, and the four package scripts from the design.

- [ ] **Step 1: Write failing report tests**

Use a complete fixture report. Verify valid report acceptance, duplicate/missing scenario rejection, negative metric rejection, report-only policy enforcement, and Markdown sections for Package, Bundles, Cold imports, and Parse throughput.

- [ ] **Step 2: Verify RED**

```bash
npm test -- scripts/performance/__tests__/report.test.cjs --runInBand
```

Expected: FAIL because report modules do not exist.

- [ ] **Step 3: Implement schema validation and rendering**

Validation must require every ID exported by `REQUIRED_SCENARIO_IDS`. Markdown tables use bytes and milliseconds without locale-dependent formatting. Baseline deltas are informational and use signed percentages.

- [ ] **Step 4: Implement orchestration**

`report.mjs` must:

1. remove and recreate `artifacts/performance`;
2. run `npm run build` once;
3. run both collectors through imported functions;
4. read package and environment versions;
5. set `schemaVersion: 1` and `policy: 'report-only'`;
6. validate the combined report;
7. write JSON and Markdown;
8. print the Markdown summary to stdout.

- [ ] **Step 5: Add scripts and ignore generated output**

Add:

```json
"performance:sizes": "npm run build && node scripts/performance/collect-sizes.mjs",
"performance:runtime": "npm run build && node scripts/performance/collect-runtime.mjs",
"performance:report": "node scripts/performance/report.mjs",
"performance:validate": "node scripts/performance/validate-report.mjs artifacts/performance/performance-report.json"
```

Ignore `artifacts/performance/`.

- [ ] **Step 6: Verify the complete local gate**

```bash
npm test -- scripts/performance/__tests__ --runInBand
npm run performance:report
npm run performance:validate
```

Expected: all tests PASS; both report files exist; validation exits 0.

- [ ] **Step 7: Commit**

```bash
git add .gitignore package.json scripts/performance
 git commit -m "feat: generate validated performance reports"
```

---

### Task 6: CI Reporting and First Reproducibility Run

**Files:**
- Modify: `.github/workflows/ci.yml`
- Create: `docs/performance.md`

**Interfaces:**
- Consumes: `npm run performance:report`.
- Produces: CI job `performance-foundation`, artifact `performance-report`, and user-facing methodology documentation.

- [ ] **Step 1: Add the CI job**

Add a Node.js 22 job that runs the report, appends the Markdown file to `$GITHUB_STEP_SUMMARY`, and uploads `artifacts/performance` for 30 days.

- [ ] **Step 2: Document interpretation**

Explain that static byte metrics are deterministic, runtime metrics are noisy, all numbers are report-only, browser runtime is out of scope, and hard budgets require a later approved design.

- [ ] **Step 3: Run the full repository gates**

```bash
npm run check
npm run playground:check
npm run performance:report
```

Expected: PASS.

- [ ] **Step 4: Push and run CI twice on the exact same head**

Use `workflow_dispatch` or re-run the performance job without changing the commit. Record both run IDs. Confirm package, distribution, and bundle byte metrics are identical.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/ci.yml docs/performance.md
git commit -m "ci: report performance and bundle size baselines"
```

---

### Task 7: Commit the Provenance-Backed Baseline and Close Evidence

**Files:**
- Create: `benchmarks/baselines/ua-info-2.2.0-node22-linux-x64.json`
- Modify: `docs/superpowers/specs/2026-07-26-ua-info-performance-bundle-size-foundation-design.md`
- Modify: `docs/superpowers/plans/2026-07-26-ua-info-performance-bundle-size-foundation.md`

**Interfaces:**
- Consumes: the later successful exact-head performance report.
- Produces: committed baseline with `baselineSource.runId`, `baselineSource.commit`, and `baselineSource.runner` metadata.

- [ ] **Step 1: Download the later CI performance artifact**

Use the JSON report from the later successful exact-head run. Do not manually reconstruct metric values.

- [ ] **Step 2: Add provenance metadata**

Add:

```json
"baselineSource": {
  "runId": "<exact-run-id>",
  "commit": "<exact-head-sha>",
  "runner": "ubuntu-latest / Node.js 22"
}
```

The baseline remains policy `report-only`.

- [ ] **Step 3: Verify static reproducibility**

Compare the two reports and assert equality for package bytes, unpacked bytes, file count, distribution totals, and every bundle raw/gzip/Brotli byte count. Record runtime variance without gating it.

- [ ] **Step 4: Mark spec and plan implemented and verified**

Record PR, exact head, both reproducibility run IDs, final CI run, baseline source, and compatibility audit.

- [ ] **Step 5: Run final gates**

```bash
npm run check
npm run playground:check
npm run performance:report
npm run performance:validate
```

Expected: PASS. Generated report remains untracked; committed baseline remains tracked.

- [ ] **Step 6: Commit**

```bash
git add benchmarks/baselines docs/superpowers/specs docs/superpowers/plans
git commit -m "docs: record ua-info 2.2 performance baseline"
```

- [ ] **Step 7: Final scope audit**

Confirm no files under `src/`, no package version, no exports, no runtime dependencies, no Playground implementation, and no release workflow changed.
