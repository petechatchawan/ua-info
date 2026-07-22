# User Agent Info Package Migration Design

**Status:** Approved for implementation planning  
**Date:** 2026-07-22  
**Current package:** `ua-info@2.0.1`  
**Canonical package after migration:** `user-agent-info@2.0.1`

## 1. Decision

The project will move from `ua-info` to `user-agent-info` as an atomic product-name cutover.

After the cutover:

- `user-agent-info` is the only active npm package.
- `petechatchawan/user-agent-info` is the canonical GitHub repository.
- `ua-info` is deprecated across every published version.
- No new `ua-info` release is published after `2.0.1`.
- The parser API, result types, runtime behavior, and entry-point structure remain unchanged.

The migration is a package rename, not an API redesign.

## 2. Goals

1. Make the package domain clear from its npm name, install command, imports, repository URL, and search results.
2. Preserve version continuity by publishing the new package first as `user-agent-info@2.0.1`.
3. Keep migration work for existing users limited to changing the dependency and import path.
4. Avoid maintaining two active package identities.
5. Keep npm publishing secure with Trusted Publishing after the new package has been created.
6. Rewrite documentation examples so they read like normal application code rather than generated demonstrations.

## 3. Non-goals

This migration does not:

- change `parse`, `parseRequest`, or `detectCurrent`;
- change the `UAResult` shape;
- add compatibility exports for the old package name;
- publish a forwarding wrapper under `ua-info`;
- introduce a new major version;
- modify browser, operating-system, device, client, or context detection rules;
- create a second long-lived release workflow.

## 4. Canonical identity

| Field | Value |
| --- | --- |
| npm package | `user-agent-info` |
| first version | `2.0.1` |
| display name | User Agent Info |
| repository | `petechatchawan/user-agent-info` |
| root import | `user-agent-info` |
| server import | `user-agent-info/server` |
| browser import | `user-agent-info/browser` |
| old package | `ua-info` |
| old-package policy | Deprecated permanently |

The repository and package descriptions should begin with the direct phrase “TypeScript User-Agent parser” and then list the most relevant capabilities without keyword stuffing.

Recommended short description:

> TypeScript User-Agent parser with Client Hints, browser and device detection, bots, WebViews, and in-app context support.

## 5. Public API contract

Only module specifiers change.

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

All exported functions, constants, interfaces, result semantics, ESM support, CommonJS support, and TypeScript declarations stay equivalent to `ua-info@2.0.1`.

## 6. Repository changes

The implementation must update every current product-identity reference, including:

- `package.json` name, repository, homepage, bugs URL, description, and keywords;
- `package-lock.json` package name and root metadata;
- README heading, badges, install commands, imports, links, migration notes, and package-language references;
- files under `docs/`;
- package consumer fixtures and generated temporary consumer manifests;
- package-verification scripts;
- release workflow summaries, registry checks, issue titles, and migration guidance;
- source comments or tests that refer to the npm package identity;
- GitHub repository name, description, and topics.

The implementation must retain intentional references to `ua-info` only where the text explains migration or deprecation.

## 7. Documentation voice

Examples should resemble code a developer would actually keep in an application.

### Preferred

```ts
import { parse } from 'user-agent-info';

const details = parse(navigator.userAgent);

console.log(details.browser?.name);
console.log(details.os?.name);
console.log(details.device.type);
```

```ts
import { parseRequest } from 'user-agent-info/server';

app.get('/session', (req, res) => {
  const client = parseRequest({ headers: req.headers });

  res.json({
    browser: client.browser?.name,
    device: client.device.type,
  });
});
```

### Avoid

- variables such as `isModernSupportedChromeOnAndroid` unless the section genuinely needs that exact policy;
- comments that restate each line;
- fictional business rules introduced only to demonstrate several fields at once;
- repeated claims such as “powerful”, “modern”, “production-ready”, or “comprehensive”;
- feature lists embedded in every paragraph;
- sample output that implies exact device or browser identification where the parser may return `null` or `unknown`.

The README should remain technically complete, but the first screen should answer three questions quickly:

1. What does the package do?
2. How do I install it?
3. Which entry point should I use?

## 8. Package and release workflow

### 8.1 Availability gate

Before any repository rename or npm publish:

```bash
npm view user-agent-info name version --json
```

Expected result for an available unscoped name: npm returns `E404`.

The migration stops without publishing if the name exists and is not owned by the maintainer. Search-engine absence alone is not sufficient evidence of availability.

### 8.2 First publication limitation

npm Trusted Publishing cannot be configured for a package that does not yet exist in the npm registry. Therefore the first `user-agent-info@2.0.1` publication requires one authenticated bootstrap publish.

