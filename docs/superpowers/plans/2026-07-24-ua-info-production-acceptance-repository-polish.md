# UA Info Production Acceptance & Repository Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Point npm package homepage metadata to the deployed UA Info Playground and verify the package remains release-safe.

**Architecture:** This is a metadata-only patch. The package runtime, exports, version, publication configuration, and Playground implementation remain unchanged. Existing repository verification commands provide the acceptance gate.

**Tech Stack:** npm package metadata, JSON, GitHub Actions.

## Global Constraints

- Do not change package version `2.0.3`.
- Do not modify `src/**`.
- Do not modify package exports or `publishConfig`.
- Do not publish a new npm release for this patch.
- Production URL is exactly `https://petechatchawan.github.io/ua-info/`.

---

### Task 1: Update package homepage metadata

**Files:**
- Modify: `package.json:13`

**Interfaces:**
- Consumes: existing npm package metadata.
- Produces: npm `homepage` metadata pointing to the production Playground.

- [ ] **Step 1: Verify the current metadata is stale**

Run:

```bash
node -e "const p=require('./package.json'); if (p.homepage !== 'https://github.com/petechatchawan/ua-info#readme') process.exit(1)"
```

Expected: exit code `0` before the patch.

- [ ] **Step 2: Apply the minimal metadata change**

Replace:

```json
"homepage": "https://github.com/petechatchawan/ua-info#readme"
```

with:

```json
"homepage": "https://petechatchawan.github.io/ua-info/"
```

- [ ] **Step 3: Verify exact metadata and invariants**

Run:

```bash
node - <<'NODE'
const p = require('./package.json');
if (p.homepage !== 'https://petechatchawan.github.io/ua-info/') process.exit(1);
if (p.repository.url !== 'git+https://github.com/petechatchawan/ua-info.git') process.exit(1);
if (p.bugs.url !== 'https://github.com/petechatchawan/ua-info/issues') process.exit(1);
if (p.version !== '2.0.3') process.exit(1);
NODE
```

Expected: exit code `0`.

- [ ] **Step 4: Run repository verification**

Run:

```bash
npm install
npm run check
```

Expected: identity, lint, Jest, ESM/CommonJS build, package-content, and packed-consumer checks all pass.

- [ ] **Step 5: Commit**

```bash
git add package.json
git commit -m "docs: point package homepage to playground"
```

### Task 2: Deliver focused pull request

**Files:**
- Review: `package.json`
- Review: `docs/superpowers/specs/2026-07-24-ua-info-production-acceptance-repository-polish-design.md`
- Review: `docs/superpowers/plans/2026-07-24-ua-info-production-acceptance-repository-polish.md`

**Interfaces:**
- Consumes: verified branch from Task 1.
- Produces: reviewable PR targeting `master`.

- [ ] **Step 1: Audit scope**

Run:

```bash
git diff --check master...HEAD
git diff --name-only master...HEAD
```

Expected changed paths are only the package metadata and the two approved design/plan documents.

- [ ] **Step 2: Open the pull request**

Title:

```text
docs: point package homepage to playground
```

The PR body must record production acceptance, metadata invariants, and CI results.

- [ ] **Step 3: Merge only after CI passes**

Use squash merge and lock the expected PR head SHA.