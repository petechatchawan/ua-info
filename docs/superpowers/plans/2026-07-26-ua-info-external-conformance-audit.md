# ua-info External Conformance Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an opt-in, report-only external conformance audit that measures how `ua-info` interprets browser, operating-system, and device examples from an operator-supplied external checkout without copying third-party fixtures, regexes, expected records, or implementation logic into this repository.

**Architecture:** A guarded CLI reads one known external directory layout, converts records into transient in-memory cases, calls the built public `parse()` API, classifies results under `ua-info` semantics, and persists aggregate privacy-safe JSON and Markdown only. Standard CI exercises the complete tool with invented temporary fixtures; it never fetches or retains a third-party corpus.

**Tech Stack:** Node.js `>=18`, native ESM `.mjs`, CommonJS Jest tests `.test.cjs`, existing Jest 30 runner, native `fs/promises`, `path`, `child_process`, built `dist/esm/index.js`, no new dependency.

## Global Constraints

- No third-party fixture JSON, descriptions, expected objects, User-Agent strings, regexes, parser tables, detector ordering, or implementation code may be committed, transformed, generated, cached, or vendored into this repository.
- The audit performs no network request and never clones or downloads an upstream repository.
- The operator supplies `--source-dir`; its real path and every consumed directory/file real path must resolve outside the `ua-info` Git worktree.
- The audit never writes to the supplied external checkout.
- Persisted JSON and Markdown contain no raw User-Agent strings, complete expected records, full external descriptions, absolute paths, regexes, or fixture bodies.
- Standard CI uses invented fixtures created in temporary directories only.
- `ua-info` semantics remain authoritative: `browser`, `context`, `os`, and `device` are not remapped to imitate another parser.
- External observations alone may not justify a production detector change; remediation requires an independently sourced `ua-info` fixture with provenance.
- No `src/` production detector, `UAResult`, public type, package export, runtime dependency, Node.js floor, or Playground behavior changes in this milestone.
- The audit is report-only: completed audits exit `0` regardless of unsupported cases; invalid or unsafe execution exits `2`; there is no exit `1`.
- Adding the npm script may legitimately increase packed `package.json` size; any baseline refresh must follow the existing two exact-head Node.js 22 run protocol.

---

## File and Interface Map

### New tooling

- `scripts/conformance/external-source-guard.mjs`
  - Real-path containment, child-path symlink protection, and read-only local Git metadata.
  - Exports `resolveExternalSource()`, `assertExternalPath()`, and `readLocalGitState()`.
- `scripts/conformance/profiles/ua-parser-js-layout.mjs`
  - External layout loading and transient record validation.
  - Exports `loadUaParserJsCases()`.
- `scripts/conformance/classify-result.mjs`
  - Generic normalization and domain-specific classification under `ua-info` semantics.
  - Exports `normalizeIdentity()` and `classifyExternalCase()`.
- `scripts/conformance/report-schema.mjs`
  - Aggregate report creation, grouping, strict validation, and privacy assertions.
  - Exports `createExternalConformanceReport()`, `validateExternalConformanceReport()`, and `assertPrivacySafeOutput()`.
- `scripts/conformance/render-summary.mjs`
  - Deterministic Markdown rendering from an aggregate report.
  - Exports `renderExternalConformanceSummary()`.
- `scripts/conformance/audit-external.mjs`
  - CLI arguments, orchestration, file writing, and exit codes.
  - Exports `parseAuditArguments()` and `runExternalConformanceAudit()`.

### New tests

- `scripts/conformance/__tests__/synthetic-source.cjs`
- `scripts/conformance/__tests__/external-source-guard.test.cjs`
- `scripts/conformance/__tests__/ua-parser-js-layout.test.cjs`
- `scripts/conformance/__tests__/classify-result.test.cjs`
- `scripts/conformance/__tests__/report-schema.test.cjs`
- `scripts/conformance/__tests__/render-summary.test.cjs`
- `scripts/conformance/__tests__/audit-external.test.cjs`

### Modified project files

- `jest.config.js` — discover conformance `.test.cjs` files without changing detector coverage scope.
- `package.json` — add `conformance:external`; no dependency or export changes.
- `.gitignore` — ignore `artifacts/conformance/`.
- `docs/external-conformance.md` — operator workflow, interpretation, privacy boundary, and independent remediation policy.
- `benchmarks/baselines/ua-info-2.2.0-node22-linux-x64.json` — update only if the new npm script changes deterministic package metadata size and two exact-head reports agree.
- `docs/superpowers/closures/2026-07-26-ua-info-external-conformance-audit.md` — record verification and independence evidence.

