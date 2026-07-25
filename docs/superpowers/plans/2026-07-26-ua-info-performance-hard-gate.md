# ua-info Performance & Bundle Size Hard Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a blocking gate for deterministic static package and bundle growth while retaining tarball, compressed-size, and runtime regressions as evidence-based warnings.

**Architecture:** Keep performance report schema v1 unchanged. Add a reviewed JSON policy, a pure comparison engine, and a CLI that writes gate JSON plus Markdown. The existing Node.js 22 performance CI job generates the report, validates it, evaluates the gate, publishes both summaries, and uploads all diagnostics.

**Tech Stack:** Node.js ESM scripts, Jest 30, JSON policy, GitHub Actions, existing performance report schema v1, existing `ua-info@2.2.0` baseline, esbuild `0.25.8`.

## Global Constraints

- Package identity remains `ua-info`.
- Package version remains `2.2.0`.
- Node.js support remains `>=18`.
- Runtime measurement remains standardized on Node.js 22.
- Root, `/server`, `/browser`, and `/package.json` exports remain unchanged.
- No file under `src/` changes.
- No runtime dependency is added.
- `esbuild` remains development-only and is pinned exactly to `0.25.8`.
- Existing performance report schema version `1` and policy `report-only` remain unchanged.
- Hard-gate evaluation is a separate schema version `1` document.
- No package publication or release workflow changes.

---

### Task 1: Reviewed Gate Policy and Validation

**Files:**
- Create: `benchmarks/performance-gate-policy.json`
- Create: `scripts/performance/gate-policy.mjs`
- Create: `scripts/performance/__tests__/gate-policy.test.cjs`

**Interfaces:**
- Produces: `loadGatePolicy(path)` and `validateGatePolicy(policy)`.
- `validateGatePolicy()` returns the validated policy object or throws a stable `PERF_GATE_POLICY_INVALID` error.

- [ ] **Step 1: Write failing policy tests**

Test exact acceptance of schema version `1`, mode `static-hard-gate`, required baseline path, esbuild `0.25.8`, exact blocking metric arrays, exact advisory metric arrays, cold-import threshold `25`, and throughput threshold `15`.

```js
const { validateGatePolicy } = await import('../gate-policy.mjs');

expect(validateGatePolicy(validPolicy)).toBe(validPolicy);
expect(() => validateGatePolicy({ ...validPolicy, schemaVersion: 2 }))
  .toThrow('PERF_GATE_POLICY_INVALID');
expect(() => validateGatePolicy({ ...validPolicy, requiredEsbuild: '^0.25.8' }))
  .toThrow('PERF_GATE_POLICY_INVALID');
```

Also reject unknown fields, duplicate metric names, unsupported metric names, empty baseline paths, zero/negative thresholds, and advisory thresholds above `100`.

- [ ] **Step 2: Run focused tests and verify RED**

```bash
npm test -- scripts/performance/__tests__/gate-policy.test.cjs --runInBand
```

Expected: FAIL because `gate-policy.mjs` does not exist.

- [ ] **Step 3: Create the reviewed policy**

Write the exact policy from the approved design:

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

- [ ] **Step 4: Implement strict policy validation**

Use explicit key-set validation. Do not silently ignore unknown fields. Prefix every validation error with `PERF_GATE_POLICY_INVALID:`.

`loadGatePolicy(path)` reads JSON through the existing `readJson()` utility and wraps file or JSON failures with `PERF_GATE_IO_ERROR:`.

- [ ] **Step 5: Verify GREEN**

```bash
npm test -- scripts/performance/__tests__/gate-policy.test.cjs --runInBand
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add benchmarks/performance-gate-policy.json scripts/performance/gate-policy.mjs scripts/performance/__tests__/gate-policy.test.cjs
git commit -m "test: define performance gate policy"
```

---

### Task 2: Pure Static and Advisory Comparator

**Files:**
- Create: `scripts/performance/gate-evaluator.mjs`
- Create: `scripts/performance/__tests__/gate-evaluator.test.cjs`

