# ua-info External Conformance Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an opt-in, report-only external conformance audit that measures how `ua-info` interprets browser, operating-system, and device fixtures from an operator-supplied external checkout without copying third-party fixtures, regexes, expected records, or implementation logic into this repository.

**Architecture:** A guarded CLI reads an external checkout through one narrow layout profile, converts records into transient in-memory cases, calls the built public `parse()` API, classifies results using `ua-info` semantics, and persists aggregate privacy-safe JSON and Markdown only. Standard CI exercises the entire audit using synthetic temporary fixtures authored for this repository; no CI job fetches or retains a third-party corpus.

**Tech Stack:** Node.js `>=18`, native ESM `.mjs`, CommonJS Jest tests `.test.cjs`, existing Jest 30 runner, native `fs/promises`, `path`, `child_process`, built `dist/esm/index.js`, no new dependency.

## Global Constraints

- No third-party fixture JSON, descriptions, expected objects, User-Agent strings, regexes, parser tables, detector ordering, or implementation code may be committed, transformed, generated, cached, or vendored into this repository.
- The audit performs no network request and never clones or downloads an upstream repository.
- The operator supplies `--source-dir`; its real path must resolve outside the `ua-info` Git worktree.
- The audit never writes to the supplied external checkout.
- Persisted JSON and Markdown contain no raw User-Agent strings, complete expected records, full external descriptions, absolute paths, regexes, or fixture bodies.
- Standard CI uses synthetic fixtures created in temporary directories only.
- `ua-info` semantics remain authoritative: `browser`, `context`, `os`, and `device` are not remapped to imitate another parser.
- External observations alone may not justify a production detector change; remediation requires an independently sourced `ua-info` fixture with provenance.
- No `src/` production detector, `UAResult`, public type, package export, runtime dependency, Node.js floor, or Playground behavior changes in this milestone.
- The audit is report-only: completed audits exit `0` regardless of unsupported cases; invalid or unsafe execution exits `2`; there is no exit `1`.
- Adding the npm script may legitimately increase packed `package.json` size; any baseline refresh must follow the existing two exact-head Node.js 22 run protocol.

---

## File and Interface Map

### New runtime-development tooling

- `scripts/conformance/external-source-guard.mjs`
  - Owns real-path containment checks and read-only local Git metadata.
  - Exports `resolveExternalSource()` and `readLocalGitState()`.
- `scripts/conformance/profiles/ua-parser-js-layout.mjs`
  - Owns the external directory layout and transient fixture validation.
  - Exports `loadUaParserJsCases()`.
- `scripts/conformance/classify-result.mjs`
  - Owns normalization and domain-specific classification.
  - Exports `classifyExternalCase()` and `normalizeIdentity()`.
- `scripts/conformance/report-schema.mjs`
  - Owns aggregate report construction, gap grouping, strict validation, and privacy assertions.
  - Exports `createExternalConformanceReport()`, `validateExternalConformanceReport()`, and `assertPrivacySafeOutput()`.
- `scripts/conformance/render-summary.mjs`
  - Owns Markdown rendering from a validated aggregate report.
  - Exports `renderExternalConformanceSummary()`.
- `scripts/conformance/audit-external.mjs`
  - Owns CLI arguments, orchestration, file output, and exit codes.
  - Exports `parseAuditArguments()` and `runExternalConformanceAudit()`.

### New tests

- `scripts/conformance/__tests__/external-source-guard.test.cjs`
- `scripts/conformance/__tests__/ua-parser-js-layout.test.cjs`
- `scripts/conformance/__tests__/classify-result.test.cjs`
- `scripts/conformance/__tests__/report-schema.test.cjs`
- `scripts/conformance/__tests__/render-summary.test.cjs`
- `scripts/conformance/__tests__/audit-external.test.cjs`
- `scripts/conformance/__tests__/synthetic-source.cjs`
  - Test-only helper that creates invented browser/OS/device records in a temporary external directory.

### Modified project files

- `jest.config.js`
  - Discover conformance CommonJS tests without adding them to detector coverage collection.
- `package.json`
  - Add `conformance:external`; no dependency or export changes.
- `.gitignore`
  - Ignore `artifacts/conformance/`.
