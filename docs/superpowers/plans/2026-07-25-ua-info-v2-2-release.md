# ua-info v2.2.0 Release Implementation Plan

**Status:** Implemented and verified  
**Pull request:** `#38`  
**Verified implementation head:** `60d4f45e2b449be35b54098b88422319b7b511cd`  
**GREEN CI:** run `30162700786` / CI `#213`

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Prepare one reviewed and fully verified package release commit for `ua-info@2.2.0`, publishing the nine typed predicates already merged through PR #37.

**Architecture:** Keep the release diff metadata-only. First bump the manifest to create a deliberate RED gate against the existing `2.1.0` package guards, then synchronize every active guard and the changelog, and finally verify the exact branch head through the repository's full CI and Playground matrix.

**Tech Stack:** npm package metadata, Node.js ESM verification scripts, GitHub Actions, Jest 30, TypeScript 4.9, Node.js 18/20/22, Vite/Playwright Playground gates.

## Global Constraints

- Target package is exactly `ua-info@2.2.0`.
- Base commit is `3423325303d4bcfee690dcb5be54e40610e3c4b1`.
- Release branch is `release/ua-info-v2-2-0`.
- Package identity remains `ua-info`.
- Node.js support remains `>=18`.
- Public exports remain root, `/server`, `/browser`, and `/package.json`.
- Removed `/v2` package subpaths remain removed.
- npm publication remains OIDC-only with provenance.
- No runtime dependency, parser, detector, public type, constant, or Playground behavior change is permitted.
- Historical specifications retain their recorded version references.
- No root `package-lock.json` exists; do not modify `apps/playground/package-lock.json`.
- Publication and live registry verification are separate post-merge work.

---

### Task 1: Create the manifest-version RED gate

**Files:**
- Modify: `package.json:1-6`

**Interfaces:**
- Consumes: current package identity `ua-info@2.1.0`.
- Produces: manifest identity `ua-info@2.2.0`, intentionally inconsistent with active guards until Task 2.

- [x] **Step 1: Change only the package manifest version**

Replace:

```json
"version": "2.1.0"
```

with:

```json
"version": "2.2.0"
```

Do not change scripts, exports, engines, dependencies, `files`, or `publishConfig`.

- [x] **Step 2: Commit the deliberate RED state**

```bash
git add package.json
git commit -m "chore: begin ua-info 2.2.0 release"
```

- [x] **Step 3: Open a draft release PR**

Title:

```text
release: publish ua-info 2.2.0
```

The PR body states that the initial head was intentionally RED because package guards still required `2.1.0`.

- [x] **Step 4: Verify RED in CI**

Observed result:

```text
RED head: 35caf496e866a6674bd221069058136e2dccef2b
CI run: 30162614627 / #209
```

Detector coverage and unit/build gates passed. Package verification failed at the intentional active-version mismatch before the guards were synchronized.

---

### Task 2: Synchronize active package guards

**Files:**
- Modify: `scripts/verify-package-identity.mjs`
- Modify: `scripts/verify-package.mjs`
- Modify: `scripts/verify-consumers.mjs`

**Interfaces:**
- Consumes: manifest identity `ua-info@2.2.0` from Task 1.
- Produces: consistent source, tarball, and clean-consumer expectations for `2.2.0`.

- [x] **Step 1: Update the package identity verifier**

In `scripts/verify-package-identity.mjs`, the active version is:

```js
version: '2.2.0',
```

and the success output is:

```js
console.log('Package identity verified: ua-info@2.2.0, canonical metadata, and OIDC-only release workflow.');
```

Canonical metadata, OIDC, stale-reference, `files`, and workflow checks remain unchanged.

- [x] **Step 2: Update the package dry-run verifier**

` scripts/verify-package.mjs` requires `2.2.0` for the source manifest, npm dry-run report, and success output:

```js
if (packageJson.version !== '2.2.0') throw new Error(`Expected package version 2.2.0, received ${packageJson.version}`);
```

```js
if (report.name !== 'ua-info' || report.version !== '2.2.0') throw new Error(`Unexpected packed identity: ${report.name}@${report.version}`);
```

```js
console.log(`Package contents verified: ${report.files.length} files, ua-info@2.2.0, 2.x exports only, README/LICENSE present, no tests, playground files, or v1 artifacts.`);
```

Tarball exclusion and export-map checks remain unchanged.

- [x] **Step 3: Update and strengthen the packed consumer verifier**

`scripts/verify-consumers.mjs` requires tarball version `2.2.0`:

```js
if (packReport.name !== 'ua-info' || packReport.version !== '2.2.0') {
  throw new Error(`Unexpected packed identity: ${packReport.name}@${packReport.version}`);
}
```

The generated ESM consumer imports all nine predicates:

```js
const {
  BrowserId,
  isBrowser,
  isBrowserFamily,
  isBrowserMode,
  isCPUArchitecture,
  isClientKind,
  isContextKind,
  isDeviceType,
  isEngine,
  isOperatingSystem,
  parse,
  parseVersion,
  satisfiesVersion,
} = userAgentInfo;
```

Runtime checks prove all nine exports are functions and representative behavior works:

```js
for (const helper of [
  isBrowser,
  isBrowserFamily,
  isBrowserMode,
  isCPUArchitecture,
  isClientKind,
  isContextKind,
  isDeviceType,
  isEngine,
  isOperatingSystem,
]) assert.equal(typeof helper, 'function');

assert.equal(isBrowser(result, BrowserId.Chrome), true);
assert.equal(isBrowserFamily(result, 'chromium'), true);
assert.equal(isBrowserMode(result, 'browser'), true);
assert.equal(isEngine(result, 'blink'), true);
assert.equal(isOperatingSystem(result, 'windows'), true);
assert.equal(isDeviceType(result, 'desktop'), true);
```

Crawler checks cover nullable mismatch behavior:

```js
const crawler = parse('OAI-SearchBot/1.0');
assert.equal(isClientKind(crawler, 'crawler'), true);
assert.equal(isContextKind(crawler, 'mini-app'), false);
assert.equal(isCPUArchitecture(crawler, 'arm64'), false);
```

The CommonJS consumer verifies `isBrowser`. The TypeScript Node16 consumer verifies literal narrowing:

```ts
import { BrowserId, isBrowser, isClientKind, parse } from 'ua-info';

if (isBrowser(result, BrowserId.Chrome)) {
  const browserId: typeof BrowserId.Chrome = result.browser.id;
  void browserId;
}

const crawler = parse('OAI-SearchBot/1.0');
if (isClientKind(crawler, 'crawler')) {
  const kind: 'crawler' = crawler.client.kind;
  void kind;
}
```

Existing ESM, CommonJS, server, browser, TypeScript Node16, and removed `/v2` checks remain active.

- [x] **Step 4: Commit synchronized guards**

The three guard files were updated on the release branch and validated by CI #213.

---

### Task 3: Document the 2.2.0 release

**Files:**
- Modify: `CHANGELOG.md:1-6`

**Interfaces:**
- Consumes: the approved typed predicate contract from PR #37.
- Produces: user-facing release notes for `2.2.0`.

- [x] **Step 1: Insert the new changelog section above 2.1.0**

The changelog now contains:

```markdown
## 2.2.0 — 2026-07-25

### Added

- Nine pure, tree-shakeable typed predicate helpers exported from the package root: `isBrowser`, `isBrowserFamily`, `isBrowserMode`, `isEngine`, `isOperatingSystem`, `isDeviceType`, `isCPUArchitecture`, `isClientKind`, and `isContextKind`.
- Compile-time narrowing for nullable result dimensions and matched literal values.
- Support for custom or future string IDs in browser, browser-family, engine, operating-system, and CPU-architecture predicates.
- Closed-union input validation for browser mode, device type, client kind, and context kind.

### Compatibility

- No `UAResult`, detector behavior, package entry-point, or runtime dependency changes.
- ESM, CommonJS, TypeScript Node16/NodeNext, server, browser, packed-consumer, and Playground contracts remain supported on Node.js 18, 20, and 22.

### Security note

Predicate helpers query parsed User-Agent and Client Hints claims. A match does not authenticate a browser, client, device, context, or request origin.
```

- [x] **Step 2: Commit release notes**

The changelog was committed on the release branch before GREEN verification.

---

### Task 4: Verify and finalize the release PR

**Files:**
- Modify: `docs/superpowers/specs/2026-07-25-ua-info-v2-2-release-design.md`
- Modify: `docs/superpowers/plans/2026-07-25-ua-info-v2-2-release.md`

**Interfaces:**
- Consumes: completed Tasks 1-3.
- Produces: exact-head CI evidence and a review-ready release PR.

- [x] **Step 1: Run the repository release gate**

CI #213 passed package identity, lint, fixtures, production coverage, Jest, ESM/CommonJS build, npm tarball checks, and strengthened packed consumers on Node.js 18, 20, and 22.

- [x] **Step 2: Run the complete Playground gate**

CI #213 passed package setup, public-package boundaries, TypeScript, tests, production build, Chromium installation, and production smoke.

- [x] **Step 3: Audit active version references**

Active release files require `2.2.0`. Remaining `2.1.0` references are historical changelog, specification, or implementation-plan records.

- [x] **Step 4: Audit scope**

The branch is ahead of `master`, behind by zero, with exactly:

```text
CHANGELOG.md
docs/superpowers/plans/2026-07-25-ua-info-v2-2-release.md
docs/superpowers/specs/2026-07-25-ua-info-v2-2-release-design.md
package.json
scripts/verify-consumers.mjs
scripts/verify-package-identity.mjs
scripts/verify-package.mjs
```

- [x] **Step 5: Record exact-head evidence**

```text
PR: #38
Base: 3423325303d4bcfee690dcb5be54e40610e3c4b1
RED head: 35caf496e866a6674bd221069058136e2dccef2b
RED CI: 30162614627 / #209
Verified implementation head: 60d4f45e2b449be35b54098b88422319b7b511cd
GREEN CI: 30162700786 / #213
```

All required Node.js, coverage, package, packed-consumer, and Playground gates passed.

- [x] **Step 6: Mark the PR ready for review**

The PR is made ready only after the documentation closure commits receive a final exact-head CI pass. npm publication and tag `v2.2.0` remain post-merge work.