**Interfaces:**
- Consumes: `validateReport(report)`, `validateGatePolicy(policy)`.
- Produces: `evaluatePerformanceGate({ report, baseline, policy })`.

- [ ] **Step 1: Write failing equality and decrease tests**

Build reports by deep-cloning the committed baseline and removing `baselineSource` only when unnecessary.

```js
const result = evaluatePerformanceGate({ report: baseline, baseline, policy });
expect(result.status).toBe('pass');
expect(result.blockingViolations).toEqual([]);

const smaller = structuredClone(baseline);
smaller.sizes.bundles[0].rawBytes -= 1;
expect(evaluatePerformanceGate({ report: smaller, baseline, policy }).status).toBe('pass');
```

- [ ] **Step 2: Write failing blocking-metric tests**

Cover one-byte increases for:

- package unpacked bytes;
- package file count;
- ESM and CommonJS raw bytes;
- ESM and CommonJS file counts;
- every bundle raw-byte scenario.

Assert stable code `PERF_GATE_STATIC_BUDGET_EXCEEDED`, exact metric path, current, baseline, and delta.

- [ ] **Step 3: Write failing multi-violation and ordering test**

Increase package unpacked bytes, CommonJS raw bytes, and two bundle raw-byte values. Assert all violations are returned in deterministic package → distribution → bundle order.

- [ ] **Step 4: Write failing warning tests**

Verify:

```js
// Tarball growth warns but passes.
report.sizes.package.tarballBytes = baseline.sizes.package.tarballBytes + 1;

// Compressed growth warns but passes.
report.sizes.bundles[0].gzipBytes += 1;

// Exactly 25% slower does not warn; 25.01% slower warns.
report.runtime.coldImports[0].medianMilliseconds = baselineValue * 1.25;
report.runtime.coldImports[0].medianMilliseconds = baselineValue * 1.2501;

// Exactly 15% lower does not warn; 15.01% lower warns.
report.runtime.parseThroughput[0].medianOperationsPerSecond = baselineValue * 0.85;
report.runtime.parseThroughput[0].medianOperationsPerSecond = baselineValue * 0.8499;
```

Warning-only results must retain `status: 'pass'`.

- [ ] **Step 5: Write failing contract tests**

Reject package name/version mismatch and esbuild mismatch. Expected stable prefixes:

- `PERF_GATE_REPORT_INVALID` for invalid current reports;
- `PERF_GATE_BASELINE_INVALID` for invalid baselines;
- `PERF_GATE_TOOLCHAIN_MISMATCH` for current or baseline esbuild mismatch.

- [ ] **Step 6: Run focused tests and verify RED**

```bash
npm test -- scripts/performance/__tests__/gate-evaluator.test.cjs --runInBand
```

Expected: FAIL because `gate-evaluator.mjs` does not exist.

- [ ] **Step 7: Implement comparator helpers**

Implement focused functions:

```js
compareMaximum({ path, current, baseline, comparisons, violations })
compareGrowthWarning({ code, path, current, baseline, comparisons, warnings })
compareSlowdownWarning({ path, current, baseline, thresholdPercent, comparisons, warnings })
compareThroughputWarning({ path, current, baseline, thresholdPercent, comparisons, warnings })
```

Every numeric comparison uses raw numeric values. Do not round before evaluation.

- [ ] **Step 8: Implement `evaluatePerformanceGate()`**

Validate current report, baseline report, and policy before comparing. Require equal package name/version and exact esbuild `0.25.8`. Use scenario IDs to resolve matching entries, but emit findings in current catalog order.

Return:

```js
{
  schemaVersion: 1,
  mode: 'static-hard-gate',
  status: blockingViolations.length === 0 ? 'pass' : 'fail',
  blockingViolations,
  warnings,
  comparisons,
}
```

- [ ] **Step 9: Verify GREEN**