- `docs/external-conformance.md`
  - Operator workflow, interpretation, privacy boundary, and independent remediation policy.
- `benchmarks/baselines/ua-info-2.2.0-node22-linux-x64.json`
  - Update only if the npm script changes deterministic packed metadata size and two exact-head reports agree.
- `docs/superpowers/closures/2026-07-26-ua-info-external-conformance-audit.md`
  - Record RED/GREEN evidence, independence audit, live external run aggregate only, final CI, and compatibility.

---

### Task 1: Guard the External Source Boundary

**Files:**
- Create: `scripts/conformance/external-source-guard.mjs`
- Test: `scripts/conformance/__tests__/external-source-guard.test.cjs`

**Interfaces:**
- Consumes: filesystem paths supplied by the CLI and repository root from `fileURLToPath(import.meta.url)`.
- Produces:
  - `resolveExternalSource({ sourceDir, worktreeRoot }): Promise<{ sourceRoot: string }>`
  - `readLocalGitState(sourceRoot): Promise<{ revision: string | null, dirty: boolean | null }>`

- [ ] **Step 1: Write failing containment and Git-state tests**

Create tests that use `mkdtemp()`, `mkdir()`, `symlink()`, and an invented directory tree. The test matrix must include:

```js
const cases = [
  ['missing source', missingPath, 'CONFORMANCE_SOURCE_INVALID'],
  ['source equals worktree', worktreeRoot, 'CONFORMANCE_SOURCE_UNSAFE'],
  ['source nested in worktree', path.join(worktreeRoot, 'tmp-source'), 'CONFORMANCE_SOURCE_UNSAFE'],
  ['sibling source', siblingRoot, null],
];
```

Add a symlink test where `outside/link` resolves to a directory inside the worktree and assert rejection. Add a non-Git-directory test asserting `{ revision: null, dirty: null }`.

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```bash
node --experimental-vm-modules ./node_modules/jest/bin/jest.js \
  scripts/conformance/__tests__/external-source-guard.test.cjs --runInBand
```

Expected: FAIL because `external-source-guard.mjs` does not exist.

- [ ] **Step 3: Implement real-path containment and read-only Git inspection**

Use `realpath()` for both roots, `path.relative()` for containment, and `execFile()` with argument arrays only:

```js
export async function resolveExternalSource({ sourceDir, worktreeRoot }) {
  const [sourceRoot, repositoryRoot] = await Promise.all([
    realpath(sourceDir),
    realpath(worktreeRoot),
  ]);
  const relative = path.relative(repositoryRoot, sourceRoot);
  if (relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))) {
    throw new Error('CONFORMANCE_SOURCE_UNSAFE: source directory must resolve outside the ua-info worktree.');
  }
  return { sourceRoot };
}
```

`readLocalGitState()` must execute only:

```text
git -C <sourceRoot> rev-parse HEAD
git -C <sourceRoot> status --porcelain
```

Treat command failure as a non-Git source, not an audit failure.

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run the command from Step 2.

Expected: PASS; source-inside-worktree and symlink-back-inside cases fail with the intended codes, sibling source passes, and non-Git metadata is null.

- [ ] **Step 5: Commit the boundary component**

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
- Consumes: validated external `sourceRoot` from Task 1.
- Produces:

```js
/** @typedef {'browser'|'os'|'device'} ExternalDomain */
/** @typedef {{
 * domain: ExternalDomain,
 * locator: string,
 * userAgent: string,
 * expected: Readonly<Record<string, unknown>>
 * }} ExternalCase */

export async function loadUaParserJsCases(sourceRoot)
// Promise<readonly ExternalCase[]>
```

- [ ] **Step 1: Create the synthetic external-source helper**

The helper must create this invented layout outside the repository worktree:

```text
test/data/ua/browser/browser-all.json
test/data/ua/os/alpha.json
test/data/ua/os/zeta.json
test/data/ua/device/alpha.json
test/data/ua/device/zeta.json
```

Use invented tokens such as `IndependentBrowser/7.4`, `ExampleOS 3.2`, and `ExamplePhone Q1`; do not copy recognizable upstream fixture strings.

Export:

```js
async function createSyntheticExternalSource(root, overrides = {})
// returns { sourceRoot, sentinels: { userAgents, descriptions } }
```

- [ ] **Step 2: Write failing profile-loader tests**

Verify:

- browser file loads first;
- OS and device files load in lexicographic filename order;
- each locator is repository-relative and index-based, for example `test/data/ua/os/alpha.json#0`;
- only `desc`, `ua`, and `expect` are read transiently;
- missing required paths, malformed JSON, a non-array file, missing `ua`, or non-object `expect` throws `CONFORMANCE_SOURCE_INVALID`;
- no output file is created in the source checkout.

- [ ] **Step 3: Run the focused tests and verify RED**

```bash
node --experimental-vm-modules ./node_modules/jest/bin/jest.js \
  scripts/conformance/__tests__/ua-parser-js-layout.test.cjs --runInBand
```

Expected: FAIL because the profile module does not exist.

- [ ] **Step 4: Implement deterministic loading and minimal validation**

Read browser first, then sorted `.json` files immediately inside `os/` and `device/`. Convert every record in memory:

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

Do not expose `desc` outside the loader and do not write transformed records.

- [ ] **Step 5: Run the focused tests and verify GREEN**

Run the command from Step 3.

Expected: PASS with deterministic case order and all malformed-source checks.

- [ ] **Step 6: Commit the profile component**

```bash
git add scripts/conformance/profiles/ua-parser-js-layout.mjs \
  scripts/conformance/__tests__/synthetic-source.cjs \
  scripts/conformance/__tests__/ua-parser-js-layout.test.cjs
git commit -m "feat: load external conformance layout"
```

---

### Task 3: Classify Results Using ua-info Semantics

**Files:**
- Create: `scripts/conformance/classify-result.mjs`
- Test: `scripts/conformance/__tests__/classify-result.test.cjs`

**Interfaces:**
- Consumes: one `ExternalCase` and one public `UAResult`.
- Produces:

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

- [ ] **Step 1: Write failing normalization and classification tests**

Use invented cases and manually authored `UAResult` objects. Cover:

1. Browser exact: name/version/major match.
2. Browser unsupported: expected derivative identity but actual browser is generic Chrome.
3. Browser semantic-equivalent: external `type: 'inapp'`, expected host name matches `actual.context.host`, while `actual.browser` remains the underlying browser.
4. Browser partial: product identity matches but asserted version differs.
5. OS exact: family and version match after underscore-to-dot normalization.
6. OS partial: specific distribution expected, generic Linux actual.
7. OS unsupported: unrelated platform identity.
8. Device exact: asserted type/vendor/model all match.
9. Device partial: type and model match while vendor is null.
10. Device unsupported: wrong class.
11. Literal external values `undefined`, `'undefined'`, and absent fields are treated as unasserted.
12. `expectedIdentity` is normalized, printable, and capped at 120 characters.

- [ ] **Step 2: Run the focused tests and verify RED**

```bash
node --experimental-vm-modules ./node_modules/jest/bin/jest.js \
  scripts/conformance/__tests__/classify-result.test.cjs --runInBand
```

Expected: FAIL because `classify-result.mjs` does not exist.

- [ ] **Step 3: Implement independent normalization helpers**

Use generic normalization owned by this project:

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

Define only narrowly justified generic aliases in this file, such as `smarttv -> smart-tv`; do not import or reproduce an upstream product catalog.

- [ ] **Step 4: Implement deterministic domain classifiers**

Browser rules:

```text
same product + all asserted direct fields match -> exact
inapp expected host matches context.host -> semantic-equivalent
same product but version/type mismatch -> partial
distinguishable product falls through to another product -> unsupported
```

OS rules:

```text
same OS + asserted version match -> exact
Linux distribution expected + generic Linux actual -> partial
same OS + version mismatch -> partial
unrelated or absent OS -> unsupported
```

Device rules:

```text
all asserted type/vendor/model match -> exact
at least type plus one other asserted field matches -> partial
correct type only -> partial
wrong or unknown class -> unsupported
```

Return sorted `matchedFields` and `mismatchedFields` for internal aggregation only.

- [ ] **Step 5: Run the focused tests and verify GREEN**

Run the command from Step 2.