---

### Task 1: Guard the External Source Boundary

**Files:**
- Create: `scripts/conformance/external-source-guard.mjs`
- Test: `scripts/conformance/__tests__/external-source-guard.test.cjs`

**Interfaces:**

```js
export async function resolveExternalSource({ sourceDir, worktreeRoot })
// Promise<{ sourceRoot: string, worktreeRoot: string }>

export async function assertExternalPath({ candidatePath, worktreeRoot, label })
// Promise<string> resolved real path

export async function readLocalGitState(sourceRoot)
// Promise<{ revision: string | null, dirty: boolean | null }>
```

- [ ] **Step 1: Write failing boundary tests**

Use `mkdtemp()`, `mkdir()`, and `symlink()` to cover:

```js
const cases = [
  ['missing source', missingPath, 'CONFORMANCE_SOURCE_INVALID'],
  ['source equals worktree', worktreeRoot, 'CONFORMANCE_SOURCE_UNSAFE'],
  ['source nested in worktree', path.join(worktreeRoot, 'tmp-source'), 'CONFORMANCE_SOURCE_UNSAFE'],
  ['sibling source', siblingRoot, null],
];
```

Also assert:

- a root symlink outside the repository that resolves inside is rejected;
- a child JSON symlink under an otherwise safe source that resolves inside is rejected by `assertExternalPath()`;
- a safe sibling child path passes;
- a non-Git source returns `{ revision: null, dirty: null }`.

- [ ] **Step 2: Run the focused test and verify RED**

```bash
node --experimental-vm-modules ./node_modules/jest/bin/jest.js \
  scripts/conformance/__tests__/external-source-guard.test.cjs --runInBand
```

Expected: FAIL because `external-source-guard.mjs` does not exist.

- [ ] **Step 3: Implement real-path checks with stable errors**

Use one containment predicate for root and child paths:

```js
function isWithin(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

export async function assertExternalPath({ candidatePath, worktreeRoot, label }) {
  let resolvedCandidate;
  let resolvedWorktree;
  try {
    [resolvedCandidate, resolvedWorktree] = await Promise.all([
      realpath(candidatePath),
      realpath(worktreeRoot),
    ]);
  } catch (error) {
    throw new Error(`CONFORMANCE_SOURCE_INVALID: unable to resolve ${label}.`, { cause: error });
  }
  if (isWithin(resolvedWorktree, resolvedCandidate)) {
    throw new Error(`CONFORMANCE_SOURCE_UNSAFE: ${label} resolves inside the ua-info worktree.`);
  }
  return resolvedCandidate;
}
```

`resolveExternalSource()` calls `assertExternalPath()` for the root and returns both resolved roots. `readLocalGitState()` executes only:

```text
git -C <sourceRoot> rev-parse HEAD
git -C <sourceRoot> status --porcelain
```

Use `execFile()` with argument arrays. Treat command failure as a non-Git source.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run the command from Step 2.

Expected: PASS for root containment, nested child symlink protection, and Git-state behavior.

- [ ] **Step 5: Commit**

```bash
git add scripts/conformance/external-source-guard.mjs \
  scripts/conformance/__tests__/external-source-guard.test.cjs
git commit -m "feat: guard external conformance sources"
```

---

### Task 2: Load the External Layout into Transient Cases

**Files:**
- Create: `scripts/conformance/profiles/ua-parser-js-layout.mjs`
- Create: `scripts/conformance/__tests__/synthetic-source.cjs`
- Test: `scripts/conformance/__tests__/ua-parser-js-layout.test.cjs`

**Interfaces:**

```js
/** @typedef {'browser'|'os'|'device'} ExternalDomain */
/** @typedef {{
 * domain: ExternalDomain,
 * locator: string,
 * userAgent: string,
 * expected: Readonly<Record<string, unknown>>
 * }} ExternalCase */

export async function loadUaParserJsCases({ sourceRoot, worktreeRoot })
// Promise<readonly ExternalCase[]>
```

Consumes `assertExternalPath()` from Task 1 for every directory and JSON file before reading it.

- [ ] **Step 1: Create the synthetic source helper**

