# ua-info External Conformance Audit Design

**Status:** Draft for owner review  
**Date:** 2026-07-26  
**Repository:** `petechatchawan/ua-info`  
**Scope:** Development tooling only; no runtime or public API change

## 1. Purpose

Add an independent, opt-in audit tool that measures how `ua-info` interprets User-Agent examples stored in an external third-party checkout, initially supporting the public `ua-parser-js` browser, operating-system, and device test-data layout.

The audit exists to discover coverage gaps. It does not make `ua-info` a clone of another parser, does not define `ua-info` semantics from another project's expected outputs, and does not import third-party fixtures into this repository.

## 2. Non-negotiable independence rules

The implementation must satisfy all of the following:

1. No third-party fixture JSON is committed, copied, transformed, generated, cached, or vendored into this repository.
2. No third-party regular expression, parser table, detector ordering, or implementation code is copied or mechanically translated.
3. The tool performs no network request and does not clone or download an upstream repository.
4. The operator supplies an already-existing external checkout through `--source-dir`.
5. `--source-dir` must resolve outside the `ua-info` Git worktree. An in-repository source path is rejected.
6. The audit never writes to the external checkout.
7. Persisted reports contain no raw User-Agent strings, complete expected records, absolute source paths, or copied fixture bodies.
8. Standard CI does not fetch or execute third-party corpora. The audit remains an explicit local or separately authorized workflow.
9. Production detector changes may not cite this audit alone. Every accepted gap requires an independently sourced `ua-info` fixture with provenance before implementation.
10. `ua-info` keeps its own result model. Semantic differences are classified rather than forced into field-for-field parity.

## 3. Selected approach

### 3.1 External checkout profile

Implement a small profile adapter for the known upstream directory shape:

```text
<external-checkout>/
└── test/data/ua/
    ├── browser/browser-all.json
    ├── os/*.json
    └── device/*.json
```

The profile reads those files only at runtime. The adapter converts each external record into a transient, internal comparison case held in memory. No transformed fixture is written to disk.

### 3.2 Why this approach

This approach provides useful coverage evidence while preserving clear authorship boundaries:

- upstream data stays in the upstream checkout;
- `ua-info` owns only the audit mechanics and classification policy;
- tests use synthetic fixtures authored specifically for this repository;
- gap remediation continues through the existing source-backed fixture-first process;
- the audit can be removed without affecting package runtime behavior.

## 4. Rejected and deferred alternatives

### Rejected: vendor a pinned fixture snapshot

A committed snapshot would create unnecessary licensing and authorship ambiguity, increase repository size, and encourage mechanical parity work.

### Rejected: automatically clone upstream in GitHub Actions

Automatic fetching would turn third-party data into a routine project dependency, create moving-target results, and make licensing boundaries less obvious.

### Deferred: universal conformance manifest framework

A fully generic plugin framework for multiple parsers is unnecessary for the first audit. The internal boundaries must remain reusable, but only one external-layout profile is required initially.

## 5. Architecture

```text
scripts/conformance/
├── audit-external.mjs
├── classify-result.mjs
├── external-source-guard.mjs
├── report-schema.mjs
├── render-summary.mjs
├── profiles/
│   └── ua-parser-js-layout.mjs
└── __tests__/
    ├── audit-external.test.cjs
    ├── classify-result.test.cjs
    ├── external-source-guard.test.cjs
    └── report-schema.test.cjs
```

### 5.1 CLI orchestrator

`audit-external.mjs` owns argument parsing, source validation, loading, execution, aggregation, report writing, and exit codes. It does not contain parser-specific classification rules.

Proposed command:

```bash
npm run conformance:external -- \
  --profile ua-parser-js \
  --source-dir ../ua-parser-js \
  --output artifacts/conformance/external-conformance.json \
  --summary artifacts/conformance/external-conformance.md
```

Required arguments:

- `--profile ua-parser-js`
- `--source-dir <external checkout>`

Optional output arguments use the default paths shown above.

### 5.2 External source guard

The source guard:

- resolves real paths;
- rejects missing directories;
- rejects paths inside the `ua-info` worktree;
- verifies the required browser, OS, and device paths;
- rejects symbolic-link escapes that resolve back into the worktree;
- never modifies the supplied source.

### 5.3 Layout profile

The profile:

- reads `browser/browser-all.json`;
- reads every `.json` file immediately under `os/` and `device/` in deterministic filename order;
- validates only the minimal fields required for comparison;
- assigns a transient locator of `relative-file + array index`;
- never exports raw fixture records to the report layer.

Malformed records are counted as source errors and cause exit code `2`; they are not silently skipped.

### 5.4 Classifier

The classifier calls the public `parse()` API and compares the result according to `ua-info` semantics.

Each case receives exactly one status:

- `exact`: all externally asserted fields that have direct `ua-info` equivalents match after documented normalization;
- `semantic-equivalent`: the same product or platform is represented correctly in a different `ua-info` plane, such as an in-app host in `context.host` rather than replacing `browser`;
- `partial`: a meaningful subset matches, such as device type and model matching while vendor is unknown;
- `unsupported`: the expected identity is not represented or a generic fallback selects a different product;

Classification is domain-specific and deterministic.

## 6. Comparison policy

### 6.1 Browser

Direct browser comparison uses normalized product name, version, major version, and browser type where an equivalent exists.

Rules:

- known aliases may normalize punctuation and documented product naming only;
- a fallback to Chrome for a distinguishable unsupported derivative is `unsupported`, not `partial`;
- an upstream `inapp` browser identity may be `semantic-equivalent` when `ua-info` preserves the underlying browser and identifies the same host in `context`;
- an unidentifiable product that intentionally exposes no distinct token is not upgraded through runtime assumptions;
- no new product alias is introduced merely to improve audit results.

### 6.2 Operating system

Direct OS comparison uses normalized OS family/name and version.

Rules:

- equivalent naming such as platform punctuation may normalize;
- a specific Linux distribution falling back to generic Linux is `partial`;
- a platform with no corresponding `ua-info` OS identity is `unsupported`;
- version mismatch with correct OS identity is `partial` unless the external version is undefined.

### 6.3 Device

Device comparison considers type, vendor, and model only when those fields are asserted externally.

Rules:

- type aliases such as `smarttv` and `smart-tv` may normalize;
- correct type and model with missing vendor is `partial`;
- correct type only is `partial`;
- wrong device class is `unsupported`;
- vendor inference remains conservative and is never expanded from the audit alone.

## 7. Report contract

The persisted JSON report contains aggregate evidence only:

```ts
interface ExternalConformanceReport {
  readonly schemaVersion: 1;
  readonly profile: 'ua-parser-js';
  readonly generatedAt: string;
  readonly sourceRevision: string | null;
  readonly package: {
    readonly name: 'ua-info';
    readonly version: string;
    readonly commit: string | null;
  };
  readonly domains: {
    readonly browser: DomainSummary;
    readonly os: DomainSummary;
    readonly device: DomainSummary;
  };
  readonly totals: ClassificationCounts;
  readonly gapGroups: readonly GapGroup[];
}
```

A `GapGroup` contains only:

- domain;
- normalized expected identity;
- classification;
- occurrence count;
- up to five transient source locators using relative path and index.

The report must not contain:

- raw User-Agent strings;
- full upstream descriptions;
- copied expected objects;
- absolute filesystem paths;
- regular expressions;
- external source file contents.

The Markdown summary presents percentages and highest-frequency gap groups. It includes an explicit statement that results are interoperability observations, not implementation requirements.

## 8. Source revision and reproducibility

When the external directory is a Git checkout, the tool may execute local read-only Git commands to capture:

- `git rev-parse HEAD`;
- whether the external checkout is dirty.

A dirty checkout is allowed but visibly marked. No remote URL is required and no network operation is performed.

Deterministic ordering is:

1. domain: browser, OS, device;
2. source-relative filename;
3. array index;
4. gap group key.

Given identical `ua-info` code, external checkout, Node.js version, and profile version, aggregate static results must be identical.

## 9. Exit codes

- `0`: audit completed successfully, regardless of unsupported cases;
- `2`: invalid arguments, unsafe source path, missing layout, malformed JSON, invalid fixture shape, parser execution failure, or report-schema failure.

There is no conformance threshold and no exit code `1` in the initial version. The tool is report-only.

## 10. Testing strategy

All committed tests use synthetic fixture files created in temporary directories. They must not copy recognizable upstream User-Agent strings or expected records.

Required tests:

1. Reject a source directory inside the repository worktree.
2. Reject a symbolic link that resolves inside the worktree.
3. Load browser, OS, and device files in deterministic order.
4. Classify one synthetic case for each of `exact`, `semantic-equivalent`, `partial`, and `unsupported`.
5. Verify in-app context semantic mapping without changing browser identity.
6. Verify malformed source JSON exits with code `2`.
7. Verify reports contain no raw User-Agent string, absolute path, or complete expected record.
8. Verify report-schema strictness and deterministic gap ordering.
9. Verify unsupported cases still exit `0`.
10. Run the existing full package, packed-consumer, detection-coverage, Playground, and performance hard gates unchanged.

No production detector test may use an external fixture copied by this tool.

## 11. Documentation and operator workflow

Add `docs/external-conformance.md` covering:

- why the audit is external and opt-in;
- how to prepare a sibling checkout manually;
- how to run the command;
- how to interpret the four classifications;
- why audit gaps do not automatically become features;
- the independent remediation workflow.

Independent remediation remains:

```text
External gap observation
→ prioritize by ua-info product value
→ locate independent official documentation or owned real capture
→ add ua-info fixture with provenance
→ demonstrate focused RED
→ implement the smallest independent detector change
→ run full gates
```

## 12. CI and repository policy

The initial implementation does not add an upstream-fetching CI job.

Standard CI validates only:

- synthetic audit unit tests;
- CLI and report-schema behavior;
- source-boundary protections;
- absence of runtime/package regressions through existing jobs.

Generated audit artifacts remain ignored by Git.

## 13. Compatibility and release policy

This work must not change:

- `UAResult` or public types;
- parser behavior;
- package exports;
- runtime dependencies;
- Node.js support;
- npm publication contents, except for an unavoidable reviewed `package.json` script-size change;
- Playground behavior.

The audit is development tooling. It does not require an npm release by itself.

## 14. Acceptance criteria

The milestone is complete when:

1. the external audit runs against an operator-supplied sibling checkout without network access;
2. no upstream fixture or implementation content is added to the repository or npm package;
3. reports expose aggregate classifications and locators but no raw corpus content;
4. all classifications are covered by synthetic tests;
5. source path and symlink protections are verified;
6. unsupported results do not fail the command;
7. malformed or unsafe inputs fail with exit code `2`;
8. existing package, detection, Playground, and performance gates pass;
9. a closure document records scope, verification, and independence evidence;
10. no production detection rule is added as part of this milestone.