Expected: PASS for all four statuses and all three domains.

- [ ] **Step 6: Commit the classifier**

```bash
git add scripts/conformance/classify-result.mjs \
  scripts/conformance/__tests__/classify-result.test.cjs
git commit -m "feat: classify external conformance results"
```

---

### Task 4: Build a Strict Privacy-Safe Aggregate Report

**Files:**
- Create: `scripts/conformance/report-schema.mjs`
- Test: `scripts/conformance/__tests__/report-schema.test.cjs`

**Interfaces:**
- Consumes: package metadata, local source state, transient cases, and classification results.
- Produces:

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

- [ ] **Step 1: Write failing aggregation, strict-schema, and privacy tests**

Verify the report contains:

```js
{
  schemaVersion: 1,
  profile: 'ua-parser-js',
  generatedAt: '2026-07-26T00:00:00.000Z',
  sourceRevision: 'abc123 (dirty)',
  package: { name: 'ua-info', version: '2.2.0', commit: 'def456' },
  domains: {
    browser: { total: 4, exact: 1, semanticEquivalent: 1, partial: 1, unsupported: 1 },
    os: { /* same keys */ },
    device: { /* same keys */ },
  },
  totals: { /* same keys */ },
  gapGroups: [/* deterministic groups */],
}
```

Test that each gap group stores at most five relative locators and never stores exact cases. Assert deterministic sorting by domain, classification severity (`unsupported`, `partial`, `semantic-equivalent`), occurrence count descending, then identity.

Strict validation must reject unknown keys, negative or non-integer counts, totals that do not reconcile, invalid locators, overlong identity strings, and more than five locators.

Privacy tests must reject any object containing keys such as `ua`, `userAgent`, `expect`, `description`, `sourceDir`, or an absolute path. Serialize the final report and assert none of the synthetic sentinel User-Agent strings/descriptions occurs.

- [ ] **Step 2: Run the focused tests and verify RED**

```bash
node --experimental-vm-modules ./node_modules/jest/bin/jest.js \
  scripts/conformance/__tests__/report-schema.test.cjs --runInBand
```

Expected: FAIL because `report-schema.mjs` does not exist.

- [ ] **Step 3: Implement aggregate counting and gap grouping**

Use immutable data and explicit status-key mapping:

```js
const COUNT_KEY = Object.freeze({
  exact: 'exact',
  'semantic-equivalent': 'semanticEquivalent',
  partial: 'partial',
  unsupported: 'unsupported',
});
```

Group only non-exact observations by:

```text
<domain>\u0000<classification>\u0000<expectedIdentity>
```

Store `occurrences` and the first five sorted locators only.

- [ ] **Step 4: Implement strict validation and recursive privacy assertions**

`validateExternalConformanceReport()` must require exact keys at every level. `assertPrivacySafeOutput()` must traverse arrays and objects, reject forbidden key names case-insensitively, reject absolute paths, and scan the serialized value for test-provided sentinels.

- [ ] **Step 5: Run the focused tests and verify GREEN**

Run the command from Step 2.

Expected: PASS with reconciled counts, deterministic groups, strict schema, and sentinel absence.

- [ ] **Step 6: Commit the report contract**

```bash
git add scripts/conformance/report-schema.mjs \
  scripts/conformance/__tests__/report-schema.test.cjs
git commit -m "feat: aggregate privacy-safe conformance reports"
```

---

### Task 5: Render the Human-Readable Summary

**Files:**
- Create: `scripts/conformance/render-summary.mjs`
- Test: `scripts/conformance/__tests__/render-summary.test.cjs`

**Interfaces:**
- Consumes: a validated external conformance report from Task 4.
- Produces: `renderExternalConformanceSummary(report): string`.

- [ ] **Step 1: Write failing Markdown rendering tests**

Require the summary to include:

- title `# ua-info External Conformance Audit`;
- package version and source revision;
- explicit disclaimer: `Interoperability observations are not implementation requirements.`;
- one percentage table for browser, OS, device, and total;
- highest-frequency non-exact gap groups;
- no raw User-Agent, source absolute path, full description, or expected object;
- dirty-source marker when `sourceRevision` includes `(dirty)`;
- stable output for identical input.