Create this invented layout in a temporary sibling directory:

```text
test/data/ua/browser/browser-all.json
test/data/ua/os/alpha.json
test/data/ua/os/zeta.json
test/data/ua/device/alpha.json
test/data/ua/device/zeta.json
```

Use invented tokens such as `IndependentBrowser/7.4`, `ExampleOS 3.2`, and `ExamplePhone Q1`. Export:

```js
async function createSyntheticExternalSource(root, overrides = {})
// { sourceRoot, sentinels: { userAgents, descriptions } }
```

- [ ] **Step 2: Write failing loader tests**

Verify:

- browser loads first;
- OS and device files load in lexicographic filename order;
- locators use relative file plus array index, for example `test/data/ua/os/alpha.json#0`;
- required directories and every consumed JSON file pass `assertExternalPath()`;
- a symlinked OS directory resolving inside the worktree is rejected;
- a symlinked JSON file resolving inside the worktree is rejected;
- malformed JSON, non-array root, missing `ua`, and non-object `expect` throw `CONFORMANCE_SOURCE_INVALID`;
- `desc` never leaves the loader;
- nothing is written to the source checkout.

- [ ] **Step 3: Run the focused test and verify RED**

```bash
node --experimental-vm-modules ./node_modules/jest/bin/jest.js \
  scripts/conformance/__tests__/ua-parser-js-layout.test.cjs --runInBand
```

Expected: FAIL because the profile module does not exist.

- [ ] **Step 4: Implement deterministic loading**

Read browser first, then sorted `.json` files immediately inside `os/` and `device/`. Resolve and guard each directory and file before reading. Convert records only in memory:

```js
function toCase(domain, relativeFile, index, record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    throw invalid(`${relativeFile}#${index} must be an object.`);
  }
  if (typeof record.ua !== 'string') {
    throw invalid(`${relativeFile}#${index}.ua must be a string.`);
  }
  if (!record.expect || typeof record.expect !== 'object' || Array.isArray(record.expect)) {
    throw invalid(`${relativeFile}#${index}.expect must be an object.`);
  }
  return Object.freeze({
    domain,
    locator: `${relativeFile}#${index}`,
    userAgent: record.ua,
    expected: Object.freeze({ ...record.expect }),
  });
}
```

Do not persist or return `desc`.

- [ ] **Step 5: Run the focused test and verify GREEN**

Run the command from Step 3.

Expected: PASS with deterministic order and child symlink protection.

- [ ] **Step 6: Commit**

```bash
git add scripts/conformance/profiles/ua-parser-js-layout.mjs \
  scripts/conformance/__tests__/synthetic-source.cjs \
  scripts/conformance/__tests__/ua-parser-js-layout.test.cjs
git commit -m "feat: load external conformance layout"
```

---

### Task 3: Classify Results Under ua-info Semantics

**Files:**
- Create: `scripts/conformance/classify-result.mjs`
- Test: `scripts/conformance/__tests__/classify-result.test.cjs`

**Interfaces:**

```js
/** @typedef {'exact'|'semantic-equivalent'|'partial'|'unsupported'} Classification */
/** @typedef {{
 * status: Classification,
 * expectedIdentity: string,
 * matchedFields: readonly string[],
 * mismatchedFields: readonly string[]
 * }} ClassificationResult */

export function normalizeIdentity(value)
export function classifyExternalCase(externalCase, actualResult)
```

- [ ] **Step 1: Write failing classifier tests using invented inputs**

Cover:

1. Browser exact: product/version/major match.
2. Browser unsupported: distinguishable derivative expected but generic Chrome actual.
3. Browser semantic-equivalent: external `type: 'inapp'` host matches `actual.context.host`, while `actual.browser` remains underlying runtime.
4. Browser partial: product matches but asserted version differs.
5. OS exact after underscore-to-dot normalization.
6. OS partial when a specific Linux distribution falls back to generic Linux.
7. OS unsupported for unrelated identity.
8. Device exact for all asserted type/vendor/model.
9. Device partial when type and model match but vendor is null.
10. Device partial for correct type only.
11. Device unsupported for wrong class.
12. `undefined`, literal `'undefined'`, and absent expected fields are unasserted.
13. Expected identity is printable and capped at 120 characters.

- [ ] **Step 2: Run the focused test and verify RED**

```bash
node --experimental-vm-modules ./node_modules/jest/bin/jest.js \
  scripts/conformance/__tests__/classify-result.test.cjs --runInBand
