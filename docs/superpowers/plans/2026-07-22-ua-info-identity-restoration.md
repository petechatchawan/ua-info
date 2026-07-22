# UA Info Identity Restoration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore `ua-info` as the permanent package identity, release the unchanged 2.x API as `ua-info@2.0.2`, and retire the failed `user-agent-info` migration without modifying parser behavior.

**Architecture:** Treat the work as an identity-only source migration followed by an operational repository cutover. Source changes update metadata, docs, verification, consumer fixtures, and release automation while a repository guard prevents publication until GitHub is renamed back to `petechatchawan/ua-info`. Runtime implementation under `src/v2/**` remains untouched.

**Tech Stack:** TypeScript 4.9, Node.js 18/20/22, npm 11, Jest, ESLint, native ESM/CommonJS package exports, GitHub Actions, npm public registry.

## Global Constraints

- Canonical package identity is exactly `ua-info`.
- Canonical display name is `UA Info`; expanded meaning is `User-Agent Information`.
- Next release is exactly `2.0.2`; never reuse `2.0.1`.
- Canonical repository after cutover is exactly `petechatchawan/ua-info`.
- Keep `parse`, `parseRequest`, `detectCurrent`, all exported types, result semantics, ESM, CommonJS, and TypeScript declarations unchanged.
- Keep only `.`, `./server`, `./browser`, and `./package.json` public exports.
- Do not restore the v1 `UAInfo` class or `/v2` public subpaths.
- Do not modify parser implementation files under `src/v2/**`.
- Keep Node.js `>=18` and CI on Node.js 18, 20, and 22.
- Do not add a committed `package-lock.json`.
- Do not publish while the repository is still named `petechatchawan/user-agent-info`.
- Do not deprecate or unpublish `ua-info`.
- Delete the temporary GitHub `NPM_TOKEN` and revoke its npm token after Trusted Publishing is confirmed.

---

## File map

### Create

- `docs/superpowers/specs/2026-07-22-ua-info-identity-restoration-design.md` — approved canonical identity decision.
- `docs/superpowers/plans/2026-07-22-ua-info-identity-restoration.md` — this plan.

### Modify

- `package.json` — restore package identity, set version `2.0.2`, restore repository metadata, remove `MIGRATION.md` from packed files.
- `README.md` — restore `ua-info` branding, badges, installation, imports, and explain “User-Agent Information.”
- `docs/v2-design.md` — restore canonical package imports and package contract.
- `scripts/verify-package-identity.mjs` — enforce `ua-info@2.0.2`, canonical repository metadata, active-reference hygiene, and publish guard.
- `scripts/verify-package.mjs` — enforce packed identity and README/LICENSE-only documentation requirement.
- `scripts/verify-consumers.mjs` — install and exercise the tarball as `ua-info`.
- `src/__tests__/root-api.test.ts` — restore package-root contract title to `ua-info`.
- `.github/workflows/publish.yml` — restore `ua-info` release identity and guard publication until repository rename.
- `docs/superpowers/specs/2026-07-22-user-agent-info-package-migration-design.md` — add supersession notice.
- `docs/superpowers/plans/2026-07-22-user-agent-info-package-migration.md` — add supersession notice.

### Delete

- `MIGRATION.md` — obsolete instructions directing consumers away from the canonical package.

### Intentionally unchanged

- `src/v2/**`
- `src/index.ts`
- `src/v2/server.ts`
- `src/v2/browser.ts`
- `.github/workflows/ci.yml`
- `LICENSE`

---

### Task 1: Establish the failing identity contract

**Files:**
- Modify: `scripts/verify-package-identity.mjs`
- Test: `npm run identity:check`

**Interfaces:**
- Consumes: `package.json`, active repository text files, `.github/workflows/publish.yml`.
- Produces: a failing identity gate that describes the exact `ua-info@2.0.2` target before source metadata is migrated.

- [ ] **Step 1: Replace expected identity values**

Set the verifier contract to:

```js
const expected = Object.freeze({
  name: 'ua-info',
  version: '2.0.2',
  repository: 'git+https://github.com/petechatchawan/ua-info.git',
  homepage: 'https://github.com/petechatchawan/ua-info#readme',
  bugs: 'https://github.com/petechatchawan/ua-info/issues',
});
```

Require packed files `dist`, `README.md`, and `LICENSE`; reject `MIGRATION.md` if present.

Require publish workflow fragments:

```text
id-token: write
expected_repository="petechatchawan/ua-info"
needs: release-context
if: needs.release-context.outputs.can-publish == 'true'
```

Allow `user-agent-info` references only in these historical records:

```text
docs/superpowers/specs/2026-07-22-user-agent-info-package-migration-design.md
docs/superpowers/plans/2026-07-22-user-agent-info-package-migration.md
docs/superpowers/specs/2026-07-22-ua-info-identity-restoration-design.md
docs/superpowers/plans/2026-07-22-ua-info-identity-restoration.md
```

Reject active imports, install commands, npm links, badges, and GitHub links using `user-agent-info`.