- [ ] **Step 2: Run the focused tests and verify RED**

```bash
node --experimental-vm-modules ./node_modules/jest/bin/jest.js \
  scripts/conformance/__tests__/render-summary.test.cjs --runInBand
```

Expected: FAIL because `render-summary.mjs` does not exist.

- [ ] **Step 3: Implement deterministic percentage and gap rendering**

Use two decimal places and avoid divide-by-zero:

```js
function percentage(count, total) {
  return total === 0 ? '0.00%' : `${((count / total) * 100).toFixed(2)}%`;
}
```

Render only fields already present in the validated report. Do not accept transient cases as renderer input.

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run the command from Step 2.

Expected: PASS and byte-identical Markdown for identical reports.

- [ ] **Step 5: Commit the renderer**

```bash
git add scripts/conformance/render-summary.mjs \
  scripts/conformance/__tests__/render-summary.test.cjs
git commit -m "feat: render external conformance summaries"
```

---

### Task 6: Orchestrate the Audit CLI and Exit Codes

**Files:**
- Create: `scripts/conformance/audit-external.mjs`
- Test: `scripts/conformance/__tests__/audit-external.test.cjs`

**Interfaces:**
- Consumes: components from Tasks 1–5 and the built public `parse()` API.
- Produces:

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
// returns { report, summary, outputPath, summaryPath }
```

- [ ] **Step 1: Write failing argument and end-to-end synthetic CLI tests**

Test argument rules:

```text
required: --profile ua-parser-js, --source-dir <path>
optional defaults:
  --output artifacts/conformance/external-conformance.json
  --summary artifacts/conformance/external-conformance.md
unsupported, duplicate, missing-value, or odd argument pairs -> exit 2
```

Use the synthetic source helper and an injected deterministic `parseUserAgent()` stub. Verify:

- completed audit writes both files and returns status data;
- unsupported cases still resolve successfully;
- malformed source exits `2`;
- unsafe source exits `2`;
- output JSON validates;
- report and summary contain none of the helper sentinels or source absolute path;
- no file in the external checkout changes;
- direct process invocation with no arguments exits `2` and prints a `CONFORMANCE_ARGUMENT_INVALID` code.

- [ ] **Step 2: Run the focused tests and verify RED**

```bash
node --experimental-vm-modules ./node_modules/jest/bin/jest.js \
  scripts/conformance/__tests__/audit-external.test.cjs --runInBand
```

Expected: FAIL because `audit-external.mjs` does not exist.

- [ ] **Step 3: Implement pure argument parsing and orchestration**

The orchestration order must be:

```text
parse arguments
→ resolve external source
→ verify profile
→ load transient cases
→ read local source revision/dirty state
→ call parseUserAgent(case.userAgent)
→ classify each result
→ discard transient raw cases after observations are built
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

- [ ] **Step 4: Implement direct CLI execution through the built public API**

When invoked as a program, lazily import:

```js
const { parse } = await import('../../dist/esm/index.js');
```

Read `package.json` for name/version and use a read-only local `git rev-parse HEAD` for package commit. All operational errors must be wrapped with stable codes and set `process.exitCode = 2`. Successful completion sets `0`.

- [ ] **Step 5: Run the focused tests and verify GREEN**

Run the command from Step 2.

Expected: PASS, including direct-process exit code assertions.

- [ ] **Step 6: Run all conformance tests together**

```bash
node --experimental-vm-modules ./node_modules/jest/bin/jest.js \
  scripts/conformance/__tests__ --runInBand
```

Expected: PASS with no network and only synthetic external data.

- [ ] **Step 7: Commit the CLI**

```bash
git add scripts/conformance/audit-external.mjs \
  scripts/conformance/__tests__/audit-external.test.cjs
git commit -m "feat: add external conformance audit CLI"
```

---

### Task 7: Integrate Tests, Command, Ignore Rules, and Operator Documentation

**Files:**
- Modify: `jest.config.js:14-17`
- Modify: `package.json:49-77`
- Modify: `.gitignore:6-11`
- Create: `docs/external-conformance.md`

**Interfaces:**
- Consumes: executable CLI from Task 6.
- Produces:
  - npm command `conformance:external`;
  - standard Jest discovery of synthetic conformance tests;
  - documented manual operator workflow.