```

Expected: FAIL because `classify-result.mjs` does not exist.

- [ ] **Step 3: Implement generic normalization**

```js
export function normalizeIdentity(value) {
  if (value === undefined || value === null || value === 'undefined') return null;
  return String(value)
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[_/]+/g, ' ')
    .replace(/[^a-z0-9.+-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 120) || null;
}
```

Allow only generic type aliases owned by this project, such as `smarttv -> smart-tv`; do not reproduce an upstream product catalog.

- [ ] **Step 4: Implement deterministic domain rules**

Browser:

```text
same product + all asserted direct fields match -> exact
inapp expected identity matches context.host -> semantic-equivalent
same product with asserted version/type mismatch -> partial
different or absent product identity -> unsupported
```

OS:

```text
same OS + asserted version match -> exact
specific Linux identity + generic Linux actual -> partial
same OS + version mismatch -> partial
different or absent OS -> unsupported
```

Device:

```text
all asserted fields match -> exact
correct type plus model/vendor subset -> partial
correct type only -> partial
wrong or unknown class -> unsupported
```

Return sorted matched and mismatched field arrays for in-memory aggregation only.

- [ ] **Step 5: Run the focused test and verify GREEN**

Run the command from Step 2.

Expected: PASS for all four statuses and all three domains.

- [ ] **Step 6: Commit**

```bash
git add scripts/conformance/classify-result.mjs \
  scripts/conformance/__tests__/classify-result.test.cjs
git commit -m "feat: classify external conformance results"
```

---

### Task 4: Create and Validate the Privacy-Safe Aggregate Report

**Files:**
- Create: `scripts/conformance/report-schema.mjs`
- Test: `scripts/conformance/__tests__/report-schema.test.cjs`

**Interfaces:**

```js
export function createExternalConformanceReport({
  generatedAt,
  sourceRevision,
  packageInfo,
  observations,
})

export function validateExternalConformanceReport(report)
export function assertPrivacySafeOutput(value, forbiddenSentinels = [])
```

Observation shape:

```js
{
  domain: 'browser' | 'os' | 'device',
  locator: string,
  classification: 'exact' | 'semantic-equivalent' | 'partial' | 'unsupported',
  expectedIdentity: string,
}
```

- [ ] **Step 1: Write failing report tests**

Require this aggregate shape:

```js
{
  schemaVersion: 1,
  profile: 'ua-parser-js',
  generatedAt: '2026-07-26T00:00:00.000Z',
  sourceRevision: 'abc123 (dirty)',
  package: { name: 'ua-info', version: '2.2.0', commit: 'def456' },
  domains: {
    browser: { total: 4, exact: 1, semanticEquivalent: 1, partial: 1, unsupported: 1 },
    os: { total: 0, exact: 0, semanticEquivalent: 0, partial: 0, unsupported: 0 },
    device: { total: 0, exact: 0, semanticEquivalent: 0, partial: 0, unsupported: 0 },
  },
  totals: { total: 4, exact: 1, semanticEquivalent: 1, partial: 1, unsupported: 1 },
  gapGroups: [],
}
```

Verify:

- exact observations are not gap groups;
- non-exact groups use domain + status + normalized expected identity;
- each group stores occurrence count and at most five sorted relative locators;
- ordering is domain, severity (`unsupported`, `partial`, `semantic-equivalent`), count descending, identity;
- strict validation rejects unknown keys, negative/non-integer counts, unreconciled totals, invalid locators, identity longer than 120 characters, or more than five locators;
- privacy checks reject keys `ua`, `userAgent`, `expect`, `description`, `sourceDir`, absolute paths, and supplied sentinel strings.

- [ ] **Step 2: Run the focused test and verify RED**

```bash
node --experimental-vm-modules ./node_modules/jest/bin/jest.js \
  scripts/conformance/__tests__/report-schema.test.cjs --runInBand