- [ ] **Step 2: Run the verifier and prove RED**

Run:

```bash
npm run identity:check
```

Expected: FAIL with old name `user-agent-info`, version `2.0.1`, old repository URLs, `MIGRATION.md`, and stale active references.

- [ ] **Step 3: Commit the failing contract**

```bash
git add scripts/verify-package-identity.mjs
git commit -m "test: define ua-info restoration identity"
```

---

### Task 2: Restore package metadata and packed-package verification

**Files:**
- Modify: `package.json`
- Modify: `scripts/verify-package.mjs`
- Modify: `src/__tests__/root-api.test.ts`
- Test: `npm run identity:check`, `npm test -- src/__tests__/root-api.test.ts`, `npm run pack:check`

**Interfaces:**
- Consumes: Task 1 identity contract.
- Produces: source and tarball identity exactly `ua-info@2.0.2` with the existing 2.x export map.

- [ ] **Step 1: Restore `package.json` identity**

Set:

```json
{
  "name": "ua-info",
  "version": "2.0.2",
  "description": "TypeScript User-Agent information parser with Client Hints, browser and device detection, bots, WebViews, and in-app context support",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/petechatchawan/ua-info.git"
  },
  "homepage": "https://github.com/petechatchawan/ua-info#readme",
  "bugs": {
    "url": "https://github.com/petechatchawan/ua-info/issues"
  },
  "files": ["dist", "README.md", "LICENSE"]
}
```

Keep engines, exports, scripts, dependencies, side effects, and `publishConfig` unchanged.

- [ ] **Step 2: Restore packed identity assertions**

In `scripts/verify-package.mjs`, require `ua-info@2.0.2`, keep the 2.x export checks, require only `README.md` and `LICENSE`, and report:

```text
Package contents verified: <N> files, ua-info@2.0.2, 2.x exports only, README/LICENSE present, no tests or v1 artifacts.
```

- [ ] **Step 3: Restore root contract title**

Change only the Jest description to:

```ts
describe('ua-info 2.0 package root', () => {
```

Do not alter assertions.

- [ ] **Step 4: Run targeted checks**

```bash
npm test -- src/__tests__/root-api.test.ts
npm run pack:check
```

Expected: root tests pass; pack check still fails only for active documentation/consumer references not yet migrated.

- [ ] **Step 5: Commit**

```bash
git add package.json scripts/verify-package.mjs src/__tests__/root-api.test.ts
git commit -m "chore: restore ua-info package metadata"
```

---

### Task 3: Restore consumers and active documentation

**Files:**
- Modify: `scripts/verify-consumers.mjs`
- Modify: `README.md`
- Modify: `docs/v2-design.md`
- Delete: `MIGRATION.md`
- Test: `npm run identity:check`, `npm run consumer:check`, `npm run pack:check`

**Interfaces:**
- Consumes: `ua-info@2.0.2` package metadata and unchanged export map.
- Produces: canonical consumer examples and packed-install verification for root, server, browser, ESM, CommonJS, and removed `/v2` behavior.

- [ ] **Step 1: Restore packed consumer names**

Update `scripts/verify-consumers.mjs` so the temporary directory prefix, pack identity, ESM imports, CommonJS requires, `/v2` rejection check, and success message use `ua-info` and version `2.0.2`.

- [ ] **Step 2: Restore README branding and imports**

Set the top section to:

```md
# UA Info

[![npm version](https://img.shields.io/npm/v/ua-info.svg)](https://www.npmjs.com/package/ua-info)
[![CI](https://github.com/petechatchawan/ua-info/actions/workflows/ci.yml/badge.svg)](https://github.com/petechatchawan/ua-info/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/ua-info.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-blue.svg)](https://www.typescriptlang.org/)

**UA Info** stands for **User-Agent Information**.

A zero-dependency TypeScript User-Agent information parser for browsers, devices, operating systems, bots, WebViews, in-app browsers, and User-Agent Client Hints.
```

Replace every active package import/install/link from `user-agent-info` to `ua-info`. Keep examples natural and preserve current API explanations.

- [ ] **Step 3: Restore design-document package names**

In `docs/v2-design.md`, change the title, product scope, import table, examples, and removed-subpath statement to `ua-info`.

- [ ] **Step 4: Delete obsolete migration guide**

Delete `MIGRATION.md` completely.

- [ ] **Step 5: Run identity and consumer verification**

```bash
npm run identity:check
npm run consumer:check
npm run pack:check
```

Expected: failures, if any, are restricted to historical migration documents and publish workflow.

- [ ] **Step 6: Commit**

```bash
git add README.md docs/v2-design.md scripts/verify-consumers.mjs package.json scripts/verify-package.mjs
git rm MIGRATION.md
git commit -m "docs: restore ua-info public identity"
```

---

### Task 4: Supersede the failed migration and restore release automation

**Files:**
- Modify: `docs/superpowers/specs/2026-07-22-user-agent-info-package-migration-design.md`
- Modify: `docs/superpowers/plans/2026-07-22-user-agent-info-package-migration.md`
- Modify: `.github/workflows/publish.yml`
- Test: `npm run identity:check`