Preferred bootstrap method:

```bash
npm publish --access public
```

Requirements:

- the maintainer is signed in to npm;
- account-level 2FA is enabled;
- the repository has already been renamed and package metadata points to the renamed repository;
- all validation and packed-consumer gates pass immediately before publishing.

A temporary granular token may be used only when an interactive publish is impractical. It must be revoked after Trusted Publishing is confirmed.

### 8.3 Trusted Publisher after bootstrap

After `user-agent-info@2.0.1` exists, configure:

| npm field | Value |
| --- | --- |
| Provider | GitHub Actions |
| Organization or user | `petechatchawan` |
| Repository | `user-agent-info` |
| Workflow filename | `publish.yml` |
| Environment | blank |
| Allowed action | `npm publish` |

The workflow must retain `id-token: write`, use a supported Node/npm combination, verify the registry after publishing, and remain idempotent when the exact version already exists.

### 8.4 Old package deprecation

Deprecation occurs only after the new package is installable and all public entry points have been verified from the npm registry.

Command:

```bash
npm deprecate 'ua-info@*' 'This package has moved to user-agent-info. Install user-agent-info instead.'
```

The old package remains installable for existing lockfiles but receives no further releases.

## 9. Cutover sequence

1. Verify `user-agent-info` is available directly through the npm registry.
2. Create the implementation branch from the latest `master`.
3. Replace package identity and documentation references.
4. Add a repository-wide identity audit that fails on unintended `ua-info` references.
5. Run lint, tests, ESM build, CommonJS build, package verification, and packed consumers on Node 18, 20, and 22.
6. Review the packed tarball and confirm its name and version are `user-agent-info@2.0.1`.
7. Merge the migration PR.
8. Rename the GitHub repository to `petechatchawan/user-agent-info`.
9. Perform the one-time authenticated bootstrap publish of `user-agent-info@2.0.1`.
10. Install the registry package into clean ESM and CommonJS consumer projects.
11. Verify `user-agent-info/server` and `user-agent-info/browser` resolve from the registry tarball.
12. Configure Trusted Publishing for the new package and renamed repository.
13. Run the publish workflow once to prove the OIDC configuration; the workflow should detect that `2.0.1` already exists and complete successfully without republishing.
14. Deprecate all `ua-info` versions.
15. Verify npm displays the deprecation warning and the renamed GitHub repository is canonical.
16. Remove or revoke any temporary npm token used during bootstrap.

## 10. Verification requirements

The migration is complete only when every item below passes.

### Source and documentation

- No unintended `ua-info` install command or import remains.
- Migration text clearly identifies `ua-info` as the former package.
- README badges and links target `user-agent-info`.
- Examples use concise, ordinary names and realistic control flow.

### Package artifact

- Package name is `user-agent-info`.
- Package version is `2.0.1`.
- README and LICENSE are included.
- Tests, source-only fixtures, and removed legacy artifacts are excluded.
- ESM root consumer passes.
- CommonJS root consumer passes.
- Server entry-point consumer passes.
- Browser entry-point consumer passes.
- TypeScript declaration resolution passes.

### Registry and migration

- `user-agent-info@2.0.1` is visible in the public npm registry.
- A clean install resolves the exact package and public entry points.
- npm provenance/repository metadata points to `petechatchawan/user-agent-info` for future OIDC publications.
- `ua-info` shows the migration deprecation message.
- No workflow can accidentally publish another `ua-info` release.

## 11. Failure handling

- If the new name is unavailable, stop before changing repository identity and return to name selection.
- If CI or packed consumers fail, do not merge or publish.
- If bootstrap publication fails, keep `ua-info` active and do not deprecate it.
- If the package publishes but a public entry point fails, do not deprecate `ua-info`; fix the new package with a patch release first.
- If Trusted Publishing cannot be validated, the new package may remain published, but token-based credentials must not become the permanent release path.
- If repository rename fails, do not publish metadata that claims a repository URL that does not exist.

## 12. Rollback boundary

Before `ua-info` is deprecated, rollback means restoring repository/package-source references and postponing the migration.

After `user-agent-info@2.0.1` is published, the new package version cannot be reused or overwritten. Any packaging defect must be corrected with a new patch version.

After `ua-info` is deprecated, it may be temporarily undeprecated only if the new package is unusable and no immediate patch can restore service. This is an emergency measure, not a dual-publishing strategy.

## 13. Completion state

At completion, users see one active package:

```bash
npm install user-agent-info
```

Existing users migrate by changing the dependency and module specifiers. No code-level API migration is required.