```

Expected: FAIL because `report-schema.mjs` does not exist.

- [ ] **Step 3: Implement aggregation**

Use explicit count mapping:

```js
const COUNT_KEY = Object.freeze({
  exact: 'exact',
  'semantic-equivalent': 'semanticEquivalent',
  partial: 'partial',
  unsupported: 'unsupported',
});
```

Group non-exact observations with:

```text
<domain>\u0000<classification>\u0000<expectedIdentity>
```

Store only aggregate count and first five sorted locators.

- [ ] **Step 4: Implement strict schema and recursive privacy checks**

Require exact keys at every report level. Traverse objects and arrays recursively; reject forbidden key names case-insensitively, absolute path strings, and test-provided sentinels. Validate immediately before each write.

- [ ] **Step 5: Run the focused test and verify GREEN**

Run the command from Step 2.

Expected: PASS with deterministic grouping and zero raw-corpus leakage.

- [ ] **Step 6: Commit**

```bash
git add scripts/conformance/report-schema.mjs \
  scripts/conformance/__tests__/report-schema.test.cjs
git commit -m "feat: aggregate privacy-safe conformance reports"
```

---

### Task 5: Render the Markdown Summary

**Files:**
- Create: `scripts/conformance/render-summary.mjs`
- Test: `scripts/conformance/__tests__/render-summary.test.cjs`

**Interfaces:**

```js
export function renderExternalConformanceSummary(report)
// string
```

- [ ] **Step 1: Write failing renderer tests**

Require:

- title `# ua-info External Conformance Audit`;
- package version and source revision;
- exact disclaimer `Interoperability observations are not implementation requirements.`;
- browser, OS, device, and total percentage table;
- highest-frequency non-exact gap groups;
- visible dirty marker when revision contains `(dirty)`;
- no raw UA, absolute path, description, or expected object;
- byte-identical output for identical input.

- [ ] **Step 2: Run the focused test and verify RED**

```bash
node --experimental-vm-modules ./node_modules/jest/bin/jest.js \
  scripts/conformance/__tests__/render-summary.test.cjs --runInBand
```

Expected: FAIL because `render-summary.mjs` does not exist.

- [ ] **Step 3: Implement deterministic rendering**

```js
function percentage(count, total) {
  return total === 0 ? '0.00%' : `${((count / total) * 100).toFixed(2)}%`;
}
```

Render only fields from a validated report. The renderer must never accept transient cases.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run the command from Step 2.

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/conformance/render-summary.mjs \
  scripts/conformance/__tests__/render-summary.test.cjs
git commit -m "feat: render external conformance summaries"
```

---

### Task 6: Build the Audit CLI

**Files:**
- Create: `scripts/conformance/audit-external.mjs`
- Test: `scripts/conformance/__tests__/audit-external.test.cjs`

**Interfaces:**

```js
export function parseAuditArguments(argv)

export async function runExternalConformanceAudit({
  argv,
  worktreeRoot,
  parseUserAgent,
  packageInfo,
  packageCommit,
  now,
})
// { report, summary, outputPath, summaryPath }
```

- [ ] **Step 1: Write failing argument and end-to-end synthetic tests**

Argument contract:

```text
required: --profile ua-parser-js, --source-dir <path>
optional defaults:
  --output artifacts/conformance/external-conformance.json
  --summary artifacts/conformance/external-conformance.md
unsupported, duplicate, missing-value, or odd pairs -> exit 2
```

Use the synthetic source and an injected deterministic parser. Assert:

- valid audit writes JSON and Markdown;
- unsupported observations still exit `0`;
- malformed or unsafe source exits `2`;
- report validates;
- neither output contains synthetic User-Agent/description sentinels or absolute source path;
- external source tree contents and mtimes are unchanged;
- direct process invocation without arguments exits `2` and prints `CONFORMANCE_ARGUMENT_INVALID`.

- [ ] **Step 2: Run the focused test and verify RED**

```bash
node --experimental-vm-modules ./node_modules/jest/bin/jest.js \
  scripts/conformance/__tests__/audit-external.test.cjs --runInBand
```

Expected: FAIL because `audit-external.mjs` does not exist.

- [ ] **Step 3: Implement orchestration in this exact order**

```text
parse arguments
→ resolve and guard source root
→ load and guard all profile directories/files
→ read local source revision/dirty state
→ call parseUserAgent(case.userAgent)
→ classify each result
→ create aggregate observations and release transient case references
→ create and validate aggregate report
→ assert privacy-safe JSON
→ render and privacy-check Markdown
→ write output files
```

Format source revision as:

```js
const sourceRevision = revision === null
  ? null
  : dirty === true
    ? `${revision} (dirty)`
    : revision;
