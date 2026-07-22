# User Agent Info Package Migration Implementation Plan

> **Status: SUPERSEDED**  
> **Reason:** npm rejected the unscoped `user-agent-info` package name as too similar to an existing package.  
> **Canonical package identity:** `ua-info`


> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the active npm package and GitHub repository from `ua-info` to `user-agent-info` without changing the public API, publish `user-agent-info@2.0.1`, and permanently deprecate every `ua-info` version after registry verification.

**Architecture:** Treat the rename as an atomic identity cutover with two boundaries. The source migration changes package metadata, documentation, consumer tests, and release automation while a repository guard prevents publication from the old GitHub identity. The operational cutover then renames the repository, performs the one-time bootstrap publish, verifies every public entry point from npm, configures Trusted Publishing, and only then deprecates `ua-info`.

**Tech Stack:** TypeScript 4.9, Node.js 18/20/22, npm 11.5.1 for publishing, Jest, ESLint, native ESM/CommonJS package exports, GitHub Actions, npm public registry.

## Global Constraints

- The canonical package is exactly `user-agent-info@2.0.1`.
- The canonical repository is exactly `petechatchawan/user-agent-info`.
- Keep `parse`, `parseRequest`, `detectCurrent`, every exported type, result semantics, ESM support, CommonJS support, and TypeScript declarations unchanged.
- Keep only the root, `./server`, `./browser`, and `./package.json` public exports; do not restore `/v2` or the removed `UAInfo` class.
- Do not publish another `ua-info` version after `2.0.1`.
- Do not publish `user-agent-info` until the GitHub repository has been renamed.
- Do not deprecate `ua-info` until `user-agent-info@2.0.1` is installable and all public entry points pass clean registry-consumer tests.
- The first `user-agent-info@2.0.1` publication is a one-time authenticated bootstrap publish; future releases must use npm Trusted Publishing.
- Keep Node.js `>=18` and the CI matrix on Node.js 18, 20, and 22.
- Do not introduce a `package-lock.json`; the repository currently uses `npm install` without a committed lockfile.
- Documentation examples must read like ordinary application code: short variable names, realistic control flow, no invented business policy, no repeated marketing adjectives, and no comments that merely restate the code.
- Intentional references to `ua-info` are allowed only in the migration document and the approved migration design specification.
- Stop immediately if `npm view user-agent-info name version --json` does not return `E404` before source migration begins.

---

## File Map

### Files created

- `MIGRATION.md` — exact instructions for moving from `ua-info` to `user-agent-info` without API changes.
- `scripts/verify-package-identity.mjs` — source-tree and package-metadata guard for the canonical name, repository, version, documentation, and forbidden stale references.
- `docs/superpowers/plans/2026-07-22-user-agent-info-package-migration.md` — this execution plan.

### Files modified

- `package.json` — package name, description, repository URLs, keywords, packed documentation, and identity-check script.
- `README.md` — canonical branding, badges, install/import examples, natural code samples, and migration link.
- `docs/v2-design.md` — canonical package name and entry-point contract.
- `scripts/verify-package.mjs` — assert exact package identity and require migration documentation in the tarball.
- `scripts/verify-consumers.mjs` — install and execute the packed package exclusively as `user-agent-info`.
- `src/__tests__/root-api.test.ts` — rename the package-root contract description without changing assertions.
- `.github/workflows/publish.yml` — add an explicit repository-identity preflight and prevent publication from `petechatchawan/ua-info`.

### Intentionally unchanged

- `src/v2/**` and parser implementations — the rename must not change detection behavior.
- `src/index.ts`, `src/v2/server.ts`, and `src/v2/browser.ts` — exports remain structurally identical.
- `.github/workflows/ci.yml` — the existing Node.js 18/20/22 matrix already runs `npm run pack:check`.
- `LICENSE` — copyright and license terms do not change.

---

### Task 1: Prove the new npm name is available

**Files:**
- Read: `package.json`
- Read: `docs/superpowers/specs/2026-07-22-user-agent-info-package-migration-design.md`

**Interfaces:**
- Consumes: npm public registry package metadata endpoint through npm CLI.
- Produces: a hard go/no-go decision before any source file is changed.

- [ ] **Step 1: Verify the current source identity**

Run:

```bash
node -e "const p=require('./package.json'); console.log(`${p.name}@${p.version}`)"
```

Expected:

```text
ua-info@2.0.1
```

- [ ] **Step 2: Query the exact target name from the npm registry**

Run:

```bash
npm view user-agent-info name version --json
```

Expected: command exits non-zero with npm error code `E404` and no package metadata.

- [ ] **Step 3: Stop on any non-E404 result**

If npm returns a package name, version, permission error, timeout, or ambiguous registry response, do not edit source files. Record the exact command output and resolve availability or connectivity first.

- [ ] **Step 4: Confirm the configured registry**

Run:

```bash
npm config get registry
```

Expected:

```text
https://registry.npmjs.org/
```

- [ ] **Step 5: Record the preflight in the implementation PR body**

Use this exact line after the registry check succeeds:

```text
Target-name preflight: `user-agent-info` returned npm `E404` from `https://registry.npmjs.org/` on 2026-07-22.
```

No commit is created for this task because it changes no repository files.

---

### Task 2: Add the package-identity contract and rename package metadata

**Files:**
- Create: `scripts/verify-package-identity.mjs`
- Modify: `package.json`
- Modify: `scripts/verify-package.mjs`
- Test: `scripts/verify-package-identity.mjs`
- Test: `scripts/verify-package.mjs`

**Interfaces:**
- Consumes: `package.json`, repository text files, and npm dry-run pack metadata.
- Produces: `npm run identity:check`; `npm run check` includes identity validation before lint/tests/build; packed package identity is exactly `user-agent-info@2.0.1`.

- [ ] **Step 1: Write the failing identity verifier**

Create `scripts/verify-package-identity.mjs`:

```js
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));

const expected = Object.freeze({
  name: 'user-agent-info',
  version: '2.0.1',
  repository: 'git+https://github.com/petechatchawan/user-agent-info.git',
  homepage: 'https://github.com/petechatchawan/user-agent-info#readme',
  bugs: 'https://github.com/petechatchawan/user-agent-info/issues',
});

const failures = [];

if (packageJson.name !== expected.name) failures.push(`name: ${packageJson.name}`);
if (packageJson.version !== expected.version) failures.push(`version: ${packageJson.version}`);
if (packageJson.repository?.url !== expected.repository) failures.push(`repository: ${packageJson.repository?.url}`);
if (packageJson.homepage !== expected.homepage) failures.push(`homepage: ${packageJson.homepage}`);
if (packageJson.bugs?.url !== expected.bugs) failures.push(`bugs: ${packageJson.bugs?.url}`);

const requiredFiles = new Set(['dist', 'README.md', 'MIGRATION.md', 'LICENSE']);
for (const entry of requiredFiles) {
  if (!packageJson.files?.includes(entry)) failures.push(`files is missing ${entry}`);
}

const ignoredDirectories = new Set(['.git', 'dist', 'node_modules']);
const allowedLegacyFiles = new Set([
  'MIGRATION.md',
  'docs/superpowers/specs/2026-07-22-user-agent-info-package-migration-design.md',
]);
const forbiddenPatterns = [
  /from ['"]ua-info(?:\/[^'"]*)?['"]/g,
  /require\(['"]ua-info(?:\/[^'"]*)?['"]\)/g,
  /(?:npm install|npm i|pnpm add|yarn add) ua-info(?:\s|$)/g,
  /github\.com\/petechatchawan\/ua-info/g,
  /npmjs\.com\/package\/ua-info/g,
  /shields\.io\/npm\/(?:v|l)\/ua-info/g,
];

async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collect(absolute));
    else if (/\.(?:md|mjs|js|ts|json|yml|yaml)$/.test(entry.name)) files.push(absolute);
  }

  return files;
}

for (const absolute of await collect(root)) {
  const relative = path.relative(root, absolute).split(path.sep).join('/');
  if (allowedLegacyFiles.has(relative)) continue;
  const content = await readFile(absolute, 'utf8');

  for (const pattern of forbiddenPatterns) {
    pattern.lastIndex = 0;
    if (pattern.test(content)) failures.push(`${relative}: stale legacy reference matched ${pattern}`);
  }
}

if (failures.length > 0) {
  console.error('Package identity verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Package identity verified: user-agent-info@2.0.1 and canonical repository metadata.');
```

- [ ] **Step 2: Run the identity verifier and confirm it fails against the old metadata**

Run:

```bash
node scripts/verify-package-identity.mjs
```

Expected: FAIL and report at least `name: ua-info`, old GitHub URLs, and stale imports/install examples.

- [ ] **Step 3: Rename package metadata without changing the version**

Update the relevant `package.json` fields to exactly:

```json
{
  "name": "user-agent-info",
  "version": "2.0.1",
  "description": "TypeScript User-Agent parser with Client Hints, browser and device detection, bots, WebViews, and in-app context support",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/petechatchawan/user-agent-info.git"
  },
  "homepage": "https://github.com/petechatchawan/user-agent-info#readme",
  "bugs": {
    "url": "https://github.com/petechatchawan/user-agent-info/issues"
  },
  "files": [
    "dist",
    "README.md",
    "MIGRATION.md",
    "LICENSE"
  ],
  "keywords": [
    "user-agent",
    "user-agent-parser",
    "ua-parser",
    "useragent",
    "typescript",
    "javascript",
    "browser-detection",
    "device-detection",
    "os-detection",
    "client-hints",
    "bot-detection",
    "crawler-detection",
    "webview-detection",
    "in-app-browser",
    "line-liff",
    "pwa-detection",
    "nodejs"
  ]
}
```

Keep the existing author, license, engines, publishConfig, entry points, `sideEffects`, and devDependencies unchanged.

- [ ] **Step 4: Add the identity check to the script graph**

Update `package.json` scripts to:

```json
{
  "identity:check": "node scripts/verify-package-identity.mjs",
  "check": "npm run identity:check && npm run lint && npm test && npm run build && npm run pack:check",
  "pack:check": "node scripts/verify-package.mjs && npm run consumer:check"
}
```

Keep all other scripts unchanged.

- [ ] **Step 5: Tighten the packed-package verifier**

In `scripts/verify-package.mjs`, add exact assertions immediately after reading `package.json`:

```js
if (packageJson.name !== 'user-agent-info') {
  throw new Error(`Expected package name user-agent-info, received ${packageJson.name}`);
}