- [ ] **Step 1: Add conformance test discovery**

Update `testMatch` to include:

```js
'<rootDir>/scripts/conformance/__tests__/**/*.test.cjs',
```

Do not change `collectCoverageFrom`; detector coverage must remain scoped to `src/v2/**/*.ts`.

- [ ] **Step 2: Add the npm command and generated-output ignore rule**

Add exactly:

```json
"conformance:external": "npm run build && node scripts/conformance/audit-external.mjs"
```

Add to `.gitignore`:

```text
artifacts/conformance/
```

Do not add a dependency, package export, prepack hook, or automatic upstream fetch.

- [ ] **Step 3: Write operator documentation**

`docs/external-conformance.md` must include these commands:

```bash
# The operator prepares a sibling checkout manually.
cd /path/to/ua-info
npm ci
npm run conformance:external -- \
  --profile ua-parser-js \
  --source-dir ../ua-parser-js
```

Document:

- source checkout remains external and is never modified;
- command performs no network access;
- outputs are aggregate and privacy-safe;
- meanings of exact, semantic-equivalent, partial, unsupported;
- gaps do not automatically become features;
- independent remediation flow using official documentation or owned captures;
- generated reports must not be committed or attached publicly without review;
- no conformance threshold exists.

- [ ] **Step 4: Run package tests and confirm integration GREEN before baseline handling**

```bash
npm test -- --runInBand
npm run lint
npm run build
npm run pack:check
```

Expected: all commands pass. A later performance hard-gate run may fail only because the new package script increases deterministic packed metadata size.

- [ ] **Step 5: Commit integration and documentation**

```bash
git add jest.config.js package.json .gitignore docs/external-conformance.md
git commit -m "docs: integrate external conformance audit"
```

---

### Task 8: Verify a Live External Checkout Without Retaining Its Corpus

**Files:**
- No repository file change unless a defect is found.
- Generated local files: `artifacts/conformance/external-conformance.json`, `artifacts/conformance/external-conformance.md` (ignored).

**Interfaces:**
- Consumes: an operator-supplied sibling checkout outside the worktree.
- Produces: aggregate local evidence only.

- [ ] **Step 1: Confirm source boundary before running**

```bash
UA_INFO_ROOT="$(pwd -P)"
EXTERNAL_ROOT="$(cd ../ua-parser-js && pwd -P)"
case "$EXTERNAL_ROOT" in
  "$UA_INFO_ROOT"|"$UA_INFO_ROOT"/*) exit 2 ;;
esac
```

Expected: the external root is outside the repository.

- [ ] **Step 2: Run the audit against the supplied checkout**

```bash
npm run conformance:external -- \
  --profile ua-parser-js \
  --source-dir "$EXTERNAL_ROOT"
```

Expected: exit `0` even when partial or unsupported observations exist.

- [ ] **Step 3: Validate privacy and retention manually**

Run:

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

- [ ] **Step 4: Record aggregate evidence only**

Capture in working notes:

- upstream local revision and dirty marker;
- total case counts by domain;
- counts for exact, semantic-equivalent, partial, unsupported;
- top normalized gap-group identities and counts.

Do not paste raw fixtures, User-Agent strings, descriptions, complete expected records, or external file bodies into commits, PR comments, closure documents, or public artifacts.

---

### Task 9: Refresh the Performance Baseline Only When Required

**Files:**
- Modify only when required: `benchmarks/baselines/ua-info-2.2.0-node22-linux-x64.json`
- Existing policy remains unchanged: `benchmarks/performance-gate-policy.json`

**Interfaces:**
- Consumes: exact implementation head after Tasks 1–8.
- Produces: reviewed deterministic maximums with provenance only if package metadata grew.

- [ ] **Step 1: Run the normal performance workflow on the exact implementation head**

```bash
npm run performance:report
npm run performance:validate
npm run performance:gate
```

Expected outcomes:

- PASS: no baseline update; continue to Task 10.
- FAIL only on `sizes.package.unpackedBytes` and possibly advisory tarball size, while distribution and bundle raw sizes remain unchanged: proceed with the baseline protocol.
- Any distribution or consumer bundle raw-byte increase: stop and investigate; this tooling must not enter runtime output.