```

- [ ] **Step 4: Implement direct CLI execution with the built public API**

Lazily import:

```js
const { parse } = await import('../../dist/esm/index.js');
```

Read package name/version from `package.json`; obtain package commit through read-only `git rev-parse HEAD`. Wrap operational errors with stable codes and set `process.exitCode = 2`. Successful completion sets `0`.

- [ ] **Step 5: Run focused and complete conformance tests**

```bash
node --experimental-vm-modules ./node_modules/jest/bin/jest.js \
  scripts/conformance/__tests__/audit-external.test.cjs --runInBand
node --experimental-vm-modules ./node_modules/jest/bin/jest.js \
  scripts/conformance/__tests__ --runInBand
```

Expected: PASS with no network and invented temporary data only.

- [ ] **Step 6: Commit**

```bash
git add scripts/conformance/audit-external.mjs \
  scripts/conformance/__tests__/audit-external.test.cjs
git commit -m "feat: add external conformance audit CLI"
```

---

### Task 7: Integrate Command, Test Discovery, Ignore Rule, and Documentation

**Files:**
- Modify: `jest.config.js:14-17`
- Modify: `package.json:49-77`
- Modify: `.gitignore:6-11`
- Create: `docs/external-conformance.md`

- [ ] **Step 1: Add Jest discovery**

Add:

```js
'<rootDir>/scripts/conformance/__tests__/**/*.test.cjs',
```

Do not change `collectCoverageFrom`; detector coverage remains `src/v2/**/*.ts`.

- [ ] **Step 2: Add the npm command and ignore rule**

Add exactly:

```json
"conformance:external": "npm run build && node scripts/conformance/audit-external.mjs"
```

Add:

```text
artifacts/conformance/
```

Do not add a dependency, export, prepack hook, or automatic fetch.

- [ ] **Step 3: Write operator documentation**

Include:

```bash
cd /path/to/ua-info
npm ci
npm run conformance:external -- \
  --profile ua-parser-js \
  --source-dir ../ua-parser-js