**Interfaces:**
- Consumes: canonical `ua-info@2.0.2` source identity.
- Produces: an auditable historical record and a publish workflow that remains blocked until repository rename.

- [ ] **Step 1: Add supersession notices**

Insert immediately after each historical document title:

```md
> **Status: SUPERSEDED**  
> **Reason:** npm rejected the unscoped `user-agent-info` package name as too similar to an existing package.  
> **Canonical package identity:** `ua-info`
```

Do not rewrite historical task content.

- [ ] **Step 2: Restore publish identity guard**

Update `.github/workflows/publish.yml` so:

```bash
package_name=$(node -p "require('./package.json').name")
expected_repository="petechatchawan/ua-info"
```

The package-name check expects `ua-info`. Remove bootstrap-specific wording and report values dynamically from `package.json`. Retain OIDC permission, validation, registry existence check, provenance publication, registry verification, release-report issue, and failure-on-incomplete behavior.

- [ ] **Step 3: Run final source identity check**

```bash
npm run identity:check
```

Expected: PASS with `Package identity verified: ua-info@2.0.2 and canonical repository metadata.`

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/publish.yml docs/superpowers/specs/2026-07-22-user-agent-info-package-migration-design.md docs/superpowers/plans/2026-07-22-user-agent-info-package-migration.md
git commit -m "ci: restore ua-info release identity"
```

---

### Task 5: Full validation and pull request

**Files:**
- Verify: all changed files
- PR: `agent/ua-info-identity-restoration` → `master`

**Interfaces:**
- Consumes: completed source migration.
- Produces: reviewable PR with exact validation evidence and a blocked publish boundary.

- [ ] **Step 1: Run the full package gate**

```bash
npm run check
```

Expected:

- identity verification passes;
- lint passes;
- 5 suites and 43 tests pass;
- ESM and CommonJS builds pass;
- package-content verification passes;
- packed ESM/CommonJS consumers pass.

- [ ] **Step 2: Confirm parser source is unchanged**

```bash
git diff --name-only 43afc5a0108d27016b071d22d2a1b1283037b163...HEAD -- src/v2 src/index.ts
```

Expected: no output.

- [ ] **Step 3: Open a draft PR**

PR title:

```text
refactor: restore ua-info package identity
```

The PR body must list the locked identity, unchanged runtime contract, affected files, local verification, and the operational rule that publishing remains blocked until the repository is renamed to `petechatchawan/ua-info`.

- [ ] **Step 4: Verify GitHub Actions**

Expected:

- CI Node.js 18 passes;
- CI Node.js 20 passes;
- CI Node.js 22 passes;
- publish `release-context` succeeds;
- publish job is skipped because the repository is still `petechatchawan/user-agent-info`.

- [ ] **Step 5: Review changed-file scope**

Expected changed files are limited to the design/plan records, package metadata, active documentation, verification scripts, root contract title, obsolete migration deletion, and publish workflow. No parser implementation file may appear.

---

### Task 6: Operational cutover after merge

**Files:**
- GitHub repository settings
- npm Trusted Publishing settings
- npm registry

**Interfaces:**
- Consumes: merged `ua-info@2.0.2` source with publish guard.
- Produces: canonical repository name and verified npm release.

- [ ] **Step 1: Merge only after all PR gates pass**

Use squash merge and record the merge SHA.

- [ ] **Step 2: Rename the GitHub repository**

Rename `petechatchawan/user-agent-info` to `petechatchawan/ua-info`. Verify stable repository ID `919348427` resolves to the new full name.

- [ ] **Step 3: Verify npm pre-release state**

```bash
npm view ua-info name version deprecated dist-tags --json
npm view ua-info@2.0.2 version --json
```

Expected: current latest is `2.0.1`; `2.0.2` is absent; active package is not deprecated.

- [ ] **Step 4: Configure Trusted Publishing**

Use:

```text
Provider: GitHub Actions
Owner: petechatchawan
Repository: ua-info
Workflow: publish.yml
Environment: blank
```

- [ ] **Step 5: Run the publish workflow**

Expected: validation passes, `ua-info@2.0.2` publishes with provenance, registry verification passes, and the release-report issue closes.

- [ ] **Step 6: Verify live consumers**

Install from the registry in clean ESM, CommonJS, and TypeScript workspaces and exercise:

```text
ua-info
ua-info/server
ua-info/browser
```

Verify `ua-info/v2` fails to resolve.

- [ ] **Step 7: Remove temporary credentials**

Delete the GitHub Actions secret `NPM_TOKEN` and revoke the corresponding npm granular token. Re-run the workflow; it must detect that `2.0.2` exists, skip publication, and pass registry verification through OIDC-capable workflow context.

- [ ] **Step 8: Close obsolete release report**

Close `[release-report] user-agent-info@2.0.1` as `not planned` and link the restored `ua-info@2.0.2` release evidence.