- [ ] **Step 2: Execute two Node.js 22 performance jobs on the same exact source head**

Use GitHub Actions rerun or equivalent exact-head executions. Record run ID, job ID, artifact ID, Node, npm, esbuild, and source head for both executions.

- [ ] **Step 3: Compare all blocking static metrics byte-for-byte**

Required equality across both executions:

```text
sizes.package.unpackedBytes
sizes.package.fileCount
sizes.distributions[*].rawBytes
sizes.distributions[*].fileCount
sizes.bundles[*].rawBytes
```

Expected: every value is identical. If any differs, do not update the baseline.

- [ ] **Step 4: Update the baseline from the second exact-head artifact**

Change only measured values and `baselineSource` provenance. Preserve `schemaVersion`, package identity, and performance policy.

- [ ] **Step 5: Re-run report, validation, and hard gate**

```bash
npm run performance:report
npm run performance:validate
npm run performance:gate
```

Expected: PASS against the reviewed refreshed maximums.

- [ ] **Step 6: Commit the justified baseline refresh**

```bash
git add benchmarks/baselines/ua-info-2.2.0-node22-linux-x64.json
git commit -m "chore: refresh conformance tooling size baseline"
```

Skip this commit entirely when Step 1 passes without a baseline change.

---

### Task 10: Final Verification, Independence Audit, and Closure

**Files:**
- Create: `docs/superpowers/closures/2026-07-26-ua-info-external-conformance-audit.md`

**Interfaces:**
- Consumes: final exact implementation head and all prior evidence.
- Produces: merge-ready PR with traceable evidence and no upstream corpus content.

- [ ] **Step 1: Audit the repository diff for prohibited content**

```bash
git diff --name-only master...HEAD
git diff --stat master...HEAD
git grep -nE 'browser-all\.json|test/data/ua/(browser|os|device)' -- ':!docs/external-conformance.md' ':!docs/superpowers/specs/*' ':!docs/superpowers/plans/*'
```

Expected:

- no third-party JSON file exists;
- no external fixture directory exists;
- only the profile layout strings appear in tooling/documentation;
- no `src/` production file changed;
- no dependency or export changed.

- [ ] **Step 2: Run the complete package and audit test gates**

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

- [ ] **Step 3: Verify CLI failure and success semantics explicitly**

```bash
node scripts/conformance/audit-external.mjs; test "$?" -eq 2
npm run conformance:external -- \
  --profile ua-parser-js \
  --source-dir "$EXTERNAL_ROOT"
```

Expected: missing arguments exit `2`; valid external source exits `0` regardless of unsupported observations.

- [ ] **Step 4: Write the closure document**

Record:

- design and plan paths;
- TDD RED and GREEN commit/run evidence;
- synthetic-only test statement;
- list of new tooling files;
- live external run revision and aggregate counts only;
- privacy assertion result;
- source-boundary and symlink test evidence;
- baseline refresh evidence or explicit statement that none was needed;
- final exact-head CI run and artifact IDs;
- compatibility audit: package remains `ua-info@2.2.0`, Node remains `>=18`, public exports unchanged, no runtime dependency, no `src/` changes, no npm release required;
- explicit statement that no third-party fixture, regex, expected record, or implementation content was committed.

- [ ] **Step 5: Commit closure evidence**

```bash
git add docs/superpowers/closures/2026-07-26-ua-info-external-conformance-audit.md
git commit -m "docs: close external conformance audit milestone"
```

- [ ] **Step 6: Run final exact-head CI and review the PR diff**

The final CI must run on the closure commit. Confirm Node 18/20/22, detector coverage, packed consumers, Playground Chromium smoke, performance report/schema/hard gate, and all conformance synthetic tests pass. Review every changed file before marking the PR ready.

- [ ] **Step 7: Squash-merge with the expected head SHA**

Use the final closure head as `expected_head_sha`. Suggested title:

```text
feat: add independent external conformance audit
```

Suggested merge message:

```text
Add an opt-in, privacy-safe external corpus audit without vendoring third-party data or changing ua-info runtime semantics.
```