```bash
npm test -- scripts/performance/__tests__/gate-evaluator.test.cjs --runInBand
```

Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add scripts/performance/gate-evaluator.mjs scripts/performance/__tests__/gate-evaluator.test.cjs
git commit -m "feat: evaluate deterministic performance budgets"
```

---

### Task 3: Gate Markdown and CLI

**Files:**
- Create: `scripts/performance/render-gate-summary.mjs`
- Create: `scripts/performance/evaluate-gate.mjs`
- Create: `scripts/performance/__tests__/gate-cli.test.cjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: current report path and policy path.
- Produces: `performance-gate.json`, `performance-gate-summary.md`, and process exit codes `0`, `1`, or `2`.

- [ ] **Step 1: Write failing summary tests**

PASS summary must start with:

```text
# ua-info Performance Gate: PASS
```

FAIL summary must include:

- `PERF_GATE_STATIC_BUDGET_EXCEEDED`;
- metric path;
- current, maximum, and signed delta;
- baseline-update protocol reminder.

Warnings must have a separate section and must not be described as failures.

- [ ] **Step 2: Write failing CLI tests**

Spawn Node.js against temporary report, baseline, policy, output, and summary files.

Assert:

- equal report exits `0` and writes both files;
- one-byte raw growth exits `1` and writes both files;
- warning-only runtime regression exits `0`;
- missing argument exits `2` with `PERF_GATE_ARGUMENT_INVALID`;
- malformed JSON exits `2` with `PERF_GATE_IO_ERROR`.

- [ ] **Step 3: Run focused tests and verify RED**

```bash
npm test -- scripts/performance/__tests__/gate-cli.test.cjs --runInBand
```

Expected: FAIL because renderer and CLI do not exist.

- [ ] **Step 4: Implement Markdown renderer**

Use stable, locale-independent formatting. Include baseline path, baseline provenance, comparison tables, violations, warnings, and final status.

- [ ] **Step 5: Implement CLI argument parsing**

Require exactly:

```text
--report <path>
--policy <path>
--output <path>
--summary <path>
```

Resolve the policy baseline path relative to repository root, not relative to the current shell directory.

- [ ] **Step 6: Implement exit behavior**

Set `process.exitCode = 1` only for a valid `fail` evaluation. Invalid inputs and operational failures use `2`. Valid warnings remain `0`.

- [ ] **Step 7: Add package command and pin esbuild**

Add:

```json
"performance:gate": "node scripts/performance/evaluate-gate.mjs --report artifacts/performance/performance-report.json --policy benchmarks/performance-gate-policy.json --output artifacts/performance/performance-gate.json --summary artifacts/performance/performance-gate-summary.md"
```

Change the development dependency from a range to:

```json
"esbuild": "0.25.8"
```

Do not change runtime dependencies.

- [ ] **Step 8: Verify GREEN**

```bash
npm test -- scripts/performance/__tests__/gate-cli.test.cjs --runInBand
npm run performance:report
npm run performance:validate
npm run performance:gate
```

Expected: tests PASS, report validation PASS, gate exits `0`, and both gate files exist.

- [ ] **Step 9: Commit**

```bash
git add package.json scripts/performance/render-gate-summary.mjs scripts/performance/evaluate-gate.mjs scripts/performance/__tests__/gate-cli.test.cjs
git commit -m "feat: add performance gate CLI"
```

---

### Task 4: CI Enforcement and Documentation

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `docs/performance.md`
- Modify: `scripts/performance/__tests__/report.test.cjs` only if summary expectations require the additional gate artifact contract.

**Interfaces:**
- Consumes: `npm run performance:report`, `npm run performance:validate`, `npm run performance:gate`.
- Produces: blocking gate check and always-uploaded diagnostics.

- [ ] **Step 1: Add the blocking CI step**

After report validation:

```yaml
- name: Evaluate performance hard gate
  run: npm run performance:gate
```

Keep job identifier `performance-foundation` unchanged.

- [ ] **Step 2: Publish both summaries**

Append report summary first, then gate summary. When either file is absent, write a clear diagnostic line to `$GITHUB_STEP_SUMMARY`.

- [ ] **Step 3: Preserve failed-gate artifacts**

Keep upload `if: always()` and path `artifacts/performance`. Confirm a gate failure does not skip artifact upload.

- [ ] **Step 4: Update methodology documentation**

Document:

- blocking versus advisory metrics;
- threshold boundaries;
- exact esbuild pin;
- CLI exit codes;
- baseline update protocol;
- rollback procedure;
- why runtime remains advisory.

- [ ] **Step 5: Run the complete local gate**

```bash
npm run lint
npm test -- --runInBand
npm run build
npm run pack:check
npm run performance:report
npm run performance:validate
npm run performance:gate
npm run playground:boundaries
```

Expected: all commands PASS and no file under `src/` changes.

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/ci.yml docs/performance.md scripts/performance package.json benchmarks/performance-gate-policy.json
git commit -m "ci: enforce deterministic performance budgets"
```

---

### Task 5: Intentional Static Regression Proof

**Files:**
- Temporarily modify, then restore: `benchmarks/baselines/ua-info-2.2.0-node22-linux-x64.json`
- Create after proof: `docs/superpowers/closures/2026-07-26-ua-info-performance-hard-gate.md`

**Interfaces:**
- Produces: one recorded failing CI run that proves the real gate blocks a one-byte regression.

- [ ] **Step 1: Confirm normal GREEN CI on exact implementation head**

Push the implementation head and require all existing jobs plus `performance-foundation` to pass.

- [ ] **Step 2: Create a one-byte intentional regression commit**

Change only:

```json
"id": "root-predicate",
"rawBytes": 1887
```

Keep current measured output at `1888`.

Commit:

```bash
git add benchmarks/baselines/ua-info-2.2.0-node22-linux-x64.json
git commit -m "test: prove performance gate blocks static growth"
```

- [ ] **Step 3: Verify intentional RED in CI**

Expected:

- build/report/validation succeed;
- gate exits `1`;
- violation path is `sizes.bundles.root-predicate.rawBytes`;
- current `1888`, maximum `1887`, delta `+1`;
- performance artifact uploads successfully;
- unrelated jobs remain green.

Record run, job, artifact, and exact head.

- [ ] **Step 4: Restore the real baseline**

Revert the temporary commit or restore raw bytes to `1888` with commit:

```bash
git add benchmarks/baselines/ua-info-2.2.0-node22-linux-x64.json
git commit -m "test: restore reviewed performance baseline"
```

- [ ] **Step 5: Confirm GREEN after restoration**

Require the complete CI suite to pass again on the restored exact head.

---

### Task 6: Closure Evidence and Final Verification

**Files:**
- Create: `docs/superpowers/closures/2026-07-26-ua-info-performance-hard-gate.md`

**Interfaces:**
- Produces: complete traceability for design, TDD, intentional regression, final GREEN, and compatibility.

- [ ] **Step 1: Record evidence**

Document:

- spec and plan paths;
- five foundation reports used for policy selection;
- TDD RED head and CI run;
- first implementation GREEN head and CI run;
- intentional one-byte RED head, run, failed gate job, and artifact;
- restored final GREEN head and run;
- package, Node.js, npm, TypeScript, and esbuild identities;
- unchanged package version, exports, source tree, and runtime dependencies.

- [ ] **Step 2: Verify changed-file scope**

```bash
git diff --name-only master...HEAD
```

Expected: policy, performance scripts/tests, package development metadata, CI, performance docs, and closure docs only. No `src/` or Playground source files.

- [ ] **Step 3: Run final commands on exact head**

```bash
npm run lint
npm test -- --runInBand
npm run detection:check
npm run build
npm run pack:check
npm run performance:report
npm run performance:validate
npm run performance:gate
npm run playground:check
```

Expected: all PASS.

- [ ] **Step 4: Verify GitHub Actions**

Require success for:

- Node.js 18;
- Node.js 20;
- Node.js 22;
- detector coverage;
- packed consumers;
- Playground Chromium smoke;
- performance report validation;
- performance hard gate;
- performance artifact upload.

- [ ] **Step 5: Commit closure**

```bash
git add docs/superpowers/closures/2026-07-26-ua-info-performance-hard-gate.md
git commit -m "docs: close performance hard gate"
```

- [ ] **Step 6: Review and merge**

Review the full patch, confirm no unresolved review threads, mark the PR ready, and squash-merge using the exact verified head SHA.
