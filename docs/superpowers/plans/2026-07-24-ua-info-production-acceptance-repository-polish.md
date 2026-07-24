# UA Info Production Acceptance & Repository Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Point npm package homepage metadata to the deployed UA Info Playground and keep the canonical identity verifier aligned.

**Architecture:** This is a metadata and verification-guard patch. Runtime source, package exports, version, publish configuration, and Playground implementation remain unchanged.

**Tech Stack:** npm package metadata, Node.js verification script, GitHub Actions.

## Global Constraints

- Keep package version `2.0.3`.
- Do not modify `src/**`, exports, or `publishConfig`.
- Do not publish a new npm release for this patch.
- Use `https://petechatchawan.github.io/ua-info/` exactly.

---

### Task 1: Update homepage and identity guard

**Files:**
- Modify: `package.json:13`
- Modify: `scripts/verify-package-identity.mjs:14`

**Interfaces:**
- Consumes: existing package metadata and canonical identity expectations.
- Produces: matching production Playground homepage values.

- [ ] **Step 1: Verify the old state**

```bash
node -e "const p=require('./package.json'); if (p.homepage !== 'https://github.com/petechatchawan/ua-info#readme') process.exit(1)"
```

Expected: exit `0` before the patch.

- [ ] **Step 2: Change `package.json`**

```json
"homepage": "https://petechatchawan.github.io/ua-info/"
```

- [ ] **Step 3: Verify the RED identity gate**

```bash
npm run identity:check
```

Expected before updating the verifier: FAIL because the new homepage is not yet canonical.

- [ ] **Step 4: Align the identity verifier**

```js
homepage: 'https://petechatchawan.github.io/ua-info/',
```

- [ ] **Step 5: Verify metadata invariants**

```bash
node - <<'NODE'
const p = require('./package.json');
if (p.homepage !== 'https://petechatchawan.github.io/ua-info/') process.exit(1);
if (p.repository.url !== 'git+https://github.com/petechatchawan/ua-info.git') process.exit(1);
if (p.bugs.url !== 'https://github.com/petechatchawan/ua-info/issues') process.exit(1);
if (p.version !== '2.0.3') process.exit(1);
NODE
npm run identity:check
```

Expected: both commands pass.

- [ ] **Step 6: Run full verification**

```bash
npm install
npm run check
```

Expected: identity, lint, Jest, ESM/CommonJS build, package-content, and packed-consumer checks pass.

### Task 2: Deliver focused pull request

**Files:**
- Review: `package.json`
- Review: `scripts/verify-package-identity.mjs`
- Review: `docs/superpowers/specs/2026-07-24-ua-info-production-acceptance-repository-polish-design.md`
- Review: `docs/superpowers/plans/2026-07-24-ua-info-production-acceptance-repository-polish.md`

- [ ] **Step 1: Audit scope**

```bash
git diff --check master...HEAD
git diff --name-only master...HEAD
```

Expected: only the two metadata/verification files and two design/plan documents.

- [ ] **Step 2: Open PR**

Title: `docs: point package homepage to playground`

Record production acceptance, metadata invariants, RED identity evidence, and final CI results.

- [ ] **Step 3: Merge after CI passes**

Use squash merge with the expected head SHA.