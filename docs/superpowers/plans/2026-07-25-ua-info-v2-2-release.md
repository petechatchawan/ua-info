# ua-info v2.2.0 Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

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

- [ ] **Step 1: Change only the package manifest version**

Replace:

```json
"version": "2.1.0"
```

with:

```json
"version": "2.2.0"
```

Do not change scripts, exports, engines, dependencies, `files`, or `publishConfig`.

- [ ] **Step 2: Commit the deliberate RED state**

```bash
git add package.json
git commit -m "chore: begin ua-info 2.2.0 release"
```

- [ ] **Step 3: Open a draft release PR**

Title:

```text
release: publish ua-info 2.2.0
```

The PR body must state that the current head is intentionally RED because the package guards still require `2.1.0`.

- [ ] **Step 4: Verify RED in CI**

Expected failures:

```text
scripts/verify-package-identity.mjs -> expected 2.1.0 but package.json is 2.2.0
scripts/verify-package.mjs          -> expected 2.1.0 but package.json is 2.2.0
```

The failure must be limited to deliberate release-version guard mismatches. Fix unrelated failures before proceeding.

---

### Task 2: Synchronize active package guards

**Files:**
- Modify: `scripts/verify-package-identity.mjs`
- Modify: `scripts/verify-package.mjs`
- Modify: `scripts/verify-consumers.mjs`

**Interfaces:**
- Consumes: manifest identity `ua-info@2.2.0` from Task 1.
- Produces: consistent source, tarball, and clean-consumer expectations for `2.2.0`.

- [ ] **Step 1: Update the package identity verifier**

In `scripts/verify-package-identity.mjs`, change:

```js
version: '2.1.0',
```

to:

```js
version: '2.2.0',
```

and change the success output to:

```js
console.log('Package identity verified: ua-info@2.2.0, canonical metadata, and OIDC-only release workflow.');
```

Do not weaken any canonical metadata, OIDC, stale-reference, `files`, or workflow checks.

- [ ] **Step 2: Update the package dry-run verifier**

In `scripts/verify-package.mjs`, replace all active `2.1.0` expectations with `2.2.0`:

```js
if (packageJson.version !== '2.2.0') throw new Error(`Expected package version 2.2.0, received ${packageJson.version}`);
```

```js
if (report.name !== 'ua-info' || report.version !== '2.2.0') throw new Error(`Unexpected packed identity: ${report.name}@${report.version}`);
```

```js
console.log(`Package contents verified: ${report.files.length} files, ua-info@2.2.0, 2.x exports only, README/LICENSE present, no tests, playground files, or v1 artifacts.`);
```

Do not change tarball exclusion or export-map checks.

- [ ] **Step 3: Update and strengthen the packed consumer verifier**

In `scripts/verify-consumers.mjs`, require tarball version `2.2.0`:

```js
if (packReport.name !== 'ua-info' || packReport.version !== '2.2.0') {
  throw new Error(`Unexpected packed identity: ${packReport.name}@${packReport.version}`);
}
```

Extend the generated ESM consumer imports and assertions:

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

Add runtime assertions proving all nine public exports are functions and representative predicate behavior works:

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

For a crawler result, assert:

```js
const crawler = parse('OAI-SearchBot/1.0');
assert.equal(isClientKind(crawler, 'crawler'), true);
assert.equal(isContextKind(crawler, 'mini-app'), false);
assert.equal(isCPUArchitecture(crawler, 'arm64'), false);
```

Extend the CommonJS consumer to assert `isBrowser` is exported and works.

Extend the TypeScript consumer import and narrowing contract:

```ts
import { BrowserId, isBrowser, isClientKind, parse } from 'ua-info';
```

```ts
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

Retain ESM, CommonJS, server, browser, TypeScript Node16, and removed `/v2` checks.

- [ ] **Step 4: Commit synchronized guards**

```bash
git add scripts/verify-package-identity.mjs scripts/verify-package.mjs scripts/verify-consumers.mjs
git commit -m "test: verify ua-info 2.2.0 package consumers"
```

---

### Task 3: Document the 2.2.0 release

**Files:**
- Modify: `CHANGELOG.md:1-6`

**Interfaces:**
- Consumes: the approved typed predicate contract from PR #37.
- Produces: user-facing release notes for `2.2.0`.

- [ ] **Step 1: Insert the new changelog section above 2.1.0**

Insert exactly:

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

- [ ] **Step 2: Commit release notes**

```bash
git add CHANGELOG.md
git commit -m "docs: add ua-info 2.2.0 changelog"
```

---

### Task 4: Verify and finalize the release PR

**Files:**
- Modify: `docs/superpowers/specs/2026-07-25-ua-info-v2-2-release-design.md`
- Modify: `docs/superpowers/plans/2026-07-25-ua-info-v2-2-release.md`

**Interfaces:**
- Consumes: completed Tasks 1-3.
- Produces: exact-head CI evidence and a review-ready release PR.

- [ ] **Step 1: Run the repository release gate**

```bash
npm run check
```

Expected: package identity, lint, fixtures, coverage, build, tarball, and packed consumers all pass.

- [ ] **Step 2: Run the complete Playground gate**

```bash
npm run playground:check
```

Expected: setup, public-package boundaries, TypeScript, tests, production build, Chromium smoke, and network-isolation checks pass.

- [ ] **Step 3: Audit active version references**

```bash
git grep -n "2\.1\.0" -- package.json scripts CHANGELOG.md
```

Expected: only the historical `CHANGELOG.md` section remains. No active package or verifier file may require `2.1.0`.

- [ ] **Step 4: Audit scope**

```bash
git diff --name-only master...HEAD
```

Expected exactly:

```text
CHANGELOG.md
docs/superpowers/plans/2026-07-25-ua-info-v2-2-release.md
docs/superpowers/specs/2026-07-25-ua-info-v2-2-release-design.md
package.json
scripts/verify-consumers.mjs
scripts/verify-package-identity.mjs
scripts/verify-package.mjs
```

- [ ] **Step 5: Record exact-head evidence**

Update the design and plan status to `Implemented and verified` only after CI completes successfully. Record the PR number, exact head SHA, CI run ID, Node.js matrix result, detector coverage result, packed-consumer result, and Playground production-smoke result.

- [ ] **Step 6: Mark the PR ready for review**

The PR body must summarize release contents, compatibility invariants, RED/GREEN evidence, exact-head CI, and the post-merge publication sequence. Do not publish npm or create tag `v2.2.0` from the release branch.
