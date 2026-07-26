# External Conformance Audit

The external conformance audit is an opt-in development tool for measuring how `ua-info` interprets browser, operating-system, and device examples from an existing external checkout. It is report-only and does not change `ua-info` runtime semantics.

## Prepare the source

Prepare the supported source checkout yourself as a sibling of this repository. The audit does not clone, download, fetch, or update the source.

```text
workspace/
├── ua-info/
└── ua-parser-js/
```

The supported profile reads this existing layout at runtime:

```text
test/data/ua/browser/browser-all.json
test/data/ua/os/*.json
test/data/ua/device/*.json
```

The source root, required directories, and every consumed JSON file must resolve outside the `ua-info` worktree. Root and child symbolic links that resolve back into the worktree are rejected.

## Run the audit

```bash
cd /path/to/ua-info
npm ci
npm run conformance:external -- \
  --profile ua-parser-js \
  --source-dir ../ua-parser-js
```

Optional paths:

```bash
npm run conformance:external -- \
  --profile ua-parser-js \
  --source-dir ../ua-parser-js \
  --output artifacts/conformance/external-conformance.json \
  --summary artifacts/conformance/external-conformance.md
```

A completed audit exits `0` even when partial or unsupported cases exist. Invalid arguments, unsafe paths, malformed source data, parser failures, or report validation failures exit `2`. There is no exit `1` and no conformance threshold.

## Safety and privacy boundary

The audit:

- performs no network request;
- never modifies the supplied source checkout;
- keeps external records and User-Agent strings transient in memory;
- writes aggregate JSON and Markdown only;
- does not persist raw User-Agent strings, complete expected records, full descriptions, absolute source paths, regular expressions, or fixture bodies;
- uses invented temporary fixtures in standard CI.

Generated files under `artifacts/conformance/` are ignored. Do not commit, publish, or attach generated reports without reviewing their contents and intended audience.

## Classifications

- `exact`: all externally asserted fields with direct `ua-info` equivalents match after generic normalization.
- `semantic-equivalent`: the identity is represented correctly in another `ua-info` plane, such as an in-app host in `context.host` while `browser` remains the underlying runtime.
- `partial`: a meaningful subset matches, such as the device class and model matching while vendor is unknown.
- `unsupported`: the expected identity is absent, unknown, or replaced by a different generic product.

`ua-info` semantics remain authoritative. The audit does not remap `browser`, `context`, `os`, or `device` to imitate another parser.

## Independent remediation policy

Audit gaps are observations, not automatic feature requirements. A production detector change must use an independent source of evidence:

```text
External gap observation
→ prioritize by ua-info product value
→ locate official documentation or an owned real capture
→ add a ua-info fixture with provenance
→ demonstrate focused RED
→ implement the smallest independent detector change
→ run the full validation gates
```

Do not copy or mechanically translate third-party fixtures, expected records, regexes, parser tables, detector ordering, or implementation logic into this repository.