```

Document that:

- the operator prepares the sibling checkout manually;
- the tool performs no network request and never modifies the source;
- output is aggregate and privacy-safe;
- classifications mean exact, semantic-equivalent, partial, unsupported;
- gaps do not automatically become features;
- remediation requires independent official documentation or an owned capture;
- generated outputs must not be committed or published without review;
- no conformance threshold exists.

- [ ] **Step 4: Run package integration gates**

```bash
npm run lint
npm test -- --runInBand
npm run build
npm run pack:check
```

Expected: all pass. A later performance hard gate may fail only because the new script increases packed metadata size.

- [ ] **Step 5: Commit**

```bash
git add jest.config.js package.json .gitignore docs/external-conformance.md
git commit -m "docs: integrate external conformance audit"
```

---

### Task 8: Run a Live External Audit Without Retaining the Corpus

**Files:**
- Generated and ignored: `artifacts/conformance/external-conformance.json`
- Generated and ignored: `artifacts/conformance/external-conformance.md`

- [ ] **Step 1: Confirm the supplied checkout is external**

```bash
UA_INFO_ROOT="$(pwd -P)"
EXTERNAL_ROOT="$(cd ../ua-parser-js && pwd -P)"
case "$EXTERNAL_ROOT" in
  "$UA_INFO_ROOT"|"$UA_INFO_ROOT"/*) exit 2 ;;
esac
```

- [ ] **Step 2: Run the audit**

```bash
npm run conformance:external -- \
  --profile ua-parser-js \
  --source-dir "$EXTERNAL_ROOT"
```

Expected: exit `0` even when partial or unsupported cases exist.

- [ ] **Step 3: Verify output privacy**

```bash
node -e '
const fs = require("node:fs");
const path = require("node:path");
const json = fs.readFileSync("artifacts/conformance/external-conformance.json", "utf8");
const md = fs.readFileSync("artifacts/conformance/external-conformance.md", "utf8");
const forbidden = ["\"ua\"", "\"userAgent\"", "\"expect\"", path.resolve(process.argv[1])];
for (const token of forbidden) {
  if (json.includes(token) || md.includes(token)) throw new Error(`privacy leak: ${token}`);
}
' "$EXTERNAL_ROOT"
```

Expected: exit `0`.

- [ ] **Step 4: Retain aggregate evidence only**

Record local source revision/dirty marker, totals by domain and classification, and top normalized gap identities/counts. Do not paste raw fixtures, User-Agent strings, descriptions, expected records, or source file bodies into commits, PR comments, closure documents, or public artifacts.

---

### Task 9: Apply the Existing Performance Baseline Protocol When Needed

**Files:**
- Modify only if required: `benchmarks/baselines/ua-info-2.2.0-node22-linux-x64.json`

- [ ] **Step 1: Run the performance workflow on the exact implementation head**

```bash
npm run performance:report
npm run performance:validate
npm run performance:gate
```

Interpretation:

- PASS: skip the baseline update.
- FAIL only on package unpacked bytes, with distribution and consumer bundle raw bytes unchanged: continue.
- Any distribution or bundle raw-byte increase: stop and investigate because tooling must not enter runtime output.

- [ ] **Step 2: Execute two Node.js 22 performance jobs on the same exact head**

Record source head, run ID, job ID, artifact ID, Node, npm, and esbuild for both.

- [ ] **Step 3: Require byte-for-byte equality across both runs**

```text
sizes.package.unpackedBytes
sizes.package.fileCount
sizes.distributions[*].rawBytes
sizes.distributions[*].fileCount
sizes.bundles[*].rawBytes
```

Do not update the baseline if any blocking static value differs.

- [ ] **Step 4: Refresh from the second exact-head artifact and re-run the gate**

Update only measured values and `baselineSource` provenance, then run:

```bash
npm run performance:report
npm run performance:validate
npm run performance:gate
```

Expected: PASS.

- [ ] **Step 5: Commit only when a refresh was required**

```bash
git add benchmarks/baselines/ua-info-2.2.0-node22-linux-x64.json
git commit -m "chore: refresh conformance tooling size baseline"
```

---

### Task 10: Final Verification, Independence Audit, and Closure

**Files:**
- Create: `docs/superpowers/closures/2026-07-26-ua-info-external-conformance-audit.md`

- [ ] **Step 1: Audit the diff for prohibited content**

```bash
git diff --name-only master...HEAD
git diff --stat master...HEAD
git grep -nE 'browser-all\.json|test/data/ua/(browser|os|device)' -- \
  . \
  ':(exclude)docs/external-conformance.md' \
  ':(exclude)docs/superpowers/specs/**' \
  ':(exclude)docs/superpowers/plans/**'
```

Expected:

- no third-party JSON or fixture directory exists;
- only profile layout strings occur in tooling/documentation where necessary;
- no `src/` production file changed;
- no dependency or export changed.

- [ ] **Step 2: Run all final gates**

```bash
npm run identity:check
npm run lint
npm test -- --runInBand
npm run detection:check
npm run build
npm run pack:check
npm run playground:check
npm run performance:report
npm run performance:validate
npm run performance:gate
```

Expected: every command exits `0`.

- [ ] **Step 3: Verify CLI exit semantics**

```bash
node scripts/conformance/audit-external.mjs; test "$?" -eq 2
npm run conformance:external -- \
  --profile ua-parser-js \
  --source-dir "$EXTERNAL_ROOT"
```

Expected: missing arguments exit `2`; valid audit exits `0` regardless of unsupported observations.

- [ ] **Step 4: Write closure evidence**

Record:

- design and plan paths;
- TDD RED and GREEN commits/runs;
- synthetic-only CI statement;
- new tooling files;
- child symlink protection evidence;
- live source revision and aggregate counts only;
- output privacy assertion;
- baseline refresh evidence or explicit statement that none was needed;
- final exact-head CI and artifacts;
- compatibility: `ua-info@2.2.0`, Node `>=18`, exports unchanged, no runtime dependency, no `src/` changes, no npm release required;
- explicit statement that no third-party fixture, regex, expected record, or implementation content was committed.

- [ ] **Step 5: Commit closure**

```bash
git add docs/superpowers/closures/2026-07-26-ua-info-external-conformance-audit.md
git commit -m "docs: close external conformance audit milestone"
```

- [ ] **Step 6: Run final exact-head CI and review every changed file**

Confirm Node 18/20/22, detector coverage, packed consumers, Playground Chromium smoke, performance report/schema/hard gate, and all synthetic conformance tests pass on the closure head.

- [ ] **Step 7: Squash-merge with expected head protection**

Suggested title:

```text
feat: add independent external conformance audit
```

Suggested merge message:

```text
Add an opt-in, privacy-safe external corpus audit without vendoring third-party data or changing ua-info runtime semantics.
```