if (packageJson.version !== '2.0.1') {
  throw new Error(`Expected package version 2.0.1, received ${packageJson.version}`);
}
```

Change the required documentation list to:

```js
const requiredDocumentation = ['README.md', 'MIGRATION.md', 'LICENSE'];
```

Change the success message to:

```js
console.log(
  `Package contents verified: ${report.files.length} files, user-agent-info@2.0.1, 2.x exports only, README/MIGRATION/LICENSE present, no tests or v1 artifacts.`,
);
```

- [ ] **Step 6: Run the verifier and observe remaining documentation failures**

Run:

```bash
npm run identity:check
```

Expected: FAIL only for stale references in files not yet migrated and for missing `MIGRATION.md`.

- [ ] **Step 7: Commit the package identity foundation**

After Tasks 3–5 remove the remaining expected failures, commit all identity-contract files together:

```bash
git add package.json scripts/verify-package-identity.mjs scripts/verify-package.mjs
git commit -m "chore: establish user-agent-info package identity"
```

Do not commit Task 2 by itself while `npm run identity:check` is still failing; the commit occurs after the dependent documentation and consumer migrations pass.

---

### Task 3: Migrate packed consumers and package-root contract tests

**Files:**
- Modify: `scripts/verify-consumers.mjs`
- Modify: `src/__tests__/root-api.test.ts`
- Test: `scripts/verify-consumers.mjs`
- Test: `src/__tests__/root-api.test.ts`

**Interfaces:**
- Consumes: the tarball produced by `npm pack` and the existing root/server/browser exports.
- Produces: clean ESM, CommonJS, server, browser, and removed-subpath assertions against `user-agent-info` only.

- [ ] **Step 1: Change the temporary consumer workspace prefix**

In `scripts/verify-consumers.mjs`, replace:

```js
const workspace = await mkdtemp(path.join(os.tmpdir(), 'ua-info-consumer-'));
```

with:

```js
const workspace = await mkdtemp(path.join(os.tmpdir(), 'user-agent-info-consumer-'));
```

- [ ] **Step 2: Assert the packed tarball identity before installation**

Immediately after `const [packReport] = JSON.parse(packOutput);`, add:

```js
if (packReport.name !== 'user-agent-info' || packReport.version !== '2.0.1') {
  throw new Error(`Unexpected packed identity: ${packReport.name}@${packReport.version}`);
}
```

- [ ] **Step 3: Replace every generated ESM module specifier**

Use exactly:

```js
`import * as userAgentInfo from 'user-agent-info';\n` +
`import { parseRequest } from 'user-agent-info/server';\n` +
`import { detectCurrent } from 'user-agent-info/browser';\n` +
`const { BrowserId, parse, parseVersion, satisfiesVersion } = userAgentInfo;\n` +
```

Update the v1-class assertion to:

```js
`assert.equal('UAInfo' in userAgentInfo, false);\n` +
```

- [ ] **Step 4: Replace every generated CommonJS module specifier**

Use exactly:

```js
`const userAgentInfo = require('user-agent-info');\n` +
`const { BrowserId, parse } = userAgentInfo;\n` +
`const { parseRequest } = require('user-agent-info/server');\n` +
```

Update the v1-class assertion to:

```js
`assert.equal('UAInfo' in userAgentInfo, false);\n` +
```

- [ ] **Step 5: Preserve the removed-v2 contract under the new identity**

Replace the generated assertion with:

```js
`const assert = require('node:assert/strict');\n` +
`assert.throws(() => require('user-agent-info/v2'), /Package subpath|not defined|cannot find/i);\n`
```

- [ ] **Step 6: Rename the consumer success message**

Use:

```js
console.log('Package consumer verification passed for user-agent-info root, server, browser, ESM, and CommonJS APIs.');
```

- [ ] **Step 7: Rename the Jest contract description only**

In `src/__tests__/root-api.test.ts`, change:

```ts
describe('ua-info 2.0 package root', () => {
```

to:

```ts
describe('user-agent-info 2.0 package root', () => {
```

Do not change the test assertions or parser fixture.

- [ ] **Step 8: Run the focused Jest contract**

Run:

```bash
npm test -- --runInBand src/__tests__/root-api.test.ts
```

Expected: 2 tests PASS.

- [ ] **Step 9: Run the packed consumer gate**

Run:

```bash
npm run build && npm run consumer:check
```

Expected: ESM, CommonJS, server, browser, and removed `/v2` checks PASS using `user-agent-info`.

---

### Task 4: Rewrite README examples and add the migration guide

**Files:**
- Modify: `README.md`
- Create: `MIGRATION.md`
- Test: `scripts/verify-package-identity.mjs`
- Test: `scripts/verify-package.mjs`

**Interfaces:**
- Consumes: unchanged public APIs from the root, server, and browser entry points.
- Produces: documentation that uses only the canonical package identity, plus one isolated migration document containing the old identity.

- [ ] **Step 1: Replace the README title, badges, and opening**

Use this exact first section:

```md
# User Agent Info

[![npm version](https://img.shields.io/npm/v/user-agent-info.svg)](https://www.npmjs.com/package/user-agent-info)
[![CI](https://github.com/petechatchawan/user-agent-info/actions/workflows/ci.yml/badge.svg)](https://github.com/petechatchawan/user-agent-info/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/user-agent-info.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-blue.svg)](https://www.typescriptlang.org/)

A zero-dependency TypeScript User-Agent parser for browsers, devices, operating systems, bots, WebViews, in-app browsers, and User-Agent Client Hints.

```ts
import { parse } from 'user-agent-info';

const details = parse(navigator.userAgent);

console.log(details.browser?.name);
console.log(details.os?.name);
console.log(details.device.type);
```
```

Rename `## Why ua-info?` to `## Why User Agent Info?` and keep the factual capability bullets without adding new marketing claims.

- [ ] **Step 2: Replace every install command**

The installation section must contain exactly:

```md
```bash
npm install user-agent-info
```

```bash
pnpm add user-agent-info
```

```bash
yarn add user-agent-info
```
```

- [ ] **Step 3: Simplify the quick-start example**

Replace the multi-condition policy example with:

```ts
import { BrowserId, parse } from 'user-agent-info';

const details = parse(navigator.userAgent);

if (details.browser?.id === BrowserId.Chrome) {
  console.log(details.browser.version?.raw);
}
```

Keep version comparison in the dedicated Version utilities section instead of combining unrelated concerns in the first example.

- [ ] **Step 4: Update the CommonJS example**

Use:

```js
const { parse } = require('user-agent-info');

const details = parse(userAgent);
console.log(details.browser?.name);
```

- [ ] **Step 5: Replace every public entry-point reference**

The entry-point table and examples must use only:

```text
user-agent-info
user-agent-info/server
user-agent-info/browser
```

No `ua-info` module specifier may remain in README.

- [ ] **Step 6: Make the device example ordinary application code**

Replace the commented switch with:

```ts
const details = parse(userAgent);

const isTouchDevice =
  details.device.type === 'mobile' ||
  details.device.type === 'tablet';
```

Follow with prose listing the remaining device types. Do not introduce a fictional product policy.

- [ ] **Step 7: Keep LINE/LIFF detection direct**

Use:

```ts
const details = parse(navigator.userAgent);

const isLine = details.context?.host?.id === 'line';
const isLiff = details.context?.id === 'liff';
```

Follow with one sentence explaining that LINE stays in `context.host` while the underlying browser stays in `browser`.

- [ ] **Step 8: Use natural server examples**

Fetch-style example:

```ts
import { parseRequest } from 'user-agent-info/server';

export function getClientDetails(request: Request) {
  const details = parseRequest({ headers: request.headers });

  return {
    browser: details.browser?.name,
    os: details.os?.name,
    device: details.device.type,
  };
}
```

Express-style example:

```ts
import { parseRequest } from 'user-agent-info/server';

app.get('/client-details', (req, res) => {
  res.json(parseRequest({ headers: req.headers }));
});
```

- [ ] **Step 9: Simplify the Angular example**

Use a small service that exposes one method and no artificial mutable cache:

```ts
import { Injectable } from '@angular/core';
import { detectCurrent } from 'user-agent-info/browser';

@Injectable({ providedIn: 'root' })
export class UserAgentService {
  detect() {
    return detectCurrent();
  }
}
```

Add prose that SSR code should use `parse()` or `parseRequest()` instead of calling `detectCurrent()`.

- [ ] **Step 10: Update constants, API reference, package compatibility, and contributing imports**

Every remaining import in README must use `user-agent-info`, `user-agent-info/server`, or `user-agent-info/browser`. Update the clone instructions to:

```bash
git clone https://github.com/petechatchawan/user-agent-info.git
cd user-agent-info
npm install
npm run check
```

- [ ] **Step 11: Replace the old 1.x migration section with a package-move link**

Use:

```md
## Migrating from the previous package name

The API is unchanged. See [MIGRATION.md](MIGRATION.md) for dependency and import replacements.
```

Do not include old module specifiers in README; keep them isolated in `MIGRATION.md`.

- [ ] **Step 12: Create the complete migration document**

Create `MIGRATION.md`:

```md
# Migrating from `ua-info` to `user-agent-info`

`user-agent-info@2.0.1` is the same version 2 API published under a clearer package name. Parser behavior, result types, and public entry points are unchanged.

## Replace the dependency

```bash
npm uninstall ua-info
npm install user-agent-info@2.0.1
```

For pnpm:

```bash
pnpm remove ua-info
pnpm add user-agent-info@2.0.1
```

For Yarn:

```bash
yarn remove ua-info
yarn add user-agent-info@2.0.1
```

## Replace module specifiers

Before:

```ts
import { parse } from 'ua-info';
import { parseRequest } from 'ua-info/server';
import { detectCurrent } from 'ua-info/browser';
```

After:

```ts
import { parse } from 'user-agent-info';
import { parseRequest } from 'user-agent-info/server';
import { detectCurrent } from 'user-agent-info/browser';
```

CommonJS follows the same change:

```js
const { parse } = require('user-agent-info');
```

## What does not change

- `parse(userAgent)`
- `parseRequest({ headers })`
- `detectCurrent(options?)`
- `UAResult` and exported TypeScript types
- Browser, engine, OS, device, CPU, client, and context semantics
- ESM and CommonJS support
- The absence of the removed `UAInfo` class and `/v2` subpaths

## Old package status

Every published `ua-info` version is deprecated and receives no further releases. Existing lockfiles remain installable, but new work should depend on `user-agent-info`.
```

- [ ] **Step 13: Run the identity verifier**

Run:

```bash
npm run identity:check
```

Expected: README has no forbidden stale module/install/repository references; `MIGRATION.md` is the only user-facing file allowed to contain old module specifiers.

---

### Task 5: Update the frozen v2 package contract documentation

**Files:**
- Modify: `docs/v2-design.md`
- Test: `scripts/verify-package-identity.mjs`

**Interfaces:**
- Consumes: the implemented v2 API contract.
- Produces: architecture documentation that names `user-agent-info` as canonical without changing model semantics.

- [ ] **Step 1: Rename the document heading and product references**

Use:

```md
# user-agent-info 2.0 design
```

Change the product-scope sentence to:

```md
`user-agent-info` is a general-purpose User-Agent and Client Hints parser. The canonical result contains browser, rendering engine, operating system, device, CPU, non-browser client, and execution-context dimensions.
```

- [ ] **Step 2: Update the entry-point table**

Use:

```md
| API | Import | Inputs | Runtime-only context such as PWA |
| --- | --- | --- | --- |
| `parse(ua)` | `user-agent-info` | User-Agent string only | No |
| `parseRequest({ headers })` | `user-agent-info/server` | User-Agent plus request Client Hints | Partial |
| `detectCurrent()` | `user-agent-info/browser` | User-Agent, browser Client Hints, and runtime signals | Yes |
```

- [ ] **Step 3: Update the package-contract examples**

Use:

```ts
import { parse, satisfiesVersion } from 'user-agent-info';
import { parseRequest } from 'user-agent-info/server';
import { detectCurrent } from 'user-agent-info/browser';
```

State that the package does not export `UAInfo`, `user-agent-info/v2`, `user-agent-info/v2/server`, or `user-agent-info/v2/browser`.

- [ ] **Step 4: Run the identity verifier**

Run:

```bash
npm run identity:check
```

Expected: PASS.

- [ ] **Step 5: Commit source, consumers, and documentation together**

Run:

```bash
git add package.json README.md MIGRATION.md docs/v2-design.md scripts/verify-package-identity.mjs scripts/verify-package.mjs scripts/verify-consumers.mjs src/__tests__/root-api.test.ts
git commit -m "refactor: rename package to user-agent-info"
```

Expected: commit succeeds only after `npm run identity:check` passes.

---

### Task 6: Guard the release workflow during repository cutover

**Files:**
- Modify: `.github/workflows/publish.yml`
- Test: `.github/workflows/publish.yml`

**Interfaces:**
- Consumes: `github.repository`, `package.json` name/version, validation result, npm registry state.
- Produces: a successful no-publish run on `petechatchawan/ua-info` and the existing idempotent publish flow on `petechatchawan/user-agent-info`.

- [ ] **Step 1: Add a release-context job before the publish job**

Add:

```yaml
  release-context:
    runs-on: ubuntu-latest
    outputs:
      can-publish: ${{ steps.context.outputs.can-publish }}
    steps:
      - uses: actions/checkout@v6

      - name: Check canonical release identity
        id: context
        shell: bash
        run: |
          package_name=$(node -p "require('./package.json').name")
          expected_repository="petechatchawan/user-agent-info"

          if [ "$package_name" != "user-agent-info" ]; then
            echo "Unexpected package name: $package_name" >&2
            exit 1
          fi

          if [ "${GITHUB_REPOSITORY}" = "$expected_repository" ]; then
            echo "can-publish=true" >> "$GITHUB_OUTPUT"
          else
            echo "can-publish=false" >> "$GITHUB_OUTPUT"
            {
              echo "### npm publication paused"
              echo "Package: user-agent-info@2.0.1"
              echo "Current repository: ${GITHUB_REPOSITORY}"
              echo "Expected repository: ${expected_repository}"
              echo "Rename the repository before bootstrap publication."
            } >> "$GITHUB_STEP_SUMMARY"
          fi
```

- [ ] **Step 2: Make the publish job depend on the guard**

Change the job header to:

```yaml
  publish:
    needs: release-context
    if: needs.release-context.outputs.can-publish == 'true'
    runs-on: ubuntu-latest
```

Keep all existing publish-job permissions, validation, registry checks, provenance, reporting, and failure logic unchanged.

- [ ] **Step 3: Keep the workflow trigger unchanged**

Retain:

```yaml
on:
  push:
    branches: [master]
    paths:
      - package.json
      - .github/workflows/publish.yml
  workflow_dispatch:
```

This ensures the migration merge runs the guard but cannot publish from the old repository identity.

- [ ] **Step 4: Validate YAML structure locally**

Run:

```bash
node -e "const fs=require('node:fs'); const text=fs.readFileSync('.github/workflows/publish.yml','utf8'); if(!text.includes('needs: release-context') || !text.includes('petechatchawan/user-agent-info')) process.exit(1)"
```

Expected: PASS with exit code 0.

- [ ] **Step 5: Commit the workflow guard**

Run:

```bash
git add .github/workflows/publish.yml
git commit -m "ci: guard user-agent-info repository cutover"
```

---

### Task 7: Run the complete source and tarball validation matrix

**Files:**
- Read: all changed files
- Test: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: the fully migrated source tree.
- Produces: evidence that identity changed while API and runtime behavior did not.

- [ ] **Step 1: Run the complete local gate**

Run:

```bash
npm run check
```

Expected:

```text
identity:check  PASS
lint            PASS
Jest            PASS
ESM build       PASS
CommonJS build  PASS
package check   PASS
consumer check  PASS
```

- [ ] **Step 2: Inspect the dry-run tarball metadata**

Run:

```bash
npm pack --dry-run --json --ignore-scripts > /tmp/user-agent-info-pack.json
node -e "const [p]=require('/tmp/user-agent-info-pack.json'); if(p.name!=='user-agent-info'||p.version!=='2.0.1') throw new Error(`${p.name}@${p.version}`); console.log(`${p.name}@${p.version}`)"
```

Expected:

```text
user-agent-info@2.0.1
```

- [ ] **Step 3: Confirm packed documentation**

Run:

```bash
node -e "const [p]=require('/tmp/user-agent-info-pack.json'); const files=new Set(p.files.map(x=>x.path)); for(const f of ['README.md','MIGRATION.md','LICENSE']) if(!files.has(f)) throw new Error(`missing ${f}`); console.log('documentation present')"
```

Expected:

```text
documentation present
```

- [ ] **Step 4: Scan for forbidden stale references**

Run:

```bash
npm run identity:check
```

Expected: PASS.

- [ ] **Step 5: Confirm the approved design document remains unchanged**

Run:

```bash
git diff master...HEAD -- docs/superpowers/specs/2026-07-22-user-agent-info-package-migration-design.md
```

Expected: no diff. The design specification is an intentional historical migration record.

- [ ] **Step 6: Check whitespace integrity**

Run:

```bash
git diff --check
```

Expected: no output.

- [ ] **Step 7: Push and open the implementation PR**

Use title:

```text
refactor: rename package to user-agent-info
```

PR body must include:

```md
## Summary

Renames the active package identity from `ua-info` to `user-agent-info` without changing the v2 API or parser behavior.

## Cutover safety

- package version remains `2.0.1`
- publish job is paused until the repository is `petechatchawan/user-agent-info`
- packed ESM, CommonJS, server, and browser consumers use the new name
- old package deprecation is deferred until registry verification succeeds

## Validation

- `npm run check`
- Node.js 18/20/22 GitHub Actions matrix
- packed identity: `user-agent-info@2.0.1`
- README, MIGRATION, and LICENSE present in tarball
- repository-wide stale identity scan
```

- [ ] **Step 8: Wait for all CI matrix jobs**

Expected: Node.js 18, 20, and 22 jobs each pass install, lint, tests, ESM build, CommonJS build, package verification, and consumer verification.

- [ ] **Step 9: Review changed-file scope**

Expected changed files only:

```text
.github/workflows/publish.yml
MIGRATION.md
README.md
docs/v2-design.md
package.json
scripts/verify-consumers.mjs
scripts/verify-package-identity.mjs
scripts/verify-package.mjs
src/__tests__/root-api.test.ts
```

The implementation plan itself may be in a prior docs-only PR and is not required in the migration diff.

- [ ] **Step 10: Squash-merge only after every check passes**

Use commit title:

```text
refactor: rename package to user-agent-info
```

Record the exact merge commit SHA; every operational cutover command below must use that commit.

---

### Task 8: Rename the GitHub repository and verify redirects

**Files:**
- External: GitHub repository settings
- Read: `package.json`
- Read: `.github/workflows/publish.yml`

**Interfaces:**
- Consumes: the merged source migration commit.
- Produces: canonical repository `petechatchawan/user-agent-info`; old GitHub URL redirects; package metadata repository URL exists.

- [ ] **Step 1: Confirm master contains the exact migration commit**

Run:

```bash
git fetch origin master
git rev-parse origin/master
```

Expected: exact merge SHA recorded in Task 7.

- [ ] **Step 2: Rename the repository**

Run with GitHub CLI while authenticated as the repository owner:

```bash
gh repo rename user-agent-info --repo petechatchawan/ua-info --yes
```

Expected: repository becomes `petechatchawan/user-agent-info`.

- [ ] **Step 3: Update the local remote**

Run:

```bash
git remote set-url origin https://github.com/petechatchawan/user-agent-info.git
git remote -v
```

Expected: fetch and push URLs both use `petechatchawan/user-agent-info`.

- [ ] **Step 4: Verify the new repository URL**

Run:

```bash
gh repo view petechatchawan/user-agent-info --json nameWithOwner,url,defaultBranchRef
```

Expected: `nameWithOwner` is `petechatchawan/user-agent-info` and default branch is `master`.

- [ ] **Step 5: Verify the old URL redirects**

Run:

```bash
curl -I https://github.com/petechatchawan/ua-info
```

Expected: redirect response leading to `https://github.com/petechatchawan/user-agent-info`.

- [ ] **Step 6: Set the repository description and topics**

Run:

```bash
gh repo edit petechatchawan/user-agent-info \
  --description "TypeScript User-Agent parser with Client Hints, browser and device detection, bots, WebViews, and in-app context support" \
  --add-topic user-agent \
  --add-topic user-agent-parser \
  --add-topic typescript \
  --add-topic browser-detection \
  --add-topic device-detection \
  --add-topic client-hints \
  --add-topic bot-detection \
  --add-topic webview \
  --add-topic in-app-browser \
  --add-topic line-liff
```

Expected: repository About metadata reflects the canonical package identity.

---

### Task 9: Bootstrap-publish `user-agent-info@2.0.1`

**Files:**
- External: npm public registry
- Read: exact merged repository checkout

**Interfaces:**
- Consumes: canonical renamed repository at the exact validated merge commit.
- Produces: first immutable registry release `user-agent-info@2.0.1` with provenance/repository metadata.

- [ ] **Step 1: Create a clean release checkout**

Run:

```bash
release_dir=$(mktemp -d)
git clone https://github.com/petechatchawan/user-agent-info.git "$release_dir"
cd "$release_dir"
git checkout <EXACT_MERGE_SHA_FROM_TASK_7>
```

Replace `<EXACT_MERGE_SHA_FROM_TASK_7>` with the recorded 40-character SHA before running the command.

- [ ] **Step 2: Verify the release identity again**

Run:

```bash
node -e "const p=require('./package.json'); if(p.name!=='user-agent-info'||p.version!=='2.0.1') process.exit(1); console.log(`${p.name}@${p.version}`)"
```

Expected:

```text
user-agent-info@2.0.1
```

- [ ] **Step 3: Install dependencies and rerun the full gate**

Run:

```bash
npm install
npm run check
```

Expected: all gates PASS in the clean checkout.

- [ ] **Step 4: Confirm the target version still does not exist**

Run:

```bash
npm view user-agent-info@2.0.1 version
```

Expected: npm `E404`. If the version now exists, stop and investigate ownership and publication provenance before continuing.

- [ ] **Step 5: Confirm npm authentication**

Run:

```bash
npm whoami
```

Expected: the maintainer npm username authorized to publish the package.

- [ ] **Step 6: Perform the one-time bootstrap publish**

Run:

```bash
npm publish --access public --provenance
```

Expected: npm reports `+ user-agent-info@2.0.1`.

- [ ] **Step 7: Verify registry metadata with retry**

Run:

```bash
for attempt in $(seq 1 12); do
  npm view user-agent-info@2.0.1 name version repository.url dist.tarball --json && break
  sleep 5
done
```

Expected metadata includes:

```json
{
  "name": "user-agent-info",
  "version": "2.0.1",
  "repository.url": "git+https://github.com/petechatchawan/user-agent-info.git"
}
```

- [ ] **Step 8: Revoke temporary credentials when applicable**

If a granular access token was created for bootstrap, revoke it immediately after Task 10 confirms Trusted Publishing. Do not store the token in repository secrets as the permanent release path.

---

### Task 10: Verify the public registry package from clean consumers

**Files:**
- External: temporary clean npm consumer directories

**Interfaces:**
- Consumes: `user-agent-info@2.0.1` from the public npm registry, not a local tarball.
- Produces: independent proof that root, server, browser, ESM, CommonJS, and TypeScript resolution work after publication.

- [ ] **Step 1: Create a clean registry-consumer project**

Run:

```bash
consumer_dir=$(mktemp -d)
cd "$consumer_dir"
npm init -y >/dev/null
npm install --ignore-scripts --no-audit --no-fund user-agent-info@2.0.1
```

Expected: install succeeds without deprecation warning for `user-agent-info`.

- [ ] **Step 2: Verify ESM root and server imports**

Run:

```bash
node --input-type=module <<'EOF'
import assert from 'node:assert/strict';
import { BrowserId, parse } from 'user-agent-info';
import { parseRequest } from 'user-agent-info/server';

const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.109 Safari/537.36';
assert.equal(parse(ua).browser?.id, BrowserId.Chrome);
assert.equal(parseRequest({ headers: { 'user-agent': ua } }).os?.id, 'windows');
EOF
```

Expected: exit code 0.

- [ ] **Step 3: Verify CommonJS root and server imports**

Run:

```bash
node <<'EOF'
const assert = require('node:assert/strict');
const { BrowserId, parse } = require('user-agent-info');
const { parseRequest } = require('user-agent-info/server');

const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.109 Safari/537.36';
assert.equal(parse(ua).browser?.id, BrowserId.Chrome);
assert.equal(parseRequest({ headers: { 'user-agent': ua } }).os?.id, 'windows');
EOF
```

Expected: exit code 0.

- [ ] **Step 4: Verify the browser entry point with runtime stubs**

Run:

```bash
node --input-type=module <<'EOF'
import assert from 'node:assert/strict';
import { detectCurrent } from 'user-agent-info/browser';

const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.109 Safari/537.36';
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { userAgent: ua } });
Object.defineProperty(globalThis, 'matchMedia', { configurable: true, value: () => ({ matches: false }) });
assert.equal((await detectCurrent()).browser?.id, 'chrome');
EOF
```

Expected: exit code 0.

- [ ] **Step 5: Verify removed subpaths remain removed**

Run:

```bash
node -e "const assert=require('node:assert/strict'); assert.throws(()=>require('user-agent-info/v2'), /Package subpath|not defined|cannot find/i)"
```

Expected: exit code 0.

- [ ] **Step 6: Verify TypeScript declarations**

Run:

```bash
npm install --save-dev typescript@4.9.5 @types/node@18
cat > consumer.ts <<'EOF'
import { parse, type UAResult } from 'user-agent-info';
import { parseRequest } from 'user-agent-info/server';
import { detectCurrent } from 'user-agent-info/browser';

const result: UAResult = parse('');
void result;
void parseRequest({ headers: {} });
void detectCurrent;
EOF
npx tsc consumer.ts --noEmit --strict --moduleResolution node16 --module node16 --target es2020
```

Expected: TypeScript exits with code 0.

---

### Task 11: Configure Trusted Publishing and prove the idempotent workflow

**Files:**
- External: npm package Trusted Publisher settings
- External: GitHub Actions workflow dispatch

**Interfaces:**
- Consumes: published `user-agent-info@2.0.1`, renamed repository, and `.github/workflows/publish.yml`.
- Produces: OIDC-based future publishing with no permanent npm token dependency.

- [ ] **Step 1: Configure the npm Trusted Publisher**

Set these exact values in npm package settings:

```text
Provider: GitHub Actions
Organization or user: petechatchawan
Repository: user-agent-info
Workflow filename: publish.yml
Environment: blank
Allowed action: npm publish
```

- [ ] **Step 2: Confirm workflow permissions remain correct**

Verify `.github/workflows/publish.yml` contains:

```yaml
permissions:
  contents: read
  id-token: write
  issues: write
```

- [ ] **Step 3: Dispatch the publish workflow manually**

Run:

```bash
gh workflow run publish.yml --repo petechatchawan/user-agent-info
```

- [ ] **Step 4: Watch the workflow to completion**

Run:

```bash
gh run watch --repo petechatchawan/user-agent-info
```

Expected:

```text
Validate package       success
Check registry version success (exists=true)
Publish package        skipped
Verify npm registry    success
Publication report     success
Workflow conclusion    success
```

- [ ] **Step 5: Verify the release-report issue**

Run:

```bash
gh issue list --repo petechatchawan/user-agent-info --state all --search '"[release-report] user-agent-info@2.0.1" in:title'
```

Expected: one closed issue whose body reports validation success, registry status published, version existed before the run true, and publish step skipped.

- [ ] **Step 6: Remove fallback token dependence**

After OIDC verification succeeds, revoke any temporary npm token used for Task 9. `NPM_TOKEN` may remain unset; the workflow must still complete successfully for future releases through Trusted Publishing.

---

### Task 12: Deprecate `ua-info` and close the cutover

**Files:**
- External: npm package metadata for `ua-info`
- External: GitHub repository metadata

**Interfaces:**
- Consumes: all successful verification evidence from Tasks 9–11.
- Produces: one active package identity and a clear migration warning on every old version.

- [ ] **Step 1: Confirm the new package is still healthy immediately before deprecation**

Run:

```bash
npm view user-agent-info@2.0.1 name version repository.url --json
```

Expected: exact canonical name, version, and renamed repository URL.

- [ ] **Step 2: Deprecate every old package version**

Run:

```bash
npm deprecate 'ua-info@*' 'This package has moved to user-agent-info. Install user-agent-info instead.'
```

Expected: npm accepts the deprecation update.

- [ ] **Step 3: Verify the old package warning**

Run:

```bash
npm view ua-info deprecated version --json
```

Expected:

```json
{
  "deprecated": "This package has moved to user-agent-info. Install user-agent-info instead.",
  "version": "2.0.1"
}
```

- [ ] **Step 4: Verify installation emits the migration warning**

Run in a new temporary directory:

```bash
old_consumer=$(mktemp -d)
cd "$old_consumer"
npm init -y >/dev/null
npm install ua-info@2.0.1 2>&1 | tee install.log
grep -F 'This package has moved to user-agent-info. Install user-agent-info instead.' install.log
```

Expected: the exact deprecation warning is present.

- [ ] **Step 5: Verify the canonical package has no deprecation**

Run:

```bash
npm view user-agent-info@2.0.1 deprecated --json
```

Expected: no deprecation value.

- [ ] **Step 6: Record final cutover evidence**

Add a comment to the implementation PR or its release-report issue containing:

```md
## Cutover complete

- `user-agent-info@2.0.1` published and clean-install verified
- root/server/browser ESM and CommonJS entry points verified from npm
- TypeScript declarations verified
- Trusted Publishing verified through an idempotent workflow run
- every `ua-info` version deprecated with the migration message
- canonical repository: `petechatchawan/user-agent-info`
- no further `ua-info` releases will be published
```

- [ ] **Step 7: Final audit**

Run from the canonical repository:

```bash
npm run check
git status --short
git diff --check
```

Expected: all checks PASS, working tree clean, and no whitespace errors.

---

## Plan Self-Review

### Spec coverage

- Atomic package cutover: Tasks 2–12.
- Version continuity at `2.0.1`: Tasks 2, 7, 9, 10.
- Repository rename: Task 8.
- Publish guard before rename: Task 6.
- Bootstrap publication: Task 9.
- Registry consumer verification: Task 10.
- Trusted Publishing: Task 11.
- Permanent old-package deprecation: Task 12.
- No API/runtime change: Tasks 3, 7, and unchanged-file constraints.
- Natural documentation examples: Task 4.
- Stale identity enforcement: Task 2.
- Failure boundary: Tasks 1, 7, 9, 10, and 11 stop before deprecation on any failure.

### Type and naming consistency

- Canonical name is `user-agent-info` in every active file and command.
- Canonical version is `2.0.1` throughout.
- Canonical repository is `petechatchawan/user-agent-info` throughout.
- Old module specifiers are isolated to `MIGRATION.md` and the approved design specification.
- Public APIs remain `parse`, `parseRequest`, and `detectCurrent`.

### No-placeholder check

The only value supplied at execution time is the exact merge SHA in Task 9. Task 7 explicitly produces and records that value before Task 9 begins; it is not an unresolved design decision.
